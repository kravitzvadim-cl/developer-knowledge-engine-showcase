# Data Retention Policy

Policy ID: DR. Owner: Privacy & Legal. Applies to all systems that store customer or employee data.

## DR-1 Data classes

DR-1.1 Personal data is any information about an identifiable person: name, email, IP address, device id, location and free-text that may contain any of these.

DR-1.2 Sensitive personal data (health, financial account numbers, government ids, precise location) has stricter rules in DR-3.

## DR-2 Retention periods

DR-2.1 Application logs that may contain personal data are kept for at most 30 days, then deleted automatically.

DR-2.2 Personal data must not be used in test fixtures, seed data or bug reproductions. Use synthetic data.

DR-2.3 Customer account data is kept while the account is active and deleted within 30 days of an account deletion request.

DR-2.4 Backups follow the same rules: a backup older than 35 days is deleted, so deleted data does not survive in backups past that window.

DR-2.5 Analytics events are pseudonymized at collection and kept for 13 months.

## DR-3 Sensitive personal data

DR-3.1 Sensitive personal data is encrypted at rest with a key separate from the general data key.

DR-3.2 Sensitive personal data must never be sent to a third-party AI or analytics service without a signed data processing agreement and Privacy approval.

## DR-4 Deletion requests

DR-4.1 A deletion request is acknowledged within 3 days and completed within 30 days.

DR-4.2 Deletion covers the primary database, search indexes, caches and data warehouse copies. Logs and backups expire under DR-2.1 and DR-2.4.
