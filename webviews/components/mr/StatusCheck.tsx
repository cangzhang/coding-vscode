import React, { useState } from 'react';
import styled from 'styled-components';

import { sleep } from 'webviews/utils/helper';
import { IMRStatus } from 'src/typings/respResult';
import { SectionTitle } from 'webviews/app.styles';
import RefreshIcon from 'webviews/assets/refresh.svg';
import IconButton from 'webviews/components/IconButton';

interface Props {
  data: IMRStatus | null;
  onRefresh: (...args: any[]) => Promise<any>;
}

const ListItem = styled.li`
  i {
    margin-left: 2ex;
  }
`;

function StatusCheck(props: Props) {
  const { data } = props;
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    if (refreshing) {
      return;
    }

    setRefreshing(true);
    // minimum 1s
    await Promise.allSettled([props.onRefresh, sleep(1000)]);
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
        {data?.statuses ? (
          data?.statuses.map((i) => {
            return (
              <ListItem key={i.context}>
                {i.context}
                <i>
                  <a href={i.target_url}>{i.description}</a>
                </i>
              </ListItem>
            );
          })
        ) : (
          <li>No related job found</li>
        )}
      </ul>
    </>
  );
}

export default StatusCheck;
