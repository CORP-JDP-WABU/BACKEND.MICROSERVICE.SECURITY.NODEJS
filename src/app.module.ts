import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import configuration from './config/configuration';
import { AuthModule } from './module/auth/auth.module';
import { AccountModule } from './module/account/account.module';
import { TcpAuthService } from './module/tcp/tcp-auth.service';
import { TcpAuthController } from './module/tcp/tcp-auth.controller';
import * as schemas from 'src/common/schemas';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [configuration],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        ...configService.get('mongodb'),
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      {
        name: schemas.Securities.name,
        schema: schemas.SecuritiesSchema,
      },
      {
        name: schemas.Students.name,
        schema: schemas.StudentsSchema,
      },
    ]),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ttl: config.get('http.throttle.ttl'),
        limit: config.get('http.throttle.limit'),
      }),
    }),
    AuthModule,
    AccountModule,
  ],
  controllers: [AppController, TcpAuthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    TcpAuthService,
  ],
})
export class AppModule {}
