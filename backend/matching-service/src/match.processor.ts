import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { AppService } from './app.service';

@Processor('match-queue')  // Listen to the 'match-queue'
export class MatchProcessor {
  constructor(private readonly appService: AppService) {}

  @Process()  // Automatically process jobs from the queue
  async handleMatchJob(job: Job<any>) {
    const { userId, topic, difficulty } = job.data;  // Extract job data

    await this.appService.matchUsers(userId, topic, difficulty);  // Delegate to the service
  }
}
