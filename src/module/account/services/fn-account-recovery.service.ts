import { Injectable, Logger } from '@nestjs/common';
import * as response from 'src/common/dto';
import { MailService } from 'src/common/mail/mail.service';
import * as dto from 'src/common/dto';
import * as request from '../dto';
import * as exception from 'src/exception';
import * as schemas from 'src/common/schemas';
import * as accountDto from '../dto';
import { InjectModel } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { CryptoService } from 'src/common/crypto/crypto.service';
import { RECOVERY } from 'src/common/const/generate.const';

@Injectable()
export class FnAccountRecoveryService {
  private logger = new Logger(FnAccountRecoveryService.name);
  constructor(
    @InjectModel(schemas.Students.name)
    private readonly studentModel: mongoose.Model<schemas.StudentsDocument>,
    @InjectModel(schemas.Keys.name)
    private readonly keysModel: mongoose.Model<schemas.KeysDocument>,
    private readonly mailService: MailService,
    private readonly cryptoService: CryptoService,
  ) {}

  async execute(
    requestAccountRecovery: request.RequestAccountRecoveryDto,
  ): Promise<response.ResponseGenericDto> {
    const { email } = await this.generateDecryptCredential(
      requestAccountRecovery.hash,
      requestAccountRecovery.data,
    );
    const student = await this.studentModel.findOne({ email });
    
    if(!student) {
      throw new exception.NotExistStudentRecoveryCustomException(`RECOVERY_PASSWORD_NOT_EXIST_STUDENT`);
    }

    this.logger.debug(`::execute::student::[${student.id} - ${student.email}]`);
    const fullName = `${student.firstName} ${student.lastName}`;
    const generateRecoveryPassword = await this.generateRecoveryPasswordCode(
      student.id,
    );
    const sendEmail = await this.mailService.sendAccountRecovery(
      email,
      generateRecoveryPassword,
      fullName,
    );
    return <dto.ResponseGenericDto>{
      message: 'Processo exitoso',
      operation: `::${FnAccountRecoveryService.name}::execute`,
      data: <accountDto.ResponseAccountRecoveryDto>{
        messageId: sendEmail.messageId,
      },
    }
    
  }

  async executeUpdate(
    requestAccountRecovery: request.RequestAccountRecoveryDto,
  ): Promise<response.ResponseGenericDto> {
    const { email, password } = await this.generateDecryptCredential(
      requestAccountRecovery.hash,
      requestAccountRecovery.data,
      true,
    );
    const student = await this.studentModel.findOne({ email });

    if(!student) {
      throw new exception.NotExistStudentRecoveryCustomException('RECOVERY_PASSWORD_NOT_EXIST_STUDENT');
    }

    this.logger.debug(
      `::executeUpdate::student::[${student.id} - ${student.email}]`,
    );
    await this.studentModel.updateOne(
      { _id: student.id },
      {
        $set: {
          password,
          'sendCodes.recoveryPassword': '0000'
        },
      },
    );

    await this.mailService.sendRecoverySuccess(
      student.firstName
    );
    return <dto.ResponseGenericDto>{
      message: 'Processo exitoso',
      operation: `::${FnAccountRecoveryService.name}::execute`,
      data: <accountDto.ResponseAccountRecoveryUpdateDto>{
        isUpdate: true,
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

  private async generateDecryptCredential(
    requestHash: string,
    data: string,
    haveDecryptPassword?: boolean,
  ) {
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

    return {
      email: decryptStudentEmail,
      password: haveDecryptPassword
        ? await this.cryptoService.decrypt(
            decryptStudenToJson.password,
            bufferKys.x1,
          )
        : null,
    };
  }

  private async generateRecoveryPasswordCode(
    idStudent: mongoose.Types.ObjectId,
  ): Promise<String> {
    let code = '';

    for (let index = 0; index < 6; index++) {
      const randomCharacters = RECOVERY.VALUE.charAt(
        Math.floor(Math.random() * RECOVERY.VALUE.length),
      );
      code += randomCharacters;
    }
    this.logger.debug(`::generateRecoveryPasswordCode::code::${code}`);
    const studentRecoveryPassword = await this.studentModel.findOne({
      _id: idStudent,
      'sendCodes.recoveryPassword': code,
    });

    if (!studentRecoveryPassword) {
      await this.studentModel.updateOne(
        { _id: idStudent },
        {
          $set: {
            'sendCodes.recoveryPassword': code,
          },
        },
      );
      return code;
    }
    this.logger.debug(`::generateRecoveryPasswordCode::again::${idStudent}`);
    return this.generateRecoveryPasswordCode(idStudent);
  }
}
