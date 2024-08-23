import { AxiosRequestConfig } from 'axios';

export type AtcClientJob = {
  endpoint: string;
  params?: any;
  method: AxiosRequestConfig['method'];
};
