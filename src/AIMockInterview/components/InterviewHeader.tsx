import logo from "../../assets/img/askoxylogonew.png";

interface InterviewHeaderProps {
  theme: "light" | "dark";
  user: { id: string; name: string } | null;
  onToggleTheme: () => void;
  onLogout?: () => void;
  // Set by the admin (Round Settings), not by the candidate — this is a
  // read-only status indicator, not a control.
  copyPasteBlocked?: boolean;
}

export function InterviewHeader({ theme, user, onToggleTheme, onLogout, copyPasteBlocked = true }: InterviewHeaderProps) {
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
          <div
            title={copyPasteBlocked ? "Copy-paste is blocked during this exam (set by the recruiter, not changeable here)" : "Copy-paste is currently allowed for this exam"}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 12px',
              background: copyPasteBlocked ? '#f0fdf4' : '#fffbeb',
              border: `1px solid ${copyPasteBlocked ? '#86efac' : '#fcd34d'}`,
              borderRadius: 6, fontSize: 12, fontWeight: 600,
              color: copyPasteBlocked ? '#16a34a' : '#b45309',
            }}
          >
            <span style={{ fontSize: 14 }}>{copyPasteBlocked ? '🔒' : '🔓'}</span>
            <span>{copyPasteBlocked ? 'Copy Protected' : 'Copy Allowed'}</span>
          </div>
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
