import * as vscode from 'vscode';

// import Logger from './common/logger';
import { uriHandler, CodingServer } from './codingServer';
import { Panel } from './panel';
import { ListItem, ListProvider } from './tree';

export async function activate(context: vscode.ExtensionContext) {
  const repoInfo = await CodingServer.getRepoParams();

  if (!repoInfo?.team) {
    vscode.window.showWarningMessage(`Please open a repo hosted by coding.net.`);
  } else {
    context.workspaceState.update(`repoInfo`, repoInfo);
  }

  const codingSrv = new CodingServer(context);
  await codingSrv.initialize();

  if (!codingSrv.session?.user) {
    vscode.window.showWarningMessage(`Please login first.`);
  } else {
    context.workspaceState.update(`session`, codingSrv.session);
  }

  const treeDataProvider = new ListProvider(context, codingSrv);
  const tree = vscode.window.createTreeView(`treeViewSample`, { treeDataProvider });

  context.subscriptions.push(vscode.window.registerUriHandler(uriHandler));
  context.subscriptions.push(
    vscode.commands.registerCommand('codingPlugin.show', () => {
      Panel.createOrShow(context);
      tree.reveal({} as ListItem);
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
      const session = await codingSrv.login(repoInfo?.team || ``);
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
        await codingSrv.logout();
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

export function deactivate() {}
