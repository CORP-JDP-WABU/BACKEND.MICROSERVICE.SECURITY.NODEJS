import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RequestAccountRecoveryVerifyDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  readonly hash: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  readonly data: string;
}
