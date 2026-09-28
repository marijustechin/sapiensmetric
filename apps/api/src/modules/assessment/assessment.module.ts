import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { UsersModule } from '../users/users.module.js';
import { SessionsModule } from '../auth/sessions/sessions.module.js';
import { AssessmentAttempt } from './assessment-attempt.entity.js';
import {
  ASSESSMENT_ATTEMPT_STORE,
  TypeOrmAssessmentAttemptStore,
} from './assessment-attempt.store.js';
import { AssessmentService } from './assessment.service.js';
import { AssessmentController } from './assessment.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([AssessmentAttempt]),
    AuthModule,
    UsersModule,
    SessionsModule,
  ],
  controllers: [AssessmentController],
  providers: [
    AssessmentService,
    {
      provide: ASSESSMENT_ATTEMPT_STORE,
      useClass: TypeOrmAssessmentAttemptStore,
    },
  ],
})
export class AssessmentModule {}
