import React from 'react';
import styled from 'styled-components';
import { view } from '@risingstack/react-easy-state';
import appStore from 'webviews/store/appStore';
import { Avatar, AuthorLink } from 'webviews/components/User';

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
  a:first-child {
    margin-right: 5px;
  }
`;
const Icon = styled.div`
  width: 16px;
  height: 16px;
  position: relative;
  top: 4px;
`;

function Reviewers() {
  const { reviewers } = appStore;
  const { reviewers: rReviewers = [], volunteer_reviewers: volunteerReviewers = [] } = reviewers;
  const allReviewers = [...rReviewers, ...volunteerReviewers];

  return (
    <div>
      <Title>Reviewers</Title>
      {allReviewers.map((r) => {
        return (
          <Item>
            <FlexCenter>
              <Avatar for={r.reviewer} />
              <AuthorLink for={r.reviewer} />
            </FlexCenter>
            {r.value === 100 && (
              <Icon>
                <span dangerouslySetInnerHTML={{ __html: require('../assets/check.svg') }} />
              </Icon>
            )}
          </Item>
        );
      })}
    </div>
  );
}

export default view(Reviewers);
