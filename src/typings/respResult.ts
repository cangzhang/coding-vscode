import { TokenType, GitChangeType } from './commonTypes';

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
  };
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
  merge_status: string;
  path: string;
  author: UserResponse;
  action_author: UserResponse;
  created_at: number;
  updated_at: number;
}

export interface CodingResponse {
  code: number;
  data?: any;
  msg?: string;
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
  changeType: GitChangeType;
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
  };
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
  };
}

export interface ICreateMRBody {
  srcBranch: string;
  desBranch: string;
  title: string;
  content: string;
  reviewers?: string;
  labels?: string;
  watchers?: string;
}

export interface ICreateMRResp extends CodingResponse {
  can_edit: boolean;
  can_edit_src_branch: boolean;
  merge_request: IMRDetail;
}

export interface IBranchItem {
  commitTime: number;
  deny_force_push: boolean;
  force_squash: boolean;
  is_default_branch: boolean;
  is_protected: boolean;
  name: string;
  sha: string;
  status_check: boolean;
}

export interface IBranchListResp extends CodingResponse {
  data: IBranchItem[];
}
