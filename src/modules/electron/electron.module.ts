import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ElectronController } from './electron.controller';
import { ElectronService } from './electron.service';
import { ElectronAuthGuard } from '../../common/guards/electron-auth.guard';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('ELECTRON_JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<number>('ELECTRON_JWT_EXPIRES_IN_SECONDS', 86400), // 24 hours
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [ElectronController],
  providers: [ElectronService, ElectronAuthGuard],
  exports: [ElectronService],
})
export class ElectronModule {}
