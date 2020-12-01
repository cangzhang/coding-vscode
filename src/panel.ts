import * as vscode from 'vscode';
import * as path from 'path';

import { IMRWebViewDetail } from './typings/commonTypes'

export class Panel {
  /**
   * Track the currently panel. Only allow a single panel to exist at a time.
   */
  public static currentPanel: Panel | undefined;

  public static readonly viewType = 'codingPlugin';

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private readonly _extensionPath: string;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(context: vscode.ExtensionContext, data: IMRWebViewDetail) {
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

    Panel.currentPanel = new Panel(panel, extensionUri, extensionPath, data);
  }

  public static revive(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    extensionPath: string,
  ) {
    Panel.currentPanel = new Panel(panel, extensionUri, extensionPath);
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, extensionPath: string, mr?: IMRWebViewDetail) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this._extensionPath = extensionPath;

    // Set the webview's initial html content
    this._update(mr);

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
    this._panel.webview.onDidReceiveMessage(
      (message) => {
        switch (message.command) {
          case 'alert':
            vscode.window.showErrorMessage(message.text);
            return;
        }
      },
      null,
      this._disposables,
    );
  }

  public doRefactor() {
    // Send a message to the webview webview.
    // You can send any JSON serializable data.
    this._panel.webview.postMessage({ command: 'refactor' });
  }

  public broadcast(type: string, value: any) {
    this._panel.webview.postMessage({
      type,
      value,
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

  private _update(data?: IMRWebViewDetail) {
    const webview = this._panel.webview;

    // Vary the webview's content based on where it is located in the editor.
    switch (this._panel.viewColumn) {
      case vscode.ViewColumn.Two:
        this._updateForCat(webview, data);
        return;

      case vscode.ViewColumn.Three:
        this._updateForCat(webview, data);
        return;

      case vscode.ViewColumn.One:
      default:
        this._updateForCat(webview, data);
        return;
    }
  }

  private _updateForCat(webview: vscode.Webview, data?: IMRWebViewDetail) {
    this._panel.title = `Merge Request ${data?.iid || ``}`;
    this._panel.webview.html = this._getHtmlForWebview(webview);
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const appPathOnDisk = vscode.Uri.file(path.join(this._extensionPath, 'out/webviews/main.js'));
    const appUri = appPathOnDisk.with({ scheme: 'vscode-resource' });

    return `<!DOCTYPE html>
		  <html lang="en">
		  <head>
			  <meta charset="UTF-8">
			  <meta name="viewport" content="width=device-width, initial-scale=1.0">
			  <title>Merge Request Overview</title>

			  <meta http-equiv="Content-Security-Policy"
						  content="default-src 'unsafe-inline';
								   img-src https:;
				   script-src 'unsafe-eval' 'unsafe-inline' vscode-resource:;
				   connect-src 'self' https: *.coding.net;
								   style-src vscode-resource: 'unsafe-inline';">
		  </head>
		  <body>
			  <div id="root"></div>
			  <script src="${appUri}"></script>
		  </body>
		  </html>`;
  }
}
