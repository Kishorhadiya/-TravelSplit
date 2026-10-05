import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import MobileNavigation from './MobileNavigation';

const AppLayout = ({ notificationCount = 0 }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      {/* Desktop + Mobile Sidebar */}
      <Sidebar
        mobileOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        notificationCount={notificationCount}
      />

      {/* Main Content */}
      <main className="main-content">
        {/* Mobile Top Bar */}
        <div
          style={{
            display: 'none',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-secondary)',
            position: 'sticky',
            top: 0,
            zIndex: 50,
          }}
          className="mobile-topbar"
          id="mobile-topbar"
        >
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={22} />
          </button>
          <span
            style={{
              fontFamily: 'Outfit, sans-serif',
              fontWeight: 800,
              fontSize: 20,
              background: 'var(--gradient-primary)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            ✈ TravelSplit
          </span>
          <div style={{ width: 36 }} />
        </div>

        <Outlet />

        {/* Mobile Bottom Nav */}
        <MobileNavigation
          onMenuOpen={() => setSidebarOpen(true)}
          notificationCount={notificationCount}
        />
      </main>

      <style>{`
        @media (max-width: 768px) {
          #mobile-topbar { display: flex !important; }
        }
      `}</style>
    </div>
  );
};

export default AppLayout;
