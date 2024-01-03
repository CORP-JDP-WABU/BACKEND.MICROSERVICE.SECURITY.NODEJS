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
    @InjectModel(schemas.Securities.name)
    private readonly securityModel: mongoose.Model<schemas.SecuritiesDocument>,
    private readonly jwtService: JwtService,
    private readonly cryptoService: CryptoService,
  ) {}

  async execute(
    requestLoginDto: authDto.RequestLoginDto,
  ): Promise<dto.ResponseGenericDto> {
    this.logger.debug(
      `::execute::parameters::${JSON.stringify(requestLoginDto)}`,
    );
    const { email, password } = requestLoginDto;
    const findUserByEmailPassword: schemas.StudentsDocument =
      await this.findUserByEmailPassword(email, password);
    const generateTokenForUser = await this.generateTokenForUser(
      findUserByEmailPassword._id,
      findUserByEmailPassword.email,
    );
    await this.registerSecurityForUser(
      findUserByEmailPassword._id,
      generateTokenForUser.tokenDecrypt,
    );
    return <dto.ResponseGenericDto>{
      message: 'Processo exitoso',
      operation: `::${FnLoginService.name}::execute`,
      data: <authDto.ResponseLoginDto>{
        token: generateTokenForUser.tokenEncrypt,
      },
    };
  }

  private async findUserByEmailPassword(email: string, password: string) {
    const userByEmailPassword = await this.studentModel.findOne({
      email,
      password,
    });
    if (!userByEmailPassword)
      throw new exception.InvalidCredentialsCustomException(
        `findUserByEmailPassword`,
      );

    this.logger.debug(
      `::execute::findUserByEmailPassword::${userByEmailPassword.email}`,
    );
    return userByEmailPassword;
  }

  private async generateTokenForUser(idUser: string, email: string) {
    try {
      const token = await this.jwtService.signAsync({ idUser, email });
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

  private async registerSecurityForUser(
    idUser: mongoose.Types.ObjectId,
    token: string,
  ) {
    try {
      const findSecurityByIdUser = await this.securityModel.findOne({ idUser });
      if (!findSecurityByIdUser) {
        await this.securityModel.create({ idUser, tokens: [token] });
      } else {
        await this.securityModel.updateOne(
          { idUser },
          { $addToSet: { tokens: token } },
        );
      }
    } catch (error) {
      this.logger.error(error);
      throw new exception.RegisterSecurityInternalException();
    }
  }
}
