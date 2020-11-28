import * as vscode from 'vscode';
import * as path from 'path';

import {CodingServer} from '../codingServer';
import {RepoInfo, SessionData} from '../typings/commonTypes';
import {IMRDiffStat, IMRData, IMRPathItem} from '../typings/respResult';

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

interface IFileNode extends IMRPathItem {
  parentPath?: string;
  children?: IFileNode[]
}

type ITreeNode = string | number | IMRDiffStat | IFileNode | IMRData;

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
      vscode.window.showErrorMessage(`[MR Tree] auth expired.`);
      return Promise.resolve([]);
    }

    const repoInfo = this._context.workspaceState.get(`repoInfo`) as RepoInfo;
    if (!repoInfo?.team) {
      throw new Error(`team not exist.`);
    }

    if (!element) {
      return Promise.resolve([
        new CategoryItem(MRType.Open.toUpperCase(), MRType.Open, vscode.TreeItemCollapsibleState.Collapsed),
        new CategoryItem(MRType.Closed.toUpperCase(), MRType.Closed, vscode.TreeItemCollapsibleState.Collapsed),
        new CategoryItem(MRType.All.toUpperCase(), MRType.All, vscode.TreeItemCollapsibleState.Collapsed),
      ]);
    }

    switch (element.contextValue) {
      case ItemType.CategoryItem: {
        return this._service.getMRList(``, element.value as MRType)
          .then(resp => {
            if (resp.code) {
              const msg = Object.values(resp.msg || {})[0];
              vscode.window.showErrorMessage(`[MR] list: ${msg}`);
              return [];
            }

            const {data: {list}} = resp;
            if (!list.length) {
              return [
                new ListItem(`0 merge requests in this category`, `noData`, vscode.TreeItemCollapsibleState.None),
              ];
            }

            const repoInfo = this._context.workspaceState.get(`repoInfo`) as RepoInfo;
            if (!repoInfo?.team) {
              throw new Error(`team not exist`);
            }

            return list.map((i: IMRData) => {
              return new MRItem(
                i.title,
                i,
                vscode.TreeItemCollapsibleState.Collapsed,
                this._context
              );
            });
          })
          .catch(() => {
            return [];
          });
      }
      case ItemType.MRItem: {
        return this._service.getMRDiff((element.value as IMRData).iid)
          .then(({data: {diffStat}}) => {
            return element.getChildren(diffStat);
          });
      }
      case ItemType.Node: {
        return element.getChildren();
      }
      default:
        return Promise.resolve([]);
    }
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

export class MRItem extends ListItem<IMRData> {
  contextValue = ItemType.MRItem;

  iconPath = {
    light: path.join(__filename, '../../../src/assets/star.light.svg'),
    dark: path.join(__filename, '../../../src/assets/star.dark.svg'),
  };

  constructor(
    public readonly label: string,
    public readonly value: IMRData,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly context: vscode.ExtensionContext,
  ) {
    super(label, value, collapsibleState);
  }

  async getChildren(diffStat: IMRDiffStat): Promise<ListItem<string | number | IFileNode>[]> {
    const files = this._transformTree(diffStat.paths);
    const repoInfo = this.context.workspaceState.get(`repoInfo`, {});
    const session = this.context.workspaceState.get(`session`, {} as SessionData);

    return [
      new ListItem(
        `Description`,
        `mr-desc`,
        vscode.TreeItemCollapsibleState.None,
        {
        command: 'codingPlugin.showDetail',
        title: `${this.value.iid} ${this.value.title}`,
        arguments: [{
          ...repoInfo,
          iid: this.value.iid,
          type: `mr`,
          accessToken: session?.accessToken,
        }],
      }),
      ...files.map(f => new FileNode(f.name, f, (f.children || [])?.length > 0 ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.None)),
    ];
  }

  private _transformTree(paths: IMRPathItem[]) {
    let nodes: IFileNode[] = [];
    paths.forEach(p => {
      nodes = this._makeTree(p, nodes);
    });

    return nodes;
  }

  private _makeTree(node: IFileNode, nodes: IFileNode[] = []) {
    const rawArr = node.path.split(`/`);

    rawArr.forEach((i, idx) => {
      const curPath = rawArr.slice(0, idx + 1).join(`/`);
      const parentPath = rawArr.slice(0, idx).join(`/`);
      const f = {...node, name: i, path: curPath, parentPath, children: []};
      nodes = this._insert(f, nodes);
    });

    return nodes;
  }

  private _insert(node: IFileNode, nodes: IFileNode[]) {
    const hasSameRootNode = nodes.find(i => i.path === node.path);

    for (const i of nodes) {
      if (i.parentPath === node.parentPath) {
        if (hasSameRootNode) {
          break;
        }

        nodes = nodes.concat(node);
      } else if (node.path === `${i.path}/${node.name}`) {
        const existed = i.children?.find(i => i.path === node.path);
        if (existed) {
          break;
        }

        i.children = (i.children || []).concat(node);
      } else {
        i.children = this._insert(node, i.children || []);
      }
    }

    if (!nodes.length && !node.parentPath) {
      nodes = nodes.concat(node);
    }

    return nodes;
  }
}

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
      return;
    }
    this.children = (this.value.children || [])?.map(f => new FileNode(f.name, f, (f.children || [])?.length > 0 ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.None));
  }

  async getChildren() {
    this.makeTree();
    return this.children;
  }

  getTreeItem(): ListItem<IFileNode | string> {
    return this;
  }
}


