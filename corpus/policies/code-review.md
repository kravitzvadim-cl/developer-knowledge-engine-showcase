# Code Review Policy

Policy ID: CR. Owner: Engineering Leadership. Applies to every repository that deploys to production.

## CR-1 When review is required

CR-1.1 Every change to a production branch goes through a pull request. Direct pushes to `main` are blocked by branch protection.

CR-1.2 A pull request needs at least one approval from an engineer other than the author. Changes to authentication, payments, permissions or data deletion need two approvals, one of them from a code owner.

CR-1.3 Emergency fixes may merge with one approval during an incident, and must get a full review within two business days.

## CR-2 Author responsibilities

CR-2.1 Keep pull requests small: aim for under 400 changed lines. Split refactors from behavior changes.

CR-2.2 The description says what changed, why, and how it was tested. Link the ticket.

CR-2.3 All required CI checks must pass before review is requested. A red check is the author's to fix, not the reviewer's to override.

## CR-3 Reviewer responsibilities

CR-3.1 Review within one business day, or hand the review to someone who can.

CR-3.2 Check correctness, security, tests and readability, in that order. Style issues that a linter could catch should be added to the linter, not argued in review.

CR-3.3 Reviewers must check that no secret, credential or personal data is added to the codebase (see SEC-2.1 and DR-2.2).

## CR-4 Merging

CR-4.1 Use squash merges so each change is one commit on `main`.

CR-4.2 Required status checks, including the evaluation gate where a repository has one, cannot be bypassed by admins except during a declared incident.
