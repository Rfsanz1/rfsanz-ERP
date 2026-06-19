import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { KledoService } from './kledo.service.js';

/**
 * KledoSyncCronService
 * ────────────────────
 * Polling otomatis Kledo setiap 15 menit.
 * Karena Kledo tidak mendukung webhook publik (per dokumen API),
 * sinkronisasi dilakukan dengan polling periodik.
 *
 * Conflict resolution:
 *  - ERP master untuk: order, stok, data pelanggan lokal
 *  - Kledo master untuk: akuntansi, nomor invoice, status pembayaran
 */
@Injectable()
export class KledoSyncCronService {
  private readonly logger = new Logger(KledoSyncCronService.name);
  private isRunning = false;

  constructor(@Inject(KledoService) private readonly kledo: KledoService) {}

  /**
   * Poll Kledo setiap 15 menit.
   * Cek apakah token Kledo tersedia sebelum menjalankan sync.
   */
  @Cron('0 */15 * * * *', { name: 'kledo-sync-15min' })
  async handleSync() {
    if (this.isRunning) {
      this.logger.warn('Kledo sync masih berjalan, skip cycle ini.');
      return;
    }

    try {
      const token = await this.kledo.getToken();
      if (!token) {
        return;
      }

      this.isRunning = true;
      this.logger.log('Mulai Kledo auto-sync…');

      await this.kledo.autoSync();

      this.logger.log('Kledo auto-sync selesai.');
    } catch (e: any) {
      this.logger.error('Kledo auto-sync error:', e?.message ?? e);
    } finally {
      this.isRunning = false;
    }
  }
}
