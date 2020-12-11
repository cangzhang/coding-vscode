import React from 'react';
import styled from 'styled-components';

import EditIcon from 'webviews/assets/edit.svg';

const IconButton = styled.button`
  border: unset;
  background: unset;
  width: 20px;
  height: 20px;
  margin-left: 1ex;
  padding: 2px 0;
  vertical-align: middle;

  :hover {
    cursor: pointer;
  }

  :focus {
    outline: 1px solid var(--vscode-focusBorder);
    outline-offset: 2px;
  }

  svg path {
    fill: var(--vscode-foreground);
  }
`;

interface Props {
  onClick?: () => void;
}

const EditButton = ({ onClick = () => null }: Props) => {
  return (
    <IconButton onClick={onClick}>
      <EditIcon />
    </IconButton>
  );
};

export default EditButton;
