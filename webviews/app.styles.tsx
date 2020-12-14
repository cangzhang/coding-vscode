import styled from 'styled-components';

import EditIcon from 'webviews/assets/edit.svg';

export const EmptyWrapper = styled.div`
  font-size: 16px;
`;
export const TitleWrapper = styled.div`
  display: flex;
  align-items: center;
  font-size: 20px;
  height: 38px;

  .edit {
    display: none;
  }

  &:hover .edit {
    display: block;
  }
`;
export const Row = styled.div`
  display: flex;
  align-items: center;
  margin: 16px 0 0;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--vscode-list-inactiveSelectionBackground);
`;
export const Desc = styled.article`
  border: 1px solid var(--vscode-list-inactiveSelectionBackground);
  padding: 10px;
`;
export const BodyWrap = styled.div`
  display: flex;
`;
export const Body = styled.div`
  flex: 1;
`;
export const Sidebar = styled.div`
  width: 200px;
  margin-left: 20px;
`;
export const EditBtn = styled(EditIcon)`
  width: 16px;
  height: 16px;
  margin-left: 10px;
  cursor: pointer;
`;
export const Empty = styled.div`
  text-align: center;
`;

export const BranchName = styled.code`
  margin: 0 1ex;
`;

export const OperationBtn = styled.button`
  margin-left: 1em;
`;

export const SectionTitle = styled.h3`
  line-height: 28px;
`;
