import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import * as dto from 'src/common/dto';
import * as accountDto from '../dto';
import * as exception from 'src/exception';
import * as schemas from 'src/common/schemas';
import { CryptoService } from 'src/common/crypto/crypto.service';
import { MailService } from 'src/common/mail/mail.service';
import { RECOVERY } from 'src/common/const/generate.const';
import { IAccountWelcome } from 'src/common/mail/interfaces';

@Injectable()
export class FnAccountRegisterService {
  private logger = new Logger(FnAccountRegisterService.name);

  constructor(
    @InjectModel(schemas.CareerStudyPlan.name)
    private readonly careerStudyPlanModel: mongoose.Model<schemas.CareerStudyPlanDocument>,
    @InjectModel(schemas.CareerCourseTeacher.name)
    private readonly careerCourseTeacherModel: mongoose.Model<schemas.CareerCourseTeacherDocument>,
    @InjectModel(schemas.Dashboards.name)
    private readonly dashboardModel: mongoose.Model<schemas.DashboardsDocument>,
    @InjectModel(schemas.Universities.name)
    private readonly universityModel: mongoose.Model<schemas.UniversitiesDocument>,
    @InjectModel(schemas.UniversityCourse.name)
    private readonly universityCourseModel: mongoose.Model<schemas.UniversityCourseDocument>,
    @InjectModel(schemas.UniversityTeacher.name)
    private readonly universityTeacherModel: mongoose.Model<schemas.UniversityTeacherDocument>,
    @InjectModel(schemas.Students.name)
    private readonly studentModel: mongoose.Model<schemas.StudentsDocument>,
    @InjectModel(schemas.Keys.name)
    private readonly keysModel: mongoose.Model<schemas.KeysDocument>,
    private readonly cryptoService: CryptoService,
    private readonly mailService: MailService,
  ) {}

  async execute(
    requestAccountRegisterDto: accountDto.RequestAccountRegisterDto,
  ) {
    const { email, password } = await this.generateDecryptCredential(
      requestAccountRegisterDto.hash,
      requestAccountRegisterDto.data,
    );
    this.logger.debug(`::generateDecryptCredential::${email}-${password}`);
    const studentRegister = await this.studentModel.findOne({
      email,
      //'auditProperties.status.code': 2,
    });

    if (studentRegister) {
      throw new exception.ExistStudentCustomException(
        `REGISTER_ACCOUNT_EMAIL_FAIL`,
      );
    }

    const studentRegisterPeding = await this.studentModel.findOne({
      email,
      'auditProperties.status.code': 1,
    });

    if (studentRegisterPeding) {
      const generateRegisterVerify = await this.generateRegisterVerify(
        studentRegisterPeding.id,
      );
      const sendEmail = await this.mailService.sendAccountRegister(
        email,
        generateRegisterVerify,
      );
      return <dto.ResponseGenericDto>{
        message: 'Processo exitoso',
        operation: `::${FnAccountRegisterService.name}::execute`,
        data: <accountDto.ResponseAccountRegisterDto>{
          messageId: sendEmail.messageId,
        },
      };
    }

    const registerStudentStepOne = await this.studentModel.create({
      email,
      password,
      auditProperties: {
        status: {
          code: 1,
          description: 'ACCOUNT_REGISTER_PENDING',
        },
        recordActive: true,
        userUpdate: null,
        userCreated: email,
        dateUpdate: null,
        dateCreate: new Date(),
      },
      sendCodes: {
        recoveryPassword: '0000',
        verifyRegisterAccount: '0000',
      },
    });

    const generateRegisterVerify = await this.generateRegisterVerify(
      registerStudentStepOne.id,
    );
    const sendEmail = await this.mailService.sendAccountRegister(
      email,
      generateRegisterVerify,
    );
    return <dto.ResponseGenericDto>{
      message: 'Processo exitoso',
      operation: `::${FnAccountRegisterService.name}::execute`,
      data: <accountDto.ResponseAccountRegisterDto>{
        messageId: sendEmail.messageId,
      },
    };
  }

