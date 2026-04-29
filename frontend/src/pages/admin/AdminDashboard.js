import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import './Admin.css';

// ── Micro chart helpers ──────────────────────────────────────────────────────

const BarChart = ({ data = [], valueKey, color = '#f97316', formatVal }) => {
  if (!data.length) return <p style={{ color: '#888', padding: '20px 0' }}>No data yet.</p>;
  const max = Math.max(...data.map(d => d[valueKey]), 1);
  const H = 130, W = 420, bw = Math.floor(W / data.length) - 6;
  return (
    <svg viewBox={`0 0 ${W} ${H + 40}`} style={{ width: '100%', maxWidth: W }}>
      {data.map((d, i) => {
        const h = Math.max(4, Math.round((d[valueKey] / max) * H));
        const x = i * (W / data.length) + 3, y = H - h;
        const lbl = formatVal ? formatVal(d[valueKey]) : d[valueKey];
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw} height={h} rx={4} fill={color} opacity={0.85} />
            <text x={x + bw / 2} y={H + 14} textAnchor="middle" fontSize="11" fill="#888">{d.month || d.label}</text>
            <text x={x + bw / 2} y={y - 4} textAnchor="middle" fontSize="10" fill={color} fontWeight="600">{lbl}</text>
          </g>
        );
      })}
    </svg>
  );
};

