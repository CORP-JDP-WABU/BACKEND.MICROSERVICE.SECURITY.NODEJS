import { ApiProperty } from '@nestjs/swagger';

export class ResponseAccountRecoveryUpdateDto {
  @ApiProperty()
  isUpdate: boolean;
}
