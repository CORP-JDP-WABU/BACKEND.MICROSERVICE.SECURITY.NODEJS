import { Injectable } from '@nestjs/common';
import { ClientProxy, EventPattern } from '@nestjs/microservices';

@Injectable()
export class EmittingService {
  constructor(private readonly client: ClientProxy) {}

  async emitEvenToUniversityKpiIncrementStudentConnected(data: any) {
    this.client.emit('university_kpi_increment_student_connected', data);
  }
}
