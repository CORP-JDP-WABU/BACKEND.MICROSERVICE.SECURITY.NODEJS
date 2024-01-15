import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class RequestAccountRegisterUpdateDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  readonly idStudent: string;

  @IsString()
  @ApiProperty()
  readonly profileUrl: string;

  @IsString()
  @ApiProperty()
  readonly firstName: string;

  @IsString()
  @ApiProperty()
  readonly lastName: string;

  @IsString()
  @ApiProperty()
  readonly information: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  readonly idUniversity: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  readonly idCareer: string;

  @IsNotEmpty()
  @IsBoolean()
  @ApiProperty()
  readonly isAcceptedTermCoditions: boolean;
}
