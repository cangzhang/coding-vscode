import * as vscode from 'vscode';
import { nanoid } from 'nanoid';
import got from 'got';

import {
  AuthFailResult,
  AuthSuccessResult,
  CodingResponse,
  IRepoListResponse,
  IMRDiffResponse,
  IMRDetailResponse,
  IMRActivitiesResponse,
  IMRReviewersResponse,
  ICreateMRBody,
  ICreateMRResp,
  IBranchListResp,
  IMemberListResp,
  IMRContentResp,
  ICreateCommentResp,
  IMRStatusResp,
} from 'src/typings/respResult';
import { PromiseAdapter, promiseFromEvent, parseQuery, parseCloneUrl } from 'src/common/utils';
import { GitService } from 'src/common/gitService';
import { IRepoInfo, ISessionData, TokenType } from 'src/typings/commonTypes';
import { keychain } from 'src/common/keychain';
import Logger from 'src/common/logger';

const AUTH_SERVER = `https://x5p7m.csb.app`;
const ClientId = `ff768664c96d04235b1cc4af1e3b37a8`;
const ClientSecret = `d29ebb32cab8b5f0a643b5da7dcad8d1469312c7`;

export const ScopeList = [`user`, `user:email`, `project`, `project:depot`, `project:members`];
const SCOPES = ScopeList.join(`,`);
const NETWORK_ERROR = 'network error';

class UriEventHandler extends vscode.EventEmitter<vscode.Uri> implements vscode.UriHandler {
  public handleUri(uri: vscode.Uri) {
    this.fire(uri);
  }
}

export const uriHandler = new UriEventHandler();

const onDidManuallyProvideToken = new vscode.EventEmitter<string>();

export class CodingServer {
  private _pendingStates = new Map<string, string[]>();
  private _codeExchangePromises = new Map<string, Promise<AuthSuccessResult>>();

  private _loggedIn = false;
  private _context: vscode.ExtensionContext;
  private _session: ISessionData | null = null;

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

  private async _readSessions(): Promise<ISessionData | null> {
    const [accessToken, refreshToken] = await Promise.all([
      keychain.getToken(TokenType.AccessToken),
      keychain.getToken(TokenType.RefreshToken),
    ]);
    if (accessToken && refreshToken) {
      try {
        const session = await this.getSessionData(
          accessToken as TokenType.AccessToken,
          refreshToken as TokenType.RefreshToken,
        );
        return session;
      } catch (e) {
        if (e === NETWORK_ERROR) {
          return null;
        }

        Logger.error(`Error reading sessions: ${e}`);
        // await keychain.deleteToken(TokenType.AccessToken);
      }
    }

    return null;
  }

