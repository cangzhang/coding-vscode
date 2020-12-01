import { store } from '@risingstack/react-easy-state';
import { IMRWebViewDetail } from '../../src/typings/commonTypes';
import { IMRDetail } from '../../src/typings/respResult';

const appStore = store({
  currentMR: {} as IMRWebViewDetail,
  switchMR(data: IMRWebViewDetail) {
    appStore.currentMR = data;
  },
  setMRDetail(data: IMRDetail) {
    appStore.currentMR.data = data;
  }
});

export default appStore;
