import React, { useState } from 'react';
import { X, CheckCircle, ArrowRight } from 'lucide-react';
import { PAYMENT_METHODS, CURRENCIES } from '../../utils/constants';
import { settlementService } from '../../services';
import toast from 'react-hot-toast';

const SettleUpModal = ({ isOpen, onClose, trip, suggestedSettlement, onSettle }) => {
  const members = trip?.members?.map((m) => m.user) || [];

  const [fromId, setFromId] = useState(suggestedSettlement?.from?._id || members[0]?._id || '');
  const [toId, setToId] = useState(suggestedSettlement?.to?._id || members[1]?._id || '');
  const [amount, setAmount] = useState(suggestedSettlement?.amount || '');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !trip) return null;

  const payerUser = members.find((m) => m._id === fromId) || { name: 'Payer' };
  const receiverUser = members.find((m) => m._id === toId) || { name: 'Receiver' };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const settleAmount = parseFloat(amount);
    if (!settleAmount || settleAmount <= 0) {
      toast.error('Please enter a valid settlement amount');
      return;
    }
    if (fromId === toId) {
      toast.error('Payer and Receiver must be different members');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        from: fromId,
        to: toId,
        amount: settleAmount,
        paymentMethod,
        notes: notes || `Settled debt via ${paymentMethod.toUpperCase()}`,
      };

      const { data } = await settlementService.create(trip._id, payload);
      if (data?.success) {
        toast.success(`Settlement recorded successfully! 🎉`);
        if (onSettle) onSettle();
        onClose();
      }
    } catch (err) {
      console.error('Failed to create settlement:', err);
      toast.error(err.response?.data?.message || 'Failed to record settlement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="flex-center" style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)' }}>
              <CheckCircle size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Record Settlement</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Settle debts & clear trip balances</p>
            </div>
          </div>
          <button className="btn btn-icon btn-ghost" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Visual Settlement Flow Header */}
          <div style={{ background: 'var(--bg-card-hover)', padding: '1rem', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-around', border: '1px solid var(--border-color)' }}>
            <div style={{ textAlign: 'center' }}>
              <img src={payerUser.profileImage || 'https://via.placeholder.com/40'} alt="" style={{ width: '44px', height: '44px', borderRadius: '50%', marginBottom: '4px' }} />
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{payerUser.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>Payer</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
              <ArrowRight size={22} color="var(--primary-light)" />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-light)' }}>
                {CURRENCIES[trip?.currency || 'USD']?.symbol}{amount || '0'}
              </span>
            </div>

            <div style={{ textAlign: 'center' }}>
              <img src={receiverUser.profileImage || 'https://via.placeholder.com/40'} alt="" style={{ width: '44px', height: '44px', borderRadius: '50%', marginBottom: '4px' }} />
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{receiverUser.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--success)' }}>Receiver</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="form-label">Who is paying? (Payer)</label>
              <select className="form-control" value={fromId} onChange={(e) => setFromId(e.target.value)}>
                {members.map((m) => (
                  <option key={m._id} value={m._id}>{m.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Who is receiving? (Receiver)</label>
              <select className="form-control" value={toId} onChange={(e) => setToId(e.target.value)}>
                {members.map((m) => (
                  <option key={m._id} value={m._id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="form-label">Settlement Amount ({trip?.currency || 'USD'}) *</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 600 }}>
                {CURRENCIES[trip?.currency || 'USD']?.symbol || '$'}
              </span>
              <input
                type="number"
                step="0.01"
                className="form-control"
                style={{ paddingLeft: '32px', fontSize: '1.1rem', fontWeight: 700 }}
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="form-label">Payment Method</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
              {PAYMENT_METHODS.map((pm) => (
                <button
                  type="button"
                  key={pm.value}
                  className={`btn ${paymentMethod === pm.value ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setPaymentMethod(pm.value)}
                  style={{ padding: '0.5rem', fontSize: '0.85rem' }}
                >
                  {pm.icon} {pm.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="form-label">Reference / Note</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Paid via UPI / GPay"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="modal-footer" style={{ marginTop: '0.5rem', padding: 0, border: 'none' }}>
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-success" disabled={loading}>
              <CheckCircle size={18} />
              {loading ? 'Recording...' : 'Confirm Settlement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettleUpModal;
