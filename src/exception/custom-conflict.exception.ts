import { ConflictException } from '@nestjs/common';

export class InvalidCredentialsCustomException extends ConflictException {
  constructor(originException: string) {
    super(`correo y/o contraseña incorrectos [${originException}]`);
  }
}

export class InvalidHashCustomException extends ConflictException {
  constructor(originException: string) {
    super(`hash incorrectos o vencidos [${originException}]`);
  }
}