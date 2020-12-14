import React from 'react';
import styled from 'styled-components';
import { IComment } from 'src/typings/respResult';
import { Avatar, AuthorLink } from './User';
import { getTime } from 'webviews/utils/time';

interface IProps {
  comment: IComment;
}

const Root = styled.p``;

const Header = styled.div`
  display: flex;
  align-items: center;
  border: 1px solid var(--vscode-list-inactiveSelectionBackground);
  background: var(--vscode-list-inactiveSelectionBackground);
  padding: 5px 10px;
`;
const AuthorLinkWrap = styled.div`
  margin-left: 5px;
`;
const Body = styled.div`
  padding: 10px;
  border: 1px solid var(--vscode-list-inactiveSelectionBackground);
  border-top: none;
`;
const Time = styled.div`
  margin-left: 15px;
`;

const ChildComment = styled.div`
  display: flex;
  align-items: center;
  border-top: 1px solid var(--vscode-list-inactiveSelectionBackground);
`;
const ChildCommentContent = styled.div`
  margin-left: 10px;
`;

function Comment({ comment }: IProps) {
  const renderChildComments = () => {
    return comment?.childComments?.map((c) => {
      return (
        <ChildComment key={c.id}>
          <AuthorLink for={c.author} />
          <ChildCommentContent>
            <div dangerouslySetInnerHTML={{ __html: c.content }} />
          </ChildCommentContent>
        </ChildComment>
      );
    });
  };

  return (
    <Root>
      <Header>
        <Avatar for={comment?.author} />{' '}
        <AuthorLinkWrap>
          <AuthorLink for={comment?.author} />
        </AuthorLinkWrap>
        <Time>commented at {getTime(comment?.created_at)}</Time>
      </Header>
      <Body>
        <div dangerouslySetInnerHTML={{ __html: comment?.content }} />
        {renderChildComments()}
      </Body>
    </Root>
  );
}

export default Comment;
