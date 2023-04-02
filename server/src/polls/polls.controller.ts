import { Controller, Post, Logger, Body,Get, UseGuards, Req } from '@nestjs/common';
import { CreatePollDto, joinPollDto } from '../dto/polls.dto';
import { PollService } from './polls.service';
import { Prisma } from '@prisma/client';
import { ControllerAuthGuard } from '../guard/controller.auth.guard.';
import { RequestWithAuth } from '../types/types';


@Controller('polls')
export class PollsController
{   
    constructor (private readonly pollservice:PollService)
    {

    }
    
    @Get()
    get_polls_route()
    {
        return "In The Polls Route"
    }
    
    @Post()
    async create_poll(@Body() fields:Prisma.PollCreateInput)
    {
        return await this.pollservice.create_poll(fields)
    }

    @Post('/join')
    async join_poll(@Body() fields)
    {   
       return await this.pollservice.join_poll(fields)
    }
    
    @UseGuards(ControllerAuthGuard)
    @Post('/rejoin')
    async rejoin(@Req() request:RequestWithAuth)
    {   
        const {userId,pollId,name}=request

        const result = await this.pollservice.rejoin_poll({
        name,
        pollId,
        userId
       })
       return result
    }

}