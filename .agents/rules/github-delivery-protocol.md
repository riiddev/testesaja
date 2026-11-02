# Permanent GitHub Delivery Protocol — SinauuEnglish

Repository: https://github.com/riiddev/testesaja.git

These instructions apply automatically to all implementation, improvement, bug-fix, and refactoring tasks in this repository.

## 1. After completing a task

Whenever an implementation, improvement, fix, or refactor task is completed:

1. Review all modified files.
2. Inspect `git status` and `git diff`.
3. Ensure no unrelated user changes are included.
4. Run the relevant project checks:
   - `npm run typecheck`
   - `npm run test:content`
   - `npm run build`
   - `npm run test:browser`
5. Fix regressions caused by your implementation.
6. Create meaningful Git commits for the completed changes.
7. Push the commits to the official GitHub repository (`origin`).

Do not leave completed, tested work only in the local workspace when it is ready to be saved to GitHub.

## 2. GitHub repository rules

Always verify:
- Repository: `riiddev/testesaja`
- Remote: `origin`
- Remote URL: `https://github.com/riiddev/testesaja.git`

Use a dedicated feature branch for development.
If already working on the correct feature branch, continue using it. Otherwise, create an appropriately named branch.
Never silently push to a different repository.

## 3. Protect existing work

- Never force push (`--force` or `-f`).
- Never overwrite or reset `main`.
- Never discard unrelated changes.
- Never use destructive Git commands to clean up the workspace without authorization.
- Never include credentials, secrets, temporary files, or unnecessary build artifacts (`dist/`, `node_modules/`, etc.).
- Never create empty commits.
- Never commit changes that belong to unrelated work.

If there are conflicting changes, inspect them and preserve the user's work.

## 4. Testing and failure handling

Only mark a task as ready for GitHub delivery after the implementation has been reviewed and relevant tests have passed.

If a test fails:
- Determine whether the failure was introduced by your changes.
- Fix implementation-related failures.
- Report unrelated or environment-related failures honestly.
- Do not claim that the task is fully validated when checks have not passed.

Do not push broken or incomplete work just to satisfy the delivery instruction.

## 5. Push and Pull Request policy

After successful validation:
- Commit the completed changes.
- Push the feature branch to the official GitHub repository.
- Verify that the remote branch contains the expected commits.

Do not merge into `main`.
Do not automatically create a new Pull Request for every small task. Create or update a Pull Request only when explicitly requested by the user or when a planned batch of features is declared complete and ready for review.

When creating a Pull Request:
- Target branch: `main`.
- Include a meaningful title and implementation summary.
- Include test results and known limitations.
- Never enable auto-merge.

Never deploy to production without explicit user approval.

## 6. Final report

After every GitHub delivery, report:
- Repository URL.
- Feature branch name.
- Commit hashes and messages.
- Files changed.
- Tests executed and their results.
- Push status.
- Pull Request URL, if one was requested.
- Remaining issues or blockers.

If authentication, permissions, or remote errors prevent a successful push, explain exactly what happened and provide the safest next step.

## 7. Core rule

Treat GitHub synchronization as the standard final step of every completed and validated implementation task.
Do not require the user to repeat these instructions each time.
However, never assume that an unfinished preview, untested implementation, merge, or production deployment is approved.

