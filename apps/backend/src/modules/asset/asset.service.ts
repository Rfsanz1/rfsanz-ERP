import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { v4 as uuid } from 'uuid';

@Injectable()
export class AssetService {
  constructor(private prisma: PrismaService) {}

  // ─── KATEGORI CRUD ───────────────────────────────────────────────────────
  async getCategories() {
    return this.prisma.assetCategory.findMany({ orderBy: { name: 'asc' } });
  }

  async getCategory(id: string) {
    const cat = await this.prisma.assetCategory.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException('Kategori aset tidak ditemukan');
    return cat;
  }

  async createCategory(dto: any) {
    const { name, depreciationAccountId, accDepAccountId, defaultUsefulLife, defaultMethod } = dto;
    return this.prisma.assetCategory.create({
      data: { name, depreciationAccountId, accDepAccountId, defaultUsefulLife: defaultUsefulLife || 60, defaultMethod: defaultMethod || 'straight_line' } as any,
    });
  }

  async updateCategory(id: string, dto: any) {
    return this.prisma.assetCategory.update({ where: { id }, data: dto });
  }

  async deleteCategory(id: string) {
    // Check if category is used
    const count = await this.prisma.fixedAsset.count({ where: { categoryId: id } });
    if (count > 0) throw new BadRequestException('Kategori tidak bisa dihapus karena masih digunakan');
    return this.prisma.assetCategory.delete({ where: { id } });
  }

