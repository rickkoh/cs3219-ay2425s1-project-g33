import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';

@Injectable()
export class NotificationService {
  constructor(private redisService: RedisService) {}

  // Subscribe to Redis events when the module is initialized
  onModuleInit() {
    this.redisService.subscribeToUserMatchEvents((matchedUsers) => {
      console.log('Matched users received from Redis Pub/Sub:', matchedUsers);
      // Send real-time notifications to users (e.g., WebSocket)
      matchedUsers.forEach((user) => {
        this.notifyUser(user);
      });
    });
  }

  // Mock notification function
  notifyUser(userId: string) {
    console.log(`Notifying user ${userId} of their match.`);
    // Implement WebSocket or other notification mechanism here
  }
}
