import { Logger, UseGuards } from '@nestjs/common';
import {
  OnGatewayInit,
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Namespace, Socket } from 'socket.io';
import { PollService } from './polls.service';
import { SocketWithAuth } from '../types/types';
import { GatewayAdminGuard } from './admin.gateway';
import { NominationDto } from 'src/dto/polls.dto';

@WebSocketGateway({
  namespace: 'polls',
})
export class PollsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(PollsGateway.name);
  constructor(private readonly pollsService: PollService) {}

  @WebSocketServer() io: Namespace;

  afterInit(): void {
    this.logger.log(`Websocket Gateway initialized.`);
  }

  async handleConnection(client: SocketWithAuth) {
    const sockets = this.io.sockets;
    
    this.logger.debug(
      `Socket connected with userID: ${client.userId}, pollID: ${client.pollId}, and name: "${client.name}"`,
    );

    this.logger.log(`WS Client with id: ${client.id} connected!`);
    
    this.logger.debug(`Number of connected sockets: ${sockets.size}`);

    const roomName = client.pollId;
    await client.join(roomName);

    const connectedClients = this.io.adapter.rooms?.get(roomName)?.size ?? 0;

    this.logger.debug(
      `userID: ${client.userId} joined room with name: ${roomName}`,
    );
    
    this.logger.debug(
      `Total clients connected to room '${roomName}': ${connectedClients}`,
    );
      
    console.log(`Client (UserId):${client.userId}`)

    const updatedPoll = await this.pollsService.addPartcipant({
      pollId: client.pollId,
      userId: client.userId,
      name: client.name,
    });

    this.io.to(roomName).emit('poll_updated', updatedPoll);

  }

  async handleDisconnect(client: SocketWithAuth) {
    const sockets = this.io.sockets;

    const { pollId, userId } = client;
    const updatedPoll = await this.pollsService.remove_participants(
      pollId,
      userId,
    );

    const roomName = client.pollId;

    const clientCount = this.io.adapter.rooms?.get(roomName)?.size ?? 0;
    this.logger.debug(
      `Socket connected with userID: ${client.userId}, pollID: ${client.pollId}, and name: "${client.name}"`,
    );

    this.logger.log(`Disconnected socket id: ${client.id}`);
    this.logger.debug(`Number of connected sockets: ${sockets.size}`);
  
    if(updatedPoll)
    {
    this.io.to(pollId).emit('poll_updated', updatedPoll);
    }
  }

  
  @UseGuards(GatewayAdminGuard)
  @SubscribeMessage('remove_participant')
  async removeParticipant(
    @MessageBody('id') id: string,
    @ConnectedSocket() client: SocketWithAuth,
  ) {
    this.logger.debug(
      `Attempting to remove participant ${id} from poll ${client.pollId}`,
    );

    const updatedPoll = await this.pollsService.remove_participants(
      client.pollId,
      id,
    );

    if (updatedPoll) {
      this.io.to(client.pollId).emit('poll_updated', updatedPoll);
    }
  }

  @SubscribeMessage('nominate')
  async nominate( @MessageBody() nomination: NominationDto,@ConnectedSocket() client: SocketWithAuth): Promise<void> {
    this.logger.debug(
      `Attempting to add nomination for user ${client.userId} to poll ${client.pollId}\n${nomination.text}`,
    );
    
    console.log(`Cilent PollId :${client.pollId}`)
    const updatedPoll = await this.pollsService.addNominations({
      pollId: client.pollId,
      userId: client.userId,
      text: nomination.text,
    });

    this.io.to(client.pollId).emit('poll_updated', updatedPoll);
  }

  @UseGuards(GatewayAdminGuard)
  @SubscribeMessage('remove_nomination')
  async removeNomination(
    @MessageBody('id') Id: string,
    @ConnectedSocket() client: SocketWithAuth,
  ): Promise<void> {
    
    console.log(Id)

    this.logger.debug(
      `Attempting to remove nomination ${Id} from poll ${client.pollId}`,
    );

    const updatedPoll = await this.pollsService.remove_Nominations({
      pollId: client.pollId,
      NomId:Id
  });

    this.io.to(client.pollId).emit('poll_updated', updatedPoll);
  }

  @UseGuards(GatewayAdminGuard)
  @SubscribeMessage('start_vote')
  async startVote(@ConnectedSocket() client: SocketWithAuth): Promise<void> {
    this.logger.debug(`Attempting to start voting for poll: ${client.pollId}`);

    const updatedPoll = await this.pollsService.startPoll(client.pollId);

    this.io.to(client.pollId).emit('poll_updated', updatedPoll);
  }

  @SubscribeMessage('submit_rankings')
  async submitRankings(
    @ConnectedSocket() client: SocketWithAuth,
    @MessageBody('rankings') rankings: string[],
  ): Promise<void> {
    this.logger.debug(
      `Submitting votes for user: ${client.userId} belonging to pollID: "${client.pollId}"`,
    );

    const updatedPoll = await this.pollsService.submitRanking({
      pollId: client.pollId,
      userId: client.userId,
      rankings,
    });

    // an enhancement might be to not send ranking data to clients,
    // but merely a list of the participants who have voted since another
    // participant getting this data could lead to cheating
    // we may add this while working on the client
    this.io.to(client.pollId).emit('poll_updated', updatedPoll);
  }
  @UseGuards(GatewayAdminGuard)
  @SubscribeMessage('close_poll')
  async closePoll(@ConnectedSocket() client: SocketWithAuth): Promise<void> {
    this.logger.debug(`Closing poll: ${client.pollId} and computing results`);

    const updatedPoll = await this.pollsService.computeResults(client.pollId);

    this.io.to(client.pollId).emit('poll_updated', updatedPoll);
  }

}