  public async getSessionData(
    accessToken: TokenType.AccessToken,
    refreshToken: TokenType.RefreshToken,
  ): Promise<ISessionData> {
    try {
      const repoInfo = this._context.workspaceState.get(`repoInfo`, {}) as IRepoInfo;
      await vscode.commands.executeCommand('setContext', 'hasRepo', !!repoInfo?.repo);
      const result = await this.getUserInfo(repoInfo?.team || ``, accessToken);
      const { data: userInfo } = result;

      if (userInfo.team !== repoInfo?.team) {
        this._loggedIn = false;
        await vscode.commands.executeCommand('setContext', 'loggedIn', this._loggedIn);
        throw new Error(`team not match`);
      }

      const ret: ISessionData = {
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
    const callbackUri = await vscode.env.asExternalUri(
      vscode.Uri.parse(`${vscode.env.uriScheme}://${publisher}.${name}/on-did-authenticate`),
    );

    const existingStates = this._pendingStates.get(scopes) || [];
    this._pendingStates.set(scopes, [...existingStates, state]);

    const uri = vscode.Uri.parse(
      `${AUTH_SERVER}?callbackUri=${encodeURIComponent(
        callbackUri.toString(),
      )}&scope=${scopes}&state=${state}&responseType=code&team=${team}`,
    );
    await vscode.env.openExternal(uri);

    let existingPromise = this._codeExchangePromises.get(scopes);
    if (!existingPromise) {
      existingPromise = promiseFromEvent(
        uriHandler.event,
        this._exchangeCodeForToken(team, scopes),
      );
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

  public async login(team: string, scopes: string = SCOPES): Promise<ISessionData | null> {
    const { access_token: accessToken, refresh_token: refreshToken } = await this.startOAuth(
      team,
      scopes,
    );
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

  private _exchangeCodeForToken: (
    team: string,
    scopes: string,
  ) => PromiseAdapter<vscode.Uri, AuthSuccessResult> = (team, scopes) => async (
    uri,
    resolve,
    reject,
  ) => {
    const query = parseQuery(uri);
    const { code } = query;

    // const acceptedStates = this._pendingStates.get(scopes) || [];
    // if (!acceptedStates.includes(query.state)) {
    //   console.error(`Received mismatched state`);
    //   reject({});
    //   return;
    // }

    try {
      const result = await got
        .post(`https://${team}.coding.net/api/oauth/access_token`, {
          searchParams: {
            code,
            client_id: ClientId,
            client_secret: ClientSecret,
            grant_type: `authorization_code`,
          },
        })
        .json();

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
      const result: CodingResponse = await got
        .get(`https://${team || `codingcorp`}.coding.net/api/current_user`, {
          searchParams: {
            access_token: token,
          },
        })
        .json();

      if (result.code) {
        console.error(result.msg);
        this._loggedIn = false;
        await vscode.commands.executeCommand('setContext', 'loggedIn', this._loggedIn);
        return Promise.reject(result.msg);
      }

      this._loggedIn = true;
      await vscode.commands.executeCommand('setContext', 'loggedIn', this._loggedIn);
      return result;
    } catch (err) {
      throw Error(err);
    }
  }

  public static async getRepoParams() {
    const urls = await GitService.getRemoteURLs();
    const result = urls?.map((i) => parseCloneUrl(i || ``));
    return result?.[0];
  }

  public async getApiPrefix() {
    const repoInfo = this._context.workspaceState.get(`repoInfo`) as IRepoInfo;
    const hasRepo = !!repoInfo?.repo;
    await vscode.commands.executeCommand('setContext', 'hasRepo', hasRepo);

    if (!hasRepo) {
      throw new Error(`team not exist`);
    }

    const projectApiPrefix = `https://${repoInfo.team}.coding.net/api/user/${this._session?.user?.team}/project/${repoInfo.project}`;
    return {
      projectApiPrefix,
      repoApiPrefix: `${projectApiPrefix}/depot/${repoInfo.repo}/git`,
      userApiPrefix: `https://${repoInfo.team}.coding.net/api/user/${this._session?.user?.global_key}`,
      rawFilePrefix: `https://${repoInfo.team}.coding.net/p/${repoInfo.project}/d/${repoInfo.repo}/git/raw`,
    };
  }

  public async getMRList(repo?: string, status?: string): Promise<CodingResponse> {
    try {
      const { repoApiPrefix } = await this.getApiPrefix();
      const result: CodingResponse = await got
        .get(`${repoApiPrefix}/merges/query`, {
          searchParams: {
            status,
            sort: `action_at`,
            page: 1,
            PageSize: 9999,
            sortDirection: `DESC`,
            access_token: this._session?.accessToken,
          },
        })
        .json();
      return result;
    } catch (err) {
      return Promise.reject(err);
    }
  }

  public async getRepoList() {
    try {
      const { userApiPrefix } = await this.getApiPrefix();
      const { code, data, msg }: IRepoListResponse = await got
        .get(`${userApiPrefix}/depots`, {
          searchParams: {
            access_token: this._session?.accessToken,
          },
        })
        .json();
      if (code) {
        return Promise.reject({ code, msg });
      }

      return {
        code,
        data: data.filter((i) => i.vcsType === `git`),
      };
    } catch (err) {
      return Promise.reject(err);
    }
  }

  public async getMRDiff(iid: number) {
    try {
      const { repoApiPrefix } = await this.getApiPrefix();
      const diff: IMRDiffResponse = await got
        .get(`${repoApiPrefix}/merge/${iid}/diff`, {
          searchParams: {
            access_token: this._session?.accessToken,
          },
        })
        .json();
      if (diff.code) {
        return Promise.reject(diff);
      }
      return diff;
    } catch (err) {
      return Promise.reject(err);
    }
  }

  public async getMRDetail(iid: string) {
    try {
      const { repoApiPrefix } = await this.getApiPrefix();
      const resp: IMRDetailResponse = await got
        .get(`${repoApiPrefix}/merge/${iid}/detail`, {
          searchParams: {
            access_token: this._session?.accessToken,
          },
        })
        .json();

      if (resp.code) {
        return Promise.reject(resp);
      }

      return resp;
    } catch (err) {
      return Promise.reject(err);
    }
  }

  public async getMRActivities(iid: string) {
    try {
      const { repoApiPrefix } = await this.getApiPrefix();
      const result: IMRActivitiesResponse = await got
        .get(`${repoApiPrefix}/merge/${iid}/activities`, {
          searchParams: {
            access_token: this._session?.accessToken,
          },
        })
        .json();

      if (result.code) {
        return Promise.reject(result);
      }
      return result;
    } catch (err) {
      return Promise.reject(err);
    }
  }

  public async getMRReviewers(iid: string) {
    try {
      const { repoApiPrefix } = await this.getApiPrefix();
      const result: IMRReviewersResponse = await got
        .get(`${repoApiPrefix}/merge/${iid}/reviewers`, {
          searchParams: {
            access_token: this._session?.accessToken,
          },
        })
        .json();

      if (result.code) {
        return Promise.reject(result);
      }
      return result;
    } catch (err) {
      return Promise.reject(err);
    }
  }

  public async getMRComments(iid: string) {
    try {
      const { repoApiPrefix } = await this.getApiPrefix();
      const result: CodingResponse = await got
        .get(`${repoApiPrefix}/merge/${iid}/comments`, {
          searchParams: {
            access_token: this._session?.accessToken,
          },
        })
        .json();

      if (result.code) {
        return Promise.reject(result);
      }
      return result;
    } catch (err) {
      return Promise.reject(err);
    }
  }

  public async closeMR(iid: string) {
    try {
      const { repoApiPrefix } = await this.getApiPrefix();
      const result: CodingResponse = await got
        .post(`${repoApiPrefix}/merge/${iid}/refuse`, {
          searchParams: {
            access_token: this._session?.accessToken,
          },
        })
        .json();

      if (result.code) {
        return Promise.reject(result);
      }
      return result;
    } catch (err) {
      return Promise.reject(err);
    }
  }

  public async approveMR(iid: string) {
    try {
      const { repoApiPrefix } = await this.getApiPrefix();
      const result: CodingResponse = await got
        .post(`${repoApiPrefix}/merge/${iid}/good`, {
          searchParams: {
            access_token: this._session?.accessToken,
          },
        })
        .json();

      if (result.code) {
        return Promise.reject(result);
      }
      return result;
    } catch (err) {
      return Promise.reject(err);
    }
  }

  public async disapproveMR(iid: string) {
    try {
      const { repoApiPrefix } = await this.getApiPrefix();
      const result: CodingResponse = await got
        .delete(`${repoApiPrefix}/merge/${iid}/good`, {
          searchParams: {
            access_token: this._session?.accessToken,
          },
        })
        .json();

      if (result.code) {
        return Promise.reject(result);
      }
      return result;
    } catch (err) {
      return Promise.reject(err);
    }
  }

  public async mergeMR(iid: string) {
    try {
      const { repoApiPrefix } = await this.getApiPrefix();
      const result: CodingResponse = await got
        .post(`${repoApiPrefix}/merge/${iid}/merge`, {
          searchParams: {
            access_token: this._session?.accessToken,
          },
          headers: {
            'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
          },
        })
        .json();

      if (result.code) {
        return Promise.reject(result);
      }
      return result;
    } catch (err) {
      return Promise.reject(err);
    }
  }

  public async updateMRTitle(iid: string, title: string) {
    try {
      const { repoApiPrefix } = await this.getApiPrefix();
      const result: CodingResponse = await got
        .put(`${repoApiPrefix}/merge/${iid}/update-title`, {
          searchParams: {
            access_token: this._session?.accessToken,
            title,
          },
          headers: {
            'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
          },
        })
        .json();

      if (result.code) {
        return Promise.reject(result);
      }
      return result;
    } catch (err) {
      return Promise.reject(err);
    }
  }

  public async commentMR(mrId: number, comment: string) {
    try {
      const { repoApiPrefix } = await this.getApiPrefix();
      const result: ICreateCommentResp = await got
        .post(`${repoApiPrefix}/line_notes`, {
          searchParams: {
            access_token: this._session?.accessToken,
            line: 0,
            change_type: 0,
            position: 0,
            content: comment,
            noteable_type: 'MergeRequestBean',
            noteable_id: mrId,
            parent_id: 0,
          },
          headers: {
            'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
          },
        })
        .json();

      if (result.code) {
        return Promise.reject(result);
      }
      return result;
    } catch (err) {
      return Promise.reject(err);
    }
  }

  public async getRemoteFileContent(path: string) {
    try {
      const { rawFilePrefix } = await this.getApiPrefix();
      const url = `${rawFilePrefix}/${path}`;
      const { body } = await got.get(url, {
        searchParams: {
          access_token: this._session?.accessToken,
        },
      });

      return body;
    } catch (err) {
      return ``;
    }
  }

  public async createMR(data: ICreateMRBody) {
    try {
      const { repoApiPrefix } = await this.getApiPrefix();
      const resp: ICreateMRResp = await got.post(`${repoApiPrefix}/merge`, {
        resolveBodyOnly: true,
        responseType: `json`,
        searchParams: {
          access_token: this._session?.accessToken,
        },
        form: data,
      });
      if (resp.code) {
        return Promise.reject(resp);
      }
      return resp;
    } catch (err) {
      return Promise.reject(err);
    }
  }

  public async getBranchList() {
    try {
      const { repoApiPrefix } = await this.getApiPrefix();
      const resp: IBranchListResp = await got
        .get(`${repoApiPrefix}/list_branches`, {
          searchParams: {
            access_token: this._session?.accessToken,
          },
        })
        .json();
      if (resp.code) {
        return Promise.reject(resp);
      }
      return resp;
    } catch (err) {
      return Promise.reject(err);
    }
  }

  public async getProjectMembers() {
    try {
      const { projectApiPrefix } = await this.getApiPrefix();
      const resp: IMemberListResp = await got
        .get(`${projectApiPrefix}/members`, {
          searchParams: {
            pageSize: 9999,
            access_token: this._session?.accessToken,
          },
        })
        .json();

      if (resp.code) {
        return Promise.reject(resp);
      }

      return resp;
    } catch (err) {
      return Promise.reject(err);
    }
  }

  public async addMRReviewers(iid: string, ids: number[]): Promise<number[]> {
    const { repoApiPrefix } = await this.getApiPrefix();
    const tasks: Promise<CodingResponse>[] = ids.map((id) => {
      return got
        .post(`${repoApiPrefix}/merge/${iid}/reviewers`, {
          searchParams: {
            user_id: id,
            access_token: this._session?.accessToken,
          },
        })
        .json();
    });
    const result: PromiseSettledResult<CodingResponse>[] = await Promise.allSettled(tasks);
    const fulfilled = ids.reduce((res, cur, idx) => {
      if (result[idx].status === `fulfilled`) {
        res = res.concat(cur);
      }

      return res;
    }, [] as number[]);
    return fulfilled;
  }

  public async removeMRReviewers(iid: string, ids: number[]): Promise<number[]> {
    const { repoApiPrefix } = await this.getApiPrefix();
    const tasks: Promise<CodingResponse>[] = ids.map((id) => {
      return got
        .delete(`${repoApiPrefix}/merge/${iid}/reviewers`, {
          searchParams: {
            user_id: id,
            access_token: this._session?.accessToken,
          },
        })
        .json();
    });
    const result: PromiseSettledResult<CodingResponse>[] = await Promise.allSettled(tasks);
    const fulfilled = ids.reduce((res, cur, idx) => {
      if (result[idx].status === `fulfilled`) {
        res = res.concat(cur);
      }

      return res;
    }, [] as number[]);
    return fulfilled;
  }

  public async updateMRDesc(iid: string, content: string) {
    try {
      const { repoApiPrefix } = await this.getApiPrefix();
      const resp: IMRContentResp = await got
        .put(`${repoApiPrefix}/merge/${iid}/update-content`, {
          form: {
            content,
          },
          searchParams: {
            access_token: this._session?.accessToken,
          },
        })
        .json();

      if (resp.code) {
        return Promise.reject(resp);
      }

      return resp;
    } catch (e) {
      return Promise.reject(e);
    }
  }

  public async fetchMRStatus(iid: string) {
    try {
      const { repoApiPrefix } = await this.getApiPrefix();
      const resp: IMRStatusResp = await got
        .get(`${repoApiPrefix}/merge/${iid}/commit-statuses`, {
          searchParams: {
            access_token: this._session?.accessToken,
          },
        })
        .json();

      if (resp.code) {
        return Promise.reject(resp);
      }

      return resp;
    } catch (e) {
      return Promise.reject(e);
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
      await vscode.commands.executeCommand('setContext', 'loggedIn', false);
      return true;
    } catch (e) {
      throw Error(e);
    }
  }
}
