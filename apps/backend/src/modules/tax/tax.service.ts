import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { TaxType, TaxLineType } from '@prisma/client';
import { CreateTaxDto, UpdateTaxDto } from './dto/create-tax.dto.js';

export interface PPNResult {
  dpp: number;
  ppn: number;
  total: number;
  rate: number;
}

export interface PPh21Result {
  grossSalary: number;
  ptkp: number;
  pkp: number;
  pph21Setahun: number;
  pph21Bulanan: number;
  statusPajak: string;
  rincianTarif: { lapisan: string; rate: number; jumlah: number }[];
}

export interface PPh23Result {
  bruto: number;
  rate: number;
  pph23: number;
  jenis: string;
}

export interface PPh4a2Result {
  bruto: number;
  rate: number;
  pph4a2: number;
  jenis: string;
}

const PTKP_2024: Record<string, number> = {
  'TK/0': 54_000_000,
  'TK/1': 58_500_000,
  'TK/2': 63_000_000,
  'TK/3': 67_500_000,
  'K/0':  58_500_000,
  'K/1':  63_000_000,
  'K/2':  67_500_000,
  'K/3':  72_000_000,
  'K/I/0': 112_500_000,
  'K/I/1': 117_000_000,
  'K/I/2': 121_500_000,
  'K/I/3': 126_000_000,
};

const PPH21_BRACKETS = [
  { batas: 60_000_000,    rate: 0.05 },
  { batas: 250_000_000,   rate: 0.15 },
  { batas: 500_000_000,   rate: 0.25 },
  { batas: 5_000_000_000, rate: 0.30 },
  { batas: Infinity,      rate: 0.35 },
];

const PPH23_RATES: Record<string, number> = {
  jasa:      0.02,
  dividen:   0.15,
  bunga:     0.15,
  royalti:   0.15,
  sewa:      0.02,
  hadiah:    0.15,
  imbalan:   0.02,
};

const PPH4A2_RATES: Record<string, number> = {
  'sewa_tanah_bangunan':       0.10,
  'konstruksi_sederhana':      0.02,
  'konstruksi_menengah':       0.03,
  'konstruksi_besar':          0.04,
  'jasa_konstruksi_sederhana': 0.02,
  'jasa_konstruksi_besar':     0.04,
  'pengalihan_tanah':          0.025,
  'bunga_koperasi':            0.10,
};

@Injectable()
export class TaxService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.tax.findMany({ orderBy: { kode: 'asc' } });
  }

  async findOne(id: string) {
    const tax = await this.prisma.tax.findUnique({ where: { id } });
    if (!tax) throw new NotFoundException(`Pajak ID ${id} tidak ditemukan`);
    return tax;
  }

  async create(dto: CreateTaxDto) {
    return this.prisma.tax.create({ data: { ...dto, rate: dto.rate } });
  }

  async update(id: string, dto: UpdateTaxDto) {
    await this.findOne(id);
    return this.prisma.tax.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.tax.delete({ where: { id } });
  }

  calculatePPN(amount: number, taxRate = 11): PPNResult {
    if (amount < 0) throw new BadRequestException('Amount tidak boleh negatif');
    const rate = taxRate / 100;
    const dpp = Math.round(amount);
    const ppn = Math.round(dpp * rate);
    return { dpp, ppn, total: dpp + ppn, rate: taxRate };
  }

  calculatePPh21(grossSalary: number, statusPajak: string): PPh21Result {
    const ptkp = PTKP_2024[statusPajak];
    if (ptkp === undefined) {
      throw new BadRequestException(
        `Status pajak "${statusPajak}" tidak valid. Gunakan: ${Object.keys(PTKP_2024).join(', ')}`
      );
    }

    const gajiBrutoSetahun = grossSalary * 12;
    const biayaJabatan = Math.min(gajiBrutoSetahun * 0.05, 6_000_000);
    const pkp = Math.max(0, gajiBrutoSetahun - biayaJabatan - ptkp);
    const pkpBulat = Math.floor(pkp / 1000) * 1000;

    let sisa = pkpBulat;
    let pph21Setahun = 0;
    const rincianTarif: { lapisan: string; rate: number; jumlah: number }[] = [];
    let batasBawah = 0;

    for (const bracket of PPH21_BRACKETS) {
      if (sisa <= 0) break;
      const kena = Math.min(sisa, bracket.batas - batasBawah);
      const pajak = Math.round(kena * bracket.rate);
      pph21Setahun += pajak;
      rincianTarif.push({
        lapisan: `${this.formatCurrency(batasBawah)} - ${bracket.batas === Infinity ? 'seterusnya' : this.formatCurrency(bracket.batas)}`,
        rate: bracket.rate * 100,
        jumlah: pajak,
      });
      sisa -= kena;
      batasBawah = bracket.batas;
    }

    return {
      grossSalary,
      ptkp,
      pkp: pkpBulat,
      pph21Setahun,
      pph21Bulanan: Math.round(pph21Setahun / 12),
      statusPajak,
      rincianTarif,
    };
  }

  calculatePPh23(amount: number, jenis: string): PPh23Result {
    const rate = PPH23_RATES[jenis.toLowerCase()];
    if (rate === undefined) {
      throw new BadRequestException(
        `Jenis PPh23 "${jenis}" tidak valid. Pilihan: ${Object.keys(PPH23_RATES).join(', ')}`
      );
    }
    const pph23 = Math.round(amount * rate);
    return { bruto: amount, rate: rate * 100, pph23, jenis };
  }

  calculatePPh4a2(amount: number, jenis: string): PPh4a2Result {
    const rate = PPH4A2_RATES[jenis.toLowerCase()];
    if (rate === undefined) {
      throw new BadRequestException(
        `Jenis PPh 4(2) "${jenis}" tidak valid. Pilihan: ${Object.keys(PPH4A2_RATES).join(', ')}`
      );
    }
    const pph4a2 = Math.round(amount * rate);
    return { bruto: amount, rate: rate * 100, pph4a2, jenis };
  }

  async createTaxLine(
    referenceId: string,
    referenceType: string,
    taxId: string,
    baseAmount: number,
    taxAmount: number,
    tipe: TaxLineType,
  ) {
    return this.prisma.taxLine.create({
      data: { referenceId, referenceType, taxId, baseAmount, taxAmount, tipe },
    });
  }

  async getTaxLinesByReference(referenceId: string) {
    return this.prisma.taxLine.findMany({
      where: { referenceId },
      include: { tax: true },
    });
  }

  private formatCurrency(n: number) {
    return new Intl.NumberFormat('id-ID').format(n);
  }

  getPTKPOptions() {
    return Object.entries(PTKP_2024).map(([status, nilai]) => ({ status, nilai }));
  }

  getPPh23Options() {
    return Object.entries(PPH23_RATES).map(([jenis, rate]) => ({ jenis, rate: rate * 100 }));
  }

  getPPh4a2Options() {
    return Object.entries(PPH4A2_RATES).map(([jenis, rate]) => ({ jenis, rate: rate * 100 }));
  }
}
