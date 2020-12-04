import React, { useState } from 'react';
import { view } from '@risingstack/react-easy-state';
import appStore from 'webviews/store/appStore';
import styled from 'styled-components';

import { MERGE_STATUS } from 'webviews/constants/mergeRequest';

const ActionWrap = styled.div`
  margin-top: 10px;
  text-align: right;
  button {
    margin-right: 10px;
  }
  button:last-child {
    margin-right: 0;
  }
`;

function AddComment() {
  const { currentMR, reviewers, closeMR, approveMR, disapproveMR, mergeMR, commentMR } = appStore;
  const {
    data: { merge_request: mergeRequest, can_merge: canMerge },
    user,
  } = currentMR;

  const [isBusy, setBusy] = useState(false);
  const [comment, setComment] = useState<string>();

  const mrStatus = mergeRequest?.merge_status;
  const showCloseBtn =
    (canMerge || user?.id === mergeRequest?.author?.id) &&
    mrStatus !== MERGE_STATUS.REFUSED &&
    mrStatus !== MERGE_STATUS.ACCEPTED;
  const mrStatusOk = mrStatus === MERGE_STATUS.CANMERGE || mrStatus === MERGE_STATUS.CANNOTMERGE;
  const showMergeBtn = mrStatus === MERGE_STATUS.CANMERGE;
  const showAllowMergeBtn = mrStatusOk && mergeRequest?.author?.id !== user?.id;

  const getAgreed = () => {
    let agreed = true;
    const index = reviewers.reviewers.findIndex((r) => r.reviewer.id === user.id);

    if (index >= 0) {
      agreed = reviewers.reviewers[index].value === 100;
    } else {
      agreed = reviewers.volunteer_reviewers.findIndex((r) => r.reviewer.id === user.id) >= 0;
    }
    return agreed;
  };

  const submit = async (command: (body?: string) => Promise<any>) => {
    try {
      setBusy(true);
      await command(comment);
      setComment('');
    } finally {
      setBusy(false);
    }
  };

  const handleClick = (event: any) => {
    const { command } = event.target.dataset;
    submit({ closeMR, approveMR, disapproveMR, mergeMR, commentMR }[command]);
  };

  const handleCommentChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComment(event.target.value);
  };

  const renderActions = () => {
    return (
      <ActionWrap>
        {showAllowMergeBtn && !getAgreed() && (
          <button data-command='approveMR' onClick={handleClick} disabled={isBusy}>
            Approve
          </button>
        )}
        {showAllowMergeBtn && getAgreed() && (
          <button data-command='disapproveMR' onClick={handleClick} disabled={isBusy}>
            Disapprove
          </button>
        )}
        {showMergeBtn && (
          <button data-command='mergeMR' onClick={handleClick} disabled={isBusy}>
            Merge
          </button>
        )}
        {showCloseBtn && (
          <button data-command='closeMR' onClick={handleClick} disabled={isBusy}>
            Close Merge Request
          </button>
        )}
        <button data-command='commentMR' onClick={handleClick} disabled={isBusy || !comment}>
          Comment
        </button>
      </ActionWrap>
    );
  };

  return (
    <div>
      <textarea placeholder='Leave a comment' value={comment} onChange={handleCommentChange} />
      {renderActions()}
    </div>
  );
}

export default view(AddComment);
