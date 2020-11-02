import * as vscode from 'vscode';

import Logger from './common/logger';
import { uriHandler, CodingServer } from './codingServer';
import { CodingAuthenticationProvider } from './coding'
import { Panel } from './panel';
import { ListProvider } from './tree';

export async function activate(context: vscode.ExtensionContext) {
  console.log(`actived`);
  const repoInfo = await CodingServer.getRepoParams();
  console.log(`repo `, repoInfo);
  const codingAuth = new CodingAuthenticationProvider(repoInfo);
  await codingAuth.initialize(context);
  const service = new CodingServer(codingAuth.session, repoInfo);

  context.subscriptions.push(vscode.window.registerUriHandler(uriHandler));

  context.subscriptions.push(
    vscode.commands.registerCommand('codingPlugin.show', () => {
      Panel.createOrShow(context);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('codingPlugin.openConvertPage', k => {
      Panel.createOrShow(context);
      Panel.currentPanel?.broadcast(`UPDATE_CURRENCY`, k);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('codingPlugin.login', async () => {
      const session = await codingAuth.login(repoInfo?.team || ``);
      if (!session?.accessToken) {
        console.error(`No token provided.`)
      }

      console.log(`session: `, session);
    })
  );

  vscode.window.registerTreeDataProvider(
    `treeviewSample`,
    new ListProvider(context, service, repoInfo)
  );

  if (vscode.window.registerWebviewPanelSerializer) {
    // Make sure we register a serializer in activation event
    vscode.window.registerWebviewPanelSerializer(Panel.viewType, {
      async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
        Panel.revive(webviewPanel, context.extensionUri, context.extensionPath);
      }
    });
  }
}
