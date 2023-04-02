import { IsString, Length, Max, Min } from "class-validator";
//import { RejoinPoll } from '@prisma/client';

 export class CreatePollDto
 {
    @Length(1,100)
    topic:string;

    @Min(1)
    @Max(5)
    votesPerVoter:number;

    @Length(1,25)
    name:string;
}

export class joinPollDto
{
    @Length(6,6)
    pollId:string;

    @Length(1,10)
    name:String;

}

export class NominationDto {
    @IsString()
    @Length(1, 100)
    text: string;
  }