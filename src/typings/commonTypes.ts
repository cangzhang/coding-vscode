import { UserResponse } from './respResult';

export interface RepoInfo {
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
  user: UserResponse | null;
  accessToken: string;
  refreshToken: string;
}
