import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { CurrentUser } from '../types/auth.types';

export const ReqUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): CurrentUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
