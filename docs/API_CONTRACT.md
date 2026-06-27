# DevEdu – API Contract (Iteration 1 / MVP: F1–F5)

This is the single source of truth shared by backend, frontend and e2e tests.
All paths are prefixed with `/api`. Auth uses JWT Bearer tokens (`Authorization: Bearer <token>`).

## Roles
`Learner` (default), `Author`, `Admin`.

## Auth (F1)
- `POST /api/auth/register` — body `{ email, displayName, password, role? }` (role one of `Learner`|`Author`, default `Learner`) → `200 { token, refreshToken, user: { id, email, displayName, roles[] } }`
- `POST /api/auth/login` — body `{ email, password }` → `200 { token, refreshToken, user }` ; wrong creds → `401`
- `POST /api/auth/refresh` — body `{ refreshToken }` → `200 { token, refreshToken }`

## Courses (F2/F3/F4)
- `GET /api/courses` (auth) → `[{ id, title, slug, description, tags[], level, status }]`
  - Learners see only `Published`; Authors also see their own `Draft`.
- `GET /api/courses/{id}` (auth) → full tree:
  ```
  { id, title, slug, description, tags[], level, status,
    chapters: [ { id, title, order, description,
                  topics: [ { id, title, order,
                              examples: [ { id, title, contentBlocks[], language, order } ],
                              questions: [ Question ] } ],
                  questions: [ Question ] } ] }
  ```
- `POST /api/courses` (Author) — `{ title, description, tags[], level }` → course
- `PUT /api/courses/{id}` (Author) — `{ title, description, tags[], level }`
- `POST /api/courses/{id}/publish` (Author) → sets `status=Published`
- `POST /api/courses/{id}/chapters` (Author) — `{ title, description, order }` → chapter
- `POST /api/chapters/{id}/topics` (Author) — `{ title, order }` → topic
- `POST /api/topics/{id}/examples` (Author) — `{ title, contentBlocks[], language, order }` → example
- `POST /api/topics/{id}/questions` (Author) — Question body → question
- `POST /api/chapters/{id}/questions` (Author) — Question body → question

`contentBlocks[]` item: `{ kind: "markdown"|"code", text, language? }`

## Question model (F5)
Common: `{ id, scope: "Topic"|"Chapter", type, prompt, explanation?, points, difficulty }`
Type-specific:
- `SingleChoice`: `options: [{ id, text }]`, `correctOptionId` (omitted in learner responses)
- `MultipleChoice`: `options: [{ id, text }]`, `correctOptionIds[]` (omitted in learner responses)
- `TrueFalse`: `correctAnswer: bool` (omitted in learner responses)

Create body example: `{ type, scope, prompt, explanation, points, difficulty, options?, correctOptionId?, correctOptionIds?, correctAnswer? }`

## Enrollment & Progress (F4/F6-lite)
- `POST /api/enrollments` (Learner) — `{ courseId }` → `{ id, courseId, status, startedAt }`
- `GET /api/me/progress` (auth) → `[{ courseId, completedTopicIds[], completedChapterIds[] }]`
- `POST /api/topics/{id}/complete` (Learner) → marks topic complete in progress

## Attempts (F5)
- `POST /api/questions/{id}/attempts` (Learner) — body `{ answer }` where `answer` is:
  - SingleChoice: `{ selectedOptionId }`
  - MultipleChoice: `{ selectedOptionIds: [] }`
  - TrueFalse: `{ value: bool }`
  - → `200 { isCorrect, score, explanation? }`

## Code tasks (F7)
Question `type: Code` carries `code: { language, starterCode, timeLimitMs, memoryLimitMb, testCases: [{ id, hidden, input, expectedOutput }], solutionCode? }`.
`solutionCode` and the `input`/`expectedOutput` of hidden test cases are **omitted in learner responses** (only authors/admins see them).

Async grading (submit → poll):
- `POST /api/code-submissions` (Learner) — `{ questionId, code }` → `202 { id, status }` (Location: `/api/code-submissions/{id}`)
- `GET /api/code-submissions/{id}` (owner/author/admin) → `{ id, questionId, status: "Queued"|"Running"|"Completed"|"Error", outcome, passedCount, totalCount, durationMs, compileError?, errorMessage?, testResults: [{ testCaseId, hidden, passed, outcome, durationMs, input?, expectedOutput?, actualOutput?, stderr? }] }`
  - For learners, hidden test results expose only `passed`/`outcome`/`durationMs`; I/O fields are null.
  - On `Completed`, the backend records an `Attempt` (`isCorrect` = all tests passed) so the task counts toward F6 progress.

## Errors
`400` validation, `401` unauthenticated, `403` wrong role, `404` not found. Body `{ error, details? }`.

## Runtime / Infra contract
- Backend listens on `:8080` (`ASPNETCORE_URLS=http://+:8080`). Health: `GET /health` → `200`.
- Mongo connection via env `Mongo__ConnectionString` (default `mongodb://localhost:27017`), db name `devedu`.
- JWT signing key via env `Jwt__Key`, issuer `Jwt__Issuer` (default `devedu`).
- On startup the backend **seeds** (if DB empty): an Author `author@devedu.local` / `Passw0rd!`,
  a Learner `learner@devedu.local` / `Passw0rd!`, and one **Published** demo course
  "C# Grundlagen" with 1 chapter, 1 topic, 1 example, and 3 questions (one of each type).
- Frontend is served by nginx on `:80` and **proxies `/api` and `/health`** to the backend service.
  In compose the backend host is `backend:8080`; in k8s it is `backend.devedu.svc.cluster.local:8080`
  (the proxy target is injected via nginx env/templating).

## Frontend routes + required `data-testid` attributes (for e2e)
- `/login`: `email-input`, `password-input`, `login-submit`, `login-error`
- `/register`: `register-email`, `register-name`, `register-password`, `register-role`, `register-submit`
- top nav (when logged in): `user-displayname`, `nav-logout`, `nav-courses`
- `/courses`: one `course-card` per course, each contains `course-card-title`; clicking navigates to detail
- `/courses/:id`:
  - `topic-nav-item` (one per topic), `example-content`
  - `question-item` (one per question) containing:
    - SingleChoice/MultipleChoice: `option-input` (one per option) + `option-label`
    - TrueFalse: `truefalse-true`, `truefalse-false`
    - `submit-answer` button, `answer-feedback` (shows correct/incorrect + explanation)
  - `mark-complete` button → calls `/topics/{id}/complete`, then shows `topic-completed` badge
- After login the app stores the JWT and redirects to `/courses`.

## Demo credentials (seeded)
- Author: `author@devedu.local` / `Passw0rd!`
- Learner: `learner@devedu.local` / `Passw0rd!`
