import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class SelectTenantDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  tenantId: string;
}
