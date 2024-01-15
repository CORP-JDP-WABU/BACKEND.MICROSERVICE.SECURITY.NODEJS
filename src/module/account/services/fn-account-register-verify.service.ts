import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { CryptoService } from 'src/common/crypto/crypto.service';
import * as exception from 'src/exception';
import * as schemas from 'src/common/schemas';
import * as accountDto from '../dto';
import * as dto from 'src/common/dto';

@Injectable()
export class FnAccountRegisterVerifyService {
  private logger = new Logger(FnAccountRegisterVerifyService.name);

  constructor(
    @InjectModel(schemas.Students.name)
    private readonly studentModel: mongoose.Model<schemas.StudentsDocument>,
    @InjectModel(schemas.Keys.name)
    private readonly keysModel: mongoose.Model<schemas.KeysDocument>,
    private readonly cryptoService: CryptoService,
  ) {}

  async execute(
    requestAccountRegisterVerifyDto: accountDto.RequestAccountRegisterVerifyDto,
  ) {
    const { email, code } = await this.generateDecryptCredential(
      requestAccountRegisterVerifyDto.hash,
      requestAccountRegisterVerifyDto.data,
    );

    const student = await this.studentModel.findOne({
      email,
      'sendCodes.verifyRegisterAccount': code,
      'auditProperties.status.code': 1,
    });

    if (!student) {
      throw new exception.InvalidRegisterAccountValidateCustomException(
        `execute`,
      );
    }

    return <dto.ResponseGenericDto>{
      message: 'Processo exitoso',
      operation: `::${FnAccountRegisterVerifyService.name}::execute`,
      data: <accountDto.ResponseAccountRegisterVerifyDto>{
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
    const decryptStudentRegisterAccout = await this.cryptoService.decrypt(
      decryptStudenToJson.code,
      bufferKys.x2,
    );

    return {
      email: decryptStudentEmail,
      code: decryptStudentRegisterAccout,
    };
  }
}
