import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { RedisService } from './redis.service';

@WebSocketGateway({ namespace: '/match' })
export class MatchGateway implements OnGatewayInit {
  @WebSocketServer() server: Server;
  private userSockets: Map<string, string> = new Map();

  constructor(
    @Inject('MATCHING_SERVICE') private matchingClient: ClientProxy,
    private redisService: RedisService,
  ) {}

  afterInit() {
    // Subscribe to Redis Pub/Sub for match notifications
    this.redisService.subscribeToMatchEvents((matchedUsers) => {
      this.notifyUsers(matchedUsers);
    });
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

    let isMatched = false;

    // Send the match request to the microservice
    try {
      await firstValueFrom(this.matchingClient.send('match.request', matchPayload));
    } catch (error) {
      client.emit('matchError', `Error requesting match: ${error.message}`);
      return;
    }
  }

  // Notify both matched users via WebSocket
  notifyUsers(matchedUsers: string[]) {
    const [user1, user2] = matchedUsers;
    const user1SocketId = this.getUserSocketId(user1);
    const user2SocketId = this.getUserSocketId(user2);
    if (user1SocketId) {
      this.server.to(user1SocketId).emit('matchNotification', {
        message: `You have been matched with user ${user2}`,
        matchedUserId: user2,
      });
    }

    if (user2SocketId) {
      this.server.to(user2SocketId).emit('matchNotification', {
        message: `You have been matched with user ${user1}`,
        matchedUserId: user1,
      });
    }
  }

  

  handleConnection(@ConnectedSocket() client: Socket) {
    const userId = client.handshake.query.userId;
    if (userId) {
      this.userSockets.set(userId as string, client.id);
      console.log(`User ${userId} connected with socket ID ${client.id}`);
    }
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    const userId = [...this.userSockets.entries()].find(
      ([, socketId]) => socketId === client.id,
    )?.[0];

    if (userId) {
      this.userSockets.delete(userId);
      console.log(`User ${userId} disconnected`);
    }
  }

  getUserSocketId(userId: string): string | undefined {
    return this.userSockets.get(userId);
  }
}
