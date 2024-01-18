import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import * as dto from 'src/common/dto';
import * as accountDto from '../dto';
import * as exception from 'src/exception';
import * as schemas from 'src/common/schemas';
import { CryptoService } from 'src/common/crypto/crypto.service';
import { MailService } from 'src/common/mail/mail.service';
import { RECOVERY } from 'src/common/const/generate.const';

@Injectable()
export class FnAccountRegisterService {
  private logger = new Logger(FnAccountRegisterService.name);

  constructor(
    @InjectModel(schemas.Students.name)
    private readonly studentModel: mongoose.Model<schemas.StudentsDocument>,
    @InjectModel(schemas.Keys.name)
    private readonly keysModel: mongoose.Model<schemas.KeysDocument>,
    private readonly cryptoService: CryptoService,
    private readonly mailService: MailService,
  ) {}

  async execute(
    requestAccountRegisterDto: accountDto.RequestAccountRegisterDto,
  ) {
    const { email, password } = await this.generateDecryptCredential(
      requestAccountRegisterDto.hash,
      requestAccountRegisterDto.data,
    );
    const studentRegister = await this.studentModel.findOne({
      email,
      'auditProperties.status.code': 2,
    });

    if (studentRegister) {
      throw new exception.ExistStudentCustomException();
    }

    const studentRegisterPeding = await this.studentModel.findOne({
      email,
      'auditProperties.status.code': 1,
    });

    if (studentRegisterPeding) {
      const generateRegisterVerify = await this.generateRegisterVerify(
        studentRegisterPeding.id,
      );
      const sendEmail = await this.mailService.sendAccountRegister(
        email,
        generateRegisterVerify,
      );
      return <dto.ResponseGenericDto>{
        message: 'Processo exitoso',
        operation: `::${FnAccountRegisterService.name}::execute`,
        data: <accountDto.ResponseAccountRegisterDto>{
          messageId: sendEmail.messageId,
        },
      };
    }

    const registerStudentStepOne = await this.studentModel.create({
      email,
      password,
      auditProperties: {
        status: {
          code: 1,
          description: 'ACCOUNT_REGISTER_PENDING',
        },
      },
      sendCodes: {
        recoveryPassword: '0000',
        verifyRegisterAccount: '0000',
      },
    });

    const generateRegisterVerify = await this.generateRegisterVerify(
      registerStudentStepOne.id,
    );
    const sendEmail = await this.mailService.sendAccountRegister(
      email,
      generateRegisterVerify,
    );
    return <dto.ResponseGenericDto>{
      message: 'Processo exitoso',
      operation: `::${FnAccountRegisterService.name}::execute`,
      data: <accountDto.ResponseAccountRegisterDto>{
        messageId: sendEmail.messageId,
      },
    };
  }

  async executeUpdate(
    requestAccountRegisterUpdateDto: accountDto.RequestAccountRegisterUpdateDto,
  ) {
    const {
      idStudent,
      firstName,
      lastName,
      information,
      profileUrl,
      idUniversity,
      idCareer,
    } = requestAccountRegisterUpdateDto;
    const student = await this.studentModel.findOne({
      _id: idStudent,
      'auditProperties.status.code': 1,
    });

    if (!student) {
      throw new exception.ExistStudentRegisterPendingCustomException();
    }

    await this.studentModel.updateOne(
      { _id: idStudent },
      {
        $set: {
          firstName,
          lastName,
          information,
          profileUrl,
          university: {
            idUniversity: '',
            name: '',
          },
          career: {
            idCareer: '',
            name: '',
          },
        },
      },
    );

    return null;
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
    const decryptStudentPassword = await this.cryptoService.decrypt(
      decryptStudenToJson.password,
      bufferKys.x2,
    );

    this.logger.debug(
      `###### decrypt :: [${decryptStudentEmail} --- ${decryptStudentPassword}]`,
    );

    return {
      email: decryptStudentEmail,
      password: decryptStudentPassword,
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

  private async generateRegisterVerify(
    idStudent: mongoose.Types.ObjectId,
  ): Promise<String> {
    let code = '';

    for (let index = 0; index < 4; index++) {
      const randomCharacters = RECOVERY.VALUE.charAt(
        Math.floor(Math.random() * RECOVERY.VALUE.length),
      );
      code += randomCharacters;
    }
    this.logger.debug(`::generateRegisterVerify::code::${code}`);
    const studentVerifyRegisterAccount = await this.studentModel.findOne({
      _id: idStudent,
      'sendCodes.verifyRegisterAccount': code,
    });

    if (!studentVerifyRegisterAccount) {
      await this.studentModel.updateOne(
        { _id: idStudent },
        {
          $set: {
            'sendCodes.verifyRegisterAccount': code,
          },
        },
      );
      return code;
    }
    this.logger.debug(`::generateRecoveryPasswordCode::again::${idStudent}`);
    return this.generateRegisterVerify(idStudent);
  }
}
