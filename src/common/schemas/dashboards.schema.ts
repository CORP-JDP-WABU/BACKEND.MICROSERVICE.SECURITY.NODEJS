import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { AuditPropertiesSchema } from './audit-properties.schema';

export type DashboardsDocument = Dashboards & mongoose.Document;

@Schema({ collection: 'Dashboards', autoIndex: true })
export class Dashboards {
  @Prop(
    raw({
      _id: mongoose.Types.ObjectId,
      name: String,
    }),
  )
  university: {
    _id: mongoose.Types.ObjectId;
    name: string;
  };

  @Prop(
    raw({
      manyStudentConnected: Number,
      manyQualificationTeacher: Number,
      manySharedDocument: Number,
    }),
  )
  kpis: {
    manyStudentConnected: number;
    manyQualificationTeacher: number;
    manySharedDocument: number;
  };

  @Prop(
    raw({
      _id: mongoose.Types.ObjectId,
      points: Number,
      favoriteCourses: [
        {
          //_id: mongoose.Types.ObjectId,
          idCourse: String,
          name: String,
        },
      ],
    }),
  )
  students: {
    _id: mongoose.Types.ObjectId;
    points: number;
    favoriteCourses: {
      //_id: mongoose.Types.ObjectId;
      idCourse: string;
      name: string;
    }[];
  };

  @Prop({
    type: AuditPropertiesSchema,
    default: () => new AuditPropertiesSchema(),
  })
  auditProperties: AuditPropertiesSchema;
}

export const DashboardsSchema = SchemaFactory.createForClass(Dashboards);
