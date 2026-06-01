import { useState } from 'react'
import ResumeUpload from './components/ResumeUpload'
import JobMatcher from './components/JobMatcher'
import ChatAdvisor from './components/ChatAdvisor'
import './App.css'

const TABS = [
  { id: 'resume', label: 'Resume',     icon: '📄' },
  { id: 'match',  label: 'Job Match',  icon: '🎯' },
  { id: 'chat',   label: 'AI Advisor', icon: '✨' },
]

export default function App() {
  const [active, setActive] = useState('resume')
  const [sessionId, setSessionId] = useState(null)
  const [resumeAnalysis, setResumeAnalysis] = useState(null)

  const handleUploaded = ({ session_id, analysis }) => {
    setSessionId(session_id)
    setResumeAnalysis(analysis)
  }

  return (
    <div className="app">
      {/* Animated background */}
      <div className="mesh-bg" />
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div className="orb orb-4" />
      <div className="orb orb-5" />

      <header className="header">
        <div className="logo">
          <span className="logo-icon">◈</span>
          <span className="logo-name">
            <span className="logo-recruit">Recruit</span><span className="logo-iq">IQ</span>
          </span>
        </div>
        <p className="tagline">AI-Powered Career Intelligence Platform</p>

        {sessionId && (
          <div className="session-badge">
            <span className="pulse-dot" />
            {resumeAnalysis?.name ? `${resumeAnalysis.name} · ` : ''}Resume loaded &amp; ready
          </div>
        )}

        <div className="header-stats">
          <span className="stat-pill">📄 Resume Analysis</span>
          <span className="stat-pill">🎯 Job Matching</span>
          <span className="stat-pill">✨ AI Advisor</span>
          <span className="stat-pill">🔐 Secure &amp; Private</span>
        </div>
      </header>

      <nav className="tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`tab ${active === t.id ? 'tab-active' : ''}`}
            onClick={() => setActive(t.id)}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
            {t.id !== 'resume' && !sessionId && (
              <span className="tab-lock" title="Upload resume first">🔒</span>
            )}
          </button>
        ))}
      </nav>

      <main className="main">
        <div className={`panel ${active === 'resume' ? 'panel-active' : ''}`}>
          <ResumeUpload onUploaded={handleUploaded} hasSession={!!sessionId} />
        </div>
        <div className={`panel ${active === 'match' ? 'panel-active' : ''}`}>
          <JobMatcher sessionId={sessionId} />
        </div>
        <div className={`panel ${active === 'chat' ? 'panel-active' : ''}`}>
          <ChatAdvisor sessionId={sessionId} resumeAnalysis={resumeAnalysis} />
        </div>
      </main>

      <footer className="footer">
        <span>RecruitIQ © 2025</span>
        <span className="footer-sep">·</span>
        <span>Powered by OpenRouter AI</span>
        <span className="footer-sep">·</span>
        <span>Data processed securely in-session</span>
      </footer>
    </div>
  )
}
