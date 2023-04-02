
import { AppController } from './app.controller';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma.service';
import { Pollmodule } from './polls/polls.module';


@Module({
  imports: [ConfigModule.forRoot(),Pollmodule],
  controllers: [AppController,],
  providers: [PrismaService],
})

export class AppModule { }

