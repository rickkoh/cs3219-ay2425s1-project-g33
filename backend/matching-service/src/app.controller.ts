import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { MatchRequestDto } from './dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @EventPattern('match.request')
  async handleMatchRequest(@Payload() data: MatchRequestDto) {
    await this.appService.requestMatch(data);
  }
}
