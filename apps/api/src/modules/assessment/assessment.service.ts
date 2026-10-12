import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AssessmentError,
  scoreAttempt,
  type KeyedFormSnapshot,
  type ResponseEntry,
} from '@sapiensmetric/assessment';
import type {
  AssessmentAttemptContent,
  AssessmentAttemptList,
  AssessmentCapabilitiesResponse,
  AssessmentFeedback,
  AssessmentResultDto,
  AssessmentUiLocale,
  ItemResponseDto,
  ResponseEntryDto,
} from '@sapiensmetric/contracts';
import { APP_CONFIG, AppConfig } from '../../config/env.js';
import {
  USER_STORE,
  type UserStore,
} from '../users/user-store.js';
import {
  ASSESSMENT_ATTEMPT_STORE,
  applySaveOps,
  type AssessmentAttemptStore,
  type AttemptRecord,
} from './assessment-attempt.store.js';
import { buildSyntheticForm } from './synthetic-form.js';
import { buildAstronomySnapshot } from './astronomy/astronomy-bank.js';
import {
  buildAttemptContent,
  buildAttemptFeedback,
} from './astronomy/astronomy-feedback.js';
import {
  isHistoryVisible,
  toAttemptList,
  toAttemptView,
} from './assessment-view.js';

function errorBody(statusCode: number, code: string, message: string) {
  return { statusCode, code, message };
}

@Injectable()
export class AssessmentService {
  constructor(
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    @Inject(ASSESSMENT_ATTEMPT_STORE)
    private readonly store: AssessmentAttemptStore,
    @Inject(USER_STORE) private readonly users: UserStore,
  ) {}

  private syntheticEnabled(): boolean {
    return this.config.assessments.syntheticEnabled;
  }

  private notAvailable(module: 'synthetic' | 'astronomy'): never {
    const message =
      module === 'astronomy'
        ? 'Astronomy draft content is disabled in this environment.'
        : 'Synthetic assessment content is disabled in this environment.';
    throw new NotFoundException(
      errorBody(HttpStatus.NOT_FOUND, 'ASSESSMENT_NOT_AVAILABLE', message),
    );
  }

  /**
   * T-023: the closed-review capability is on, but the authenticated account is
   * not an explicitly authorised reviewer. Server-enforced — the UI cannot grant
   * it and hidden controls are not access control.
   */
  private notAuthorised(): never {
    throw new ForbiddenException(
      errorBody(
        HttpStatus.FORBIDDEN,
        'REVIEW_NOT_AUTHORISED',
        'This account is not authorised for closed assessment review.',
      ),
    );
  }

  private async reviewEligible(userId: string): Promise<boolean> {
    const user = await this.users.findById(userId);
    return Boolean(user?.reviewEligible);
  }

  private notFound(): never {
    throw new NotFoundException(
      errorBody(HttpStatus.NOT_FOUND, 'ATTEMPT_NOT_FOUND', 'Attempt not found.'),
    );
  }

  private async ownedOrThrow(
    userId: string,
    attemptId: string,
  ): Promise<AttemptRecord> {
    const attempt = await this.store.findOwned(userId, attemptId);
    if (!attempt) {
      this.notFound();
    }
    return attempt;
  }

  /**
   * Validate that the merged answers are structurally valid against the stored
   * snapshot, by reusing the scoring core as a validator (no second algorithm).
   * A coded `AssessmentError` becomes a 400.
   */
  private assertAnswersValid(
    snapshot: KeyedFormSnapshot,
    merged: ResponseEntry[],
  ): void {
    try {
      scoreAttempt(snapshot, {
        attemptId: 'validation-probe',
        status: 'submitted',
        responses: merged,
      });
    } catch (error) {
      if (error instanceof AssessmentError) {
        throw new BadRequestException(
          errorBody(HttpStatus.BAD_REQUEST, 'INVALID_ANSWERS', error.message),
        );
      }
      throw error;
    }
  }

  /** Start a synthetic attempt. Only available when explicitly enabled locally. */
  async start(userId: string): Promise<ReturnType<typeof toAttemptView>> {
    if (!this.syntheticEnabled()) {
      this.notAvailable('synthetic');
    }
    const attempt = await this.store.create(userId, buildSyntheticForm());
    return toAttemptView(attempt);
  }

  async list(userId: string): Promise<AssessmentAttemptList> {
    const attempts = await this.store.listOwned(userId);
    // Normal history hides untouched drafts (no saved progress, not submitted).
    // They remain retrievable by id for snapshot/ownership integrity.
    return toAttemptList(attempts.filter(isHistoryVisible));
  }

  async get(userId: string, attemptId: string): Promise<ReturnType<typeof toAttemptView>> {
    return toAttemptView(await this.ownedOrThrow(userId, attemptId));
  }

