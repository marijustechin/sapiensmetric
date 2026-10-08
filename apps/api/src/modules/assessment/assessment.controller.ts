import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  assessmentAttemptListSchema,
  assessmentAttemptViewSchema,
  assessmentResultSchema,
  saveAnswersRequestSchema,
  type AssessmentAttemptList,
  type AssessmentAttemptView,
  type AssessmentResultDto,
} from '@sapiensmetric/contracts';
import {
  AccessTokenGuard,
  AuthenticatedRequest,
} from '../auth/access-token.guard.js';
import { AssessmentService } from './assessment.service.js';

/**
 * Authenticated assessment-attempt endpoints (T-017).
 *
 * Every route is behind `AccessTokenGuard`, which enforces a valid session for
 * an active, email-verified user on each request. Ownership is derived from the
 * session (`request.userId`) and enforced by the service/store — a user can only
 * reach their own attempts, and editors/admins get no cross-user access here.
 * Responses are client-safe projections (no answer keys).
 */
@Controller('assessments')
@UseGuards(AccessTokenGuard)
export class AssessmentController {
  // Explicit `@Inject` (matching the other controllers) keeps the dependency
  // resolvable under test runners that do not emit `design:paramtypes`.
  constructor(
    @Inject(AssessmentService) private readonly assessments: AssessmentService,
  ) {}

  @Post('attempts')
  @HttpCode(HttpStatus.CREATED)
  async start(
    @Req() request: AuthenticatedRequest,
  ): Promise<AssessmentAttemptView> {
    return assessmentAttemptViewSchema.parse(
      await this.assessments.start(request.userId),
    );
  }

  @Get('attempts')
  async list(
    @Req() request: AuthenticatedRequest,
  ): Promise<AssessmentAttemptList> {
    return assessmentAttemptListSchema.parse(
      await this.assessments.list(request.userId),
    );
  }

  @Get('attempts/:id')
  async get(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<AssessmentAttemptView> {
    return assessmentAttemptViewSchema.parse(
      await this.assessments.get(request.userId, id),
    );
  }

  @Put('attempts/:id/answers')
  async saveAnswers(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<AssessmentAttemptView> {
    const parsed = saveAnswersRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'INVALID_ANSWERS',
        message: 'Malformed answer payload.',
      });
    }
    return assessmentAttemptViewSchema.parse(
      await this.assessments.saveAnswers(
        request.userId,
        id,
        parsed.data.revision,
        parsed.data.answers,
      ),
    );
  }

  @Post('attempts/:id/submit')
  @HttpCode(HttpStatus.OK)
  async submit(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<AssessmentResultDto> {
    return assessmentResultSchema.parse(
      await this.assessments.submit(request.userId, id),
    );
  }

  @Get('attempts/:id/result')
  async result(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<AssessmentResultDto> {
    return assessmentResultSchema.parse(
      await this.assessments.result(request.userId, id),
    );
  }
}
