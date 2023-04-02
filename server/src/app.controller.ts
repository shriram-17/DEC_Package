

import { Controller, Get } from '@nestjs/common';
import { get } from 'http';

@Controller()
export class AppController {
    @Get('/')
    get_homepage()
    {
        return "HomePage"
    }
    @Get('/all')
    get_all()
    {
     return "all routes"   
    }
}
