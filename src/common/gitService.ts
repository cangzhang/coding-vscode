import * as vscode from 'vscode';
import * as cp from 'child_process';
import { promisify } from 'util';

import { GitExtension } from '../typings/git';

const exec = promisify(cp.exec);

export class GitService {
  static async getRemoteURLs(): Promise<string[] | null> {
    try {
      const extension = vscode.extensions.getExtension(`vscode.git`) as vscode.Extension<GitExtension>;
      if (extension !== undefined) {
        const gitExtension = extension.isActive ? extension.exports : await extension.activate();
        const model = gitExtension.getAPI(1);

        if (vscode.workspace.workspaceFolders?.length) {
          const tasks = vscode.workspace.workspaceFolders.map(f =>
            exec(`${model.git.path} config --get remote.origin.url`, {
              cwd: f.uri.path,
            }));
          const result = await Promise.all(tasks);
          const urls = result.map(({ stdout, stderr }) => {
            return stdout.trim();
          });

          return urls;
        }
      }
    } catch (err) {
      console.error(err);
    }

    return null;
  }
}
