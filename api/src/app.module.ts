import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import configuration from './config/configuration';
import { CustomExceptionsFilter } from './exceptions/exceptions';
import { ResponseInterceptor } from './interceptors/response.interceptor';
import { LoggerModule } from './logger/logger.module';
import { StorageModule } from './storage/storage.module';
import { ImportsModule } from './imports/imports.module';
import { ReviewsModule } from './reviews/reviews.module';
import { TransactionsModule } from './transactions/transactions.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    LoggerModule,
    StorageModule,
    TransactionsModule,
    ImportsModule,
    ReviewsModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_FILTER, useClass: CustomExceptionsFilter },
  ],
})
export class AppModule {}
