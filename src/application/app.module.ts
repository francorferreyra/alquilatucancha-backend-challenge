import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bull';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import * as redisStore from 'cache-manager-ioredis';

import { ClubUpdatedHandler } from '../domain/handlers/events/club-updated.handler';
import { CourtUpdatedHandler } from '../domain/handlers/events/court-updated.handler';
import { SlotBookedHandler } from '../domain/handlers/events/slot-booked.handler';
import { SlotCanceledHandler } from '../domain/handlers/events/slot-canceled.handler';
import { GetAvailabilityHandler } from '../domain/handlers/get-availability.handler';
import { GetZonesHandler } from '../domain/handlers/get-zones.handler';
import { HTTPAlquilaTuCanchaClient } from '../infrastructure/clients/http-alquila-tu-cancha.client';
import { ATC_CLIENT_QUEUE } from '../infrastructure/constants/queue';
import { EventsController } from '../infrastructure/controllers/events.controller';
import { SearchController } from '../infrastructure/controllers/search.controller';
import { ZonesController } from '../infrastructure/controllers/zones.controller';
import { ALQUILA_TU_CANCHA_CLIENT } from '../infrastructure/interfaces/aquila-tu-cancha.client';
import { ApiRequestProcessor } from '../infrastructure/processors/atc-client-queue.processor';
import { ClubsService } from './services/atc-client-service/clubs.service';
import { CourtsService } from './services/atc-client-service/courts.service';
import { SlotsService } from './services/atc-client-service/slots.service';
import { ZonesService } from './services/atc-client-service/zones.service';

@Module({
  imports: [
    HttpModule,
    CqrsModule,
    ConfigModule.forRoot(),
    CacheModule.register({
      isGlobal: true,
      store: redisStore,
      host: 'localhost',
      port: 6380,
    }),
    BullModule.forRootAsync({
      useFactory: () => ({
        redis: {
          host: 'localhost',
          port: 6380,
        },
      }),
    }),
    BullModule.registerQueueAsync({
      name: ATC_CLIENT_QUEUE,
    }),
  ],
  controllers: [SearchController, EventsController, ZonesController],
  providers: [
    {
      provide: ALQUILA_TU_CANCHA_CLIENT,
      useClass: HTTPAlquilaTuCanchaClient,
    },
    GetAvailabilityHandler,
    ClubUpdatedHandler,
    CourtUpdatedHandler,
    SlotBookedHandler,
    SlotCanceledHandler,
    GetZonesHandler,
    ApiRequestProcessor,
    ZonesService,
    ClubsService,
    SlotsService,
    CourtsService,
  ],
})
export class AppModule {}
