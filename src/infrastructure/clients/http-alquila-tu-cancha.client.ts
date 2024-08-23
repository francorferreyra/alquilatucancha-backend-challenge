import { HttpService } from '@nestjs/axios';
import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosRequestConfig } from 'axios';
import { Job, Queue } from 'bull';
import { formatDate } from 'date-fns';

import { DATE_FORMAT } from '../constants/date';
import { GET } from '../constants/petitions';
import { ATC_CLIENT_JOB, ATC_CLIENT_QUEUE } from '../constants/queue';
import { isApiLimitReached } from '../helpers/queue';
import { IAlquilaTuCanchaClient } from '../interfaces/aquila-tu-cancha.client';
import { AtcClientJob } from '../models/atc-client-job.model';
import { Club } from '../models/club';
import { Court } from '../models/court';
import { Slot } from '../models/slot';
import { Zone } from '../models/zone';
@Injectable()
export class HTTPAlquilaTuCanchaClient implements IAlquilaTuCanchaClient {
  private readonly base_url: string;
  private readonly api: HttpService['axiosRef'];
  private readonly logger = new Logger(HTTPAlquilaTuCanchaClient.name);

  constructor(
    private httpService: HttpService,
    config: ConfigService,
    @InjectQueue(ATC_CLIENT_QUEUE)
    private readonly apiQueue: Queue<AtcClientJob>,
  ) {
    this.base_url = config.get<string>('ATC_BASE_URL', 'http://localhost:4000');

    this.httpService.axiosRef.defaults.baseURL = this.base_url;

    this.api = this.httpService.axiosRef;
  }

  async createJob(params: AtcClientJob): Promise<Job<AtcClientJob>> {
    return await this.apiQueue.add(ATC_CLIENT_JOB, params);
  }

  // Error propagation must be managed from domain
  handleErrror(error: any) {
    this.logger.fatal(error);
    throw error;
  }

  async getClubs(placeId: string): Promise<Club[] | undefined> {
    const endpoint = `${this.base_url}/clubs`;
    const params: AxiosRequestConfig['params'] = { placeId };

    try {
      const { data: clubs } = await this.api.get<Club[]>(endpoint, { params });

      return clubs;
    } catch (error) {
      if (isApiLimitReached(error)) {
        const job = await this.createJob({ endpoint, params, method: GET });

        const clubs = await job.finished();

        return clubs;
      }

      this.handleErrror(error);
    }
  }

  async getCourts(clubId: number): Promise<Court[] | undefined> {
    const endpoint = `${this.base_url}/clubs/${clubId}/courts`;
    const params: AxiosRequestConfig['params'] = { clubId };
    try {
      const { data: courts } = await this.api.get<Court[]>(endpoint, {
        params,
      });

      return courts;
    } catch (error) {
      if (isApiLimitReached(error)) {
        const job = await this.createJob({
          endpoint,
          params,
          method: GET,
        });

        const courts = await job.finished();

        return courts;
      }

      this.handleErrror(error);
    }
  }

  async getAvailableSlots(
    clubId: number,
    courtId: number,
    date: Date,
  ): Promise<Slot[] | undefined> {
    const endpoint = `${this.base_url}/clubs/${clubId}/courts/${courtId}/slots`;

    const params: AxiosRequestConfig['params'] = {
      date: formatDate(date, DATE_FORMAT),
    };

    try {
      const { data: slots } = await this.api.get<Slot[]>(endpoint, { params });

      return slots;
    } catch (error) {
      if (isApiLimitReached(error)) {
        const job = await this.createJob({
          endpoint,
          params,
          method: GET,
        });

        const slots = await job.finished();

        return slots;
      }

      this.handleErrror(error);
    }
  }

  async getClubById(clubId: number): Promise<Club | undefined> {
    const endpoint = `${this.base_url}/clubs/${clubId}`;

    try {
      const { data: club } = await this.api.get<Club>(endpoint);

      return club;
    } catch (error) {
      if (isApiLimitReached(error)) {
        const job = await this.createJob({
          endpoint,
          method: GET,
        });

        const club = await job.finished();

        return club;
      }

      this.handleErrror(error);
    }
  }

  async getCourtById(
    clubId: number,
    courtId: number,
  ): Promise<Court | undefined> {
    const endpoint = `${this.base_url}/clubs/${clubId}/courts/${courtId}`;
    try {
      const { data: court } = await this.api.get<Court>(endpoint);
      return court;
    } catch (error) {
      if (isApiLimitReached(error)) {
        const job = await this.createJob({
          endpoint,
          method: GET,
        });

        const court = await job.finished();

        return court;
      }

      this.handleErrror(error);
    }
  }

  async getZones(): Promise<Zone[] | undefined> {
    const endpoint = `${this.base_url}/zones`;

    try {
      const { data: zones } = await this.api.get<Zone[]>(endpoint);

      return zones;
    } catch (error) {
      if (isApiLimitReached(error)) {
        const job = await this.createJob({
          endpoint,
          method: GET,
        });

        const zones = await job.finished();

        return zones;
      }

      this.handleErrror(error);
    }
  }
}
