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
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingBookingId, setEditingBookingId] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  
  // Contact guest states
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactBooking, setContactBooking] = useState(null);
  const [customMessage, setCustomMessage] = useState('');
  const [newBooking, setNewBooking] = useState({
    guest_first_name: '',
    guest_last_name: '',
    guest_phone: '',
    guest_email: '',
    check_in: '',
    check_in_time: '11:30 AM',
    check_out: '',
    check_out_time: '11:30 AM',
    status: 'Booked',
    advance_paid: 0,
    advance_status: 'Paid'
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
    setIsEditMode(false);
    setEditingBookingId(null);
    
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
      check_in_time: '11:30 AM',
      check_out: checkOutStr,
      check_out_time: '11:30 AM',
      status: 'Booked',
      advance_paid: room.min_advance,
      advance_status: 'Paid'
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (booking) => {
    const room = rooms.find(r => Number(r.id) === Number(booking.room_id));
    if (!room) {
      triggerToast('Room not found for this reservation.');
      return;
    }
    setSelectedRoom(room);
    setIsEditMode(true);
    setEditingBookingId(booking.id);
    
    setNewBooking({
      guest_first_name: booking.guest_first_name,
      guest_last_name: booking.guest_last_name,
      guest_phone: booking.guest_phone,
      guest_email: booking.guest_email || '',
      check_in: booking.check_in,
      check_in_time: booking.check_in_time || '11:30 AM',
      check_out: booking.check_out,
      check_out_time: booking.check_out_time || '11:30 AM',
      status: booking.status,
      advance_paid: booking.advance_paid,
      advance_status: booking.advance_status || 'Paid'
    });
    setModalOpen(true);
  };

  const isCheckoutPassed = (booking) => {
    if (booking.status !== 'Checked_in') return false;
    if (!booking.check_out) return false;
    
    try {
      const [year, month, day] = booking.check_out.split('-').map(Number);
      const timeStr = booking.check_out_time || '12:00 PM';
      const [time, modifier] = timeStr.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (isNaN(minutes)) minutes = 0;
      
      if (modifier === 'PM' && hours !== 12) {
        hours += 12;
      } else if (modifier === 'AM' && hours === 12) {
        hours = 0;
      }
      
      const checkoutDateObj = new Date(year, month - 1, day, hours, minutes);
      const currentDate = new Date();
      
      return currentDate > checkoutDateObj;
    } catch (e) {
      console.error('Error parsing check_out date/time', e);
      return false;
    }
  };

  const handleQuickCheckout = (bookingId) => {
    if (!window.confirm('Mark this guest as Checked-Out and free up the room?')) return;
    
    fetch(`http://127.0.0.1:8000/api/my-hotel/bookings/${bookingId}/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`
      },
      body: JSON.stringify({
        status: 'Checked-Out'
      })
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.detail || 'Failed to check out guest');
        }
        return data;
      })
      .then(() => {
        triggerToast('Guest checked out successfully! Room is now vacant.');
        // Refresh bookings
        fetch(`http://127.0.0.1:8000/api/my-hotel/bookings/?hotel_code=${hotelCode}`, {
          headers: { 'Authorization': `Token ${token}` }
        })
          .then(res => res.json())
          .then(data => setBookings(data));
      })
      .catch(err => {
        console.error(err);
        triggerToast(err.message || 'Error occurred during check-out.');
      });
  };

  const handleOpenContactModal = (booking) => {
    setContactBooking(booking);
    setCustomMessage(`Dear ${booking.guest_first_name} ${booking.guest_last_name}, your check-out time for room ${booking.room_number} was scheduled for ${booking.check_out} at ${booking.check_out_time} and has passed. Please contact the front desk to complete your checkout. Thank you.`);
    setContactModalOpen(true);
  };

  const handleCloseContactModal = () => {
    setContactModalOpen(false);
    setContactBooking(null);
    setCustomMessage('');
  };

  const handleSimulateSendMessage = () => {
    triggerToast(`Simulated message successfully dispatched to ${contactBooking.guest_first_name} (+91 ${contactBooking.guest_phone})!`);
    handleCloseContactModal();
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedRoom(null);
    setIsEditMode(false);
    setEditingBookingId(null);
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
    if (newBooking.advance_status === 'Paid') {
      if (isNaN(advancePaidNum) || advancePaidNum < selectedRoom.min_advance) {
        triggerToast(`Minimum required advance is ₹${selectedRoom.min_advance} for ${selectedRoom.room_type} rooms.`);
        return;
      }
    }

    // Validate dates
    const cin = new Date(newBooking.check_in);
    const cout = new Date(newBooking.check_out);
    if (cout <= cin) {
      triggerToast('Check-out date must be after check-in date.');
      return;
    }

    const url = isEditMode 
      ? `http://127.0.0.1:8000/api/my-hotel/bookings/${editingBookingId}/` 
      : 'http://127.0.0.1:8000/api/my-hotel/bookings/';
      
    const method = isEditMode ? 'PUT' : 'POST';

    fetch(url, {
      method: method,
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
        advance_paid: newBooking.advance_status === 'Unpaid' ? 0.00 : advancePaidNum,
        advance_status: newBooking.advance_status
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
        triggerToast(isEditMode ? 'Reservation updated successfully!' : 'Reservation created successfully!');
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

  const handleDeleteBooking = () => {
    const isDirty = newBooking.status === 'dirty';
    const confirmMsg = isDirty 
      ? 'Are you sure you want to mark this room as cleaned and vacate it?' 
      : 'Are you sure you want to cancel this reservation?';
    
    if (!window.confirm(confirmMsg)) return;
    
    fetch(`http://127.0.0.1:8000/api/my-hotel/bookings/${editingBookingId}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Token ${token}`
      }
    })
      .then(async res => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.detail || 'Failed to process request');
        }
      })
      .then(() => {
        triggerToast(isDirty ? 'Room marked as cleaned and vacated!' : 'Reservation cancelled successfully!');
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
        triggerToast(err.message || 'Error occurred while processing request.');
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
        Number(b.room_id) === Number(room.id) && 
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
                handleOpenEditModal(booking);
              }}
            >
              <div 
                className="booking-info-block"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenEditModal(booking);
                }}
              >
                <div className="booking-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <span className="booking-guest-name" style={{ maxWidth: '85%' }}>{booking.guest_first_name} {booking.guest_last_name}</span>
                  <span className="booking-edit-indicator" title="Click to Edit" style={{ fontSize: '0.75rem', opacity: 0.6 }}>✏️</span>
                </div>
                <div className="booking-footer-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginTop: '4px' }}>
                  <span className="booking-badge">
                    {booking.status === 'dirty' ? '🧹 Needs Cleaning' : booking.status === 'Checked_in' ? 'Checked-In' : booking.status}
                  </span>
                  <span className="booking-advance" style={booking.advance_status === 'Unpaid' ? { color: '#f87171', fontSize: '0.65rem', fontWeight: 'bold' } : {}}>
                    {booking.advance_status === 'Unpaid' ? 'Incomplete Advance' : `₹${parseFloat(booking.advance_paid).toLocaleString('en-IN')}`}
                  </span>
                </div>
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

  const overdueBookings = bookings.filter(isCheckoutPassed);

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

          {/* Stay Expiry Alerts */}
          {overdueBookings.length > 0 && (
            <div className="overdue-alerts-container">
              <div className="alerts-header">
                <span className="alerts-icon">⚠️</span>
                <h3>Overdue Check-Out Alerts ({overdueBookings.length})</h3>
              </div>
              <div className="alerts-list">
                {overdueBookings.map(b => (
                  <div key={b.id} className="alert-card">
                    <div className="alert-info">
                      <span style={{ fontSize: '1rem' }}>
                        Room <strong>{b.room_number}</strong> ({b.room_type}) - Guest: <strong>{b.guest_first_name} {b.guest_last_name}</strong>
                      </span>
                      <span className="alert-time-badge">
                        ⏰ Scheduled Check-Out was: {b.check_out} at {b.check_out_time}
                      </span>
                    </div>
                    <div className="alert-actions">
                      <button 
                        className="btn-checkout-alert"
                        onClick={() => handleQuickCheckout(b.id)}
                      >
                        Check-Out
                      </button>
                      <button 
                        className="btn-contact-alert"
                        onClick={() => handleOpenContactModal(b)}
                      >
                        Contact Guest
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Front Desk Scheduler Grid */}
          <div className="calendar-card">
            <div className="calendar-header-actions">
              <h2>Front Desk Booking Calendar Grid</h2>
              <div className="calendar-legend">
                <div className="legend-item">
                  <div className="legend-color" style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}></div>
                  <span>Booked</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}></div>
                  <span>Checked-In</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{
                    background: 'repeating-linear-gradient(45deg, #374151, #374151 4px, #1f2937 4px, #1f2937 8px)',
                    border: '1px solid #9ca3af'
                  }}></div>
                  <span>🧹 Needs Cleaning</span>
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
                  <h3>{isEditMode ? 'Edit Reservation Details' : 'Add Quick Reservation'}</h3>
                  <button className="btn-close" onClick={handleCloseModal}>&times;</button>
                </div>
                
                <form onSubmit={handleCreateBooking}>
                  {isEditMode && newBooking.status === 'dirty' && (
                    <div className="warning-banner" style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#f87171',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.9rem',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}>
                      <span>🧹</span>
                      <div>
                        <strong>Needs Cleaning:</strong> This room has been checked out and needs cleaning before new reservations.
                      </div>
                    </div>
                  )}
                  <div className="room-summary-box">
                    <h4>Room: {selectedRoom?.number} ({selectedRoom?.room_type})</h4>
                    <div className="summary-grid">
                      <div className="summary-item">Nightly Rate: <span>₹{parseFloat(selectedRoom?.price).toLocaleString('en-IN')}</span></div>
                      <div className="summary-item">Min Advance Required: <span>₹{parseFloat(selectedRoom?.min_advance).toLocaleString('en-IN')}</span></div>
                      <div className="summary-item">Nights Count: <span>{calculateNightsCount()}</span></div>
                      <div className="summary-item">Total Cost: <span>₹{calculateTotalCost().toLocaleString('en-IN')}</span></div>
                      <div className="summary-item col-span-2" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '4px', marginTop: '4px' }}>
                        Advance Status: <span style={newBooking.advance_status === 'Unpaid' ? { color: '#f87171', fontWeight: 'bold' } : { color: '#4ade80', fontWeight: 'bold' }}>{newBooking.advance_status === 'Unpaid' ? 'Unpaid (Incomplete)' : 'Paid'}</span>
                      </div>
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
                    <div className="form-group col-span-2">
                      <label className="form-label">Check-In Date (Fixed Check-in: 11:30 AM)</label>
                      <input
                        type="date"
                        className="input-control"
                        required
                        value={newBooking.check_in}
                        onChange={e => setNewBooking(prev => ({ ...prev, check_in: e.target.value }))}
                      />
                    </div>

                    {/* Check-out group */}
                    <div className="form-group col-span-2">
                      <label className="form-label">Check-Out Date (Fixed Check-out: 11:30 AM)</label>
                      <input
                        type="date"
                        className="input-control"
                        required
                        value={newBooking.check_out}
                        onChange={e => setNewBooking(prev => ({ ...prev, check_out: e.target.value }))}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Booking Status</label>
                      <select
                        className="input-control"
                        value={newBooking.status}
                        onChange={e => setNewBooking(prev => ({ ...prev, status: e.target.value }))}
                        style={{ background: 'rgba(15, 23, 42, 0.85)', color: '#fff' }}
                      >
                        <option value="Booked">Booked</option>
                        <option value="Checked_in">Checked-In</option>
                        <option value="dirty">Dirty (Needs Cleaning)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Advance Status</label>
                      <select
                        className="input-control"
                        value={newBooking.advance_status}
                        onChange={e => {
                          const status = e.target.value;
                          setNewBooking(prev => ({
                            ...prev,
                            advance_status: status,
                            advance_paid: status === 'Unpaid' ? 0 : selectedRoom?.min_advance
                          }));
                        }}
                        style={{ background: 'rgba(15, 23, 42, 0.85)', color: '#fff' }}
                      >
                        <option value="Paid">Paid</option>
                        <option value="Unpaid">Unpaid</option>
                      </select>
                    </div>
                    
                    <div className="form-group col-span-2">
                      <label className="form-label">Advance Paid (₹)</label>
                      <input
                        type="number"
                        className="input-control"
                        required
                        disabled={newBooking.advance_status === 'Unpaid'}
                        min={newBooking.advance_status === 'Paid' ? selectedRoom?.min_advance : 0}
                        value={newBooking.advance_status === 'Unpaid' ? 0 : newBooking.advance_paid}
                        onChange={e => setNewBooking(prev => ({ ...prev, advance_paid: e.target.value }))}
                        style={newBooking.advance_status === 'Unpaid' ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                      />
                    </div>
                  </div>

                  <div className="modal-actions" style={{ justifyContent: 'space-between', display: 'flex', width: '100%' }}>
                    {isEditMode ? (
                      <button 
                        type="button" 
                        className={newBooking.status === 'dirty' ? 'btn-submit-modal' : 'btn-cancel'}
                        style={newBooking.status === 'dirty' ? { background: 'rgba(34, 197, 94, 0.1)', borderColor: 'rgba(34, 197, 94, 0.3)', color: '#22c55e' } : { background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#ef4444' }} 
                        onClick={handleDeleteBooking}
                      >
                        {newBooking.status === 'dirty' ? '🧹 Mark as Cleaned (Vacate Room)' : 'Cancel Reservation'}
                      </button>
                    ) : (
                      <div></div>
                    )}
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button type="button" className="btn-cancel" onClick={handleCloseModal}>Close</button>
                      <button type="submit" className="btn-submit-modal">
                        {isEditMode ? 'Save Changes' : 'Save Booking'}
                      </button>
                    </div>
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

      {/* Contact Guest Modal */}
      {contactModalOpen && contactBooking && (
        <div className="modal-backdrop" onClick={handleCloseContactModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Contact Guest - Overdue Check-Out</h3>
              <button className="btn-close" onClick={handleCloseContactModal}>&times;</button>
            </div>
            <div style={{ marginBottom: '1.25rem' }}>
              <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)' }}>
                Guest Name: <strong style={{ color: '#fff' }}>{contactBooking.guest_first_name} {contactBooking.guest_last_name}</strong>
              </p>
              <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)' }}>
                Mobile Number: <strong style={{ color: '#fff' }}>+91 {contactBooking.guest_phone}</strong>
              </p>
              <p style={{ margin: '0 0 1rem 0', color: 'var(--text-secondary)' }}>
                Room: <strong style={{ color: '#fff' }}>{contactBooking.room_number} ({contactBooking.room_type})</strong>
              </p>
            </div>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Message Content</label>
              <textarea
                className="input-control"
                rows={4}
                value={customMessage}
                onChange={e => setCustomMessage(e.target.value)}
                style={{ background: 'rgba(15, 23, 42, 0.85)', color: '#fff', resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>
            <div className="contact-modal-actions" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <a 
                  href={`https://api.whatsapp.com/send?phone=91${contactBooking.guest_phone}&text=${encodeURIComponent(customMessage)}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn-contact-option whatsapp"
                  style={{ flex: 1, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#25D366', color: '#fff', padding: '0.75rem', borderRadius: '10px', fontWeight: 'bold', border: 'none', cursor: 'pointer', textAlign: 'center' }}
                >
                  💬 Send WhatsApp
                </a>
                <a 
                  href={`sms:+91${contactBooking.guest_phone}?body=${encodeURIComponent(customMessage)}`}
                  className="btn-contact-option sms"
                  style={{ flex: 1, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#3b82f6', color: '#fff', padding: '0.75rem', borderRadius: '10px', fontWeight: 'bold', border: 'none', cursor: 'pointer', textAlign: 'center' }}
                >
                  📱 Send SMS
                </a>
              </div>
              <button 
                type="button" 
                className="btn-submit-modal" 
                onClick={handleSimulateSendMessage}
                style={{ width: '100%', padding: '0.75rem' }}
              >
                ⚡ Simulate Message Send
              </button>
              <button 
                type="button" 
                className="btn-cancel" 
                onClick={handleCloseContactModal}
                style={{ width: '100%', padding: '0.75rem' }}
              >
                Close / Wait
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
