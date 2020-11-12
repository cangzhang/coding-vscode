import got from 'got';

const instance = got.extend({
  resolveBodyOnly: true,
});

export default instance;
