import { IMRDetail, IMRStatusItem, IUserItem } from './respResult';

export interface IRepoInfo {
  team: string;
  project: string;
  repo: string;
}

export enum TokenType {
  AccessToken = `accessToken`,
  RefreshToken = `refreshToken`,
}

export interface ISessionData {
  id: string;
  user: IUserItem | null;
  accessToken: string;
  refreshToken: string;
}

export enum GitChangeType {
  ADD = `ADD`,
  COPY = `COPY`,
  DELETE = `DELETE`,
  MODIFY = `MODIFY`,
  RENAME = `RENAME`,
  TYPE = `TYPE`,
  UNKNOWN = `UNKNOWN`,
  UNMERGED = `UNMERGED`,
}

export interface IMRWebViewDetail {
  type: string;
  iid: string;
  accessToken: string;
  repoInfo: IRepoInfo;
  data: IMRDetail & {
    loading: boolean;
    editingDesc: boolean;
    commit_statuses: IMRStatusItem[];
  };
  user: IUserItem;
}
