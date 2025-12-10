import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ErrorCodes } from '../constants/error-codes';

@Injectable()
export class ElectronAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException({
        code: ErrorCodes.AUTH_REQUIRED,
        message: 'Authorization header missing or invalid',
      });
    }

    const token = authHeader.substring(7);

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('ELECTRON_JWT_SECRET'),
      });

      request.electronUser = payload;
      return true;
    } catch {
      throw new UnauthorizedException({
        code: ErrorCodes.INVALID_TOKEN,
        message: 'Invalid or expired token',
      });
    }
  }
}
