import React from 'react';
import { view } from '@risingstack/react-easy-state';
import appStore from 'webviews/store/appStore';

import Activity from './Activity';
import Comment from './Comment';
import AddComment from './AddComment';
import { IActivity, IComment } from 'src/typings/respResult';

function Activities() {
  const { currentMR, activities, comments } = appStore;

  const renderActivity = (activity: [IActivity]) => {
    return (
      <div key={activity[0]?.id}>
        <Activity
          activity={activity[0]}
          srcBranch={currentMR.data.merge_request.srcBranch}
          desBranch={currentMR.data.merge_request.desBranch}
        />
      </div>
    );
  };

  const renderComment = (comment: [IComment]) => {
    return (
      <div key={comment[0]?.id}>
        <Comment comment={comment[0]} />
      </div>
    );
  };

  const allActivities = [...activities.map((i) => [i]), ...comments].sort(
    (a, b) => a[0]?.created_at - b[0]?.created_at,
  );

  if (!allActivities.length) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div>
        {allActivities.map((activity: any) => {
          if (activity[0]?.action) {
            return renderActivity(activity as [IActivity]);
          } else if (!activity[0]?.action) {
            return renderComment(activity as [IComment]);
          }
          return null;
        })}
      </div>
      <div>
        <AddComment />
      </div>
    </div>
  );
}

export default view(Activities);
