import { ApiProperty } from '@nestjs/swagger';

export class ResponseAccountRegisterUpdateDto {
  @ApiProperty()
  isUpdate: boolean;
}
