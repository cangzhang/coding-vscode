import { useEffect } from 'react';
import appStore from 'webviews/store/appStore';
import { actions } from 'webviews/store/constants';
import { IMRContent } from 'src/typings/respResult';

export default function messageTransferHook() {
  useEffect(() => {
    window.addEventListener('message', (ev) => {
      const {
        updateCurrentMR,
        updateMRActivities,
        updateMRReviewers,
        updateMRComments,
        toggleMRLoading,
        updateMRDesc,
        toggleUpdatingDesc,
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
        case actions.MR_UPDATE_COMMENTS: {
          updateMRComments(res);
          break;
        }
        case actions.MR_UPDATE_REVIEWERS: {
          res && updateMRReviewers(res);
          break;
        }
        case actions.MR_UPDATE_DESC: {
          const [iid, resp] = res as [string, IMRContent];
          updateMRDesc(iid, resp);
          toggleUpdatingDesc();
          break;
        }
        case actions.MR_ADD_COMMENT: {
        }
        default:
          break;
      }
    });
  }, []);
}
