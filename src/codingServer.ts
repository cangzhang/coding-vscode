import * as vscode from 'vscode';
import { nanoid } from 'nanoid';
import got from 'got';

import gotInstance from './common/request';
import { AuthFailResult, AuthSuccessResult, CodingResponse } from './typings/respResult';
import { PromiseAdapter, promiseFromEvent, parseQuery, parseCloneUrl } from './common/utils';
import { GitService } from './common/gitService';
import { RepoInfo, SessionData, TokenType } from './typings/commonTypes';
import { keychain } from './common/keychain';
import Logger from './common/logger';

const AUTH_SERVER = `https://x5p7m.csb.app`;
const ClientId = `ff768664c96d04235b1cc4af1e3b37a8`;
const ClientSecret = `d29ebb32cab8b5f0a643b5da7dcad8d1469312c7`;

export const ScopeList = [
  `user`,
  `user:email`,
  `project`,
  `project:depot`,
];
const SCOPES = ScopeList.join(`,`);
const NETWORK_ERROR = 'network error';

class UriEventHandler extends vscode.EventEmitter<vscode.Uri> implements vscode.UriHandler {
  public handleUri(uri: vscode.Uri) {
    this.fire(uri);
  }
}

export const uriHandler = new UriEventHandler;

const onDidManuallyProvideToken = new vscode.EventEmitter<string>();

export class CodingServer {
  private _pendingStates = new Map<string, string[]>();
  private _codeExchangePromises = new Map<string, Promise<AuthSuccessResult>>();

  private _loggedIn: boolean = false;
  private _context: vscode.ExtensionContext;
  private _session: SessionData | null = null;

  constructor(context: vscode.ExtensionContext) {
    this._context = context;
  }

  public async initialize(): Promise<void> {
    try {
      this._session = await this._readSessions();
    } catch (e) {
      // Ignore, network request failed
    }
  }

  private async _readSessions(): Promise<SessionData | null> {
    const [accessToken, refreshToken] = await Promise.all([
      keychain.getToken(TokenType.AccessToken),
      keychain.getToken(TokenType.RefreshToken),
    ]);
    if (accessToken && refreshToken) {
      try {
        const session = await this.getSessionData(accessToken as TokenType.AccessToken, refreshToken as TokenType.RefreshToken);
        return session;
      } catch (e) {
        if (e === NETWORK_ERROR) {
          return null;
        }

        Logger.error(`Error reading sessions: ${e}`);
        await keychain.deleteToken(TokenType.AccessToken);
      }
    }

    return null;
  }

  public async getSessionData(accessToken: TokenType.AccessToken, refreshToken: TokenType.RefreshToken): Promise<SessionData> {
    try {
      const repoInfo = this._context.workspaceState.get(`repoInfo`) as RepoInfo;
      if (!repoInfo?.team) {
        throw new Error(`team not exist`);
      }

      const result = await this.getUserInfo(repoInfo.team || ``, accessToken);
      const { data: userInfo } = result;
      const ret: SessionData = {
        id: nanoid(),
        user: userInfo,
        accessToken,
        refreshToken,
      };

      vscode.window.showInformationMessage(`Logged in as ${userInfo.name} @ ${userInfo.team}`);
      return ret;
    } catch (err) {
      console.error(err);
      throw new Error(err);
    }
  }

  public async startOAuth(team: string, scopes: string) {
    const state = nanoid();
    const { name, publisher } = require('../package.json');
    const callbackUri = await vscode.env.asExternalUri(vscode.Uri.parse(`${vscode.env.uriScheme}://${publisher}.${name}/on-did-authenticate`));

    const existingStates = this._pendingStates.get(scopes) || [];
    this._pendingStates.set(scopes, [...existingStates, state]);

    const uri = vscode.Uri.parse(`${AUTH_SERVER}?callbackUri=${encodeURIComponent(callbackUri.toString())}&scope=${scopes}&state=${state}&responseType=code&team=${team}`);
    await vscode.env.openExternal(uri);

    let existingPromise = this._codeExchangePromises.get(scopes);
    if (!existingPromise) {
      existingPromise = promiseFromEvent(uriHandler.event, this._exchangeCodeForToken(team, scopes));
      this._codeExchangePromises.set(scopes, existingPromise);
    }

    return Promise.race([
      existingPromise,
      // promiseFromEvent<string, string>(onDidManuallyProvideToken.event)
    ]).finally(() => {
      this._pendingStates.delete(scopes);
      this._codeExchangePromises.delete(scopes);
    });
  }

