import React, { useEffect } from 'react';

import { view } from '@risingstack/react-easy-state';
import appStore from './store/appStore';
import { actions } from './store/constants';

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
          console.log(type, value);
          break;
      }
    });
  }, [updateCurrentMR]);

  if (!currentMR.iid) {
    return <div>Loading...</div>
  }

  return (
    <>
      <h2>#{currentMR?.iid || ``} {currentMR?.data?.title}</h2>
    </>
  );
}

export default view(App);
