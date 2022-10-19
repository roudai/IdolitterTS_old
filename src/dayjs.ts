import _dayjs from 'dayjs';

declare global {
  // eslint-disable-next-line no-var
  var dayjs: { dayjs: typeof _dayjs };
}
