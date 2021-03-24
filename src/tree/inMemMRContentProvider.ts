'use strict';

import * as vscode from 'vscode';
import { CodingServer } from 'src/codingServer';

export class InMemMRContentProvider implements vscode.TextDocumentContentProvider {
  private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
  private _context: vscode.ExtensionContext;
  private _service: CodingServer;

  get onDidChange(): vscode.Event<vscode.Uri> {
    return this._onDidChange.event;
  }

  fireDidChange(uri: vscode.Uri) {
    this._onDidChange.fire(uri);
  }

  private _mrFileChangeContentProviders: {
    [key: number]: (uri: vscode.Uri) => Promise<string>;
  } = {};

  constructor(context: vscode.ExtensionContext, service: CodingServer) {
    this._context = context;
    this._service = service;
  }

  async provideTextDocumentContent(
    uri: vscode.Uri,
    token: vscode.CancellationToken,
  ): Promise<string> {
    const params = new URLSearchParams(decodeURIComponent(uri.query));
    const commit = params.get(`right`) === `true` ? params.get(`rightSha`) : params.get('leftSha');
    const path = params.get(`path`);
    return await this._service.getRemoteFileContent(`${commit}/${path}`);
  }

  registerTextDocumentContentProvider(
    mrNumber: number,
    provider: (uri: vscode.Uri) => Promise<string>,
  ): vscode.Disposable {
    this._mrFileChangeContentProviders[mrNumber] = provider;

    return {
      dispose: () => {
        delete this._mrFileChangeContentProviders[mrNumber];
      },
    };
  }
}

export function getInMemMRContentProvider(
  context: vscode.ExtensionContext,
  service: CodingServer,
): InMemMRContentProvider {
  return new InMemMRContentProvider(context, service);
}
