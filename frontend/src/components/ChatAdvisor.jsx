import { useState, useEffect, useRef } from 'react'

const API = ''

const SUGGESTIONS = [
  'How can I improve my resume for senior roles?',
  'What salary should I negotiate for?',
  'How do I prepare for a technical interview?',
  'What skills should I learn to advance my career?',
]

const QUICK_QA = [
  { label: '🎓 What is your CGPA?',             q: 'What is your CGPA?' },
  { label: '👤 Tell me about yourself',          q: 'Tell me about yourself' },
  { label: '⚡ What are your top skills?',       q: 'What are your top skills?' },
  { label: '💼 What internships have you done?', q: 'What internships have you done?' },
  { label: '🌍 Are you open to relocation?',     q: 'Are you open to relocation?' },
  { label: '⏰ What is your notice period?',     q: 'What is your notice period?' },
]

function TypingDots() {
  return (
    <div className="typing-dots">
      <span /><span /><span />
    </div>
  )
}

function Message({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`msg-row ${isUser ? 'msg-user' : 'msg-ai'}`}>
      <div className="msg-avatar">{isUser ? '👤' : '◈'}</div>
      <div className={`msg-bubble ${isUser ? 'bubble-user' : 'bubble-ai'}`}>
        {msg.content.split('\n').map((line, i, arr) => (
          <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
        ))}
      </div>
    </div>
  )
}

