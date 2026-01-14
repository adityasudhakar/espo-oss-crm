Architecture overview for replacing HubSpot with EspoCRM + Listmonk.

Components
- EspoCRM: Core CRM (contacts, accounts, activities, reports, workflows, scoring field). Handles Gmail sync via OAuth IMAP/SMTP and hosts saved searches for “no contact in N days”.
- MariaDB: EspoCRM database.
- Listmonk: Campaign/blast sender with engagement tracking (opens/clicks/unsubs), backed by Postgres.
- Postgres: Listmonk database.
- Optional event bridge (future): Small service to receive Listmonk webhooks and post engagement events into EspoCRM activities for scoring.

Data flows
- Gmail ↔ EspoCRM: OAuth IMAP pulls received mail; SMTP with OAuth sends mail and logs to timelines. Messages map to contacts by email address; threads appear in Activities.
- Segments/exports: Saved filters in EspoCRM produce CSVs or lists to feed Listmonk audiences. Alternatively, use EspoCRM API to sync segments automatically.
- Campaigns: Listmonk sends; engagement events can be webhooks into EspoCRM (to mark opens/clicks/unsubs and bump scores).
- Stale-contact queries: EspoCRM reports filter contacts with no activities in N days; scheduled reports/notifications can remind outreach.
- Scoring: Rule-based score stored on Contact (and optionally Account). A workflow or scheduled job recalculates using recency/replies/opens/clicks/title/industry/source.

Ports (default)
- EspoCRM: 8080
- Listmonk: 9000

Persistence
- EspoCRM data at volume `espo-data`; MariaDB at `espo-db-data`.
- Listmonk config volume mount; Postgres at `listmonk-db-data`.
