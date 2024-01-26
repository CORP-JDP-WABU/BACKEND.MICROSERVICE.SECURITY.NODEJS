import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as response from 'src/common/dto';
import * as dto from 'src/common/dto';
import * as request from '../dto';
import * as exception from 'src/exception';
import * as schemas from 'src/common/schemas';
import * as accountDto from '../dto';
import * as mongoose from 'mongoose';
import { CryptoService } from 'src/common/crypto/crypto.service';

@Injectable()
export class FnAccountRecoveryVerifyService {
  private logger = new Logger(FnAccountRecoveryVerifyService.name);

  constructor(
    @InjectModel(schemas.Students.name)
    private readonly studentModel: mongoose.Model<schemas.StudentsDocument>,
    @InjectModel(schemas.Keys.name)
    private readonly keysModel: mongoose.Model<schemas.KeysDocument>,
    private readonly cryptoService: CryptoService,
  ) {}

  async execute(
    requestAccountRecoveryVerify: request.RequestAccountRecoveryVerifyDto,
  ): Promise<response.ResponseGenericDto> {
    const { email, code } = await this.generateDecryptCredential(
      requestAccountRecoveryVerify.hash,
      requestAccountRecoveryVerify.data,
    );
    const student = await this.studentModel.findOne({
      email,
      'sendCodes.recoveryPassword': code,
    });
    if (!student) {
      throw new exception.InvalidValidateCodeCustomException(`execute`);
    }

    return <dto.ResponseGenericDto>{
      message: 'Processo exitoso',
      operation: `::${FnAccountRecoveryVerifyService.name}::execute`,
      data: <accountDto.ResponseAccountRecoveryVerifyDto>{
        isValid: true,
      },
    };
  }

  private async findKeysByRequestHash(requestHash: string) {
    const keys = await this.keysModel.findOne(
      { requestHash, 'auditProperties.recordActive': true },
      { keys: 1 },
    );
    if (!keys) {
      throw new exception.InvalidHashCustomException(`findKeysByRequestHash`);
    }
    return keys;
  }

  private async generateDecryptCredential(requestHash: string, data: string) {
    const findKeysRequest: any = await this.findKeysByRequestHash(requestHash);

    const bufferKys = {
      x1: Buffer.from(findKeysRequest.keys.x1, 'base64'),
      x2: Buffer.from(findKeysRequest.keys.x2, 'base64'),
    };

    const decryptStudentInString = await this.cryptoService.decrypt(data);
    const decryptStudenToJson = JSON.parse(decryptStudentInString);
    const decryptStudentEmail = await this.cryptoService.decrypt(
      decryptStudenToJson.email,
      bufferKys.x1,
    );
    const decryptStudentRecoveryPassword = await this.cryptoService.decrypt(
      decryptStudenToJson.code,
      bufferKys.x2,
    );

    return {
      email: decryptStudentEmail,
      code: decryptStudentRecoveryPassword,
    };
  }
}
