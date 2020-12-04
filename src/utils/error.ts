export const formatErrorMessage = (msg: string | Record<string, string>) => {
  if (typeof msg === 'string') return msg;
  return Object.values(msg).join();
};
