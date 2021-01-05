import { vscode } from 'webviews/constants/vscode';
import { nanoid } from 'nanoid';
import { IRequestMessage, IReplyMessage } from 'src/typings/message';

export class MessageHandler {
  private _commandHandler: ((message: any) => void) | null;
  // private lastSentReq: string;
  private pendingReplies: any;

  constructor(commandHandler: any) {
    this._commandHandler = commandHandler;
    // this.lastSentReq = nanoid();
    this.pendingReplies = Object.create(null);
    window.addEventListener('message', this.handleMessage.bind(this));
  }

  public registerCommandHandler(commandHandler: (message: any) => void) {
    this._commandHandler = commandHandler;
  }

  public async postMessage(message: any): Promise<any> {
    const req = nanoid();
    return new Promise<any>((resolve, reject) => {
      this.pendingReplies[req] = {
        resolve: resolve,
        reject: reject,
      };
      message = Object.assign(message, {
        req: req,
      });
      vscode.postMessage(message as IRequestMessage<any>);
    });
  }

  // handle message should resolve promises
  private handleMessage(event: any) {
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
      this._commandHandler(message.res);
    }
  }
}

export function getMessageHandler(handler: ((message: any) => void) | null) {
  let instance: MessageHandler;

  return () => {
    if (!instance) {
      instance = new MessageHandler(handler);
    }

    return instance;
  };
}
