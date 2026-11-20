import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { AuthguardGuard } from './guard/authguard/authguard.guard';
import { TaskModule } from './task/task.module';

@Module({
  imports: [UserModule, AuthModule, ConfigModule.forRoot({ isGlobal: true }), TypeOrmModule.forRootAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => ({
      type: 'mysql',
      host: configService.get('DB_HOST'),
      port: configService.get<number>('DB_PORT', 3306),
      username: configService.get('DB_USERNAME'),
      password: configService.get('DB_PASSWORD'),
      database: configService.get('DB_DATABASE'),
      autoLoadEntities: true,
      synchronize: true,
    })
  }), TaskModule],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: AuthguardGuard }],
})
export class AppModule { }
