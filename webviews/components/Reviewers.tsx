import React from 'react';
import styled from 'styled-components';
import { view } from '@risingstack/react-easy-state';

import appStore from 'webviews/store/appStore';
import { Avatar, AuthorLink } from 'webviews/components/User';
import PlusIcon from 'webviews/assets/plus.svg';
import CheckIcon from 'webviews/assets/check.svg';
import DeleteIcon from 'webviews/assets/delete.svg';

const Title = styled.div`
  margin-top: 15px;
  font-size: 16px;
  font-weight: 600;
`;
const FlexCenter = styled.div`
  display: flex;
  align-items: center;
`;
const Item = styled(FlexCenter)`
  padding: 5px 0;
  justify-content: space-between;

  :hover {
    cursor: pointer;
  }

  a:first-child {
    margin-right: 5px;
  }
`;
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
const Check = styled(CheckIcon)`
  svg path {
    fill: var(--vscode-button-background);
  }
`;

function Reviewers() {
  const { reviewers } = appStore;
  const { reviewers: rReviewers = [], volunteer_reviewers: volunteerReviewers = [] } = reviewers;
  const allReviewers = [...rReviewers, ...volunteerReviewers];
  const { addReviewers } = appStore;

  return (
    <div>
      <Title>
        Reviewers
        <IconButton onClick={addReviewers}>
          <PlusIcon />
        </IconButton>
      </Title>
      {allReviewers.map((r) => {
        return (
          <Item key={r.reviewer.global_key}>
            <FlexCenter>
              <Avatar for={r.reviewer} />
              <AuthorLink for={r.reviewer} />
            </FlexCenter>
            {r.value === 100 && <Check />}
            <IconButton>
              <DeleteIcon />
            </IconButton>
          </Item>
        );
      })}
    </div>
  );
}

export default view(Reviewers);
