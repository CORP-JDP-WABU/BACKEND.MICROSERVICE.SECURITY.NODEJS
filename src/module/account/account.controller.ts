import { Controller, Post, Body, UseGuards, Get, Patch } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';

import * as response from 'src/common/dto';
import * as exception from 'src/exception';


@Controller('account/v1.0')
export class AccountController {
  constructor(

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
  })
  @ApiInternalServerErrorResponse({
    description: 'The register has been failed by created account.',
  })
  register(): Promise<response.ResponseGenericDto> {
    return null
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
  })
  @ApiInternalServerErrorResponse({
    description: 'The recovery has been failed by created account.',
  })
  recovery(): Promise<response.ResponseGenericDto> {
    return null
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
  updatePassword(): Promise<response.ResponseGenericDto> {
    return null
  }

  @UseGuards(ThrottlerGuard)
  @Throttle()
  @Post('/recovery/validate')
  @ApiCreatedResponse({
    description: 'The recovery validate has been successfully recover account.',
    type: response.ResponseGenericDto,
  })
  @ApiConflictResponse({
    description: 'The recovery  has been failed by conflict account',
  })
  @ApiInternalServerErrorResponse({
    description: 'The recovery  has been failed by created account.',
  })
  recoveryValidate(): Promise<response.ResponseGenericDto> {
    return null
  }

}
