import React, { useState, useEffect } from 'react';
import { PieChart, BarChart2, TrendingUp, IndianRupee, Compass } from 'lucide-react';
import { analyticsService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/helpers';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart as RePieChart, Pie, Cell
} from 'recharts';

const CHART_COLORS = ['#6366f1', '#f97316', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const Analytics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const { data } = await analyticsService.getDashboard();
        if (data?.success) {
          setDashboardData(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '60vh', flexDirection: 'column', gap: '1rem' }}>
        <div className="loading-spinner"></div>
        <p style={{ color: 'var(--text-muted)' }}>Loading spending analytics...</p>
      </div>
    );
  }

  const stats = dashboardData?.stats || { totalTrips: 0, totalExpenses: 0, youOwe: 0, youGet: 0 };
  const recentExpenses = dashboardData?.recentExpenses || [];

  // Group recent expenses by category
  const categoryMap = {};
  recentExpenses.forEach((e) => {
    categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
  });

  const categoryChartData = Object.keys(categoryMap).map((cat, idx) => ({
    name: cat,
    value: categoryMap[cat],
    color: CHART_COLORS[idx % CHART_COLORS.length],
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
          Travel Analytics & Spending Insights 📊
        </h1>
        <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)' }}>
          Comprehensive financial trends & category analysis across all your trips
        </p>
      </div>

      {/* Top Stat Summary Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary-light)' }}>
            <IndianRupee size={24} />
          </div>
          <div>
            <div className="stat-label">Total Spent All Trips</div>
            <div className="stat-value">{formatCurrency(stats.totalExpenses, user?.defaultCurrency || 'INR')}</div>
            <div className="stat-change" style={{ color: 'var(--primary-light)' }}>Across {stats.totalTrips} trips</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="stat-label">Total You Get Back</div>
            <div className="stat-value" style={{ color: 'var(--success)' }}>+{formatCurrency(stats.youGet, user?.defaultCurrency || 'INR')}</div>
            <div className="stat-change" style={{ color: 'var(--success)' }}>From paid expenses</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}>
            <Compass size={24} />
          </div>
          <div>
            <div className="stat-label">Total You Owe</div>
            <div className="stat-value" style={{ color: 'var(--danger)' }}>-{formatCurrency(stats.youOwe, user?.defaultCurrency || 'INR')}</div>
            <div className="stat-change" style={{ color: 'var(--text-muted)' }}>Pending balances</div>
          </div>
        </div>
      </div>

      {/* Category Breakdown Chart */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <PieChart size={20} color="var(--primary-light)" /> Expense Category Distribution
        </h3>

        {categoryChartData.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No expense data available yet.
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
            <div style={{ width: 250, height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value, user?.defaultCurrency || 'INR')} />
                </RePieChart>
              </ResponsiveContainer>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {categoryChartData.map((cat) => (
                <div key={cat.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.85rem', background: 'var(--bg-card-hover)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: cat.color }} />
                    <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{cat.name}</span>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{formatCurrency(cat.value, user?.defaultCurrency || 'INR')}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