  // ─── GENERATE KODE ASET ──────────────────────────────────────────────────
  private async generateAssetCode(): Promise<string> {
    const today = new Date();
    const prefix = `AST-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;
    const lastAsset = await this.prisma.fixedAsset.findFirst({
      where: { code: { startsWith: prefix } },
      orderBy: { code: 'desc' },
    });
    const nextNum = lastAsset ? parseInt(lastAsset.code.split('-').pop() || '0') + 1 : 1;
    return `${prefix}-${String(nextNum).padStart(4, '0')}`;
  }

  // ─── CRUD ─────────────────────────────────────────────────────────────────
  async getAssets(query: any) {
    const { search, categoryId, status, warehouseId, branchId, page = 1, limit = 20 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    
    if (search) where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { code: { contains: search, mode: 'insensitive' } },
      { serialNumber: { contains: search, mode: 'insensitive' } },
    ];
    if (categoryId) where.categoryId = categoryId;
    if (status) where.status = status;
    if (warehouseId) where.warehouseId = warehouseId;
    if (branchId) where.branchId = branchId;

    const [data, total] = await Promise.all([
      this.prisma.fixedAsset.findMany({
        where, skip, take: Number(limit),
        include: { category: true, depreciations: { orderBy: [{ tahun: 'desc' }, { bulan: 'desc' }], take: 1 } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.fixedAsset.count({ where }),
    ]);

    const enriched = data.map(a => {
      const acquisitionValue = Number(a.acquisitionValue || a.nilaiPerolehan || 0);
      const lastDep = a.depreciations[0];
      const currentBookValue = lastDep ? Number(lastDep.nilaiBuku) : acquisitionValue;
      const accumulatedDep = acquisitionValue - currentBookValue;
      return { ...a, currentBookValue, accumulatedDep };
    });

    return { data: enriched, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
  }

  async getAsset(id: string) {
    const a = await this.prisma.fixedAsset.findUnique({
      where: { id },
      include: { category: true, depreciations: { orderBy: [{ tahun: 'asc' }, { bulan: 'asc' }] } },
    });
    if (!a) throw new NotFoundException('Aset tidak ditemukan');
    
    const acquisitionValue = Number(a.acquisitionValue || a.nilaiPerolehan || 0);
    const currentBookValue = a.depreciations.length > 0
      ? Number(a.depreciations[a.depreciations.length - 1].nilaiBuku)
      : acquisitionValue;
    const accumulatedDep = acquisitionValue - currentBookValue;
    
    return { ...a, currentBookValue, accumulatedDep };
  }

  async createAsset(dto: any) {
    // Support both new fields and legacy fields
    const code = dto.code || await this.generateAssetCode();
    const createData: any = {
      name: dto.name || dto.nama,
      code,
      kode: code,
      categoryId: dto.categoryId,
      acquisitionDate: dto.acquisitionDate || dto.tanggalPerolehan,
      acquisitionValue: dto.acquisitionValue || dto.nilaiPerolehan,
      usefulLifeMonths: dto.usefulLifeMonths || dto.umurEkonomi || 60,
      depreciationMethod: dto.depreciationMethod || dto.metodeDepresiasi || 'STRAIGHT_LINE',
      residualValue: dto.residualValue || dto.nilaiResidu || 0,
      location: dto.location,
      serialNumber: dto.serialNumber,
      warrantyExpiry: dto.warrantyExpiry,
      vendor: dto.vendor,
      attachment: dto.attachment,
      status: dto.status || 'ACTIVE',
      warehouseId: dto.warehouseId,
      accountAssetId: dto.accountAssetId,
      accountDepreciasiId: dto.accountDepreciasiId,
      accountAkumDepId: dto.accountAkumDepId,
      branchId: dto.branchId,
      // Legacy
      nama: dto.nama,
      kategori: dto.kategori,
      tanggalPerolehan: dto.tanggalPerolehan,
      nilaiPerolehan: dto.nilaiPerolehan,
      nilaiResidu: dto.nilaiResidu,
      umurEkonomi: dto.umurEkonomi,
      metodeDepresiasi: dto.metodeDepresiasi,
    };

    const asset = await this.prisma.fixedAsset.create({ data: createData });

    // Auto journal untuk perolehan aset
    try {
      const accountId = dto.accountAssetId || await this.findOrCreateAccountId('1100', 'Aset Tetap', 'ASSET');
      const counterAccountId = await this.findOrCreateAccountId('1000', 'Kas/Bank', 'ASSET');
      const acquisitionValue = Number(dto.acquisitionValue || dto.nilaiPerolehan || 0);
      
      await this.prisma.journal.create({
        data: {
          nomor: `JNL-ASSET-ACQ-${code}`,
          tanggal: new Date(dto.acquisitionDate || dto.tanggalPerolehan),
          deskripsi: `Perolehan Aset: ${dto.name || dto.nama}`,
          status: 'POSTED',
          lines: {
            create: [
              { accountId, debit: acquisitionValue, kredit: 0, deskripsi: `Aset Tetap: ${dto.name || dto.nama}` } as any,
              { accountId: counterAccountId, debit: 0, kredit: acquisitionValue, deskripsi: 'Kas/Bank' } as any,
            ],
          },
        } as any,
      });
    } catch { /* journal optional */ }

    return asset;
  }

  async updateAsset(id: string, dto: any) {
    const updateData: any = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.nama) updateData.nama = dto.nama;
    if (dto.categoryId) updateData.categoryId = dto.categoryId;
    if (dto.location) updateData.location = dto.location;
    if (dto.serialNumber) updateData.serialNumber = dto.serialNumber;
    if (dto.warrantyExpiry) updateData.warrantyExpiry = dto.warrantyExpiry;
    if (dto.vendor) updateData.vendor = dto.vendor;
    if (dto.attachment) updateData.attachment = dto.attachment;
    if (dto.status) updateData.status = dto.status;
    if (dto.warehouseId) updateData.warehouseId = dto.warehouseId;
    if (dto.note) updateData.note = dto.note;

    return this.prisma.fixedAsset.update({ where: { id }, data: updateData });
  }

  // ─── DEPRESIASI MANUAL ────────────────────────────────────────────────────
  async calculateDepreciation(assetId: string, bulan: number, tahun: number) {
    const asset = await this.prisma.fixedAsset.findUnique({
      where: { id: assetId },
      include: { depreciations: { orderBy: [{ tahun: 'asc' }, { bulan: 'asc' }] } },
    });
    if (!asset) throw new NotFoundException('Aset tidak ditemukan');
    if (asset.status !== 'ACTIVE') throw new BadRequestException('Aset tidak aktif');

    // Support both new and legacy fields
    const nilaiPerolehan = Number(asset.acquisitionValue || asset.nilaiPerolehan || 0);
    const nilaiResidu    = Number(asset.residualValue || asset.nilaiResidu || 0);
    const umurBulan      = asset.usefulLifeMonths || asset.umurEkonomi || 60;
    const metode         = asset.depreciationMethod || asset.metodeDepresiasi || 'STRAIGHT_LINE';

    const prevDep = asset.depreciations[asset.depreciations.length - 1];
    const prevNilaiBuku   = prevDep ? Number(prevDep.nilaiBuku)   : nilaiPerolehan;
    const prevAkumDep     = prevDep ? Number(prevDep.akumDepresiasi) : 0;

    if (prevNilaiBuku <= nilaiResidu) return null;

    let beban = 0;
    if (metode === 'STRAIGHT_LINE') {
      beban = (nilaiPerolehan - nilaiResidu) / umurBulan;
    } else {
      const rate = 2 / umurBulan;
      beban = prevNilaiBuku * rate;
    }
    beban = Math.round(Math.min(beban, prevNilaiBuku - nilaiResidu));

    const akumDepresiasi = prevAkumDep + beban;
    const nilaiBuku = nilaiPerolehan - akumDepresiasi;

    return { beban, akumDepresiasi, nilaiBuku, bulan, tahun };
  }

  // ─── RUN MONTHLY DEPRECIATION ─────────────────────────────────────────────
  async runMonthlyDepreciation(bulan: number, tahun: number) {
    const assets = await this.prisma.fixedAsset.findMany({ where: { status: 'ACTIVE' } });
    const results: any[] = [];

    for (const asset of assets) {
      const calc = await this.calculateDepreciation(asset.id, bulan, tahun);
      if (!calc || calc.beban <= 0) continue;

      const dep = await this.prisma.assetDepreciation.upsert({
        where: { assetId_bulan_tahun: { assetId: asset.id, bulan, tahun } },
        create: {
          assetId: asset.id, bulan, tahun,
          bebanDepresiasi: calc.beban,
          akumDepresiasi: calc.akumDepresiasi,
          nilaiBuku: calc.nilaiBuku,
        } as any,
        update: {
          bebanDepresiasi: calc.beban,
          akumDepresiasi: calc.akumDepresiasi,
          nilaiBuku: calc.nilaiBuku,
        },
      });

      // Auto journal
      try {
        if (asset.accountDepreciasiId && asset.accountAkumDepId) {
          const journal = await this.prisma.journal.create({
            data: {
              nomor: `JNL-DEP-${asset.kode}-${tahun}${String(bulan).padStart(2, '0')}`,
              tanggal: new Date(tahun, bulan - 1, 28),
              deskripsi: `Depresiasi ${asset.nama} ${bulan}/${tahun}`,
              status: 'POSTED',
              lines: {
                create: [
                  { accountId: asset.accountDepreciasiId, debit: calc.beban, kredit: 0, deskripsi: `Beban Depresiasi - ${asset.nama}` } as any,
                  { accountId: asset.accountAkumDepId, debit: 0, kredit: calc.beban, deskripsi: `Akum. Depresiasi - ${asset.nama}` } as any,
                ],
              },
            } as any,
          });
          await this.prisma.assetDepreciation.update({ where: { id: dep.id }, data: { journalId: journal.id } });
        }
      } catch { /* journal optional */ }

      results.push({ asset: asset.nama, kode: asset.kode, ...calc });
    }

    return { processed: results.length, results };
  }

  // ─── DISPOSAL ────────────────────────────────────────────────────────────
  async disposeAsset(assetId: string, tanggalDisposal: Date, nilaiDisposal: number, note?: string) {
    const asset = await this.getAsset(assetId);
    if (asset.status !== 'ACTIVE') throw new BadRequestException('Aset sudah dilepas');

    const akumDep  = Number((asset as any).akumDepresiasi);
    const nilaiBuku = Number((asset as any).nilaiBuku);
    const gainLoss  = nilaiDisposal - nilaiBuku;

    try {
      const lines: any[] = [
        { accountId: await this.findOrCreateAccountId('1001', 'Akumulasi Depresiasi', 'ASSET'), debit: akumDep, kredit: 0, deskripsi: 'Hapus Akumulasi Depresiasi' },
        { accountId: await this.findOrCreateAccountId('1000', 'Kas/Bank', 'ASSET'), debit: nilaiDisposal, kredit: 0, deskripsi: 'Penerimaan dari Disposal' },
        { accountId: asset.accountAssetId ?? await this.findOrCreateAccountId('1100', 'Aset Tetap', 'ASSET'), debit: 0, kredit: Number(asset.nilaiPerolehan), deskripsi: `Hapus Aset: ${asset.nama}` },
      ];
      if (gainLoss > 0) {
        lines.push({ accountId: await this.findOrCreateAccountId('8001', 'Keuntungan Disposal Aset', 'REVENUE'), debit: 0, kredit: gainLoss, deskripsi: 'Gain Disposal Aset' });
      } else if (gainLoss < 0) {
        lines.push({ accountId: await this.findOrCreateAccountId('9001', 'Kerugian Disposal Aset', 'EXPENSE'), debit: Math.abs(gainLoss), kredit: 0, deskripsi: 'Loss Disposal Aset' });
      }
      await this.prisma.journal.create({
        data: {
          nomor: `JNL-DISP-${asset.kode}-${Date.now()}`,
          tanggal: tanggalDisposal, deskripsi: `Disposal Aset: ${asset.nama}`, status: 'POSTED',
          lines: { create: (lines as any[]) },
        } as any,
      });
    } catch { /* journal optional */ }

    const newStatus = nilaiDisposal > 0 ? 'SOLD' : 'DISPOSED';
    await this.prisma.fixedAsset.update({ where: { id: assetId }, data: { status: newStatus, note } });
    return { gainLoss, nilaiBuku, nilaiDisposal, status: newStatus };
  }

  // ─── DEPRECIATION SCHEDULE ───────────────────────────────────────────────
  async getDepreciationSchedule(assetId: string) {
    const asset = await this.prisma.fixedAsset.findUnique({ where: { id: assetId } });
    if (!asset) throw new NotFoundException('Aset tidak ditemukan');

    const nilaiPerolehan = Number(asset.nilaiPerolehan);
    const nilaiResidu    = Number(asset.nilaiResidu);
    const umurBulan      = asset.umurEkonomi;
    const startDate      = new Date(asset.tanggalPerolehan);

    const schedule: any[] = [];
    let nilaiBuku = nilaiPerolehan;
    let akumDep = 0;

    for (let i = 0; i < umurBulan; i++) {
      const d = new Date(startDate.getFullYear(), startDate.getMonth() + i + 1, 1);
      if (nilaiBuku <= nilaiResidu) break;

      let beban = 0;
      if (asset.metodeDepresiasi === 'STRAIGHT_LINE') {
        beban = (nilaiPerolehan - nilaiResidu) / umurBulan;
      } else {
        beban = nilaiBuku * (2 / umurBulan);
      }
      beban = Math.min(Math.round(beban), nilaiBuku - nilaiResidu);
      akumDep += beban;
      nilaiBuku -= beban;

      schedule.push({ periode: `${d.getMonth() + 1}/${d.getFullYear()}`, bulan: d.getMonth() + 1, tahun: d.getFullYear(), bebanDepresiasi: beban, akumDepresiasi: akumDep, nilaiBuku });
    }

    return { asset, schedule };
  }

  // ─── ASSET REGISTER ──────────────────────────────────────────────────────
  async getAssetRegister(asOfDate?: Date) {
    const asOf = asOfDate ?? new Date();
    const assets = await this.prisma.fixedAsset.findMany({
      where: { status: 'ACTIVE' },
      include: { category: true, depreciations: { orderBy: [{ tahun: 'desc' }, { bulan: 'desc' }], take: 1 } },
      orderBy: { acquisitionDate: 'asc' },
    });

    return assets.map(a => {
      const acquisitionValue = Number(a.acquisitionValue || a.nilaiPerolehan || 0);
      const lastDep = a.depreciations[0];
      const currentBookValue = lastDep ? Number(lastDep.nilaiBuku) : acquisitionValue;
      return {
        code: a.code || a.kode,
        name: a.name || a.nama,
        category: a.category?.name || a.kategori,
        acquisitionDate: a.acquisitionDate || a.tanggalPerolehan,
        acquisitionValue,
        residualValue: Number(a.residualValue || a.nilaiResidu || 0),
        accumulatedDep: acquisitionValue - currentBookValue,
        currentBookValue,
        usefulLifeMonths: a.usefulLifeMonths || a.umurEkonomi,
        depreciationMethod: a.depreciationMethod || a.metodeDepresiasi,
      };
    });
  }

  async getDepreciationReport(year?: number) {
    const targetYear = year ?? new Date().getFullYear();
    const depreciations = await this.prisma.assetDepreciation.findMany({
      where: { tahun: targetYear },
      include: { asset: { include: { category: true } } },
      orderBy: [{ tahun: 'asc' }, { bulan: 'asc' }],
    });

    return depreciations.map(d => ({
      assetCode: d.asset.code || d.asset.kode,
      assetName: d.asset.name || d.asset.nama,
      category: d.asset.category?.name || d.asset.kategori,
      periode: `${d.bulan}/${d.tahun}`,
      bebanDepresiasi: Number(d.bebanDepresiasi),
      akumDepresiasi: Number(d.akumDepresiasi),
      nilaiBuku: Number(d.nilaiBuku),
    }));
  }

  async getKategori() {
    const assets = await this.prisma.fixedAsset.findMany({ select: { kategori: true }, distinct: ['kategori'] });
    return assets.map(a => a.kategori);
  }

  private async findOrCreateAccountId(code: string, name: string, type: string): Promise<string> {
    const acc = await this.prisma.account.findFirst({ where: { code } });
    if (acc) return acc.id;
    const created = await this.prisma.account.create({ data: { code, name, type: type as any } as any });
    return created.id;
  }
}
