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
  EXCEPTION,
} from './match.event';
import { CANCEL_MATCH, CONFIRM_MATCH, FIND_MATCH } from './match.message';
import { v4 as uuidv4 } from 'uuid';

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
  private matchConfirmations: Map<
    string,
    {
      user1: string;
      user2: string;
      user1Confirmed: boolean;
      user2Confirmed: boolean;
    }
  > = new Map();

  constructor(
    @Inject('MATCHING_SERVICE') private matchingClient: ClientProxy,
    @Inject('USER_SERVICE') private userClient: ClientProxy,
    private redisService: RedisService,
  ) {}

  afterInit() {
    // Subscribe to Redis Pub/Sub for match notifications
    this.redisService.subscribeToMatchEvents((matchedUsers) => {
      const matchId = this.generateMatchId(); // Generate matchId
      this.notifyUsersMatchFound(matchId, matchedUsers); // Notify users of match with matchId
      this.trackMatchConfirmation(matchId, matchedUsers); // Track match confirmation
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
      client.emit(EXCEPTION, 'Invalid payload for match request.');
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
      client.emit(EXCEPTION, 'Invalid userId.');
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

  @SubscribeMessage(CONFIRM_MATCH)
  async handleConfirmMatch(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { userId: string; matchId: string },
  ) {
    if (!payload.userId || !payload.matchId) {
      client.emit(EXCEPTION, 'Invalid message payload for match confirmation.');
      return;
    }

    const { userId, matchId } = payload;
    if (!this.validateUserId(client, userId)) {
      return;
    }

    // Get the confirmation state of the users
    const confirmationState = this.matchConfirmations.get(matchId);
    if (!confirmationState) {
      client.emit(EXCEPTION, 'Invalid Match Id.');
      return;
    }

    // Checks which user is confirming the match
    if (confirmationState.user1 === payload.userId) {
      confirmationState.user1Confirmed = true;
    } else if (confirmationState.user2 === payload.userId) {
      confirmationState.user2Confirmed = true;
    } else {
      client.emit(EXCEPTION, 'Invalid userId for this match.');
      return;
    }

    // Check if both users have confirmed
    if (confirmationState.user1Confirmed && confirmationState.user2Confirmed) {
      this.notifyUsersMatchConfirmed(payload.matchId, confirmationState);
    }
  }

  async handleConnect(@ConnectedSocket() client: Socket) {
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

      this.userSockets.set(id as string, client.id);
      console.log(`User ${id} connected with socket ID ${client.id}`);
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

  trackMatchConfirmation(matchId: string, matchedUsers: string[]) {
    const confirmationState = {
      user1: matchedUsers[0],
      user2: matchedUsers[1],
      user1Confirmed: false,
      user2Confirmed: false,
    };

    this.matchConfirmations.set(matchId, confirmationState);
  }

  notifyUsersMatchFound(matchId: string, matchedUsers: string[]) {
    const [user1, user2] = matchedUsers;
    const user1SocketId = this.getUserSocketId(user1);
    const user2SocketId = this.getUserSocketId(user2);
    if (user1SocketId && user2SocketId) {
      this.server.to(user1SocketId).emit(MATCH_FOUND, {
        message: `You have been matched with user ${user2}`,
        matchId,
      });
      this.server.to(user2SocketId).emit(MATCH_FOUND, {
        message: `You have been matched with user ${user1}`,
        matchId,
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

  notifyUsersMatchConfirmed(matchId: string, confirmationState: any) {
    const user1SocketId = this.getUserSocketId(confirmationState.user1);
    const user2SocketId = this.getUserSocketId(confirmationState.user2);

    const sessionId = this.generateSessionId(); // TODO - To be substituted with collab-service method in next MS

    if (user1SocketId && user2SocketId) {
      this.server.to(user1SocketId).emit(MATCH_CONFIRMED, {
        message: 'Both users have confirmed the match.',
        sessionId,
      });
      this.server.to(user2SocketId).emit(MATCH_CONFIRMED, {
        message: 'Both users have confirmed the match.',
        sessionId,
      });
    }

    this.matchConfirmations.delete(matchId);
  }

  private generateMatchId(): string {
    return uuidv4();
  }

  private generateSessionId(): string {
    return uuidv4();
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
