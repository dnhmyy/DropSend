'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface FileMeta {
  id: string;
  filename: string;
  size: number;
  mimeType: string | null;
  expiresAt: string | null;
  createdAt: string;
  downloads: number;
  expired: boolean;
}

function fmtBytes(b: number): string {
  if (!b) return '0 B';
  const k = 1024, u = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return `${(b / Math.pow(k, i)).toFixed(2)} ${u[i]}`;
}

export default function DownloadPage() {
  const params = useParams();
  const id = params?.id as string;
  const [meta, setMeta] = useState<FileMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function fetchMeta() {
      try {
        const res = await fetch(`/api/meta/${id}`);
        if (!res.ok) throw new Error('File not found or expired');
        const data = await res.json();
        setMeta(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchMeta();
  }, [id]);

  if (loading) return (
    <div className="dl-scene">
      <div className="dl-hero">
        <h1 className="dl-filename">Loading...</h1>
      </div>
    </div>
  );

  if (error || !meta || meta.expired) return (
    <div className="dl-scene">
      <div className="state-card">
        <div className="state-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <div className="state-title">Link expired</div>
        <p className="state-sub">This file is no longer available. The share link has passed its expiration date and been removed.</p>
        <a href="/" className="btn-dl" style={{ textDecoration: 'none', marginTop: 6, maxWidth: 200 }}>
          Upload a file
        </a>
      </div>
    </div>
  );

  const handleDownload = () => {
    setDownloading(true);
    // trigger download via browser redirect
    window.location.href = `/api/file/${id}`;
    setTimeout(() => setDownloading(false), 2400);
  };

  return (
    <div className="dl-scene">
      <div id="dlActive">
        <div className="dl-hero">
          <span className="dl-eyebrow">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
              <polyline points="13 2 13 9 20 9"/>
            </svg>
            Shared file
          </span>
          <h1 className="dl-filename">{meta.filename}</h1>
          <p className="dl-filemeta">{fmtBytes(meta.size)}</p>
        </div>

        <div className="dl-card">
          <div className="dl-meta-grid">
            <div className="dl-meta">
              <span className="dl-meta-lbl">Expires</span>
              <span className="dl-meta-val">
                {meta.expiresAt ? new Date(meta.expiresAt).toLocaleDateString() : 'Never'}
              </span>
            </div>
            <div className="dl-meta-sep" />
            <div className="dl-meta">
              <span className="dl-meta-lbl">Created</span>
              <span className="dl-meta-val">{new Date(meta.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="dl-stats">
            <div className="dl-stat">
              <span className="dl-stat-n">{meta.downloads}</span>
              <span className="dl-stat-l">Downloads</span>
            </div>
          </div>

          <div className="dl-action">
            <button 
              className={`btn-dl${downloading ? ' success' : ''}`} 
              onClick={handleDownload}
              disabled={downloading}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              {downloading ? 'Starting download...' : 'Download file'}
            </button>
          </div>

          <div className="dl-foot">
            <a href="/" className="btn-soft" style={{ textDecoration: 'none' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              Share your own file
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
