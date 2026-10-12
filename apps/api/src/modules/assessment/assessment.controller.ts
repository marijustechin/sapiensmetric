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
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  assessmentAttemptContentSchema,
  assessmentAttemptListSchema,
  assessmentAttemptViewSchema,
  assessmentCapabilitiesResponseSchema,
  assessmentFeedbackSchema,
  assessmentResultSchema,
  assessmentUiLocaleSchema,
  saveAnswersRequestSchema,
  type AssessmentAttemptContent,
  type AssessmentAttemptList,
  type AssessmentAttemptView,
  type AssessmentCapabilitiesResponse,
  type AssessmentFeedback,
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

  private parseLocale(value: unknown): 'en' | 'lt' {
    const parsed = assessmentUiLocaleSchema.safeParse(value ?? 'en');
    if (!parsed.success) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'INVALID_LOCALE',
        message: 'locale must be "en" or "lt".',
      });
    }
    return parsed.data;
  }

  /** Client-safe localized content for an owned attempt (no answer keys). */
  @Get('attempts/:id/content')
  async content(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Query('locale') locale: string | undefined,
  ): Promise<AssessmentAttemptContent> {
    return assessmentAttemptContentSchema.parse(
      await this.assessments.content(request.userId, id, this.parseLocale(locale)),
    );
  }

  /** Post-submission feedback for a finalised owned attempt. */
  @Get('attempts/:id/feedback')
  async feedback(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Query('locale') locale: string | undefined,
  ): Promise<AssessmentFeedback> {
    return assessmentFeedbackSchema.parse(
      await this.assessments.feedback(request.userId, id, this.parseLocale(locale)),
    );
  }

  @Post('attempts')
  @HttpCode(HttpStatus.CREATED)
  async start(
    @Req() request: AuthenticatedRequest,
  ): Promise<AssessmentAttemptView> {
    return assessmentAttemptViewSchema.parse(
      await this.assessments.start(request.userId),
    );
  }

  /**
   * Client-safe module availability for the current account (T-023). Authenticated
   * because astronomy eligibility is per-account; it contains no user data.
   */
  @Get('capabilities')
  async capabilities(
    @Req() request: AuthenticatedRequest,
  ): Promise<AssessmentCapabilitiesResponse> {
    return assessmentCapabilitiesResponseSchema.parse(
      await this.assessments.capabilities(request.userId),
    );
  }

  /**
   * Start an astronomy **draft** attempt (local-review-only; gated). Distinct
   * path from `POST attempts` so the synthetic flow is unchanged.
   */
  @Post('attempts/astronomy-draft')
  @HttpCode(HttpStatus.CREATED)
  async startAstronomyDraft(
    @Req() request: AuthenticatedRequest,
  ): Promise<AssessmentAttemptView> {
    return assessmentAttemptViewSchema.parse(
      await this.assessments.startAstronomyDraft(request.userId),
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
