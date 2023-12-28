import { ApiProperty } from '@nestjs/swagger';

export class ResponseKeysDto {
  @ApiProperty()
  keys: string;

  @ApiProperty()
  hash: string;
}
