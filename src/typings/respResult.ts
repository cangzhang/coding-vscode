import { TokenType } from './commonTypes';

export interface AuthSuccessResult {
  access_token: TokenType.AccessToken;
  refresh_token: TokenType.RefreshToken;
  team: string;
  token_type: string;
  expires_in: string;
}

export interface AuthFailResult {
  code: number;
  msg: {
    [key: string]: string;
  }
}

export interface UserResponse {
  avatar: string;
  global_key: string;
  name: string;
  path: string;
  team: string;
}

export interface IMRData {
  id: number;
  iid: number;
  title: string;
}

export interface CodingResponse {
  code: number,
  data?: any,
  msg?: string
}

export interface IRepoItem {
  id: number;
  name: string;
  vcsType: 'git';
  depotPath: string;
  gitHttpsUrl: string;
  gitSshUrl: string;
}

export interface IRepoListResponse extends CodingResponse {
  data: IRepoItem[];
}

export interface IMRPathItem {
  changeType: string;
  insertions: number;
  deletions: number;
  name: string;
  path: string;
  size: number;
  mode: number;
  objectId: string;
  commitId: string;
}

export interface IMRDiffStat {
  commitId: string;
  oldSha: string;
  newSha: string;
  insertions: number;
  deletions: number;
  paths: IMRPathItem[];
}

export interface IMRDiffResponse extends CodingResponse {
  data: {
    isLarge: boolean;
    diffStat: IMRDiffStat;
  }
}

export interface IMRDetail {
  merged_sha: string;
  body: string;
  body_plan: string;
  source_sha: string;
  target_sha: string;
  base_sha: string;
  id: number;
  srcBranch: string;
  desBranch: string;
  title: string;
  iid: number;
  merge_status: string;
  path: string;
  created_at: number;
  updated_at: number;
  action_at: number;
  granted: string;
  comment_count: string;
  reminded: string;
  author: {
    avatar: string;
    name: string;
    global_key: string;
  };
  action_author: {
    avatar: string;
    name: string;
    global_key: string;
  };
  depot: {
    id: number;
    name: string;
    isDefault: boolean;
    projectId: number;
    vcsType: string;
  };
}

export interface IMRDetailResponse extends CodingResponse {
  data: {
    merge_request: IMRDetail;
    can_merge: boolean;
  }
}
