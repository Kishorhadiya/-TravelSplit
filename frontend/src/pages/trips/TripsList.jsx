import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Plane, Calendar, ChevronRight, MapPin, Share2 } from 'lucide-react';
import { tripService } from '../../services';
import { formatCurrency, formatDate, getBudgetColor } from '../../utils/helpers';
import AddTripModal from '../../components/trips/AddTripModal';
import toast from 'react-hot-toast';

const TripsList = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddTripOpen, setIsAddTripOpen] = useState(false);
  const navigate = useNavigate();

  const fetchTrips = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeTab !== 'all') params.status = activeTab;
      if (searchQuery) params.search = searchQuery;

      const { data } = await tripService.getAll(params);
      if (data?.success) {
        setTrips(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch trips:', err);
      toast.error('Failed to load trips');
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const handleTripCreated = () => {
    fetchTrips();
  };

  const handleShareTrip = (e, trip) => {
    e.stopPropagation();
    const joinUrl = `${window.location.origin}/trips/join/${trip._id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(joinUrl);
      toast.success(`Trip join link for "${trip.name}" copied to clipboard! 📋`);
    } else {
      toast.error('Clipboard access not available');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
            Travel Trips Directory ✈️
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)' }}>
            Manage all your travel groups, budgets & trip expenses
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setIsAddTripOpen(true)}>
          <Plus size={18} />
          Create New Trip
        </button>
      </div>

      {/* Tabs & Search Filter Bar */}
      <div className="card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        {/* Status Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-main)', padding: '4px', borderRadius: '10px' }}>
          {['all', 'active', 'upcoming', 'completed'].map((tab) => (
            <button
              key={tab}
              className={`btn btn-sm ${activeTab === tab ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab(tab)}
              style={{ textTransform: 'capitalize', fontWeight: 600 }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, maxWidth: '400px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-control"
              style={{ paddingLeft: '38px', height: '40px' }}
              placeholder="Search by trip title or destination..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Trips Grid */}
      {loading ? (
        <div className="flex-center" style={{ minHeight: '40vh', flexDirection: 'column', gap: '1rem' }}>
          <div className="loading-spinner"></div>
          <p style={{ color: 'var(--text-muted)' }}>Loading trips...</p>
        </div>
      ) : trips.length === 0 ? (
        <div className="card flex-center" style={{ padding: '4rem 2rem', flexDirection: 'column', textAlign: 'center', gap: '1rem' }}>
          <div className="flex-center" style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary-light)' }}>
            <Plane size={32} />
          </div>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>No Trips Found</h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: 0 }}>
            No travel trips match your search filters. Create your first trip to start splitting expenses.
          </p>
          <button className="btn btn-primary" onClick={() => setIsAddTripOpen(true)}>
            <Plus size={18} />
            Create Trip Now
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {trips.map((trip) => {
            const budgetPct = trip.budget > 0 ? Math.round(((trip.totalExpenses || 0) / trip.budget) * 100) : 0;
            const budgetColor = getBudgetColor(budgetPct);

            return (
              <div
                key={trip._id}
                className="card hover-card"
                onClick={() => navigate(`/trips/${trip._id}`)}
                style={{ overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
              >
                {/* Trip Cover Image Header */}
                <div style={{ height: '160px', position: 'relative' }}>
                  <img
                    src={trip.coverImage || 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&q=80&w=1000'}
                    alt={trip.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15, 23, 42, 0.8) 0%, transparent 60%)' }} />
                  <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <button
                      className="btn btn-icon btn-sm"
                      style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(255, 255, 255, 0.2)', color: '#fff', backdropFilter: 'blur(4px)' }}
                      onClick={(e) => handleShareTrip(e, trip)}
                      title="Copy Join Link"
                    >
                      <Share2 size={14} />
                    </button>
                    <span
                      className={`badge badge-${trip.status === 'active' ? 'active' : trip.status === 'upcoming' ? 'upcoming' : 'completed'}`}
                      style={{ boxShadow: 'var(--shadow-sm)' }}
                    >
                      {trip.status ? trip.status.toUpperCase() : 'ACTIVE'}
                    </span>
                  </div>
                  <div style={{ position: 'absolute', bottom: '12px', left: '16px', right: '16px', color: '#fff' }}>
                    {trip.location && (
                      <div style={{ fontSize: '0.8rem', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={14} /> {trip.location}
                      </div>
                    )}
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '2px 0 0 0', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                      {trip.name}
                    </h3>
                  </div>
                </div>

                {/* Trip Details Body */}
                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Calendar size={14} /> {formatDate(trip.startDate, 'MMM d')} {trip.endDate ? `- ${formatDate(trip.endDate, 'MMM d, yyyy')}` : ''}
                    </span>
                  </div>

                  {/* Budget Progress Bar */}
                  {trip.budget > 0 && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                        <span>Spent: <strong>{formatCurrency(trip.totalExpenses, trip.currency)}</strong></span>
                        <span>Budget: <strong>{formatCurrency(trip.budget, trip.currency)}</strong></span>
                      </div>
                      <div style={{ height: '6px', width: '100%', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(budgetPct, 100)}%`, height: '100%', background: budgetColor, borderRadius: '3px' }} />
                      </div>
                    </div>
                  )}

                  {/* Footer Members */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ display: 'flex' }}>
                        {trip.members?.map((m, i) => (
                          <img
                            key={i}
                            src={m.user?.profileImage || 'https://via.placeholder.com/30'}
                            alt=""
                            style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid var(--bg-card)', marginLeft: i > 0 ? '-8px' : 0 }}
                          />
                        ))}
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{trip.members?.length || 0} members</span>
                    </div>

                    <span style={{ fontSize: '0.85rem', color: 'var(--primary-light)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
                      Details <ChevronRight size={16} />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Trip Modal */}
      <AddTripModal
        isOpen={isAddTripOpen}
        onClose={() => setIsAddTripOpen(false)}
        onAddTrip={handleTripCreated}
      />
    </div>
  );
};

export default TripsList;
