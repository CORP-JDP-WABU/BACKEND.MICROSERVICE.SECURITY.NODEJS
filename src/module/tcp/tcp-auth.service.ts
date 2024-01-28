import { Model } from 'mongoose';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as schemas from 'src/common/schemas';
import * as interfaces from './interface';
import * as mongoose from 'mongoose';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class TcpAuthService {
    private logger = new Logger(`::${TcpAuthService.name}::`)
    constructor(
        @InjectModel(schemas.Securities.name) 
        private readonly securityModel: Model<schemas.SecuritiesDocument>,
        @InjectModel(schemas.Students.name) 
        private readonly studentModel: Model<schemas.StudentsDocument>
    ) {}
    
    async validateToken(validateToken: interfaces.IValidateToken) {
        try {
            const { token } = validateToken;
            const securityStudent = await this.securityModel.findOne({ tokens: { $in: [token] } })
            return {
                idStudent: (!securityStudent) ? '' : securityStudent.idStudent
            }   
        } catch (error) {
            this.logger.error(error);
            throw new RpcException('::validateToken::error::');
        }
    }

    async configStudent(configStudent: interfaces.IConfigStudent) {
        try {
            const configStudentData = await this.studentModel.findById(configStudent.idStudent, { _id: 1, university: 1 })
            return configStudentData  
        } catch (error) {
            this.logger.error(error);
            throw new RpcException('::configStudent::error::');
        }
    }
}