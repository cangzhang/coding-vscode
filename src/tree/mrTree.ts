import * as vscode from 'vscode';
import { TreeItemCollapsibleState } from 'vscode';
import * as path from 'path';

import { CodingServer } from 'src/codingServer';
import { IRepoInfo, ISessionData, GitChangeType } from 'src/typings/commonTypes';
import { IMRDiffStat, IMRData, IMRPathItem } from 'src/typings/respResult';
import { getInMemMRContentProvider } from './inMemMRContentProvider';
import { MRUriScheme } from 'src/common/contants';

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

const capitalized = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

const getIcon = (name: string, theme: string) =>
  path.join(__filename, `../../../assets/${theme}/${name}.png`);

const FileModeIcons: {
  [key: string]: { light: string | vscode.Uri; dark: string | vscode.Uri };
} = {
  [GitChangeType.MODIFY]: {
    dark: getIcon(`icon_m`, `dark`),
    light: getIcon(`icon_m`, `light`),
  },
  [GitChangeType.ADD]: {
    dark: getIcon(`icon_a`, `dark`),
    light: getIcon(`icon_a`, `light`),
  },
  [GitChangeType.DELETE]: {
    dark: getIcon(`icon_d`, `dark`),
    light: getIcon(`icon_d`, `light`),
  },
};

export interface IFileNode extends IMRPathItem {
  parentPath?: string;
  children?: IFileNode[];
  newSha?: string;
  oldSha?: string;
}

type ITreeNode = string | number | IMRDiffStat | IFileNode | IMRData;

