import { Injectable, Logger } from '@nestjs/common';
import * as response from 'src/common/dto';
import { MailService } from 'src/common/mail/mail.service';
import * as dto from 'src/common/dto';
import * as request from '../dto';
import * as exception from 'src/exception';
import * as schemas from 'src/common/schemas';
import { InjectModel } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { CryptoService } from 'src/common/crypto/crypto.service';

@Injectable()
export class FnAccountRecoveryService {
    private logger = new Logger(FnAccountRecoveryService.name);
    constructor(
        @InjectModel(schemas.Students.name)
        private readonly studentModel: mongoose.Model<schemas.StudentsDocument>,
        @InjectModel(schemas.Keys.name)
        private readonly keysModel: mongoose.Model<schemas.KeysDocument>,
        private readonly mailService: MailService,
        private readonly cryptoService: CryptoService,
    ) {

    }

    async execute(requestAccountRecovery: request.ReqAccountRecoveryDto) : Promise<response.ResponseGenericDto> {
        const { email } = await this.generateDecryptCredential(requestAccountRecovery.hash, requestAccountRecovery.data);
        const student = await this.studentModel.findOne({ email });
        this.logger.debug(JSON.stringify(student))
        if(student) {
            const sendEmail = await this.mailService.sendAccountRecovery(email);
            return <dto.ResponseGenericDto>{
                message: 'SUCCESS',
                operation: `::${FnAccountRecoveryService.name}::execute`,
                data: {
                    messageId: sendEmail.messageId
                },
            };
        }
        return <dto.ResponseGenericDto>{
            message: 'SUCCESS',
            operation: `::${FnAccountRecoveryService.name}::execute`,
            data: {
                messageId: ''
            },
        };

    }

    private async findKeysByRequestHash(requestHash: string) {
        const keys = await this.keysModel.findOne({ requestHash, "auditProperties.recordActive": true }, { keys: 1 });
        if(!keys) {
          throw new exception.InvalidHashCustomException(
            `findKeysByRequestHash`
          );
        }
        return keys;
    }

    private async generateDecryptCredential(requestHash: string, data: string) {

        const findKeysRequest: any = await this.findKeysByRequestHash(requestHash);
    
        const bufferKys = {
          x1:  Buffer.from(findKeysRequest.keys.x1, 'base64')
        }
    
        const decryptStudentInString = await this.cryptoService.decrypt(data);
        const decryptStudenToJson = JSON.parse(decryptStudentInString);
        const decryptStudentEmail = await this.cryptoService.decrypt(decryptStudenToJson.email, bufferKys.x1);
        
        return {
          email: decryptStudentEmail
        };
    
      }


}