-- EspoCRM Schema for Natural Language Queries
-- Key tables and relationships

-- account: Companies/organizations
CREATE TABLE account (
  id VARCHAR PRIMARY KEY,
  name VARCHAR,
  deleted TINYINT,
  website VARCHAR,
  type VARCHAR,
  industry VARCHAR,
  description MEDIUMTEXT,
  created_at DATETIME,
  modified_at DATETIME,
  assigned_user_id VARCHAR
);

-- contact: People associated with accounts
CREATE TABLE contact (
  id VARCHAR PRIMARY KEY,
  deleted TINYINT,
  salutation_name VARCHAR,
  first_name VARCHAR,
  last_name VARCHAR,
  description MEDIUMTEXT,
  do_not_call TINYINT,
  address_street VARCHAR,
  address_city VARCHAR,
  address_state VARCHAR,
  address_country VARCHAR,
  created_at DATETIME,
  modified_at DATETIME,
  account_id VARCHAR,  -- links to account.id
  assigned_user_id VARCHAR
);

-- lead: Potential customers not yet converted
CREATE TABLE lead (
  id VARCHAR PRIMARY KEY,
  deleted TINYINT,
  salutation_name VARCHAR,
  first_name VARCHAR,
  last_name VARCHAR,
  title VARCHAR,
  status VARCHAR,  -- e.g., 'New', 'Contacted', 'Qualified', 'Converted'
  source VARCHAR,
  industry VARCHAR,
  opportunity_amount DOUBLE,
  website VARCHAR,
  do_not_call TINYINT,
  description MEDIUMTEXT,
  converted_at DATETIME,
  created_at DATETIME,
  modified_at DATETIME,
  account_name VARCHAR,
  assigned_user_id VARCHAR
);

-- email: Email messages (inbound and outbound)
CREATE TABLE email (
  id VARCHAR PRIMARY KEY,
  name VARCHAR,  -- subject line
  deleted TINYINT,
  from_string VARCHAR,  -- sender display
  is_replied TINYINT,
  body_plain MEDIUMTEXT,
  body MEDIUMTEXT,  -- HTML body
  is_html TINYINT,
  status VARCHAR,  -- 'Sent', 'Archived', 'Draft'
  has_attachment TINYINT,
  date_sent DATETIME,
  created_at DATETIME,
  parent_id VARCHAR,  -- links to related entity (contact, account, lead)
  parent_type VARCHAR,  -- type of parent entity
  assigned_user_id VARCHAR,
  account_id VARCHAR
);

-- email_address: Unique email addresses
CREATE TABLE email_address (
  id VARCHAR PRIMARY KEY,
  name VARCHAR,  -- the actual email address
  deleted TINYINT,
  lower VARCHAR,  -- lowercase version for matching
  invalid TINYINT,
  opt_out TINYINT
);

-- email_email_address: Links emails to email addresses (to, cc, bcc, from)
CREATE TABLE email_email_address (
  id BIGINT PRIMARY KEY,
  email_id VARCHAR,  -- links to email.id
  email_address_id VARCHAR,  -- links to email_address.id
  address_type VARCHAR,  -- 'to', 'cc', 'bcc', 'from'
  deleted TINYINT
);

-- entity_email_address: Links entities (contact, lead, account, user) to their email addresses
CREATE TABLE entity_email_address (
  id BIGINT PRIMARY KEY,
  entity_id VARCHAR,  -- links to contact.id, lead.id, etc.
  email_address_id VARCHAR,  -- links to email_address.id
  entity_type VARCHAR,  -- 'Contact', 'Lead', 'Account', 'User'
  `primary` TINYINT,  -- is this the primary email for the entity?
  deleted TINYINT
);

-- Common query patterns:
-- 1. Find emails for a contact: JOIN email_email_address + email_address + entity_email_address
-- 2. Last interaction: MAX(date_sent) grouped by contact
-- 3. Contacts without recent activity: WHERE date_sent < NOW() - INTERVAL N DAY
