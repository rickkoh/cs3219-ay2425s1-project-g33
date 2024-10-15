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
      client.emit(EXCEPTION, 'Invalid match request payload.');
      return;
    }

    if (!this.validateUserId(client, payload.userId)) {
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
        client.emit(EXCEPTION, result.message);
      }
    } catch (error) {
      client.emit(EXCEPTION, `Error requesting match: ${error.message}`);
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
        EXCEPTION,
        'Invalid userId. Please check your payload and try again.',
      );
      return;
    }

    if (!this.validateUserId(client, payload.userId)) {
      return;
    }

    try {
      const result = await firstValueFrom(
        this.matchingClient.send('match-cancel', { userId: payload.userId }),
      );

      if (result.success) {
        this.server.to(client.id).emit(MATCH_CANCELLED, {
          message: result.message,
        });
      } else {
        client.emit(EXCEPTION, result.message);
      }
    } catch (error) {
      console.log(error);
      client.emit(EXCEPTION, `Error canceling match: ${error.message}`);
      return;
    }
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
    const id = client.handshake.query.userId as string;

    if (!id) {
      this.emitExceptionAndDisconnect(client, 'Invalid userId.');
      return;
    }

    try {
      // Check if user is already connected
      const existingSocketId = this.userSockets.get(id);
      if (existingSocketId) {
        this.emitExceptionAndDisconnect(
          client,
          `User ${id} is already connected with socket ID ${existingSocketId}`,
        );
        return;
      }

      // Check if valid user exists in database
      const existingUser = await firstValueFrom(
        this.userClient.send({ cmd: 'get-user-by-id' }, id),
      );

      if (!existingUser) {
        this.emitExceptionAndDisconnect(client, `User ${id} not found.`);
        return;
      }

      if (id) {
        this.userSockets.set(id as string, client.id);
        console.log(`User ${id} connected with socket ID ${client.id}`);
      }
    } catch (error) {
      this.emitExceptionAndDisconnect(client, error.message);
      return;
    }
  }

  async handleDisconnect(@ConnectedSocket() client: Socket) {
    const userId = [...this.userSockets.entries()].find(
      ([, socketId]) => socketId === client.id,
    )?.[0];

    if (!userId) {
      this.emitExceptionAndDisconnect(
        client,
        'User not found in userSockets at disconnect.',
      );
      return;
    }

    try {
      // Remove user from Redis pool
      const result = await firstValueFrom(
        this.matchingClient.send('match-cancel', { userId }),
      );

      if (result.success) {
        console.log(`Match canceled successfully for user ${userId}`);
      } else {
        console.warn(
          `Match cancellation failed for user ${userId}: ${result.message}`,
        );
      }

      this.userSockets.delete(userId);
      console.log(`User ${userId} disconnected and removed from userSockets.`);
    } catch (error) {
      client.emit(
        EXCEPTION,
        `Error canceling match for user ${userId}: ${error.message}`,
      );
    }
  }

  private getUserSocketId(userId: string): string | undefined {
    return this.userSockets.get(userId);
  }

  private emitExceptionAndDisconnect(client: Socket, message: string) {
    client.emit(EXCEPTION, `Error connecting to /match socket: ${message}`);
    client.disconnect();
  }

  // Method to validate the userId associated with the current socket
  private validateUserId(client: Socket, userId: string): boolean {
    const storedUserId = [...this.userSockets.entries()].find(
      ([, socketId]) => socketId === client.id,
    )?.[0];
    if (!storedUserId || storedUserId !== userId) {
      client.emit(EXCEPTION, 'UserId does not match the current socket.');
      return false;
    }
    return true;
  }
}
