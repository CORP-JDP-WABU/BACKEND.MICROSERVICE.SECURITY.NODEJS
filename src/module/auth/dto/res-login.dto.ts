import { ApiProperty } from '@nestjs/swagger';

export class ResponseLoginDto {
  @ApiProperty()
  idStudent: string;

  @ApiProperty()
  isFirstLogin: boolean;

  @ApiProperty()
  token: string;
}
