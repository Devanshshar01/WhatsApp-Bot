import React, { useState } from 'react';
import { sendMessage } from '../api/adminClient.js';

function MessagesPage() {
  const [target, setTarget] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback(null);

    if (!target || !message) {
      setFeedback({ type: 'error', text: 'Target number and message are required.' });
      return;
    }

    try {
      setSending(true);
      await sendMessage(target, message);
      setFeedback({ type: 'success', text: 'Message sent successfully!' });
      setMessage('');
    } catch (err) {
      setFeedback({ type: 'error', text: err?.response?.data?.error || err.message || 'Failed to send message.' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="messages-page">
      <div className="flex-between">
        <h3 className="section-title">Send a Message</h3>
      </div>

      <div className="card" style={{ maxWidth: '640px' }}>
        <form onSubmit={handleSubmit} className="login-form" style={{ gap: '16px' }}>
          <div>
            <label htmlFor="target">Recipient number</label>
            <input
              id="target"
              type="text"
              placeholder="E.g. 1234567890 or 1234567890@c.us"
              value={target}
              onChange={(event) => setTarget(event.target.value)}
              disabled={sending}
            />
          </div>

          <div>
            <label htmlFor="message">Message</label>
            <textarea
              id="message"
              placeholder="Enter the message you want to send"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              disabled={sending}
              rows={5}
            />
          </div>

          {feedback ? (
            <div
              className="error-banner"
              style={{
                background: feedback.type === 'success' ? 'rgba(34,197,94,0.18)' : 'rgba(248, 113, 113, 0.16)',
                borderColor: feedback.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.35)',
                color: feedback.type === 'success' ? '#bbf7d0' : '#fecaca',
              }}
            >
              {feedback.text}
            </div>
          ) : null}

          <div className="form-actions">
            <button type="submit" className="primary" disabled={sending}>
              {sending ? 'Sending…' : 'Send message'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MessagesPage;
