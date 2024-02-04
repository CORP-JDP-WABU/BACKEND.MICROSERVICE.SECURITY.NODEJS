import { Controller, UseFilters } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { TcpAuthService } from './tcp-auth.service';
import { AllExceptionsFilter } from 'src/exception';

@Controller()
export class TcpAuthController {
  constructor(private readonly tcpAuthService: TcpAuthService) {}

  @UseFilters(new AllExceptionsFilter())
  @MessagePattern({ subjet: 'client-security', function: 'validate-token' })
  async validateToken(dto: any) {
    return await this.tcpAuthService.validateToken(dto);
  }

  @MessagePattern({ subjet: 'client-security', function: 'config-student' })
  async configStudent(dto: any) {
    return await this.tcpAuthService.configStudent(dto);
  }
}
