import 'module-alias/register';
import * as vscode from 'vscode';

import { uriHandler, CodingServer } from 'src/codingServer';
import { Panel } from 'src/panel';
import { IFileNode, MRTreeDataProvider } from 'src/tree/mrTree';
import { ReleaseTreeDataProvider } from 'src/tree/releaseTree';
import { IRepoInfo, IMRWebViewDetail } from 'src/typings/commonTypes';

export async function activate(context: vscode.ExtensionContext) {
  const repoInfo = await CodingServer.getRepoParams();

  if (!repoInfo?.team) {
    vscode.window.showInformationMessage(`Please open a repo hosted by coding.net.`);
  } else {
    context.workspaceState.update(`repoInfo`, repoInfo);
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
  vscode.window.createTreeView(`mrTreeView`, {
    treeDataProvider: mrDataProvider,
    showCollapseAll: true,
  });
  vscode.window.createTreeView(`releaseTreeView`, {
    treeDataProvider: releaseDataProvider,
    showCollapseAll: true,
  });

  context.subscriptions.push(vscode.window.registerUriHandler(uriHandler));
  context.subscriptions.push(
    vscode.commands.registerCommand('codingPlugin.showMROverview', async (mr: IMRWebViewDetail) => {
      Panel.createOrShow(context);
      const resp = await codingSrv.getMRDetail(mr.iid);
      mr.data = resp.data.merge_request;
      Panel.currentPanel?.broadcast(`action.UPDATE_CURRENT_MR`, {
        ...mr,
        data: resp.data.merge_request,
      });
    }),
  );
  context.subscriptions.push(
    vscode.commands.registerCommand('codingPlugin.login', async () => {
      const rInfo = context.workspaceState.get(`repoInfo`, {}) as IRepoInfo;
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
        const list = data.map((i) => ({
          label: i.name,
          description: i.depotPath.replace(`/p/`, ``).replace(`/d/`, `/`).replace(`/git`, ``),
        }));
        const selection = await vscode.window.showQuickPick(list);
        if (!selection) return;

        const r = context.workspaceState.get(`repoInfo`, {}) as IRepoInfo;
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
      const headUri = vscode.Uri.parse(file.path, false).with({
        // path: `${file.path}.txt`,
        scheme: `mr`,
        query: `commit=${file.newSha}&path=${file.path}`,
      });
      const parentUri = headUri.with({ query: `commit=${file.oldSha}&path=${file.path}` });
      await vscode.commands.executeCommand(
        `vscode.diff`,
        parentUri,
        headUri,
        `${file.name} (Merge Request)`,
        { preserveFocus: true },
      );
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
