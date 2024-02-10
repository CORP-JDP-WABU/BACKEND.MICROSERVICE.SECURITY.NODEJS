import { ApiProperty } from '@nestjs/swagger';
import * as accountDto from 'src/module/account/dto';
import * as authDto from 'src/module/auth/dto';

export class ResponseGenericDto {
  @ApiProperty()
  message: string;

  @ApiProperty()
  operation: string;

  @ApiProperty()
  data:
    | any
    | accountDto.ResponseAccountRecoveryDto
    | accountDto.ResponseAccountRecoveryUpdateDto
    | accountDto.ResponseAccountRecoveryVerifyDto
    | authDto.ResponseKeysDto
    | authDto.ResponseLoginDto;
}
