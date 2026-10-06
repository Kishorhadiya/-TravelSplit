import React, { useState } from 'react';
import { X, Copy, Check, Share2, MessageCircle, Mail, Link as LinkIcon } from 'lucide-react';
import toast from 'react-hot-toast';

const ShareTripModal = ({ isOpen, onClose, trip }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !trip) return null;

  const joinUrl = `${window.location.origin}/register?tripId=${trip._id}`;
  const shareText = `Hey! Join our travel trip "${trip.name}" on TravelSplit to manage and split expenses together:\n${joinUrl}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    toast.success('Trip join link copied to clipboard! 📋');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${trip.name}`,
          text: `Join our travel trip "${trip.name}" on TravelSplit!`,
          url: joinUrl,
        });
      } catch (err) {
        console.log('Share cancelled', err);
      }
    } else {
      handleCopy();
    }
  };

  const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
  const mailSubject = encodeURIComponent(`Join ${trip.name} on TravelSplit`);
  const mailBody = encodeURIComponent(shareText);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container"
        style={{ maxWidth: '500px', width: '100%', padding: 0, overflow: 'hidden' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-card)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="flex-center" style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary-light)' }}>
              <Share2 size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Invite Friends to Trip</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Share link with friends so they can join "{trip.name}"</p>
            </div>
          </div>
          <button className="btn btn-icon btn-ghost" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Content */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Join Link Input Field */}
          <div>
            <label className="form-label" style={{ fontWeight: 600 }}>Shareable Join Link</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <LinkIcon size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  readOnly
                  value={joinUrl}
                  className="form-control"
                  style={{ paddingLeft: '36px', fontSize: '0.88rem', background: 'var(--bg-main)', cursor: 'text' }}
                  onClick={(e) => e.target.select()}
                />
              </div>
              <button className={`btn ${copied ? 'btn-success' : 'btn-primary'}`} onClick={handleCopy} style={{ gap: '0.35rem' }}>
                {copied ? <Check size={18} /> : <Copy size={18} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Quick Sharing Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <label className="form-label" style={{ fontWeight: 600, margin: 0 }}>Instant Share Options</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
              {/* WhatsApp Share Anchor Link */}
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn"
                style={{
                  background: '#25D366',
                  color: '#fff',
                  border: 'none',
                  justifyContent: 'center',
                  fontWeight: 600,
                  gap: '0.5rem',
                  padding: '0.75rem',
                  textDecoration: 'none'
                }}
              >
                <MessageCircle size={18} /> WhatsApp
              </a>

              {/* Email Share Link */}
              <a
                href={`mailto:?subject=${mailSubject}&body=${mailBody}`}
                className="btn btn-outline"
                style={{ justifyContent: 'center', fontWeight: 600, gap: '0.5rem', padding: '0.75rem', textDecoration: 'none' }}
              >
                <Mail size={18} /> Email Link
              </a>

              {/* Web Native Share (if supported) */}
              {navigator.share && (
                <button
                  className="btn btn-outline"
                  onClick={handleNativeShare}
                  style={{ justifyContent: 'center', fontWeight: 600, gap: '0.5rem', padding: '0.75rem' }}
                >
                  <Share2 size={18} /> More Apps
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)', background: 'var(--bg-card)', textAlign: 'right' }}>
          <button className="btn btn-ghost" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
};

export default ShareTripModal;
