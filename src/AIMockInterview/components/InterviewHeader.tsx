import logo from "../../assets/img/askoxylogonew.png";

interface InterviewHeaderProps {
  theme: "light" | "dark";
  user: { id: string; name: string } | null;
  onToggleTheme: () => void;
  onLogout?: () => void;
  copyPasteBlocked?: boolean;
  onToggleCopyPaste?: () => void;
}

export function InterviewHeader({ theme, user, onToggleTheme, onLogout, copyPasteBlocked = true, onToggleCopyPaste }: InterviewHeaderProps) {
  return (
    <header className="ai-header">
      <div className="ai-header-inner">
        <div className="ai-logo-group">
          <img src={logo} alt="AskOxy" style={{ height: 30, objectFit: "contain", width: "auto" }} />
          <div className="ai-logo-divider" />
          <div className="ai-header-label">
            <div className="ai-header-title">AI Interview</div>
            <div className="ai-header-sub">Technical Assessment Platform</div>
          </div>
        </div>
        <div className="ai-header-actions">
          {onToggleCopyPaste && (
            <button
              type="button"
              onClick={onToggleCopyPaste}
              title={copyPasteBlocked ? "Copy-paste is BLOCKED (click to allow)" : "Copy-paste is ALLOWED (click to block)"}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 12px',
                background: copyPasteBlocked ? '#fef2f2' : '#f0fdf4',
                border: `1px solid ${copyPasteBlocked ? '#fca5a5' : '#86efac'}`,
                borderRadius: 6, fontSize: 12, fontWeight: 600,
                color: copyPasteBlocked ? '#dc2626' : '#16a34a',
                cursor: 'pointer', transition: 'all .2s',
              }}
            >
              <span style={{ fontSize: 14 }}>{copyPasteBlocked ? '🔒' : '🔓'}</span>
              <span>{copyPasteBlocked ? 'Copy OFF' : 'Copy ON'}</span>
            </button>
          )}
          <button type="button" className="theme-toggle" onClick={onToggleTheme} aria-label="Toggle theme">
            {theme === "light" ? "🌙" : "☀️"}
            <span>{theme === "light" ? "Dark" : "Light"}</span>
          </button>
          {user && (
            <div className="ai-user-chip" onClick={onLogout} style={{ cursor: onLogout ? 'pointer' : 'default' }} title={onLogout ? 'Click to logout' : ''}>
              <div className="ai-avatar">{user.name.charAt(0).toUpperCase()}</div>
              <span className="ai-user-name">{user.name}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
