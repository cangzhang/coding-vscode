import * as vscode from 'vscode';
import * as path from 'path';

import { CodingServer } from './codingServer';
import { RepoInfo } from './typings/commonTypes';
import { MRData } from './typings/respResult';

export class ListProvider implements vscode.TreeDataProvider<ListItem> {
  private _service: CodingServer;
  private _repo: RepoInfo = {
    team: ``,
    project: ``,
    repo: ``,
  };
  private _onDidChangeTreeData: vscode.EventEmitter<ListItem | undefined | void> = new vscode.EventEmitter<ListItem | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<ListItem | undefined | void> = this._onDidChangeTreeData.event;

  constructor(context: vscode.ExtensionContext, service: CodingServer, repo: RepoInfo | null) {
    this._service = service;
    if (repo) {
      this._repo = repo;
    }
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

    return this._service.getMRList()
      .then(resp => {
        if (resp.code) {
          return [];
        }

        const { data: { list } } = resp;
        return list.map((i: MRData) => {
          return new ListItem(i.title, i.iid, vscode.TreeItemCollapsibleState.None, {
            command: 'codingPlugin.openConvertPage',
            title: `${i.iid} ${i.title}`,
            arguments: [{
              ...this._repo,
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
