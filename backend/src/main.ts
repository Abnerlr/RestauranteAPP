import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Enable CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Set global prefix for all routes
  const globalPrefix = 'api/v1';
  app.setGlobalPrefix(globalPrefix);

  // Enable validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT ?? process.env.API_PORT ?? 3001;
  const nodeEnv = configService.get<string>('NODE_ENV') || 'development';
  
  // Force IPv4 binding to avoid IPv6 issues on Windows
  // Listen on 0.0.0.0 (all IPv4 interfaces) to accept connections from localhost, 127.0.0.1, and network
  await app.listen(port, '0.0.0.0');
  
  // Build accessible URLs (IPv4)
  const localhostUrl = `http://localhost:${port}`;
  const localhostIpUrl = `http://127.0.0.1:${port}`;
  
  // Log startup information
  console.log('='.repeat(60));
  console.log('[BOOT] Application started');
  console.log(`[BOOT] Listening on: 0.0.0.0:${port} (IPv4)`);
  console.log(`[BOOT] http://localhost:${port}`);
  console.log(`[BOOT] NODE_ENV: ${nodeEnv}`);
  console.log(`[BOOT] Global prefix: ${globalPrefix || 'none'}`);
  console.log(`[BOOT] Health: ${localhostUrl}/${globalPrefix}/__health`);
  if (nodeEnv === 'development') {
    console.log(`[DEV] Routes: ${localhostUrl}/${globalPrefix}/__routes`);
  }
  console.log('='.repeat(60));

  // Log routes in development mode
  if (nodeEnv === 'development') {
    const devLoginPath = `${globalPrefix}/auth/dev-login`;
    console.log(`\n[DEV] Dev login endpoint:`);
    console.log(`      POST ${localhostUrl}/${devLoginPath}`);
    console.log(`\n[DEV] Test command (Linux/Mac/Git Bash):`);
    console.log(`      curl -X POST ${localhostUrl}/${devLoginPath} \\`);
    console.log(`        -H "Content-Type: application/json" \\`);
    console.log(`        -d '{"role":"KITCHEN","restaurantId":"rest_1"}'`);
    console.log(`\n[DEV] Test command (PowerShell):`);
    console.log(`      Invoke-RestMethod -Uri "${localhostUrl}/${devLoginPath}" \\`);
    console.log(`        -Method POST -ContentType "application/json" \\`);
    console.log(`        -Body '{\"role\":\"KITCHEN\",\"restaurantId\":\"rest_1\"}'`);
    console.log('');
  }
}
bootstrap();
