import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  ping() {
    return {
      ok: true,
      time: new Date().toISOString(),
    };
  }
}
