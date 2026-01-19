import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { CurrentUser } from '../types/auth.types';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: CurrentUser = request.user;

    if (!user || !user.restaurantId) {
      throw new ForbiddenException('Restaurant context is required');
    }

    // Attach restaurantId to request for easy access
    request.restaurantId = user.restaurantId;

    return true;
  }
}
