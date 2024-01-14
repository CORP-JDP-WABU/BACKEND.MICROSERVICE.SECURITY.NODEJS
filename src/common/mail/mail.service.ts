// email.service.ts

import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import * as nodemailer from 'nodemailer';
import * as aws from 'aws-sdk';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import { join } from 'path';
import { imageLogo } from '../const/keys.const';

@Injectable()
export class MailService {

  private transporter: nodemailer.Transporter;

  private fileNameAccountRecovery: string = 'account-recovery';

  constructor() {
    this.setupTransporter();
  }

  async sendAccountRecovery(emailTo: string) {
    const template = this.findTemplateHbs(this.fileNameAccountRecovery);
    const compiledTemplate = handlebars.compile(template);
    const html = compiledTemplate({
      code: '1234',
      name: 'Fernando Zavaleta'
    });

    const options = {
      from: 'tismart.fernando@gmail.com',
      to: 'tismart.fernando@gmail.com',
      subject: 'WABU: ACCOUNT RECOVERY PASSWORD',
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
    const filePath = join(process.cwd(), '/dist/common/mail/templates', `${fileName}.hbs`)
    const template = fs.readFileSync(filePath, 'utf8');
    return template;
  }

}
