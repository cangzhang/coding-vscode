import * as vscode from 'vscode';

import { getNonce } from 'src/common/utils';
import { IReplyMessage, IRequestMessage } from 'src/typings/message';
import { CodingServer } from 'src/codingServer';
import { formatErrorMessage } from 'src/utils/error';

export class Panel {
  /**
   * Track the currently panel. Only allow a single panel to exist at a time.
   */
  public static currentPanel: Panel | undefined;

  public static readonly viewType = 'codingPlugin';

  private readonly _panel: vscode.WebviewPanel;
  private readonly _codingSrv: CodingServer;
  private readonly _extensionUri: vscode.Uri;
  private readonly _extensionPath: string;
  private _disposables: vscode.Disposable[] = [];

  private _waitForReady: Promise<void>;
  private _onIsReady: vscode.EventEmitter<void> = new vscode.EventEmitter();
  protected readonly MESSAGE_UNHANDLED: string = 'message not handled';

  private constructor(
    panel: vscode.WebviewPanel,
    codingSrv: CodingServer,
    extensionUri: vscode.Uri,
    extensionPath: string,
  ) {
    this._panel = panel;
    this._codingSrv = codingSrv;
    this._extensionUri = extensionUri;
    this._extensionPath = extensionPath;

    // Set the webview's initial html content
    this._update();

    // Listen for when the panel is disposed
    // This happens when the user closes the panel or when the panel is closed programatically
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Update the content based on view changes
    this._panel.onDidChangeViewState(
      () => {
        if (this._panel.visible) {
          this._update();
        }
      },
      null,
      this._disposables,
    );

    // Handle messages from the webview
    this._panel.webview?.onDidReceiveMessage(
      async (message) => {
        await this._onDidReceiveMessage(message);
      },
      null,
      this._disposables,
    );

    this._waitForReady = new Promise((resolve) => {
      const disposable = this._onIsReady.event(() => {
        disposable.dispose();
        resolve();
      });
    });
  }

  protected async _onDidReceiveMessage(message: IRequestMessage<any>) {
    const { command, args } = message;
    try {
      switch (command) {
        case 'alert':
          vscode.window.showErrorMessage(args);
          return;
        case 'mr.close':
          await this._codingSrv.closeMR(args);
          this._replyMessage(message, {});
          break;
        case 'mr.approve':
          await this._codingSrv.approveMR(args);
          this._replyMessage(message, {});
          break;
        case 'mr.disapprove':
          await this._codingSrv.disapproveMR(args);
          this._replyMessage(message, {});
          break;
        case 'mr.merge':
          await this._codingSrv.mergeMR(args);
          this._replyMessage(message, {});
          break;
        case 'mr.update.title':
          await this._codingSrv.updateMRTitle(args.iid, args.title);
          this._replyMessage(message, {});
          break;
        case 'mr.add.comment':
          const commentRes = await this._codingSrv.commentMR(args.id, args.comment);
          this._replyMessage(message, commentRes.data);
          break;
        case 'mr.get.activities':
          const getActivitiesRes = await this._codingSrv.getMRActivities(args);
          this._replyMessage(message, getActivitiesRes.data);
          break;
        case 'mr.update.reviewers': {
          try {
            const {
              iid,
              list: selected,
              author,
            }: { iid: string; list: number[]; author: string } = args;
            const {
              data: { list: memberList },
            } = await this._codingSrv.getProjectMembers();

            const list = memberList
              .filter((i) => i.user.global_key !== author)
              .map((i) => ({
                label: i.user.name,
                description: i.user.global_key,
                picked: selected.includes(i.user.id),
                userId: i.user.id,
              }));
            const selection = await vscode.window.showQuickPick(list, {
              canPickMany: true,
              ignoreFocusOut: true,
            });

            if (!selection) {
              return;
            }

            const s = selection.map((i) => i.userId);
            const added = s.filter((i) => !selected.includes(i));
            const removed = selected.filter((i) => !s.includes(i));
            const tasks = [];
            if (added.length) {
              tasks.push(this._codingSrv.addMRReviewers(iid, added));
            }
            if (removed.length) {
              tasks.push(this._codingSrv.removeMRReviewers(iid, removed));
            }

            await Promise.all(tasks);
            const resp = await this._codingSrv.getMRReviewers(iid);
            this._replyMessage(message, resp.data);
          } catch (err) {}
          break;
        }
        case `mr.update.desc`: {
          try {
            const { iid, content } = args;
            const resp = await this._codingSrv.updateMRDesc(iid, content);
            this._replyMessage(message, resp.data);
          } catch (e) {}
          break;
        }
        case `mr.fetch.status`: {
          try {
            const { iid } = args;
            const resp = await this._codingSrv.fetchMRStatus(iid);
            this._replyMessage(message, resp.data);
          } catch (e) {}
          break;
        }
        default:
          return this.MESSAGE_UNHANDLED;
      }
    } catch (err) {
      this._throwError(message, err.msg);
      vscode.window.showErrorMessage(formatErrorMessage(err.msg));
    }
  }

