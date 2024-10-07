import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';
import { MatchRequestDto } from './dto';

@Injectable()
export class MatchWorkerService {
  constructor(private readonly redisService: RedisService) {}

  // Poll for matches at a regular interval
  async pollForMatches() {
    setInterval(async () => {
      const users = await this.redisService.getUsersFromPool(); // Get users from Redis pool
      console.log('polling', users)

      if (users.length >= 2) {
        const matches = this.rankUsers(users);
        const bestMatch = matches[0];  // Find the best match

        console.log(`Matched users: ${bestMatch.user1.userId} and ${bestMatch.user2.userId}`);

        // Notify the gateway via Redis Pub/Sub
        await this.notifyGateway([bestMatch.user1.userId, bestMatch.user2.userId]);

        // Remove the matched users from the Redis pool
        await this.redisService.removeUsersFromPool([bestMatch.user1.userId, bestMatch.user2.userId]);
      }
    }, 5000); // Poll every 5 seconds
  }

  // Ranking logic for matches
  rankUsers(users: MatchRequestDto[]): { user1: MatchRequestDto, user2: MatchRequestDto, score: number }[] {
    const matches = [];
    for (let i = 0; i < users.length; i++) {
      for (let j = i + 1; j < users.length; j++) {
        const score = this.calculateScore(users[i], users[j]);
        matches.push({ user1: users[i], user2: users[j], score });
      }
    }
    return matches.sort((a, b) => b.score - a.score);  // Sort matches by score
  }

  private calculateScore(user1: MatchRequestDto, user2: MatchRequestDto): number {
    let score = 0;
    const matchingTopics = user1.selectedTopic.filter(topic => user2.selectedTopic.includes(topic));
    score += matchingTopics.length * 3;
    if (user1.selectedDifficulty === user2.selectedDifficulty) {
      score += 2;
    }
    return score;
  }

  // Notify the gateway service about the match via Redis Pub/Sub
  async notifyGateway(matchedUserIds: string[]) {
    // Publish matched users to the Redis Pub/Sub channel
    await this.redisService.publishMatchedUsers(matchedUserIds);
  }
}

