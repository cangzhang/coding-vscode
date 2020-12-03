import React, { useEffect } from 'react';
import styled from 'styled-components';

import { view } from '@risingstack/react-easy-state';
import appStore from 'webviews/store/appStore';
import { actions } from 'webviews/store/constants';
import persistDataHook from 'webviews/hooks/persistDataHook';

const LoadingWrapper = styled.div`
  font-size: 16px;
`;
const TitleWrapper = styled.div`
  font-size: 20px;
`;
const Row = styled.div`
  margin: 16px 0;
`;
const Desc = styled.article`
  border: 1px solid gray;
  padding: 10px;
`;

function App() {
  const { currentMR, updateCurrentMR } = appStore;

  useEffect(() => {
    window.addEventListener(`message`, async (ev) => {
      const { type, value } = ev.data;
      switch (type) {
        case actions.UPDATE_CURRENT_MR: {
          updateCurrentMR(value);
          break;
        }
        default:
          break;
      }
    });
  }, [updateCurrentMR]);

  persistDataHook();

  if (!currentMR.iid) {
    return <LoadingWrapper>Please select an merge request first.</LoadingWrapper>;
  }

  const { repoInfo, data } = currentMR;
  return (
    <div>
      <TitleWrapper>
        {data.title} (<a
        href={`https://${repoInfo.team}.coding.net/p/${repoInfo.project}/d/${repoInfo.repo}/git/merge/${currentMR.iid}`}>#{currentMR.iid}</a>)
      </TitleWrapper>
      <Row>
        <code>{data.srcBranch}</code> → <code>{data.desBranch}</code>
      </Row>
      <h3>Description:</h3>
      <Desc>
        <div dangerouslySetInnerHTML={{ __html: data.body }} />
      </Desc>
    </div>
  );
}

export default view(App);
