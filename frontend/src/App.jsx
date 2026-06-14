import React, { useState, useEffect } from 'react';

function App() {
  const [hotels, setHotels] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Auth states
  const [token, setToken] = useState(localStorage.getItem('hotel_token') || '');
  const [loggedInUser, setLoggedInUser] = useState(localStorage.getItem('hotel_username') || '');
  
  // Toast notifications state
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  // Fetch hotels on mount
  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/hotels/')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch hotels');
        return res.json();
      })
      .then(data => {
        setHotels(data);
        setFetchError(false);
      })
      .catch(err => {
        console.error('Fetch error:', err);
        setFetchError(true);
        // Fallback static data if backend is offline or loading
        setHotels([
          { id: 4, name: 'Abhirami Hotel', code: 'ABH01' },
          { id: 5, name: 'Abhirami Lodge', code: 'ABL02' }
        ]);
      });
  }, []);

  // Show a custom toast message
  const triggerToast = (message) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, isFading: false }]);

    // Trigger fade-out animation 3 seconds later
    setTimeout(() => {
      setToasts(prev =>
        prev.map(t => t.id === id ? { ...t, isFading: true } : t)
      );
    }, 3000);

    // Remove toast completely 3.3 seconds later
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3300);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (!username || !password) {
      triggerToast('Please enter both username and password.');
      return;
    }
    if (!selectedHotel) {
      triggerToast('Please select a hotel to check in.');
      return;
    }

    setLoading(true);

    fetch('http://127.0.0.1:8000/api/login/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: username,
        password: password,
        hotel_code: selectedHotel.code
      })
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.detail || 'Authentication failed');
        }
        return data;
      })
      .then(data => {
        // Successful login
        localStorage.setItem('hotel_token', data.token);
        localStorage.setItem('hotel_username', data.username);
        
        setToken(data.token);
        setLoggedInUser(data.username);
        
        // Reset form
        setUsername('');
        setPassword('');
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        triggerToast(err.message || 'Unable to connect to the authentication server.');
        setLoading(false);
      });
  };

  const handleLogout = () => {
    localStorage.removeItem('hotel_token');
    localStorage.removeItem('hotel_username');
    setToken('');
    setLoggedInUser('');
    setSelectedHotel(null);
  };

  return (
    <>
      {/* Toast Notification Container */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast ${toast.isFading ? 'fade-out' : ''}`}>
            <span className="toast-icon">✕</span>
            <span className="toast-message">{toast.message}</span>
          </div>
        ))}
      </div>

      {token ? (
        // Blank Welcome Page once logged in
        <div className="welcome-container">
          <button className="btn-logout" onClick={handleLogout}>
            Sign Out
          </button>
          <h1 className="welcome-title">Welcome, {loggedInUser}</h1>
        </div>
      ) : (
        // Login Page
        <div className="auth-wrapper">
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                className="input-control"
                placeholder="Enter username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="input-control"
                placeholder="Enter password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="hotel-section-title">Select Hotel to Check In</div>
            {fetchError && (
              <p style={{ color: '#fb923c', fontSize: '0.8rem', marginBottom: '0.5rem', textAlign: 'center' }}>
                * Backend offline. Running in offline preview mode.
              </p>
            )}
            
            <div className="hotel-grid">
              {hotels.map(hotel => (
                <div
                  key={hotel.id}
                  className={`hotel-card ${selectedHotel?.id === hotel.id ? 'selected' : ''}`}
                  onClick={() => !loading && setSelectedHotel(hotel)}
                >
                  <div className="hotel-info">
                    <h3>{hotel.name}</h3>
                    <p>Tap to select</p>
                  </div>
                  <span className="hotel-code-badge">{hotel.code}</span>
                </div>
              ))}
            </div>

            <button
              type="submit"
              className="btn-submit"
              disabled={loading || !username || !password || !selectedHotel}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        </div>
      )}
    </>
  );
}

export default App;
