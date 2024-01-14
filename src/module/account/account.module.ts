import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { AccountController } from './account.controller';
import { CryptoModule } from 'src/common/crypto/crypto.module';
import * as schemas from 'src/common/schemas';
import { KEYS } from 'src/common/const/keys.const';
import { MailModule } from 'src/common/mail/mail.module';
import { FnAccountRecoveryService } from './services';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: schemas.Students.name,
        schema: schemas.StudentsSchema,
      },
      {
        name: schemas.Keys.name,
        schema: schemas.KeysSchema,
      },
    ]),
    JwtModule.register({
      global: true,
      secret: KEYS.jwt_secret,
      signOptions: { expiresIn: '60s' },
    }),
    CryptoModule,
    MailModule
  ],
  controllers: [AccountController],
  providers: [FnAccountRecoveryService],
})
export class AccountModule {}
