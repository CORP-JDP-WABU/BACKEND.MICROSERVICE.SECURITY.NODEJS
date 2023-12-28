import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';

import * as response from 'src/common/dto';
import * as exception from 'src/exception';
import * as services from './services';
import * as request from './dto'

@Controller('auth/v1.0')
export class AuthController {
  constructor(
    private readonly fnLoginService: services.FnLoginService,
    private readonly fnKeysService: services.FnKeysService
  ) {}

  @UseGuards(ThrottlerGuard)
  @Throttle()
  @Get('/v1.0/keys')
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
  @ApiConflictResponse({
    description: 'Conflict Exception',
    type: exception.InvalidCredentialsCustomException,
  })
  login(
    @Body() requestLodinDto: request.RequestLoginDto,
  ): Promise<response.ResponseGenericDto> {
    return this.fnLoginService.execute(requestLodinDto);
  }

}
