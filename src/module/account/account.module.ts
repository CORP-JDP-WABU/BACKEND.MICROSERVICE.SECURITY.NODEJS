import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { AccountController } from './account.controller';
import { CryptoModule } from 'src/common/crypto/crypto.module';
import * as schemas from 'src/common/schemas';
import { KEYS } from 'src/common/const/keys.const';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: schemas.Students.name,
        schema: schemas.StudentsSchema,
      },
    ]),
    JwtModule.register({
      global: true,
      secret: KEYS.jwt_secret,
      signOptions: { expiresIn: '60s' },
    }),
    CryptoModule,
  ],
  controllers: [AccountController],
  providers: [],
})
export class AccountModule {}
