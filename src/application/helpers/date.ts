import { parse } from 'date-fns';

import { DATE_HOUR_FORMAT } from '../../infrastructure/constants/date';

export const parseSlotDatetime = (datetime: string): Date => {
  return parse(datetime, DATE_HOUR_FORMAT, new Date());
};
