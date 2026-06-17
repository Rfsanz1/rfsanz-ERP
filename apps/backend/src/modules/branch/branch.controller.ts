import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { BranchService } from './branch.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@Controller('branch')
@UseGuards(JwtAuthGuard)
export class BranchController {
  constructor(private readonly svc: BranchService) {}

  @Get('companies')              getCompanies()                                     { return this.svc.getCompanies(); }
  @Get('companies/:id')          getCompany(@Param('id') id: string)                { return this.svc.getCompany(id); }
  @Post('companies')             upsertCompany(@Body() dto: any)                    { return this.svc.upsertCompany(dto); }
  @Get()                         getBranches(@Query('companyId') cid?: string)      { return this.svc.getBranches(cid); }
  @Get(':id')                    getBranch(@Param('id') id: string)                 { return this.svc.getBranch(id); }
  @Post()                        createBranch(@Body() dto: any)                     { return this.svc.createBranch(dto); }
  @Put(':id')                    updateBranch(@Param('id') id: string, @Body() d: any) { return this.svc.updateBranch(id, d); }
  @Delete(':id')                 deleteBranch(@Param('id') id: string)              { return this.svc.deleteBranch(id); }
}
