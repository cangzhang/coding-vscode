import * as vscode from 'vscode';
import * as path from 'path';

import { CodingServer } from '../codingServer';
import { RepoInfo } from '../typings/commonTypes';
import { MRData } from '../typings/respResult';
import { PromiseOnly } from 'got';

enum MRType {
  Open = `open`,
  Closed = `close`,
  All = `all`,
}

enum ItemType {
  ListItem = `listItem`,
  CategoryItem = `categoryItem`,
  MRItem = `mrItem`,
  Node = `node`,
}

export class MRTreeDataProvider implements vscode.TreeDataProvider<ListItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<ListItem | undefined | void> = new vscode.EventEmitter<ListItem | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<ListItem | undefined | void> = this._onDidChangeTreeData.event;

  private _context: vscode.ExtensionContext;
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
    if (!this._service.loggedIn) {
      vscode.window.showErrorMessage(`[Auth] expired.`);
      return Promise.resolve([]);
    }

    const repoInfo = this._context.workspaceState.get(`repoInfo`) as RepoInfo;
    if (!repoInfo?.team) {
      throw new Error(`team not exist.`);
    }

    if (element) {
      if (element.contextValue === ItemType.CategoryItem) {
        return this._service.getMRList(``, element.value as MRType)
          .then(resp => {
            if (resp.code) {
              const msg = Object.values(resp.msg || {} as object)[0];
              vscode.window.showErrorMessage(`[MR] list: ${msg}`);
              return [];
            }

            const { data: { list } } = resp;
            if (!list.length) {
              return [
                new ListItem(`0 merge requests in this category`, `noData`, vscode.TreeItemCollapsibleState.None),
              ];
            }

            const repoInfo = this._context.workspaceState.get(`repoInfo`) as RepoInfo;
            if (!repoInfo?.team) {
              throw new Error(`team not exist`);
            }

            return list.map((i: MRData) => {
              return new MRItem(
                i.title,
                i.iid,
                vscode.TreeItemCollapsibleState.Collapsed,
                {
                  command: 'codingPlugin.showDetail',
                  title: `${i.iid} ${i.title}`,
                  arguments: [{
                    ...repoInfo,
                    iid: i.iid,
                    type: `mr`,
                    accessToken: this._service.session?.accessToken,
                  }],
                },
              );
            });
          })
          .catch(() => {
            return [];
          });
      } else if (element.contextValue === ItemType.MRItem) {
        return this._service.getMRDiff(element.value as number)
          .then(({ data: { diffStat } }) => {
            return [
              new ListItem(`Description`, `mr-desc`, vscode.TreeItemCollapsibleState.None),
              new NodeItem(`node`, `node`, vscode.TreeItemCollapsibleState.Expanded),
            ];
          });
      }

      return Promise.resolve([]);
    }

    return Promise.resolve([
      new CategoryItem(MRType.Open.toUpperCase(), MRType.Open, vscode.TreeItemCollapsibleState.Collapsed),
      new CategoryItem(MRType.Closed.toUpperCase(), MRType.Closed, vscode.TreeItemCollapsibleState.Collapsed),
      new CategoryItem(MRType.All.toUpperCase(), MRType.All, vscode.TreeItemCollapsibleState.Collapsed),
    ]);
  }
}

export class ListItem extends vscode.TreeItem {
  contextValue = ItemType.ListItem;
  private readonly _value: string | number;

  constructor(
    public readonly label: string,
    public readonly val: number | string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly command?: vscode.Command,
  ) {
    super(label, collapsibleState);

    this._value = val;
  }

  get value() {
    return this._value;
  }
}

export class CategoryItem extends ListItem {
  contextValue = ItemType.CategoryItem;
}

export class MRItem extends ListItem {
  contextValue = ItemType.MRItem;

  iconPath = {
    light: path.join(__filename, '../../../src/assets/star.light.svg'),
    dark: path.join(__filename, '../../../src/assets/star.dark.svg'),
  };
}

export class NodeItem extends ListItem {
  contextValue = ItemType.Node;

  children = [
    new ListItem(`children-1`, 1, vscode.TreeItemCollapsibleState.None),
  ];

  async getChildren(): Promise<ListItem[]> {
    return this.children;
  }

  getTreeItem(): vscode.TreeItem {
    return this;
  }
}