  protected async _postMessage(message: any) {
    // Without the following ready check, we can end up in a state where the message handler in the webview
    // isn't ready for any of the messages we post.
    await this._waitForReady;
    this._panel.webview?.postMessage({
      res: message,
    });
  }

  protected async _replyMessage(originalMessage: IRequestMessage<any>, message: any = {}) {
    const reply: IReplyMessage = {
      seq: originalMessage.req,
      res: message,
    };
    this._panel.webview?.postMessage(reply);
  }

  protected async _throwError(originalMessage: IRequestMessage<any>, error: any) {
    const reply: IReplyMessage = {
      seq: originalMessage.req,
      err: error,
    };
    this._panel.webview?.postMessage(reply);
  }

  public static createOrShow(context: vscode.ExtensionContext, codingSrv: CodingServer) {
    const { extensionUri, extensionPath } = context;
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel, show it.
    if (Panel.currentPanel) {
      Panel.currentPanel._panel.reveal(column);
      return;
    }

    // Otherwise, create a new panel.
    const panel = vscode.window.createWebviewPanel(
      Panel.viewType,
      'Coding',
      column || vscode.ViewColumn.One,
      {
        // Enable javascript in the webview
        enableScripts: true,

        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'out')],
      },
    );

    Panel.currentPanel = new Panel(panel, codingSrv, extensionUri, extensionPath);
  }

  public static revive(
    panel: vscode.WebviewPanel,
    codingSrv: CodingServer,
    extensionUri: vscode.Uri,
    extensionPath: string,
  ) {
    Panel.currentPanel = new Panel(panel, codingSrv, extensionUri, extensionPath);
  }

  public broadcast(command: string, res: any) {
    this._panel.webview.postMessage({
      command,
      res,
    });
  }

  public dispose() {
    Panel.currentPanel = undefined;

    // Clean up our resources
    this._panel.dispose();

    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  private _update() {
    const webview = this._panel.webview;

    // Vary the webview's content based on where it is located in the editor.
    switch (this._panel.viewColumn) {
      case vscode.ViewColumn.Two:
        this._updateForPanel(webview);
        return;

      case vscode.ViewColumn.Three:
        this._updateForPanel(webview);
        return;

      case vscode.ViewColumn.One:
      default:
        this._updateForPanel(webview);
        return;
    }
  }

  private _updateForPanel(webview: vscode.Webview) {
    this._panel.title = `Merge Request Overview`;
    this._panel.webview.html = this._getHtmlForWebview(webview);
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const appPathOnDisk = vscode.Uri.joinPath(this._extensionUri, 'out/webviews/main.js');
    const appUri = webview.asWebviewUri(appPathOnDisk);
    const nonce = getNonce();

    return `<!DOCTYPE html>
		  <html lang="en">
		  <head>
			  <meta charset="UTF-8">
			  <title>Merge Request Overview</title>
			  <meta name="viewport" content="width=device-width, initial-scale=1.0">
			  <meta http-equiv="Content-Security-Policy"
              content="default-src 'none'; style-src vscode-resource: 'unsafe-inline' http: https: data:;; img-src vscode-resource: https:; script-src 'nonce-${nonce}' 'unsafe-eval'; connect-src https:">
		  </head>
		  <body>
			  <div id="root"></div>
			  <script nonce="${nonce}" src="${appUri}"></script>
		  </body>
		  </html>`;
  }
}
