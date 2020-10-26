export interface AuthSuccessResult {
  access_token: string;
  refresh_token: string;
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
