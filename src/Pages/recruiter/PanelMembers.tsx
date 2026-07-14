import React, { useEffect, useState } from 'react';
import panelAPI, { PanelMember } from '../../services/panelAPI';

const badge = (status: string): React.CSSProperties => ({
  display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
  background: status === 'active' ? '#dcfce7' : '#f1f5f9',
  color: status === 'active' ? '#16a34a' : '#64748b',
});

export default function RecruiterPanelMembers() {
  const [members, setMembers] = useState<PanelMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch]   = useState('');
  const [filterDept, setFilterDept] = useState('');

  useEffect(() => {
    setLoading(true);
    panelAPI.getAll({ status: 'active' })
      .then(res => setMembers(res.data || []))
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  }, []);

  const departments = members.map(m => m.department).filter(Boolean).filter((d, i, arr) => arr.indexOf(d) === i);

  const filtered = members.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.designation?.toLowerCase().includes(search.toLowerCase()) ||
      (m.skills || []).some((s: string) => s.toLowerCase().includes(search.toLowerCase()));
    const matchDept = !filterDept || m.department === filterDept;
    return matchSearch && matchDept;
  });

  return (
    <div style={{ padding: '28px 32px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ marginBottom: 22 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0 }}>Panel Members</h2>
        <p style={{ fontSize: 13, color: '#64748b', margin: '3px 0 0' }}>Available technical panelists for interview assignment</p>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <input
          placeholder="Search by name, designation, skill..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13, outline: 'none', maxWidth: 300, width: '100%' }}
        />
        <select value={filterDept} onChange={e => setFilterDept(e.target.value)}
          style={{ padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13, outline: 'none' }}>
          <option value="">All Departments</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No active panel members found</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {filtered.map(m => (
            <div key={m.id} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{m.name}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{m.designation}</div>
                </div>
                <span style={badge(m.status)}>{m.status}</span>
              </div>

              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>{m.email}</div>
              {m.department && <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>📁 {m.department}</div>}
              {m.employee_id && <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 10 }}>ID: {m.employee_id}</div>}

              {(m.skills || []).length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {(m.skills || []).map((s: string) => (
                    <span key={s} style={{ background: '#e0f2fe', color: '#0369a1', fontSize: 10, padding: '2px 8px', borderRadius: 10, fontWeight: 500 }}>{s}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
