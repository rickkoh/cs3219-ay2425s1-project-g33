import { ValidationPipe, BadRequestException } from '@nestjs/common';

export const WsValidationPipe = new ValidationPipe({
  transform: true,
  whitelist: true,
  exceptionFactory: (errors) => {
    const formattedErrors = errors.map((error) => {
      const constraints = Object.values(error.constraints).join(', ');
      return `${error.property}: ${constraints}`;
    });

    return new BadRequestException(formattedErrors.join('; '));
  },
});
