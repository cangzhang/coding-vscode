import * as vscode from 'vscode';
import * as path from 'path';
import got from 'got';

import { CodingServer } from './codingServer'
import { RepoInfo } from './typings/types';

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

    this._service.getMRList()
      .then(resp => {
        console.log(resp);
      })

    return got(`https://api.frankfurter.app/currencies`, { responseType: 'json' })
      .then(({ body }) => {
        return Object.entries(body as object).map(([k, v]) => {
          return new ListItem(k, v, vscode.TreeItemCollapsibleState.None, {
            command: 'codingPlugin.openConvertPage',
            title: `${k}: ${v}`,
            arguments: [k],
          })
        })
      })
      .catch(err => {
        console.error(err);
        vscode.window.showErrorMessage(`Fetch currency list failed.`);
        return [];
      });
  }
}

export class ListItem extends vscode.TreeItem {
  contextValue = `listItem`;

  iconPath = {
    light: path.join(__filename, '../../src/assets/star.light.svg'),
    dark: path.join(__filename, '../../src/assets/star.dark.svg'),
  }

  constructor(
    public readonly label: string,
    public readonly value: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly command?: vscode.Command
  ) {
    super(label, collapsibleState);

    this.value = value;
  }
}
