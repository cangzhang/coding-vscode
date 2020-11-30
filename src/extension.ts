import * as vscode from 'vscode';
import got from 'got';

// import Logger from './common/logger';
import { uriHandler, CodingServer } from './codingServer';
import { Panel } from './panel';
import { IFileNode, MRTreeDataProvider } from './tree/mrTree';
import { ReleaseTreeDataProvider } from './tree/releaseTree';
import { RepoInfo } from './typings/commonTypes';

export async function activate(context: vscode.ExtensionContext) {
  const repoInfo = await CodingServer.getRepoParams();

  if (!repoInfo?.team) {
    vscode.window.showInformationMessage(`Please open a repo hosted by coding.net.`);
  } else {
    context.workspaceState.update(`repoInfo`, repoInfo);
    if (repoInfo?.project && repoInfo?.repo) {
      vscode.window.showInformationMessage(`CODING: current repo is ${repoInfo?.project}/${repoInfo?.repo}`);
    }
  }

  const codingSrv = new CodingServer(context);
  await codingSrv.initialize();

  if (!codingSrv.session?.user) {
    vscode.window.showWarningMessage(`Please login first.`);
  } else {
    await context.workspaceState.update(`session`, codingSrv.session);
    const rInfo = context.workspaceState.get(`repoInfo`, {});
    await context.workspaceState.update(`repoInfo`, {
      ...rInfo,
      team: codingSrv.session.user.team,
    });
  }

  const mrDataProvider = new MRTreeDataProvider(context, codingSrv);
  const releaseDataProvider = new ReleaseTreeDataProvider(context);
  vscode.window.createTreeView(`mrTreeView`, { treeDataProvider: mrDataProvider, showCollapseAll: true });
  vscode.window.createTreeView(`releaseTreeView`, { treeDataProvider: releaseDataProvider, showCollapseAll: true });

  context.subscriptions.push(vscode.window.registerUriHandler(uriHandler));
  context.subscriptions.push(
    vscode.commands.registerCommand('codingPlugin.show', () => {
      Panel.createOrShow(context);
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
      const rInfo = context.workspaceState.get(`repoInfo`, {}) as RepoInfo;
      const session = await codingSrv.login(rInfo?.team || ``);
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

        const r = context.workspaceState.get(`repoInfo`, {}) as RepoInfo;
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
  context.subscriptions.push(
    vscode.commands.registerCommand(`codingPlugin.showDiff`, async (file: IFileNode) => {
      const newFileUri = vscode.Uri.parse(file.path, false).with({ scheme: `mr`, query: `commit=${file.newSha}&path=${file.path}` });
      const oldFileUri = newFileUri.with({ query: `commit=${file.oldSha}&path=${file.path}`});
      await vscode.commands.executeCommand(`vscode.diff`, oldFileUri, newFileUri, `${file.name} (Merge Request)`, { preserveFocus: true });
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
