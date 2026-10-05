import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus, TrendingUp, TrendingDown, DollarSign, Plane, Users,
  CreditCard, ChevronRight, Calendar, AlertCircle, RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { analyticsService, tripService } from '../services';
import { formatCurrency, formatDate, getBudgetColor, getCategoryInfo } from '../utils/helpers';
import AddTripModal from '../components/trips/AddTripModal';
import { ResponsiveContainer, PieChart as RePieChart, Pie, Cell, Tooltip } from 'recharts';
import toast from 'react-hot-toast';

const CHART_COLORS = ['#6366f1', '#f97316', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeTrips: 0,
    upcomingTrips: 0,
    totalTrips: 0,
    totalExpenses: 0,
    youOwe: 0,
    youGet: 0,
    netBalance: 0,
  });
  const [recentTrips, setRecentTrips] = useState([]);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [isAddTripOpen, setIsAddTripOpen] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await analyticsService.getDashboard();
      if (data?.success && data?.data) {
        setStats(data.data.stats || {});
        setRecentTrips(data.data.recentTrips || []);
        setRecentExpenses(data.data.recentExpenses || []);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard analytics:', err);
      // Fallback cleanly without demo fake numbers
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleTripCreated = () => {
    fetchDashboardData();
  };

  // Build real category chart data from recent expenses
  const categoryMap = {};
  recentExpenses.forEach((exp) => {
    categoryMap[exp.category] = (categoryMap[exp.category] || 0) + (exp.amount || 0);
  });

  const categorySummary = Object.keys(categoryMap).map((catName, idx) => ({
    name: catName,
    value: categoryMap[catName],
    color: getCategoryInfo(catName).color || CHART_COLORS[idx % CHART_COLORS.length],
  }));

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '60vh', flexDirection: 'column', gap: '1rem' }}>
        <div className="loading-spinner"></div>
        <p style={{ color: 'var(--text-muted)' }}>Loading your trip statistics...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Banner / Welcome */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(14, 165, 233, 0.08) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.25)',
        borderRadius: '20px',
        padding: '1.75rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.5rem',
        boxShadow: 'var(--shadow-md)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <img
            src={user?.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300'}
            alt={user?.name || 'User'}
            style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary)' }}
          />
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
              Welcome back, {user?.name ? user.name.split(' ')[0] : 'Traveler'}! ✈️
            </h1>
            <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              You have <span style={{ color: 'var(--primary-light)', fontWeight: 600 }}>{stats.activeTrips || 0} active trip(s)</span> and {stats.totalTrips || 0} total travel groups.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-primary btn-lg" onClick={() => setIsAddTripOpen(true)}>
            <Plus size={20} />
            Plan New Trip
          </button>
        </div>
      </div>

      {/* Top Summary Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary-light)' }}>
            <Plane size={24} />
          </div>
          <div>
            <div className="stat-label">Active & Total Trips</div>
            <div className="stat-value">{stats.totalTrips || 0} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 400 }}>Trips</span></div>
            <div className="stat-change" style={{ color: 'var(--primary-light)' }}>
              {stats.activeTrips || 0} active
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="stat-label">You Are Owed</div>
            <div className="stat-value" style={{ color: 'var(--success)' }}>
              +{formatCurrency(stats.youGet || 0, user?.defaultCurrency || 'USD')}
            </div>
            <div className="stat-change" style={{ color: 'var(--success)' }}>
              Calculated from active expenses
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}>
            <TrendingDown size={24} />
          </div>
          <div>
            <div className="stat-label">You Owe</div>
            <div className="stat-value" style={{ color: 'var(--danger)' }}>
              -{formatCurrency(stats.youOwe || 0, user?.defaultCurrency || 'USD')}
            </div>
            <div className="stat-change" style={{ color: 'var(--text-muted)' }}>
              Pending trip shares
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <div className="stat-label">Net Balance</div>
            <div className="stat-value" style={{ color: (stats.netBalance || 0) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
              {(stats.netBalance || 0) >= 0 ? '+' : ''}{formatCurrency(stats.netBalance || 0, user?.defaultCurrency || 'USD')}
            </div>
            <div className="stat-change" style={{ color: 'var(--text-muted)' }}>
              Overall balance
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Layout: Active Trips & Spending Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Left Column: Active Trips & Recent Expenses */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Active Trips Section */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plane size={20} color="var(--primary-light)" /> Your Travel Trips
              </h2>
              <Link to="/trips" className="btn btn-ghost btn-sm" style={{ gap: '4px' }}>
                View All <ChevronRight size={16} />
              </Link>
            </div>

            {recentTrips.length === 0 ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', background: 'var(--bg-main)', borderRadius: '14px', border: '1px solid var(--border)' }}>
                <Plane size={36} color="var(--primary-light)" style={{ margin: '0 auto 0.75rem auto' }} />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>No Trips Yet</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0.25rem 0 1rem 0' }}>
                  Create your first trip to start splitting expenses with friends!
                </p>
                <button className="btn btn-primary btn-sm" onClick={() => setIsAddTripOpen(true)}>
                  <Plus size={16} /> Create Trip Now
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {recentTrips.map((trip) => {
                  const budgetPct = trip.budget > 0 ? Math.round(((trip.totalExpenses || 0) / trip.budget) * 100) : 0;
                  const budgetColor = getBudgetColor(budgetPct);

                  return (
                    <div
                      key={trip._id}
                      onClick={() => navigate(`/trips/${trip._id}`)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1.25rem',
                        padding: '1rem',
                        borderRadius: '14px',
                        background: 'var(--bg-card-hover)',
                        border: '1px solid var(--border-color)',
                        cursor: 'pointer'
                      }}
                      className="hover-card"
                    >
                      <img
                        src={trip.coverImage || 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&q=80&w=1000'}
                        alt={trip.name}
                        style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover' }}
                      />

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px' }}>
                          <span className={`badge badge-${trip.status === 'active' ? 'active' : trip.status === 'upcoming' ? 'upcoming' : 'completed'}`}>
                            {trip.status ? trip.status.toUpperCase() : 'ACTIVE'}
                          </span>
                          {trip.location && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{trip.location}</span>}
                        </div>

                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 4px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {trip.name}
                        </h3>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Calendar size={14} /> {formatDate(trip.startDate)} {trip.endDate ? `- ${formatDate(trip.endDate)}` : ''}
                        </p>

                        {/* Budget Progress Bar */}
                        {trip.budget > 0 && (
                          <div style={{ marginTop: '0.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px' }}>
                              <span>Spent: <strong>{formatCurrency(trip.totalExpenses, trip.currency)}</strong></span>
                              <span>Budget: <strong>{formatCurrency(trip.budget, trip.currency)}</strong></span>
                            </div>
                            <div style={{ height: '5px', width: '100%', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${Math.min(budgetPct, 100)}%`, height: '100%', background: budgetColor, borderRadius: '3px' }} />
                            </div>
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ChevronRight size={20} color="var(--text-muted)" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Expenses List */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CreditCard size={20} color="var(--accent)" /> Recent Expenses
              </h2>
            </div>

            {recentExpenses.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No recent expenses recorded yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {recentExpenses.map((exp) => {
                  const catInfo = getCategoryInfo(exp.category);
                  return (
                    <div
                      key={exp._id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.85rem 1rem',
                        borderRadius: '12px',
                        background: 'var(--bg-card-hover)',
                        border: '1px solid var(--border-color)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <div className="flex-center" style={{ width: '42px', height: '42px', borderRadius: '12px', background: `${catInfo.color}20`, fontSize: '1.2rem' }}>
                          {catInfo.icon}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{exp.title}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Paid by <strong style={{ color: 'var(--text-main)' }}>{exp.paidBy?.name || 'Member'}</strong> • {formatDate(exp.date)}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-main)' }}>
                          {formatCurrency(exp.amount, exp.currency || 'USD')}
                        </div>
                        <span className="badge badge-primary" style={{ fontSize: '0.7rem', textTransform: 'capitalize' }}>
                          {exp.splitType} Split
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Analytics Pie Chart & Quick Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Category Spending Breakdown Chart */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Spending by Category
            </h3>

            {categorySummary.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                No category expense data yet.
              </div>
            ) : (
              <>
                <div style={{ width: '100%', height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={categorySummary}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {categorySummary.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value, user?.defaultCurrency || 'USD')} />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>

                {/* Category Legend */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                  {categorySummary.map((cat) => (
                    <div key={cat.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: cat.color }} />
                        <span style={{ color: 'var(--text-muted)' }}>{cat.name}</span>
                      </div>
                      <span style={{ fontWeight: 600 }}>{formatCurrency(cat.value, user?.defaultCurrency || 'USD')}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Add Trip Modal */}
      <AddTripModal
        isOpen={isAddTripOpen}
        onClose={() => setIsAddTripOpen(false)}
        onAddTrip={handleTripCreated}
      />
    </div>
  );
};

export default Dashboard;
