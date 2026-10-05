import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tripService } from '../../services';
import { Plane, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const JoinTrip = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleJoin = async () => {
      try {
        const { data } = await tripService.join(id);
        if (data?.success) {
          toast.success(data.message || 'Successfully joined trip! 🎉');
          navigate(`/trips/${id}`);
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to join trip');
        navigate('/trips');
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      handleJoin();
    }
  }, [id, navigate]);

  return (
    <div className="flex-center" style={{ minHeight: '60vh', flexDirection: 'column', gap: '1rem', textAlign: 'center' }}>
      <div className="flex-center" style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary-light)' }}>
        <Plane size={32} />
      </div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Joining Travel Trip...</h2>
      <p style={{ color: 'var(--text-muted)', margin: 0 }}>Please wait while we add you to the travel group.</p>
      <div className="loading-spinner" style={{ marginTop: '1rem' }}></div>
    </div>
  );
};

export default JoinTrip;
