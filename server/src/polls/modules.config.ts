
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from "@nestjs/jwt";


export const  jwtModule = JwtModule.registerAsync({
    imports:[ConfigModule],
    useFactory:async (configservie:ConfigService) =>({
        secret:configservie.get<string>('JWT_SECRET'),
        signOptions:{
            expiresIn:parseInt(configservie.get<string>('POLL_DURATION'))
        },
    }),
        inject:[ConfigService],
  
})