export interface IRequestMessage<T> {
  req: string;
  command: string;
  args: T;
}

export interface IReplyMessage {
  seq?: string;
  err?: any;
  res?: any;
}
