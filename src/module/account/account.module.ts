import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { AccountController } from './account.controller';
import { CryptoModule } from 'src/common/crypto/crypto.module';
import * as schemas from 'src/common/schemas';
import { MailModule } from 'src/common/mail/mail.module';
import * as services from './services';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: schemas.Dashboards.name,
        schema: schemas.DashboardsSchema
      },
      {
        name: schemas.Universities.name,
        schema: schemas.UniversitiesSchema,
      },
      {
        name: schemas.Students.name,
        schema: schemas.StudentsSchema,
      },
      {
        name: schemas.Keys.name,
        schema: schemas.KeysSchema,
      },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        global: true,
        secret: config.get('jwt.secret'),
        signOptions: { expiresIn: '60s' },
      }),
    }),
    CryptoModule,
    MailModule,
  ],
  controllers: [AccountController],
  providers: [
    services.FnAccountRegisterService,
    services.FnAccountRegisterVerifyService,
    services.FnAccountRecoveryService,
    services.FnAccountRecoveryVerifyService,
  ],
})
export class AccountModule {}
