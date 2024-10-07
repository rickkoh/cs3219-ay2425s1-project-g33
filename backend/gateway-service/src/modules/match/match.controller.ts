import { Inject } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ClientProxy } from '@nestjs/microservices';
import { Socket } from 'socket.io';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';

@ApiTags('match')
@ApiBearerAuth('access-token')
@WebSocketGateway({ namespace: '/match' })
export class MatchController {
  constructor(
    @Inject('MATCHING_SERVICE') private readonly matchingClient: ClientProxy,
  ) {}

  @SubscribeMessage('requestMatch')
  async handleRequestMatch(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ): Promise<void> {
    // Send the match request to the microservice
    this.matchingClient
      .emit('match.request', {
        userId: payload.userId,
        topic: payload.topic,
        difficulty: payload.difficulty,
      })
      .subscribe({
        next: () => {
          client.emit('matchInProgress', 'Finding a match...');
        },
        error: (err) => {
          client.emit('matchError', 'Error finding match');
        },
      });
  }

  @SubscribeMessage('cancelMatch')
  async handleCancelMatch(
    @ConnectedSocket() client: Socket, // Access Socket.io client
    @MessageBody() payload: any, // Payload from the client
  ): Promise<void> {
    // Send the cancel request to the matching microservice
    this.matchingClient
      .emit('match.cancel', { userId: payload.userId })
      .subscribe({
        next: () => {
          client.emit('matchCancelled', 'Match cancelled.');
        },
        error: (err) => {
          client.emit('cancelError', 'Error cancelling match');
        },
      });
  }
}
