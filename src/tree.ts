import * as vscode from 'vscode';
import * as path from 'path';
import got from 'got';

export class ListProvider implements vscode.TreeDataProvider<ListItem> {
  constructor(private workspaceRoot: string) { }

  getTreeItem(element: ListItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: ListItem): Thenable<ListItem[]> {
    if (element) {
      return Promise.resolve([]);
    }

    return got(`https://api.frankfurter.app/currencies`, { responseType: 'json' })
      .then(({ body }) => {
        return Object.entries(body as object).map(([k, v]) => {
          return new ListItem(k, v, vscode.TreeItemCollapsibleState.None, {
            command: 'catCoding.openConvertPage',
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
