import * as vscode from 'vscode';
import * as path from 'path';
import got from 'got';

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

  constructor(context: vscode.ExtensionContext, service: CodingServer, repo: RepoInfo | null) {
    this._service = service;
    if (repo) {
      this._repo = repo;
    }
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
              accessToken: this._service.session.accessToken,
            }],
          });
        });
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
