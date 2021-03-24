import * as vscode from 'vscode';
import { ISessionData } from 'src/typings/commonTypes';
import { EmptyUserAvatar } from 'src/common/contants';

let commentId = 1;

export class ReviewComment implements vscode.Comment {
  id: number;
  label: string | undefined;
  constructor(
    public body: string | vscode.MarkdownString,
    public mode: vscode.CommentMode,
    public author: vscode.CommentAuthorInformation,
    public parent?: vscode.CommentThread,
    public contextValue?: string,
  ) {
    this.id = ++commentId;
  }
}

export function replyNote(reply: vscode.CommentReply, context: vscode.ExtensionContext) {
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
  const params = new URLSearchParams(decodeURIComponent(thread.uri.query));
  const newComment = new ReviewComment(
    reply.text,
    vscode.CommentMode.Preview,
    commentAuthor,
    thread,
    thread.comments.length ? 'canDelete' : undefined,
  );
  // if (thread.contextValue === 'draft') {
  //   newComment.label = 'pending';
  // }

  thread.comments = [...thread.comments, newComment];
}
