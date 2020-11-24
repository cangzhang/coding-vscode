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

export interface MRData {
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
