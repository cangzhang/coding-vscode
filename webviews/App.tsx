import React, { useRef, useState } from 'react';

import { view } from '@risingstack/react-easy-state';
import appStore from 'webviews/store/appStore';
import persistDataHook from 'webviews/hooks/persistDataHook';
import Activities from 'webviews/components/Activities';
import Reviewers from 'webviews/components/Reviewers';
import messageTransferHook from 'webviews/hooks/messageTransferHook';
import {
  EmptyWrapper,
  TitleWrapper,
  Row,
  Desc,
  BodyWrap,
  Body,
  Sidebar,
  Empty,
  BranchName,
  EditBtn,
} from 'webviews/styles/MROverview';

function App() {
  const { currentMR, updateMRTitle } = appStore;
  const [isEditing, setEditing] = useState(false);
  const [title, setTitle] = useState(currentMR?.data?.merge_request?.title);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { repoInfo, data } = currentMR;
  const { merge_request: mergeRequest } = data || {};

  persistDataHook();
  messageTransferHook();

  const handleKeyDown = async (event: any) => {
    if (event.key === 'Enter') {
      await updateMRTitle(title);
      setEditing(false);
    }
  };

  const handleTitleChange = (event: any) => {
    const { value } = event.target;
    if (!value) {
      setTitle(mergeRequest?.title);
    } else {
      setTitle(value);
    }
  };

  const handleEdit = () => {
    setEditing(true);
    inputRef.current?.focus();
  };

  if (!currentMR.iid) {
    return <EmptyWrapper>Please select an merge request first.</EmptyWrapper>;
  }

  if (data.loading) {
    return <EmptyWrapper>Loading...</EmptyWrapper>;
  }

  return (
    <div>
      <TitleWrapper>
        {isEditing ? (
          <input
            type='text'
            value={title}
            ref={(ref) => (inputRef.current = ref)}
            onBlur={() => setEditing(false)}
            onFocus={() => setEditing(true)}
            onKeyDown={handleKeyDown}
            onChange={handleTitleChange}
          />
        ) : (
          <>
            {mergeRequest?.title} (
            <a
              href={`https://${repoInfo.team}.coding.net/p/${repoInfo.project}/d/${repoInfo.repo}/git/merge/${currentMR.iid}`}>
              #{currentMR.iid}
            </a>
            )
            <EditBtn onClick={handleEdit} />
          </>
        )}
      </TitleWrapper>
      <Row>
        <div id='status'>{mergeRequest?.merge_status}</div>
        <BranchName>{mergeRequest?.srcBranch}</BranchName>→
        <BranchName>{mergeRequest?.desBranch}</BranchName>
      </Row>
      <BodyWrap>
        <Body>
          <h3>Description</h3>
          <Desc>
            {mergeRequest?.body ? (
              <div dangerouslySetInnerHTML={{ __html: mergeRequest?.body }} />
            ) : (
              <Empty>Empty</Empty>
            )}
          </Desc>
          <h3>Activities</h3>
          <Activities />
        </Body>
        <Sidebar>
          <Reviewers />
        </Sidebar>
      </BodyWrap>
    </div>
  );
}

export default view(App);
