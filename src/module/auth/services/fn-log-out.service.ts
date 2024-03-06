import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';

import * as mongoose from 'mongoose';
import { CryptoService } from 'src/common/crypto/crypto.service';
import * as schemas from 'src/common/schemas';
import * as dto from 'src/common/dto';
import * as authDto from '../dto';
import * as exception from 'src/exception';

@Injectable()
export class FnLogOutService {
  private logger = new Logger(`::${FnLogOutService.name}::`);

  constructor(
    @InjectModel(schemas.Students.name)
    private readonly studentModel: mongoose.Model<schemas.StudentsDocument>,
    @InjectModel(schemas.Securities.name)
    private readonly securityModel: mongoose.Model<schemas.SecuritiesDocument>,
    private readonly jwtService: JwtService,
    private readonly cryptoService: CryptoService,
  ) {}

  async execute(
    requestLogoutDto: authDto.RequestLogoutDto,
  ): Promise<dto.ResponseGenericDto> {
    this.logger.debug(
      `::execute::parameters::${JSON.stringify(requestLogoutDto)}`,
    );

    const { idStudent, token } = requestLogoutDto;

    const decryptToken = await this.cryptoService.decrypt(token);

    const securityStudent = await this.securityModel.findOne({
      tokens: { $in: [decryptToken] },
    });

    if (!securityStudent) {
      throw new UnauthorizedException();
    }

    if (idStudent != securityStudent.idStudent.toString()) {
      throw new exception.NotMatchStudentCustomException('LOGOUT_NOT_MATCH');
    }

    this.logger.debug(
      `::securitystudent::token::before::${securityStudent.tokens.length}`,
    );
    securityStudent.tokens = securityStudent.tokens.filter(
      (x) => x !== decryptToken,
    );
    this.logger.debug(
      `::securitystudent::token::after::${securityStudent.tokens.length}`,
    );

    await securityStudent.save();

    return <dto.ResponseGenericDto>{
      message: 'Processo exitoso',
      operation: `::${FnLogOutService.name}::execute`,
      data: {
        isRemoveToken: true,
      },
    };
  }
}
