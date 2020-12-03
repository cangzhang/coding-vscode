import * as vscode from 'vscode';
import * as cp from 'child_process';

import { Git, GitExtension } from 'src/typings/git';

export class GitService {
  static git: Git;

  static async init() {
    const extension = vscode.extensions.getExtension(
      `vscode.git`,
    ) as vscode.Extension<GitExtension>;
    if (extension !== undefined) {
      const gitExtension = extension.isActive ? extension.exports : await extension.activate();
      const model = gitExtension.getAPI(1);
      GitService.git = model.git;
    }
  }

  static async getRemoteURLs(): Promise<string[] | null> {
    try {
      if (!GitService.git || !vscode.workspace.workspaceFolders?.length) {
        return null;
      }

      const tasks = vscode.workspace.workspaceFolders.map(
        (f) =>
          new Promise((resolve) => {
            cp.exec(
              `${GitService.git.path} -C "${f.uri.path}" config --get remote.origin.url`,
              {
                cwd: f.uri.path,
              },
              (err, stdout, stderr) => {
                resolve({ stdout, stderr });
              },
            );
          }),
      );

      const result = await Promise.all(tasks);
      const urls = result.map((o) => {
        return (o as { stdout: string; stderr: string }).stdout?.trim();
      });

      return urls;
    } catch (err) {
      console.error(err);
    }

    return null;
  }
}