  async executeUpdate(
    requestAccountRegisterUpdateDto: accountDto.RequestAccountRegisterUpdateDto,
  ) {
    const {
      idStudent,
      firstName,
      lastName,
      information,
      profileUrl,
      idUniversity,
      idCareer,
      cicleName,
      isRegisterNewAccount,
    } = requestAccountRegisterUpdateDto;

    this.logger.debug(
      `::requestAccountRegisterUpdateDto::${JSON.stringify(
        requestAccountRegisterUpdateDto,
      )}`,
    );

    const studentPromise = this.studentModel.findOne({
      _id: mongoose.Types.ObjectId(idStudent),
      'auditProperties.status.code': 1,
    });
    const universityPromise = this.universityModel.findOne({
      _id: mongoose.Types.ObjectId(idUniversity),
      'careers._id': mongoose.Types.ObjectId(idCareer),
      'careers.cicles': { $in: [cicleName] },
    });

    const [student, university] = await Promise.all([
      studentPromise,
      universityPromise,
    ]);

    if (!student) {
      throw new exception.ExistStudentRegisterPendingCustomException(
        `REGISTER_ACCOUNT_EXIST_STUDENT`,
      );
    }

    if (!university) {
      throw new exception.NotExistUniversityRegisterCustomException(
        `REGISTER_ACCOUNT_NOTEXIST_UNIVERSITY`,
      );
    }

    const universityCareerAndCicles = university.careers.find(
      (career) => career._id.toString() == idCareer,
    );

    const career = {
      _id: universityCareerAndCicles._id,
      name: universityCareerAndCicles.name,
    };

    const userUpdate = `${firstName[0]}${lastName.slice(0, 3)}`;

    const updateStudent = await this.studentModel.findOneAndUpdate(
      { _id: idStudent },
      {
        $set: {
          firstName,
          lastName,
          information,
          profileUrl,
          university: {
            _id: university.id,
            name: university.name,
          },
          career,
          cicleName,
          isFirstLogin: true,
          'auditProperties.userUpdate': userUpdate.toUpperCase(),
          'auditProperties.dateUpdate': new Date(),
          'auditProperties.status.code': 2,
          'auditProperties.status.description': 'ACCOUNT_REGISTER',
        },
      },
    );

    await this.mailService.sendAccountWelcome(<IAccountWelcome>{
      email: updateStudent.email,
      password: updateStudent.password,
      fullName: `${firstName} ${lastName}`,
      university: university.name,
      career: career.name,
      information: information,
      profileUrl: profileUrl,
      cicle: cicleName,
    });

    this.createQualification(idUniversity, idCareer, idStudent, cicleName);

    if (isRegisterNewAccount !== undefined && isRegisterNewAccount) {
      this.createDashboard(idUniversity, idStudent, university.name);
    }

    return <dto.ResponseGenericDto>{
      message: 'Processo exitoso',
      operation: `::${FnAccountRegisterService.name}::execute`,
      data: <accountDto.ResponseAccountRegisterUpdateDto>{
        isUpdate: true,
      },
    };
  }

  private async generateDecryptCredential(requestHash: string, data: string) {
    const findKeysRequest: any = await this.findKeysByRequestHash(requestHash);

    const bufferKys = {
      x1: Buffer.from(findKeysRequest.keys.x1, 'base64'),
      x2: Buffer.from(findKeysRequest.keys.x2, 'base64'),
    };

    const decryptStudentInString = await this.cryptoService.decrypt(data);
    const decryptStudenToJson = JSON.parse(decryptStudentInString);
    const decryptStudentEmail = await this.cryptoService.decrypt(
      decryptStudenToJson.email,
      bufferKys.x1,
    );
    const decryptStudentPassword = await this.cryptoService.decrypt(
      decryptStudenToJson.password,
      bufferKys.x2,
    );

    this.logger.debug(
      `###### decrypt :: [${decryptStudentEmail} --- ${decryptStudentPassword}]`,
    );

    return {
      email: decryptStudentEmail,
      password: decryptStudentPassword,
    };
  }

  private async findKeysByRequestHash(requestHash: string) {
    const keys = await this.keysModel.findOne(
      { requestHash, 'auditProperties.recordActive': true },
      { keys: 1 },
    );
    if (!keys) {
      throw new exception.InvalidHashCustomException(`findKeysByRequestHash`);
    }
    return keys;
  }

  private async generateRegisterVerify(
    idStudent: mongoose.Types.ObjectId,
  ): Promise<String> {
    let code = '';

    for (let index = 0; index < 6; index++) {
      const randomCharacters = RECOVERY.VALUE.charAt(
        Math.floor(Math.random() * RECOVERY.VALUE.length),
      );
      code += randomCharacters;
    }
    this.logger.debug(`::generateRegisterVerify::code::${code}`);
    const studentVerifyRegisterAccount = await this.studentModel.findOne({
      _id: idStudent,
      'sendCodes.verifyRegisterAccount': code,
    });

    if (!studentVerifyRegisterAccount) {
      await this.studentModel.updateOne(
        { _id: idStudent },
        {
          $set: {
            'sendCodes.verifyRegisterAccount': code,
          },
        },
      );
      return code;
    }
    this.logger.debug(`::generateRecoveryPasswordCode::again::${idStudent}`);
    return this.generateRegisterVerify(idStudent);
  }

