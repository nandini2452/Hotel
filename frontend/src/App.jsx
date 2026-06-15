import React, { useState, useEffect } from 'react';

const TIME_OPTIONS = [
  '12:00 AM', '1:00 AM', '2:00 AM', '3:00 AM', '4:00 AM', '5:00 AM', '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM', '11:00 PM'
];

function App() {
  const [hotels, setHotels] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Auth states
  const [token, setToken] = useState(localStorage.getItem('hotel_token') || '');
  const [loggedInUser, setLoggedInUser] = useState(localStorage.getItem('hotel_username') || '');
  const [hotelCode, setHotelCode] = useState(localStorage.getItem('hotel_code') || '');
  const [hotelName, setHotelName] = useState(localStorage.getItem('hotel_name') || '');

  // Grid / Modal states
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [newBooking, setNewBooking] = useState({
    guest_first_name: '',
    guest_last_name: '',
    guest_phone: '',
    guest_email: '',
    check_in: '',
    check_in_time: '12:00 PM',
    check_out: '',
    check_out_time: '12:00 PM',
    status: 'Reserve',
    advance_paid: 0
  });

  // 14-day rolling window calendar starting from today
  const [dates] = useState(() => {
    const arr = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      arr.push(d);
    }
    return arr;
  });
  
  // Toast notifications state
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  // Helper: formats date to YYYY-MM-DD
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Fetch hotels list on mount
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
        // Fallback static data if backend is offline
        setHotels([
          { id: 4, name: 'Abhirami Hotel', code: 'ABH01' },
          { id: 5, name: 'Abhirami Lodge', code: 'ABL02' }
        ]);
      });
  }, []);

  // Fetch rooms and bookings when authenticated
  useEffect(() => {
    if (!token || !hotelCode) return;
    
    // Fetch Rooms list
    fetch(`http://127.0.0.1:8000/api/my-hotel/rooms/?hotel_code=${hotelCode}`, {
      headers: {
        'Authorization': `Token ${token}`
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch rooms');
        return res.json();
      })
      .then(data => {
        setRooms(data);
      })
      .catch(err => {
        console.error(err);
        triggerToast('Could not load hotel rooms.');
      });

    // Fetch Bookings list
    fetch(`http://127.0.0.1:8000/api/my-hotel/bookings/?hotel_code=${hotelCode}`, {
      headers: {
        'Authorization': `Token ${token}`
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch bookings');
        return res.json();
      })
      .then(data => {
        setBookings(data);
      })
      .catch(err => {
        console.error(err);
        triggerToast('Could not load current bookings.');
      });
  }, [token, hotelCode]);

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
        localStorage.setItem('hotel_code', data.hotel_code);
        localStorage.setItem('hotel_name', data.hotel_name);
        
        setToken(data.token);
        setLoggedInUser(data.username);
        setHotelCode(data.hotel_code);
        setHotelName(data.hotel_name);
        
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
    localStorage.removeItem('hotel_code');
    localStorage.removeItem('hotel_name');
    setToken('');
    setLoggedInUser('');
    setHotelCode('');
    setHotelName('');
    setSelectedHotel(null);
    setRooms([]);
    setBookings([]);
  };

  // Modal actions
  const handleOpenReservationModal = (room, date) => {
    setSelectedRoom(room);
    
    // Default dates: check-in is the cell date, check-out is the next day
    const checkInStr = formatDate(date);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    const checkOutStr = formatDate(nextDay);
    
    setNewBooking({
      guest_first_name: '',
      guest_last_name: '',
      guest_phone: '',
      guest_email: '',
      check_in: checkInStr,
      check_in_time: '12:00 PM',
      check_out: checkOutStr,
      check_out_time: '12:00 PM',
      status: 'Reserve',
      advance_paid: room.min_advance
    });
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedRoom(null);
  };

  const calculateNightsCount = () => {
    if (!newBooking.check_in || !newBooking.check_out) return 0;
    const cin = new Date(newBooking.check_in);
    const cout = new Date(newBooking.check_out);
    const diff = cout - cin;
    if (diff <= 0) return 0;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const calculateTotalCost = () => {
    const nights = calculateNightsCount();
    if (!selectedRoom) return 0;
    return nights * parseFloat(selectedRoom.price);
  };

  const handleCreateBooking = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!newBooking.guest_first_name || !newBooking.guest_last_name || !newBooking.guest_phone || !newBooking.check_in || !newBooking.check_out) {
      triggerToast('Please fill out all required fields.');
      return;
    }

    // Validate phone number: exactly 10 digits
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(newBooking.guest_phone)) {
      triggerToast('Phone number must be exactly 10 digits.');
      return;
    }

    // Validate advance paid
    const advancePaidNum = parseFloat(newBooking.advance_paid);
    if (isNaN(advancePaidNum) || advancePaidNum < selectedRoom.min_advance) {
      triggerToast(`Minimum required advance is ₹${selectedRoom.min_advance} for ${selectedRoom.room_type} rooms.`);
      return;
    }

    // Validate dates
    const cin = new Date(newBooking.check_in);
    const cout = new Date(newBooking.check_out);
    if (cout <= cin) {
      triggerToast('Check-out date must be after check-in date.');
      return;
    }

    fetch('http://127.0.0.1:8000/api/my-hotel/bookings/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`
      },
      body: JSON.stringify({
        room_id: selectedRoom.id,
        guest_first_name: newBooking.guest_first_name,
        guest_last_name: newBooking.guest_last_name,
        guest_phone: newBooking.guest_phone,
        guest_email: newBooking.guest_email,
        check_in: newBooking.check_in,
        check_in_time: newBooking.check_in_time,
        check_out: newBooking.check_out,
        check_out_time: newBooking.check_out_time,
        status: newBooking.status,
        advance_paid: advancePaidNum
      })
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.detail || 'Failed to save booking');
        }
        return data;
      })
      .then(data => {
        triggerToast('Reservation created successfully!');
        // Refresh bookings
        fetch(`http://127.0.0.1:8000/api/my-hotel/bookings/?hotel_code=${hotelCode}`, {
          headers: { 'Authorization': `Token ${token}` }
        })
          .then(res => res.json())
          .then(data => setBookings(data));
          
        handleCloseModal();
      })
      .catch(err => {
        console.error(err);
        triggerToast(err.message || 'Error occurred while saving reservation.');
      });
  };

  // Renders a horizontal row of cells matching the calendar dates
  const renderCalendarCells = (room) => {
    const cells = [];
    let i = 0;
    while (i < 14) {
      const dateStr = formatDate(dates[i]);
      // Find booking covering dateStr
      const booking = bookings.find(b => 
        b.room_id === room.id && 
        b.check_in <= dateStr && 
        b.check_out > dateStr
      );
      
      if (booking) {
        // If booking check_in is today or earlier, and this is the first cell of the calendar, we render it.
        // Otherwise we render it when we hit its check-in date.
        if (booking.check_in === dateStr || i === 0) {
          const checkOutDate = new Date(booking.check_out);
          const currentDate = dates[i];
          
          // Calculate remaining nights count to span columns
          const diffTime = checkOutDate - currentDate;
          const nights = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
          const span = Math.min(nights, 14 - i);
          
          cells.push(
            <td
              key={`booking-${booking.id}-${dateStr}`}
              colSpan={span}
              className={`booking-cell status-${booking.status.toLowerCase().replace(' ', '-')}`}
              onClick={(e) => {
                e.stopPropagation();
                triggerToast(
                  `Guest: ${booking.guest_first_name} ${booking.guest_last_name} | ` +
                  `Phone: ${booking.guest_phone} | ` +
                  `Timings: ${booking.check_in} (${booking.check_in_time || '12:00 PM'}) to ${booking.check_out} (${booking.check_out_time || '12:00 PM'}) | ` +
                  `Paid: ₹${booking.advance_paid}`
                );
              }}
            >
              <div className="booking-info-block">
                <span className="booking-guest-name">{booking.guest_first_name} {booking.guest_last_name}</span>
                <span className="booking-badge">{booking.status}</span>
                <span className="booking-advance">₹{parseFloat(booking.advance_paid).toLocaleString('en-IN')}</span>
              </div>
            </td>
          );
          i += span;
        } else {
          // Covered by a booking rendered in a previous column, skip cell
          i++;
        }
      } else {
        const targetDate = dates[i];
        cells.push(
          <td
            key={`empty-${room.id}-${dateStr}`}
            className="empty-cell"
            onClick={() => handleOpenReservationModal(room, targetDate)}
          >
            <div className="empty-cell-inner">+</div>
          </td>
        );
        i++;
      }
    }
    return cells;
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
        // Logged-in Dashboard
        <div className="dashboard-container">
          <div className="dashboard-header">
            <button className="btn-logout-top" onClick={handleLogout}>
              Sign Out
            </button>
            <div className="hotel-title-section" style={{ textAlign: 'right' }}>
              <h1>{hotelName}</h1>
              <p>Code: {hotelCode} | Welcome, <strong>{loggedInUser}</strong></p>
            </div>
          </div>

          {/* Front Desk Scheduler Grid */}
          <div className="calendar-card">
            <div className="calendar-header-actions">
              <h2>Front Desk Booking Calendar Grid</h2>
              <div className="calendar-legend">
                <div className="legend-item">
                  <div className="legend-color" style={{ background: 'linear-gradient(135deg, #d97706, #b45309)' }}></div>
                  <span>Hold</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ background: 'linear-gradient(135deg, #ea580c, #c2410c)' }}></div>
                  <span>Temp Reserve</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}></div>
                  <span>Reserve</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}></div>
                  <span>Checked-In</span>
                </div>
              </div>
            </div>

            <div className="calendar-scroll">
              <table className="calendar-table">
                <thead>
                  <tr>
                    <th className="room-column-header">Room Details</th>
                    {dates.map((date, idx) => {
                      const isToday = idx === 0;
                      return (
                        <th key={idx} className={`date-column-header ${isToday ? 'today' : ''}`}>
                          <span className="date-day">{date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                          <span className="date-num">{date.getDate()}</span>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {/* Standard Category */}
                  <tr className="category-row">
                    <td colSpan={15} className="category-title">
                      Standard Rooms (Price: ₹1,500 | Min Advance: ₹500)
                    </td>
                  </tr>
                  {rooms.filter(r => r.room_type === 'Standard').map(room => (
                    <tr key={room.id}>
                      <td className="room-cell">
                        {room.number}
                        <span className="room-type-badge">Standard - ₹1,500</span>
                      </td>
                      {renderCalendarCells(room)}
                    </tr>
                  ))}

                  {/* Deluxe Category */}
                  <tr className="category-row">
                    <td colSpan={15} className="category-title">
                      Deluxe Rooms (Price: ₹2,500 | Min Advance: ₹1,000)
                    </td>
                  </tr>
                  {rooms.filter(r => r.room_type === 'Deluxe').map(room => (
                    <tr key={room.id}>
                      <td className="room-cell">
                        {room.number}
                        <span className="room-type-badge">Deluxe - ₹2,500</span>
                      </td>
                      {renderCalendarCells(room)}
                    </tr>
                  ))}

                  {/* Superior Category */}
                  <tr className="category-row">
                    <td colSpan={15} className="category-title">
                      Superior Rooms (Price: ₹4,000 | Min Advance: ₹2,000)
                    </td>
                  </tr>
                  {rooms.filter(r => r.room_type === 'Superior').map(room => (
                    <tr key={room.id}>
                      <td className="room-cell">
                        {room.number}
                        <span className="room-type-badge">Superior - ₹4,000</span>
                      </td>
                      {renderCalendarCells(room)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Reservation Modal */}
          {modalOpen && (
            <div className="modal-backdrop" onClick={handleCloseModal}>
              <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>Add Quick Reservation</h3>
                  <button className="btn-close" onClick={handleCloseModal}>&times;</button>
                </div>
                
                <form onSubmit={handleCreateBooking}>
                  <div className="room-summary-box">
                    <h4>Room: {selectedRoom?.number} ({selectedRoom?.room_type})</h4>
                    <div className="summary-grid">
                      <div className="summary-item">Nightly Rate: <span>₹{parseFloat(selectedRoom?.price).toLocaleString('en-IN')}</span></div>
                      <div className="summary-item">Min Advance: <span>₹{parseFloat(selectedRoom?.min_advance).toLocaleString('en-IN')}</span></div>
                      <div className="summary-item">Nights Count: <span>{calculateNightsCount()}</span></div>
                      <div className="summary-item">Total Cost: <span>₹{calculateTotalCost().toLocaleString('en-IN')}</span></div>
                    </div>
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">First Name</label>
                      <input
                        type="text"
                        className="input-control"
                        required
                        value={newBooking.guest_first_name}
                        onChange={e => setNewBooking(prev => ({ ...prev, guest_first_name: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Last Name</label>
                      <input
                        type="text"
                        className="input-control"
                        required
                        value={newBooking.guest_last_name}
                        onChange={e => setNewBooking(prev => ({ ...prev, guest_last_name: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone Number</label>
                      <input
                        type="tel"
                        className="input-control"
                        required
                        maxLength={10}
                        pattern="\d{10}"
                        placeholder="Enter 10-digit number"
                        value={newBooking.guest_phone}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '');
                          setNewBooking(prev => ({ ...prev, guest_phone: val }));
                        }}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email Address</label>
                      <input
                        type="email"
                        className="input-control"
                        value={newBooking.guest_email || ''}
                        onChange={e => setNewBooking(prev => ({ ...prev, guest_email: e.target.value }))}
                      />
                    </div>
                    
                    {/* Check-in group */}
                    <div className="form-group">
                      <label className="form-label">Check-In Date</label>
                      <input
                        type="date"
                        className="input-control"
                        required
                        value={newBooking.check_in}
                        onChange={e => setNewBooking(prev => ({ ...prev, check_in: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Check-In Time</label>
                      <select
                        className="input-control"
                        value={newBooking.check_in_time}
                        onChange={e => {
                          const newTime = e.target.value;
                          setNewBooking(prev => ({
                            ...prev,
                            check_in_time: newTime,
                            check_out_time: newTime
                          }));
                        }}
                        style={{ background: 'rgba(15, 23, 42, 0.85)', color: '#fff' }}
                      >
                        {TIME_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>

                    {/* Check-out group */}
                    <div className="form-group">
                      <label className="form-label">Check-Out Date</label>
                      <input
                        type="date"
                        className="input-control"
                        required
                        value={newBooking.check_out}
                        onChange={e => setNewBooking(prev => ({ ...prev, check_out: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Check-Out Time</label>
                      <select
                        className="input-control"
                        value={newBooking.check_out_time}
                        onChange={e => setNewBooking(prev => ({ ...prev, check_out_time: e.target.value }))}
                        style={{ background: 'rgba(15, 23, 42, 0.85)', color: '#fff' }}
                      >
                        {TIME_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Booking Status</label>
                      <select
                        className="input-control"
                        value={newBooking.status}
                        onChange={e => setNewBooking(prev => ({ ...prev, status: e.target.value }))}
                        style={{ background: 'rgba(15, 23, 42, 0.85)', color: '#fff' }}
                      >
                        <option value="Hold">Hold</option>
                        <option value="Temp Reserve">Temp Reserve</option>
                        <option value="Reserve">Reserve</option>
                        <option value="Checked-In">Checked-In</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Advance Paid (₹)</label>
                      <input
                        type="number"
                        className="input-control"
                        required
                        min={selectedRoom?.min_advance}
                        value={newBooking.advance_paid}
                        onChange={e => setNewBooking(prev => ({ ...prev, advance_paid: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="modal-actions">
                    <button type="button" className="btn-cancel" onClick={handleCloseModal}>Cancel</button>
                    <button type="submit" className="btn-submit-modal">Save Booking</button>
                  </div>
                </form>
              </div>
            </div>
          )}
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
