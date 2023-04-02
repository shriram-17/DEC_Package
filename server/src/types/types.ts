
import { Prisma } from '@prisma/client';
import { Request, request } from 'express';
import { Socket } from 'socket.io';


export  class createdPollType 
{   
    poll :Prisma.PollCreateInput
    accesstoken: string;
}

export  class joinedPollType 
{   
    poll :Prisma.PollCreateInput
    accesstoken: string;
};

export type Authpayload = {
    userId:string;
    pollId:string;
    name:string;
};

export type RequestWithAuth = Request & Authpayload;
export type SocketWithAuth = Socket & Authpayload;
