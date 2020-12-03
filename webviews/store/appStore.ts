import { autoEffect, clearEffect, store } from '@risingstack/react-easy-state';
import { IMRWebViewDetail } from 'src/typings/commonTypes';

export const vscode = acquireVsCodeApi();

const appStore = store({
  currentMR: (vscode.getState()?.currentMR || {}) as IMRWebViewDetail,
  updateCurrentMR(data: IMRWebViewDetail) {
    appStore.currentMR = data;
  },
});

export const persistData = () =>
  autoEffect(() => {
    const p = vscode.getState();
    vscode.setState({
      ...p,
      currentMR: appStore.currentMR,
    });
  });
export const removeDataPersist = (e: () => void) => clearEffect(e);

export default appStore;
