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
import { MatchRequestDto } from './dto';
import {
  MATCH_FOUND,
  MATCH_CANCELLED,
  MATCH_CONFIRMED,
  MATCH_TIMEOUT,
  MATCH_REQUESTED,
  MATCH_ERROR,
  EXCEPTION,
} from './match.event';
import { CANCEL_MATCH, FIND_MATCH } from './match.message';

@WebSocketGateway({
  namespace: '/match',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Accept'],
    credentials: true,
  },
})
export class MatchGateway implements OnGatewayInit {
  @WebSocketServer() server: Server;
  private userSockets: Map<string, string> = new Map();

  constructor(
    @Inject('MATCHING_SERVICE') private matchingClient: ClientProxy,
    @Inject('USER_SERVICE') private userClient: ClientProxy,
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
    if (
      !payload.userId ||
      !payload.selectedTopic ||
      !payload.selectedDifficulty
    ) {
      client.emit(
        MATCH_ERROR,
        'Invalid match request. Please check your payload and try again.',
      );
      return;
    }

    try {
      const result = await firstValueFrom(
        this.matchingClient.send('match-request', payload),
      );

      if (result.success) {
        this.server.to(client.id).emit(MATCH_REQUESTED, {
          message: result.message,
        });
      } else {
        client.emit(MATCH_ERROR, result.message);
      }
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
    if (!payload.userId) {
      client.emit(
        MATCH_ERROR,
        'Invalid userId. Please check your payload and try again.',
      );
      return;
    }

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

  async handleConnection(@ConnectedSocket() client: Socket) {
    const id = client.handshake.query.userId;

    if (!id) {
      client.emit(
        EXCEPTION,
        'Error connecting to /match socket: No userId provided.',
      );
      client.disconnect();
      return;
    }

    try {
      const existingUser = await firstValueFrom(
        this.userClient.send({ cmd: 'get-user-by-id' }, id),
      );

      if (!existingUser) {
        client.emit(
          EXCEPTION,
          'Error connecting to /match socket: Invalid userId.',
        );
        client.disconnect();
        return;
      }

      if (id) {
        this.userSockets.set(id as string, client.id);
        console.log(`User ${id} connected with socket ID ${client.id}`);
      }
    } catch (error) {
      client.emit(
        EXCEPTION,
        `Error connecting to /match socket: ${error.message}`,
      );
      return;
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
