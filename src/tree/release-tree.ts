import * as vscode from 'vscode';
import * as path from 'path';

enum ItemType {
  ListItem = `listItem`,
  FolderITem = `folderItem`,
  CategoryItem = `categoryItem`,
}

export class ReleaseTreeDataProvider implements vscode.TreeDataProvider<ListItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<ListItem | undefined | void> = new vscode.EventEmitter<ListItem | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<ListItem | undefined | void> = this._onDidChangeTreeData.event;

  private _context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this._context = context;
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

    return Promise.resolve([
      new ListItem(`//TODO`, `noData`, vscode.TreeItemCollapsibleState.None),
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
