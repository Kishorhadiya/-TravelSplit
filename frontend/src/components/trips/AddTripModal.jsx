import React, { useState } from 'react';
import { X, Plane, MapPin, Sparkles } from 'lucide-react';
import { CURRENCIES } from '../../utils/constants';
import { tripService } from '../../services';
import toast from 'react-hot-toast';

const AddTripModal = ({ isOpen, onClose, onAddTrip }) => {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    startDate: '',
    endDate: '',
    currency: 'INR',
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.location || !formData.startDate || !formData.endDate) {
      toast.error('Please complete all required fields (*)');
      return;
    }

    setLoading(true);
    try {
      const { data } = await tripService.create(formData);
      if (data?.success) {
        toast.success(`Trip "${formData.name}" created successfully! ✈️`);
        if (onAddTrip) onAddTrip(data.data);
        onClose();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create trip';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="flex-center" style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary-light)' }}>
              <Plane size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Plan a New Trip</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Create a travel group & start splitting expenses</p>
            </div>
          </div>
          <button className="btn btn-icon btn-ghost" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label className="form-label">Trip Name *</label>
            <input
              type="text"
              name="name"
              className="form-control"
              placeholder="e.g. Goa Beach Bash 🌴"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="form-label">Destination / Location *</label>
              <div style={{ position: 'relative' }}>
                <MapPin size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  name="location"
                  className="form-control"
                  style={{ paddingLeft: '42px' }}
                  placeholder="e.g. Goa, India"
                  value={formData.location}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div>
              <label className="form-label">Primary Currency</label>
              <select name="currency" className="form-control" value={formData.currency} onChange={handleChange}>
                {Object.keys(CURRENCIES).map((c) => (
                  <option key={c} value={c}>{CURRENCIES[c].code} ({CURRENCIES[c].symbol}) - {CURRENCIES[c].name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="form-label">Start Date *</label>
              <input
                type="date"
                name="startDate"
                className="form-control"
                value={formData.startDate}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="form-label">End Date *</label>
              <input
                type="date"
                name="endDate"
                className="form-control"
                value={formData.endDate}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="modal-footer" style={{ marginTop: '1rem', padding: 0, border: 'none' }}>
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Sparkles size={18} />
              {loading ? 'Creating Trip...' : 'Create Trip'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTripModal;
