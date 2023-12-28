import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { CryptoModule } from 'src/common/crypto/crypto.module';
import * as services from './services';
import * as schemas from 'src/common/schemas';
import { KEYS } from 'src/common/const/keys.const';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: schemas.Students.name,
        schema: schemas.StudentsSchema,
      },
      {
        name: schemas.Securities.name,
        schema: schemas.SecuritiesSchema,
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
  ],
  controllers: [AuthController],
  providers: [
    services.FnLoginService,
    services.FnKeysService,
  ],
})
export class AuthModule {}
