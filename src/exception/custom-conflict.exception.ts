import { ConflictException } from '@nestjs/common';

export class InvalidCredentialsCustomException extends ConflictException {
  constructor(originException: string) {
    super(`correo y/o contraseña incorrectos [${originException}]`);
  }
}
