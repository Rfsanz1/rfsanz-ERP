import { IsString, IsEnum, IsNumber, IsBoolean, IsOptional, Min, Max } from 'class-validator';
import { TaxType } from '@prisma/client';

export class CreateTaxDto {
  @IsString()
  kode: string;

  @IsString()
  nama: string;

  @IsEnum(TaxType)
  tipe: TaxType;

  @IsNumber()
  @Min(0)
  @Max(100)
  rate: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  accountId?: string;
}

export class UpdateTaxDto {
  @IsOptional()
  @IsString()
  nama?: string;

  @IsOptional()
  @IsEnum(TaxType)
  tipe?: TaxType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  rate?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  accountId?: string;
}

export class CalculatePPNDto {
  @IsNumber()
  amount: number;

  @IsOptional()
  @IsNumber()
  taxRate?: number;
}

export class CalculatePPh21Dto {
  @IsNumber()
  grossSalary: number;

  @IsString()
  statusPajak: string;
}

export class CalculatePPh23Dto {
  @IsNumber()
  amount: number;

  @IsString()
  jenis: string;
}

export class CalculatePPh4a2Dto {
  @IsNumber()
  amount: number;

  @IsString()
  jenis: string;
}

export class ExportEFakturDto {
  @IsString()
  periode: string;
}

export class RekapPPNDto {
  @IsString()
  periode: string;
}
