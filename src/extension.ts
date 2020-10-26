import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

import { ListProvider } from './tree';
import Logger from './common/logger';
import { uriHandler } from './codingServer';
import { CodingAuthenticationProvider, onDidChangeSessions, ScopeList } from './coding'
import { GitService } from './common/gitService';

let team = `codingcorp`;

export async function activate(context: vscode.ExtensionContext) {
  const codingSrv = new CodingAuthenticationProvider(team);

  context.subscriptions.push(vscode.window.registerUriHandler(uriHandler));

  context.subscriptions.push(
    vscode.commands.registerCommand('catCoding.show', () => {
      CatCodingPanel.createOrShow(context);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('catCoding.openConvertPage', k => {
      CatCodingPanel.createOrShow(context);
      CatCodingPanel.currentPanel?.broadcast(`UPDATE_CURRENCY`, k);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('catCoding.login', async () => {
      const session = await codingSrv.login(team);
      if (!session.accessToken) {
        console.error(`No token provided.`)
      }

      console.log(`session: `, session);
    })
  );

  await codingSrv.initialize(context);

  const gitSrv = await GitService.getBuiltInGitApi();
  if (gitSrv) {
    gitSrv.repositories.forEach(i => {
      const data = fs.readFileSync(`${i.rootUri.path}/.git/config`, `utf8`);
      console.log(data);
    })
  }

  context.subscriptions.push(vscode.authentication.registerAuthenticationProvider({
    id: 'coding',
    label: 'Coding',
    supportsMultipleAccounts: false,
    onDidChangeSessions: onDidChangeSessions.event,
    getSessions: () => Promise.resolve(codingSrv.sessions),
    login: async (scopeList: string[] = ScopeList) => {
      try {
        const session = await codingSrv.login(team, scopeList.sort().join(' '));
        Logger.info('Login success!');
        onDidChangeSessions.fire({ added: [session.id], removed: [], changed: [] });
        return session;
      } catch (e) {
        vscode.window.showErrorMessage(`Sign in failed: ${e}`);
        Logger.error(e);
        throw e;
      }
    },
    logout: async (id: string) => {
      try {
        await codingSrv.logout(id);
        onDidChangeSessions.fire({ added: [], removed: [id], changed: [] });
      } catch (e) {
        vscode.window.showErrorMessage(`Sign out failed: ${e}`);
        Logger.error(e);
        throw e;
      }
    }
  }));

  vscode.window.registerTreeDataProvider(
    `treeviewSample`,
    new ListProvider(``)
  );

  if (vscode.window.registerWebviewPanelSerializer) {
    // Make sure we register a serializer in activation event
    vscode.window.registerWebviewPanelSerializer(CatCodingPanel.viewType, {
      async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
        CatCodingPanel.revive(webviewPanel, context.extensionUri, context.extensionPath);
      }
    });
  }
}

/**
 * Manages cat coding webview panels
 */
class CatCodingPanel {
  /**
   * Track the currently panel. Only allow a single panel to exist at a time.
   */
  public static currentPanel: CatCodingPanel | undefined;

  public static readonly viewType = 'catCoding';

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private readonly _extensionPath: string;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(context: vscode.ExtensionContext) {
    const { extensionUri, extensionPath } = context;
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel, show it.
    if (CatCodingPanel.currentPanel) {
      CatCodingPanel.currentPanel._panel.reveal(column);
      return;
    }

    // Otherwise, create a new panel.
    const panel = vscode.window.createWebviewPanel(
      CatCodingPanel.viewType,
      'Cat Coding',
      column || vscode.ViewColumn.One,
      {
        // Enable javascript in the webview
        enableScripts: true,

        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'out')]
      }
    );

    CatCodingPanel.currentPanel = new CatCodingPanel(panel, extensionUri, extensionPath);
  }

  public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, extensionPath: string) {
    CatCodingPanel.currentPanel = new CatCodingPanel(panel, extensionUri, extensionPath);
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, extensionPath: string) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this._extensionPath = extensionPath;

    // Set the webview's initial html content
    this._update();

    // Listen for when the panel is disposed
    // This happens when the user closes the panel or when the panel is closed programatically
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Update the content based on view changes
    this._panel.onDidChangeViewState(
      e => {
        if (this._panel.visible) {
          this._update();
        }
      },
      null,
      this._disposables
    );

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      message => {
        switch (message.command) {
          case 'alert':
            vscode.window.showErrorMessage(message.text);
            return;
        }
      },
      null,
      this._disposables
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
    CatCodingPanel.currentPanel = undefined;

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
        this._updateForCat(webview);
        return;

      case vscode.ViewColumn.Three:
        this._updateForCat(webview);
        return;

      case vscode.ViewColumn.One:
      default:
        this._updateForCat(webview);
        return;
    }
  }

  private _updateForCat(webview: vscode.Webview) {
    this._panel.title = `Coding cat ${Date.now()}`;
    this._panel.webview.html = this._getHtmlForWebview(webview);
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const appPathOnDisk = vscode.Uri.file(
      path.join(this._extensionPath, "out/webviews/main.js")
    );
    const appUri = appPathOnDisk.with({ scheme: "vscode-resource" });

    return `<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Coding Cat</title>

			<meta http-equiv="Content-Security-Policy"
						content="default-src 'unsafe-inline';
								 img-src https:;
                 script-src 'unsafe-eval' 'unsafe-inline' vscode-resource:;
                 connect-src 'self' https:;
								 style-src vscode-resource: 'unsafe-inline';">
		</head>
		<body>
			<div id="root"></div>

			<script src="${appUri}"></script>
		</body>
		</html>`;
  }
}
