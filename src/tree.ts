import * as vscode from 'vscode';
import * as path from 'path';

import { CodingServer } from './codingServer';
import { RepoInfo } from './typings/commonTypes';
import { MRData } from './typings/respResult';

export class ListProvider implements vscode.TreeDataProvider<ListItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<ListItem | undefined | void> = new vscode.EventEmitter<ListItem | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<ListItem | undefined | void> = this._onDidChangeTreeData.event;

  private _context : vscode.ExtensionContext;
  private _service: CodingServer;

  constructor(context: vscode.ExtensionContext, service: CodingServer) {
    this._context = context;
    this._service = service;
  }

  public refresh(): any {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: ListItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: ListItem): Thenable<ListItem[]> {
    if (element) {
      return Promise.resolve([]);
    }

    if (!this._service.loggedIn) {
      vscode.window.showErrorMessage(`[Auth] expired.`);
      return Promise.resolve([]);
    }

    const repoInfo = this._context.workspaceState.get(`repoInfo`) as RepoInfo;
    if (!repoInfo?.team) {
      throw new Error(`team not exist`);
    }

    return this._service.getMRList()
      .then(resp => {
        if (resp.code) {
          const msg = Object.values(resp.msg as object)[0];
          vscode.window.showErrorMessage(`[MR] list: ${msg}`);
          return [];
        }

        const { data: { list } } = resp;
        if (!list.length) {
          vscode.commands.executeCommand('setContext', 'noMRResult', true);
          return [];
        }

        vscode.commands.executeCommand('setContext', 'noMRResult', false);
        
        const repoInfo = this._context.workspaceState.get(`repoInfo`) as RepoInfo;
        if (!repoInfo?.team) {
          throw new Error(`team not exist`);
        }

        return list.map((i: MRData) => {
          return new ListItem(i.title, i.iid, vscode.TreeItemCollapsibleState.None, {
            command: 'codingPlugin.openConvertPage',
            title: `${i.iid} ${i.title}`,
            arguments: [{
              ...repoInfo,
              iid: i.iid,
              type: `mr`,
              accessToken: this._service.session?.accessToken,
            }],
          });
        });
      })
      .catch(() => {
        return Promise.resolve([]);
      });
  }
}

export class ListItem extends vscode.TreeItem {
  contextValue = `listItem`;

  iconPath = {
    light: path.join(__filename, '../../src/assets/star.light.svg'),
    dark: path.join(__filename, '../../src/assets/star.dark.svg'),
  };

  constructor(
    public readonly label: string,
    public readonly value: number,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly command?: vscode.Command,
  ) {
    super(label, collapsibleState);

    this.value = value;
  }
}
