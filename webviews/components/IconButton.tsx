import React from 'react';
import styled, { css, keyframes } from 'styled-components';

interface Props {
  onClick?: () => void;
  children: React.ReactElement;
  title?: string;
  width?: number;
  height?: number;
  rotate?: boolean;
}

const rotate = keyframes`
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
`;

const Button = styled(({ height, width, rotate, ...rest }: Props) => <button {...rest} />)`
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

  svg {
    width: ${(props: Props) => props.height || 16}px;
    height: ${(props: Props) => props.width || 16}px;
    overflow: hidden;
    animation: ${(props: Props) =>
      props.rotate
        ? css`
            ${rotate} 2s linear infinite
          `
        : css``};
  }

  svg path {
    fill: var(--vscode-foreground);
  }
`;

const IconButton = ({
  onClick = () => null,
  children,
  title = ``,
  width,
  height,
  rotate = false,
}: Props) => {
  return (
    <Button title={title} width={width} height={height} rotate={rotate} onClick={onClick}>
      {children}
    </Button>
  );
};

export default IconButton;