  public async login(team: string, scopes: string = SCOPES): Promise<SessionData | null> {
    const { access_token: accessToken, refresh_token: refreshToken } = await this.startOAuth(team, scopes);
    if (accessToken && refreshToken) {
      try {
        const session = await this.getSessionData(accessToken, refreshToken);
        this._session = session;
        await Promise.all([
          keychain.setToken(accessToken, TokenType.AccessToken),
          keychain.setToken(refreshToken, TokenType.RefreshToken),
        ]);
        return session;
      } catch (e) {
        throw new Error(e);
      }
    }

    return null;
  }

  private _exchangeCodeForToken: (team: string, scopes: string) => PromiseAdapter<vscode.Uri, AuthSuccessResult> = (team, scopes) => async (uri, resolve, reject) => {
    const query = parseQuery(uri);
    const { code } = query;

    // const acceptedStates = this._pendingStates.get(scopes) || [];
    // if (!acceptedStates.includes(query.state)) {
    //   console.error(`Received mismatched state`);
    //   reject({});
    //   return;
    // }

    try {
      const result = await got.post(
        `https://${team}.coding.net/api/oauth/access_token`,
        {
          searchParams: {
            code,
            client_id: ClientId,
            client_secret: ClientSecret,
            grant_type: `authorization_code`,
          },
        },
      ).json();

      if ((result as AuthFailResult).code) {
        this._loggedIn = false;
        reject({} as AuthSuccessResult);
      } else {
        resolve(result as AuthSuccessResult);
      }
    } catch (err) {
      reject(err);
    }
  };

  public async getUserInfo(team: string, token: string = this._session?.accessToken || ``) {
    try {
      const result: CodingResponse = await gotInstance.get(`https://${team}.coding.net/api/current_user`, {
        searchParams: {
          access_token: token,
        },
      }).json();

      if (result.code || result.data.team !== team) {
        console.error(result.msg);
        this._loggedIn = false;
        vscode.commands.executeCommand('setContext', 'loggedIn', this._loggedIn);
        return Promise.reject(result.msg);
      }

      this._loggedIn = true;
      vscode.commands.executeCommand('setContext', 'loggedIn', this._loggedIn);
      return result;
    } catch (err) {
      throw Error(err);
    }
  }

  public static async getRepoParams() {
    const urls = await GitService.getRemoteURLs();
    // TODO: multiple working repos
    const url = urls?.[0];
    return parseCloneUrl(url || ``);
  }

  public async getMRList(repo?: string, status?: string): Promise<CodingResponse> {
    try {
      const repoInfo = this._context.workspaceState.get(`repoInfo`) as RepoInfo;
      if (!repoInfo?.team) {
        throw new Error(`team not exist`);
      }

      const result: CodingResponse = await got.get(`https://${repoInfo.team}.coding.net/api/user/${repoInfo.team}/project/${repoInfo.project}/depot/${repo || repoInfo.repo}/git/merges/query`, {
        searchParams: {
          status,
          sort: `action_at`,
          page: 1,
          PageSize: 9999,
          sortDirection: `DESC`,
          access_token: this._session?.accessToken,
        },
      }).json();
      return result;
    } catch (err) {
      return Promise.reject(err);
    }
  }

  get loggedIn() {
    return this._loggedIn;
  }

  get session() {
    return this._session;
  }

  public async logout() {
    try {
      await Promise.all([
        keychain.deleteToken(TokenType.AccessToken),
        keychain.deleteToken(TokenType.RefreshToken),
      ]);
      this._session = null;
      vscode.commands.executeCommand('setContext', 'loggedIn', false);
      return true;
    } catch (e) {
      throw Error(e);
    }
  }
}

