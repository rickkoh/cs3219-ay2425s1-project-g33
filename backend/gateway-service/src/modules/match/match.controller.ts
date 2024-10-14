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
import { Inject, UsePipes } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { RedisService } from './redis.service';
import { MatchRequestDto } from './dto';
import {
  MATCH_FOUND,
  MATCH_CANCELLED,
  MATCH_CONFIRMED,
  MATCH_TIMEOUT,
  MATCH_REQUESTED,
  MATCH_ERROR,
} from './match.event';
import { CANCEL_MATCH, FIND_MATCH } from './match.message';
import { WsValidationPipe } from 'src/common/pipes';

@WebSocketGateway({
  namespace: '/match',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Accept'],
    credentials: true,
  },
})
@UsePipes(WsValidationPipe)
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
      this.notifyUsersWithMatch(matchedUsers);
    });

    this.redisService.subscribeToTimeoutEvents((timedOutUsers) => {
      this.notifyUsersWithTimeout(timedOutUsers);
    });
  }

  @SubscribeMessage(FIND_MATCH)
  async handleRequestMatch(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: MatchRequestDto,
  ) {
    // Send the match request to the microservice
    try {
      firstValueFrom(this.matchingClient.send('match-request', payload))
        .then(() =>
          console.log(
            `Match request from user ${payload.userId} received successfully`,
          ),
        )
        .catch((error) =>
          console.error(
            `Error requesting match for user ${payload.userId}: ${error.message}`,
          ),
        );
      this.server.to(client.id).emit(MATCH_REQUESTED, {
        message: `Match request sent to the matching service.`,
      });
    } catch (error) {
      client.emit(MATCH_ERROR, `Error requesting match: ${error.message}`);
      return;
    }
  }

  @SubscribeMessage(CANCEL_MATCH)
  async handleCancelMatch(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { userId: string },
  ) {
    firstValueFrom(
      this.matchingClient.send('match-cancel', { userId: payload.userId }),
    )
      .then(() => console.log(`Match canceled for user ${payload.userId}`))
      .catch((error) =>
        console.error(
          `Error canceling match for user ${payload.userId}: ${error.message}`,
        ),
      );
    this.server.to(client.id).emit(MATCH_CANCELLED, {
      message: `You have been cancelled from the match.`,
    });
  }

  // Notify both matched users via WebSocket
  notifyUsersWithMatch(matchedUsers: string[]) {
    const [user1, user2] = matchedUsers;
    const user1SocketId = this.getUserSocketId(user1);
    const user2SocketId = this.getUserSocketId(user2);
    if (user1SocketId && user2SocketId) {
      this.server.to(user1SocketId).emit(MATCH_FOUND, {
        message: `You have been matched with user ${user2}`,
        matchedUserId: user2,
      });
      this.server.to(user2SocketId).emit(MATCH_FOUND, {
        message: `You have been matched with user ${user1}`,
        matchedUserId: user1,
      });
    }
  }

  notifyUsersWithTimeout(timedOutUsers: string[]) {
    timedOutUsers.forEach((user) => {
      const socketId = this.getUserSocketId(user);
      if (socketId) {
        this.server.to(socketId).emit(MATCH_TIMEOUT, {
          message: `You have been timed out.`,
          timedOutUserId: user,
        });
      }
    });
  }

  handleConnection(@ConnectedSocket() client: Socket) {
    const userId = client.handshake.query.userId;
    if (userId) {
      this.userSockets.set(userId as string, client.id);
      console.log(`User ${userId} connected with socket ID ${client.id}`);
    }
  }

  async handleDisconnect(@ConnectedSocket() client: Socket) {
    const userId = [...this.userSockets.entries()].find(
      ([, socketId]) => socketId === client.id,
    )?.[0];

    if (userId) {
      this.userSockets.delete(userId);
      // Remove user from Redis pool
      firstValueFrom(this.matchingClient.send('match-cancel', { userId }))
        .then(() => console.log(`Match canceled for user ${userId}`))
        .catch((error) =>
          console.error(
            `Error canceling match for user ${userId}: ${error.message}`,
          ),
        );
      console.log(`User ${userId} disconnected`);
    }
  }

  getUserSocketId(userId: string): string | undefined {
    return this.userSockets.get(userId);
  }
}
