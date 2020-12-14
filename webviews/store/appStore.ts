import { autoEffect, clearEffect, store } from '@risingstack/react-easy-state';
import { IMRWebViewDetail } from 'src/typings/commonTypes';
import { IActivity, IReviewer, IComment } from 'src/typings/respResult';
import { vscode } from 'webviews/constants/vscode';
import { actions } from 'webviews/store/constants';
import { MERGE_STATUS } from 'webviews/constants/mergeRequest';
import { getMessageHandler } from 'webviews/utils/message';

interface IReviewers {
  volunteer_reviewers: IReviewer[];
  reviewers: IReviewer[];
}

const appStore = store({
  currentMR: (vscode.getState()?.currentMR || {}) as IMRWebViewDetail,
  activities: (vscode.getState()?.activities || []) as IActivity[],
  reviewers: (vscode.getState()?.reviewers || {
    volunteer_reviewers: [],
    reviewers: [],
  }) as IReviewers,
  comments: (vscode.getState()?.comments || []) as IComment[],
  updateCurrentMR(data: IMRWebViewDetail) {
    appStore.currentMR = data;
  },
  updateMRActivities(data: IActivity[]) {
    appStore.activities = data;
  },
  updateMRReviewers(data: IReviewers) {
    appStore.reviewers = data;
  },
  updateMRComments(data: IComment[]) {
    appStore.comments = data;
  },
  toggleMRLoading() {
    appStore.currentMR.data.loading = !appStore.currentMR.data.loading;
  },
  updateMRStatus(status: MERGE_STATUS) {
    appStore.currentMR.data.merge_request.merge_status = status;
  },
  async refreshMRActivities() {
    const result = await getMessageHandler(appStore.messageHandler)().postMessage({
      command: actions.MR_GET_ACTIVITIES,
      args: appStore.currentMR.iid,
    });
    appStore.activities = result;
    return result;
  },
  async closeMR() {
    const result = await getMessageHandler(appStore.messageHandler)().postMessage({
      command: actions.CLOSE_MR,
      args: appStore.currentMR.iid,
    });
    appStore.updateMRStatus(MERGE_STATUS.REFUSED);
    appStore.refreshMRActivities();
    return result;
  },
  async approveMR() {
    const result = await getMessageHandler(appStore.messageHandler)().postMessage({
      command: actions.MR_APPROVE,
      args: appStore.currentMR.iid,
    });
    const index = appStore.reviewers.reviewers.findIndex(
      (item) => item?.reviewer?.id === appStore.currentMR?.user?.id,
    );
    if (index >= 0) {
      appStore.reviewers.reviewers[index].value = 100;
    }
    appStore.refreshMRActivities();
    return result;
  },
  async disapproveMR() {
    const result = await getMessageHandler(appStore.messageHandler)().postMessage({
      command: actions.MR_DISAPPROVE,
      args: appStore.currentMR.iid,
    });
    const index = appStore.reviewers.reviewers.findIndex(
      (item) => item?.reviewer?.id === appStore.currentMR?.user?.id,
    );
    if (index >= 0) {
      appStore.reviewers.reviewers[index].value = 0;
    }
    appStore.refreshMRActivities();
    return result;
  },
  async mergeMR() {
    const result = await getMessageHandler(appStore.messageHandler)().postMessage({
      command: actions.MR_MERGE,
      args: appStore.currentMR.iid,
    });
    appStore.updateMRStatus(MERGE_STATUS.ACCEPTED);
    appStore.refreshMRActivities();
    return result;
  },
  async updateMRTitle(newTitle: string) {
    appStore.currentMR.data.merge_request.title = newTitle;
    const result = await getMessageHandler(appStore.messageHandler)().postMessage({
      command: actions.MR_UPDATE_TITLE,
      args: {
        iid: appStore.currentMR.iid,
        title: newTitle,
      },
    });
    appStore.refreshMRActivities();
    return result;
  },
  async commentMR(comment: string) {
    const result = await getMessageHandler(appStore.messageHandler)().postMessage({
      command: actions.MR_ADD_COMMENT,
      args: {
        id: appStore.currentMR.data.merge_request.id,
        comment,
      },
    });
    appStore.comments.push([result] as any);
    return result;
  },
  async updateReviewers(iid: string, list: number[]) {
    const result = await getMessageHandler(appStore.messageHandler)().postMessage({
      command: actions.MR_UPDATE_REVIEWERS,
      args: [iid, list],
    });
    return result;
  },
  toggleUpdatingDesc(status?: boolean) {
    if (typeof status === `undefined`) {
      appStore.currentMR.data.editingDesc = !appStore.currentMR.data.editingDesc;
    } else {
      appStore.currentMR.data.editingDesc = status;
    }
  },
  async updateMRDesc(iid: string, content: string) {
    if (iid !== appStore.currentMR.iid) {
      return;
    }

    appStore.toggleUpdatingDesc(true);
    const resp = await getMessageHandler(appStore.messageHandler)().postMessage({
      command: actions.MR_UPDATE_DESC,
      args: {
        iid,
        content,
      },
    });

    appStore.currentMR.data.merge_request.body = resp.body;
    appStore.currentMR.data.merge_request.body_plan = resp.body_plan;
    appStore.toggleUpdatingDesc(false);
  },
  addComment(comment: IComment) {
    appStore.comments.push(comment);
  },
  messageHandler(message: any) {
    const { updateMRActivities, updateMRReviewers, updateMRComments } = appStore;
    const { command, res } = message;

    switch (command) {
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
      case actions.MR_ADD_COMMENT: {
      }
      default:
        break;
    }
  },
});

export const persistData = () =>
  autoEffect(() => {
    const p = vscode.getState();
    vscode.setState({
      ...p,
      currentMR: appStore.currentMR,
      activities: appStore.activities,
      reviewers: appStore.reviewers,
    });
  });
export const removeDataPersist = (e: () => void) => clearEffect(e);

export default appStore;
