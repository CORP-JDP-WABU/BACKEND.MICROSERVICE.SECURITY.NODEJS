import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';

import * as mongoose from 'mongoose';
import { CryptoService } from 'src/common/crypto/crypto.service';
import * as schemas from 'src/common/schemas';
import * as dto from 'src/common/dto';
import * as authDto from '../dto';
import * as exception from 'src/exception';

@Injectable()
export class FnLoginService {
  private logger = new Logger(`::${FnLoginService.name}::`);

  constructor(
    @InjectModel(schemas.Students.name)
    private readonly studentModel: mongoose.Model<schemas.StudentsDocument>,
    @InjectModel(schemas.Keys.name)
    private readonly keysModel: mongoose.Model<schemas.KeysDocument>,
    @InjectModel(schemas.Securities.name)
    private readonly securityModel: mongoose.Model<schemas.SecuritiesDocument>,
    private readonly jwtService: JwtService,
    private readonly cryptoService: CryptoService, //private readonly emmitService: EmittingService
  ) {}

  async execute(
    requestLoginDto: authDto.RequestLoginDto,
  ): Promise<dto.ResponseGenericDto> {
    this.logger.debug(
      `::execute::parameters::${JSON.stringify(requestLoginDto)}`,
    );
    const { email, password } = await this.generateDecryptCredential(
      requestLoginDto.hash,
      requestLoginDto.data,
    );
    const findUserByEmailPassword: schemas.StudentsDocument =
      await this.findUserByEmailPassword(email, password);

    const generateTokenForUser = await this.generateTokenForUser(
      findUserByEmailPassword._id,
      findUserByEmailPassword.university._id.toString(),
      findUserByEmailPassword.email,
    );
    await this.registerSecurityForUser(
      findUserByEmailPassword._id,
      generateTokenForUser.tokenDecrypt,
    );

    //this.emmitService.emitEvenToUniversityKpiIncrementStudentConnected("idUniversity");

    return <dto.ResponseGenericDto>{
      message: 'Processo exitoso',
      operation: `::${FnLoginService.name}::execute`,
      data: <authDto.ResponseLoginDto>{
        idStudent: findUserByEmailPassword._id,
        idUniversity: findUserByEmailPassword.university._id,
        isFirstLogin: findUserByEmailPassword.isFirstLogin,
        token: generateTokenForUser.tokenEncrypt,
      },
    };
  }

  private async findUserByEmailPassword(email: string, password: string) {
    const userByEmail = await this.studentModel.findOne({
      email,
      //password,
      //'auditProperties.status.code': 2,
    });
    
    if (!userByEmail)
      throw new exception.InvalidCredentialsEmailCustomException(
        `LOGIN_EMAIL_FAILED`,
      );

    const userByEmailPassword = await this.studentModel.findOne({
      email,
      password,
      //'auditProperties.status.code': 2,
    });
    if (!userByEmailPassword)
      throw new exception.InvalidCredentialsPasswordCustomException(
        `LOGIN_PASSWORD_FAILED`,
      );
        
    if (!userByEmailPassword.university._id)
      throw new exception.PendingToRegisterAccountCustomException(
        'LOGIN_REGISTER_PENDING',
      );

    if (userByEmailPassword.university.name == "UNIVERSITY_NOT_FOUND")
      throw new exception.NotExistUniversityRegisterCustomException(
        'UNIVERSITY_NOT_FOUND',
      );

    return userByEmailPassword;
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

  private async generateTokenForUser(
    idStudent: string,
    idUniversity: string,
    email: string,
  ) {
    try {
      const token = await this.jwtService.signAsync({
        idStudent,
        idUniversity,
        email,
      });
      const encrypt = await this.cryptoService.encrypt(token);
      return {
        tokenEncrypt: encrypt,
        tokenDecrypt: token,
      };
    } catch (error) {
      this.logger.error(error);
      throw new exception.GenerateTokenInternalException();
    }
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

    //this.logger.debug(`###### decrypt :: [${decryptStudentEmail} --- ${decryptStudentPassword}]`);

    return {
      email: decryptStudentEmail,
      password: decryptStudentPassword,
    };
  }

  private async registerSecurityForUser(
    idStudent: mongoose.Types.ObjectId,
    token: string,
  ) {
    try {
      const findSecurityByIdStudentr = await this.securityModel.findOne({
        idStudent,
      });
      if (!findSecurityByIdStudentr) {
        await this.securityModel.create({ idStudent, tokens: [token] });
      } else {
        await this.securityModel.updateOne(
          { idStudent },
          { $addToSet: { tokens: token } },
        );
      }
    } catch (error) {
      this.logger.error(error);
      throw new exception.RegisterSecurityInternalException();
    }
  }
}
