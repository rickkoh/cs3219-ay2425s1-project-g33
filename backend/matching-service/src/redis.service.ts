import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { MatchRequestDto } from 'src/dto';

@Injectable()
export class RedisService {
  private redisPublisher: Redis; 
  private redisSubscriber: Redis;

  constructor() {
    this.redisPublisher = new Redis({
      host: 'backend-redis-1',  // Use your Redis host (or Docker network host if in Docker)
      port: 6379,
    });

    this.redisSubscriber = new Redis({
      host: 'backend-redis-1',
      port: 6379,
    });
  }

  // Add user to Redis set (matching pool)
  async addUserToPool(data: MatchRequestDto) {
    await this.redisPublisher.sadd('userPool', JSON.stringify(data));
  }

   // Get users from Redis pool
   async getUsersFromPool(): Promise<MatchRequestDto[]> {
    const users = await this.redisPublisher.smembers('userPool');
    return users.map(user => JSON.parse(user) as MatchRequestDto);
  }

   // Remove users from the Redis pool by userId
   async removeUsersFromPool(userIds: string[]) {
    const users = await this.getUsersFromPool();  // Get all users in the pool

    // Find and remove users whose userId matches the provided userIds
    userIds.forEach(async (userId) => {
      const userToRemove = users.find(user => user.userId === userId);
      if (userToRemove) {
        await this.redisPublisher.srem('userPool', JSON.stringify(userToRemove));  // Remove user from pool
        console.log(`Removed user ${userId} from the pool`);
      }
    });
  }

  // Publish matched users via Redis Pub/Sub
  async publishMatchedUsers(matchedUsers: any) {
    await this.redisPublisher.publish('matchChannel', JSON.stringify(matchedUsers));
  }

  // Subscribe to Redis Pub/Sub for user match notifications
  subscribeToUserMatchEvents(matchCallback: (users: any) => void) {
    this.redisSubscriber.subscribe('matchChannel', (err, count) => {
      if (err) {
        console.error('Error subscribing to Redis channel:', err);
        return;
      }
      console.log('Subscribed to Redis channel matchChannel.');
    });

    this.redisSubscriber.on('message', (channel, message) => {
      if (channel === 'matchChannel') {
        const matchedUsers = JSON.parse(message);
        matchCallback(matchedUsers);
      }
    });
  }
}
