import { useEffect } from 'react';
import appStore from 'webviews/store/appStore';
import { actions } from 'webviews/store/constants';

export default function messageTransferHook() {
  useEffect(() => {
    window.addEventListener('message', (ev) => {
      const {
        updateCurrentMR,
        updateMRActivities,
        updateMRReviewers,
        updateMRComments,
        toggleMRLoading,
      } = appStore;
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
        case actions.UPDATE_MR_ACTIVITIES: {
          updateMRActivities(res);
          break;
        }
        case actions.UPDATE_MR_REVIEWERS: {
          updateMRReviewers(res);
          break;
        }
        case actions.MR_UPDATE_COMMENTS: {
          updateMRComments(res);
          break;
        }
        default:
          break;
      }
    });
  }, []);
}
