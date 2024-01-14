import { Module } from '@nestjs/common';
import { EmittingService } from './emitting.service';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
    imports: [
        ClientsModule.register([
            {
              name: 'EVENT_SERVICE',
              transport: Transport.RMQ,
              options: {
                urls: ['amqp://localhost:5672'],
                queue: 'nestjs_queue',
                queueOptions: {
                  durable: false,
                },
              },
            },
          ])
    ],
    exports: [EmittingService],
    providers: [EmittingService],
})
export class EmittingModule {}
