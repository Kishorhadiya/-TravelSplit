import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services';
import { User, Mail, RefreshCw, Check } from 'lucide-react';
import { CURRENCIES } from '../../utils/constants';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [defaultCurrency, setDefaultCurrency] = useState(user?.defaultCurrency || 'USD');
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // Currency Converter Widget state
  const [calcAmount, setCalcAmount] = useState('100');
  const [calcFrom, setCalcFrom] = useState('USD');
  const [calcTo, setCalcTo] = useState('EUR');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setDefaultCurrency(user.defaultCurrency || 'USD');
    }
  }, [user]);

  // Exchange rates relative to 1 USD
  const EXCHANGE_RATES = {
    USD: 1.0,
    EUR: 0.92,
    INR: 83.5,
    GBP: 0.79,
    AED: 3.67,
  };

  const convertedResult = ((parseFloat(calcAmount) || 0) * (EXCHANGE_RATES[calcTo] / EXCHANGE_RATES[calcFrom])).toFixed(2);

  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('defaultCurrency', defaultCurrency);
      if (profileImageFile) {
        formData.append('profileImage', profileImageFile);
      }

      const { data } = await authService.updateProfile(formData);
      if (data?.success) {
        updateUser(data.data);
        toast.success('Profile updated successfully! ✨');
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: '900px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
          Account Settings & Profile ⚙️
        </h1>
        <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)' }}>
          Manage your personal details, default currency & trip preferences
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
        {/* Profile Details Form */}
        <div className="card" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={20} color="var(--primary-light)" /> Profile Information
          </h3>

          <form onSubmit={handleSubmitProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '0.5rem' }}>
              <img
                src={user?.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300'}
                alt=""
                style={{ width: '70px', height: '70px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary-light)' }}
              />
              <div>
                <label className="form-label" style={{ marginBottom: '4px' }}>Profile Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  className="form-control"
                  onChange={(e) => setProfileImageFile(e.target.files[0])}
                />
              </div>
            </div>

            <div>
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-control"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="form-label">Email Address (Read-Only)</label>
              <input
                type="email"
                className="form-control"
                value={email}
                disabled
                style={{ opacity: 0.7 }}
              />
            </div>

            <div>
              <label className="form-label">Default Preferred Currency</label>
              <select className="form-control" value={defaultCurrency} onChange={(e) => setDefaultCurrency(e.target.value)}>
                {Object.keys(CURRENCIES).map((c) => (
                  <option key={c} value={c}>{CURRENCIES[c].code} ({CURRENCIES[c].symbol}) - {CURRENCIES[c].name}</option>
                ))}
              </select>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '0.5rem', justifyContent: 'center' }}>
              <Check size={18} /> {loading ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>

        {/* Currency Converter Tool Widget */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(99, 102, 241, 0.08) 100%)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <RefreshCw size={18} color="var(--primary-light)" /> Live Currency Converter
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label">Amount</label>
                <input
                  type="number"
                  className="form-control"
                  value={calcAmount}
                  onChange={(e) => setCalcAmount(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="form-label">From</label>
                  <select className="form-control" value={calcFrom} onChange={(e) => setCalcFrom(e.target.value)}>
                    {Object.keys(CURRENCIES).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">To</label>
                  <select className="form-control" value={calcTo} onChange={(e) => setCalcTo(e.target.value)}>
                    {Object.keys(CURRENCIES).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--border-color)', marginTop: '0.5rem' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Converted Equivalent</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary-light)', marginTop: '4px' }}>
                  {CURRENCIES[calcTo]?.symbol}{convertedResult} {calcTo}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
