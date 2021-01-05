import React from 'react';

import EditIcon from 'webviews/assets/edit.svg';
import IconButton from 'webviews/components/IconButton';

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
