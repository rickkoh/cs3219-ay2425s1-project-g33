import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { MatchRequestDto } from './dto';
import { RedisService } from './redis.service';

@Injectable()
export class AppService {
  constructor(
    @Inject('USER_SERVICE') private readonly userClient: ClientProxy,
    private redisService: RedisService,
  ) {}

  async requestMatch(data: MatchRequestDto) {
    await this.redisService.addUserToPool(data);
  }
}
