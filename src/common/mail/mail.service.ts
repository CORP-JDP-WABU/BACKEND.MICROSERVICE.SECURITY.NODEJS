// email.service.ts

import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import * as nodemailer from 'nodemailer';
import * as aws from 'aws-sdk';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import { join } from 'path';
import { IAccountWelcome } from './interfaces';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  private fileNameAccountSuccessRecovery: string = 'account-recovery-success';
  private fileNameAccountRecovery: string = 'account-recovery';
  private fileNameAccountRegister: string = 'account-register';
  private fileNameAccountWelcome: string = 'account-welcome';
  private subjectAccountRecovery: string = 'WABU: ACCOUNT RECOVERY PASSWORD';
  private subjectAccountRegister: string = 'WABU: ACCOUNT REGISTER';
  private subjectAccountWelcome: string = 'WABU: WELCOME';

  constructor() {
    this.setupTransporter();
  }

  async sendAccountRecovery(emailTo: string, code: String, fullName: string) {
    const template = this.findTemplateHbs(this.fileNameAccountRecovery);
    const compiledTemplate = handlebars.compile(template);
    const html = compiledTemplate({
      code,
      name: fullName,
    });
    const options = {
      from: 'tismart.fernando@gmail.com',
      to: 'tismart.fernando@gmail.com',
      subject: this.subjectAccountRecovery,
      html,
    };
    return this.transporter.sendMail(options);
  }

  async sendAccountRegister(emailTo: string, code: String) {
    const template = this.findTemplateHbs(this.fileNameAccountRegister);
    const compiledTemplate = handlebars.compile(template);
    const html = compiledTemplate({
      code,
    });
    const options = {
      from: 'tismart.fernando@gmail.com',
      to: 'tismart.fernando@gmail.com',
      subject: this.subjectAccountRegister,
      html,
    };
    return this.transporter.sendMail(options);
  }

  async sendAccountWelcome(iAccountWelcome: IAccountWelcome) {
    const template = this.findTemplateHbs(this.fileNameAccountWelcome);
    const compiledTemplate = handlebars.compile(template);
    const html = compiledTemplate(iAccountWelcome);
    const options = {
      from: 'tismart.fernando@gmail.com',
      to: 'tismart.fernando@gmail.com',
      subject: this.subjectAccountWelcome,
      html,
    };
    return this.transporter.sendMail(options);
  }

  async sendRecoverySuccess(firstName: string) {
    const template = this.findTemplateHbs(this.fileNameAccountSuccessRecovery);
    const compiledTemplate = handlebars.compile(template);
    const html = compiledTemplate({
      firstName
    });
    const options = {
      from: 'tismart.fernando@gmail.com',
      to: 'tismart.fernando@gmail.com',
      subject: this.subjectAccountWelcome,
      html,
    };
    return this.transporter.sendMail(options);
  }

  private setupTransporter() {
    aws.config.update({
      accessKeyId: process.env.ACCESSKEY,
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
