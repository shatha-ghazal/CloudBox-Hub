import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './App.css';

function App() {
  const [activeView, setActiveView] = useState('LOGIN_VIEW');
  const [sessionUser, setSessionUser] = useState(null);
  const [driveFiles, setDriveFiles] = useState([]);
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [statusMessage, setStatusMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    if (sessionUser) {
      fetch('/api/drive/files', {
        headers: { 'x-user-identity': sessionUser.id }
      })
      .then(res => res.json())
      .then(data => setDriveFiles(data || []))
      .catch(err => console.error(err));
    }
  }, [sessionUser]);

  const resetStatus = () => setStatusMessage({ text: '', type: '' });

  const processProfileInstantiation = async (e) => {
    e.preventDefault();
    resetStatus();
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm)
      });
      const data = await res.json();
      if (!res.ok) return setStatusMessage({ text: data.error, type: 'error' });
      setStatusMessage({ text: data.message, type: 'success' });
      setAuthForm({ name: '', email: '', password: '' });
      setActiveView('LOGIN_VIEW');
    } catch (err) {
      setStatusMessage({ text: "Cannot connect to server", type: 'error' });
    }
  };

  const processAuthenticationValidation = async (e) => {
    e.preventDefault();
    resetStatus();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authForm.email, password: authForm.password })
      });
      const data = await res.json();
      if (!res.ok) return setStatusMessage({ text: data.error, type: 'error' });
      setSessionUser(data.userProfile);
      setAuthForm({ name: '', email: '', password: '' });
      setActiveView('DASHBOARD_VIEW');
    } catch (err) {
      setStatusMessage({ text: "Cannot connect to server", type: 'error' });
    }
  };

  const processCloudUpload = async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const targetFile = e.target.files[0];
    const dataContainer = new FormData();
    dataContainer.append('cloudFile', targetFile);

    try {
      const res = await fetch('/api/drive/upload', {
        method: 'POST',
        headers: { 'x-user-identity': sessionUser.id },
        body: dataContainer
      });
      const data = await res.json();
      if (res.ok) setDriveFiles([...driveFiles, data]);
    } catch (err) {
      console.error(err);
    }
  };

  const executeStorageObjectPurge = async (targetId) => {
    await fetch(`/api/drive/files/${targetId}`, {
      method: 'DELETE',
      headers: { 'x-user-identity': sessionUser.id }
    });
    setDriveFiles(driveFiles.filter(f => f.fileId !== targetId));
  };

  if (activeView === 'LOGIN_VIEW') {
    return (
      <div className="auth-fullscreen-layout">
        <div className="auth-card-wrapper">
          <div className="app-branding">☁️ Personal CloudBox</div>
          <h3>Welcome Back</h3>
          <p className="subtitle-caption">Input your credentials  </p>
          {statusMessage.text && <div className={`status-notification ${statusMessage.type}`}>{statusMessage.text}</div>}
          <form onSubmit={processAuthenticationValidation} className="operational-form">
            <div className="field-group">
              <label>Email Profile Address</label>
              <input type="email" required placeholder="name@domain.com" value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} />
            </div>
            <div className="field-group">
              <label>Password Context Key</label>
              <input type="password" required placeholder="••••••••" value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} />
            </div>
            <button type="submit" className="primary-action-trigger">Log in</button>
          </form>
          <div className="routing-toggle-footer">
            Don't have a storage container? <span onClick={() => { setActiveView('SIGNUP_VIEW'); resetStatus(); }}>Register Here</span>
          </div>
        </div>
      </div>
    );
  }

  if (activeView === 'SIGNUP_VIEW') {
    return (
      <div className="auth-fullscreen-layout">
        <div className="auth-card-wrapper">
          <div className="app-branding">☁️ Personal CloudBox</div>
          <h3>Initialize System Account</h3>
          <p className="subtitle-caption">Setup your account</p>
          {statusMessage.text && <div className={`status-notification ${statusMessage.type}`}>{statusMessage.text}</div>}
          <form onSubmit={processProfileInstantiation} className="operational-form">
            <div className="field-group">
              <label>Full Operational Name</label>
              <input type="text" required placeholder="Alex Mercer" value={authForm.name} onChange={e => setAuthForm({...authForm, name: e.target.value})} />
            </div>
            <div className="field-group">
              <label>Target Email Address</label>
              <input type="email" required placeholder="alex@cloud.local" value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} />
            </div>
            <div className="field-group">
              <label>Secure Entry Password Code</label>
              <input type="password" required placeholder="Password" value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} />
            </div>
            <button type="submit" className="primary-action-trigger-green">Register your Account</button>
          </form>
          <div className="routing-toggle-footer">
            Have an account? <span onClick={() => { setActiveView('LOGIN_VIEW'); resetStatus(); }}>Return back to logging portal</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-root-frame">
      <aside className="dashboard-navigation-sidebar">
        <div className="sidebar-upper-segment">
          <div className="sidebar-branding-row">
            <span className="branding-icon-node">☁️</span>
            <span className="branding-text-string">CloudBox Hub</span>
          </div>
          <div className="sidebar-nav-links-stack">
            <div className="nav-item-pill active-state">📂 Personal Drive Storage</div>
          </div>
        </div>
        <div className="sidebar-profile-footer">
          <div className="profile-badge-info">
            <div className="avatar-placeholder">{sessionUser?.name?.charAt(0).toUpperCase()}</div>
            <div>
              <strong>{sessionUser?.name}</strong>
              <br/>
              <small>{sessionUser?.email}</small>
            </div>
          </div>
          <button onClick={() => { setSessionUser(null); setActiveView('LOGIN_VIEW'); }} className="sign-out-interactive-trigger">Sign Out</button>
        </div>
      </aside>
      <main className="dashboard-viewport-workspace">
        <header className="workspace-header-control-bar">
          <div>
            <h1>Personal Storage Cloud Engine</h1>
            <p>Manage raw assets directly.</p>
          </div>
          <label className="workspace-upload-label-wrapper">
            <span>➕ Upload File</span>
            <input type="file" className="native-input-file-element-hidden" onChange={processCloudUpload} />
          </label>
        </header>
        <div className="workspace-view-content-canvas">
          {driveFiles.length === 0 ? (
            <div className="empty-catalog-fallback-card">
              <div className="fallback-art-icon">📁</div>
              <h4>No files inside your storage space</h4>
              <p>Click "Upload File" above to add your first document or media asset.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
              {driveFiles.map((file) => (
                <div key={file.fileId} style={{ background: '#fff', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontWeight: '600', marginBottom: '6px', wordBreak: 'break-all' }}>📄 {file.originalName}</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
                    {file.formattedSize} • {file.creationDate}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <a
                      href={file.downloadUrl}
                      download={file.originalName}
                      target="_blank"
                      rel="noreferrer"
                      style={{ flex: 1, textAlign: 'center', padding: '6px', background: '#2563eb', color: '#fff', borderRadius: '6px', textDecoration: 'none', fontSize: '12px', fontWeight: '600' }}
                    >
                      Download
                    </a>
                    <button
                      onClick={() => executeStorageObjectPurge(file.fileId)}
                      style={{ padding: '6px 10px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fee2e2', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(<App />);
}

export default App;
