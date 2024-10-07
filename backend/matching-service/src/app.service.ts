import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class AppService {
  constructor(
    @InjectQueue('match-queue') private readonly matchingQueue: Queue,
  ) {}

  async addUserToQueue(
    userId: string,
    topic: string,
    difficulty: string,
    waitTime = 30,
  ) {
    // Add the user to the queue with a delay of 30 seconds
    await this.matchingQueue.add(
      'match-queue',
      { userId, topic, difficulty },
      { delay: waitTime * 1000 },
    );
  }

  async removeUserFromQueue(userId: string) {
    const jobs = await this.matchingQueue.getWaiting(); // Get all waiting jobs in the queue

    for (const job of jobs) {
      if (job.data.userId === userId) {
        await job.remove(); // Remove the job if userId matches
        console.log(`Removed job for user ${userId}`);
      }
    }
  }

  async matchUsers(
    userId: string,
    topic: string,
    difficulty: number,
  ): Promise<void> {
    console.log(
      `Matching user ${userId} for topic ${topic}, difficulty ${difficulty}`,
    );
    // Implement your matching algorithm or logic
  }
}
