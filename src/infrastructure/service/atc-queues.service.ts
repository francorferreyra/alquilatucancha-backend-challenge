import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Job, Queue } from 'bull';

@Injectable()
export class AtcQueueService {
  constructor(
    @InjectQueue('zones') private readonly zonesQueue: Queue,
    @InjectQueue('clubs') private readonly clubsQueue: Queue,
    @InjectQueue('courts') private readonly courtsQueue: Queue,
    @InjectQueue('slots') private readonly slotsQueue: Queue,
    @InjectQueue('club') private readonly clubQueue: Queue,
    @InjectQueue('court') private readonly courtQueue: Queue,
  ) {}

  addZonesQueue(): Promise<Job<any>> {
    return this.zonesQueue.add(`zones-job`);
  }
  addClubsJob(placeId: string): Promise<Job<any>> {
    return this.clubsQueue.add(`zone[${placeId}]-clubs-job`, { placeId });
  }
  addCourtsJob(clubId: number): Promise<Job<any>> {
    return this.courtsQueue.add(`club[${clubId}]-courts-job`, { clubId });
  }
  addSlotsJob(
    clubId: number,
    courtId: number,
    date: string,
  ): Promise<Job<any>> {
    return this.slotsQueue.add(
      `club[${clubId}]-court[${courtId}]-date[${date}]-slots-job`,
      { clubId, courtId, date },
    );
  }
  addClubJob(clubId: number): Promise<Job<any>> {
    return this.clubQueue.add(`club[${clubId}]-info-job`);
  }
  addCourtJob(courtId: number): Promise<Job<any>> {
    return this.courtQueue.add(`court[${courtId}]-info-job`);
  }
}
