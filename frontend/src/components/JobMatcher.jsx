import { useState, useEffect } from 'react'

const API = ''

function ScoreRing({ score }) {
  const [shown, setShown] = useState(0)
  const r     = 56
  const circ  = 2 * Math.PI * r
  const offset = circ - (shown / 100) * circ

  useEffect(() => {
    const t = setTimeout(() => setShown(score), 200)
    return () => clearTimeout(t)
  }, [score])

  const color =
    shown >= 80 ? '#10b981' :
    shown >= 60 ? '#3b82f6' :
    shown >= 40 ? '#f59e0b' : '#f43f5e'

  const glow = shown >= 80
    ? '0 0 20px rgba(16,185,129,0.7), 0 0 50px rgba(16,185,129,0.3)'
    : shown >= 60
    ? '0 0 20px rgba(59,130,246,0.7), 0 0 50px rgba(59,130,246,0.3)'
    : shown >= 40
    ? '0 0 20px rgba(245,158,11,0.7), 0 0 50px rgba(245,158,11,0.3)'
    : '0 0 20px rgba(244,63,94,0.7), 0 0 50px rgba(244,63,94,0.3)'

  return (
    <div className="score-ring-wrap" style={{ filter: `drop-shadow(0 0 16px ${color}66)` }}>
      <svg width="152" height="152" viewBox="0 0 152 152">
        {/* Track */}
        <circle cx="76" cy="76" r={r} fill="none"
          stroke="rgba(255,255,255,0.05)" strokeWidth="11"/>
        {/* Glow halo */}
        <circle cx="76" cy="76" r={r} fill="none"
          stroke={color} strokeWidth="3" opacity="0.15"
          strokeDasharray={circ} strokeDashoffset={offset}
          transform="rotate(-90 76 76)"/>
        {/* Main arc */}
        <circle
          cx="76" cy="76" r={r}
          fill="none"
          stroke={color}
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform="rotate(-90 76 76)"
          style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.16,1,0.3,1), stroke 0.5s ease' }}
        />
        <text x="76" y="70" textAnchor="middle" fill="white"
          fontSize="30" fontWeight="800" fontFamily="'Space Grotesk','Inter',sans-serif">{shown}</text>
        <text x="76" y="88" textAnchor="middle"
          fill="rgba(255,255,255,0.4)" fontSize="10" fontWeight="500">out of 100</text>
      </svg>
    </div>
  )
}

function RatingBadge({ rating }) {
  const map = {
    'Excellent Match': { cls: 'rb-excellent', icon: '🏆' },
    'Good Match':      { cls: 'rb-good',      icon: '✅' },
    'Fair Match':      { cls: 'rb-fair',       icon: '⚠️' },
    'Poor Match':      { cls: 'rb-poor',       icon: '❌' },
  }
  const { cls = 'rb-fair', icon = '📊' } = map[rating] || {}
  return <span className={`rating-badge ${cls}`}>{icon} {rating}</span>
}

