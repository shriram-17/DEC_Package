
import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { PollsController } from './polls.controller';
import { PollService } from './polls.service';

import { jwtModule } from './modules.config';
import { PrismaService } from '../prisma.service';
import { PollsGateway } from './polls.gateway';

@Module({
    imports:[ConfigModule,jwtModule],
    controllers:[PollsController],
    providers:[PollService,PrismaService,PollsGateway]
})

export class Pollmodule {}