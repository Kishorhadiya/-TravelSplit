import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { tripService } from '../../services';
import { Plane, UserPlus, LogIn, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const JoinTrip = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!id) return;
    localStorage.setItem('pendingTripId', id);

    if (user && !authLoading) {
      setJoining(true);
      tripService
        .join(id)
        .then(({ data }) => {
          localStorage.removeItem('pendingTripId');
          toast.success(data?.message || 'Successfully joined trip! 🎉');
          navigate(`/trips/${id}`);
        })
        .catch((err) => {
          localStorage.removeItem('pendingTripId');
          toast.error(err.response?.data?.message || 'Failed to join trip or link expired');
          navigate('/trips');
        })
        .finally(() => setJoining(false));
    }
  }, [id, user, authLoading, navigate]);

  if (authLoading || joining) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh', flexDirection: 'column', gap: '1rem', textAlign: 'center' }}>
        <div className="flex-center" style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary-light)' }}>
          <Plane size={32} />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Joining Trip...</h2>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>Please wait while we connect you to the group.</p>
        <div className="loading-spinner" style={{ marginTop: '1rem' }}></div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      background: 'radial-gradient(circle at 50% 30%, rgba(99, 102, 241, 0.15) 0%, rgba(14, 165, 233, 0.1) 90%), var(--bg-main)',
    }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="flex-center" style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, var(--primary) 0%, #818cf8 100%)',
            margin: '0 auto 1rem auto',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <Plane size={32} color="#fff" />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>You're Invited! ✈️</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.95rem' }}>
            A friend invited you to join their travel trip group on <strong>TravelSplit</strong> to split & track expenses together.
          </p>
        </div>

        <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', backdropFilter: 'blur(16px)' }}>
          <Link
            to="/register"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', justifyContent: 'center', gap: '0.75rem' }}
          >
            <UserPlus size={20} />
            Create New Account & Join
            <ArrowRight size={18} />
          </Link>

          <Link
            to="/login"
            className="btn btn-outline btn-lg"
            style={{ width: '100%', justifyContent: 'center', gap: '0.75rem' }}
          >
            <LogIn size={20} />
            I Already Have an Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default JoinTrip;
