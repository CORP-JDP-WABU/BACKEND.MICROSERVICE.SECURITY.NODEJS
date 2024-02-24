import { Injectable, Logger } from '@nestjs/common';

import * as nodemailer from 'nodemailer';
import * as aws from 'aws-sdk';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import { join } from 'path';
import { IAccountWelcome } from './interfaces';
import * as excepcions from 'src/exception';
import validator from 'validator';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  private emailSend: string = 'devwabu@gmail.com';
  private fileNameAccountSuccessRecovery: string = 'account-recovery-success';
  private fileNameAccountRecovery: string = 'account-recovery';
  private fileNameAccountRegister: string = 'account-register';
  private fileNameAccountWelcome: string = 'account-welcome';
  private subjectAccountRecovery: string = 'WABU: ACCOUNT RECOVERY PASSWORD';
  private subjectAccountRegister: string = 'WABU: ACCOUNT REGISTER';
  private subjectAccountWelcome: string = 'WABU: WELCOME';

  private logger = new Logger(MailService.name);

  constructor() {
    this.setupTransporter();
  }

  async sendAccountRecovery(emailTo: string, code: String, fullName: string) {
    try {
      this.isEmailValid(emailTo);
      const template = this.findTemplateHbs(this.fileNameAccountRecovery);
      const compiledTemplate = handlebars.compile(template);
      const html = compiledTemplate({
        code,
        name: fullName,
      });
      const options = {
        from: this.emailSend,
        to: this.emailSend,
        subject: this.subjectAccountRecovery,
        html,
      };
      return this.transporter.sendMail(options);
    } catch (error) {
      this.logger.error(error);
      throw new excepcions.SendMessageInternalException();
    }
  }

  async sendAccountRegister(emailTo: string, code: String) {
    try {
      this.isEmailValid(emailTo);
      const template = this.findTemplateHbs(this.fileNameAccountRegister);
      const compiledTemplate = handlebars.compile(template);
      const html = compiledTemplate({
        code,
      });
      const options = {
        from: this.emailSend,
        to: this.emailSend,
        subject: this.subjectAccountRegister,
        html,
      };
      return this.transporter.sendMail(options);
    } catch (error) {
      this.logger.error(error);
      throw new excepcions.SendMessageInternalException();
    }
  }

  async sendAccountWelcome(iAccountWelcome: IAccountWelcome) {
    try {
      const template = this.findTemplateHbs(this.fileNameAccountWelcome);
      const compiledTemplate = handlebars.compile(template);
      const html = compiledTemplate(iAccountWelcome);
      const options = {
        from: this.emailSend,
        to: this.emailSend,
        subject: this.subjectAccountWelcome,
        html,
      };
      return this.transporter.sendMail(options);
    } catch (error) {
      this.logger.error(error);
      throw new excepcions.SendMessageInternalException();
    }
  }

  async sendRecoverySuccess(firstName: string) {
    try {
      const template = this.findTemplateHbs(
        this.fileNameAccountSuccessRecovery,
      );
      const compiledTemplate = handlebars.compile(template);
      const html = compiledTemplate({
        firstName,
      });
      const options = {
        from: this.emailSend,
        to: this.emailSend,
        subject: this.subjectAccountWelcome,
        html,
      };
      return this.transporter.sendMail(options);
    } catch (error) {
      this.logger.error(error);
      throw new excepcions.SendMessageInternalException();
    }
  }

  private isEmailValid(emailTo) {
    if (!validator.isEmail(emailTo)) {
      throw new excepcions.InvalidEmailCustomException(
        'SEND_MAILING_EMAIL_FAILED',
      );
    }
  }

  private setupTransporter() {
    aws.config.update({
      accessKeyId:  process.env.ACCESSKEY,
      secretAccessKey: process.env.SECRETKEY,
      region: 'us-east-1',
    });

    this.transporter = nodemailer.createTransport({
      SES: new aws.SES({
        apiVersion: '2010-12-01',
        signatureVersion: 'v4',
      }),
    });
  }

  private findTemplateHbs(fileName: string) {
    const filePath = join(
      process.cwd(),
      '/dist/common/mail/templates',
      `${fileName}.hbs`,
    );
    const template = fs.readFileSync(filePath, 'utf8');
    return template;
  }
}
