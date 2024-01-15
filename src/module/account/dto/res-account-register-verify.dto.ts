import { ApiProperty } from '@nestjs/swagger';

export class ResponseAccountRegisterVerifyDto {
  @ApiProperty()
  isValid: boolean;
}
