import { Injectable, Logger } from '@nestjs/common';

import * as nodemailer from 'nodemailer';
import * as aws from 'aws-sdk';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import { join } from 'path';
import { IAccountWelcome } from './interfaces';
import * as excepcions from 'src/exception';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  private emailSend: string = 'admin@wabupro.com';
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
      const template = this.findTemplateHbs(this.fileNameAccountRecovery);
      const compiledTemplate = handlebars.compile(template);
      const html = compiledTemplate({
        code,
        name: fullName,
      });
      const options = {
        from: this.emailSend,
        to: emailTo,
        subject: this.subjectAccountRecovery,
        html,
      };
      return this.transporter.sendMail(options); 
    } catch (error) {
      this.logger.error('sendAccountRecovery', error);
      throw new excepcions.SendMessageInternalException();
    }
  }

  async sendAccountRegister(emailTo: string, code: String) {
    try {
      const template = this.findTemplateHbs(this.fileNameAccountRegister);
      const compiledTemplate = handlebars.compile(template);
      const html = compiledTemplate({
        code,
      });
      const options = {
        from: this.emailSend,
        to: emailTo,
        subject: this.subjectAccountRegister,
        html,
      };
      return this.transporter.sendMail(options); 
    } catch (error) {
      this.logger.error('sendAccountRegister', error);
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
        to: iAccountWelcome.email,
        subject: this.subjectAccountWelcome,
        html,
      };
      return this.transporter.sendMail(options);
    } catch (error) {
      this.logger.error('sendAccountWelcome', error);
      throw new excepcions.SendMessageInternalException();
    }
  }

  async sendRecoverySuccess(firstName: string, email: string) {
    try {
      const template = this.findTemplateHbs(this.fileNameAccountSuccessRecovery);
      const compiledTemplate = handlebars.compile(template);
      const html = compiledTemplate({
        firstName,
      });
      const options = {
        from: this.emailSend,
        to: email,
        subject: this.subjectAccountWelcome,
        html,
      };
      return this.transporter.sendMail(options); 
    } catch (error) {
      this.logger.error('sendRecoverySuccess', error);
      throw new excepcions.SendMessageInternalException();
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
