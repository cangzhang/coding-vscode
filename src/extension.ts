import * as vscode from 'vscode';

// import Logger from './common/logger';
import { uriHandler, CodingServer } from './codingServer';
import { Panel } from './panel';
import { ListProvider } from './tree';

export async function activate(context: vscode.ExtensionContext) {
  const repoInfo = await CodingServer.getRepoParams();
  const codingAuth = new CodingServer(repoInfo);
  await codingAuth.initialize(context);

  if (!codingAuth.session?.user) {
    vscode.window.showWarningMessage(`Please login first.`);
  }

  const treeDataProvider = new ListProvider(context, codingAuth, repoInfo);
  vscode.window.registerTreeDataProvider(`treeViewSample`, treeDataProvider);

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
      } else {
        treeDataProvider.refresh();
      }
    }),
  );
  context.subscriptions.push(
    vscode.commands.registerCommand('codingPlugin.logout', async () => {
      try {
        await codingAuth.logout();
        vscode.window.showInformationMessage(`Logout successfully.`);
      } finally {
        treeDataProvider.refresh();
      }
    }),
  );
  context.subscriptions.push(
    vscode.commands.registerCommand('codingPlugin.refresh', () => {
      treeDataProvider.refresh();
    }),
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
