import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { AuditPropertiesSchema } from 'src/common/schemas/audit-properties.schema';

export type SecuritiesDocument = Securities & mongoose.Document;

@Schema({ collection: 'Securities', autoIndex: true })
export class Securities extends AuditPropertiesSchema {
  @Prop({
    type: mongoose.Types.ObjectId,
  })
  idStudent: mongoose.Types.ObjectId;

  @Prop(
    raw({
      type: [],
    }),
  )
  tokens: string[];
}

export const SecuritiesSchema = SchemaFactory.createForClass(Securities);
