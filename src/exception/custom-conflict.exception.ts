import { ConflictException } from '@nestjs/common';

export class InvalidCredentialsEmailCustomException extends ConflictException {
  constructor(originException: string) {
    super(`El correo ingresado no existe en la base de datos`);
  }
}

export class InvalidCredentialsPasswordCustomException extends ConflictException {
  constructor(originException: string) {
    super(`Parece que esta contraseña no es la correcta`);
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

export class NotExistStudentRecoveryCustomException extends ConflictException {
  constructor() {
    super(
      `El correo colocado no está registrado`,
    );
  }
}

export class NotExistUniversityRegisterCustomException extends ConflictException {
  constructor() {
    super(
      `Los datos universitarios no existen`,
    );
  }
}