import React, { useEffect } from 'react';

import { view } from '@risingstack/react-easy-state';
import appStore from './store/appStore';
import { actions } from './store/constants';
import { fetchMRDetail } from './service';

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
        default:
          console.log(type, value);
          break;
      }
    });
  }, [switchMR]);

  useEffect(() => {
    fetchMRDetail(currentMR.repoInfo, currentMR.iid, currentMR.accessToken).then(r => {
      setMRDetail(r.merge_request);
    });
  }, [currentMR.iid]);

  return (
    <>
      <h2>#{currentMR?.iid || ``} {currentMR?.data?.title}</h2>
    </>
  );
}

export default view(App);
