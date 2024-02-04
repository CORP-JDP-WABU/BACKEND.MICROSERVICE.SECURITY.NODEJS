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
import { IAccountWelcome } from 'src/common/mail/interfaces';

@Injectable()
export class FnAccountRegisterService {
  private logger = new Logger(FnAccountRegisterService.name);

  constructor(
    @InjectModel(schemas.Dashboards.name)
    private readonly dashboardModel: mongoose.Model<schemas.DashboardsDocument>,
    @InjectModel(schemas.Universities.name)
    private readonly universityModel: mongoose.Model<schemas.UniversitiesDocument>,
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
    this.logger.debug(`::generateDecryptCredential::${email}-${password}`);
    const studentRegister = await this.studentModel.findOne({
      email,
      //'auditProperties.status.code': 2,
    });

    if (studentRegister) {
      throw new exception.ExistStudentCustomException(
        `REGISTER_ACCOUNT_EMAIL_FAIL`,
      );
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
        recordActive: true,
        userUpdate: null,
        userCreated: email,
        dateUpdate: null,
        dateCreate: new Date(),
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
      cicleName,
      isRegisterNewAccount,
    } = requestAccountRegisterUpdateDto;

    this.logger.debug(`::requestAccountRegisterUpdateDto::${JSON.stringify(requestAccountRegisterUpdateDto)}`);

    const studentPromise = this.studentModel.findOne({
      _id: mongoose.Types.ObjectId(idStudent),
      'auditProperties.status.code': 1,
    });
    const universityPromise = this.universityModel.findOne({
      _id: mongoose.Types.ObjectId(idUniversity),
      'careers._id': mongoose.Types.ObjectId(idCareer),
      'careers.cicles': { $in: [cicleName] },
    });

    const [student, university] = await Promise.all([
      studentPromise,
      universityPromise,
    ]);

    if (!student) {
      throw new exception.ExistStudentRegisterPendingCustomException(
        `REGISTER_ACCOUNT_EXIST_STUDENT`,
      );
    }

    if (!university) {
      throw new exception.NotExistUniversityRegisterCustomException(
        `REGISTER_ACCOUNT_NOTEXIST_UNIVERSITY`,
      );
    }

    const universityCareerAndCicles = university.careers.find(
      (career) => career._id.toString() == idCareer,
    );

    const career = {
      _id: universityCareerAndCicles._id,
      name: universityCareerAndCicles.name,
    };

    const userUpdate = `${firstName[0]}${lastName.slice(0, 3)}`;

    const updateStudent = await this.studentModel.findOneAndUpdate(
      { _id: idStudent },
      {
        $set: {
          firstName,
          lastName,
          information,
          profileUrl,
          university: {
            _id: university.id,
            name: university.name,
          },
          career,
          cicleName,
          isFirstLogin: true,
          'auditProperties.userUpdate': userUpdate.toUpperCase(),
          'auditProperties.dateUpdate': new Date(),
          'auditProperties.status.code': 2,
          'auditProperties.status.description': 'ACCOUNT_REGISTER',
        },
      },
    );

    await this.mailService.sendAccountWelcome(<IAccountWelcome>{
      email: updateStudent.email,
      password: updateStudent.password,
      fullName: `${firstName} ${lastName}`,
      university: university.name,
      career: career.name,
      information: information,
      profileUrl: profileUrl,
      cicle: cicleName,
    });

    if (isRegisterNewAccount !== undefined && isRegisterNewAccount) {
      this.dashboardModel.updateMany(
        { 'university._id': mongoose.Types.ObjectId(idUniversity) },
        {
          $inc: {
            'kpis.manyStudentConnected': 1,
          },
        },
        { multi: true },
      );
    }

    return <dto.ResponseGenericDto>{
      message: 'Processo exitoso',
      operation: `::${FnAccountRegisterService.name}::execute`,
      data: <accountDto.ResponseAccountRegisterUpdateDto>{
        isUpdate: true,
      },
    };
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

    for (let index = 0; index < 6; index++) {
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
