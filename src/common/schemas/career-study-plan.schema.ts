import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export type CareerStudyPlanDocument = CareerStudyPlan & mongoose.Document;

@Schema({ collection: 'CareerStudyPlan', autoIndex: true })
export class CareerStudyPlan {
  @Prop({ type: mongoose.Types.ObjectId })
  idCareer: mongoose.Types.ObjectId;

  @Prop(
    raw({
      type: [
        {
          idStudyPlan: mongoose.Types.ObjectId,
          name: String,
          courses: [
            {
              idCourse: mongoose.Types.ObjectId,
              name: String,
            },
          ],
        },
      ],
    }),
  )
  studyPlan: {
    idStudyPlan: mongoose.Types.ObjectId;
    name: String;
    courses: [
      {
        idCourse: mongoose.Types.ObjectId;
        name: string;
      },
    ];
  }[];
}

export const CareerStudyPlanSchema =
  SchemaFactory.createForClass(CareerStudyPlan);
