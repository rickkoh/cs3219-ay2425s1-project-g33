import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  ConnectedSocket,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RedisService } from './redis.service';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';

@WebSocketGateway({ namespace: '/match' })
export class MatchGateway implements OnGatewayInit {
  @WebSocketServer() server: Server;

  constructor(
    private redisService: RedisService,
    @Inject('MATCHING_SERVICE') private matchingClient: ClientProxy,
  ) {}

  afterInit() {
    // Subscribe to Redis Pub/Sub for user match notifications
    this.redisService.subscribeToUserMatchEvents((payload) => {
      this.notifyUsers(payload);
    });
  }

  // Handle user connection and add them to a room based on their userId
  handleConnection(@ConnectedSocket() client: Socket) {
    const userId = client.handshake.query.userId; // Extract userId from query
    if (userId) {
      client.join(userId); // Make the client join a room based on userId
      console.log(`User ${userId} connected and joined room ${userId}`);
    } else {
      console.log('User connected without userId');
    }
  }

  @SubscribeMessage('requestMatch')
  async handleRequestMatch(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ) {
    const matchPayload = {
      userId: payload.userId,
      selectedTopic: payload.selectedTopic,
      selectedDifficulty: payload.selectedDifficulty,
    };

    // Emit match request event to the microservice
    const timeoutRef = setTimeout(() => {
      client.emit('matchTimeout', 'No match found within 30 seconds');
    }, 30000); // Timeout after 30 seconds if no match is found

    this.matchingClient.emit('match.request', matchPayload).subscribe({
      next: () => {
        // If a match is found, clear the timeout
        clearTimeout(timeoutRef);
        client.emit('matchInProgress', 'Finding a match...');
      },
      error: (err) => {
        clearTimeout(timeoutRef);  // Also clear the timeout in case of an error
        client.emit('matchError', 'Error finding match');
      },
    });
  }

  // Notify matched users via WebSocket
  notifyUsers(userIds: string[]) {
    userIds.forEach((userId, index) => {
      const matchedUserId = userIds[index === 0 ? 1 : 0]; // Get the other matched user's ID
      console.log(`Notifying user ${userId} about match with ${matchedUserId}`);
      this.server.to(userId).emit('matchNotification', {
        message: `You have been matched with user ${matchedUserId}`,
        matchedUserId: matchedUserId,
      });
    });
  }
}