export class MRTreeDataProvider implements vscode.TreeDataProvider<ListItem<ITreeNode>> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    ListItem<ITreeNode> | undefined | void
  > = new vscode.EventEmitter<ListItem<ITreeNode> | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<ListItem<ITreeNode> | undefined | void> = this
    ._onDidChangeTreeData.event;
  private _disposables: vscode.Disposable[];

  private _context: vscode.ExtensionContext;
  private readonly _service: CodingServer;

  constructor(context: vscode.ExtensionContext, service: CodingServer) {
    this._context = context;
    this._service = service;

    this._disposables = [];
    this._disposables.push(
      vscode.workspace.registerTextDocumentContentProvider(
        MRUriScheme,
        getInMemMRContentProvider(context, this._service),
      ),
    );
  }

  public refresh(): any {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: ListItem<ITreeNode>): vscode.TreeItem {
    return element;
  }

  getChildren(element?: ListItem<ITreeNode>): Thenable<ListItem<ITreeNode>[]> {
    if (!this._service.loggedIn) {
      console.error(`[MR Tree] Invalid credentials.`);
      return Promise.resolve([]);
    }

    const repoInfo = this._context.workspaceState.get(`repoInfo`) as IRepoInfo;
    if (!repoInfo?.team) {
      throw new Error(`team not exist.`);
    }

    if (!element) {
      return Promise.resolve([
        new CategoryItem(capitalized(MRType.Open), MRType.Open, TreeItemCollapsibleState.Collapsed),
        new CategoryItem(
          capitalized(MRType.Closed),
          MRType.Closed,
          TreeItemCollapsibleState.Collapsed,
        ),
        new CategoryItem(capitalized(MRType.All), MRType.All, TreeItemCollapsibleState.Collapsed),
      ]);
    }

    switch (element.contextValue) {
      case ItemType.CategoryItem: {
        return this._service
          .getMRList(``, element.value as MRType)
          .then((resp) => {
            if (resp.code) {
              const msg = Object.values(resp.msg || {})[0];
              console.error(`[MR] list: ${msg}`);
              return [];
            }

            const {
              data: { list },
            } = resp;
            if (!list.length) {
              return [
                new ListItem(
                  `0 merge requests in this category`,
                  `noData`,
                  TreeItemCollapsibleState.None,
                ),
              ];
            }

            const repoInfo = this._context.workspaceState.get(`repoInfo`) as IRepoInfo;
            if (!repoInfo?.team) {
              throw new Error(`team not exist`);
            }

            return list.map((i: IMRData) => {
              return new MRItem(i.title, i, TreeItemCollapsibleState.Collapsed, this._context);
            });
          })
          .catch(() => {
            return [];
          });
      }
      case ItemType.MRItem: {
        return this._service
          .getMRDiff((element.value as IMRData).iid)
          .then(({ data: { diffStat } }) => {
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

  dispose() {
    this._disposables.forEach((dispose) => dispose.dispose());
  }
}

export class ListItem<T> extends vscode.TreeItem {
  contextValue = ItemType.ListItem;

  constructor(
    public readonly label: string,
    public readonly value: T,
    public readonly collapsibleState: TreeItemCollapsibleState,
    public readonly command?: vscode.Command,
    public readonly iconPath?:
      | string
      | vscode.Uri
      | { light: string | vscode.Uri; dark: string | vscode.Uri }
      | vscode.ThemeIcon,
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

  constructor(
    public readonly label: string,
    public readonly value: IMRData,
    public readonly collapsibleState: TreeItemCollapsibleState,
    public readonly context: vscode.ExtensionContext,
  ) {
    super(label, value, collapsibleState, undefined, vscode.Uri.parse(value.author.avatar));
  }

  async getChildren(diffStat: IMRDiffStat): Promise<ListItem<string | number | IFileNode>[]> {
    const files = this._transformTree(diffStat);
    const repoInfo = this.context.workspaceState.get(`repoInfo`, {});
    const session = this.context.workspaceState.get(`session`, {}) as ISessionData;

    return [
      new ListItem(
        `Description`,
        `mr-desc`,
        TreeItemCollapsibleState.None,
        {
          command: 'codingPlugin.showMROverview',
          title: `${this.value.iid} ${this.value.title}`,
          arguments: [
            {
              type: `mr`,
              iid: this.value.iid,
              repoInfo,
              accessToken: session?.accessToken,
            },
          ],
        },
        new vscode.ThemeIcon(`git-pull-request`),
      ),
      ...files.map(
        (f) =>
          new FileNode(
            f.name,
            f,
            (f.children || [])?.length > 0
              ? TreeItemCollapsibleState.Expanded
              : TreeItemCollapsibleState.None,
            this.value,
          ),
      ),
    ];
  }

  private _transformTree(diff: IMRDiffStat) {
    let nodes: IFileNode[] = [];
    diff.paths.forEach((p) => {
      nodes = this._makeTree({ ...p, newSha: diff.newSha, oldSha: diff.oldSha }, nodes);
    });

    return nodes;
  }

  private _makeTree(node: IFileNode, nodes: IFileNode[] = []) {
    const rawArr = node.path.split(`/`);

    rawArr.forEach((i, idx) => {
      const curPath = rawArr.slice(0, idx + 1).join(`/`);
      const parentPath = rawArr.slice(0, idx).join(`/`);
      const f = { ...node, name: i, path: curPath, parentPath, children: [] };
      nodes = this._insert(f, nodes);
    });

    return nodes;
  }

  private _insert(node: IFileNode, nodes: IFileNode[]) {
    for (const i of nodes) {
      if (i.parentPath === node.parentPath) {
        const hasSameParentNode = nodes.find((j) => j.path === node.path);
        if (hasSameParentNode) {
          break;
        }

        nodes = nodes.concat(node);
      } else if (node.path === `${i.path}/${node.name}`) {
        const existed = i.children?.find((i) => i.path === node.path);
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
    public readonly collapsibleState: TreeItemCollapsibleState,
    public readonly mrData: IMRData,
  ) {
    super(
      label,
      value,
      collapsibleState,
      collapsibleState === TreeItemCollapsibleState.None
        ? {
            command: `codingPlugin.showDiff`,
            title: ``,
            arguments: [value, mrData],
          }
        : undefined,
      FileNode.getFileIcon(value.changeType, collapsibleState),
    );
  }

  static getFileIcon(changeType: GitChangeType, collapsibleState: TreeItemCollapsibleState) {
    if (collapsibleState !== TreeItemCollapsibleState.None) {
      return undefined;
    }

    return FileModeIcons[changeType];
  }

  public makeTree() {
    if (this.collapsibleState === TreeItemCollapsibleState.None) {
      return;
    }
    this.children = (this.value.children || [])?.map(
      (f) =>
        new FileNode(
          f.name,
          f,
          (f.children || [])?.length > 0
            ? TreeItemCollapsibleState.Expanded
            : TreeItemCollapsibleState.None,
          this.mrData,
        ),
    );
  }

  async getChildren() {
    this.makeTree();
    return this.children;
  }

  getTreeItem(): ListItem<IFileNode | string> {
    return this;
  }
}
