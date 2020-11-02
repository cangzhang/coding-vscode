import * as vscode from 'vscode';
import { nanoid } from 'nanoid';

import { keychain } from './common/keychain';
import Logger from './common/logger';
import { CodingServer } from './codingServer';
import { RepoInfo, SessionData, TokenType } from './typings/commonTypes';

export const ScopeList = [
  `user`,
  `user:email`,
  `project`,
  `project:depot`,
];
const SCOPES = ScopeList.join(`,`);
const NETWORK_ERROR = 'network error';

export const onDidChangeSessions = new vscode.EventEmitter<vscode.AuthenticationProviderAuthenticationSessionsChangeEvent>();

export class CodingAuthenticationProvider {
  private _session: SessionData | null = null;
  private _codingServer = new CodingServer();
  private _repo: RepoInfo = {
    team: ``,
    project: ``,
    repo: ``,
  };

  public constructor(repo: RepoInfo | null) {
    if (repo) {
      this._repo = repo;
    }
  }

  public async initialize(context: vscode.ExtensionContext): Promise<void> {
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

  public async getSessionData(accessToken: TokenType.AccessToken, refreshToken: TokenType.RefreshToken): Promise<SessionData | null> {
    try {
      const { data: userInfo } = await this._codingServer.getUserInfo(this._repo.team, accessToken);
      const ret: SessionData = {
        id: nanoid(),
        user: userInfo,
        accessToken,
        refreshToken,
      };

      vscode.window.showInformationMessage(`USER ${userInfo.name} @ TEAM ${userInfo.team}`);
      return ret;
    } catch (err) {
      return null;
    }
  }

  public async login(team: string, scopes: string = SCOPES): Promise<SessionData | null> {
    const { access_token: accessToken, refresh_token: refreshToken } = await this._codingServer.login(team, scopes);
    if (accessToken && refreshToken) {
      const session = await this.getSessionData(accessToken, refreshToken);
      await Promise.all([
        keychain.setToken(accessToken, TokenType.AccessToken),
        keychain.setToken(refreshToken, TokenType.RefreshToken),
      ]);
      return session;
    }

    return null;
  }

  get session() {
    return this._session;
  }
}
