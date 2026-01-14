"""
Natural Language Query Service for EspoCRM
Converts natural language questions to SQL using Claude API
"""

import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
import anthropic
import mysql.connector
from pathlib import Path

app = Flask(__name__, static_folder='static', static_url_path='/static')
CORS(app)  # Allow requests from EspoCRM frontend

# Load schema
SCHEMA_PATH = Path(__file__).parent / "schema.sql"
with open(SCHEMA_PATH) as f:
    SCHEMA = f.read()

# Database config from environment
DB_CONFIG = {
    "host": os.environ.get("DB_HOST", "localhost"),
    "port": int(os.environ.get("DB_PORT", 3306)),
    "user": os.environ.get("DB_USER", "espocrm"),
    "password": os.environ.get("DB_PASSWORD", ""),
    "database": os.environ.get("DB_NAME", "espocrm"),
}

SYSTEM_PROMPT = """You are a SQL query generator for a CRM database (EspoCRM on MariaDB).

Given the schema below and a natural language question, generate a SQL query to answer it.

SCHEMA:
{schema}

RULES:
1. Output ONLY the SQL query, no explanations
2. Always filter out deleted records: WHERE deleted = 0
3. Use backticks for reserved words like `primary`
4. For "last 24 hours" use: date_sent > NOW() - INTERVAL 24 HOUR
5. For "last week" use: date_sent > NOW() - INTERVAL 7 DAY
6. To find emails for a person, join: email -> email_email_address -> email_address
7. To find a contact's email, join: contact -> entity_email_address -> email_address
8. Limit results to 50 unless user asks for more
9. Order by date descending for recency queries
10. Use LIKE '%term%' for partial name matches

EXAMPLES:
Q: Who did I contact in the last 24 hours?
A: SELECT DISTINCT ea.name as email, e.name as subject, e.date_sent
   FROM email e
   JOIN email_email_address eea ON e.id = eea.email_id AND eea.address_type = 'to'
   JOIN email_address ea ON eea.email_address_id = ea.id
   WHERE e.deleted = 0 AND e.status = 'Sent' AND e.date_sent > NOW() - INTERVAL 24 HOUR
   ORDER BY e.date_sent DESC LIMIT 50;

Q: When did I last interact with john@example.com?
A: SELECT e.name as subject, e.date_sent, e.status,
   CASE WHEN eea.address_type = 'from' THEN 'received' ELSE 'sent' END as direction
   FROM email e
   JOIN email_email_address eea ON e.id = eea.email_id
   JOIN email_address ea ON eea.email_address_id = ea.id
   WHERE e.deleted = 0 AND ea.lower LIKE '%john@example.com%'
   ORDER BY e.date_sent DESC LIMIT 10;
"""


def get_db_connection():
    """Create database connection"""
    return mysql.connector.connect(**DB_CONFIG)


def generate_sql(question: str) -> str:
    """Use Claude to generate SQL from natural language"""
    client = anthropic.Anthropic()

    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1024,
        system=SYSTEM_PROMPT.format(schema=SCHEMA),
        messages=[
            {"role": "user", "content": question}
        ]
    )

    sql = message.content[0].text.strip()
    # Remove markdown code blocks if present
    if sql.startswith("```"):
        sql = sql.split("\n", 1)[1] if "\n" in sql else sql[3:]
    if sql.endswith("```"):
        sql = sql.rsplit("```", 1)[0]
    return sql.strip()


def execute_query(sql: str) -> list[dict]:
    """Execute SQL and return results as list of dicts"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute(sql)
        results = cursor.fetchall()
        # Convert datetime objects to strings for JSON serialization
        for row in results:
            for key, value in row.items():
                if hasattr(value, 'isoformat'):
                    row[key] = value.isoformat()
        return results
    finally:
        cursor.close()
        conn.close()


@app.route("/query", methods=["POST"])
def query():
    """
    Handle natural language query
    Request body: {"question": "Who did I contact last week?"}
    Response: {"sql": "SELECT ...", "results": [...], "error": null}
    """
    data = request.get_json()
    question = data.get("question", "")

    if not question:
        return jsonify({"error": "No question provided", "sql": None, "results": None}), 400

    try:
        # Generate SQL
        sql = generate_sql(question)

        # Basic safety check - only allow SELECT
        if not sql.strip().upper().startswith("SELECT"):
            return jsonify({
                "error": "Only SELECT queries are allowed",
                "sql": sql,
                "results": None
            }), 400

        # Execute query
        results = execute_query(sql)

        return jsonify({
            "sql": sql,
            "results": results,
            "error": None
        })

    except anthropic.APIError as e:
        return jsonify({"error": f"Claude API error: {str(e)}", "sql": None, "results": None}), 500
    except mysql.connector.Error as e:
        return jsonify({"error": f"Database error: {str(e)}", "sql": sql if 'sql' in dir() else None, "results": None}), 500
    except Exception as e:
        return jsonify({"error": f"Unexpected error: {str(e)}", "sql": None, "results": None}), 500


@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint"""
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5050, debug=True)