  /**
   * Start an astronomy **draft** attempt.
   *
   * Local review: gated by `ASSESSMENT_ASTRONOMY_DRAFT_ENABLED` (off by default,
   * refused in production). Closed production review (T-023): gated by
   * `ASSESSMENT_REVIEW_ENABLED` and additionally restricted to accounts the
   * operator explicitly marked `reviewEligible`.
   */
  async startAstronomyDraft(userId: string): Promise<ReturnType<typeof toAttemptView>> {
    const devEnabled = this.config.assessments.astronomyDraftEnabled;
    const reviewEnabled = this.config.assessments.reviewEnabled;
    if (!devEnabled && !reviewEnabled) {
      this.notAvailable('astronomy');
    }
    if (reviewEnabled && !(await this.reviewEligible(userId))) {
      this.notAuthorised();
    }
    const attempt = await this.store.create(userId, buildAstronomySnapshot());
    return toAttemptView(attempt);
  }

  /**
   * Client-safe availability of the assessment modules for the current account
   * and environment (T-023). Drives the UI only; every start path re-checks the
   * server-side gate.
   */
  async capabilities(userId: string): Promise<AssessmentCapabilitiesResponse> {
    const eligible = await this.reviewEligible(userId);
    return {
      synthetic: this.syntheticEnabled(),
      astronomyDraft:
        this.config.assessments.astronomyDraftEnabled ||
        (this.config.assessments.reviewEnabled && eligible),
    };
  }

  /** Client-safe localized content for an owned attempt (no answer keys). */
  async content(
    userId: string,
    attemptId: string,
    locale: AssessmentUiLocale,
  ): Promise<AssessmentAttemptContent> {
    const attempt = await this.ownedOrThrow(userId, attemptId);
    return {
      ...buildAttemptContent(attempt.snapshot, locale),
      attemptId: attempt.id,
    };
  }

  /**
   * Post-submission feedback (correctness, explanations, sources) for a
   * **finalised** owned attempt. Not available before submission.
   */
  async feedback(
    userId: string,
    attemptId: string,
    locale: AssessmentUiLocale,
  ): Promise<AssessmentFeedback> {
    const attempt = await this.ownedOrThrow(userId, attemptId);
    if (attempt.status !== 'finalised' || !attempt.result) {
      throw new ConflictException(
        errorBody(
          HttpStatus.CONFLICT,
          'ATTEMPT_NOT_FINALISED',
          'Feedback is available only after the attempt has been submitted.',
        ),
      );
    }
    return buildAttemptFeedback(
      attempt.snapshot,
      attempt.answers,
      attempt.result,
      locale,
    );
  }

  async saveAnswers(
    userId: string,
    attemptId: string,
    revision: number,
    answers: ResponseEntryDto[],
  ): Promise<ReturnType<typeof toAttemptView>> {
    const attempt = await this.ownedOrThrow(userId, attemptId);
    if (attempt.status === 'finalised') {
      throw new ConflictException(
        errorBody(
          HttpStatus.CONFLICT,
          'ATTEMPT_FINALISED',
          'This attempt has been submitted and can no longer be changed.',
        ),
      );
    }

    const ops = answers as unknown as ResponseEntry[];
    this.assertAnswersValid(
      attempt.snapshot,
      applySaveOps(attempt.answers, ops),
    );

    const outcome = await this.store.saveAnswers(
      userId,
      attemptId,
      revision,
      ops,
    );
    switch (outcome.status) {
      case 'ok':
        return toAttemptView(outcome.attempt);
      case 'not_found':
        return this.notFound();
      case 'finalised':
        throw new ConflictException(
          errorBody(
            HttpStatus.CONFLICT,
            'ATTEMPT_FINALISED',
            'This attempt has been submitted and can no longer be changed.',
          ),
        );
      case 'conflict':
        throw new ConflictException(
          errorBody(
            HttpStatus.CONFLICT,
            'REVISION_CONFLICT',
            'The attempt was modified by another request; reload and retry.',
          ),
        );
    }
  }

  async submit(userId: string, attemptId: string): Promise<AssessmentResultDto> {
    const outcome = await this.store.finalise(userId, attemptId);
    if (outcome.status === 'not_found') {
      return this.notFound();
    }
    if (!outcome.attempt.result) {
      throw new HttpException(
        errorBody(
          HttpStatus.INTERNAL_SERVER_ERROR,
          'RESULT_MISSING',
          'Attempt finalised without a stored result.',
        ),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return outcome.attempt.result as unknown as AssessmentResultDto;
  }

  async result(userId: string, attemptId: string): Promise<AssessmentResultDto> {
    const attempt = await this.ownedOrThrow(userId, attemptId);
    if (attempt.status !== 'finalised' || !attempt.result) {
      throw new ConflictException(
        errorBody(
          HttpStatus.CONFLICT,
          'ATTEMPT_NOT_FINALISED',
          'This attempt has not been submitted yet.',
        ),
      );
    }
    return attempt.result as unknown as AssessmentResultDto;
  }
}

export type { ItemResponseDto };
