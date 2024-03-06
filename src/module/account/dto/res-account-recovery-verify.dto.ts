import { ApiProperty } from '@nestjs/swagger';

export class ResponseAccountRecoveryVerifyDto {
  @ApiProperty()
  isValid: boolean;
}
