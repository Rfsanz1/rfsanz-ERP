import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty, IsNumber, IsArray, IsDateString } from 'class-validator';

export class CreateExpenseDto {
  @ApiPropertyOptional() @IsOptional() @IsString() id?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() number?: string;
  @ApiProperty({ example: '2026-06-04' }) @IsNotEmpty() @IsDateString() date: string;
  @ApiPropertyOptional() @IsOptional() @IsString() contactId?: string;
  @ApiProperty({ example: 'a1b2c3d4' }) @IsNotEmpty() @IsString() accountId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() paymentAccountId?: string;
  @ApiProperty({ example: 1500000 }) @IsNotEmpty() @IsNumber() amount: number;
  @ApiPropertyOptional() @IsOptional() @IsString() taxId?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() taxAmount?: number;
  @ApiProperty({ example: 1500000 }) @IsNotEmpty() @IsNumber() totalAmount: number;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() attachment?: string;
  @ApiPropertyOptional() @IsOptional() @IsString({ each: true }) @IsArray() tags?: string[];
  @ApiPropertyOptional() @IsOptional() @IsString() branchId?: string;
  @ApiProperty({ example: 'user-123' }) @IsNotEmpty() @IsString() createdBy: string;
}
