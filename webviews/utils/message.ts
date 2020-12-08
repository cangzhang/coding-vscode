import { vscode } from 'webviews/constants/vscode';
import { IRequestMessage, IReplyMessage } from 'src/typings/message';

export class MessageHandler {
  private _commandHandler: ((message: any) => void) | null;
  private lastSentReq: number;
  private pendingReplies: any;

  constructor(commandHandler: any) {
    this._commandHandler = commandHandler;
    this.lastSentReq = 0;
    this.pendingReplies = Object.create(null);
  }

  public registerCommandHandler(commandHandler: (message: any) => void) {
    this._commandHandler = commandHandler;
  }

  public async postMessage(message: any): Promise<any> {
    const req = String(++this.lastSentReq);

    return new Promise<any>((resolve, reject) => {
      this.pendingReplies[req] = {
        resolve: resolve,
        reject: reject,
      };

      message = Object.assign(message, {
        req: req,
      });

      vscode.postMessage(JSON.parse(JSON.stringify(message)) as IRequestMessage<any>);
    });
  }

  public handleMessage(event: any) {
    const message: IReplyMessage = event.data;
    if (message.seq) {
      const pendingReply = this.pendingReplies[message.seq];
      if (pendingReply) {
        if (message.err) {
          pendingReply.reject(message.err);
        } else {
          pendingReply.resolve(message.res);
        }
        return;
      }
    }

    if (this._commandHandler) {
      this._commandHandler(message);
    }
  }
}

export function getMessageHandler(handler: ((message: any) => void) | null) {
  return new MessageHandler(handler);
}
