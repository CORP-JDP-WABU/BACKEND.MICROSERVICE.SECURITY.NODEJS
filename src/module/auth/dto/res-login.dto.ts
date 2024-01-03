import { ApiProperty } from '@nestjs/swagger';

export class ResponseLoginDto {
  @ApiProperty()
  token: string;
}
