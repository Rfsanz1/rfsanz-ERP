import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty({ message: 'Nama role harus diisi' })
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}
