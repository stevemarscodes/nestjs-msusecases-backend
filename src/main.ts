import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WINSTON_MODULE_NEST_PROVIDER, WinstonModule } from 'nest-winston';
import { LoggerConfig } from './config';
import { HttpExceptionFilter } from './api/exceptions/http-exceptions.filter';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
declare const module: any;

async function bootstrap() {

  const logger: LoggerConfig = new LoggerConfig();

  const winstonLogger = WinstonModule.createLogger(logger.console());

  const app = await NestFactory.create(AppModule, {
    logger: winstonLogger,
  });

  winstonLogger.log('Preparing msusecases-backend application');

  app.useGlobalFilters(new HttpExceptionFilter);
  app.useGlobalPipes(new ValidationPipe());
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  app.setGlobalPrefix(process.env.GLOBAL_PREFIX || 'msusecases/v1');

  const configSwagger = new DocumentBuilder()
    .setTitle(process.env.SWAGGER_NAME || process.env['SWAGGER_NAME'])
    .setDescription(process.env.SWAGGER_DESCRIPTION || process.env['SWAGGER_DESCRIPTION'])
    .setVersion(process.env.SWAGGER_VERSION || process.env['SWAGGER_VERSION'])
    .setContact(process.env.SWAGGER_CONTACT_NAME || process.env['SWAGGER_CONTACT_NAME'], "",
      process.env.SWAGGER_CONTACT_EMAIL ||
      process.env['SWAGGER_CONTACT_EMAIL'])
    .build();

  if (process.env.NODE_ENV || process.env['NODE_ENV'] !== 'production') {
    const document = SwaggerModule.createDocument(app, configSwagger);
    SwaggerModule.setup(process.env.GLOBAL_PREFIX + '/' + process.env.SWAGGER_URL, app, document);
  }

  await app.listen(process.env.PORT);

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close())
  }

}

bootstrap();
