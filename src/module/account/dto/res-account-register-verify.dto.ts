import { ApiProperty } from '@nestjs/swagger';

export class ResponseAccountRegisterVerifyDto {
  @ApiProperty()
  idStudent: string;

  @ApiProperty()
  isValid: boolean;
}
