import * as React from 'react';
import styled from 'styled-components';
import { IMRDetailMR } from 'src/typings/respResult';

const Link = styled.a`
  position: relative;
  top: 2px;
`;
const AvatarImg = styled.img`
  width: 24px;
  height: 24px;
  border-radius: 50%;
`;

export const Avatar = ({ for: author = {} }: { for: Partial<IMRDetailMR['author']> }) => (
  <Link href={author?.avatar}>
    <AvatarImg src={author?.avatar} alt='' />
  </Link>
);

export const AuthorLink = ({ for: author }: { for: IMRDetailMR['author'] }) => (
  <a href={author?.path}>{author?.name}</a>
);
