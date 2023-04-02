import { PrismaClient } from '@prisma/client';
import {
    CanActivate,
    ExecutionContext,
    Injectable,
    Logger,
  } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsUnauthorizedException } from 'src/exceptions/ws-exceptions';
import { Authpayload, SocketWithAuth } from '../types/types'
import { PollService } from './polls.service';
  
  @Injectable()
  export class GatewayAdminGuard implements CanActivate {
    private readonly logger = new Logger(GatewayAdminGuard.name);
    constructor(
      private readonly pollsService: PollService,
      private readonly jwtService: JwtService,
    ) {}
    async canActivate(context: ExecutionContext): Promise<boolean> {
      const socket: SocketWithAuth = context.switchToWs().getClient();

      const token =
        socket.handshake.auth.token || socket.handshake.headers['token'];
     
      console.log(`Token from admin gateway : ${token}`)
      if (!token) {
        this.logger.error('No authorization token provided');
  
        throw new WsUnauthorizedException('No token provided');
      }
  
      try {
        const payload = this.jwtService.verify<Authpayload & { sub: string }>(
          token,
        );
  
        this.logger.debug(`Validating admin using token payload`, payload);
  
        const { sub, pollId } = payload;
        
        
        const poll = await this.pollsService.getpoll(pollId)
        
      
        
        if (sub !== poll.adminId) {
          throw new WsUnauthorizedException('Admin privileges required');
        }
  
        return true;
      } catch {
        throw new WsUnauthorizedException('Admin privileges required');
      }
    }
  }