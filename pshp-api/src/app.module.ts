import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BeanController } from './bean/bean.controller';
import { BeanService } from './bean/bean.service';

import { NestjsFormDataModule, MemoryStoredFile } from 'nestjs-form-data';
import { ServeStaticModule } from '@nestjs/serve-static';
import { EventModule } from './event/event.module';
import { join } from 'path';
@Module({
  imports: [
    NestjsFormDataModule.config({ storage: MemoryStoredFile, limits: {
      fileSize: 1024 * 1024 * 10,
    } }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'app'),
      exclude: ['/prushoppe/api/*','/api/*'],
      serveRoot: '/ViewerJS'
    }),
    EventModule
  ],
  controllers: [AppController, BeanController],
  providers: [AppService, BeanService],
})
export class AppModule { }
