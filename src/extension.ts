import * as vscode from 'vscode';

// import Logger from './common/logger';
import { uriHandler, CodingServer } from './codingServer';
import { Panel } from './panel';
import { ListItem, MRTreeDataProvider } from './tree/mr-tree';
import { ReleaseTreeDataProvider } from './tree/release-tree';
import { RepoInfo } from './typings/commonTypes';

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

  const mrDataProvider = new MRTreeDataProvider(context, codingSrv);
  const releaseDataProvider = new ReleaseTreeDataProvider(context);
  const mrTree = vscode.window.createTreeView(`mrTreeView`, { treeDataProvider: mrDataProvider });
  const releaseTree = vscode.window.createTreeView(`releaseTreeView`, { treeDataProvider: releaseDataProvider });

  context.subscriptions.push(vscode.window.registerUriHandler(uriHandler));
  context.subscriptions.push(
    vscode.commands.registerCommand('codingPlugin.show', () => {
      Panel.createOrShow(context);
      mrTree.reveal({} as ListItem);
    }),
  );
  context.subscriptions.push(
    vscode.commands.registerCommand('codingPlugin.showDetail', k => {
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
        mrDataProvider.refresh();
      }
    }),
  );
  context.subscriptions.push(
    vscode.commands.registerCommand('codingPlugin.logout', async () => {
      try {
        await codingSrv.logout();
        vscode.window.showInformationMessage(`Logout successfully.`);
      } finally {
        mrDataProvider.refresh();
      }
    }),
  );
  context.subscriptions.push(
    vscode.commands.registerCommand('codingPlugin.refresh', () => {
      mrDataProvider.refresh();
    }),
  );
  context.subscriptions.push(
    vscode.commands.registerCommand('codingPlugin.switchRepo', async () => {
      try {
        const { data } = await codingSrv.getRepoList();
        const list = data.map(i => ({
          label: i.name,
          description: i.depotPath.replace(`/p/`, ``)
            .replace(`/d/`, `/`)
            .replace(`/git`, ``),
        }));
        const selection = await vscode.window.showQuickPick(list);
        if (!selection)
          return;

        const r = context.workspaceState.get(`repoInfo`) as RepoInfo;
        context.workspaceState.update(`repoInfo`, {
          team: r?.team,
          project: selection?.description.replace(`/${selection?.label}`, ``),
          repo: selection?.label,
        });
        mrDataProvider.refresh();
        releaseDataProvider.refresh();
      } catch (e) {
        vscode.window.showWarningMessage(`Repo list: fetch failed.`);
      }
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

export function deactivate() {
}
