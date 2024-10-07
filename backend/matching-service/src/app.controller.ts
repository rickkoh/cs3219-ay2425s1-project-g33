import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { EventPattern, Payload } from '@nestjs/microservices';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @EventPattern('match.request')  // Listen for the 'match.request' event
  async handleMatchRequest(@Payload() data: any) {
    const { userId, topic, difficulty } = data;
    
    // Process the match request in the service
    await this.appService.addUserToQueue(userId, topic, difficulty);
  }

  @EventPattern('match.cancel')   // Listen for the 'match.cancel' event
  async handleCancelRequest(@Payload() data: any) {
    const { userId } = data;

    // Process the cancellation in the service
    await this.appService.removeUserFromQueue(userId);
  }
}
