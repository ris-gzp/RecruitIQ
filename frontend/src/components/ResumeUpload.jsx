import { useState, useRef } from 'react'

const API = ''

export default function ResumeUpload({ onUploaded }) {
  const [file, setFile]         = useState(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [analysis, setAnalysis] = useState(null)
  const inputRef = useRef()

  const handleFile = (f) => {
    if (!f) return
    if (!f.name.toLowerCase().endsWith('.pdf')) { setError('Please upload a PDF file.'); return }
    setError('')
    setFile(f)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    setError('')
    const form = new FormData()
    form.append('file', file)
    try {
      const res = await fetch(`${API}/api/upload-resume`, { method: 'POST', body: form })
      if (!res.ok) {
        const errBody = await res.text()
        let detail = `Upload failed (${res.status})`
        try { detail = JSON.parse(errBody).detail || detail } catch {}
        throw new Error(detail)
      }
      const data = await res.json()
      setAnalysis(data.analysis)
      onUploaded({ session_id: data.session_id, analysis: data.analysis })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="card">
        <div className="card-title">
          <span>📄</span>
          <span>Upload Your Resume</span>
        </div>
        <p style={{ color: 'var(--t2)', fontSize: '0.88rem', marginBottom: '1.25rem', lineHeight: 1.6 }}>
          Drop your PDF resume below. RecruitIQ will extract your skills, experience, and craft a personalized career profile.
        </p>

        <div
          className={`drop-zone ${dragging ? 'dz-over' : ''} ${file ? 'dz-filled' : ''}`}
          onClick={() => inputRef.current.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf"
            style={{ display: 'none' }}
            onChange={e => handleFile(e.target.files[0])}
          />
          {file ? (
            <div className="dz-file">
              <div className="dz-file-icon-wrap">📋</div>
              <div>
                <div className="dz-file-name">{file.name}</div>
                <div className="dz-file-meta">{(file.size / 1024).toFixed(0)} KB · PDF ready to analyze</div>
              </div>
              <div className="dz-file-check">✓</div>
            </div>
          ) : (
            <div className="dz-empty">
              <div className="dz-upload-icon">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <path d="M20 28V12M20 12L14 18M20 12L26 18" stroke="url(#uGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 30h24" stroke="url(#uGrad)" strokeWidth="2.5" strokeLinecap="round"/>
                  <defs>
                    <linearGradient id="uGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#7c3aed"/>
                      <stop offset="1" stopColor="#06b6d4"/>
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <div className="dz-text">Drop your resume here or <span className="dz-link">browse files</span></div>
              <div className="dz-hint">PDF · Max 10 MB</div>
            </div>
          )}
        </div>

        {error && <div className="alert-error">{error}</div>}

        <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button className="btn btn-primary" onClick={handleUpload} disabled={!file || loading}>
            {loading
              ? <><span className="spinner" /> Analyzing with AI…</>
              : '◈ Analyze Resume'}
          </button>
          {file && !loading && (
            <button className="btn btn-secondary" onClick={() => { setFile(null); setAnalysis(null); setError('') }}>
              Clear
            </button>
          )}
        </div>
      </div>

      {analysis && (
        <div className="card" style={{ marginTop: '1.25rem' }}>
          <div className="card-title">
            <span>◈</span>
            <span className="grad-text">Resume Intelligence Report</span>
          </div>

          <div className="ra-profile">
            <div className="ra-avatar">
              <span>{(analysis.name || 'P')[0].toUpperCase()}</span>
            </div>
            <div className="ra-info">
              <div className="ra-name">{analysis.name || 'Professional'}</div>
              <div className="ra-title">{analysis.title || 'Job Seeker'}</div>
              <div className="ra-meta">
                {analysis.years_experience > 0 && (
                  <span className="tag tag-violet">{analysis.years_experience}y exp</span>
                )}
                {analysis.education && (
                  <span className="tag tag-amber">{analysis.education}</span>
                )}
              </div>
            </div>
          </div>

          {analysis.summary && (
            <div className="ra-summary">{analysis.summary}</div>
          )}

          <div className="divider" />

          {analysis.key_skills?.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div className="section-label">⚡ Key Skills</div>
              <div className="tags">
                {analysis.key_skills.map((s, i) => (
                  <span key={i} className="tag tag-violet">{s}</span>
                ))}
              </div>
            </div>
          )}

          <div className="grid-2">
            {analysis.strengths?.length > 0 && (
              <div>
                <div className="section-label">💪 Strengths</div>
                <ul className="ra-list ra-list-green">
                  {analysis.strengths.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            )}
            {analysis.improvements?.length > 0 && (
              <div>
                <div className="section-label">🔧 Growth Areas</div>
                <ul className="ra-list ra-list-amber">
                  {analysis.improvements.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        .drop-zone {
          border: 2px dashed rgba(124,58,237,0.28);
          border-radius: 16px;
          padding: 2.75rem 2rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16,1,0.3,1);
          background: rgba(124,58,237,0.03);
          position: relative;
          overflow: hidden;
        }
        .drop-zone::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at 50% 50%, rgba(124,58,237,0.06) 0%, transparent 70%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .drop-zone:hover, .dz-over {
          border-color: rgba(124,58,237,0.55);
          background: rgba(124,58,237,0.06);
          box-shadow: 0 0 30px rgba(124,58,237,0.1), inset 0 0 30px rgba(124,58,237,0.04);
        }
        .drop-zone:hover::before, .dz-over::before { opacity: 1; }
        .dz-filled {
          border-style: solid;
          border-color: rgba(124,58,237,0.45);
          background: rgba(124,58,237,0.05);
          box-shadow: 0 0 20px rgba(124,58,237,0.08);
        }
        .dz-upload-icon {
          margin-bottom: 1rem;
          display: inline-block;
          animation: uploadBob 3s ease-in-out infinite;
        }
        @keyframes uploadBob {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-6px); }
        }
        .dz-text { font-size: 0.95rem; color: #94a3b8; margin-bottom: 0.4rem; }
        .dz-link { color: #a78bfa; text-decoration: underline; text-underline-offset: 2px; cursor: pointer; }
        .dz-hint { font-size: 0.78rem; color: #334155; }
        .dz-file {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          justify-content: center;
        }
        .dz-file-icon-wrap { font-size: 2.5rem; }
        .dz-file-name { font-weight: 600; color: #f1f5f9; font-size: 0.95rem; }
        .dz-file-meta { color: #94a3b8; font-size: 0.8rem; margin-top: 0.2rem; }
        .dz-file-check {
          width: 28px; height: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, #7c3aed, #06b6d4);
          color: white;
          font-size: 0.8rem;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 12px rgba(124,58,237,0.5);
          flex-shrink: 0;
        }

        .ra-profile {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          margin-bottom: 1.1rem;
        }
        .ra-avatar {
          width: 56px; height: 56px;
          border-radius: 16px;
          background: linear-gradient(135deg, #7c3aed, #3b82f6, #06b6d4);
          display: flex; align-items: center; justify-content: center;
          font-size: 1.5rem; font-weight: 800; color: white;
          flex-shrink: 0;
          box-shadow: 0 0 20px rgba(124,58,237,0.4), 0 0 50px rgba(124,58,237,0.15);
        }
        .ra-name { font-size: 1.15rem; font-weight: 700; color: #f1f5f9; letter-spacing: -0.3px; }
        .ra-title { color: #94a3b8; font-size: 0.88rem; margin: 0.15rem 0 0.4rem; }
        .ra-meta { display: flex; gap: 0.4rem; flex-wrap: wrap; }
        .ra-summary {
          color: #94a3b8;
          font-size: 0.88rem;
          line-height: 1.65;
          padding: 0.9rem 1rem;
          background: rgba(0,0,0,0.25);
          border-radius: 12px;
          border-left: 3px solid rgba(124,58,237,0.6);
          box-shadow: inset 0 0 20px rgba(124,58,237,0.03);
          margin-bottom: 0.25rem;
        }
        .ra-list { list-style: none; display: flex; flex-direction: column; gap: 0.5rem; }
        .ra-list li {
          font-size: 0.85rem;
          color: #cbd5e1;
          display: flex;
          align-items: flex-start;
          gap: 0.55rem;
          line-height: 1.5;
        }
        .ra-list-green li::before { content: '✓'; color: #10b981; font-weight: 700; flex-shrink: 0; }
        .ra-list-amber li::before { content: '→'; color: #f59e0b; font-weight: 700; flex-shrink: 0; }
      `}</style>
    </div>
  )
}
