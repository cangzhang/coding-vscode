import * as React from 'react';
import styled from 'styled-components';
import { IMRDetailMR } from 'src/typings/respResult';

const AvatarImg = styled.img`
  width: 24px;
  height: 24px;
`;

export const Avatar = ({ for: author }: { for: Partial<IMRDetailMR['author']> }) => (
  <a href={author.avatar}>
    <AvatarImg src={author.avatar} alt='' />
  </a>
);

export const AuthorLink = ({ for: author }: { for: IMRDetailMR['author'] }) => (
  <a href={author.path}>{author.name}</a>
);
