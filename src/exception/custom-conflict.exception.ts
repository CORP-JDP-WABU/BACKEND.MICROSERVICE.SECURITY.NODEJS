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

export class InvalidRecoveryPasswordValidateCustomException extends ConflictException {
  constructor(originException: string) {
    super(`codigo de recuperacion vencido y/o no existe`);
  }
}

export class InvalidRegisterAccountValidateCustomException extends ConflictException {
  constructor(originException: string) {
    super(`codigo de verificación vencido y/o no existe`);
  }
}

export class ExistStudentCustomException extends ConflictException {
  constructor() {
    super(`Por favor, usa el correo para iniciar sesión o crea uno nuevo`);
  }
}

export class ExistStudentRegisterPendingCustomException extends ConflictException {
  constructor() {
    super(
      `Por favor, debe realizar la verificacion de su cuenta para poder registrarla`,
    );
  }
}
