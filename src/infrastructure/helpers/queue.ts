import { isAxiosError } from 'axios';

import { TOO_MANY_REQUESTS_CODE } from '../constants/petitions';

export const isApiLimitReached = (error: any) =>
  isAxiosError(error) && error?.response?.status === TOO_MANY_REQUESTS_CODE;
