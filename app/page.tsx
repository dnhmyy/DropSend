'use client';

import { useState, useRef, useCallback } from 'react';

type Stage = 'idle' | 'uploading' | 'success' | 'error';

interface UploadResult {
  id: string;
  filename: string;
  size: number;
  expiresAt: string | null;
  url: string;
}

const EXPIRY_LABELS: Record<string, string> = {
  '3600':   '1 hour',
  '86400':  '24 hours',
  '604800': '7 days',
  'never':  'Never expires',
};

function fmtBytes(b: number): string {
  if (!b) return '0 B';
  const k = 1024, u = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return `${(b / Math.pow(k, i)).toFixed(2)} ${u[i]}`;
}

function UploadIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  );
}

function FeatStrip() {
  return (
    <div className="feat-strip">
      <div className="feat">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        No login
      </div>
      <div className="feat-dot" />
      <div className="feat">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        Auto expiry
      </div>
      <div className="feat-dot" />
      <div className="feat">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
        Instant link
      </div>
      <div className="feat-dot" />
      <div className="feat">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        Self-hosted
      </div>
    </div>
  );
}

export default function UploadPage() {
  const [file, setFile]       = useState<File | null>(null);
  const [expiry, setExpiry]   = useState('86400');
  const [stage, setStage]     = useState<Stage>('idle');
  const [progress, setProgress] = useState(0);
  const [result, setResult]   = useState<UploadResult | null>(null);
  const [error, setError]     = useState('');
  const [copied, setCopied]   = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const applyFile = useCallback((f: File) => {
    if (f.size > 1024 * 1024 * 1024) { setError('File exceeds 1 GB limit'); return; }
    setFile(f); setError('');
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) applyFile(f);
  };

  const handleUpload = async () => {
    if (!file || stage === 'uploading') return;
    setStage('uploading'); setProgress(0);

    // mock progress for better ux
    let pct = 0;
    const ticker = setInterval(() => {
      pct = Math.min(pct + Math.random() * 14 + (pct < 70 ? 8 : 1), 92);
      setProgress(pct);
    }, 180);

    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('expiration', expiry);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      clearInterval(ticker);

      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error || 'Upload failed');
      }

      setProgress(100);
      const data: UploadResult = await res.json();
      setTimeout(() => { setResult(data); setStage('success'); }, 320);
    } catch (err: unknown) {
      clearInterval(ticker);
      setStage('error');
      setError(err instanceof Error ? err.message : 'Upload failed');
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    const url = `${window.location.origin}${result.url}`;
    try { await navigator.clipboard.writeText(url); } catch { /* ignore */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const reset = () => {
    setFile(null); setStage('idle'); setProgress(0);
    setResult(null); setError('');
    if (inputRef.current) inputRef.current.value = '';
  };

  // success state
  if (stage === 'success' && result) {
    const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}${result.url}`;
    const expiryTxt = result.expiresAt
      ? `Expires in ${EXPIRY_LABELS[expiry] ?? expiry}`
      : 'Never expires';

    return (
      <div className="scene">
        <div className="hero">
          <span className="eyebrow"><span className="eyebrow-dot" />Upload complete</span>
          <h1 className="display">Your link<br /><em>is ready.</em></h1>
          <p className="hero-sub">
            {result.expiresAt
              ? `Link expires in ${EXPIRY_LABELS[expiry]} — share it before then.`
              : 'This link never expires — share it anywhere.'}
          </p>
        </div>

        <div className="success-card">
          <div className="success-head">
            <div className="success-check">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div>
              <div className="success-title">{result.filename}</div>
              <div className="success-sub">{expiryTxt} · {fmtBytes(result.size)}</div>
            </div>
          </div>

          <div className="link-row-wrap">
            <div className="sec-label">Share link</div>
            <div className="link-row">
              <div className="link-field" tabIndex={0}>{shareUrl}</div>
              <button className={`btn-copy${copied ? ' copied' : ''}`} onClick={handleCopy} aria-label="Copy link">
                {copied ? (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                ) : (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                )}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="card-foot">
            <button className="btn-soft" onClick={reset}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              Upload another
            </button>
            {/* open file serving page */}
            <a className="btn-accent" href={result.url} target="_blank" rel="noopener noreferrer">
              Open page
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </a>
          </div>
        </div>
        <FeatStrip />
      </div>
    );
  }

  // upload state
  return (
    <div className="scene">
      <div className="hero">
        <span className="eyebrow"><span className="eyebrow-dot" />Ready · No account needed</span>
        <h1 className="display">Share files<br /><em>instantly.</em></h1>
        <p className="hero-sub">Drop a file, get a link. Expires when you want.<br />No clutter, no friction.</p>
      </div>

      <div className="card">
        {/* upload zone */}
        <div className="card-body">
          <div
            className={`dropzone${dragOver ? ' drag-over' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(false); }}
            onDrop={handleDrop}
          >
            <input
              ref={inputRef} type="file" className="file-input" aria-label="Select a file"
              style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 2, width: '100%', height: '100%' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) applyFile(f); }}
            />
            <div className="dz-icon"><UploadIcon /></div>
            <p className="dz-title">Drop your file here</p>
            <p className="dz-sub">or <b>click to browse</b> your device</p>
            <div className="dz-chips">
              <span className="dz-chip">Any format</span>
              <span className="dz-chip">Up to 1 GB</span>
              <span className="dz-chip">No compression</span>
            </div>
          </div>
        </div>

        {/* selected file preview */}
        {file && (
          <div className="file-row">
            <div className="file-badge">{file.name.split('.').pop()?.slice(0, 4) ?? '?'}</div>
            <div className="file-info">
              <div className="file-name">{file.name}</div>
              <div className="file-size">{fmtBytes(file.size)}</div>
            </div>
            <button className="btn-rm" onClick={e => { e.stopPropagation(); reset(); }} aria-label="Remove file">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        )}

        <div className="card-sep" />
        <div className="split" style={{ paddingTop: 14, paddingBottom: 4 }}>
          <div className="split-line" />
          <span className="split-txt">Settings</span>
          <div className="split-line" />
        </div>

        {/* expiration settings */}
        <div className="card-row">
          <div className="field-lbl">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            Link expiration
          </div>
          <div className="sel-wrap">
            <select className="sel" value={expiry} onChange={e => setExpiry(e.target.value)}>
              <option value="3600">1 hour</option>
              <option value="86400">24 hours</option>
              <option value="604800">7 days</option>
              <option value="never">Never expires</option>
            </select>
            <div className="sel-arrow">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </div>
        </div>

        {/* upload trigger */}
        <div className="card-row" style={{ paddingTop: 0 }}>
          {error && <div className="error-msg">{error}</div>}
          <button className="btn-upload" onClick={handleUpload} disabled={!file || stage === 'uploading'}>
            {stage === 'uploading' ? (
              <><span className="spin" /><span>Uploading…</span></>
            ) : (
              <><UploadIcon /><span>Upload file</span></>
            )}
          </button>

          {stage === 'uploading' && (
            <div className="progress" style={{ marginTop: 12 }}>
              <div className="progress-row">
                <span className="progress-lbl">Uploading…</span>
                <span className="progress-num">{Math.floor(progress)}%</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>

      <FeatStrip />
    </div>
  );
}
