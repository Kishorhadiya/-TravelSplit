import React, { useState, useEffect, useCallback } from 'react';
import { Users, UserPlus, Search, X, Check, Trash2 } from 'lucide-react';
import { friendService } from '../../services';
import toast from 'react-hot-toast';

const FriendsList = () => {
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const fetchFriendsData = useCallback(async () => {
    setLoading(true);
    try {
      const [friendsRes, requestsRes] = await Promise.all([
        friendService.getAll(),
        friendService.getRequests(),
      ]);

      if (friendsRes.data?.success) setFriends(friendsRes.data.data || []);
      if (requestsRes.data?.success) setRequests(requestsRes.data.data || []);
    } catch (err) {
      console.error('Failed to fetch friends:', err);
      toast.error('Failed to load friends');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFriendsData();
  }, [fetchFriendsData]);

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;
    try {
      await friendService.sendRequest({ email: inviteEmail });
      toast.success(`Friend request sent to ${inviteEmail}! ✉️`);
      setInviteEmail('');
      setIsInviteOpen(false);
      fetchFriendsData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send friend request');
    }
  };

  const handleRespondRequest = async (requestId, status) => {
    try {
      await friendService.respond(requestId, status);
      toast.success(`Request ${status}`);
      fetchFriendsData();
    } catch (err) {
      toast.error('Failed to update request');
    }
  };

  const handleRemoveFriend = async (friendId) => {
    if (window.confirm('Are you sure you want to remove this friend?')) {
      try {
        await friendService.remove(friendId);
        toast.success('Friend removed');
        fetchFriendsData();
      } catch (err) {
        toast.error('Failed to remove friend');
      }
    }
  };

  const filteredFriends = friends.filter((f) =>
    (f.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (f.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
            Friends & Trip Contacts 👥
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)' }}>
            Connect with friends to easily invite them to trips
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setIsInviteOpen(true)}>
          <UserPlus size={18} />
          Add New Friend
        </button>
      </div>

      {/* Friend Requests Banner if any */}
      {requests.length > 0 && (
        <div className="card" style={{ padding: '1.25rem', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.75rem 0' }}>
            Pending Friend Requests ({requests.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {requests.map((req) => (
              <div key={req._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-card)', borderRadius: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <img src={req.requester?.profileImage || 'https://via.placeholder.com/36'} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{req.requester?.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{req.requester?.email}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-sm btn-success" onClick={() => handleRespondRequest(req._id, 'accepted')}>
                    <Check size={16} /> Accept
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleRespondRequest(req._id, 'rejected')}>
                    <X size={16} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="card" style={{ padding: '1rem' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '450px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-control"
            style={{ paddingLeft: '38px', height: '40px' }}
            placeholder="Search friends by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Friends Cards Grid */}
      {loading ? (
        <div className="flex-center" style={{ minHeight: '40vh', flexDirection: 'column', gap: '1rem' }}>
          <div className="loading-spinner"></div>
          <p style={{ color: 'var(--text-muted)' }}>Loading friends list...</p>
        </div>
      ) : filteredFriends.length === 0 ? (
        <div className="card flex-center" style={{ padding: '4rem 2rem', flexDirection: 'column', textAlign: 'center', gap: '1rem' }}>
          <Users size={36} color="var(--primary-light)" />
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>No Friends Added Yet</h3>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Add friends by email to easily share trip expenses.</p>
          <button className="btn btn-primary" onClick={() => setIsInviteOpen(true)}>
            <UserPlus size={18} /> Add Friend Now
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {filteredFriends.map((friend) => (
            <div key={friend._id} className="card hover-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <img src={friend.profileImage || 'https://via.placeholder.com/48'} alt={friend.name} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>{friend.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{friend.email}</div>
                </div>
              </div>

              <button className="btn btn-icon btn-ghost" onClick={() => handleRemoveFriend(friend._id)} style={{ color: 'var(--danger)' }}>
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Friend Modal */}
      {isInviteOpen && (
        <div className="modal-backdrop" onClick={() => setIsInviteOpen(false)}>
          <div className="modal-container" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Add Friend</h3>
              <button className="btn btn-icon btn-ghost" onClick={() => setIsInviteOpen(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleSendInvite} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="friend@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </div>

              <div className="modal-footer" style={{ padding: 0, border: 'none' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsInviteOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Send Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FriendsList;
