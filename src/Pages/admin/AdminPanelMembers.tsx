import React, { useEffect, useState, useCallback } from 'react';
import panelAPI, { PanelMember, PanelMemberForm } from '../../services/panelAPI';
import { COLORS, RADIUS, SHADOW } from '../../AIMockInterview/admin/adminTheme';

const EMPTY_FORM: PanelMemberForm = {
  name: '', email: '', employee_id: '', designation: '',
  skills: [], department: '', status: 'active',
};

const inp: React.CSSProperties = {
  width: '100%', padding: '8px 10px', border: '1px solid #e5e7eb',
  borderRadius: 6, fontSize: 13, outline: 'none', boxSizing: 'border-box',
};

const badge = (status: string): React.CSSProperties => ({
  display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
  background: status === 'active' ? '#dcfce7' : '#f1f5f9',
  color: status === 'active' ? '#16a34a' : '#64748b',
});

export default function AdminPanelMembers() {
  const [members, setMembers]   = useState<PanelMember[]>([]);
  const [loading, setLoading]   = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState<PanelMember | null>(null);
  const [form, setForm]         = useState<PanelMemberForm>(EMPTY_FORM);
  const [skillInput, setSkillInput] = useState('');
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [search, setSearch]     = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [listError, setListError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await panelAPI.getAll(filterStatus ? { status: filterStatus } : {});
      setMembers(res.data || []);
    } catch { setMembers([]); }
    setLoading(false);
  }, [filterStatus]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setSkillInput(''); setError(''); setShowForm(true); };
  const openEdit   = (m: PanelMember) => {
    setEditing(m);
    setForm({ name: m.name, email: m.email, employee_id: m.employee_id || '', designation: m.designation, skills: m.skills || [], department: m.department || '', status: m.status });
    setSkillInput(''); setError(''); setShowForm(true);
  };

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !form.skills.includes(s)) setForm(f => ({ ...f, skills: [...f.skills, s] }));
    setSkillInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      if (editing) await panelAPI.update(editing.id, form);
      else         await panelAPI.create(form);
      setShowForm(false); load();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Something went wrong');
    }
    setSaving(false);
  };

  const toggleStatus = async (m: PanelMember) => {
    setListError('');
    setTogglingId(m.id);
    try {
      await panelAPI.updateStatus(m.id, m.status === 'active' ? 'inactive' : 'active');
      await load();
    } catch (err: any) {
      setListError(err?.response?.data?.error || `Failed to update status for ${m.name}`);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (m: PanelMember) => {
    if (!window.confirm(`Delete ${m.name}?`)) return;
    setListError('');
    try {
      await panelAPI.delete(m.id);
      await load();
    } catch (err: any) {
      setListError(err?.response?.data?.error || `Failed to delete ${m.name}`);
    }
  };

  const filtered = members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase()) ||
    m.designation?.toLowerCase().includes(search.toLowerCase()) ||
    (m.skills || []).some((s: string) => s.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ padding: '28px 32px', fontFamily: 'Inter, sans-serif', overflowX: 'hidden' }}>
      {/* Title + stats + search + filter + add — one row when there's room, wraps instead of scrolling when there isn't */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', rowGap: 10 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0, whiteSpace: 'nowrap', flexShrink: 0 }}>Panel Members</h2>

        {[
          { label: 'Total',    val: members.length,                                     color: COLORS.brand },
          { label: 'Active',   val: members.filter(m => m.status === 'active').length,   color: COLORS.success },
          { label: 'Inactive', val: members.filter(m => m.status === 'inactive').length, color: COLORS.textMuted },
        ].map(s => (
          <div key={s.label} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: RADIUS.md, boxShadow: SHADOW.sm, height: 36, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, boxSizing: 'border-box' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: 15, fontWeight: 800, color: COLORS.textPrimary, letterSpacing: '-0.02em' }}>{s.val}</span>
            <span style={{ fontSize: 10.5, color: COLORS.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{s.label}</span>
          </div>
        ))}

        <input placeholder="Search by name, email, designation, skill..." value={search}
          onChange={e => setSearch(e.target.value)} style={{ ...inp, width: 160, height: 36, flexShrink: 0, boxSizing: 'border-box' }} />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...inp, width: 100, height: 36, flexShrink: 0, boxSizing: 'border-box' }}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <button onClick={openCreate} style={{ height: 36, padding: '0 16px', background: '#2563EB', color: 'white', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, boxSizing: 'border-box', marginLeft: 'auto' }}>
          + Add Panel Member
        </button>
      </div>
      <p style={{ fontSize: 13, color: '#64748b', margin: '8px 0 22px' }}>Manage technical interview panelists</p>

      {listError && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '9px 14px', borderRadius: 7, fontSize: 12.5, marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {listError}
          <button onClick={() => setListError('')} style={{ background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
        </div>
      )}

      {/* Table */}
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No panel members found</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                {['Name', 'Employee ID', 'Designation', 'Department', 'Skills', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', fontSize: 12, fontWeight: 600, color: '#374151', textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, i) => (
                <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{m.name}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{m.email}</div>
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: '#64748b' }}>{m.employee_id || '—'}</td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: '#1e293b' }}>{m.designation}</td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: '#64748b' }}>{m.department || '—'}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {(m.skills || []).slice(0, 3).map((s: string) => (
                        <span key={s} style={{ background: '#EFF6FF', color: '#1D4ED8', fontSize: 10, padding: '2px 7px', borderRadius: 10, fontWeight: 500 }}>{s}</span>
                      ))}
                      {(m.skills || []).length > 3 && <span style={{ fontSize: 10, color: '#94a3b8' }}>+{m.skills.length - 3}</span>}
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px' }}><span style={badge(m.status)}>{m.status}</span></td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => openEdit(m)} style={{ padding: '5px 10px', background: '#f1f5f9', border: 'none', borderRadius: 5, fontSize: 11, cursor: 'pointer', color: '#374151' }}>Edit</button>
                      <button onClick={() => toggleStatus(m)} disabled={togglingId === m.id}
                        style={{ padding: '5px 10px', background: m.status === 'active' ? '#fef9c3' : '#dcfce7', border: 'none', borderRadius: 5, fontSize: 11, cursor: togglingId === m.id ? 'not-allowed' : 'pointer', color: '#374151', opacity: togglingId === m.id ? 0.6 : 1 }}>
                        {togglingId === m.id ? '…' : m.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                      <button onClick={() => handleDelete(m)} style={{ padding: '5px 10px', background: '#fee2e2', border: 'none', borderRadius: 5, fontSize: 11, cursor: 'pointer', color: '#b91c1c' }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16, boxSizing: 'border-box' }}>
          <div style={{ background: 'white', borderRadius: 12, padding: '28px 32px', width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', boxSizing: 'border-box' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 20px' }}>
              {editing ? 'Edit Panel Member' : 'Add Panel Member'}
            </h3>

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '8px 12px', borderRadius: 6, fontSize: 12, marginBottom: 14 }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 4 }}>Full Name <span style={{ color: '#ef4444' }}>*</span></label>
                  <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="John Doe" style={inp} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 4 }}>Employee ID</label>
                  <input value={form.employee_id} onChange={e => setForm(f => ({ ...f, employee_id: e.target.value }))} placeholder="EMP-001" style={inp} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 4 }}>Work Email <span style={{ color: '#ef4444' }}>*</span></label>
                <input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="john@company.com" style={inp} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 4 }}>Designation <span style={{ color: '#ef4444' }}>*</span></label>
                  <input required value={form.designation} onChange={e => setForm(f => ({ ...f, designation: e.target.value }))} placeholder="Senior Developer" style={inp} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 4 }}>Department</label>
                  <input value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} placeholder="Engineering" style={inp} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 4 }}>Skills</label>
                <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                  <input value={skillInput} onChange={e => setSkillInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                    placeholder="Type a skill and press Enter" style={{ ...inp, flex: 1 }} />
                  <button type="button" onClick={addSkill} style={{ padding: '8px 12px', background: '#2563EB', color: 'white', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>Add</button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {form.skills.map((s: string) => (
                    <span key={s} style={{ background: '#EFF6FF', color: '#1D4ED8', fontSize: 11, padding: '3px 8px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
                      {s}
                      <button type="button" onClick={() => setForm(f => ({ ...f, skills: f.skills.filter((x: string) => x !== s) }))}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1D4ED8', padding: 0, fontSize: 13, lineHeight: 1 }}>×</button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 4 }}>Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))} style={inp}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" onClick={() => setShowForm(false)} style={{ padding: '9px 18px', background: '#f1f5f9', border: 'none', borderRadius: 7, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ padding: '9px 18px', background: saving ? '#60A5FA' : '#2563EB', color: 'white', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
                  {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
