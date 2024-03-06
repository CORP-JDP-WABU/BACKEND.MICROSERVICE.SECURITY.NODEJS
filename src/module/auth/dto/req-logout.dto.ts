import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RequestLogoutDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  readonly idStudent: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  readonly token: string;
}
