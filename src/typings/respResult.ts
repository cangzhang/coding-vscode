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

export interface IUserItem {
  id: number;
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
  author: IUserItem;
  action_author: IUserItem;
  created_at: number;
  updated_at: number;
}

export interface CodingResponse {
  code: number;
  data?: any;
  msg?: string;
}

export interface IListResponse<T> extends CodingResponse {
  data: {
    list: T[];
    page: number;
    pageSize: number;
    totalPage: number;
    totalRow: number;
  };
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

export interface IMRDetailMR {
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
    id: number;
    avatar: string;
    name: string;
    global_key: string;
    path: string;
  };
  action_author: {
    id: number;
    avatar: string;
    name: string;
    global_key: string;
    path: string;
  };
  depot: {
    id: number;
    name: string;
    isDefault: boolean;
    projectId: number;
    vcsType: string;
  };
}

export interface IMRDetail {
  merge_request: IMRDetailMR;
  can_merge: boolean;
}

export interface IMRDetailResponse extends CodingResponse {
  data: IMRDetail;
}

export interface IActivity {
  action: string;
  created_at: number;
  id: number;
  author: IUserItem;
  comment?: {
    commits: any[];
  };
}

export interface IMRActivitiesResponse extends CodingResponse {
  data: IActivity[];
}

export interface IReviewer {
  reviewer: IUserItem;
  value: number;
  volunteer: string;
}

export interface IMRReviewers {
  volunteer_reviewers: IReviewer[];
  reviewers: IReviewer[];
}

export interface IMRReviewersResponse extends CodingResponse {
  data: IMRReviewers;
}

export interface IComment {
  author: IUserItem;
  childComments?: IComment[];
  content: string;
  created_at: number;
  hasResourceReference: boolean;
  id: number;
  noteable_id: number;
  noteable_type: string;
  outdated: boolean;
  parentId: number;
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

export interface IMemberItem {
  id: number;
  project_id: number;
  user_id: number;
  type: number;
  alias: string;
  team_alias: string;
  created_at: number;
  last_visit_at: number;
  user: IUserItem;
}

export interface IMemberListResp extends IListResponse<IMemberItem> {}

export interface IMRContent {
  body: string;
  body_plan: string;
}

export interface IMRContentResp extends CodingResponse {
  data: IMRContent;
}

export interface ICreateCommentResp extends CodingResponse {
  data: IComment;
}

export interface IMRStatusItem {
  state: string;
  sha: string;
  context: string;
  target_url: string;
  description: string;
  ignore: boolean;
}

export interface IMRStatus {
  state: string;
  pendingStateCount: number;
  successStateCount: number;
  failureStateCount: number;
  errorStateCount: number;
  statuses: IMRStatusItem[];
}

export interface IMRStatusResp extends CodingResponse {
  data: IMRStatus;
}