export default function JobMatcher({ sessionId }) {
  const [jd, setJd]         = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const [result, setResult] = useState(null)

  if (!sessionId) {
    return (
      <div className="card">
        <div className="empty-state">
          <div className="empty-icon">🎯</div>
          <div className="empty-title">Upload Your Resume First</div>
          <div className="empty-desc">
            Head to the Resume tab, upload your PDF, then come back here to match it against any job description.
          </div>
        </div>
      </div>
    )
  }

  const handleMatch = async () => {
    if (!jd.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch(`${API}/api/match-job`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, job_description: jd }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Match failed')
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="card">
        <div className="card-title"><span>🎯</span><span>Job Description Matcher</span></div>
        <p style={{ color: 'var(--t2)', fontSize: '0.88rem', marginBottom: '1.1rem', lineHeight: 1.6 }}>
          Paste any job description — RecruitIQ will score your fit, surface gaps, and give you ATS tips.
        </p>
        <textarea
          className="textarea"
          rows={8}
          placeholder={"Paste the full job description here…\n\nExample: We're looking for a Senior Software Engineer with 5+ years experience in Python, React, and AWS. The role involves leading a team of 4 engineers…"}
          value={jd}
          onChange={e => setJd(e.target.value)}
        />
        {error && <div className="alert-error">{error}</div>}
        <div style={{ marginTop: '1.1rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button className="btn btn-primary" onClick={handleMatch} disabled={!jd.trim() || loading}>
            {loading ? <><span className="spinner" /> Analyzing match…</> : '◈ Analyze Match'}
          </button>
          {result && !loading && (
            <button className="btn btn-secondary" onClick={() => { setResult(null); setJd('') }}>Clear</button>
          )}
        </div>
      </div>

      {result && (
        <>
          {/* Score card */}
          <div className="card" style={{ marginTop: '1.25rem' }}>
            <div className="score-section">
              <ScoreRing score={result.score ?? 0} />
              <div className="score-info">
                <RatingBadge rating={result.rating} />
                <p style={{ color: 'var(--t2)', fontSize: '0.9rem', lineHeight: 1.65, marginTop: '0.85rem' }}>
                  {result.recommendation}
                </p>
              </div>
            </div>
          </div>

          {/* Skills diff */}
          <div className="card grid-2" style={{ marginTop: '1.25rem' }}>
            <div>
              <div className="section-label">✅ Matched Skills</div>
              <div className="tags">
                {result.matched_skills?.length > 0
                  ? result.matched_skills.map((s, i) => <span key={i} className="tag tag-emerald">{s}</span>)
                  : <span style={{ color: 'var(--t3)', fontSize: '0.85rem' }}>None identified</span>}
              </div>
            </div>
            <div>
              <div className="section-label">❌ Missing Skills</div>
              <div className="tags">
                {result.missing_skills?.length > 0
                  ? result.missing_skills.map((s, i) => <span key={i} className="tag tag-rose">{s}</span>)
                  : <span style={{ color: 'var(--t3)', fontSize: '0.85rem' }}>None identified</span>}
              </div>
            </div>
          </div>

          {/* Insights */}
          {result.key_insights?.length > 0 && (
            <div className="card" style={{ marginTop: '1.25rem' }}>
              <div className="card-title"><span>💡</span>Key Insights</div>
              <div className="insights-list">
                {result.key_insights.map((ins, i) => (
                  <div key={i} className="insight-item">
                    <span className="insight-num">{i + 1}</span>
                    <span>{ins}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ATS tips */}
          {result.ats_tips?.length > 0 && (
            <div className="card" style={{ marginTop: '1.25rem' }}>
              <div className="card-title"><span>🤖</span>ATS Optimization Tips</div>
              <ul className="ats-list">
                {result.ats_tips.map((tip, i) => <li key={i}>{tip}</li>)}
              </ul>
            </div>
          )}
        </>
      )}

      <style>{`
        .score-section {
          display: flex;
          align-items: center;
          gap: 2.25rem;
        }
        @media (max-width: 520px) {
          .score-section { flex-direction: column; text-align: center; }
        }
        .score-ring-wrap { flex-shrink: 0; }
        .score-info { flex: 1; }

        .rating-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.38rem 1rem;
          border-radius: 50px;
          font-size: 0.86rem;
          font-weight: 600;
        }
        .rb-excellent {
          background: rgba(16,185,129,0.12);
          border: 1px solid rgba(16,185,129,0.35);
          color: #6ee7b7;
          box-shadow: 0 0 14px rgba(16,185,129,0.12);
        }
        .rb-good {
          background: rgba(59,130,246,0.12);
          border: 1px solid rgba(59,130,246,0.35);
          color: #93c5fd;
          box-shadow: 0 0 14px rgba(59,130,246,0.12);
        }
        .rb-fair {
          background: rgba(245,158,11,0.12);
          border: 1px solid rgba(245,158,11,0.35);
          color: #fcd34d;
        }
        .rb-poor {
          background: rgba(244,63,94,0.12);
          border: 1px solid rgba(244,63,94,0.35);
          color: #fda4af;
        }

        .insights-list { display: flex; flex-direction: column; gap: 0.75rem; }
        .insight-item {
          display: flex;
          align-items: flex-start;
          gap: 0.8rem;
          font-size: 0.88rem;
          color: #cbd5e1;
          line-height: 1.6;
        }
        .insight-num {
          width: 24px; height: 24px;
          border-radius: 7px;
          background: rgba(124,58,237,0.18);
          border: 1px solid rgba(124,58,237,0.35);
          color: #a78bfa;
          font-size: 0.75rem;
          font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          margin-top: 1px;
        }
        .ats-list { list-style: none; display: flex; flex-direction: column; gap: 0.7rem; }
        .ats-list li {
          display: flex;
          align-items: flex-start;
          gap: 0.65rem;
          font-size: 0.88rem;
          color: #cbd5e1;
          line-height: 1.6;
        }
        .ats-list li::before {
          content: '→';
          color: #06b6d4;
          font-weight: 700;
          flex-shrink: 0;
        }
      `}</style>
    </div>
  )
}
