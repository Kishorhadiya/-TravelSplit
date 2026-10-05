import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Plane, Calendar, MapPin, DollarSign, Plus, CheckCircle,
  UserPlus, Download, Trash2, Edit3, PieChart, CreditCard,
  Users, AlertTriangle, FileText, Check, ChevronLeft, Link as LinkIcon,
  Share2, MessageCircle
} from 'lucide-react';
import { tripService, expenseService, balanceService, settlementService } from '../../services';
import { formatCurrency, formatDate, getCategoryInfo, getBudgetColor } from '../../utils/helpers';
import AddExpenseModal from '../../components/expenses/AddExpenseModal';
import SettleUpModal from '../../components/settlements/SettleUpModal';
import ShareTripModal from '../../components/trips/ShareTripModal';
import { ResponsiveContainer, PieChart as RePieChart, Pie, Cell, Tooltip } from 'recharts';
import toast from 'react-hot-toast';

const TripDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [memberBalances, setMemberBalances] = useState([]);
  const [simplifiedDebts, setSimplifiedDebts] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('overview');
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isSettleUpOpen, setIsSettleUpOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [suggestedSettlement, setSuggestedSettlement] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');

  const fetchTripDetails = useCallback(async () => {
    setLoading(true);
    try {
      const [tripRes, expRes, balRes, simpRes, setRes] = await Promise.all([
        tripService.getById(id),
        expenseService.getAll(id),
        balanceService.getBalances(id),
        balanceService.getSimplifiedBalances(id),
        settlementService.getAll(id),
      ]);

      if (tripRes.data?.success) setTrip(tripRes.data.data);
      if (expRes.data?.success) setExpenses(expRes.data.data || []);
      if (balRes.data?.success) setMemberBalances(balRes.data.data || []);
      if (simpRes.data?.success) setSimplifiedDebts(simpRes.data.data || []);
      if (setRes.data?.success) setSettlements(setRes.data.data || []);
    } catch (err) {
      console.error('Failed to load trip details:', err);
      toast.error('Failed to load trip information');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTripDetails();
  }, [fetchTripDetails]);

  // Recalculate totals
  const totalExpensesAmount = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  const budgetPct = trip?.budget > 0 ? Math.round((totalExpensesAmount / trip.budget) * 100) : 0;

  // Copy Invite Link to Clipboard
  const handleCopyInviteLink = () => {
    if (!trip) return;
    const joinUrl = `${window.location.origin}/trips/join/${trip._id}`;
    navigator.clipboard.writeText(joinUrl);
    toast.success('Trip join link copied to clipboard! 📋 Share it with friends.');
  };

  // Handle Add/Edit Expense complete callback
  const handleSaveExpense = () => {
    fetchTripDetails();
  };

  // Handle Delete Expense
  const handleDeleteExpense = async (expId) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await expenseService.delete(expId);
        toast.success('Expense deleted');
        fetchTripDetails();
      } catch (err) {
        toast.error('Failed to delete expense');
      }
    }
  };

  // Handle Settlement complete callback
  const handleSaveSettlement = () => {
    fetchTripDetails();
  };

  // Invite Member via email
  const handleInviteMember = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;
    try {
      await tripService.addMember(id, { email: inviteEmail });
      toast.success(`Member ${inviteEmail} added to trip! ✉️`);
      setInviteEmail('');
      fetchTripDetails();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member');
    }
  };

  // Export CSV Report Function
  const handleExportCSV = () => {
    if (!trip) return;
    let csv = `Trip Title,${trip.name}\nLocation,${trip.location || ''}\nBudget,${trip.budget} ${trip.currency}\nTotal Expenses,${totalExpensesAmount} ${trip.currency}\n\n`;
    csv += `Title,Category,Amount,Paid By,Date,Split Type\n`;

    expenses.forEach((e) => {
      csv += `"${e.title}","${e.category}",${e.amount},"${e.paidBy?.name || ''}",${e.date},${e.splitType}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${trip.name.replace(/\s+/g, '_')}_Expense_Report.csv`;
    a.click();
    toast.success('Expense report exported as CSV! 📊');
  };

  // Category Pie Data
  const categoryMap = {};
  expenses.forEach((exp) => {
    categoryMap[exp.category] = (categoryMap[exp.category] || 0) + exp.amount;
  });
  const categoryChartData = Object.keys(categoryMap).map((cat) => ({
    name: cat,
    value: categoryMap[cat],
    color: getCategoryInfo(cat).color,
  }));

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '60vh', flexDirection: 'column', gap: '1rem' }}>
        <div className="loading-spinner"></div>
        <p style={{ color: 'var(--text-muted)' }}>Loading trip details...</p>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="card flex-center" style={{ padding: '4rem', flexDirection: 'column', gap: '1rem' }}>
        <h3>Trip Not Found</h3>
        <button className="btn btn-primary" onClick={() => navigate('/trips')}>Back to Trips</button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Navigation & Back Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/trips')}>
          <ChevronLeft size={18} /> Back to Trips
        </button>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-outline" onClick={() => setIsShareModalOpen(true)}>
            <Share2 size={18} /> Share Join Link 🔗
          </button>
          <button className="btn btn-outline" onClick={handleExportCSV}>
            <Download size={18} /> Export Report
          </button>
          <button className="btn btn-primary" onClick={() => { setEditingExpense(null); setIsAddExpenseOpen(true); }}>
            <Plus size={18} /> Add Expense
          </button>
        </div>
      </div>

      {/* Hero Trip Cover Header */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
        <div style={{ height: '220px', position: 'relative' }}>
          <img src={trip.coverImage || 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&q=80&w=1000'} alt={trip.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.4) 60%)' }} />

          <div style={{ position: 'absolute', bottom: '1.5rem', left: '2rem', right: '2rem', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '6px' }}>
                <span className={`badge badge-${trip.status === 'active' ? 'active' : 'upcoming'}`}>
                  {trip.status ? trip.status.toUpperCase() : 'ACTIVE'}
                </span>
              </div>

              <h1 style={{ fontSize: '2.2rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                {trip.name}
              </h1>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginTop: '0.35rem', fontSize: '0.9rem', opacity: 0.9 }}>
                {trip.location && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <MapPin size={16} /> {trip.location}
                  </span>
                )}
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Calendar size={16} /> {formatDate(trip.startDate)} {trip.endDate ? `- ${formatDate(trip.endDate)}` : ''}
                </span>
              </div>
            </div>

            {/* Trip Members Stack */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255, 255, 255, 0.12)', backdropFilter: 'blur(10px)', padding: '0.5rem 1rem', borderRadius: '12px' }}>
              <div style={{ display: 'flex' }}>
                {trip.members?.map((m, i) => (
                  <img
                    key={i}
                    src={m.user?.profileImage || 'https://via.placeholder.com/30'}
                    alt={m.user?.name}
                    title={m.user?.name}
                    style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid #fff', marginLeft: i > 0 ? '-10px' : 0 }}
                  />
                ))}
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{trip.members?.length || 0} Members</span>
            </div>
          </div>
        </div>

        {/* Budget Summary Bar inside Banner */}
        <div style={{ padding: '1.25rem 2rem', background: 'var(--bg-card)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Trip Spent</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary-light)' }}>
              {formatCurrency(totalExpensesAmount, trip.currency)}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Target Budget</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>
              {trip.budget > 0 ? formatCurrency(trip.budget, trip.currency) : 'No budget set'}
            </div>
          </div>

          {trip.budget > 0 && (
            <>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Remaining Budget</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: (trip.budget - totalExpensesAmount) < 0 ? 'var(--danger)' : 'var(--success)' }}>
                  {formatCurrency(trip.budget - totalExpensesAmount, trip.currency)}
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  <span>Budget Usage</span>
                  <span style={{ fontWeight: 700, color: getBudgetColor(budgetPct) }}>{budgetPct}%</span>
                </div>
                <div style={{ height: '8px', width: '100%', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(budgetPct, 100)}%`, height: '100%', background: getBudgetColor(budgetPct), borderRadius: '4px' }} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Trip Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', overflowX: 'auto' }}>
        {[
          { id: 'overview', label: 'Overview & Charts', icon: PieChart },
          { id: 'expenses', label: `Expenses (${expenses.length})`, icon: CreditCard },
          { id: 'balances', label: 'Balances & Debt Simplification', icon: DollarSign },
          { id: 'members', label: `Members (${trip.members?.length || 0})`, icon: Users },
          { id: 'export', label: 'Export & Report', icon: FileText },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              className={`btn ${activeTab === t.id ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab(t.id)}
              style={{ fontWeight: 600, gap: '0.5rem' }}
            >
              <Icon size={18} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
          {/* Category Pie Chart */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PieChart size={20} color="var(--primary-light)" /> Category Expense Breakdown
            </h3>

            {categoryChartData.length > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                <div style={{ width: 220, height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={categoryChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value, trip.currency)} />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {categoryChartData.map((cat) => (
                    <div key={cat.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'var(--bg-card-hover)', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: cat.color }} />
                        <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{cat.name}</span>
                      </div>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                        {formatCurrency(cat.value, trip.currency)} ({totalExpensesAmount > 0 ? Math.round((cat.value / totalExpensesAmount) * 100) : 0}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No expenses recorded yet.
              </div>
            )}
          </div>

          {/* Member Payment Leaderboard */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={20} color="var(--accent)" /> Member Payment Summary
            </h3>

            {memberBalances.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No balance calculations yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {memberBalances.map((mb) => (
                  <div key={mb.user?._id || Math.random()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', borderRadius: '12px', background: 'var(--bg-card-hover)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <img src={mb.user?.profileImage || 'https://via.placeholder.com/36'} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{mb.user?.name || 'Member'}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Paid {formatCurrency(mb.paid, trip.currency)} • Owed {formatCurrency(mb.owed, trip.currency)}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: mb.netBalance >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                        {mb.netBalance >= 0 ? `+${formatCurrency(mb.netBalance, trip.currency)}` : formatCurrency(mb.netBalance, trip.currency)}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: mb.netBalance >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                        {mb.netBalance >= 0 ? 'Gets back' : 'Owes'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: EXPENSES LIST */}
      {activeTab === 'expenses' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>All Recorded Expenses</h2>
            <button className="btn btn-primary" onClick={() => { setEditingExpense(null); setIsAddExpenseOpen(true); }}>
              <Plus size={18} /> Add Expense
            </button>
          </div>

          <div className="card" style={{ padding: '0.5rem', overflow: 'hidden' }}>
            {expenses.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No expenses added yet. Click "Add Expense" to get started!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {expenses.map((exp, idx) => {
                  const catInfo = getCategoryInfo(exp.category);
                  return (
                    <div
                      key={exp._id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '1rem 1.25rem',
                        borderBottom: idx < expenses.length - 1 ? '1px solid var(--border-color)' : 'none',
                        transition: 'background 0.2s ease'
                      }}
                      className="hover-card"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div className="flex-center" style={{ width: '48px', height: '48px', borderRadius: '14px', background: `${catInfo.color}20`, fontSize: '1.3rem' }}>
                          {catInfo.icon}
                        </div>

                        <div>
                          <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {exp.title}
                            {exp.receipt && (
                              <a
                                href={exp.receipt}
                                target="_blank"
                                rel="noreferrer"
                                style={{ fontSize: '0.75rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(99, 102, 241, 0.2)', color: 'var(--primary-light)' }}
                              >
                                📄 Receipt
                              </a>
                            )}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            Paid by <strong style={{ color: 'var(--text-main)' }}>{exp.paidBy?.name || 'Member'}</strong> • {formatDate(exp.date)} • Split: <span style={{ textTransform: 'capitalize' }}>{exp.splitType}</span>
                          </div>
                          {exp.notes && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '2px' }}>
                              "{exp.notes}"
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-main)' }}>
                            {formatCurrency(exp.amount, trip.currency)}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <button className="btn btn-icon btn-ghost btn-sm" onClick={() => { setEditingExpense(exp); setIsAddExpenseOpen(true); }}>
                            <Edit3 size={16} />
                          </button>
                          <button className="btn btn-icon btn-ghost btn-sm" onClick={() => handleDeleteExpense(exp._id)} style={{ color: 'var(--danger)' }}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: BALANCES & DEBT SIMPLIFICATION */}
      {activeTab === 'balances' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {/* Minimum Debt Simplification Card */}
          <div className="card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(99, 102, 241, 0.05) 100%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  Debt Simplification Overview
                </h3>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                  Optimized direct repayments to settle all trip debts.
                </p>
              </div>

              <button className="btn btn-success" onClick={() => { setSuggestedSettlement(null); setIsSettleUpOpen(true); }}>
                <CheckCircle size={18} /> Record Settlement
              </button>
            </div>

            {simplifiedDebts.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '14px', color: 'var(--success)' }}>
                <CheckCircle size={32} style={{ margin: '0 auto 0.5rem auto' }} />
                <h4 style={{ margin: 0, fontWeight: 700 }}>All Settled Up! 🎉</h4>
                <p style={{ margin: 0, fontSize: '0.9rem' }}>No member owes any money in this trip.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                {simplifiedDebts.map((debt, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '1.25rem',
                      borderRadius: '14px',
                      background: 'var(--bg-main)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <img src={debt.from?.profileImage || 'https://via.placeholder.com/36'} alt="" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{debt.from?.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>owes {debt.to?.name}</div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--primary-light)' }}>
                        {formatCurrency(debt.amount, trip.currency)}
                      </div>
                      <button
                        className="btn btn-xs btn-outline"
                        style={{ marginTop: '4px' }}
                        onClick={() => {
                          setSuggestedSettlement(debt);
                          setIsSettleUpOpen(true);
                        }}
                      >
                        Settle Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Settlement History Log */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 1rem 0' }}>Settlement History</h3>

            {settlements.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No settlements recorded yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {settlements.map((set) => (
                  <div key={set._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: 'var(--bg-card-hover)', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div className="flex-center" style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--success-light)', color: 'var(--success)' }}>
                        <Check size={18} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                          {set.from?.name} paid {set.to?.name}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Method: <strong style={{ textTransform: 'uppercase' }}>{set.paymentMethod}</strong> • {formatDate(set.createdAt || set.paidAt)}
                        </div>
                      </div>
                    </div>

                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--success)' }}>
                      +{formatCurrency(set.amount, trip.currency)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: MEMBERS */}
      {activeTab === 'members' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 1.25rem 0' }}>Trip Members ({trip.members?.length || 0})</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {trip.members?.map((m) => (
                <div key={m.user?._id || Math.random()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg-card-hover)', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <img src={m.user?.profileImage || 'https://via.placeholder.com/40'} alt="" style={{ width: '44px', height: '44px', borderRadius: '50%' }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1rem' }}>{m.user?.name || 'Member'}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{m.user?.email}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span className={`badge ${m.role === 'owner' ? 'badge-primary' : 'badge-completed'}`} style={{ textTransform: 'capitalize' }}>
                      {m.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Share & Invite Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Share Join Link Box */}
            <div className="card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(99, 102, 241, 0.08) 100%)' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <LinkIcon size={20} color="var(--primary-light)" /> Shareable Trip Link
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                Send this link to your friends on WhatsApp or Email. Anyone with the link can join this trip directly with 1-click.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button className="btn btn-primary" onClick={() => setIsShareModalOpen(true)} style={{ flex: 1, justifyContent: 'center' }}>
                  <Share2 size={18} /> Share Join Link 🔗
                </button>
                <button
                  className="btn"
                  onClick={() => {
                    const joinUrl = `${window.location.origin}/trips/join/${trip._id}`;
                    const shareText = `Hey! Join our travel trip "${trip.name}" on TravelSplit to manage and split expenses together:\n${joinUrl}`;
                    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
                  }}
                  style={{ background: '#25D366', color: '#fff', border: 'none', justifyContent: 'center', fontWeight: 600, gap: '0.5rem' }}
                >
                  <MessageCircle size={18} /> WhatsApp
                </button>
              </div>
            </div>

            {/* Invite Member via Email Box */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserPlus size={20} color="var(--primary-light)" /> Add Member by Email
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                Enter email address of an existing user to add them directly.
              </p>

              <form onSubmit={handleInviteMember} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label className="form-label">Member Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="user@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-outline" style={{ justifyContent: 'center' }}>
                  Add Member via Email ✉️
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: EXPORT & REPORT */}
      {activeTab === 'export' && (
        <div className="card" style={{ padding: '2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
          <div className="flex-center" style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary-light)' }}>
            <FileText size={32} />
          </div>

          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Export Financial Summary</h2>
            <p style={{ color: 'var(--text-muted)', maxWidth: '500px', margin: '0.5rem auto 0 auto' }}>
              Export a complete CSV report containing all recorded expenses, split methods, payers, and dates for {trip.name}.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <button className="btn btn-primary btn-lg" onClick={handleExportCSV}>
              <Download size={20} /> Download CSV Spreadsheet
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => { setIsAddExpenseOpen(false); setEditingExpense(null); }}
        trip={trip}
        onAddExpense={handleSaveExpense}
        initialData={editingExpense}
      />

      <SettleUpModal
        isOpen={isSettleUpOpen}
        onClose={() => setIsSettleUpOpen(false)}
        trip={trip}
        suggestedSettlement={suggestedSettlement}
        onSettle={handleSaveSettlement}
      />

      <ShareTripModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        trip={trip}
      />
    </div>
  );
};

export default TripDetail;
