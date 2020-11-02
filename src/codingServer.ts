import * as vscode from 'vscode';
import { nanoid } from 'nanoid';
import got from 'got';

import { AuthFailResult, AuthSuccessResult, UserResponse } from './typings/respResult';
import { PromiseAdapter, promiseFromEvent, parseQuery, parseCloneUrl } from './common/utils';
import { GitService } from './common/gitService';
import { RepoInfo, SessionData } from './typings/commonTypes';

const AUTH_SERVER = `http://127.0.0.1:5000`;
const ClientId = `ff768664c96d04235b1cc4af1e3b37a8`;
const ClientSecret = `d29ebb32cab8b5f0a643b5da7dcad8d1469312c7`;

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
  private _session: SessionData = {} as SessionData;
  private _repo: RepoInfo = {
    team: ``,
    project: ``,
    repo: ``,
  };
  private _loggedIn: boolean = false;

  constructor(session?: SessionData | null, repo?: RepoInfo | null) {
    if (session) {
      this._session = session;
      this._loggedIn = true;
    }
    if (repo) {
      this._repo = repo;
    }
  }

  public async login(team: string, scopes: string) {
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

  private _exchangeCodeForToken: (team: string, scopes: string) => PromiseAdapter<vscode.Uri, AuthSuccessResult> = (team, scopes) => async (uri, resolve, reject) => {
    const query = parseQuery(uri);
    const { code } = query;

    const acceptedStates = this._pendingStates.get(scopes) || [];
    if (!acceptedStates.includes(query.state)) {
      console.error(`Received mismatched state`);
      reject({});
      return;
    }

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

  public async getUserInfo(team: string, token: string = this._session?.accessToken) {
    try {
      const result: UserResponse = await got.get(`https://${team}.coding.net/api/current_user`, {
        searchParams: {
          access_token: token,
        },
      }).json();
      return result;
    } catch (err) {
      return err;
    }
  }

  public static async getRepoParams() {
    const gitSrv = await GitService.getBuiltInGitApi();
    // TODO: multiple working repos
    const repoInstance = gitSrv?.repositories[0];

    if (!repoInstance) {
      return null;
    }

    const cloneUrl = await repoInstance.getConfig(`remote.origin.url`);
    return parseCloneUrl(cloneUrl);
  }

  public async getMRList(
    team: string = this._repo.team,
    project: string = this._repo.project,
    repo: string = this._repo.repo,
  ) {
    try {
      const result = await got.get(`https://${team}.coding.net/api/user/${team}/project/${project}/depot/${repo}/git/merges/query`, {
        searchParams: {
          status: `all`,
          sort: `action_at`,
          page: 1,
          PageSize: 20,
          sortDirection: `DESC`,
          access_token: this._session.accessToken,
        },
      }).json();

      return result;
    } catch (err) {
      return err;
    }
  }

  get loggedIn() {
    return this._loggedIn;
  }

  get session() {
    return this._session;
  }
}

