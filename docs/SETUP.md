Setup guide for EspoCRM + Listmonk with Gmail sync.

Prereqs
- Docker + Docker Compose.
- A Google Workspace or Gmail account with API access.
- SMTP account for campaigns (Mailgun/SendGrid/etc. recommended).

Bootstrap
1) Copy `.env.example` to `.env` and set passwords/site URLs.
2) Copy `config/listmonk.config.example.toml` to `config/listmonk.config.toml` and set admin creds + SMTP.
3) Run `docker compose up -d`.
4) EspoCRM: open `http://localhost:8080` and finish the installer (admin user, DB checks). Site URL should match `ESPO_SITE_URL`.
5) Listmonk: wait for the install step to complete, then open `http://localhost:9000` and log in with the admin credentials you set in the config.

Gmail OAuth IMAP/SMTP in EspoCRM
1) In Google Cloud: enable Gmail API; create OAuth 2.0 Client (type “Web application”). Authorized redirect URI: `http://localhost:8080/?entryPoint=OAuth&client=Google`.
2) In EspoCRM (Admin > Authentication > OAuth 2.0): add provider “Google” with Client ID/Secret; set redirect URI to match step 1.
3) In EspoCRM (Email Accounts): create a Personal email account with IMAP host `imap.gmail.com:993`, SMTP host `smtp.gmail.com:587`, auth type OAuth 2.0 using the Google provider. Complete the OAuth consent popup.
4) Enable “Fetch Emails” and “Store Sent Emails” so inbound/outbound mail logs to Activities; set “Assign to Contact” on match.
5) (Optional) Set cron in the host to run Espo background jobs every minute: `* * * * * docker compose exec -T espocrm bash -c "php cron.php"`.

“No contact in N days” report
1) In EspoCRM: Reports > Add > Contacts.
2) Filters: Last Activity Date “is before” `N days ago` AND Status not equal “Inactive” (adjust to your fields).
3) Display columns: Name, Email, Last Activity Date, Owner.
4) Save as “No Contact in 7 Days” (and another for 14 days). Schedule the report or add a dashlet.

Scoring rules (lightweight)
1) Add a Number field “Engagement Score” on Contact (Admin > Entity Manager > Contact > Fields).
2) Add a Workflow or BPM that runs daily:
   - Base score 0.
   - +10 if last inbound email within 7 days, +5 within 14 days.
   - +8 for reply detected (Activity Type = Email, Direction = Inbound, status “Replied”).
   - +3 for open, +5 for click (requires engagement events from Listmonk webhooks).
   - -5 if no activity in 30 days.
3) Update the Contact’s Engagement Score field with the total and write a note into the timeline for audit.

Listmonk configuration
1) Ensure `config/listmonk.config.toml` uses your SMTP. Restart Listmonk if edited.
2) Create lists and templates. Avoid Gmail SMTP for blasts; use a real ESP for deliverability.
3) Import contacts: export from EspoCRM (Reports or global export) and import CSV into Listmonk. Map contact ID/email for later event mapping.

Engagement webhooks into EspoCRM (optional but recommended)
- Goal: log opens/clicks/unsubs back to the Contact’s activities and feed scoring.
- Approach: create a small webhook receiver (FastAPI/Express) that accepts Listmonk webhooks and calls EspoCRM REST API to append an Activity. Wire it to `webhooks:` in Listmonk Settings.
- If you prefer no extra service, manually import engagement CSVs into EspoCRM periodically and run a Workflow to bump scores.

Backups
- EspoCRM data volume `espo-data` and MariaDB `espo-db-data` hold CRM state.
- Listmonk uses Postgres volume `listmonk-db-data`.
- Set recurring dumps for MariaDB and Postgres, and back up Espo attachments in `espo-data`.
