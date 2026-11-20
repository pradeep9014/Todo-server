import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from 'src/auth/public.decorator';

@Injectable()
export class AuthguardGuard implements CanActivate {

  constructor(private readjwt: JwtService, private readonly reflector: Reflector,) { }

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    try {

      const isPublic = this.reflector.getAllAndOverride<boolean>(
        IS_PUBLIC_KEY,
        [
          context.getHandler(),
          context.getClass(),
        ],
      );

      if (isPublic) {
        return true;
      }

      const request = context.switchToHttp().getRequest<Request>();

      const authHeader = request.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException('Token not provided');
      }

      const token = authHeader.split(' ')[1];

      if (!token) {
        throw new UnauthorizedException('Invalid token format');
      }

      const payload = await this.readjwt.verifyAsync(token);


      request['user'] = payload
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
