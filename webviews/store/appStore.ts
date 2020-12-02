import { store } from '@risingstack/react-easy-state';
import { IMRWebViewDetail } from '../../src/typings/commonTypes';

const appStore = store({
  currentMR: {} as IMRWebViewDetail,
  updateCurrentMR(data: IMRWebViewDetail) {
    appStore.currentMR = data;
  },
});

export default appStore;
