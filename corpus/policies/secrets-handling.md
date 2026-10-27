# Secrets Handling Policy

Policy ID: SEC. Owner: Platform Security. Applies to every engineer, contractor and automated system at Northwind.

## SEC-1 What counts as a secret

SEC-1.1 A secret is any value that grants access or proves identity: API keys, database passwords, OAuth client secrets, private keys, signing keys, session tokens and webhook signing secrets.

SEC-1.2 Connection strings that embed a password are secrets. A connection string without credentials is not.

## SEC-2 Storage

SEC-2.1 Secrets must be stored in the approved secret manager. They must never be committed to a Git repository, including private repositories and including branches that will be deleted.

SEC-2.2 Local development secrets live in a `.env` file that is listed in `.gitignore`. Commit a `.env.example` with placeholder values instead.

SEC-2.3 Secrets must not be placed in client-side code, mobile app bundles or any file served to a browser. Anything shipped to a browser is public.

SEC-2.4 Secrets must not be written to logs, error messages, analytics events or issue trackers. Log a key's last four characters at most.

## SEC-3 Access and rotation

SEC-3.1 Production secrets are readable only by the services that need them and by the on-call role. Engineers do not get standing read access to production secrets.

SEC-3.2 Every production secret is rotated at least every 90 days, and immediately when someone with access leaves the team.

SEC-3.3 Prefer short-lived credentials (OIDC federation in CI, IAM roles at runtime) over long-lived static keys.

## SEC-4 Leaks

SEC-4.1 A leaked secret is an incident. Revoke and rotate it first, then investigate. Deleting the commit is not enough: assume anything pushed to a remote was copied.

SEC-4.2 Report the leak in the #security-incidents channel within one hour of discovery.

SEC-4.3 Secret scanning runs on every pull request. A pull request that trips the scanner cannot merge until the finding is resolved or marked a false positive by Platform Security.
