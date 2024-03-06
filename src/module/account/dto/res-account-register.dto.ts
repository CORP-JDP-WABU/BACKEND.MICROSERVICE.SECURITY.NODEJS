import { ApiProperty } from '@nestjs/swagger';

export class ResponseAccountRegisterDto {
  @ApiProperty()
  messageId: string;
}
