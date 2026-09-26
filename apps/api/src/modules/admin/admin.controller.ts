import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type {
  AdminAuditList,
  AdminSummary,
  AdminUserDetail,
  AdminUserList,
} from '@sapiensmetric/contracts';
import {
  updateUserRoleRequestSchema,
  updateUserStatusRequestSchema,
} from '@sapiensmetric/contracts';
import { AdminGuard } from './admin.guard.js';
import { AdminService, type AdminListParams } from './admin.service.js';
import type { AuthenticatedRequest } from '../auth/access-token.guard.js';

function mapAdminError(error: unknown): never {
  if (error instanceof Error && error.name === 'AdminNotFoundError') {
    throw new NotFoundException('User not found.');
  }
  if (error instanceof Error && error.name === 'AdminConflictError') {
    throw new ConflictException(error.message);
  }
  throw error;
}

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(@Inject(AdminService) private readonly admin: AdminService) {}

  @Get('summary')
  summary(): Promise<AdminSummary> {
    return this.admin.summary();
  }

  @Get('users')
  listUsers(@Query() query: AdminListParams): Promise<AdminUserList> {
    return this.admin.listUsers(query);
  }

  @Get('users/:id')
  getUser(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<AdminUserDetail> {
    return this.admin.getUser(id).catch(mapAdminError);
  }

  @Patch('users/:id/role')
  changeRole(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: unknown,
    @Req() request: AuthenticatedRequest,
  ): Promise<AdminUserDetail> {
    const parsed = updateUserRoleRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException();
    }
    return this.admin
      .changeRole(request.userId, id, parsed.data.role)
      .catch(mapAdminError);
  }

  @Patch('users/:id/status')
  changeStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: unknown,
    @Req() request: AuthenticatedRequest,
  ): Promise<AdminUserDetail> {
    const parsed = updateUserStatusRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException();
    }
    return this.admin
      .changeStatus(request.userId, id, parsed.data.status)
      .catch(mapAdminError);
  }

  @Post('users/:id/revoke-sessions')
  @HttpCode(HttpStatus.OK)
  revokeSessions(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<AdminUserDetail> {
    return this.admin.revokeSessions(request.userId, id).catch(mapAdminError);
  }

  @Get('audit')
  audit(
    @Query('targetUserId') targetUserId?: string,
    @Query('limit') limit?: string,
  ): Promise<AdminAuditList> {
    const target = targetUserId?.trim() || null;
    return this.admin.listAudit(target, limit);
  }
}
