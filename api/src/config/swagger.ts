import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle(`${app.get(ConfigService).get<string>('appName')} API`)
    .setDescription(
      'Validates accounting transactions and records accountant review decisions.',
    )
    .setVersion('0.0.1')
    .build();
  SwaggerModule.setup(
    'api/docs',
    app,
    SwaggerModule.createDocument(app, config),
  );
}
