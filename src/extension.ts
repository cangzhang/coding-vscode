import * as vscode from 'vscode';

import Logger from './common/logger';
import { uriHandler, CodingServer } from './codingServer';
import { CodingAuthenticationProvider, onDidChangeSessions, ScopeList } from './coding'
import { Panel } from './panel';
import { ListProvider } from './tree';

export async function activate(context: vscode.ExtensionContext) {
  const repoInfo = await CodingServer.getRepoParams();

  const codingAuth = new CodingAuthenticationProvider(repoInfo);
  await codingAuth.initialize(context);
  const service = new CodingServer(codingAuth.sessions, repoInfo);

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
      if (!session.accessToken) {
        console.error(`No token provided.`)
      }

      console.log(`session: `, session);
    })
  );

  context.subscriptions.push(vscode.authentication.registerAuthenticationProvider({
    id: 'coding',
    label: 'Coding',
    supportsMultipleAccounts: false,
    onDidChangeSessions: onDidChangeSessions.event,
    getSessions: () => Promise.resolve(codingAuth.sessions),
    login: async (scopeList: string[] = ScopeList) => {
      try {
        const session = await codingAuth.login(repoInfo?.team || ``, scopeList.sort().join(' '));
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
        await codingAuth.logout(id);
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