export default function ChatAdvisor({ sessionId, resumeAnalysis }) {
  const [messages, setMessages] = useState([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const bottomRef = useRef()
  const inputRef  = useRef()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async (text) => {
    const content = (text || input).trim()
    if (!content) return
    setInput('')
    setError('')

    const newMsg  = { role: 'user', content }
    const history = [...messages, newMsg]
    setMessages(history)
    setLoading(true)

    try {
      const res = await fetch(`${API}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId || '',
          message: content,
          history: messages.map(m => ({ role: m.role, content: m.content })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Chat error')
      setMessages([...history, { role: 'assistant', content: data.response }])
    } catch (err) {
      setError(err.message)
      setMessages(history)
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  return (
    <div>
      <div className="card chat-card">
        <div className="card-title">
          <span>✨</span>
          <span>RecruitIQ Advisor</span>
          {resumeAnalysis && (
            <span className="chat-context-badge">
              📋 {resumeAnalysis.name || 'Resume'} loaded
            </span>
          )}
        </div>

        <div className="chat-window">
          {messages.length === 0 && !loading && (
            <div className="chat-welcome">
              <div className="welcome-icon">◈</div>
              <h3 className="welcome-title">
                {sessionId
                  ? `Ready to help${resumeAnalysis?.name ? `, ${resumeAnalysis.name}` : ''}!`
                  : 'RecruitIQ Advisor is Ready'}
              </h3>
              <p className="welcome-desc">
                {sessionId
                  ? "I've analyzed your resume. Ask me anything — career advice, interview prep, salary tips, or let me answer as you."
                  : 'Upload your resume first for personalized advice, or ask general career questions below.'}
              </p>
              <div className="suggestions">
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} className="suggestion-btn" onClick={() => sendMessage(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => <Message key={i} msg={msg} />)}

          {loading && (
            <div className="msg-row msg-ai">
              <div className="msg-avatar">◈</div>
              <div className="msg-bubble bubble-ai bubble-typing"><TypingDots /></div>
            </div>
          )}

          {error && <div className="chat-error">{error}</div>}
          <div ref={bottomRef} />
        </div>

        {/* Quick Q&A chips */}
        <div className="quick-qa-section">
          <div className="quick-qa-label">🎤 Quick Q&amp;A — answer as candidate</div>
          <div className="quick-qa-chips">
            {QUICK_QA.map((item, i) => (
              <button
                key={i}
                className="qa-chip"
                onClick={() => sendMessage(item.q)}
                disabled={loading}
                style={{ '--chip-delay': `${i * 0.05}s` }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="chat-input-row">
          <textarea
            ref={inputRef}
            className="chat-input"
            rows={1}
            placeholder="Ask about your career, resume, interviews, salary…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
          />
          <button
            className="chat-send-btn"
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            title="Send (Enter)"
          >
            {loading
              ? <span className="spinner" style={{ width: 16, height: 16 }} />
              : <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 13V3M8 3L3 8M8 3L13 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          </button>
        </div>
        <div className="chat-hint">Enter to send · Shift+Enter for new line</div>
      </div>

      <style>{`
        .chat-card { padding: 1.6rem; }

        .chat-context-badge {
          margin-left: auto;
          font-size: 0.75rem;
          font-weight: 400;
          color: #94a3b8;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          padding: 0.2rem 0.65rem;
          border-radius: 50px;
        }

        .chat-window {
          min-height: 340px;
          max-height: 480px;
          overflow-y: auto;
          margin-bottom: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
          padding-right: 4px;
        }

        .chat-welcome {
          text-align: center;
          padding: 2rem 1rem;
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .welcome-icon {
          font-size: 2.8rem;
          margin-bottom: 0.75rem;
          background: linear-gradient(135deg, #7c3aed, #3b82f6, #06b6d4);
          background-size: 200%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradShift 4s linear infinite, logoPulse 3s ease-in-out infinite;
        }
        @keyframes gradShift {
          0%  { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100%{ background-position: 0% 50%; }
        }
        @keyframes logoPulse {
          0%,100% { filter: drop-shadow(0 0 8px rgba(124,58,237,0.7)); }
          50%     { filter: drop-shadow(0 0 18px rgba(124,58,237,1)) drop-shadow(0 0 40px rgba(6,182,212,0.4)); }
        }
        .welcome-title {
          font-family: 'Space Grotesk','Inter',sans-serif;
          font-size: 1.1rem;
          font-weight: 700;
          color: #f1f5f9;
          margin-bottom: 0.4rem;
        }
        .welcome-desc {
          font-size: 0.88rem;
          color: #94a3b8;
          max-width: 420px;
          line-height: 1.65;
          margin-bottom: 1.5rem;
        }
        .suggestions {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
          width: 100%;
          max-width: 500px;
        }
        .suggestion-btn {
          background: rgba(124,58,237,0.07);
          border: 1px solid rgba(124,58,237,0.18);
          border-radius: 11px;
          padding: 0.6rem 1rem;
          color: #a78bfa;
          font-size: 0.85rem;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s ease;
          font-family: inherit;
        }
        .suggestion-btn:hover {
          background: linear-gradient(135deg, rgba(124,58,237,0.15), rgba(59,130,246,0.1));
          border-color: rgba(124,58,237,0.4);
          color: #c4b5fd;
          transform: translateX(4px);
          box-shadow: 0 0 15px rgba(124,58,237,0.1);
        }

        .msg-row { display: flex; align-items: flex-start; gap: 0.65rem; }
        .msg-user { flex-direction: row-reverse; }
        .msg-avatar {
          width: 34px; height: 34px;
          border-radius: 11px;
          display: flex; align-items: center; justify-content: center;
          font-size: 1rem;
          flex-shrink: 0;
        }
        .msg-ai .msg-avatar {
          background: linear-gradient(135deg, #7c3aed, #3b82f6);
          box-shadow: 0 0 14px rgba(124,58,237,0.45), 0 0 30px rgba(124,58,237,0.15);
          font-size: 0.85rem;
          color: white;
        }
        .msg-user .msg-avatar {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
        }
        .msg-bubble {
          max-width: 72%;
          padding: 0.8rem 1.05rem;
          border-radius: 15px;
          font-size: 0.9rem;
          line-height: 1.65;
        }
        .bubble-ai {
          background: linear-gradient(rgba(14,10,30,0.8), rgba(14,10,30,0.8)) padding-box,
                      linear-gradient(135deg, rgba(124,58,237,0.25), rgba(59,130,246,0.15)) border-box;
          border: 1px solid transparent;
          color: #e2e8f0;
          border-top-left-radius: 4px;
        }
        .bubble-user {
          background: linear-gradient(135deg, rgba(124,58,237,0.22), rgba(59,130,246,0.18));
          border: 1px solid rgba(124,58,237,0.3);
          color: #f1f5f9;
          border-top-right-radius: 4px;
        }
        .bubble-typing { padding: 0.9rem 1.05rem; }

        .typing-dots { display: flex; gap: 5px; align-items: center; }
        .typing-dots span {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: linear-gradient(135deg, #7c3aed, #06b6d4);
          animation: bounceDot 1.2s ease-in-out infinite;
        }
        .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
        .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes bounceDot {
          0%,80%,100% { transform: scale(0.65); opacity: 0.4; }
          40%          { transform: scale(1.1);  opacity: 1; }
        }

        .chat-error {
          padding: 0.65rem 1rem;
          background: rgba(244,63,94,0.1);
          border: 1px solid rgba(244,63,94,0.25);
          border-radius: 10px;
          color: #fda4af;
          font-size: 0.85rem;
        }

        /* Quick Q&A */
        .quick-qa-section {
          margin-bottom: 0.9rem;
          padding: 0.8rem;
          background: rgba(0,0,0,0.2);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 14px;
        }
        .quick-qa-label {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #334155;
          margin-bottom: 0.55rem;
        }
        .quick-qa-chips { display: flex; flex-wrap: wrap; gap: 0.4rem; }
        .qa-chip {
          padding: 0.35rem 0.82rem;
          border-radius: 50px;
          border: 1px solid rgba(124,58,237,0.22);
          background: rgba(124,58,237,0.07);
          color: #a78bfa;
          font-size: 0.79rem;
          font-weight: 500;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.22s ease;
          animation: chipIn 0.3s ease both;
          animation-delay: var(--chip-delay, 0s);
          white-space: nowrap;
        }
        .qa-chip:hover:not(:disabled) {
          background: linear-gradient(135deg, rgba(124,58,237,0.25), rgba(6,182,212,0.15));
          border-color: rgba(99,102,241,0.55);
          color: #e0e7ff;
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(124,58,237,0.2), 0 0 25px rgba(6,182,212,0.1);
        }
        .qa-chip:active:not(:disabled) { transform: translateY(0); }
        .qa-chip:disabled { opacity: 0.3; cursor: not-allowed; }
        @keyframes chipIn {
          from { opacity: 0; transform: translateY(5px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Input */
        .chat-input-row { display: flex; gap: 0.6rem; align-items: flex-end; }
        .chat-input {
          flex: 1;
          background: rgba(0,0,0,0.35);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 13px;
          padding: 0.78rem 1.05rem;
          color: #f1f5f9;
          font-family: inherit;
          font-size: 0.9rem;
          line-height: 1.5;
          resize: none;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          max-height: 120px;
          overflow-y: auto;
        }
        .chat-input:focus {
          border-color: rgba(124,58,237,0.5);
          box-shadow: 0 0 0 3px rgba(124,58,237,0.1), 0 0 20px rgba(124,58,237,0.07);
        }
        .chat-input::placeholder { color: #334155; }

        .chat-send-btn {
          width: 44px; height: 44px;
          border-radius: 13px;
          border: none;
          background: linear-gradient(135deg, #7c3aed, #3b82f6);
          color: white;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          transition: all 0.22s ease;
          box-shadow: 0 4px 16px rgba(124,58,237,0.4);
        }
        .chat-send-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 24px rgba(124,58,237,0.55), 0 0 40px rgba(59,130,246,0.2);
        }
        .chat-send-btn:disabled { opacity: 0.35; cursor: not-allowed; transform: none; }

        .chat-hint {
          font-size: 0.72rem;
          color: #1e293b;
          margin-top: 0.4rem;
          text-align: right;
        }
      `}</style>
    </div>
  )
}
