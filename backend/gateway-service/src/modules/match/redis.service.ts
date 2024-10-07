import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private redisSubscriber: Redis;

  constructor() {
    // Initialize Redis for subscribing to match notifications
    this.redisSubscriber = new Redis({
      host: 'backend-redis-1',
      port: 6379,
    });
  }

  // Subscribe to Redis Pub/Sub events for match notifications
  subscribeToUserMatchEvents(matchCallback: (users: any) => void) {
    // Subscribe to the Redis Pub/Sub channel 'matchChannel'
    this.redisSubscriber.subscribe('matchChannel', (err, count) => {
      if (err) {
        console.error('Error subscribing to Redis channel:', err);
        return;
      }
      console.log('Subscribed to Redis channel matchChannel.');
    });

    // Listen for messages on the 'matchChannel' and trigger the callback
    this.redisSubscriber.on('message', (channel, message) => {
      if (channel === 'matchChannel') {
        const matchedUsers = JSON.parse(message);  // Parse the JSON message
        matchCallback(matchedUsers);  // Call the provided callback with the matched users
      }
    });
  }
}
