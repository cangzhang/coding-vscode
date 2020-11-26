import * as vscode from 'vscode';
import * as path from 'path';

import { CodingServer } from '../codingServer';
import { RepoInfo } from '../typings/commonTypes';
import { IMRDetail, IMRDiffStat, MRData, IMRPathItem } from '../typings/respResult';

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

type ITreeNode = string | number | IMRDiffStat | IMRPathItem;

export class MRTreeDataProvider implements vscode.TreeDataProvider<ListItem<ITreeNode>> {
  private _onDidChangeTreeData: vscode.EventEmitter<ListItem<ITreeNode> | undefined | void> = new vscode.EventEmitter<ListItem<ITreeNode> | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<ListItem<ITreeNode> | undefined | void> = this._onDidChangeTreeData.event;

  private _context: vscode.ExtensionContext;
  private _service: CodingServer;

  constructor(context: vscode.ExtensionContext, service: CodingServer) {
    this._context = context;
    this._service = service;
  }

  public refresh(): any {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: ListItem<ITreeNode>): vscode.TreeItem {
    return element;
  }

  getChildren(element?: ListItem<ITreeNode>): Thenable<ListItem<ITreeNode>[]> {
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
            return (element as MRItem).getChildren(diffStat);
          });
      } else if (element.contextValue === ItemType.Node) {
        (element as FileNode).makeTree();
        return (element as FileNode).getChildren();
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

export class ListItem<T> extends vscode.TreeItem {
  contextValue = ItemType.ListItem;

  constructor(
    public readonly label: string,
    public readonly value: T,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly command?: vscode.Command,
  ) {
    super(label, collapsibleState);
  }

  async getChildren(...args: any[]): Promise<any[]> {
    return [];
  }
}

export class CategoryItem extends ListItem<string> {
  contextValue = ItemType.CategoryItem;
}

export class MRItem extends ListItem<string | number> {
  contextValue = ItemType.MRItem;

  iconPath = {
    light: path.join(__filename, '../../../src/assets/star.light.svg'),
    dark: path.join(__filename, '../../../src/assets/star.dark.svg'),
  };

  async getChildren(diffStat: IMRDiffStat): Promise<ListItem<string | number | IFileNode>[]> {
    const files = diffStat.paths.map(p => {
      const pathArr = p.path.split(`/`);
      const name = pathArr[0];
      const childPath = pathArr.slice(1);
      const expandStatus = childPath.length > 0 ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.None;
      return new FileNode(name, { ...p, name, childPath }, expandStatus);
    });

    return [
      new ListItem(`Description`, `mr-desc`, vscode.TreeItemCollapsibleState.None),
      ...files,
    ];
  }
}

type IFileNode = IMRPathItem;

export class FileNode extends ListItem<IFileNode> {
  contextValue = ItemType.Node;
  children: FileNode[] = [];

  constructor(
    public readonly label: string,
    public readonly value: IFileNode,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly command?: vscode.Command,
  ) {
    super(label, value, collapsibleState, command);
  }

  public makeTree() {
    if (this.collapsibleState === vscode.TreeItemCollapsibleState.None) {
      return [];
    }
  }

  async getChildren() {
    return this.children;
  }

  getTreeItem(): ListItem<IFileNode | string> {
    return this;
  }
}


