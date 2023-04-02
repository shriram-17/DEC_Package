import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SocketIOAdapter } from './sockets/socket-io.apdater';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const logger = new Logger('Main (main.ts)');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get(ConfigService);
  
  const port = parseInt(configService.get('PORT'));
  const cilentport =parseInt(configService.get('CLIENT_PORT'))

  app.enableCors({
      origin: [
        `http://localhost:${cilentport}`,
        /^http:\/\/192\.168\.1\.([1-9]|[1-9]\d):${cilentport}$/,
      ],
    })
    app.useWebSocketAdapter(new SocketIOAdapter(app, configService));
    
    
  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs')
    
  await app.listen(port);
  logger.log(`Server running on port ${port}`);

  
}
bootstrap();