const DonutChart = ({ data = [] }) => {
  if (!data.length) return null;
  const total = data.reduce((s, d) => s + d.count, 0);
  const COLORS = { pending: '#94a3b8', confirmed: '#60a5fa', preparing: '#fbbf24', out_for_delivery: '#f97316', delivered: '#22c55e', cancelled: '#ef4444' };
  let cum = -Math.PI / 2;
  const R = 60, cx = 80, cy = 80;
  const slices = data.map(d => {
    const a = (d.count / total) * 2 * Math.PI;
    const x1 = cx + R * Math.cos(cum), y1 = cy + R * Math.sin(cum);
    cum += a;
    const x2 = cx + R * Math.cos(cum), y2 = cy + R * Math.sin(cum);
    return { d: `M${cx},${cy} L${x1},${y1} A${R},${R} 0 ${a > Math.PI ? 1 : 0},1 ${x2},${y2} Z`, color: COLORS[d.status] || '#ccc', label: d.status, count: d.count };
  });
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
      <svg viewBox="0 0 160 160" style={{ width: 160, flexShrink: 0 }}>
        {slices.map((s, i) => <path key={i} d={s.d} fill={s.color} stroke="#fff" strokeWidth={2} />)}
        <circle cx={cx} cy={cy} r={35} fill="white" />
        <text x={cx} y={cy + 4} textAnchor="middle" fontSize="13" fontWeight="700" fill="#333">{total}</text>
        <text x={cx} y={cy + 18} textAnchor="middle" fontSize="9" fill="#888">ORDERS</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {slices.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem' }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: s.color, flexShrink: 0 }} />
            <span style={{ textTransform: 'capitalize', color: '#555' }}>{s.label.replace(/_/g, ' ')}</span>
            <span style={{ marginLeft: 'auto', fontWeight: 600, color: '#333' }}>{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const HBarChart = ({ data = [], nameKey = 'name', valueKey = 'revenue', color = '#f97316', formatVal }) => {
  if (!data.length) return <p style={{ color: '#888' }}>No data.</p>;
  const max = Math.max(...data.map(d => d[valueKey]), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
      {data.map((d, i) => {
        const pct = (d[valueKey] / max) * 100;
        const lbl = formatVal ? formatVal(d[valueKey]) : d[valueKey];
        return (
          <div key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 3 }}>
              <span style={{ color: '#374151', fontWeight: 500 }}>{d[nameKey]}</span>
              <span style={{ color, fontWeight: 700 }}>{lbl}</span>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: '#f3f4f6', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width .6s ease' }} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── KPI card ─────────────────────────────────────────────────────────────────
const KPI = ({ icon, label, value, sub, growth, color = '#f97316' }) => (
  <div className="stat-card card" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <div style={{ fontSize: '1.6rem' }}>{icon}</div>
    <div className="stat-value" style={{ color }}>{value}</div>
    <div className="stat-label">{label}</div>
    {sub && <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{sub}</div>}
    {growth !== undefined && growth !== null && (
      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: parseFloat(growth) >= 0 ? '#22c55e' : '#ef4444' }}>
        {parseFloat(growth) >= 0 ? '▲' : '▼'} {Math.abs(growth)}% vs last month
      </div>
    )}
  </div>
);

// ── Main dashboard ────────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const [overview,  setOverview]  = useState(null);
  const [revenue,   setRevenue]   = useState([]);
  const [statuses,  setStatuses]  = useState([]);
  const [topItems,  setTopItems]  = useState([]);
  const [payments,  setPayments]  = useState([]);
  const [delivery,  setDelivery]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState('overview');

  useEffect(() => {
    Promise.all([
      api.get('/analytics/overview'),
      api.get('/analytics/revenue?months=6'),
      api.get('/analytics/status-breakdown'),
      api.get('/analytics/top-items?limit=5'),
      api.get('/analytics/payment-methods'),
      api.get('/analytics/delivery-performance'),
    ]).then(([ov, rev, st, ti, pm, dp]) => {
      setOverview(ov.data);
      setRevenue(rev.data);
      setStatuses(st.data);
      setTopItems(ti.data);
      setPayments(pm.data);
      setDelivery(dp.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner" />;

  const fmt = (n) => n >= 1000 ? `₹${(n/1000).toFixed(1)}k` : `₹${n}`;

  return (
    <div className="admin-page container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <h1 className="page-header" style={{ margin: 0 }}>📊 Analytics Dashboard</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {['overview', 'sales', 'orders', 'delivery'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: '6px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem',
                background: tab === t ? '#f97316' : '#f3f4f6', color: tab === t ? 'white' : '#374151' }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Overview tab ── */}
      {tab === 'overview' && overview && (
        <>
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))' }}>
            <KPI icon="📦" label="Total Orders"       value={overview.totalOrders}                                 color="#f97316" growth={overview.ordersGrowth} />
            <KPI icon="💰" label="Total Revenue"      value={`₹${overview.totalRevenue?.toLocaleString('en-IN')}`} color="#22c55e" growth={overview.revenueGrowth} />
            <KPI icon="👥" label="Customers"           value={overview.totalCustomers}                              color="#3b82f6" />
            <KPI icon="🛵" label="Delivery Partners"  value={overview.totalDeliveryPartners}                       color="#8b5cf6" />
            <KPI icon="🕐" label="Pending Orders"     value={overview.pendingOrders}       color="#fbbf24" sub="needs attention" />
            <KPI icon="❌" label="Cancelled Orders"   value={overview.cancelledOrders}     color="#ef4444" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, marginTop: 16 }}>
            <div className="card chart-card">
              <h3 className="chart-title">Monthly Revenue</h3>
              <BarChart data={revenue} valueKey="revenue" color="#f97316" formatVal={fmt} />
            </div>
            <div className="card chart-card">
              <h3 className="chart-title">Order Status Breakdown</h3>
              <DonutChart data={statuses} />
            </div>
          </div>
        </>
      )}

      {/* ── Sales tab ── */}
      {tab === 'sales' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          <div className="card chart-card">
            <h3 className="chart-title">Revenue (Last 6 Months)</h3>
            <BarChart data={revenue} valueKey="revenue" color="#22c55e" formatVal={fmt} />
          </div>
          <div className="card chart-card">
            <h3 className="chart-title">Orders Per Month</h3>
            <BarChart data={revenue} valueKey="orders" color="#3b82f6" />
          </div>
          <div className="card chart-card">
            <h3 className="chart-title">🏆 Top Menu Items by Revenue</h3>
            <HBarChart data={topItems} nameKey="name" valueKey="revenue" color="#f97316" formatVal={fmt} />
          </div>
          <div className="card chart-card">
            <h3 className="chart-title">💳 Payment Methods</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
              {payments.map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 8, background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                  <div>
                    <div style={{ fontWeight: 600, textTransform: 'capitalize', color: '#111827' }}>{p.method === 'cash' ? '💵 Cash on Delivery' : '💳 Online Payment'}</div>
                    <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>{p.count} orders</div>
                  </div>
                  <div style={{ fontWeight: 700, color: '#f97316' }}>₹{p.revenue?.toLocaleString('en-IN')}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Orders tab ── */}
      {tab === 'orders' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          <div className="card chart-card">
            <h3 className="chart-title">Order Status Breakdown</h3>
            <DonutChart data={statuses} />
          </div>
          <div className="card chart-card">
            <h3 className="chart-title">Top Items by Quantity Sold</h3>
            <HBarChart data={topItems} nameKey="name" valueKey="quantity" color="#8b5cf6" />
          </div>
          <div className="card chart-card" style={{ gridColumn: '1 / -1' }}>
            <h3 className="chart-title">Status Summary</h3>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
              {statuses.map((s, i) => {
                const colors = { pending: '#94a3b8', confirmed: '#60a5fa', preparing: '#fbbf24', out_for_delivery: '#f97316', delivered: '#22c55e', cancelled: '#ef4444' };
                const c = colors[s.status] || '#ccc';
                return (
                  <div key={i} style={{ flex: '1 1 120px', padding: '14px 16px', borderRadius: 10, background: c + '15', border: `1.5px solid ${c}30`, textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: c }}>{s.count}</div>
                    <div style={{ fontSize: '0.78rem', textTransform: 'capitalize', color: '#374151', marginTop: 2 }}>{s.status.replace(/_/g, ' ')}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Delivery tab ── */}
      {tab === 'delivery' && (
        <div className="card" style={{ padding: '20px 24px' }}>
          <h3 className="chart-title" style={{ marginBottom: 16 }}>🛵 Delivery Partner Performance</h3>
          {delivery.length === 0 ? (
            <p style={{ color: '#6b7280' }}>No delivery data yet. Assign delivery partners to orders to see performance metrics.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    {['Partner', 'Email', 'Deliveries', 'Revenue Carried'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {delivery.map((d, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600 }}>🛵 {d.name}</td>
                      <td style={{ padding: '10px 14px', color: '#6b7280' }}>{d.email}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ background: '#f97316', color: 'white', borderRadius: 20, padding: '2px 10px', fontWeight: 700 }}>{d.deliveries}</span>
                      </td>
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: '#22c55e' }}>₹{d.revenue?.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Quick nav ── */}
      <div className="admin-nav-grid" style={{ marginTop: 24 }}>
        {[
          { to: '/admin/restaurants', title: '🏪 Restaurants', desc: 'Add and manage restaurants' },
          { to: '/admin/orders',      title: '📦 Orders',      desc: 'View and update order status' },
        ].map(item => (
          <Link key={item.to} to={item.to} className="admin-nav-card card">
            <h3>{item.title}</h3>
            <p>{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
