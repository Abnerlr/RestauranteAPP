import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const ReqRestaurantId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.restaurantId || request.user?.restaurantId;
  },
);
