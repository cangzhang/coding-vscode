import React, { useCallback } from 'react';
import styled from 'styled-components';
import { view } from '@risingstack/react-easy-state';

import appStore from 'webviews/store/appStore';
import { Avatar, AuthorLink } from 'webviews/components/mr/User';
import EditButton from 'webviews/components/mr/EditButton';

const Title = styled.div`
  margin-top: 15px;
  font-size: 16px;
  font-weight: 600;
`;
const FlexCenter = styled.div`
  display: flex;
  align-items: center;
`;
const Reviewer = styled(FlexCenter)`
  padding: 5px 0;
  justify-content: space-between;

  a:first-child {
    margin-right: 5px;
  }
`;

function Reviewers() {
  const { reviewers, currentMR } = appStore;
  const { reviewers: rReviewers = [], volunteer_reviewers: volunteerReviewers = [] } = reviewers;
  const allReviewers = [...rReviewers, ...volunteerReviewers];
  const { updateReviewers } = appStore;

  const onUpdateReviewer = useCallback(() => {
    const list = allReviewers.map((i) => i.reviewer.id);
    updateReviewers(currentMR.iid, list, currentMR.data.merge_request.author.global_key);
  }, [allReviewers]);

  return (
    <div>
      <Title>
        Reviewers
        <EditButton onClick={onUpdateReviewer} />
      </Title>
      {allReviewers.map((r) => {
        return (
          <Reviewer key={r.reviewer.global_key}>
            <FlexCenter>
              <Avatar for={r.reviewer} />
              <AuthorLink for={r.reviewer} />
            </FlexCenter>
            {r.value === 100 && `👍`}
          </Reviewer>
        );
      })}
    </div>
  );
}

export default view(Reviewers);
