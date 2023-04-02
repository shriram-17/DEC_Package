import { JwtService } from '@nestjs/jwt';
import { Injectable,CanActivate,ExecutionContext,ForbiddenException } from '@nestjs/common';
import { RequestWithAuth } from '../types/types';


@Injectable()
export class ControllerAuthGuard implements CanActivate{
    constructor(private readonly jwtService:JwtService)
    {

    }
    canActivate(context:ExecutionContext):boolean|Promise<boolean>
    {
        const request:RequestWithAuth = context.switchToHttp().getRequest()
        const {acessToken}=request.body
        const payload = this.jwtService.verify(acessToken);
      
        try {
     
            request.userId=payload.sub
            request.pollId=payload.pollId
            request.name=payload.name
            return true   
        } 
        
        catch (e) 
        {
            throw new ForbiddenException("Invalid authorization token")
        }
        
    }
}