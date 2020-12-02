import React, { useEffect } from 'react';

import { view } from '@risingstack/react-easy-state';
import appStore from './store/appStore';
import { formatMessage } from './utils/message';
import { webviewMsg, actions } from '../src/constants/message';

const vscode = acquireVsCodeApi();

function App() {
  const { currentMR, switchMR, setMRDetail } = appStore;

  useEffect(() => {
    window.addEventListener(`message`, async (ev) => {
      const { type, value } = ev.data;
      switch (type) {
        case actions.UPDATE_CURRENT_MR: {
          switchMR(value);
          break;
        }
        case actions.UPDATE_CURRENT_MR_DATA: {
          setMRDetail(value);
          break;
        }
        default:
          console.log(type, value);
          break;
      }
    });
  }, [switchMR, setMRDetail]);

  useEffect(() => {
    if (currentMR.iid !== undefined) {
      vscode.postMessage({
        command: webviewMsg.FETCH_MR_DETAIL,
        data: formatMessage(currentMR)
      });
    }
  }, [currentMR.iid]);

  return (
    <>
      <h2>#{currentMR?.iid || ``} {currentMR?.data?.merge_request?.title}</h2>
      <div>{JSON.stringify(currentMR)}</div>
    </>
  );
}

export default view(App);
