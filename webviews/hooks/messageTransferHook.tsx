import { useEffect } from 'react';
import appStore from 'webviews/store/appStore';
import { actions } from 'webviews/store/constants';

export default function messageTransferHook() {
  useEffect(() => {
    window.addEventListener('message', (ev) => {
      const { updateCurrentMR, toggleMRLoading } = appStore;
      const { command, res } = ev?.data;

      switch (command) {
        case actions.MR_TOGGLE_LOADING: {
          toggleMRLoading();
          break;
        }
        case actions.UPDATE_CURRENT_MR: {
          updateCurrentMR(res);
          break;
        }
        default:
          break;
      }
    });
  }, []);
}
