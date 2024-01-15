import { ApiProperty } from '@nestjs/swagger';

export class ResponseAccountRecoveryDto {
  @ApiProperty()
  messageId: string;
}
