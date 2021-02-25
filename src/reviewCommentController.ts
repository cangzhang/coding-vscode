import * as vscode from 'vscode';

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

export function replyNote(reply: vscode.CommentReply) {
  const thread = reply.thread;
  const newComment = new ReviewComment(
    reply.text,
    vscode.CommentMode.Preview,
    { name: 'vscode' },
    thread,
    thread.comments.length ? 'canDelete' : undefined,
  );
  if (thread.contextValue === 'draft') {
    newComment.label = 'pending';
  }

  thread.comments = [...thread.comments, newComment];
}
