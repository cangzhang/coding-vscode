import React from 'react';
import styled from 'styled-components';
import { view } from '@risingstack/react-easy-state';
import appStore from 'webviews/store/appStore';
import { getTime } from 'webviews/utils/time';
import { ACTIVITY_TYPE } from 'webviews/constants/activity';
import { IActivity } from 'src/typings/respResult';

interface IProps {
  activity: IActivity;
  srcBranch: string;
  desBranch: string;
}

const Time = styled.span`
  margin-left: 20px;
`;
const ActionDesc = styled.span`
  margin-left: 1ex;
  margin-right: 1ex;
`;

function Activity({ activity, srcBranch, desBranch }: IProps) {
  const { currentMR } = appStore;
  const { repoInfo } = currentMR;

  const { action } = activity;
  if (!ACTIVITY_TYPE[action]) {
    return null;
  }

  const pathForTargetResource = (action: string, path: string) => {
    if (
      action !== 'add_extlink_ref' &&
      action !== 'add_external_extlink_ref' &&
      action !== 'del_extlink_ref' &&
      action !== 'del_external_extlink_ref'
    ) {
      return path;
    }

    const regex = new RegExp('^(http|https|mailto|ftp)', 'i');
    if (regex.test(path)) {
      return path;
    }
    return `http://${path}`;
  };

  const renderDesc = (info: any, action: string) => {
    if (info.reviewer) return info.reviewer.name;
    if (info.watcher) return info.watcher.name;
    if (info.label) {
      const labelObj = JSON.parse(info.label);
      return labelObj.name;
    }

    if (info.internal_resource) {
      const url = pathForTargetResource(action, info.internal_resource.path);
      return <a href={url}>{info.internal_resource.name}</a>;
    }

    if (info.external_resource) {
      return (
        <span>
          <a href={info.external_resource.project_path}>
            {info.external_resource.project_display_name || info.external_resource.project_name}
          </a>{' '}
          <span>{info.external_resource.conj}</span>{' '}
          <a href={pathForTargetResource(action, info.external_resource.path)}>
            {info.external_resource.name}
          </a>
        </span>
      );
    }
  };

  const authorUrl = `https://${repoInfo.team}.coding.net${activity.author.path}`;

  return (
    <div>
      {ACTIVITY_TYPE[action].icon}
      <div>
        <p>
          <a href={authorUrl}>{activity.author.name}</a>{' '}
          <ActionDesc>{ACTIVITY_TYPE[action].text}</ActionDesc>
          {(action === 'del_source_branch' || action === 'restore_source_branch') && (
            <span>{srcBranch}</span>
          )}
          {(action === 'del_target_branch' || action === 'restore_target_branch') && (
            <span>{desBranch}</span>
          )}
          <span>
            {renderDesc(activity.comment || {}, action)}
            <Time>{getTime(activity.created_at)}</Time>
          </span>
        </p>
      </div>
    </div>
  );
}

export default view(Activity);
