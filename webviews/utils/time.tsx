import React from 'react';
import dayjs from 'dayjs';

export const getTime = (time: number) => (
  <time title={dayjs(new Date(time)).format('llll')}>
    {dayjs(new Date(time)).format('YYYY-MM-DD HH:mm:ss')}
  </time>
);
