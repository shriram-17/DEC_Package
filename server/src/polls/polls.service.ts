import { Injectable } from "@nestjs/common";
import { CreatePollId, createUserId, createNominatioId } from './ids';
import { Poll, Prisma} from "@prisma/client";
import { ConfigService } from '@nestjs/config';
import { JwtService } from "@nestjs/jwt";
import { createdPollType, joinedPollType } from '../types/types';
import { CreatePollDto } from "src/dto/polls.dto";
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PollService
{   
    private readonly expiredtime : String;
    constructor (private readonly prisma:PrismaService,private readonly jwtservice:JwtService,configService: ConfigService)
    {
        this.expiredtime= configService.get('POLL_DURATION')
    }

    async create_poll(fields:Prisma.PollCreateInput) :Promise<createdPollType>
    {   
        const userId = createUserId()
        const pollId = CreatePollId()
        
        let polltime=await this.prisma.polltime.create({
            data:{pollId:pollId}
        })

        fields ={
            ...fields,
            pollId:pollId,
            adminId:userId,
            particpants:{},
            nominations:{},
            Ranking:{},
            hasStarted:false,
            Polltime:{connect:{id:polltime.id}}
        }

        const createdpoll= await this.prisma.poll.create({
            data:fields
         })

         const signedString =this.jwtservice.sign(
            {
                pollId:createdpoll.pollId,
                name:fields.name,
            },
            {
                subject :userId
            }
         )
            return{
                poll:createdpoll,
                accesstoken:signedString
            }
    }
    
    async join_poll(fields):Promise<joinedPollType>
    {
        const{pollId} = fields
        const userID = createUserId()

        const joinpoll = await this.prisma.poll.findFirst({
        where:{
            pollId:pollId
        }
       })

       const signedString =this.jwtservice.sign(
        {
            pollId:joinpoll.pollId,
            name:fields.name,
        },
        {
            subject :userID
        }
     )
        return{
            poll:joinpoll,
            accesstoken:signedString
        }
    }

    async rejoin_poll(fields)
    {
       const {userId,pollId,name} = fields

       const pollinfo = await this.prisma.poll.findFirst({
        where:{
            pollId:pollId
        }
       })

   
        const {id,particpants} = pollinfo
        particpants[userId]=name
        console.log(particpants)
        const rejoinpoll = await this.prisma.poll.update({
        where:{
            id:id            
        },
        data: {
            particpants: particpants
          },
        
       })
       return rejoinpoll

    }

    async addPartcipant(fields){
        const{userId,pollId,name} = fields;
        const pollinfo = await this.prisma.poll.findFirst({
            where:{
                pollId:pollId
            }
           })

        const {id,particpants} = pollinfo
        particpants[userId]=name
        const rejoinpoll = await this.prisma.poll.update({
           where:{
               id:id            
           },
           data: {
               particpants: particpants
             },
           
          })
        return rejoinpoll

    }
    
    async remove_participants(pollId:string,userId:string) :Promise<Poll>
    {    
        const pollinfo = await this.prisma.poll.findFirst({
            where:{
                pollId:pollId
            }
           })
           
       if(!pollinfo.hasStarted)
       {    
        const {id,particpants} = pollinfo
        delete particpants[userId]
        console.log(particpants)
        const rejoinpoll = await this.prisma.poll.update({
        where:{
            id:id            
        },
        data: {
            particpants: particpants
          },
        
       })
       return rejoinpoll
    }
    }

    async getpoll(pollid:string):Promise<Poll>
    {
        const poll = await this.prisma.poll.findFirst({
            where:{
                pollId:pollid
            }
        })
        return poll
    }

    async addNominations(fields){
        
        const{userId,pollId,text} = fields;

        console.log(userId,pollId)
        const nomid =createNominatioId()

        const pollinfo = await this.prisma.poll.findFirst({
            where:{
                pollId:pollId
            }
           })
        
        console.log(pollinfo)

        let  {id,nominations} =pollinfo

        nominations[nomid]={userId,text}   
        console.log(nominations)

        const updetednominations = await this.prisma.poll.update({
            where:{
                id:id
            },
            data:{
                nominations:nominations
            }
        })
        
            return updetednominations

    }
    async remove_Nominations(fields){
        
        const{NomId,pollId} = fields;

        const pollinfo = await this.prisma.poll.findFirst({
            where:{
                pollId:pollId
            }
           })
        
        let  {id,nominations} =pollinfo
        
        delete nominations[NomId]
        const updatednominations = await this.prisma.poll.update({
            where:{
                id:id
            },
            data:{
                nominations:nominations
            }
        })
        
        return updatednominations

    }
    async startPoll(pollId:string)
    {
        const pollinfo = await this.prisma.poll.findFirst({
            where:{
                pollId:pollId
            }
           })
        
        const {id} = pollinfo
        
        const updatednominations = await this.prisma.poll.update({
            where:{
                id:id
            },
            data:{
               hasStarted:true
            }
        })
    }
    async submitRanking(fields):Promise<Poll>
    {
        const {pollId,userId,rankings} = fields
        
        const pollinfo = await this.prisma.poll.findFirst({
            where:{
                pollId:pollId
            }
        })

        let {id,votesperVoter,Ranking} = pollinfo
        
        
        let  Rankings ={
            [userId]:{

            }
        }

        const copiedObject = JSON.parse(JSON.stringify(Ranking));
        
        for(let i in copiedObject)
        {
            Rankings[i]=Ranking[i]
        }

        for(let i=0;i<votesperVoter;i++)
        {
            Rankings[userId][i]=rankings[i]
        }
        

        const updatedRanking = await this.prisma.poll.update({
            where:{
                id:id
            },
            data:{
                Ranking:Rankings
            }
        }) 
        return updatedRanking
    }

    async computeResults(pollId: string){

        const pollinfo = await this.prisma.poll.findFirst({
            where:{
                pollId:pollId
            }
        })
        const { id, Ranking, votesperVoter, nominations } = pollinfo;
   
        const scores = {};

        for (const userRankings of Object.values(Ranking)) {
          Object.values(userRankings).forEach((nominationID:string, n) => {
            const voteValue = Math.pow(
              (votesperVoter - 0.5 * n) / votesperVoter,
              n + 1,
            );
            scores[nominationID] = (scores[nominationID] ?? 0) + voteValue;
          });
        }
        
        const results = Object.entries(scores).map(([nominationID, score]) => ({
          nominationID,
          nominationText: nominations[nominationID].text,
          score,
        }));
        
        const poll = this.prisma.poll.update({
            where:{
                id:id
            },
            data:{
                Ranking:results
            }
        })
      }
}
