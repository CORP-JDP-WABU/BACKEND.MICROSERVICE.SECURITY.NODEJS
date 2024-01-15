import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { AuditPropertiesSchema } from './audit-properties.schema';

export type StudentsDocument = Students & mongoose.Document;

@Schema({ collection: 'Students', autoIndex: true })
export class Students {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({})
  firstName: string;

  @Prop({})
  lastName: string;

  @Prop(
    raw({
      recoveryPassword: String,
      verifyRegisterAccount: String,
    }),
  )
  sendCodes: {
    recoveryPassword: string;
    verifyRegisterAccount: string;
  };

  @Prop(
    raw({
      idUniversity: mongoose.Types.ObjectId,
      name: String,
    }),
  )
  university: {
    idUniversity: mongoose.Types.ObjectId;
    name: string;
  };

  @Prop(raw({ idCareer: mongoose.Types.ObjectId, name: String }))
  career: { idCareer: mongoose.Types.ObjectId; name: string };

  @Prop({ type: AuditPropertiesSchema })
  auditProperties: AuditPropertiesSchema;
}

export const StudentsSchema = SchemaFactory.createForClass(Students);
