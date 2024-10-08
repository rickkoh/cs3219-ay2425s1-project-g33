import { Injectable } from '@nestjs/common';
import { MatchRequestDto } from './dto';
import { RedisService } from './redis.service';
import { PriorityQueue } from './helper/priority-queue';

@Injectable()
export class MatchWorkerService {
  constructor(private readonly redisService: RedisService) {}

  // Poll for matches at a regular interval
  async pollForMatches() {
    setInterval(async () => {
      const users = await this.redisService.getUsersFromPool();
      console.log('polling', users)

      if (users.length >= 2) {
        const matches = this.rankUsers(users);
        const bestMatch = matches[0];

        // Notify the gateway via Redis Pub/Sub
        await this.notifyGateway([bestMatch.user1.userId, bestMatch.user2.userId]);

        // Remove the matched users from the Redis pool
        await this.redisService.removeUsersFromPool([bestMatch.user1.userId, bestMatch.user2.userId]);
      }
    }, 5000);
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
    return matches.sort((a, b) => b.score - a.score)
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
    await this.redisService.publishMatchedUsers(matchedUserIds);
  }
}

