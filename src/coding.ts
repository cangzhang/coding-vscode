import * as vscode from 'vscode';
import { nanoid } from 'nanoid';

import { keychain } from './common/keychain';
import Logger from './common/logger'
import { CodingServer } from './codingServer';
import { RepoInfo } from './typings/types';

interface SessionData {
  id: string;
  account?: {
    label?: string;
    displayName?: string;
    id: string;
  }
  scopes: string[];
  accessToken: string;
}

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
  private _sessions: vscode.AuthenticationSession[] = [];
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
      this._sessions = await this._readSessions();
    } catch (e) {
      // Ignore, network request failed
    }

    context.subscriptions.push(vscode.authentication.onDidChangePassword(() => this._checkForUpdates()));
  }

  private async _checkForUpdates() {
    let storedSessions: vscode.AuthenticationSession[];
    try {
      storedSessions = await this._readSessions();
    } catch (e) {
      // Ignore, network request failed
      return;
    }

    const added: string[] = [];
    const removed: string[] = [];

    storedSessions.forEach(session => {
      const matchesExisting = this._sessions.some(s => s.id === session.id);
      // Another window added a session to the keychain, add it to our state as well
      if (!matchesExisting) {
        Logger.info('Adding session found in keychain');
        this._sessions.push(session);
        added.push(session.id);
      }
    });

    this._sessions.map(session => {
      const matchesExisting = storedSessions.some(s => s.id === session.id);
      // Another window has logged out, remove from our state
      if (!matchesExisting) {
        Logger.info('Removing session no longer found in keychain');
        const sessionIndex = this._sessions.findIndex(s => s.id === session.id);
        if (sessionIndex > -1) {
          this._sessions.splice(sessionIndex, 1);
        }

        removed.push(session.id);
      }
    });

    if (added.length || removed.length) {
      onDidChangeSessions.fire({ added, removed, changed: [] });
    }
  }

  private async _readSessions(): Promise<vscode.AuthenticationSession[]> {
    const storedSessions = await keychain.getToken() || await keychain.tryMigrate();
    if (storedSessions) {
      try {
        const sessionData: SessionData[] = JSON.parse(storedSessions);
        const sessionPromises = sessionData.map(async (session: SessionData): Promise<vscode.AuthenticationSession> => {
          const needsUserInfo = !session.account;
          let userInfo: { id: string, accountName: string };
          if (needsUserInfo) {
            userInfo = await this._codingServer.getUserInfo(this._repo.team, session.accessToken);
          }

          return {
            id: session.id,
            account: {
              label: session.account
                ? session.account.label || session.account.displayName!
                : userInfo!.accountName,
              id: session.account?.id ?? userInfo!.id
            },
            scopes: session.scopes,
            accessToken: session.accessToken
          };
        });

        return Promise.all(sessionPromises);
      } catch (e) {
        if (e === NETWORK_ERROR) {
          return [];
        }

        Logger.error(`Error reading sessions: ${e}`);
        await keychain.deleteToken();
      }
    }

    return [];
  }

  private async _tokenToSession(token: string, scopes: string[]): Promise<vscode.AuthenticationSession> {
    const userInfo = await this._codingServer.getUserInfo(this._repo.team, token);

    return {
      id: nanoid(),
      accessToken: token,
      account: {
        label: userInfo.name,
        id: userInfo.global_key,
      },
      scopes,
    };
  }

  public async login(team: string, scopes: string = SCOPES): Promise<vscode.AuthenticationSession> {
    const { access_token: token } = await this._codingServer.login(team, scopes);
    const session = await this._tokenToSession(token, scopes.split(' '));
    await this._setToken(session);
    return session;
  }

  private async _storeSessions(): Promise<void> {
    await keychain.setToken(JSON.stringify(this._sessions));
  }

  private async _setToken(session: vscode.AuthenticationSession): Promise<void> {
    const sessionIndex = this._sessions.findIndex(s => s.id === session.id);
    if (sessionIndex > -1) {
      this._sessions.splice(sessionIndex, 1, session);
    } else {
      this._sessions.push(session);
    }

    await this._storeSessions();
  }

  // @ts-ignore
  get sessions(): vscode.AuthenticationSession[] {
    return this._sessions;
  }

  public async logout(id: string) {
    const sessionIndex = this._sessions.findIndex(session => session.id === id);
    if (sessionIndex > -1) {
      this._sessions.splice(sessionIndex, 1);
    }

    await this._storeSessions();
  }
}
