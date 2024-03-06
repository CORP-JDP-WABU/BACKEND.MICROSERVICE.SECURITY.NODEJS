import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

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
  @IsString()
  @ApiProperty()
  readonly cicleName: string;

  @IsNotEmpty()
  @IsBoolean()
  @ApiProperty()
  readonly isAcceptedTermCoditions: boolean;

  @IsOptional()
  @ApiPropertyOptional()
  readonly isRegisterNewAccount: boolean;
}
