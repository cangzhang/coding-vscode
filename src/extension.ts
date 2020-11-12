import * as vscode from 'vscode';

// import Logger from './common/logger';
import { uriHandler, CodingServer } from './codingServer';
import { CodingAuthenticationProvider } from './coding';
import { Panel } from './panel';
import { ListProvider } from './tree';

export async function activate(context: vscode.ExtensionContext) {
  const repoInfo = await CodingServer.getRepoParams();
  const codingAuth = new CodingAuthenticationProvider(repoInfo);
  await codingAuth.initialize(context);

  if (!codingAuth.session?.user) {
    vscode.window.showWarningMessage(`Please login first.`);
  }

  const service = new CodingServer(codingAuth.session, repoInfo);

  context.subscriptions.push(vscode.window.registerUriHandler(uriHandler));
  context.subscriptions.push(
    vscode.commands.registerCommand('codingPlugin.show', () => {
      Panel.createOrShow(context);
    }),
  );
  context.subscriptions.push(
    vscode.commands.registerCommand('codingPlugin.openConvertPage', k => {
      Panel.createOrShow(context);
      Panel.currentPanel?.broadcast(`UPDATE_CURRENCY`, k);
    }),
  );
  context.subscriptions.push(
    vscode.commands.registerCommand('codingPlugin.login', async () => {
      const session = await codingAuth.login(repoInfo?.team || ``);
      if (!session?.accessToken) {
        console.error(`No token provided.`);
      }
    }),
  );
  context.subscriptions.push(
    vscode.commands.registerCommand('codingPlugin.logout', async () => {
      try {
        await codingAuth.logout();
        vscode.window.showInformationMessage(`Logout successfully.`);
      } catch {
      }
    }),
  );

  vscode.window.createTreeView(
    `treeviewSample`,
    {
      treeDataProvider: new ListProvider(context, service, repoInfo),
    },
  );

  if (vscode.window.registerWebviewPanelSerializer) {
    // Make sure we register a serializer in activation event
    vscode.window.registerWebviewPanelSerializer(Panel.viewType, {
      async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
        Panel.revive(webviewPanel, context.extensionUri, context.extensionPath);
      },
    });
  }
}
