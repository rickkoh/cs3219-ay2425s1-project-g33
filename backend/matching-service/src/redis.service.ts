import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { MatchRequestDto } from './dto/match-request.dto';

@Injectable()
export class RedisService {
  private redisPublisher: Redis;
  private redisSubscriber: Redis;

  constructor() {
    this.redisPublisher = new Redis({
      host: 'backend-redis-1',
      port: 6379,
    });
    this.redisSubscriber = new Redis({
      host: 'backend-redis-1',
      port: 6379,
    });
  }

  // Add user to Redis pool
  async addUserToPool(data: MatchRequestDto): Promise<void> {
    await this.redisPublisher.sadd('userPool', JSON.stringify(data));
  }

  // Get users from Redis pool
  async getUsersFromPool(): Promise<MatchRequestDto[]> {
    const users = await this.redisPublisher.smembers('userPool');
    return users.map(user => JSON.parse(user));
  }

  // Remove users from Redis pool
  async removeUsersFromPool(userIds: string[]) {
    const users = await this.getUsersFromPool();

    // Find and remove users whose userId matches the provided userIds
    userIds.forEach(async (userId) => {
      const userToRemove = users.find(user => user.userId === userId);
      if (userToRemove) {
        await this.redisPublisher.srem('userPool', JSON.stringify(userToRemove));
      }
    });
  }

  // Publish matched users to Redis Pub/Sub channel
  async publishMatchedUsers(matchedUserIds: string[]): Promise<void> {
    await this.redisPublisher.publish('matchChannel', JSON.stringify(matchedUserIds));
  }
}
