import { Event, Disposable, Uri } from 'vscode';
import { IRepoInfo } from 'src/typings/commonTypes';

export interface PromiseAdapter<T, U> {
  (value: T, resolve: (value: U | PromiseLike<U>) => void, reject: (reason: any) => void): any;
}

const passthrough = (value: any, resolve: (value?: any) => void) => resolve(value);

export async function promiseFromEvent<T, U>(
  event: Event<T>,
  adapter: PromiseAdapter<T, U> = passthrough,
): Promise<U> {
  let subscription: Disposable;
  return new Promise<U>(
    (resolve, reject) =>
      (subscription = event((value: T) => {
        try {
          Promise.resolve(adapter(value, resolve, reject)).catch(reject);
        } catch (error) {
          reject(error);
        }
      })),
  ).then(
    (result: U) => {
      subscription.dispose();
      return result;
    },
    (error) => {
      subscription.dispose();
      throw error;
    },
  );
}

export function parseQuery(uri: Uri) {
  return uri.query.split('&').reduce((prev: any, current) => {
    const queryString = current.split('=');
    prev[queryString[0]] = queryString[1];
    return prev;
  }, {});
}

export function parseCloneUrl(url: string): IRepoInfo | null {
  const reg = /^(https:\/\/|git@)e\.coding\.net(\/|:)(.*)\.git$/i;
  const result = url.match(reg);

  if (!result) {
    return null;
  }

  const str = result.pop();
  if (!str || !str?.includes(`/`)) {
    return null;
  }

  const [team, project, repo] = str.split(`/`);
  return { team, project, repo: repo || project };
}

export function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

const HunkRegExp = /@@.+@@/g;
export const isHunkLine = (hunk: string) => HunkRegExp.test(hunk);

export const getDiffLineNumber = (hunk: string) => {
  const matchedHunks = hunk.match(/[-+]\d+(,\d+)?/g) || [];
  return matchedHunks.map((i) => {
    const [start = 0, sum = 0] = i.match(/\d+/g)?.map((j) => +j) ?? [];
    const end = start + sum > 0 ? start + sum - 1 : 0;
    return [start, end];
  });
};
