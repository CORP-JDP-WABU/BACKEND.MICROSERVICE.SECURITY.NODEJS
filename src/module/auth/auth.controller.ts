import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiTags,
} from '@nestjs/swagger';

import * as response from 'src/common/dto';
import * as exception from 'src/exception';
import * as services from './services';
import * as request from './dto';

@Controller('auth/v1.0')
@ApiTags('AUTH')
export class AuthController {
  constructor(
    private readonly fnLoginService: services.FnLoginService,
    private readonly fnKeysService: services.FnKeysService,
  ) {}

  @UseGuards(ThrottlerGuard)
  @Throttle()
  @Get('/keys')
  @ApiCreatedResponse({
    description: 'The keys has been successfully created authentication.',
    type: response.ResponseGenericDto,
  })
  @ApiConflictResponse({
    description: 'The keys has been failed by conflict authentication',
  })
  @ApiInternalServerErrorResponse({
    description: 'The keys has been failed by created authentication.',
  })
  keys(): Promise<response.ResponseGenericDto> {
    return this.fnKeysService.execute();
  }

  @UseGuards(ThrottlerGuard)
  @Throttle()
  @Post('/login')
  @ApiCreatedResponse({
    description: 'The login has been successfully created authentication.',
    type: response.ResponseGenericDto,
  })
  @ApiConflictResponse({
    description: 'The login has been failed by conflict authentication',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal Server Exception.',
    type: exception.GenerateTokenInternalException,
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal Server Exception.',
    type: exception.RegisterSecurityInternalException,
  })
  @ApiConflictResponse({
    description: 'Conflict Exception',
    type: exception.InvalidCredentialsEmailCustomException,
  })
  @ApiConflictResponse({
    description: 'Conflict Exception',
    type: exception.InvalidCredentialsPasswordCustomException,
  })
  @ApiConflictResponse({
    description: 'Conflict Exception',
    type: exception.InvalidHashCustomException,
  })
  login(
    @Body() requestLodinDto: request.RequestLoginDto,
  ): Promise<response.ResponseGenericDto> {
    return this.fnLoginService.execute(requestLodinDto);
  }
}
