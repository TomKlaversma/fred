import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  console.log('[bootstrap] Step 1: Creating NestJS application...');
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  console.log('[bootstrap] Step 2: App created successfully');

  // Enable CORS
  console.log('[bootstrap] Step 3: Enabling CORS...');
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Global validation pipe
  console.log('[bootstrap] Step 4: Setting up validation pipe...');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global exception filter
  console.log('[bootstrap] Step 5: Setting up exception filter...');
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Swagger / OpenAPI setup
  console.log('[bootstrap] Step 6: Setting up Swagger...');
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Fred API')
    .setDescription('Fred platform REST API')
    .setVersion('0.1.0')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'X-API-Key', in: 'header' }, 'api-key')
    .build();

  console.log('[bootstrap] Step 7: Creating Swagger document...');
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  console.log('[bootstrap] Step 8: Setting up Swagger UI...');
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
  console.log(`[bootstrap] Step 9: Starting server on port ${port}...`);
  await app.listen(port, '0.0.0.0');

  console.log(`Fred API running on http://localhost:${port}`);
  console.log(`Swagger docs available at http://localhost:${port}/docs`);
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
