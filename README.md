# OSS CRM with Natural Language Reporting

An open-source alternative to Salesforce/HubSpot built on EspoCRM with Gmail sync and AI-powered natural language queries for reporting.

## Features

- **CRM**: Contacts, Leads, Accounts, Opportunities, Activity Timeline (EspoCRM)
- **Gmail Sync**: Inbound/outbound email via IMAP/SMTP with App Passwords
- **Natural Language Reports**: Ask questions in plain English, get SQL results
- **Email Campaigns**: Listmonk for high-volume email blasts (optional)

## Natural Language Query Examples

Instead of building reports manually, just ask:

| Question | What it does |
|----------|--------------|
| "Who did I contact last week?" | Shows emails sent in the last 7 days |
| "When did I last email john@example.com?" | Finds most recent interaction with a contact |
| "Show me contacts I haven't reached in 30 days" | Identifies stale leads |
| "How many emails did I send this month?" | Activity summary |
| "List all contacts from Acme Corp" | Filter by account |

## Architecture

```
┌─────────────────┐     ┌─────────────────┐
│    EspoCRM      │────▶│    MariaDB      │
│  (port 8080)    │     │  (port 3306)    │
└────────┬────────┘     └─────────────────┘
         │
         │ Chat Widget
         ▼
┌─────────────────┐     ┌─────────────────┐
│  Query Service  │────▶│   Claude API    │
│  (port 5050)    │     │  (SQL generation)│
└─────────────────┘     └─────────────────┘
```

## Quick Start

### 1. Setup environment

```bash
cp .env.example .env
# Edit .env with your passwords and Anthropic API key
```

### 2. Start services

```bash
# Start EspoCRM and database
docker compose up -d espo-db espocrm

# Start the natural language query service
cd query-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

### 3. Configure Gmail (App Password method)

1. Enable 2FA on your Google account
2. Generate App Password at https://myaccount.google.com/apppasswords
3. In EspoCRM: Create Personal Email Account with:
   - IMAP: `imap.gmail.com:993` (SSL)
   - SMTP: `smtp.gmail.com:465` (SSL)
   - Password: Your 16-char App Password (no spaces)
4. Add email to your User profile and star it as primary

### 4. Access

- EspoCRM: http://localhost:8080
- Query widget: Blue chat bubble in bottom-right corner

## Project Structure

```
├── docker-compose.yml      # EspoCRM + MariaDB + Listmonk
├── .env.example            # Environment template
├── query-service/
│   ├── app.py              # Flask API for natural language queries
│   ├── schema.sql          # Database schema for Claude context
│   └── static/
│       └── chat-widget.js  # Embedded chat UI
├── espo-customizations/    # Widget injection config
├── config/                 # Listmonk config
└── docs/
    ├── SETUP.md            # Detailed setup guide
    └── ARCHITECTURE.md     # System design
```

## Roadmap

- [ ] Lead scoring from PostHog behavioral data
- [ ] Host on VPS for team access
- [ ] Listmonk webhook integration for email engagement tracking

## License

MIT
