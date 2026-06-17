import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class HrService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getEmployees(query: any) {
    const { search, departemen, status, page = 1, limit = 20 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (search) where.name = { contains: search, mode: 'insensitive' };
    if (departemen) where.departemen = departemen;
    if (status) where.status = status;
    const [data, total] = await Promise.all([
      this.prisma.employee.findMany({ where, skip, take: Number(limit), orderBy: { name: 'asc' } }),
      this.prisma.employee.count({ where }),
    ]);
    return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
  }

  async getEmployee(id: string) {
    const e = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        payrolls: { take: 12, orderBy: { createdAt: 'desc' } },
        attendances: { take: 30, orderBy: { tanggal: 'desc' } },
      },
    });
    if (!e) throw new NotFoundException('Karyawan tidak ditemukan');
    return e;
  }

  async createEmployee(dto: any) { return this.prisma.employee.create({ data: dto }); }
  async updateEmployee(id: string, dto: any) { return this.prisma.employee.update({ where: { id }, data: dto }); }
  async deleteEmployee(id: string) { return this.prisma.employee.update({ where: { id }, data: { status: 'nonaktif' } }); }

  async getPayrolls(query: any) {
    const { employeeId, status, periode, page = 1, limit = 20 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status;
    if (periode) where.periode = { contains: periode };
    const [data, total] = await Promise.all([
      this.prisma.payroll.findMany({ where, skip, take: Number(limit), include: { employee: true }, orderBy: { createdAt: 'desc' } }),
      this.prisma.payroll.count({ where }),
    ]);
    return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
  }

  async createPayroll(dto: any) {
    const { gapok, tunjangan = 0, potongan = 0, ...rest } = dto;
    const netto = Number(gapok) + Number(tunjangan) - Number(potongan);
    return this.prisma.payroll.create({ data: { ...rest, gapok: Number(gapok), tunjangan: Number(tunjangan), potongan: Number(potongan), netto } });
  }

  async updatePayroll(id: string, dto: any) { return this.prisma.payroll.update({ where: { id }, data: dto }); }

  async getAttendances(query: any) {
    const { employeeId, tanggal, page = 1, limit = 20 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (employeeId) where.employeeId = employeeId;
    if (tanggal) where.tanggal = { gte: new Date(tanggal) };
    const [data, total] = await Promise.all([
      this.prisma.attendance.findMany({ where, skip, take: Number(limit), include: { employee: true }, orderBy: { tanggal: 'desc' } }),
      this.prisma.attendance.count({ where }),
    ]);
    return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
  }

  async createAttendance(dto: any) { return this.prisma.attendance.create({ data: dto }); }

  async getStats() {
    const [total, aktif, cuti] = await Promise.all([
      this.prisma.employee.count(),
      this.prisma.employee.count({ where: { status: 'aktif' } }),
      this.prisma.employee.count({ where: { status: 'cuti' } }),
    ]);
    const totalGaji = await this.prisma.payroll.aggregate({ _sum: { netto: true }, where: { status: 'confirmed' } });
    return { total, aktif, cuti, nonaktif: total - aktif - cuti, totalGaji: totalGaji._sum.netto ?? 0 };
  }

  async getContracts(query: any) {
    const { employeeId, status, page = 1, limit = 20 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status;
    const [data, total] = await Promise.all([
      this.prisma.employeeContract.findMany({ where, skip, take: Number(limit), include: { employee: { select: { id: true, name: true, nik: true } } }, orderBy: { startDate: 'desc' } }),
      this.prisma.employeeContract.count({ where }),
    ]);
    return { data, message: 'success', meta: { total, page: Number(page), limit: Number(limit) } };
  }

  async getContract(id: string) {
    const data = await this.prisma.employeeContract.findUnique({ where: { id }, include: { employee: true } });
    if (!data) throw new NotFoundException('Kontrak tidak ditemukan');
    return { data, message: 'success' };
  }

  async createContract(dto: any) {
    if (!dto.employeeId) throw new BadRequestException('employeeId harus diisi');
    if (!dto.startDate) throw new BadRequestException('startDate harus diisi');
    const data = await this.prisma.employeeContract.create({ data: dto });
    return { data, message: 'Kontrak berhasil dibuat' };
  }

  async updateContract(id: string, dto: any) {
    await this.getContract(id);
    const data = await this.prisma.employeeContract.update({ where: { id }, data: dto });
    return { data, message: 'Kontrak berhasil diupdate' };
  }

  async deleteContract(id: string) {
    await this.prisma.employeeContract.delete({ where: { id } });
    return { data: null, message: 'Kontrak berhasil dihapus' };
  }

  async getShifts(query: any) {
    const data = await this.prisma.workShift.findMany({ orderBy: { nama: 'asc' } });
    return { data, message: 'success' };
  }

  async createShift(dto: any) {
    if (!dto.nama) throw new BadRequestException('Nama shift harus diisi');
    const data = await this.prisma.workShift.create({ data: dto });
    return { data, message: 'Shift berhasil dibuat' };
  }

  async updateShift(id: string, dto: any) {
    const data = await this.prisma.workShift.update({ where: { id }, data: dto });
    return { data, message: 'Shift berhasil diupdate' };
  }

  async deleteShift(id: string) {
    await this.prisma.workShift.delete({ where: { id } });
    return { data: null, message: 'Shift berhasil dihapus' };
  }

  async getMutasi(query: any) {
    const { employeeId, page = 1, limit = 20 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (employeeId) where.employeeId = employeeId;
    const [data, total] = await Promise.all([
      this.prisma.employeeMutasi.findMany({ where, skip, take: Number(limit), include: { employee: { select: { id: true, name: true, nik: true } } }, orderBy: { effectiveDate: 'desc' } }),
      this.prisma.employeeMutasi.count({ where }),
    ]);
    return { data, message: 'success', meta: { total, page: Number(page), limit: Number(limit) } };
  }

  async createMutasi(dto: any) {
    if (!dto.employeeId) throw new BadRequestException('employeeId harus diisi');
    if (!dto.effectiveDate) throw new BadRequestException('effectiveDate harus diisi');
    const data = await this.prisma.employeeMutasi.create({ data: dto });
    return { data, message: 'Mutasi/transfer berhasil dicatat' };
  }

  async getEmployeeHistory(employeeId: string) {
    const [employee, contracts, mutasi, attendances, payrolls] = await Promise.all([
      this.prisma.employee.findUnique({ where: { id: employeeId } }),
      this.prisma.employeeContract.findMany({ where: { employeeId }, orderBy: { startDate: 'desc' } }),
      this.prisma.employeeMutasi.findMany({ where: { employeeId }, orderBy: { effectiveDate: 'desc' } }),
      this.prisma.attendance.findMany({ where: { employeeId }, orderBy: { tanggal: 'desc' }, take: 30 }),
      this.prisma.payroll.findMany({ where: { employeeId }, orderBy: { createdAt: 'desc' }, take: 12 }),
    ]);
    if (!employee) throw new NotFoundException('Karyawan tidak ditemukan');
    return { data: { employee, contracts, mutasi, attendances, payrolls }, message: 'success' };
  }

  async importCsv(rows: any[]) {
    if (!Array.isArray(rows) || rows.length === 0) throw new BadRequestException('Data CSV tidak valid atau kosong');
    const results: any[] = [];
    for (const row of rows) {
      try {
        const name = row.name ?? row.nama;
        const emp = await this.prisma.employee.upsert({
          where: { nik: row.nik },
          update: { name, jabatan: row.jabatan, departemen: row.departemen, status: row.status ?? 'aktif' },
          create: { nik: row.nik, name, jabatan: row.jabatan, departemen: row.departemen, status: row.status ?? 'aktif' } as any,
        });
        results.push({ nik: row.nik, status: 'ok', id: emp.id });
      } catch (e: any) {
        results.push({ nik: row.nik, status: 'error', message: e.message });
      }
    }
    const success = results.filter(r => r.status === 'ok').length;
    return { data: results, message: `Import selesai: ${success}/${rows.length} berhasil` };
  }

  // ─── ATTENDANCE IMPORT CSV ────────────────────────────────────────────────
  async importAttendanceCsv(rows: any[]) {
    if (!Array.isArray(rows) || rows.length === 0) throw new BadRequestException('Data CSV tidak valid atau kosong');
    
    // Get all shifts for lateness detection
    const shifts = await this.prisma.workShift.findMany();
    const shiftsMap = new Map(shifts.map(s => [s.nama, s]));
    
    const results: any[] = [];
    for (const row of rows) {
      try {
        const emp = await this.prisma.employee.findUnique({ where: { nik: row.nik } as any
    });
        if (!emp) throw new Error('Karyawan tidak ditemukan');
        
        const tanggal = new Date(row.tanggal);
        const waktuMasuk = row.waktuMasuk ? new Date(`${row.tanggal}T${row.waktuMasuk}`) : null;
        const waktuKeluar = row.waktuKeluar ? new Date(`${row.tanggal}T${row.waktuKeluar}`) : null;
        
        // Detect lateness
        let status = row.status || 'hadir';
        if (waktuMasuk) {
          const defaultShiftStart = new Date(`${row.tanggal}T08:00:00`);
          const toleransi = 15; // minutes
          const lateMins = (waktuMasuk.getTime() - defaultShiftStart.getTime()) / 60000;
          if (lateMins > toleransi) status = 'terlambat';
        }
        
        const att = await this.prisma.attendance.upsert({
          where: {
            employeeId_tanggal: { employeeId: emp.id, tanggal: new Date(tanggal.toISOString().split('T')[0]) }
          } as any,
          update: { checkIn: waktuMasuk, checkOut: waktuKeluar, status },
          create: { employeeId: emp.id, tanggal, checkIn: waktuMasuk, checkOut: waktuKeluar, status } as any,
        });
        
        results.push({ nik: row.nik, tanggal: row.tanggal, status: 'ok', absenStatus: status });
      } catch (e: any) {
        results.push({ nik: row.nik, tanggal: row.tanggal, status: 'error', message: e.message });
      }
    }
    
    const success = results.filter(r => r.status === 'ok').length;
    return { data: results, message: `Import absensi selesai: ${success}/${rows.length} berhasil` };
  }

  // ─── ATTENDANCE REPORTS ───────────────────────────────────────────────────
  async getAttendanceReport(employeeId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    
    const attendances = await this.prisma.attendance.findMany({
      where: {
        employeeId,
        tanggal: { gte: startDate, lte: endDate }
      },
      orderBy: { tanggal: 'asc' }
    });
    
    const employee = await this.prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) throw new NotFoundException('Karyawan tidak ditemukan');
    
    const stats = {
      hadir: attendances.filter(a => a.status === 'hadir').length,
      terlambat: attendances.filter(a => a.status === 'terlambat').length,
      cuti: attendances.filter(a => a.status === 'cuti').length,
      sakit: attendances.filter(a => a.status === 'sakit').length,
      izin: attendances.filter(a => a.status === 'izin').length,
      tanpaKeterangan: attendances.filter(a => a.status === 'tanpa keterangan').length,
    };
    
    return { employee, month, year, attendances, stats };
  }

  async getAttendanceSummary(month: number, year: number, departemenId?: string) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    
    const where: any = { tanggal: { gte: startDate, lte: endDate }, employee: { status: 'aktif' } };
    if (departemenId) where.employee.departemen = departemenId;
    
    const attendances = await this.prisma.attendance.findMany({
      where,
      include: { employee: true },
      orderBy: [{ employee: { name: 'asc' } }, { tanggal: 'asc' }]
    });
    
    // Group by employee
    const byEmployee = new Map<string, any[]>();
    for (const att of attendances) {
      if (!byEmployee.has(att.employeeId)) byEmployee.set(att.employeeId, []);
      byEmployee.get(att.employeeId)!.push(att);
    }
    
    const summary = Array.from(byEmployee.entries()).map(([empId, atts]) => {
      const employee = atts[0].employee;
      return {
        employeeId: empId,
        employeeName: employee.name,
        nik: employee.nik,
        departemen: employee.departemen,
        hadir: atts.filter(a => a.status === 'hadir').length,
        terlambat: atts.filter(a => a.status === 'terlambat').length,
        cuti: atts.filter(a => a.status === 'cuti').length,
        sakit: atts.filter(a => a.status === 'sakit').length,
        izin: atts.filter(a => a.status === 'izin').length,
        tanpaKeterangan: atts.filter(a => a.status === 'tanpa keterangan').length,
      };
    });
    
    return { month, year, summary };
  }

  // ─── SHIFT ASSIGNMENT ────────────────────────────────────────────────────
  async assignShift(employeeId: string, shiftId: string) {
    const emp = await this.prisma.employee.findUnique({ where: { id: employeeId } });
    if (!emp) throw new NotFoundException('Karyawan tidak ditemukan');
    
    const shift = await this.prisma.workShift.findUnique({ where: { id: shiftId } });
    if (!shift) throw new NotFoundException('Shift tidak ditemukan');
    
    // Store shift assignment in AppSetting as JSON
    const key = `employee_shift_${employeeId}`;
    await this.prisma.appSetting.upsert({
      where: { key },
      update: { value: shiftId },
      create: { key, value: shiftId } as any
    });
    
    return { message: 'Shift berhasil di-assign', employee: { id: emp.id, name: emp.name }, shift };
  }

  // ─── LEAVE TYPES ─────────────────────────────────────────────────────────
  async getLeaveTypes() {
    const data = await this.prisma.leaveType.findMany({ where: { active: true }, orderBy: { name: 'asc' } });
    return { data };
  }

  async createLeaveType(dto: any) {
    if (!dto.nama) throw new BadRequestException('Nama jenis cuti harus diisi');
    const data = await this.prisma.leaveType.create({ data: { ...dto, active: true } });
    return { data, message: 'Jenis cuti berhasil dibuat' };
  }

  // ─── LEAVE REQUESTS ──────────────────────────────────────────────────────
  async getLeaveRequests(employeeId?: string, status?: string) {
    const where: any = {};
    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status;
    
    const data = await this.prisma.leaveRequest.findMany({
      where,
      include: { employee: true, leaveType: true },
      orderBy: { createdAt: 'desc' }
    });
    
    return { data };
  }

  async createLeaveRequest(dto: any) {
    if (!dto.employeeId) throw new BadRequestException('employeeId harus diisi');
    if (!dto.leaveTypeId) throw new BadRequestException('leaveTypeId harus diisi');
    if (!dto.dateFrom) throw new BadRequestException('dateFrom harus diisi');
    if (!dto.dateTo) throw new BadRequestException('dateTo harus diisi');
    
    const dateFrom = new Date(dto.dateFrom);
    const dateTo = new Date(dto.dateTo);
    const numberOfDays = Math.ceil((dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    const data = await this.prisma.leaveRequest.create({
      data: {
        ...dto,
        numberOfDays,
        status: 'pending'
      },
      include: { employee: true, leaveType: true }
    });
    
    return { data, message: 'Pengajuan cuti berhasil dibuat' };
  }

  async approveLeaveRequest(id: string, approvedBy: string) {
    const leave = await this.prisma.leaveRequest.findUnique({
      where: { id },
      include: { employee: true, leaveType: true }
    });
    
    if (!leave) throw new NotFoundException('Pengajuan cuti tidak ditemukan');
    
    // Update leave request status
    const updated = await this.prisma.leaveRequest.update({
      where: { id },
      data: { status: 'approved', approvedBy, approvedAt: new Date() },
      include: { employee: true, leaveType: true }
    });
    
    // Create/update leave allocation
    const year = new Date(leave.dateFrom).getFullYear();
    await this.prisma.leaveAllocation.updateMany({
      where: { employeeId: leave.employeeId, leaveTypeId: leave.leaveTypeId, year },
      data: { numberOfDays: { decrement: Number(leave.numberOfDays) } }
    });
    
    return { data: updated, message: 'Pengajuan cuti berhasil disetujui' };
  }

  async rejectLeaveRequest(id: string, rejectionReason?: string) {
    const leave = await this.prisma.leaveRequest.findUnique({ where: { id } });
    if (!leave) throw new NotFoundException('Pengajuan cuti tidak ditemukan');
    
    const updated = await this.prisma.leaveRequest.update({
      where: { id },
      data: { status: 'rejected', reason: rejectionReason },
      include: { employee: true, leaveType: true }
    });
    
    return { data: updated, message: 'Pengajuan cuti ditolak' };
  }

  // ─── LEAVE ALLOCATIONS ───────────────────────────────────────────────────
  async getLeaveAllocations(employeeId?: string, year?: number) {
    const where: any = {};
    if (employeeId) where.employeeId = employeeId;
    if (year) where.year = year;
    
    const data = await this.prisma.leaveAllocation.findMany({
      where,
      include: { employee: true, leaveType: true },
      orderBy: [{ year: 'desc' }, { employee: { name: 'asc' } }]
    });
    
    return { data };
  }

  async createLeaveAllocation(dto: any) {
    if (!dto.employeeId) throw new BadRequestException('employeeId harus diisi');
    if (!dto.leaveTypeId) throw new BadRequestException('leaveTypeId harus diisi');
    if (!dto.numberOfDays) throw new BadRequestException('numberOfDays harus diisi');
    if (!dto.year) throw new BadRequestException('year harus diisi');
    
    const data = await this.prisma.leaveAllocation.upsert({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId: dto.employeeId,
          leaveTypeId: dto.leaveTypeId,
          year: dto.year
        }
      } as any,
      update: { numberOfDays: dto.numberOfDays },
      create: { ...dto, status: 'confirmed' },
      include: { employee: true, leaveType: true }
    });
    
    return { data, message: 'Alokasi cuti berhasil dibuat' };
  }

  // ─── LEAVE BALANCE ───────────────────────────────────────────────────────
  async getLeaveBalance(employeeId: string, year?: number) {
    const checkYear = year || new Date().getFullYear();
    
    const allocations = await this.prisma.leaveAllocation.findMany({
      where: { employeeId, year: checkYear },
      include: { leaveType: true }
    });
    
    const used = await this.prisma.leaveRequest.findMany({
      where: {
        employeeId,
        status: 'approved',
        dateFrom: {
          gte: new Date(checkYear, 0, 1),
          lte: new Date(checkYear, 11, 31)
        }
      }
    });
    
    const balance = allocations.map(alloc => {
      const usedDays = used
        .filter(u => u.leaveTypeId === alloc.leaveTypeId)
        .reduce((sum, u) => sum + Number(u.numberOfDays), 0);
      
      return {
        leaveType: alloc.leaveType,
        allocated: Number(alloc.numberOfDays),
        used: usedDays,
        balance: Number(alloc.numberOfDays) - usedDays
      };
    });
    
    return { employeeId, year: checkYear, balance };
  }

  // ─── LEAVE CALENDAR ──────────────────────────────────────────────────────
  async getLeaveCalendar(month: number, year: number, departemenId?: string) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    
    const leaves = await this.prisma.leaveRequest.findMany({
      where: {
        status: 'approved',
        dateFrom: { lte: endDate },
        dateTo: { gte: startDate },
        employee: departemenId ? { departemen: departemenId } : undefined
      },
      include: { employee: true, leaveType: true },
      orderBy: [{ dateFrom: 'asc' }, { employee: { name: 'asc' } }]
    });
    
    return { month, year, leaves };
  }

  // ─── EMPLOYEE CONTRACTS ───────────────────────────────────────────────────
  async getEmployeeContracts(employeeId: string) {
    const contracts = await this.prisma.employeeContract.findMany({
      where: { employeeId },
      orderBy: { startDate: 'desc' }
    });
    return { data: contracts };
  }

  async createEmployeeContract(employeeId: string, dto: any) {
    if (!dto.startDate) throw new BadRequestException('startDate harus diisi');
    
    const data = await this.prisma.employeeContract.create({
      data: { employeeId, ...dto, status: 'aktif' }
    });
    
    return { data, message: 'Kontrak karyawan berhasil dibuat' };
  }

  async updateEmployeeContract(contractId: string, dto: any) {
    const data = await this.prisma.employeeContract.update({
      where: { id: contractId },
      data: dto
    });
    return { data, message: 'Kontrak karyawan berhasil diupdate' };
  }

  // ─── EMPLOYEE TRANSFER ────────────────────────────────────────────────────
  async transferEmployee(employeeId: string, dto: any) {
    if (!dto.toDepartemen && !dto.toJabatan) {
      throw new BadRequestException('Minimal toDepartemen atau toJabatan harus diisi');
    }
    
    const emp = await this.prisma.employee.findUnique({ where: { id: employeeId } });
    if (!emp) throw new NotFoundException('Karyawan tidak ditemukan');
    
    // Create mutasi record
    const mutasi = await this.prisma.employeeMutasi.create({
      data: {
        employeeId,
        fromDepartemen: emp.departemen,
        fromJabatan: emp.jabatan,
        toDepartemen: dto.toDepartemen || emp.departemen,
        toJabatan: dto.toJabatan || emp.jabatan,
        effectiveDate: dto.effectiveDate || new Date(),
        reason: dto.reason,
        approvedBy: dto.approvedBy
      } as any
    });
    
    // Update employee data
    await this.prisma.employee.update({
      where: { id: employeeId },
      data: {
        departemen: dto.toDepartemen || emp.departemen,
        jabatan: dto.toJabatan || emp.jabatan
      }
    });
    
    return { data: mutasi, message: 'Transfer/mutasi karyawan berhasil dicatat' };
  }

  async getTransferHistory(employeeId: string) {
    const data = await this.prisma.employeeMutasi.findMany({
      where: { employeeId },
      orderBy: { effectiveDate: 'desc' }
    });
    return { data };
  }
}
