import { useEffect } from 'react';
import appStore from 'webviews/store/appStore';
import { actions } from 'webviews/store/constants';

export default function initDataHook() {
  useEffect(() => {
    window.addEventListener('message', (ev) => {
      const { updateCurrentMR, toggleMRLoading, initMRReviewers, initMRActivities } = appStore;
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
        case actions.MR_REVIEWERS_INIT: {
          initMRReviewers(res);
          break;
        }
        case actions.MR_ACTIVITIES_INIT: {
          initMRActivities(res);
          break;
        }
        default:
          break;
      }
    });
  }, []);
}
