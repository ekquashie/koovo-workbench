import {
  ClassSerializerInterceptor,
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppLogger } from '../logger/logger';
import { FieldValidationException } from '../exceptions/exceptions';

/** Shared by main.ts and the integration tests so both run the same app. */
export function configureApp(app: INestApplication) {
  const config = app.get(ConfigService);
  app.useLogger(app.get(AppLogger));
  app.setGlobalPrefix('api');
  // URI versioning: routes are served as /api/v1/... . Controllers opt into
  // a new version with @Version('2') when a breaking change is needed.
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.enableCors({ origin: [config.get<string>('frontendUrl')!] });
  app.enableShutdownHooks();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: (errors) =>
        FieldValidationException.fromValidationErrors(errors),
    }),
  );
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
}
