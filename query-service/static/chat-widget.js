/**
 * CRM Query Chat Widget
 * Embeddable chat interface for natural language database queries
 */

(function() {
  const QUERY_SERVICE_URL = window.CRM_QUERY_SERVICE_URL || 'http://localhost:5050';

  // Styles
  const styles = `
    #crm-query-widget {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    #crm-query-toggle {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: #2196F3;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s, background 0.2s;
    }

    #crm-query-toggle:hover {
      transform: scale(1.05);
      background: #1976D2;
    }

    #crm-query-toggle svg {
      width: 24px;
      height: 24px;
      fill: white;
    }

    #crm-query-panel {
      display: none;
      position: absolute;
      bottom: 70px;
      right: 0;
      width: 400px;
      max-height: 500px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.15);
      overflow: hidden;
      flex-direction: column;
    }

    #crm-query-panel.open {
      display: flex;
    }

    #crm-query-header {
      padding: 16px;
      background: #2196F3;
      color: white;
      font-weight: 600;
      font-size: 14px;
    }

    #crm-query-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      max-height: 320px;
      min-height: 200px;
    }

    .crm-query-message {
      margin-bottom: 12px;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 13px;
      line-height: 1.4;
    }

    .crm-query-message.user {
      background: #E3F2FD;
      margin-left: 40px;
    }

    .crm-query-message.assistant {
      background: #F5F5F5;
      margin-right: 40px;
    }

    .crm-query-message.error {
      background: #FFEBEE;
      color: #C62828;
    }

    .crm-query-results {
      margin-top: 8px;
      font-size: 12px;
      overflow-x: auto;
    }

    .crm-query-results table {
      width: 100%;
      border-collapse: collapse;
    }

    .crm-query-results th,
    .crm-query-results td {
      padding: 6px 8px;
      border: 1px solid #E0E0E0;
      text-align: left;
    }

    .crm-query-results th {
      background: #FAFAFA;
      font-weight: 600;
    }

    .crm-query-sql {
      margin-top: 8px;
      padding: 8px;
      background: #263238;
      color: #80CBC4;
      border-radius: 4px;
      font-family: monospace;
      font-size: 11px;
      overflow-x: auto;
      white-space: pre-wrap;
    }

    #crm-query-input-area {
      padding: 12px;
      border-top: 1px solid #E0E0E0;
      display: flex;
      gap: 8px;
    }

    #crm-query-input {
      flex: 1;
      padding: 10px 12px;
      border: 1px solid #E0E0E0;
      border-radius: 8px;
      font-size: 13px;
      outline: none;
      transition: border-color 0.2s;
    }

    #crm-query-input:focus {
      border-color: #2196F3;
    }

    #crm-query-submit {
      padding: 10px 16px;
      background: #2196F3;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      transition: background 0.2s;
    }

    #crm-query-submit:hover {
      background: #1976D2;
    }

    #crm-query-submit:disabled {
      background: #BDBDBD;
      cursor: not-allowed;
    }

    .crm-query-loading {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid #E0E0E0;
      border-top-color: #2196F3;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;

  // Create widget HTML
  function createWidget() {
    // Add styles
    const styleEl = document.createElement('style');
    styleEl.textContent = styles;
    document.head.appendChild(styleEl);

    // Create widget container
    const widget = document.createElement('div');
    widget.id = 'crm-query-widget';
    widget.innerHTML = `
      <div id="crm-query-panel">
        <div id="crm-query-header">CRM Query Assistant</div>
        <div id="crm-query-messages">
          <div class="crm-query-message assistant">
            Ask me anything about your CRM data. For example:
            <br><br>
            • "Who did I contact last week?"<br>
            • "When did I last email john@example.com?"<br>
            • "Show me contacts I haven't reached in 30 days"
          </div>
        </div>
        <div id="crm-query-input-area">
          <input type="text" id="crm-query-input" placeholder="Ask a question..." />
          <button id="crm-query-submit">Send</button>
        </div>
      </div>
      <button id="crm-query-toggle" title="CRM Query Assistant">
        <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/><path d="M7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/></svg>
      </button>
    `;
    document.body.appendChild(widget);

    // Event listeners
    const toggle = document.getElementById('crm-query-toggle');
    const panel = document.getElementById('crm-query-panel');
    const input = document.getElementById('crm-query-input');
    const submit = document.getElementById('crm-query-submit');
    const messages = document.getElementById('crm-query-messages');

    toggle.addEventListener('click', () => {
      panel.classList.toggle('open');
      if (panel.classList.contains('open')) {
        input.focus();
      }
    });

    submit.addEventListener('click', sendQuery);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendQuery();
    });

    async function sendQuery() {
      const question = input.value.trim();
      if (!question) return;

      // Add user message
      addMessage(question, 'user');
      input.value = '';
      submit.disabled = true;

      // Add loading indicator
      const loadingId = addMessage('<span class="crm-query-loading"></span> Thinking...', 'assistant');

      try {
        const response = await fetch(`${QUERY_SERVICE_URL}/query`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question })
        });

        const data = await response.json();

        // Remove loading message
        document.getElementById(loadingId)?.remove();

        if (data.error) {
          addMessage(`Error: ${data.error}`, 'error');
          if (data.sql) {
            addMessage(`<div class="crm-query-sql">${escapeHtml(data.sql)}</div>`, 'assistant');
          }
        } else {
          let content = formatResults(data.results);
          content += `<div class="crm-query-sql">${escapeHtml(data.sql)}</div>`;
          addMessage(content, 'assistant');
        }
      } catch (err) {
        document.getElementById(loadingId)?.remove();
        addMessage(`Connection error: ${err.message}`, 'error');
      }

      submit.disabled = false;
      messages.scrollTop = messages.scrollHeight;
    }

    function addMessage(content, type) {
      const id = 'msg-' + Date.now();
      const div = document.createElement('div');
      div.id = id;
      div.className = `crm-query-message ${type}`;
      div.innerHTML = content;
      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;
      return id;
    }

    function formatResults(results) {
      if (!results || results.length === 0) {
        return '<em>No results found.</em>';
      }

      const keys = Object.keys(results[0]);
      let html = `<div class="crm-query-results"><strong>${results.length} result(s):</strong><table><thead><tr>`;
      keys.forEach(k => html += `<th>${escapeHtml(k)}</th>`);
      html += '</tr></thead><tbody>';

      results.slice(0, 20).forEach(row => {
        html += '<tr>';
        keys.forEach(k => html += `<td>${escapeHtml(String(row[k] ?? ''))}</td>`);
        html += '</tr>';
      });

      html += '</tbody></table>';
      if (results.length > 20) {
        html += `<em>...and ${results.length - 20} more</em>`;
      }
      html += '</div>';
      return html;
    }

    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createWidget);
  } else {
    createWidget();
  }
})();
