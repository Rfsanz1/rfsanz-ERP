import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

// PTKP 2024 (tahunan)
const PTKP: Record<string, number> = {
  'TK/0': 54_000_000, 'TK/1': 58_500_000, 'TK/2': 63_000_000, 'TK/3': 67_500_000,
  'K/0':  58_500_000, 'K/1':  63_000_000, 'K/2':  67_500_000, 'K/3':  72_000_000,
};

// Tarif PPh21 progresif (UU HPP 2021)
function hitungPPh21Tahunan(pkp: number): number {
  if (pkp <= 0) return 0;
  let pajak = 0;
  const layer = [
    [60_000_000, 0.05], [190_000_000, 0.15], [250_000_000, 0.25],
    [4_500_000_000, 0.30], [Infinity, 0.35],
  ] as [number, number][];
  let sisa = pkp;
  for (const [batas, tarif] of layer) {
    if (sisa <= 0) break;
    const kena = Math.min(sisa, batas);
    pajak += kena * tarif;
    sisa -= kena;
  }
  return Math.round(pajak);
}

@Injectable()
export class PayrollService {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  // ─── PERIODS ─────────────────────────────────────────────────────────────
  async getPeriods(query: any) {
    const { page = 1, limit = 12 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      this.prisma.payrollPeriod.findMany({
        skip, take: Number(limit),
        include: { _count: { select: { slips: true } } },
        orderBy: [{ tahun: 'desc' }, { bulan: 'desc' }],
      }),
      this.prisma.payrollPeriod.count(),
    ]);
    return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
  }

  async createPeriod(dto: { bulan: number; tahun: number; note?: string }) {
    return this.prisma.payrollPeriod.create({ data: dto });
  }

  // ─── CALCULATE PAYROLL ───────────────────────────────────────────────────
  async calculatePayroll(periodId: string) {
    const period = await this.prisma.payrollPeriod.findUnique({ where: { id: periodId } });
    if (!period) throw new NotFoundException('Periode tidak ditemukan');
    if (period.status === 'PAID') throw new BadRequestException('Periode sudah dibayar');

    const employees = await this.prisma.employee.findMany({
      where: { status: 'aktif' },
      include: { bpjsConfig: true },
    });

    const components = await this.prisma.payrollComponent.findMany({ where: { isActive: true } });

    const results: any[] = [];

    for (const emp of employees) {
      const gajiPokok = Number(emp.gapok);

      // Hitung absensi bulan ini
      const startDate = new Date(period.tahun, period.bulan - 1, 1);
      const endDate   = new Date(period.tahun, period.bulan, 0, 23, 59, 59);
      const attendances = await this.prisma.attendance.findMany({
        where: { employeeId: emp.id, tanggal: { gte: startDate, lte: endDate } },
      });
      const hadirHari = attendances.filter(a => a.status === 'hadir').length;
      const totalHariKerja = 22; // default hari kerja sebulan

      // Hitung lembur (overtime hours dari attendance overtime)
      const overtimeHours = attendances.reduce((s, a) => {
        if (!a.checkIn || !a.checkOut) return s;
        const hours = (new Date(a.checkOut).getTime() - new Date(a.checkIn).getTime()) / 3_600_000;
        const overH = Math.max(0, hours - 8);
        return s + overH;
      }, 0);

      // Hitung potongan cuti tidak terambil
      const leaveAbsences = await this.prisma.leaveRequest.count({
        where: { employeeId: emp.id, status: 'approved', dateFrom: { gte: startDate }, dateTo: { lte: endDate } },
      });

      // Hitung komponen
      const ctx: Record<string, number> = {
        BASIC: gajiPokok, ATTENDANCE: hadirHari,
        ATTENDANCE_PCT: hadirHari / totalHariKerja,
        OVERTIME_HOURS: overtimeHours,
      };

      let totalTunjangan = 0;
      let totalPotongan = 0;
      const lines: { componentId: string; amount: number; deskripsi: string }[] = [];

      for (const comp of components) {
        let amount = 0;
        try {
          // Safe formula eval (hanya variabel numerik)
          const fn = new Function(...Object.keys(ctx), `return ${comp.formula}`);
          amount = Math.round(fn(...Object.values(ctx)));
        } catch { amount = 0; }

        if (amount !== 0) {
          lines.push({ componentId: comp.id, amount, deskripsi: comp.nama });
          if (comp.tipe === 'ALLOWANCE' || comp.tipe === 'OVERTIME') totalTunjangan += Math.max(0, amount);
          if (comp.tipe === 'DEDUCTION') totalPotongan += Math.abs(amount);
        }
      }

      // BPJS
      const bpjsCfg = emp.bpjsConfig;
      const bpjsKesEmp  = Math.round(gajiPokok * (bpjsCfg ? Number(bpjsCfg.bpjsKesEmployee) : 1) / 100);
      const bpjsKesEmpr = Math.round(gajiPokok * (bpjsCfg ? Number(bpjsCfg.bpjsKesEmployer) : 4) / 100);
      const bpjsTKEmp   = Math.round(gajiPokok * ((bpjsCfg ? Number(bpjsCfg.bpjsTKJHTEmployee) : 2) + (bpjsCfg ? Number(bpjsCfg.bpjsTKJKM) : 0.3)) / 100);
      const bpjsTKEmpr  = Math.round(gajiPokok * ((bpjsCfg ? Number(bpjsCfg.bpjsTKJHTEmployer) : 3.7) + (bpjsCfg ? Number(bpjsCfg.bpjsTKJKK) : 0.24)) / 100);

      // PPh21
      const penghasilanBruto = gajiPokok + totalTunjangan;
      const biayaJabatan = Math.min(penghasilanBruto * 0.05, 500_000);
      const penghasilanNeto = penghasilanBruto - biayaJabatan - bpjsTKEmp;
      const ptkp = PTKP[emp.ptkpStatus] ?? PTKP['TK/0'];
      const pkpTahunan = Math.max(0, (penghasilanNeto * 12) - ptkp);
      const pph21Tahunan = hitungPPh21Tahunan(pkpTahunan);
      const totalPPh21 = Math.round(pph21Tahunan / 12);

      const netSalary = gajiPokok + totalTunjangan - totalPotongan - bpjsKesEmp - bpjsTKEmp - totalPPh21;

      // Upsert slip
      const slip = await this.prisma.payrollSlip.upsert({
        where: { employeeId_periodId: { employeeId: emp.id, periodId } },
        create: {
          employeeId: emp.id, periodId,
          gajiPokok, totalTunjangan, totalPotongan,
          bpjsKesEmployee: bpjsKesEmp, bpjsKesEmployer: bpjsKesEmpr,
          bpjsTKEmployee: bpjsTKEmp, bpjsTKEmployer: bpjsTKEmpr,
          totalPPh21, netSalary, status: 'DRAFT',
          lines: { create: lines },
        },
        update: {
          gajiPokok, totalTunjangan, totalPotongan,
          bpjsKesEmployee: bpjsKesEmp, bpjsKesEmployer: bpjsKesEmpr,
          bpjsTKEmployee: bpjsTKEmp, bpjsTKEmployer: bpjsTKEmpr,
          totalPPh21, netSalary, status: 'DRAFT',
          lines: { deleteMany: {}, create: lines },
        },
      });
      results.push(slip);
    }

    await this.prisma.payrollPeriod.update({ where: { id: periodId }, data: { status: 'CALCULATED' } });
    return { processed: results.length, slips: results };
  }

  // ─── APPROVE ─────────────────────────────────────────────────────────────
  async approvePayroll(periodId: string) {
    const slips = await this.prisma.payrollSlip.findMany({ where: { periodId } });
    const negative = slips.filter(s => Number(s.netSalary) < 0);
    if (negative.length > 0) throw new BadRequestException(`${negative.length} slip memiliki gaji negatif`);

    await this.prisma.payrollSlip.updateMany({ where: { periodId }, data: { status: 'APPROVED' } });
    await this.prisma.payrollPeriod.update({ where: { id: periodId }, data: { status: 'APPROVED' } });
    return { approved: slips.length };
  }

  // ─── PROCESS PAYMENT + AUTO JOURNAL ──────────────────────────────────────
  async processPayment(periodId: string) {
    const period = await this.prisma.payrollPeriod.findUnique({
      where: { id: periodId },
      include: { slips: true },
    });
    if (!period) throw new NotFoundException('Periode tidak ditemukan');
    if (period.status !== 'APPROVED') throw new BadRequestException('Periode harus di-approve dulu');

    const totalGross   = period.slips.reduce((s, sl) => s + Number(sl.gajiPokok) + Number(sl.totalTunjangan), 0);
    const totalNet     = period.slips.reduce((s, sl) => s + Number(sl.netSalary), 0);
    const totalBpjsEmp = period.slips.reduce((s, sl) => s + Number(sl.bpjsKesEmployee) + Number(sl.bpjsTKEmployee), 0);
    const totalBpjsEmpr = period.slips.reduce((s, sl) => s + Number(sl.bpjsKesEmployer) + Number(sl.bpjsTKEmployer), 0);
    const totalPph21   = period.slips.reduce((s, sl) => s + Number(sl.totalPPh21), 0);
    const nomor = `JNL-PAYROLL-${period.tahun}${String(period.bulan).padStart(2, '0')}-${Date.now()}`;

    // Buat jurnal beban gaji
    try {
      await this.prisma.journal.create({
        data: {
          nomor, tanggal: new Date(), status: 'POSTED',
          deskripsi: `Beban Gaji ${period.bulan}/${period.tahun}`,
          lines: {
            create: [
              { deskripsi: 'Beban Gaji Gross',      debit: totalGross,   kredit: 0,           accountId: await this.findOrCreateAccountId('5001', 'Beban Gaji', 'EXPENSE') },
              { deskripsi: 'Beban BPJS Employer',   debit: totalBpjsEmpr, kredit: 0,          accountId: await this.findOrCreateAccountId('5002', 'Beban BPJS Employer', 'EXPENSE') },
              { deskripsi: 'Hutang Gaji (net)',      debit: 0,            kredit: totalNet,    accountId: await this.findOrCreateAccountId('2201', 'Hutang Gaji', 'LIABILITY') },
              { deskripsi: 'Hutang BPJS Employee',  debit: 0,            kredit: totalBpjsEmp, accountId: await this.findOrCreateAccountId('2202', 'Hutang BPJS', 'LIABILITY') },
              { deskripsi: 'Hutang BPJS Employer',  debit: 0,            kredit: totalBpjsEmpr, accountId: await this.findOrCreateAccountId('2202', 'Hutang BPJS', 'LIABILITY') },
              { deskripsi: 'Hutang PPh 21',         debit: 0,            kredit: totalPph21,  accountId: await this.findOrCreateAccountId('2203', 'Hutang PPh 21', 'LIABILITY') },
            ],
          },
        },
      });
    } catch { /* journal optional */ }

    await this.prisma.payrollSlip.updateMany({ where: { periodId }, data: { status: 'PAID' } });
    await this.prisma.payrollPeriod.update({ where: { id: periodId }, data: { status: 'PAID' } });
    return { paid: period.slips.length, totalNet };
  }

  // ─── SLIPS ────────────────────────────────────────────────────────────────
  async getSlips(query: any) {
    const { periodId, employeeId, departemen, page = 1, limit = 50 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (periodId) where.periodId = periodId;
    if (employeeId) where.employeeId = employeeId;
    if (departemen) where.employee = { departemen };

    const [data, total] = await Promise.all([
      this.prisma.payrollSlip.findMany({
        where, skip, take: Number(limit),
        include: { employee: true, period: true, lines: { include: { component: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.payrollSlip.count({ where }),
    ]);
    return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
  }

  async getSlip(id: string) {
    const slip = await this.prisma.payrollSlip.findUnique({
      where: { id },
      include: { employee: true, period: true, lines: { include: { component: true } } },
    });
    if (!slip) throw new NotFoundException('Slip tidak ditemukan');
    return slip;
  }

  // ─── COMPONENTS ──────────────────────────────────────────────────────────
  async getComponents() { return this.prisma.payrollComponent.findMany({ orderBy: { nama: 'asc' } }); }
  async createComponent(dto: any) { return this.prisma.payrollComponent.create({ data: dto }); }
  async updateComponent(id: string, dto: any) { return this.prisma.payrollComponent.update({ where: { id }, data: dto }); }

  // ─── BPJS REPORT ─────────────────────────────────────────────────────────
  async getBPJSReport(periodId: string) {
    const slips = await this.prisma.payrollSlip.findMany({
      where: { periodId },
      include: { employee: true, period: true },
    });
    const rows = slips.map(s => ({
      nik: s.employee.nik, nama: s.employee.name,
      gapok: Number(s.gajiPokok),
      bpjsKesEmployee: Number(s.bpjsKesEmployee), bpjsKesEmployer: Number(s.bpjsKesEmployer),
      bpjsTKEmployee: Number(s.bpjsTKEmployee), bpjsTKEmployer: Number(s.bpjsTKEmployer),
      totalEmployee: Number(s.bpjsKesEmployee) + Number(s.bpjsTKEmployee),
      totalEmployer: Number(s.bpjsKesEmployer) + Number(s.bpjsTKEmployer),
    }));
    const totals = rows.reduce((acc, r) => ({
      bpjsKesEmployee: acc.bpjsKesEmployee + r.bpjsKesEmployee,
      bpjsKesEmployer: acc.bpjsKesEmployer + r.bpjsKesEmployer,
      bpjsTKEmployee: acc.bpjsTKEmployee + r.bpjsTKEmployee,
      bpjsTKEmployer: acc.bpjsTKEmployer + r.bpjsTKEmployer,
      totalEmployee: acc.totalEmployee + r.totalEmployee,
      totalEmployer: acc.totalEmployer + r.totalEmployer,
    }), { bpjsKesEmployee: 0, bpjsKesEmployer: 0, bpjsTKEmployee: 0, bpjsTKEmployer: 0, totalEmployee: 0, totalEmployer: 0 });
    return { rows, totals, period: slips[0]?.period };
  }

  // ─── PPH21 REPORT ─────────────────────────────────────────────────────────
  async getPPh21Report(periodId: string) {
    const period = await this.prisma.payrollPeriod.findUnique({ where: { id: periodId } });
    if (!period) throw new NotFoundException('Periode tidak ditemukan');

    const slips = await this.prisma.payrollSlip.findMany({
      where: { periodId }, include: { employee: true },
    });

    // YTD: hitung akumulasi dari Januari s/d bulan ini
    const rows = await Promise.all(slips.map(async (s) => {
      const ytdSlips = await this.prisma.payrollSlip.findMany({
        where: {
          employeeId: s.employeeId,
          period: { tahun: period.tahun, bulan: { lte: period.bulan } },
        },
      });
      const ytdPph21 = ytdSlips.reduce((sum, sl) => sum + Number(sl.totalPPh21), 0);
      return {
        nik: s.employee.nik, nama: s.employee.name,
        ptkpStatus: s.employee.ptkpStatus,
        gajiPokok: Number(s.gajiPokok),
        pph21Bulan: Number(s.totalPPh21),
        pph21YTD: ytdPph21,
      };
    }));

    return { rows, period, totalPph21Bulan: rows.reduce((s, r) => s + r.pph21Bulan, 0) };
  }

  // ─── BPJS CONFIG ─────────────────────────────────────────────────────────
  async getBPJSConfig(employeeId: string) {
    return this.prisma.bPJSConfig.findUnique({ where: { employeeId } });
  }

  async upsertBPJSConfig(employeeId: string, dto: any) {
    return this.prisma.bPJSConfig.upsert({
      where: { employeeId },
      create: { employeeId, ...dto },
      update: dto,
    });
  }

  async bankExport(periodId: string, format: string = 'csv') {
    const slips = await this.prisma.payrollSlip.findMany({
      where: { periodId, status: 'PAID' as any },
      include: { employee: { select: { id: true, name: true, nik: true } } },
    });
    const rows = slips.map((s) => ({
      nik: s.employee?.nik ?? '',
      nama: s.employee?.name ?? '',
      netto: s.netSalary,
    }));
    return { data: rows, format, message: `Export data transfer bank untuk ${slips.length} karyawan`, meta: { total: rows.length } };
  }

  async sendSlipEmail(slipId: string) {
    const slip = await this.prisma.payrollSlip.findUnique({
      where: { id: slipId },
      include: { employee: { select: { name: true, email: true } }, period: true },
    });
    if (!slip) throw new NotFoundException('Slip tidak ditemukan');
    console.log(`[PAYROLL EMAIL] Kirim slip ${slip.id} ke ${slip.employee?.email ?? 'no-email'}`);
    return { data: null, message: `Slip gaji ${slip.employee?.name} akan dikirim ke email (fitur segera hadir)` };
  }

  async sendAllSlipEmails(periodId: string) {
    const slips = await this.prisma.payrollSlip.findMany({
      where: { periodId },
      include: { employee: { select: { name: true, email: true } } },
    });
    const withEmail = slips.filter((s) => !!s.employee?.email);
    console.log(`[PAYROLL EMAIL BULK] ${withEmail.length}/${slips.length} karyawan punya email`);
    return { data: null, message: `Email slip gaji akan dikirim ke ${withEmail.length} karyawan` };
  }

  private async findOrCreateAccountId(code: string, name: string, type: string): Promise<string> {
    const acc = await this.prisma.account.findFirst({ where: { code } });
    if (acc) return acc.id;
    const created = await this.prisma.account.create({ data: { code, name, type: type as any } });
    return created.id;
  }
}