  private async createDashboard(
    idUniversity: string,
    idStudent: string,
    university: string,
  ) {
    this.logger.debug(`::start::create::dashboard::`);
    const transformIdUniversity = this.transformStringToObjectId(idUniversity);
    const transformIdStudent = this.transformStringToObjectId(idStudent);

    const firstDashboardUniversity = await this.dashboardModel.findOne({
      'university._id': transformIdUniversity,
    });

    const create = await this.dashboardModel.create({
      university: !firstDashboardUniversity
        ? { _id: transformIdUniversity, name: university }
        : firstDashboardUniversity.university,
      kpis: !firstDashboardUniversity
        ? {
            manyStudentConnected: 0,
            manyQualificationTeacher: 0,
            manySharedDocument: 0,
          }
        : firstDashboardUniversity.kpis,
      students: {
        _id: transformIdStudent,
        points: 0,
        favoriteCourses: [],
      },
      auditProperties: {
        status: {
          code: 1,
          description: 'ACTIVO',
        },
        dateCreate: new Date(),
        dateUpdate: null,
        userCreate: 'MS',
        userUpdate: null,
        recordActive: true,
      },
    });

    await this.dashboardModel.updateMany(
      { 'university._id': mongoose.Types.ObjectId(idUniversity) },
      {
        $inc: {
          'kpis.manyStudentConnected': 1,
        },
      },
      { multi: true },
    );

    this.logger.debug(`::end::create::dashboard::#${create.id}`);
  }

  private async createQualification(
    idUniversity: string,
    idCareer: string,
    idStudent: string,
    cicleName: string,
  ) {
    this.logger.debug(`::start::create::qualification::`);
    const transformIdUniversity = this.transformStringToObjectId(idUniversity);
    const transformIdCareer = this.transformStringToObjectId(idCareer);
    const transformIdStudent = this.transformStringToObjectId(idStudent);

    const studyPlanForCareer = await this.careerStudyPlanModel.findOne({
      idCareer: transformIdCareer,
    });

    let pendingToQualification = [];

    if (studyPlanForCareer) {
      const cicleNumber = parseInt(cicleName.split(' ')[1] || '0', 10);
      this.logger.debug(
        `::studyPlanForCareer::studyplan::length::${studyPlanForCareer.studyPlan.length}-${cicleNumber}`,
      );
      let indexStudyPlay = 0;
      for (const studyPlan of studyPlanForCareer.studyPlan) {
        if (indexStudyPlay == cicleNumber) {
          break;
        }
        indexStudyPlay = indexStudyPlay + 1;
        if (studyPlan) {
          const idCourses = studyPlan.courses.map(
            (element) => element.idCourse,
          );
          const universityCourses = await this.universityCourseModel.find({
            _id: { $in: idCourses },
          });

          for (const course of universityCourses) {
            if (course.teachers.length > 0) {
              const teacher = await this.universityTeacherModel.findById(
                course.teachers[0]._id,
              );

              pendingToQualification.push({
                course: {
                  idCourse: course.id,
                  name: course.name,
                },
                teacher: {
                  idTeacher: teacher.id,
                  firstName: teacher.firstName,
                  lastName: teacher.lastName,
                  photoUrl: teacher.url,
                },
                manyQualification: false,
                hasComment: false,
                hasQualification: false,
              });
            }
          }
        }
      }
    }

    const create = await this.careerCourseTeacherModel.create({
      idUniversity: transformIdUniversity,
      idCareer: transformIdCareer,
      idStudent: transformIdStudent,
      manyQualification: pendingToQualification.length,
      pendingToQualification: pendingToQualification,
      auditProperties: {
        dateCreate: new Date(),
        dateUpdate: null,
        userCreate: 'MS',
        userUpdate: null,
        recordActive: true,
        status: {
          code: 1,
          description: 'REGISTER',
        },
      },
    });
    this.logger.debug(`::end::create::qualification::${create.id}`);
  }

  private transformStringToObjectId(id: string) {
    return mongoose.Types.ObjectId(id);
  }
}
