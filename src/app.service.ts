import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      ok: true,
      name: 'Landing Leads API',
      message: 'API funcionando correctamente',
      timestamp: new Date().toISOString(),
    };
  }
}
