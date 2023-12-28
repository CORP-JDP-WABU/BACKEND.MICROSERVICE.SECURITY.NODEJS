import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { AuditPropertiesSchema } from './audit-properties.schema';

export type KeysDocument = Keys & mongoose.Document;

@Schema({ collection: 'Keys', autoIndex: true })
export class Keys {
  @Prop()
  requestHash: string;

  @Prop(raw({ x1: String, x2: String }))
  keys: { x1: string; x2: string };

  @Prop({
    type: AuditPropertiesSchema,
    default: () => new AuditPropertiesSchema(),
  })
  auditProperties: AuditPropertiesSchema;
}

export const KeysSchema = SchemaFactory.createForClass(Keys);