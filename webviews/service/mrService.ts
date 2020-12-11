import { vscode } from 'webviews/constants/vscode';
import { actions } from 'webviews/store/constants';

export const requestUpdateMRContent = async (iid: string, content: string) => {
  await vscode.postMessage({
    command: actions.MR_UPDATE_DESC,
    args: [iid, content],
  });
};
