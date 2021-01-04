import React, { useState } from 'react';

import { IMRStatus } from 'src/typings/respResult';
import { SectionTitle } from 'webviews/app.styles';
import RefreshIcon from 'webviews/assets/refresh.svg';
import IconButton from 'webviews/components/IconButton';

interface Props {
  data: IMRStatus | null;
  onRefresh: () => Promise<any>;
}

function StatusCheck(props: Props) {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.allSettled([props.onRefresh]);
    setRefreshing(false);
  };

  return (
    <>
      <SectionTitle>
        Status Check
        <IconButton
          title={`Refresh`}
          width={14}
          height={14}
          rotate={refreshing}
          onClick={onRefresh}>
          <RefreshIcon />
        </IconButton>
      </SectionTitle>
      <ul>
        {props.data?.statuses.map((i) => {
          return (
            <li key={i.context}>
              {i.context}
              <i>{i.description}</i>
            </li>
          );
        })}
      </ul>
    </>
  );
}

export default StatusCheck;
