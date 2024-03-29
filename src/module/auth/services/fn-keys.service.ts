import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import * as crypto from 'crypto';
import * as schemas from 'src/common/schemas';
import * as dto from 'src/common/dto';
import * as authDto from '../dto';
import * as exception from 'src/exception';
import { AuditPropertiesSchema } from 'src/common/schemas/audit-properties.schema';
import { CryptoService } from 'src/common/crypto/crypto.service';

@Injectable()
export class FnKeysService {
  private logger = new Logger(`::${FnKeysService.name}::`);

  constructor(
    @InjectModel(schemas.Keys.name)
    private readonly keysModel: mongoose.Model<schemas.KeysDocument>,
    private readonly cryptoService: CryptoService,
  ) {}

  async execute(): Promise<dto.ResponseGenericDto> {
    this.logger.debug(`::execute::parameters::`);
    const { requestHash, credentialKeyBase64, passwordKeyBase64 } =
      await this.generateHashAndKeys();
    const hash: any = await this.registerHash(
      requestHash,
      credentialKeyBase64,
      passwordKeyBase64,
    );

    return <dto.ResponseGenericDto>{
      message: 'Processo exitoso',
      operation: `::${FnKeysService.name}::execute`,
      data: <authDto.ResponseKeysDto>{
        keys: hash.keys,
        hash: hash.requestHash,
      },
    };
  }

  private async generateHashAndKeys() {
    try {
      const requestHash: any = crypto
        .createHash('md5')
        .update(crypto.randomBytes(16))
        .digest('hex');

      const credentialsKey: any = crypto.randomBytes(32);
      const passwordKey: any = crypto.randomBytes(32);

      const credentialKeyBase64: any = credentialsKey.toString('base64');
      const passwordKeyBase64: any = passwordKey.toString('base64');

      return {
        requestHash,
        credentialKeyBase64,
        passwordKeyBase64,
      };
    } catch (error) {
      this.logger.error(error);
      throw new exception.GenerateHashKeysInternalException();
    }
  }

  private async registerHash(
    requestHash: string,
    credentialKeyBase64: string,
    passwordKeyBase64: string,
  ) {
    try {
      const hash: any = await this.keysModel.create({
        requestHash: requestHash,
        keys: {
          x1: credentialKeyBase64,
          x2: passwordKeyBase64,
        },
        auditProperties: <AuditPropertiesSchema>{
          dateUpdate: null,
          dateCreate: new Date(),
          recordActive: true,
          status: {
            code: 1,
            description: 'CREATED',
          },
          userUpdate: null,
          userCreate: `${FnKeysService.name}`,
        },
      });

      return hash;
    } catch (error) {
      this.logger.error(error);
      throw new exception.RegisterHashInternalException();
    }
  }
}
