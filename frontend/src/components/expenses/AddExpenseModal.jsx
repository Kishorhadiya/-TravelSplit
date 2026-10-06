import React, { useState, useEffect } from 'react';
import { X, Receipt, IndianRupee, Calculator, UserCheck } from 'lucide-react';
import { CATEGORIES, SPLIT_TYPES, CURRENCIES } from '../../utils/constants';
import { formatCurrency } from '../../utils/helpers';
import { expenseService } from '../../services';
import toast from 'react-hot-toast';

const AddExpenseModal = ({ isOpen, onClose, trip, onAddExpense, initialData = null }) => {
  const members = trip?.members?.map((m) => m.user) || [];

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paidBy, setPaidBy] = useState(members[0]?._id || '');
  const [personalUser, setPersonalUser] = useState(members[0]?._id || '');
  const [splitType, setSplitType] = useState('equal');
  const [notes, setNotes] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // Custom split values map: userId -> { amount, percentage, shares }
  const [customSplits, setCustomSplits] = useState({});

  useEffect(() => {
    if (members.length > 0 && !paidBy) {
      setPaidBy(members[0]._id);
      setPersonalUser(members[0]._id);
    }
  }, [members, paidBy]);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setAmount(initialData.amount || '');
      setCategory(initialData.category || 'Food');
      setDate(initialData.date ? initialData.date.split('T')[0] : new Date().toISOString().split('T')[0]);
      setPaidBy(initialData.paidBy?._id || initialData.paidBy || members[0]?._id || '');
      setSplitType(initialData.splitType || 'equal');
      setNotes(initialData.notes || '');

      // Check if personal split
      if (initialData.splitType === 'personal' && initialData.splitDetails) {
        const target = initialData.splitDetails.find(d => (parseFloat(d.amount) || 0) > 0);
        if (target) setPersonalUser(target.user?._id || target.user);
      }
    } else {
      setTitle('');
      setAmount('');
      setCategory('Food');
      setDate(new Date().toISOString().split('T')[0]);
      setPaidBy(members[0]?._id || '');
      setPersonalUser(members[0]?._id || '');
      setSplitType('equal');
      setNotes('');
      setReceiptFile(null);
    }
  }, [initialData, isOpen, trip]);

  useEffect(() => {
    if (members.length > 0) {
      const initial = {};
      const totalNum = parseFloat(amount) || 0;
      const equalShare = totalNum > 0 ? (totalNum / members.length).toFixed(2) : 0;
      const targetPersonal = personalUser || paidBy || members[0]?._id;

      members.forEach((m) => {
        if (splitType === 'personal') {
          const isTarget = m._id === targetPersonal;
          initial[m._id] = {
            amount: isTarget ? totalNum : 0,
            percentage: isTarget ? 100 : 0,
            shares: isTarget ? 1 : 0,
          };
        } else {
          initial[m._id] = {
            amount: equalShare,
            percentage: (100 / members.length).toFixed(1),
            shares: 1,
          };
        }
      });
      setCustomSplits(initial);
    }
  }, [members.length, amount, splitType, personalUser, paidBy]);

  if (!isOpen || !trip) return null;

  const handleCustomSplitChange = (userId, field, val) => {
    setCustomSplits((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [field]: parseFloat(val) || 0,
      }
    }));
  };

  const validateSplits = () => {
    const totalAmount = parseFloat(amount);
    if (!title) { toast.error('Please enter expense title'); return false; }
    if (!totalAmount || totalAmount <= 0) { toast.error('Please enter a valid amount'); return false; }
    if (!paidBy) { toast.error('Please select who paid for the expense'); return false; }

    if (splitType === 'exact' || splitType === 'unequal') {
      const sumExact = Object.values(customSplits).reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
      if (Math.abs(sumExact - totalAmount) > 0.5) {
        toast.error(`Split amounts (${sumExact.toFixed(2)}) must equal total expense (${totalAmount})`);
        return false;
      }
    } else if (splitType === 'percentage') {
      const sumPct = Object.values(customSplits).reduce((sum, item) => sum + (parseFloat(item.percentage) || 0), 0);
      if (Math.abs(sumPct - 100) > 0.5) {
        toast.error(`Percentages (${sumPct.toFixed(1)}%) must equal 100%`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateSplits()) return;

    setLoading(true);
    try {
      const participantIds = members.map((m) => m._id);
      const splitDetailsArray = members.map((m) => {
        const item = customSplits[m._id] || {};
        return {
          user: m._id,
          amount: parseFloat(item.amount) || 0,
          percentage: parseFloat(item.percentage) || 0,
          shares: parseFloat(item.shares) || 1,
        };
      });

      const formData = new FormData();
      formData.append('title', title);
      formData.append('amount', amount);
      formData.append('category', category);
      formData.append('paidBy', paidBy);
      formData.append('splitType', splitType);
      formData.append('date', date);
      formData.append('notes', notes);
      participantIds.forEach((id) => formData.append('participants', id));
      formData.append('splitDetails', JSON.stringify(splitDetailsArray));

      if (receiptFile) {
        formData.append('receipt', receiptFile);
      }

      if (initialData?._id) {
        await expenseService.update(initialData._id, formData);
        toast.success('Expense updated! 💳');
      } else {
        await expenseService.create(trip._id, formData);
        toast.success('Expense recorded successfully! 💳');
      }

      if (onAddExpense) onAddExpense();
      onClose();
    } catch (err) {
      console.error('Failed to save expense:', err);
      toast.error(err.response?.data?.message || 'Failed to save expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="flex-center" style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary-light)' }}>
              <Receipt size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
                {initialData ? 'Edit Expense' : 'Add Expense to Trip'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{trip?.name}</p>
            </div>
          </div>
          <button className="btn btn-icon btn-ghost" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Title & Amount */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
            <div>
              <label className="form-label">Expense Description *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Dinner at Sunset Grill"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="form-label">Total Amount ({trip?.currency || 'INR'}) *</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {CURRENCIES[trip?.currency || 'INR']?.symbol || '₹'}
                </span>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  style={{ paddingLeft: '32px' }}
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Category, Date & Paid By */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="form-label">Category</label>
              <select className="form-control" value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((cat) => (
                  <option key={cat.name} value={cat.name}>{cat.icon} {cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Date</label>
              <input
                type="date"
                className="form-control"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div>
              <label className="form-label">Paid By *</label>
              <select className="form-control" value={paidBy} onChange={(e) => setPaidBy(e.target.value)} required>
                {members.map((m) => (
                  <option key={m._id} value={m._id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Split Type Selector */}
          <div>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Split Method</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Choose how to divide the cost</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.5rem' }}>
              {SPLIT_TYPES.filter(st => st.value !== 'unequal').map((st) => (
                <button
                  type="button"
                  key={st.value}
                  className={`btn ${splitType === st.value ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setSplitType(st.value)}
                  style={{ padding: '0.55rem 0.4rem', fontSize: '0.82rem', flexDirection: 'column', height: 'auto', gap: '2px', textAlign: 'center' }}
                >
                  <span style={{ fontWeight: 600 }}>{st.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Personal Expense Member Selector */}
          {splitType === 'personal' && (
            <div style={{ background: 'rgba(99, 102, 241, 0.12)', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
              <label className="form-label" style={{ fontWeight: 700, color: 'var(--primary-light)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <UserCheck size={18} /> Personal Expense For Which Member?
              </label>
              <select
                className="form-control"
                value={personalUser}
                onChange={(e) => setPersonalUser(e.target.value)}
                style={{ background: 'var(--bg-main)', fontWeight: 600 }}
              >
                {members.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name} {m._id === paidBy ? '(Payer)' : ''} - Charged 100% (₹{amount || 0})
                  </option>
                ))}
              </select>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '6px 0 0 0' }}>
                💡 Only this member is assigned the total expense. All other group members are set to <strong>₹0</strong>.
              </p>
            </div>
          )}

          {/* Dynamic Split Breakdown per Member */}
          <div style={{ background: 'var(--bg-card-hover)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Calculator size={16} color="var(--primary-light)" /> Split Breakdown per Member
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {splitType === 'personal' ? '1 member charged (others ₹0)' : `${members.length} member(s) involved`}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {members.map((m) => {
                const item = customSplits[m._id] || {};
                const currentTotal = parseFloat(amount) || 0;
                let calculatedShare = 0;

                if (splitType === 'equal') {
                  calculatedShare = currentTotal > 0 ? currentTotal / members.length : 0;
                } else if (splitType === 'personal') {
                  calculatedShare = m._id === (personalUser || paidBy || members[0]?._id) ? currentTotal : 0;
                } else if (splitType === 'exact') {
                  calculatedShare = parseFloat(item.amount) || 0;
                } else if (splitType === 'percentage') {
                  calculatedShare = (currentTotal * (parseFloat(item.percentage) || 0)) / 100;
                } else if (splitType === 'shares') {
                  const totalShares = Object.values(customSplits).reduce((s, i) => s + (parseFloat(i.shares) || 0), 0);
                  calculatedShare = totalShares > 0 ? (currentTotal * (parseFloat(item.shares) || 0)) / totalShares : 0;
                }

                const isPersonalTarget = splitType === 'personal' && m._id === (personalUser || paidBy || members[0]?._id);

                return (
                  <div
                    key={m._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.5rem 0.75rem',
                      background: isPersonalTarget ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-main)',
                      borderRadius: '8px',
                      border: isPersonalTarget ? '1px solid var(--primary-light)' : '1px solid transparent'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <img src={m.profileImage || 'https://via.placeholder.com/30'} alt={m.name} style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
                      <div>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{m.name}</span>
                        {isPersonalTarget && (
                          <span style={{ marginLeft: '6px', fontSize: '0.72rem', background: 'var(--primary)', color: '#fff', padding: '2px 6px', borderRadius: '4px' }}>
                            Personal 100%
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {splitType === 'exact' && (
                        <input
                          type="number"
                          step="0.01"
                          className="form-control"
                          style={{ width: '100px', padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
                          value={item.amount || ''}
                          onChange={(e) => handleCustomSplitChange(m._id, 'amount', e.target.value)}
                          placeholder="Amount"
                        />
                      )}
                      {splitType === 'percentage' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <input
                            type="number"
                            step="0.1"
                            className="form-control"
                            style={{ width: '80px', padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
                            value={item.percentage || ''}
                            onChange={(e) => handleCustomSplitChange(m._id, 'percentage', e.target.value)}
                            placeholder="%"
                          />
                          <span style={{ fontSize: '0.85rem' }}>%</span>
                        </div>
                      )}
                      {splitType === 'shares' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <input
                            type="number"
                            step="1"
                            className="form-control"
                            style={{ width: '70px', padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
                            value={item.shares || 1}
                            onChange={(e) => handleCustomSplitChange(m._id, 'shares', e.target.value)}
                            placeholder="Shares"
                          />
                          <span style={{ fontSize: '0.85rem' }}>share(s)</span>
                        </div>
                      )}

                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: '0.92rem',
                          minWidth: '70px',
                          textAlign: 'right',
                          color: splitType === 'personal' && !isPersonalTarget ? 'var(--text-muted)' : 'var(--primary-light)'
                        }}
                      >
                        {formatCurrency(calculatedShare, trip?.currency || 'INR')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notes & Receipt Attachment */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
            <div>
              <label className="form-label">Notes</label>
              <input
                type="text"
                className="form-control"
                placeholder="Optional details or items..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div>
              <label className="form-label">Attach Receipt</label>
              <input
                type="file"
                accept="image/*"
                className="form-control"
                onChange={(e) => setReceiptFile(e.target.files[0])}
              />
            </div>
          </div>

          <div className="modal-footer" style={{ marginTop: '0.5rem', padding: 0, border: 'none' }}>
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Receipt size={18} />
              {loading ? 'Saving...' : initialData ? 'Save Changes' : 'Record Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExpenseModal;
