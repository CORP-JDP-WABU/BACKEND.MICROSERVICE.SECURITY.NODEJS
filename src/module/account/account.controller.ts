import { Controller, Post, Body, UseGuards, Patch } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiTags,
} from '@nestjs/swagger';

import * as response from 'src/common/dto';
import * as exception from 'src/exception';
import * as request from './dto';
import * as services from './services';

@Controller('account/v1.0')
@ApiTags('ACCOUNT')
export class AccountController {
  constructor(
    private readonly fnAccountRegisterService: services.FnAccountRegisterService,
    private readonly fnAccountRegisterVerifyService: services.FnAccountRegisterVerifyService,
    private readonly fnAccountRecoveryService: services.FnAccountRecoveryService,
    private readonly fnAccountRecoveryVerifyService: services.FnAccountRecoveryVerifyService,
  ) {}

  @UseGuards(ThrottlerGuard)
  @Throttle()
  @Post('/register')
  @ApiCreatedResponse({
    description: 'The register has been successfully created account.',
    type: response.ResponseGenericDto,
  })
  @ApiConflictResponse({
    description: 'The register has been failed by conflict account',
    type: exception.ExistStudentCustomException,
  })
  @ApiConflictResponse({
    description: 'The register has been failed by conflict account',
    type: exception.InvalidHashCustomException,
  })
  @ApiInternalServerErrorResponse({
    description: 'The register has been failed by created account.',
  })
  register(
    @Body() requestAccountRegisterDto: request.RequestAccountRegisterDto,
  ): Promise<response.ResponseGenericDto> {
    return this.fnAccountRegisterService.execute(requestAccountRegisterDto);
  }

  @UseGuards(ThrottlerGuard)
  @Throttle()
  @Patch('/register')
  @ApiCreatedResponse({
    description: 'The update register has been successfully created account.',
    type: response.ResponseGenericDto,
  })
  @ApiConflictResponse({
    description: 'The update register has been failed by conflict account',
  })
  @ApiInternalServerErrorResponse({
    description: 'The update register has been failed by created account.',
  })
  updateRegister(
    @Body()
    requestAccountRegisterUpdateDto: request.RequestAccountRegisterUpdateDto,
  ): Promise<response.ResponseGenericDto> {
    return this.fnAccountRegisterService.executeUpdate(
      requestAccountRegisterUpdateDto,
    );
  }

  @UseGuards(ThrottlerGuard)
  @Throttle()
  @Post('/register/verify')
  @ApiCreatedResponse({
    description: 'The register verify has been successfully created account.',
    type: response.ResponseGenericDto,
  })
  @ApiConflictResponse({
    description: 'The register verify has been failed by conflict account',
    type: exception.InvalidValidateCodeCustomException,
  })
  @ApiConflictResponse({
    description: 'The register verify has been failed by conflict account',
    type: exception.InvalidHashCustomException,
  })
  @ApiInternalServerErrorResponse({
    description: 'The register verify has been failed by created account.',
  })
  registerVerify(
    @Body()
    requestAccountRegisterVerifyDto: request.RequestAccountRegisterVerifyDto,
  ): Promise<response.ResponseGenericDto> {
    return this.fnAccountRegisterVerifyService.execute(
      requestAccountRegisterVerifyDto,
    );
  }

  @UseGuards(ThrottlerGuard)
  @Throttle()
  @Post('/recovery')
  @ApiCreatedResponse({
    description: 'The recovery has been successfully recover account.',
    type: response.ResponseGenericDto,
  })
  @ApiConflictResponse({
    description: 'The recovery has been failed by conflict account',
    type: exception.InvalidHashCustomException,
  })
  @ApiInternalServerErrorResponse({
    description: 'The recovery has been failed by created account.',
  })
  recovery(
    @Body() requestAccountRecovery: request.RequestAccountRecoveryDto,
  ): Promise<response.ResponseGenericDto> {
    return this.fnAccountRecoveryService.execute(requestAccountRecovery);
  }

  @UseGuards(ThrottlerGuard)
  @Throttle()
  @Patch('/recovery')
  @ApiCreatedResponse({
    description: 'The recovery has been successfully update account.',
    type: response.ResponseGenericDto,
  })
  @ApiConflictResponse({
    description: 'The recovery  has been failed by conflict update account',
  })
  @ApiInternalServerErrorResponse({
    description: 'The recovery  has been failed by update account.',
  })
  updatePassword(
    @Body() requestAccountRecovery: request.RequestAccountRecoveryDto,
  ): Promise<response.ResponseGenericDto> {
    return this.fnAccountRecoveryService.executeUpdate(requestAccountRecovery);
  }

  @UseGuards(ThrottlerGuard)
  @Throttle()
  @Post('/recovery/verify')
  @ApiCreatedResponse({
    description: 'The recovery verify has been successfully recover account.',
    type: response.ResponseGenericDto,
  })
  @ApiConflictResponse({
    description: 'The recovery verify has been failed by conflict account',
  })
  @ApiInternalServerErrorResponse({
    description: 'The recovery verify has been failed by created account.',
  })
  recoveryVerify(
    @Body()
    requestAccountRecoveryVerify: request.RequestAccountRecoveryVerifyDto,
  ): Promise<response.ResponseGenericDto> {
    return this.fnAccountRecoveryVerifyService.execute(
      requestAccountRecoveryVerify,
    );
  }
}
