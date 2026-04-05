'use client';

import { useState, useRef } from 'react';

/**
 * Minimal client component for the portal forms.
 * Only this tiny piece needs JavaScript — for handling input state.
 * If JS fails on the TV browser, the forms won't work, but the main
 * portal cards (which are <a> links) will still be fully clickable.
 */
export function PortalForm({ type }: { type: 'guest' | 'staff' }) {
  const hotelRef = useRef<HTMLInputElement>(null);
  const roomRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');

  const handleGuestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hotelSlug = hotelRef.current?.value || '';
    const roomCode = roomRef.current?.value || '';
    
    if (!hotelSlug.trim() || !roomCode.trim()) {
      setError('Please fill in both fields');
      return;
    }
    window.location.href = `/${hotelSlug.trim().toLowerCase()}/dashboard/${roomCode.trim()}`;
  };

  const handleStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hotelSlug = hotelRef.current?.value || '';
    
    if (!hotelSlug.trim()) {
      setError('Please enter your hotel identifier');
      return;
    }
    window.location.href = `/${hotelSlug.trim().toLowerCase()}/login`;
  };

  if (type === 'guest') {
    return (
      <form onSubmit={handleGuestSubmit} className="portal-form-body">
        <div className="portal-field">
          <label htmlFor="portal-guest-hotel" className="portal-label">Hotel ID</label>
          <input
            id="portal-guest-hotel"
            type="text"
            ref={hotelRef}
            placeholder="e.g. amartha-hotel"
            className="portal-input"
            autoComplete="off"
          />
        </div>
        <div className="portal-field">
          <label htmlFor="portal-guest-room" className="portal-label">Room Code</label>
          <input
            id="portal-guest-room"
            type="text"
            ref={roomRef}
            placeholder="e.g. 417"
            className="portal-input"
            autoComplete="off"
          />
        </div>
        {error && <p className="portal-error">{error}</p>}
        <button type="submit" className="portal-submit-btn" style={{ background: '#14b8a6' }}>
          Open Dashboard
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleStaffSubmit} className="portal-form-body">
      <div className="portal-field">
        <label htmlFor="portal-staff-hotel" className="portal-label">Hotel ID</label>
        <input
          id="portal-staff-hotel"
          type="text"
          ref={hotelRef}
          placeholder="e.g. amartha-hotel"
          className="portal-input"
          autoComplete="off"
        />
      </div>
      {error && <p className="portal-error">{error}</p>}
      <button type="submit" className="portal-submit-btn" style={{ background: '#6366f1' }}>
        Continue to Login
      </button>
    </form>
  );
}
