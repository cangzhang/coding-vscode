import React, { FormEvent, useRef, useState } from 'react';
import { view } from '@risingstack/react-easy-state';

import appStore from 'webviews/store/appStore';
import persistDataHook from 'webviews/hooks/persistDataHook';
import Activities from 'webviews/components/Activities';
import Reviewers from 'webviews/components/Reviewers';
import initDataHook from 'webviews/hooks/initDataHook';
import EditButton from 'webviews/components/EditButton';
// import { requestUpdateMRContent } from 'webviews/service/mrService';

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
  OperationBtn,
  SectionTitle,
} from 'webviews/app.styles';

function App() {
  const { currentMR, updateMRTitle, toggleUpdatingDesc, updateMRDesc } = appStore;
  const [isEditingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(currentMR?.data?.merge_request?.title);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [desc, setDesc] = useState(``);

  const { repoInfo, data } = currentMR;
  const { merge_request: mergeRequest } = data || {};

  persistDataHook();
  initDataHook();

  const handleKeyDown = async (event: any) => {
    if (event.key === 'Enter') {
      await updateMRTitle(title);
      setEditingTitle(false);
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
    setEditingTitle(true);
    inputRef.current?.focus();
  };

  const onEditDesc = () => {
    toggleUpdatingDesc(true);
    setDesc(currentMR.data.merge_request.body_plan);
  };

  const onChangeDesc = (ev: FormEvent<HTMLTextAreaElement>) => {
    setDesc(ev.currentTarget.value);
  };

  const onSaveDesc = async () => {
    await updateMRDesc(currentMR.iid, desc);
  };

  if (!currentMR.iid) {
    return <EmptyWrapper>Please select an merge request first.</EmptyWrapper>;
  }

  if (data?.loading) {
    return <EmptyWrapper>Loading...</EmptyWrapper>;
  }

  return (
    <div>
      <TitleWrapper>
        {isEditingTitle ? (
          <input
            type='text'
            value={title}
            ref={(ref) => (inputRef.current = ref)}
            onBlur={() => setEditingTitle(false)}
            onFocus={() => setEditingTitle(true)}
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
          <SectionTitle>
            Description
            {!currentMR.data.editingDesc && <EditButton onClick={onEditDesc} />}
            {currentMR.data.editingDesc && (
              <>
                <OperationBtn className={`colored`} onClick={onSaveDesc}>
                  Save
                </OperationBtn>
                <OperationBtn
                  className={`colored secondary`}
                  onClick={() => toggleUpdatingDesc(false)}>
                  Cancel
                </OperationBtn>
              </>
            )}
          </SectionTitle>
          {!currentMR.data.editingDesc && (
            <Desc>
              {mergeRequest?.body ? (
                <div dangerouslySetInnerHTML={{ __html: mergeRequest?.body }} />
              ) : (
                <Empty>This MR has no description.</Empty>
              )}
            </Desc>
          )}
          {currentMR.data.editingDesc && (
            <textarea
              name='desc'
              id='mr-desc'
              cols={30}
              rows={20}
              value={desc}
              onChange={onChangeDesc}
            />
          )}
          <SectionTitle>Activities</SectionTitle>
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
