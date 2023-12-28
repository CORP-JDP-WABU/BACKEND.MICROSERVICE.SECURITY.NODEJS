import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { AuditPropertiesSchema } from './audit-properties.schema';

export type StudentsDocument = Students & mongoose.Document;

@Schema({ collection: 'Students', autoIndex: true })
export class Students {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ type: AuditPropertiesSchema })
  auditProperties: AuditPropertiesSchema;
}

export const StudentsSchema = SchemaFactory.createForClass(Students);
