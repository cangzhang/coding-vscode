import * as vscode from 'vscode';

import { ISessionData, IDiffFileData } from 'src/typings/commonTypes';
import { EmptyUserAvatar, MRUriScheme } from 'src/common/contants';
import { CodingServer } from 'src/codingServer';
import { IFileDiffParam } from 'src/typings/respResult';
import { getDiffLineNumber, isHunkLine } from 'src/common/utils';

let commentIdx = 0;
export class ReviewComment implements vscode.Comment {
  id: number;
  label: string | undefined;
  constructor(
    public body: string | vscode.MarkdownString,
    public mode: vscode.CommentMode,
    public author: vscode.CommentAuthorInformation,
    public parent?: vscode.CommentThread,
    public contextValue?: string,
    public commentId?: number,
  ) {
    this.id = commentId ?? ++commentIdx;
  }
}

export async function replyNote(
  reply: vscode.CommentReply,
  context: vscode.ExtensionContext,
  codingSrv: CodingServer,
  diffFileData: IDiffFileData,
) {
  const params = new URLSearchParams(decodeURIComponent(reply.thread.uri.query));
  const isRight = params.get('right') === `true`;
  const ident = `${params.get(`mr`)}/${params.get(`path`)}`;
  const diffFile = diffFileData[ident];

  const noteable_id = params.get('id') ?? ``; // mr index id
  const commitId = isRight ? params.get('rightSha') : params.get('leftSha');
  const content = reply.text;
  const noteable_type = `MergeRequestBean`;
  const change_type = isRight ? 1 : 2;
  const line = reply.thread.range.start.line + 1;
  const path = encodeURIComponent(params.get(`path`) || ``);
  const targetPos = diffFile.diffLines.find((i) => {
    return i[isRight ? `rightNo` : `leftNo`] === line;
  });
  const position = targetPos?.index ?? 0;

  try {
    const resp = await codingSrv.postLineNote({
      noteable_id,
      commitId: commitId ?? ``,
      content,
      noteable_type,
      change_type,
      line,
      path,
      position,
      anchor: `diff-${diffFile.pathMD5}`,
    });

    const curUser = context.workspaceState.get<ISessionData>(`session`);
    const commentAuthor: vscode.CommentAuthorInformation = curUser?.user
      ? {
          name: `${curUser.user.name} (${curUser.user.global_key})`,
          iconPath: vscode.Uri.parse(curUser.user.avatar, false),
        }
      : {
          name: `vscode user`,
          iconPath: vscode.Uri.parse(EmptyUserAvatar, false),
        };
    const thread = reply.thread;
    thread.contextValue = `editable`;
    const newComment = new ReviewComment(
      reply.text,
      vscode.CommentMode.Preview,
      commentAuthor,
      thread,
      thread.comments.length ? 'canDelete' : undefined,
      resp.data.id,
    );

    thread.comments = [...thread.comments, newComment];
  } catch (e) {}

  return `${params.get('mr')}/${path}`;
}

export const makeCommentRangeProvider = (
  codingSrv: CodingServer,
  diffFileData: IDiffFileData,
) => async (document: vscode.TextDocument, token: vscode.CancellationToken) => {
  if (document.uri.scheme !== MRUriScheme) {
    return [];
  }

  try {
    const params = new URLSearchParams(decodeURIComponent(document.uri.query));
    const mrId = params.get('id') || ``;
    let param: IFileDiffParam = {
      path: params.get('path') ?? ``,
      base: params.get('leftSha') ?? ``,
      compare: params.get('rightSha') ?? ``,
      mergeRequestId: mrId ?? ``,
    };
    const fileIdent = `${params.get(`mr`)}/${params.get(`path`)}`;

    const { data } = await codingSrv.fetchFileDiffs(param);
    diffFileData[fileIdent] = data;
    const { diffLines } = data;

    const ret = diffLines.reduce((result, i) => {
      const isHunk = isHunkLine(i.text);
      if (!isHunk) {
        return result;
      }

      const [left, right] = getDiffLineNumber(i.text);
      const [start, end] = params.get('right') === `true` ? right : left;
      if (start > 0) {
        result.push(new vscode.Range(start - 1, 0, end, 0));
      }
      return result;
    }, [] as vscode.Range[]);
    return ret;
  } catch (e) {
    console.error('fetch diff lines failed.');
    return [];
  }
};
