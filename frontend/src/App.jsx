import React, { useState, useEffect, useMemo } from 'react';

const TIME_OPTIONS = [
  '12:00 AM', '1:00 AM', '2:00 AM', '3:00 AM', '4:00 AM', '5:00 AM', '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM', '11:00 PM'
];

function App() {
  const [hotelCodeInput, setHotelCodeInput] = useState('');
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
    advance_status: 'Paid',
    payment_method: 'Cash',
    receipt_id: ''
  });

  const [startDate, setStartDate] = useState(new Date());

  // 14-day rolling window calendar starting from startDate
  const dates = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      arr.push(d);
    }
    return arr;
  }, [startDate]);
  
  // Toast notifications state
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Context Menu and Info Modal states
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, booking: null });
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  
  // Notes state
  const [notesText, setNotesText] = useState('');
  
  // Payment transactions quick record state
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentReceiptId, setPaymentReceiptId] = useState('');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [extraChargesInput, setExtraChargesInput] = useState('');
  const [amountToPayInput, setAmountToPayInput] = useState('');
  const [extraAmountInput, setExtraAmountInput] = useState('0');

  // Checkout modal state
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState('Cash');
  const [checkoutReceiptId, setCheckoutReceiptId] = useState('');

  // Cancellation & refund modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelRefundAmount, setCancelRefundAmount] = useState('');
  const [cancelPaymentMethod, setCancelPaymentMethod] = useState('Cash');

  // Cancellation receipt state
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  useEffect(() => {
    const handleGlobalClick = () => {
      if (contextMenu.visible) {
        setContextMenu(prev => ({ ...prev, visible: false }));
      }
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [contextMenu.visible]);

  // Helper: formats date to YYYY-MM-DD
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const generateReceiptId = () => {
    const chars = '0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `REC-${result}`;
  };



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
        if (res.status === 401) {
          handleLogout();
          throw new Error('Session expired. Please log in again.');
        }
        if (!res.ok) throw new Error('Failed to fetch rooms');
        return res.json();
      })
      .then(data => {
        setRooms(data);
      })
      .catch(err => {
        console.error(err);
        triggerToast(err.message || 'Could not load hotel rooms.');
      });

    // Fetch Bookings list
    fetch(`http://127.0.0.1:8000/api/my-hotel/bookings/?hotel_code=${hotelCode}`, {
      headers: {
        'Authorization': `Token ${token}`
      }
    })
      .then(res => {
        if (res.status === 401) {
          handleLogout();
          throw new Error('Session expired. Please log in again.');
        }
        if (!res.ok) throw new Error('Failed to fetch bookings');
        return res.json();
      })
      .then(data => {
        setBookings(data);
      })
      .catch(err => {
        console.error(err);
        triggerToast(err.message || 'Could not load current bookings.');
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
    if (!hotelCodeInput) {
      triggerToast('Please enter a hotel code.');
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
        hotel_code: hotelCodeInput.trim()
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
    setHotelCodeInput('');
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
      advance_status: 'Paid',
      payment_method: 'Cash',
      receipt_id: '',
      kyc_type: 'Aadhaar',
      kyc_number: '',
      kyc_front: null,
      kyc_back: null
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
      advance_status: booking.advance_status || 'Paid',
      payment_method: 'Cash',
      receipt_id: booking.transactions && booking.transactions.length > 0 ? (booking.transactions[0].receipt_id || '') : '',
      kyc_type: booking.kyc?.kyc_type || 'Aadhaar',
      kyc_number: booking.kyc?.kyc_number || '',
      kyc_front: null,
      kyc_back: null
    });
    setModalOpen(true);
  };

  const handleOpenInfoModal = (booking) => {
    setSelectedBooking(booking);
    setNotesText(booking.notes || '');
    setAmountToPayInput(booking.outstanding_amount.toString());
    setExtraAmountInput('0');
    setPaymentReceiptId('');
    setInfoModalOpen(true);
  };

  const handleCloseInfoModal = () => {
    setInfoModalOpen(false);
    setSelectedBooking(null);
  };

  // Helper to refresh bookings state

  const refreshBookings = (activeBookingId = null) => {
    const targetId = activeBookingId || (selectedBooking ? selectedBooking.id : null);
    fetch(`http://127.0.0.1:8000/api/my-hotel/bookings/?hotel_code=${hotelCode}&_t=${Date.now()}`, {
      headers: { 'Authorization': `Token ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setBookings(data);
        if (targetId) {
          const updated = data.find(b => b.id === targetId);
          if (updated) {
            setSelectedBooking(updated);
            setNotesText(updated.notes || '');
            setAmountToPayInput(updated.outstanding_amount.toString());
          }
        }
      });
  };

  const handleSaveNotes = () => {
    if (!selectedBooking) return;
    fetch(`http://127.0.0.1:8000/api/my-hotel/bookings/${selectedBooking.id}/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`
      },
      body: JSON.stringify({ notes: notesText })
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Failed to save notes');
        return data;
      })
      .then(data => {
        triggerToast('Notes saved successfully!');
        setSelectedBooking(data);
        setBookings(prev => prev.map(b => b.id === data.id ? data : b));
        refreshBookings(data.id);
      })
      .catch(err => triggerToast(err.message));
  };

  const handlePayTotalBill = async () => {
    if (!selectedBooking) return;
    const amountToPay = parseFloat(amountToPayInput) || 0;
    const extraAmount = parseFloat(extraAmountInput) || 0;
    const totalToPay = amountToPay + extraAmount;

    if (totalToPay <= 0) {
      triggerToast('Please enter an amount to pay.');
      return;
    }

    try {
      let finalBooking = selectedBooking;
      if (extraAmount > 0) {
        const currentExtra = parseFloat(selectedBooking.extra_charges) || 0;
        const newExtra = currentExtra + extraAmount;

        const putRes = await fetch(`http://127.0.0.1:8000/api/my-hotel/bookings/${selectedBooking.id}/`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${token}`
          },
          body: JSON.stringify({ extra_charges: newExtra })
        });
        if (!putRes.ok) {
          const putData = await putRes.json();
          throw new Error(putData.detail || 'Failed to update extra charges');
        }
        finalBooking = await putRes.json();
      }

      const postRes = await fetch(`http://127.0.0.1:8000/api/my-hotel/bookings/${finalBooking.id}/transactions/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({
          amount: totalToPay,
          payment_method: paymentMethod,
          receipt_id: paymentReceiptId
        })
      });
      if (!postRes.ok) {
        const postData = await postRes.json();
        throw new Error(postData.detail || 'Failed to log transaction');
      }
      finalBooking = await postRes.json();

      const receipt = {
        type: 'total_bill',
        guestName: `${finalBooking.guest_first_name} ${finalBooking.guest_last_name}`,
        roomNumber: finalBooking.room_number,
        stayCost: parseFloat(finalBooking.total_cost) - parseFloat(finalBooking.extra_charges || 0),
        extraCharges: parseFloat(finalBooking.extra_charges || 0),
        totalCost: parseFloat(finalBooking.total_cost),
        amountPaid: totalToPay,
        paymentMethod: paymentMethod,
        receiptId: paymentReceiptId,
        outstanding: parseFloat(finalBooking.outstanding_amount),
        timestamp: new Date().toLocaleString()
      };

      triggerToast(`Successfully processed payment of ₹${totalToPay.toLocaleString('en-IN')}!`);
      setExtraAmountInput('0');
      setPaymentReceiptId('');
      setSelectedBooking(finalBooking);
      setAmountToPayInput(finalBooking.outstanding_amount.toString());
      setBookings(prev => prev.map(b => b.id === finalBooking.id ? finalBooking : b));
      setReceiptData(receipt);
      setReceiptModalOpen(true);
      refreshBookings(finalBooking.id);
    } catch (err) {
      triggerToast(err.message);
    }
  };

  const handleCheckIn = (bookingId) => {
    fetch(`http://127.0.0.1:8000/api/my-hotel/bookings/${bookingId}/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`
      },
      body: JSON.stringify({ status: 'Checked_in' })
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Failed to check in');
        return data;
      })
      .then(data => {
        triggerToast('Guest checked in successfully!');
        setSelectedBooking(data);
        setBookings(prev => prev.map(b => b.id === data.id ? data : b));
        refreshBookings(data.id);
      })
      .catch(err => triggerToast(err.message));
  };

  const handleRecordPayment = () => {
    if (!selectedBooking || !paymentAmount) return;
    fetch(`http://127.0.0.1:8000/api/my-hotel/bookings/${selectedBooking.id}/transactions/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`
      },
      body: JSON.stringify({
        amount: parseFloat(paymentAmount),
        payment_method: paymentMethod,
        receipt_id: paymentReceiptId
      })
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Failed to log transaction');
        return data;
      })
      .then(data => {
        triggerToast('Payment transaction logged successfully!');
        setPaymentAmount('');
        setPaymentReceiptId('');
        setSelectedBooking(data);
        setBookings(prev => prev.map(b => b.id === data.id ? data : b));
        refreshBookings(data.id);
      })
      .catch(err => triggerToast(err.message));
  };

  const handleRecordAdditionalAdvance = () => {
    if (!paymentAmount) return;
    const targetBooking = contextMenu.booking || selectedBooking;
    if (!targetBooking) return;
    
    fetch(`http://127.0.0.1:8000/api/my-hotel/bookings/${targetBooking.id}/transactions/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`
      },
      body: JSON.stringify({
        amount: parseFloat(paymentAmount),
        payment_method: paymentMethod,
        receipt_id: paymentReceiptId
      })
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Failed to log transaction');
        return data;
      })
      .then(data => {
        triggerToast('Additional payment transaction logged successfully!');
        
        // Show payment receipt modal
        const receipt = {
          type: 'payment',
          guestName: `${data.guest_first_name} ${data.guest_last_name}`,
          roomNumber: data.room_number,
          amount: parseFloat(paymentAmount),
          paymentMethod: paymentMethod,
          receiptId: paymentReceiptId,
          timestamp: new Date().toLocaleString()
        };
        setReceiptData(receipt);
        setReceiptModalOpen(true);

        setPaymentAmount('');
        setPaymentReceiptId('');
        setPaymentModalOpen(false);
        setBookings(prev => prev.map(b => b.id === data.id ? data : b));
        refreshBookings(data.id);
      })
      .catch(err => triggerToast(err.message));
  };

  const handleConfirmCancel = () => {
    const targetBooking = contextMenu.booking || selectedBooking;
    if (!targetBooking) return;
    
    const receipt = {
      type: 'cancellation',
      guestName: `${targetBooking.guest_first_name} ${targetBooking.guest_last_name}`,
      roomNumber: targetBooking.room_number,
      refundAmount: parseFloat(cancelRefundAmount) || 0,
      paymentMethod: cancelPaymentMethod,
      timestamp: new Date().toLocaleString()
    };
    
    fetch(`http://127.0.0.1:8000/api/my-hotel/bookings/${targetBooking.id}/`, {
      method: 'DELETE',
      headers: { 'Authorization': `Token ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to cancel reservation');
        setCancelModalOpen(false);
        setInfoModalOpen(false);
        setReceiptData(receipt);
        setReceiptModalOpen(true);
        triggerToast('Reservation cancelled successfully.');
        refreshBookings();
      })
      .catch(err => triggerToast(err.message));
  };

  const handleConfirmCheckout = async () => {
    const targetBooking = contextMenu.booking || selectedBooking;
    if (!targetBooking) return;

    try {
      const outstanding = parseFloat(targetBooking.outstanding_amount);
      if (outstanding > 0) {
        const payRes = await fetch(`http://127.0.0.1:8000/api/my-hotel/bookings/${targetBooking.id}/transactions/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${token}`
          },
          body: JSON.stringify({
            amount: outstanding,
            payment_method: checkoutPaymentMethod,
            receipt_id: checkoutReceiptId
          })
        });
        if (!payRes.ok) {
          const payData = await payRes.json();
          throw new Error(payData.detail || 'Checkout payment logging failed');
        }
      }
            const checkoutRes = await fetch(`http://127.0.0.1:8000/api/my-hotel/bookings/${targetBooking.id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({ status: 'Checked_out', checked_out: true })
      });
      if (!checkoutRes.ok) throw new Error('Failed to check out booking');
      
      const finalBooking = await checkoutRes.json();
      
      const receipt = {
        type: 'total_bill',
        guestName: `${finalBooking.guest_first_name} ${finalBooking.guest_last_name}`,
        roomNumber: finalBooking.room_number,
        stayCost: parseFloat(finalBooking.total_cost) - parseFloat(finalBooking.extra_charges || 0),
        extraCharges: parseFloat(finalBooking.extra_charges || 0),
        totalCost: parseFloat(finalBooking.total_cost),
        amountPaid: outstanding > 0 ? outstanding : 0,
        paymentMethod: checkoutPaymentMethod,
        receiptId: checkoutReceiptId,
        outstanding: parseFloat(finalBooking.outstanding_amount),
        timestamp: new Date().toLocaleString()
      };
      
      triggerToast('Guest checked out successfully! Room status set to dirty.');
      setCheckoutModalOpen(false);
      setInfoModalOpen(false);
      setCheckoutReceiptId('');
      setReceiptData(receipt);
      setReceiptModalOpen(true);
      refreshBookings();
    } catch (err) {
      triggerToast(err.message);
    }
  };

  const isCheckoutPassed = (booking) => {
    if (booking.checked_out) return false;
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
        status: 'Checked_out',
        checked_out: true
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
        triggerToast('Guest checked out successfully! Room status set to dirty.');
        // Refresh rooms
        fetch(`http://127.0.0.1:8000/api/my-hotel/rooms/?hotel_code=${hotelCode}`, {
          headers: { 'Authorization': `Token ${token}` }
        })
          .then(res => res.json())
          .then(data => setRooms(data));
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

    // Build FormData instead of JSON to support file uploads
    const formData = new FormData();
    formData.append('room_id', selectedRoom.id);
    formData.append('guest_first_name', newBooking.guest_first_name);
    formData.append('guest_last_name', newBooking.guest_last_name);
    formData.append('guest_phone', newBooking.guest_phone);
    formData.append('guest_email', newBooking.guest_email || '');
    formData.append('check_in', newBooking.check_in);
    formData.append('check_out', newBooking.check_out);
    formData.append('status', newBooking.status);
    formData.append('advance_paid', newBooking.advance_status === 'Unpaid' ? 0.00 : advancePaidNum);
    formData.append('advance_status', newBooking.advance_status);
    formData.append('payment_method', newBooking.payment_method);
    formData.append('receipt_id', newBooking.receipt_id || '');

    if (newBooking.kyc_type) {
      formData.append('kyc_type', newBooking.kyc_type);
    }
    if (newBooking.kyc_number) {
      formData.append('kyc_number', newBooking.kyc_number);
    }
    if (newBooking.kyc_front) {
      formData.append('kyc_front', newBooking.kyc_front);
    }
    if (newBooking.kyc_back) {
      formData.append('kyc_back', newBooking.kyc_back);
    }

    fetch(url, {
      method: method,
      headers: {
        'Authorization': `Token ${token}`
      },
      body: formData
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
        
        // Show advance payment receipt if Paid
        if (newBooking.advance_status === 'Paid' && advancePaidNum > 0) {
          const receipt = {
            type: 'payment',
            guestName: `${data.guest_first_name} ${data.guest_last_name}`,
            roomNumber: data.room_number,
            amount: advancePaidNum,
            paymentMethod: newBooking.payment_method,
            receiptId: newBooking.receipt_id,
            timestamp: new Date().toLocaleString()
          };
          setReceiptData(receipt);
          setReceiptModalOpen(true);
        }

        // Refresh rooms
        fetch(`http://127.0.0.1:8000/api/my-hotel/rooms/?hotel_code=${hotelCode}`, {
          headers: { 'Authorization': `Token ${token}` }
        })
          .then(res => res.json())
          .then(data => setRooms(data));

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
    const isDirty = selectedRoom?.cleanliness === 'dirty';
    const confirmMsg = isDirty 
      ? 'Are you sure you want to mark this room as cleaned?' 
      : 'Are you sure you want to cancel this reservation?';
    
    if (!window.confirm(confirmMsg)) return;
    
    if (isDirty) {
      // Mark room as clean
      fetch(`http://127.0.0.1:8000/api/my-hotel/rooms/${selectedRoom.id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({ cleanliness: 'clean' })
      })
        .then(async res => {
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.detail || 'Failed to clean room');
          }
        })
        .then(() => {
          triggerToast('Room marked as cleaned!');
          // Refresh rooms
          fetch(`http://127.0.0.1:8000/api/my-hotel/rooms/?hotel_code=${hotelCode}`, {
            headers: { 'Authorization': `Token ${token}` }
          })
            .then(res => res.json())
            .then(data => setRooms(data));
          // Refresh bookings
          refreshBookings();
          handleCloseModal();
        })
        .catch(err => {
          console.error(err);
          triggerToast(err.message || 'Error occurred while cleaning room.');
        });
    } else {
      // Cancel reservation
      const url = `http://127.0.0.1:8000/api/my-hotel/bookings/${editingBookingId}/`;
      fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${token}`
        }
      })
        .then(async res => {
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.detail || 'Failed to cancel reservation');
          }
        })
        .then(() => {
          triggerToast('Reservation cancelled successfully!');
          // Refresh bookings
          refreshBookings();
          handleCloseModal();
        })
        .catch(err => {
          console.error(err);
          triggerToast(err.message || 'Error occurred while cancelling reservation.');
        });
    }
  };

  const handleQuickMarkCleaned = (bookingId) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;
    
    if (!window.confirm('Are you sure you want to mark this room as cleaned?')) return;
    
    fetch(`http://127.0.0.1:8000/api/my-hotel/rooms/${booking.room_id}/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`
      },
      body: JSON.stringify({ cleanliness: 'clean' })
    })
      .then(async res => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.detail || 'Failed to clean room');
        }
      })
      .then(() => {
        triggerToast('Room marked as cleaned!');
        // Refresh rooms
        fetch(`http://127.0.0.1:8000/api/my-hotel/rooms/?hotel_code=${hotelCode}`, {
          headers: { 'Authorization': `Token ${token}` }
        })
          .then(res => res.json())
          .then(data => setRooms(data));
        // Refresh bookings
        refreshBookings();
      })
      .catch(err => {
        console.error(err);
        triggerToast(err.message || 'Error occurred while cleaning room.');
      });
  };

  const handleUpdateCleanliness = async (newStatus) => {
    if (!selectedBooking) return;
    
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/my-hotel/rooms/${selectedBooking.room_id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({ cleanliness: newStatus })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to update cleanliness');
      }
      
      triggerToast(`Room cleanliness marked as ${newStatus}!`);
      
      // Refresh room list
      fetch(`http://127.0.0.1:8000/api/my-hotel/rooms/?hotel_code=${hotelCode}`, {
        headers: { 'Authorization': `Token ${token}` }
      })
        .then(res => res.json())
        .then(data => setRooms(data));
      
      // Refresh bookings
      refreshBookings(selectedBooking.id);
    } catch (err) {
      triggerToast(err.message);
    }
  };

  const handleToggleKYCVerification = (bookingId, isVerified) => {
    fetch(`http://127.0.0.1:8000/api/my-hotel/bookings/${bookingId}/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`
      },
      body: JSON.stringify({ kyc_verified: isVerified })
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Failed to update KYC status');
        return data;
      })
      .then(data => {
        triggerToast(`KYC status updated successfully!`);
        setSelectedBooking(data);
        setBookings(prev => prev.map(b => b.id === data.id ? data : b));
        refreshBookings(data.id);
      })
      .catch(err => triggerToast(err.message));
  };

  // Toggle room cleanliness status is handled directly on booking records via the Allotment Details modal.

  // Renders a horizontal row of cells matching the calendar dates
  const renderCalendarCells = (room) => {
    const cells = [];
    let i = 0;
    while (i < 14) {
      const dateStr = formatDate(dates[i]);
      // Find booking covering dateStr
      const booking = bookings.find(b => {
        if (Number(b.room_id) !== Number(room.id)) return false;
        
        // Is dateStr within the booking's stay?
        const isWithinStay = b.check_in <= dateStr && b.check_out > dateStr;
        if (!isWithinStay) return false;

        // If booking is active (Booked or Checked_in)
        if (b.status === 'Booked' || b.status === 'Checked_in') {
          return true;
        }

        // If booking is Checked_out:
        if (b.status === 'Checked_out') {
          // It only shows up if the room is currently dirty, AND this is the most recent Checked_out booking for this room.
          if (room.cleanliness === 'dirty') {
            const roomCheckedOuts = bookings
              .filter(x => Number(x.room_id) === Number(room.id) && x.status === 'Checked_out')
              .sort((a, b) => new Date(b.check_out) - new Date(a.check_out));
            return roomCheckedOuts.length > 0 && roomCheckedOuts[0].id === b.id;
          }
        }
        return false;
      });
      
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
          
          const isDirtyVisual = booking.status === 'Checked_out' && room.cleanliness === 'dirty';
          
          cells.push(
            <td
              key={`booking-${booking.id}-${dateStr}`}
              colSpan={span}
              className={`booking-cell status-${isDirtyVisual ? 'dirty' : booking.status.toLowerCase().replace(' ', '-')}`}
              onClick={(e) => {
                e.stopPropagation();
                handleOpenInfoModal(booking);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setContextMenu({
                  visible: true,
                  x: e.clientX,
                  y: e.clientY,
                  booking: booking
                });
              }}
            >
              <div 
                className="booking-info-block"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenInfoModal(booking);
                }}
              >
                <div className="booking-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <span className="booking-guest-name" style={{ maxWidth: '85%', fontStyle: booking.checked_out ? 'italic' : 'normal', opacity: booking.checked_out ? 0.75 : 1 }}>
                    {isDirtyVisual ? '🧹 Needs Cleaning (Checked Out)' : `${booking.guest_first_name} ${booking.guest_last_name}`}
                  </span>
                  <span className="booking-edit-indicator" title="View Info / Notes" style={{ fontSize: '0.75rem', opacity: 0.6 }}>ℹ️</span>
                </div>
                <div className="booking-footer-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginTop: '4px' }}>
                  <span 
                    className="booking-badge"
                    style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '4px', 
                      padding: '2px 4px', 
                      borderRadius: '4px', 
                      background: isDirtyVisual
                        ? 'rgba(239, 68, 68, 0.2)'
                        : booking.status === 'Checked_in'
                        ? 'rgba(34, 197, 94, 0.2)'
                        : booking.status === 'Booked'
                        ? 'rgba(59, 130, 246, 0.2)'
                        : 'rgba(239, 68, 68, 0.2)',
                      color: isDirtyVisual
                        ? '#ef4444'
                        : booking.status === 'Checked_in'
                        ? '#4ade80'
                        : booking.status === 'Booked'
                        ? '#60a5fa'
                        : '#ef4444'
                    }}
                  >
                    {isDirtyVisual
                      ? '🧹 Needs Cleaning'
                      : booking.status === 'Checked_in'
                      ? '✨ Checked-In'
                      : booking.status === 'Booked'
                      ? '📅 Booked'
                      : '🚪 Checked-Out'}
                  </span>
                  <span className="booking-advance" style={booking.checked_out ? { color: 'var(--text-secondary)', fontSize: '0.7rem' } : (booking.advance_status === 'Unpaid' ? { color: '#f87171', fontSize: '0.65rem', fontWeight: 'bold' } : {})}>
                    {booking.checked_out ? '🚪 Checked Out' : (booking.advance_status === 'Unpaid' ? 'Incomplete Advance' : `₹${parseFloat(booking.advance_paid).toLocaleString('en-IN')}`)}
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
            <div className="calendar-header-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <h2>Front Desk Booking Calendar Grid</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <button 
                  className="btn-cancel" 
                  style={{ padding: '6px 12px', fontSize: '0.75rem', background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.15)', height: '30px', display: 'flex', alignItems: 'center' }}
                  onClick={() => setStartDate(new Date())}
                >
                  📅 Today
                </button>
                <button 
                  className="btn-cancel" 
                  style={{ padding: '6px 12px', fontSize: '0.75rem', background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.15)', height: '30px', display: 'flex', alignItems: 'center' }}
                  onClick={() => {
                    const prev = new Date(startDate);
                    prev.setDate(prev.getDate() - 14);
                    setStartDate(prev);
                  }}
                >
                  ◀ 14 Days
                </button>
                <button 
                  className="btn-cancel" 
                  style={{ padding: '6px 12px', fontSize: '0.75rem', background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.15)', height: '30px', display: 'flex', alignItems: 'center' }}
                  onClick={() => {
                    const next = new Date(startDate);
                    next.setDate(next.getDate() + 14);
                    setStartDate(next);
                  }}
                >
                  14 Days ▶
                </button>
              </div>
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
                    <th className="room-column-header">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <span>Room Details</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} title="Click calendar to book prior / choose date">
                          <span style={{ fontSize: '0.85rem', color: '#60a5fa', cursor: 'pointer' }} onClick={() => {
                            const dp = document.getElementById('calendar-jump-date-picker');
                            if (dp && typeof dp.showPicker === 'function') dp.showPicker();
                          }}>➕</span>
                          <input 
                            id="calendar-jump-date-picker"
                            type="date"
                            style={{ 
                              background: '#0f172a',
                              border: '1px solid rgba(255,255,255,0.15)',
                              borderRadius: '4px',
                              color: '#fff', 
                              fontSize: '0.7rem', 
                              outline: 'none', 
                              cursor: 'pointer',
                              padding: '2px 4px',
                              width: '115px'
                            }}
                            value={startDate.toISOString().split('T')[0]} 
                            onChange={(e) => {
                              if (e.target.value) {
                                setStartDate(new Date(e.target.value));
                              }
                            }}
                          />
                        </div>
                      </div>
                    </th>
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
                  {isEditMode && selectedRoom?.cleanliness === 'dirty' && (
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

                    {!isEditMode && newBooking.advance_status === 'Paid' && (
                      <>
                        <div className="form-group">
                          <label className="form-label">Payment Method</label>
                          <select
                            className="input-control"
                            value={newBooking.payment_method}
                            onChange={e => setNewBooking(prev => ({ ...prev, payment_method: e.target.value }))}
                            style={{ background: 'rgba(15, 23, 42, 0.85)', color: '#fff' }}
                          >
                            <option value="Cash">Cash</option>
                            <option value="UPI">UPI</option>
                            <option value="Card">Card</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Receipt ID (Optional)</label>
                          <input
                            type="text"
                            className="input-control"
                            placeholder="XXX-XXX"
                            value={newBooking.receipt_id}
                            onChange={e => setNewBooking(prev => ({ ...prev, receipt_id: e.target.value }))}
                          />
                        </div>
                      </>
                    )}

                    <div className="form-group col-span-2" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '12px', marginTop: '12px' }}>
                      <label className="form-label" style={{ fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--primary)' }}>🆔 Customer KYC Verification</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
                        <div>
                          <label className="form-label">ID Document Type</label>
                          <select
                            className="input-control"
                            value={newBooking.kyc_type || 'Aadhaar'}
                            onChange={e => setNewBooking(prev => ({ ...prev, kyc_type: e.target.value }))}
                            style={{ background: 'rgba(15, 23, 42, 0.85)', color: '#fff' }}
                          >
                            <option value="Aadhaar">Aadhaar</option>
                            <option value="PAN">PAN Card</option>
                          </select>
                        </div>
                        <div>
                          <label className="form-label">ID Document Number</label>
                          <input
                            type="text"
                            className="input-control"
                            placeholder="Enter Document Number"
                            value={newBooking.kyc_number || ''}
                            onChange={e => setNewBooking(prev => ({ ...prev, kyc_number: e.target.value }))}
                          />
                        </div>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                        <div>
                          <label className="form-label">ID Front Image</label>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            className="input-control"
                            style={{ padding: '10px 12px', fontSize: '0.8rem', height: '48px', boxSizing: 'border-box' }}
                            onChange={e => {
                              const file = e.target.files[0];
                              setNewBooking(prev => ({ ...prev, kyc_front: file }));
                            }}
                          />
                        </div>
                        <div>
                          <label className="form-label">ID Back Image</label>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            className="input-control"
                            style={{ padding: '10px 12px', fontSize: '0.8rem', height: '48px', boxSizing: 'border-box' }}
                            onChange={e => {
                              const file = e.target.files[0];
                              setNewBooking(prev => ({ ...prev, kyc_back: file }));
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="modal-actions" style={{ justifyContent: 'space-between', display: 'flex', width: '100%' }}>
                    {isEditMode ? (
                      <button 
                        type="button" 
                        className={selectedRoom?.cleanliness === 'dirty' ? 'btn-submit-modal' : 'btn-cancel'}
                        style={selectedRoom?.cleanliness === 'dirty' ? { background: 'rgba(34, 197, 94, 0.1)', borderColor: 'rgba(34, 197, 94, 0.3)', color: '#22c55e' } : { background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#ef4444' }} 
                        onClick={handleDeleteBooking}
                      >
                        {selectedRoom?.cleanliness === 'dirty' ? '🧹 Mark as Cleaned' : 'Cancel Reservation'}
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

          {/* Context Menu */}
          {contextMenu.visible && (
            <div 
              className="context-menu" 
              style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
              onClick={(e) => e.stopPropagation()}
            >
              <div 
                className="context-menu-item"
                onClick={() => {
                  setContextMenu(prev => ({ ...prev, visible: false }));
                  handleOpenInfoModal(contextMenu.booking);
                }}
              >
                ℹ️ View Info / Notes
              </div>
              <div 
                className="context-menu-item"
                onClick={() => {
                  setContextMenu(prev => ({ ...prev, visible: false }));
                  handleOpenEditModal(contextMenu.booking);
                }}
              >
                ✏️ Edit Booking Details
              </div>
              
              {(() => {
                const contextRoom = rooms.find(r => Number(r.id) === Number(contextMenu.booking.room_id));
                const contextRoomIsDirty = contextRoom && contextRoom.cleanliness === 'dirty';
                
                return (
                  <>
                    {!contextMenu.booking.checked_out && contextMenu.booking.status === 'Booked' && (
                      <div 
                        className="context-menu-item"
                        onClick={() => {
                          setContextMenu(prev => ({ ...prev, visible: false }));
                          handleCheckIn(contextMenu.booking.id);
                        }}
                      >
                        🟢 Check In Guest
                      </div>
                    )}
                    
                    {!contextMenu.booking.checked_out && (
                      <div 
                        className="context-menu-item"
                        onClick={() => {
                          setPaymentAmount('');
                          setPaymentReceiptId('');
                          setPaymentMethod('Cash');
                          setPaymentModalOpen(true);
                          setContextMenu(prev => ({ ...prev, visible: false }));
                        }}
                      >
                        💵 Add Payment (Advance)
                      </div>
                    )}

                    {!contextMenu.booking.checked_out && contextMenu.booking.status === 'Checked_in' && (
                      <div 
                        className="context-menu-item"
                        onClick={() => {
                          setCheckoutPaymentMethod('Cash');
                          setCheckoutReceiptId('');
                          setCheckoutModalOpen(true);
                          setContextMenu(prev => ({ ...prev, visible: false }));
                        }}
                      >
                        🚪 Check Out Guest
                      </div>
                    )}
                    
                    <div className="context-menu-divider"></div>
                    
                    {contextRoomIsDirty ? (
                      <div 
                        className="context-menu-item"
                        style={{ color: '#4ade80' }}
                        onClick={() => {
                          setContextMenu(prev => ({ ...prev, visible: false }));
                          handleQuickMarkCleaned(contextMenu.booking.id);
                        }}
                      >
                        🧹 Mark as Cleaned
                      </div>
                    ) : (
                      !contextMenu.booking.checked_out && (
                        <div 
                          className="context-menu-item danger"
                          onClick={() => {
                            setCancelRefundAmount(contextMenu.booking.advance_paid);
                            setCancelPaymentMethod('Cash');
                            setCancelModalOpen(true);
                            setContextMenu(prev => ({ ...prev, visible: false }));
                          }}
                        >
                          ❌ Cancel Reservation
                        </div>
                      )
                    )}
                  </>
                );
              })()}
            </div>
          )}

          {/* Info Modal / Details Panel */}
          {infoModalOpen && selectedBooking && (
            <div className="modal-backdrop" onClick={handleCloseInfoModal}>
              <div className="modal-content" style={{ maxWidth: '800px', width: '90%' }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>Room {selectedBooking.room_number} Allotment Details {selectedBooking.checked_out && <span style={{ color: '#ef4444', fontSize: '0.9rem', marginLeft: '12px' }}>(Checked Out)</span>}</h3>
                  <button className="btn-close" onClick={handleCloseInfoModal}>&times;</button>
                </div>

                <div className="info-modal-grid">
                  {/* Left Column: Guest Info & Notes */}
                  {/* Left Column: Guest Info & Notes */}
                  {(() => {
                    const roomCleanliness = (() => {
                      const r = rooms.find(rm => Number(rm.id) === Number(selectedBooking.room_id));
                      return r ? r.cleanliness : 'clean';
                    })();
                    
                    return (
                      <div className="info-section-card">
                        <h4 className="info-section-title">👤 Guest & Stay Information</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '8px 12px', fontSize: '0.85rem' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Guest:</span>
                          <strong>{selectedBooking.guest_first_name} {selectedBooking.guest_last_name}</strong>

                          <span style={{ color: 'var(--text-secondary)' }}>Phone:</span>
                          <strong>{selectedBooking.guest_phone}</strong>

                          <span style={{ color: 'var(--text-secondary)' }}>Email:</span>
                          <strong>{selectedBooking.guest_email || 'N/A'}</strong>

                          <span style={{ color: 'var(--text-secondary)' }}>Room Category:</span>
                          <strong>{selectedBooking.room_type}</strong>

                          <span style={{ color: 'var(--text-secondary)' }}>Stay Duration:</span>
                          <strong>{selectedBooking.check_in} to {selectedBooking.check_out}</strong>

                          <span style={{ color: 'var(--text-secondary)' }}>Check-in Time:</span>
                          <strong>{selectedBooking.check_in_time}</strong>

                          <span style={{ color: 'var(--text-secondary)' }}>Check-out Time:</span>
                          <strong>{selectedBooking.check_out_time}</strong>

                          <span style={{ color: 'var(--text-secondary)' }}>Status:</span>
                          <div>
                            <span style={{
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '0.7rem',
                              fontWeight: 'bold',
                              background: selectedBooking.checked_out
                                ? 'rgba(239, 68, 68, 0.2)'
                                : selectedBooking.status === 'Checked_in'
                                ? 'rgba(34, 197, 94, 0.2)'
                                : selectedBooking.status === 'Booked'
                                ? 'rgba(59, 130, 246, 0.2)'
                                : 'rgba(239, 68, 68, 0.2)',
                              color: selectedBooking.checked_out
                                ? '#ef4444'
                                : selectedBooking.status === 'Checked_in'
                                ? '#4ade80'
                                : selectedBooking.status === 'Booked'
                                ? '#60a5fa'
                                : '#ef4444'
                            }}>
                              {selectedBooking.checked_out
                                ? 'Checked-Out'
                                : selectedBooking.status === 'Checked_in'
                                ? 'Checked-In'
                                : selectedBooking.status === 'Booked'
                                ? 'Booked'
                                : 'Checked-Out'}
                            </span>
                          </div>

                          <span style={{ color: 'var(--text-secondary)' }}>Cleanliness:</span>
                          <div>
                            <span style={{
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '0.7rem',
                              fontWeight: 'bold',
                              background: roomCleanliness === 'dirty' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                              color: roomCleanliness === 'dirty' ? '#ef4444' : '#4ade80'
                            }}>
                              {roomCleanliness === 'dirty' ? '🧹 Needs Cleaning' : '✨ Cleaned'}
                            </span>
                          </div>
                        </div>

                        {/* KYC Info Section */}
                        {selectedBooking.kyc && selectedBooking.kyc.kyc_type && (
                          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px', marginTop: '12px' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--primary)', marginBottom: '8px' }}>🆔 Guest KYC Info</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '8px 12px', fontSize: '0.85rem' }}>
                              <span style={{ color: 'var(--text-secondary)' }}>Document Type:</span>
                              <strong>{selectedBooking.kyc.kyc_type}</strong>

                              <span style={{ color: 'var(--text-secondary)' }}>Document Number:</span>
                              <strong>{selectedBooking.kyc.kyc_number || 'N/A'}</strong>

                              <span style={{ color: 'var(--text-secondary)' }}>KYC Verified:</span>
                              <div>
                                <span style={{
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  fontSize: '0.7rem',
                                  fontWeight: 'bold',
                                  background: selectedBooking.kyc.kyc_verified ? 'rgba(34, 197, 94, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                                  color: selectedBooking.kyc.kyc_verified ? '#4ade80' : '#fbbf24'
                                }}>
                                  {selectedBooking.kyc.kyc_verified ? '✅ Verified' : '⚠️ Pending Verification'}
                                </span>
                                <button
                                  type="button"
                                  className="btn-submit-modal"
                                  style={{
                                    marginLeft: '10px',
                                    padding: '2px 6px',
                                    fontSize: '0.65rem',
                                    height: 'auto',
                                    width: 'auto',
                                    background: selectedBooking.kyc.kyc_verified ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                                    borderColor: selectedBooking.kyc.kyc_verified ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)',
                                    color: selectedBooking.kyc.kyc_verified ? '#ef4444' : '#34d399'
                                  }}
                                  onClick={() => handleToggleKYCVerification(selectedBooking.id, !selectedBooking.kyc.kyc_verified)}
                                >
                                  {selectedBooking.kyc.kyc_verified ? 'Mark Unverified' : 'Verify KYC'}
                                </button>
                              </div>

                              <span style={{ color: 'var(--text-secondary)' }}>Uploaded ID Files:</span>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                {selectedBooking.kyc.kyc_front && (
                                  <a 
                                    href={`http://127.0.0.1:8000${selectedBooking.kyc.kyc_front}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    style={{ textDecoration: 'none' }}
                                  >
                                    <div style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '4px', borderRadius: '4px', textAlign: 'center', background: 'rgba(0,0,0,0.2)' }}>
                                      <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>ID Front</div>
                                      <img 
                                        src={`http://127.0.0.1:8000${selectedBooking.kyc.kyc_front}`} 
                                        alt="KYC Front" 
                                        style={{ height: '40px', objectFit: 'contain', display: 'block', margin: '4px auto 0' }}
                                      />
                                    </div>
                                  </a>
                                )}
                                {selectedBooking.kyc.kyc_back && (
                                  <a 
                                    href={`http://127.0.0.1:8000${selectedBooking.kyc.kyc_back}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    style={{ textDecoration: 'none' }}
                                  >
                                    <div style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '4px', borderRadius: '4px', textAlign: 'center', background: 'rgba(0,0,0,0.2)' }}>
                                      <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>ID Back</div>
                                      <img 
                                        src={`http://127.0.0.1:8000${selectedBooking.kyc.kyc_back}`} 
                                        alt="KYC Back" 
                                        style={{ height: '40px', objectFit: 'contain', display: 'block', margin: '4px auto 0' }}
                                      />
                                    </div>
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        <div style={{ marginTop: '1rem' }}>
                          <h4 className="info-section-title">📝 Special Notes & Requests</h4>
                          <textarea
                            className="notes-textarea"
                            placeholder="Add booking notes, preferences, or issues..."
                            value={notesText}
                            onChange={e => setNotesText(e.target.value)}
                          />
                          <button 
                            type="button" 
                            className="btn-submit-modal" 
                            style={{ marginTop: '8px', width: 'auto', fontSize: '0.75rem', padding: '6px 12px' }}
                            onClick={handleSaveNotes}
                          >
                            💾 Save Notes
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Right Column: Billing & Transactions */}
                  <div className="info-section-card">
                    <h4 className="info-section-title">💳 Billing & Transactions</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Stay Room Tariff Cost:</span>
                        <strong>₹{(parseFloat(selectedBooking.total_cost) - parseFloat(selectedBooking.extra_charges || 0)).toLocaleString('en-IN')}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Extra Charges / Incidentals:</span>
                        <strong style={{ color: parseFloat(selectedBooking.extra_charges || 0) > 0 ? '#a78bfa' : 'inherit' }}>
                          ₹{parseFloat(selectedBooking.extra_charges || 0).toLocaleString('en-IN')}
                        </strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '4px', marginTop: '2px' }}>
                        <span>Total Stay Cost:</span>
                        <strong>₹{parseFloat(selectedBooking.total_cost).toLocaleString('en-IN')}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Total Amount Paid:</span>
                        <strong style={{ color: '#4ade80' }}>₹{parseFloat(selectedBooking.advance_paid).toLocaleString('en-IN')}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '4px', marginTop: '2px' }}>
                        <span>Outstanding Balance:</span>
                        <strong style={{ color: parseFloat(selectedBooking.outstanding_amount) > 0 ? '#f87171' : '#4ade80' }}>
                          ₹{parseFloat(selectedBooking.outstanding_amount).toLocaleString('en-IN')}
                        </strong>
                      </div>
                      {parseFloat(selectedBooking.outstanding_amount) <= 0 ? (
                        <div className="outstanding-badge-paid" style={{ marginTop: '4px' }}>✅ Fully Paid</div>
                      ) : (
                        <div className="outstanding-badge-unpaid" style={{ marginTop: '4px' }}>⚠️ Outstanding Balance Due</div>
                      )}
                    </div>

                    <div style={{ flex: 1, minHeight: '120px', overflowY: 'auto' }}>
                      <table className="txn-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>Method</th>
                            <th>Receipt ID</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedBooking.transactions && selectedBooking.transactions.length > 0 ? (
                            selectedBooking.transactions.map(t => (
                              <tr key={t.id}>
                                <td>{t.created_at}</td>
                                <td>₹{parseFloat(t.amount).toLocaleString('en-IN')}</td>
                                <td>{t.payment_method}</td>
                                <td>{t.receipt_id || 'N/A'}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No transactions recorded.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {selectedBooking.status !== 'dirty' && (
                      <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '8px', marginTop: '4px' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '6px' }}>Receive Payment & Add Charges</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                          <div>
                            <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>Amount to Pay (Room Tariff)</label>
                            <input
                              type="number"
                              className="input-control-small"
                              placeholder="Amount to Pay (₹)"
                              value={amountToPayInput}
                              onChange={e => setAmountToPayInput(e.target.value)}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>Extra / Incidentals Charge</label>
                            <input
                              type="number"
                              className="input-control-small"
                              placeholder="Extra Amount (₹)"
                              value={extraAmountInput}
                              onChange={e => setExtraAmountInput(e.target.value)}
                            />
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '8px', marginBottom: '8px' }}>
                          <div>
                            <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>Payment Method</label>
                            <select
                              className="input-control-small"
                              value={paymentMethod}
                              onChange={e => setPaymentMethod(e.target.value)}
                            >
                              <option value="Cash">Cash</option>
                              <option value="UPI">UPI</option>
                              <option value="Card">Card</option>
                            </select>
                          </div>
                          <div>
                            <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>Receipt/Txn ID (Optional)</label>
                            <input
                              type="text"
                              className="input-control-small"
                              placeholder="XXX-XXX"
                              value={paymentReceiptId}
                              onChange={e => setPaymentReceiptId(e.target.value)}
                            />
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.03)', padding: '6px 10px', borderRadius: '4px', marginBottom: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total to Collect:</span>
                          <strong style={{ fontSize: '0.9rem', color: '#4ade80' }}>
                            ₹{((parseFloat(amountToPayInput) || 0) + (parseFloat(extraAmountInput) || 0)).toLocaleString('en-IN')}
                          </strong>
                        </div>

                        <button
                          type="button"
                          className="btn-submit-modal"
                          style={{ height: '32px', fontSize: '0.8rem', width: '100%', background: 'rgba(52, 211, 153, 0.1)', borderColor: 'rgba(52, 211, 153, 0.3)', color: '#34d399', fontWeight: 'bold' }}
                          onClick={handlePayTotalBill}
                        >
                          💳 Pay Total & Print Receipt
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="modal-actions" style={{ justifyContent: 'space-between', display: 'flex', width: '100%', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '12px', marginTop: '12px' }}>
                  {(() => {
                    const currentRoomObj = rooms.find(r => Number(r.id) === Number(selectedBooking.room_id));
                    const roomIsDirty = currentRoomObj && currentRoomObj.cleanliness === 'dirty';
                    
                    return (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {!selectedBooking.checked_out && selectedBooking.status === 'Booked' && (
                          <button 
                            type="button" 
                            className="btn-submit-modal" 
                            style={{ background: 'rgba(34, 197, 94, 0.1)', borderColor: 'rgba(34, 197, 94, 0.3)', color: '#4ade80' }}
                            onClick={() => handleCheckIn(selectedBooking.id)}
                          >
                            🟢 Check In
                          </button>
                        )}
                        {!selectedBooking.checked_out && selectedBooking.status === 'Checked_in' && (
                          <button 
                            type="button" 
                            className="btn-submit-modal" 
                            style={{ background: 'rgba(167, 139, 250, 0.1)', borderColor: 'rgba(167, 139, 250, 0.3)', color: '#c084fc' }}
                            onClick={() => {
                              setCheckoutPaymentMethod('Cash');
                              setCheckoutReceiptId('');
                              setCheckoutModalOpen(true);
                            }}
                          >
                            🚪 Check Out
                          </button>
                        )}
                        {roomIsDirty && (
                          <button 
                            type="button" 
                            className="btn-submit-modal" 
                            style={{ background: 'rgba(34, 197, 94, 0.1)', borderColor: 'rgba(34, 197, 94, 0.3)', color: '#22c55e' }}
                            onClick={() => {
                              handleCloseInfoModal();
                              handleQuickMarkCleaned(selectedBooking.id);
                            }}
                          >
                            🧹 Mark as Cleaned
                          </button>
                        )}
                        {!selectedBooking.checked_out && (
                          <button 
                            type="button" 
                            className="btn-cancel" 
                            style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#ef4444' }}
                            onClick={() => {
                              setCancelRefundAmount(selectedBooking.advance_paid);
                              setCancelPaymentMethod('Cash');
                              setCancelModalOpen(true);
                            }}
                          >
                            ❌ Cancel Reservation
                          </button>
                        )}
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '12px', borderLeft: '1px solid rgba(255, 255, 255, 0.1)', paddingLeft: '12px' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Room Cleanliness:</span>
                          <select
                            className="input-control-small"
                            style={{ width: '185px' }}
                            value={roomIsDirty ? 'dirty' : 'clean'}
                            onChange={e => handleUpdateCleanliness(e.target.value)}
                          >
                            <option value="clean">🧼 Clean</option>
                            <option value="dirty">🧹 Dirty (Needs Cleaning)</option>
                          </select>
                        </div>
                      </div>
                    );
                  })()}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {!selectedBooking.checked_out && (
                      <button type="button" className="btn-submit-modal" onClick={() => {
                        handleCloseInfoModal();
                        handleOpenEditModal(selectedBooking);
                      }}>✏️ Edit Details</button>
                    )}
                    <button type="button" className="btn-cancel" onClick={handleCloseInfoModal}>Close</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Payment Modal */}
          {paymentModalOpen && (contextMenu.booking || selectedBooking) && (
            <div className="modal-backdrop" style={{ zIndex: 10000 }} onClick={() => setPaymentModalOpen(false)}>
              <div className="modal-content" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>Log Additional Payment</h3>
                  <button className="btn-close" onClick={() => setPaymentModalOpen(false)}>&times;</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                  <div className="form-group">
                    <label className="form-label">Payment Amount (₹)</label>
                    <input
                      type="number"
                      className="input-control"
                      placeholder="Enter amount paid"
                      value={paymentAmount}
                      onChange={e => setPaymentAmount(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Payment Method</label>
                    <select
                      className="input-control"
                      value={paymentMethod}
                      onChange={e => setPaymentMethod(e.target.value)}
                      style={{ background: '#0f172a' }}
                    >
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="Card">Card</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Receipt ID (Optional)</label>
                    <input
                      type="text"
                      className="input-control"
                      placeholder="XXX-XXX"
                      value={paymentReceiptId}
                      onChange={e => setPaymentReceiptId(e.target.value)}
                    />
                  </div>
                  <div className="modal-actions" style={{ marginTop: '12px' }}>
                    <button type="button" className="btn-cancel" onClick={() => setPaymentModalOpen(false)}>Cancel</button>
                    <button type="button" className="btn-submit-modal" onClick={handleRecordAdditionalAdvance}>Log Transaction</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Checkout Modal */}
          {checkoutModalOpen && (contextMenu.booking || selectedBooking) && (
            <div className="modal-backdrop" style={{ zIndex: 10000 }} onClick={() => setCheckoutModalOpen(false)}>
              <div className="modal-content" style={{ maxWidth: '450px' }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>🚪 Room Check-Out</h3>
                  <button className="btn-close" onClick={() => setCheckoutModalOpen(false)}>&times;</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px', fontSize: '0.85rem' }}>
                  <div>Guest Name: <strong>{(contextMenu.booking || selectedBooking).guest_first_name} {(contextMenu.booking || selectedBooking).guest_last_name}</strong></div>
                  <div>Room: <strong>{(contextMenu.booking || selectedBooking).room_number} ({(contextMenu.booking || selectedBooking).room_type})</strong></div>
                  <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '8px 0' }}></div>
                  <div>Total Stay Cost: <strong>₹{parseFloat((contextMenu.booking || selectedBooking).total_cost).toLocaleString('en-IN')}</strong></div>
                  <div>Total Amount Paid: <strong>₹{parseFloat((contextMenu.booking || selectedBooking).advance_paid).toLocaleString('en-IN')}</strong></div>
                  <div style={{ fontSize: '1rem', marginTop: '6px' }}>
                    Outstanding Balance: <strong style={{ color: parseFloat((contextMenu.booking || selectedBooking).outstanding_amount) > 0 ? '#f87171' : '#4ade80' }}>
                      ₹{parseFloat((contextMenu.booking || selectedBooking).outstanding_amount).toLocaleString('en-IN')}
                    </strong>
                  </div>
                  
                  {parseFloat((contextMenu.booking || selectedBooking).outstanding_amount) > 0 ? (
                    <div style={{ marginTop: '8px', background: 'rgba(30,41,59,0.3)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.04)' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#a78bfa' }}>Receive Outstanding Payment</div>
                      <div className="form-group" style={{ marginBottom: '6px' }}>
                        <label className="form-label">Amount (₹)</label>
                        <input
                          type="number"
                          className="input-control"
                          disabled
                          value={(contextMenu.booking || selectedBooking).outstanding_amount}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: '6px' }}>
                        <label className="form-label">Payment Method</label>
                        <select
                          className="input-control"
                          value={checkoutPaymentMethod}
                          onChange={e => setCheckoutPaymentMethod(e.target.value)}
                          style={{ background: '#0f172a' }}
                        >
                          <option value="Cash">Cash</option>
                          <option value="UPI">UPI</option>
                          <option value="Card">Card</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Receipt ID (Optional)</label>
                        <input
                          type="text"
                          className="input-control"
                          placeholder="XXX-XXX"
                          value={checkoutReceiptId}
                          onChange={e => setCheckoutReceiptId(e.target.value)}
                        />
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginTop: '8px', color: '#4ade80', background: 'rgba(34, 197, 94, 0.05)', padding: '8px', borderRadius: '6px', textAlign: 'center', fontWeight: 'bold' }}>
                      ✅ Stay Fully Paid. Ready for checkout.
                    </div>
                  )}

                  <div className="modal-actions" style={{ marginTop: '12px' }}>
                    <button type="button" className="btn-cancel" onClick={() => setCheckoutModalOpen(false)}>Cancel</button>
                    <button type="button" className="btn-submit-modal" onClick={handleConfirmCheckout}>
                      {parseFloat((contextMenu.booking || selectedBooking).outstanding_amount) > 0 ? '🚪 Pay & Checkout' : '🚪 Complete Checkout'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cancel & Refund Modal */}
          {cancelModalOpen && (contextMenu.booking || selectedBooking) && (
            <div className="modal-backdrop" style={{ zIndex: 10000 }} onClick={() => setCancelModalOpen(false)}>
              <div className="modal-content" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>❌ Cancel Reservation</h3>
                  <button className="btn-close" onClick={() => setCancelModalOpen(false)}>&times;</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px', fontSize: '0.85rem' }}>
                  <div style={{ color: '#fb7185', background: 'rgba(244, 63, 94, 0.05)', padding: '8px', borderRadius: '6px', marginBottom: '4px' }}>
                    ⚠️ This action cancels the booking and vacates the room immediately.
                  </div>
                  <div>Total Paid So Far: <strong>₹{parseFloat((contextMenu.booking || selectedBooking).advance_paid).toLocaleString('en-IN')}</strong></div>
                  
                  <div className="form-group">
                    <label className="form-label">Refund Amount (₹)</label>
                    <input
                      type="number"
                      className="input-control"
                      placeholder="Enter refund amount"
                      value={cancelRefundAmount}
                      onChange={e => setCancelRefundAmount(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Refund Method</label>
                    <select
                      className="input-control"
                      value={cancelPaymentMethod}
                      onChange={e => setCancelPaymentMethod(e.target.value)}
                      style={{ background: '#0f172a' }}
                    >
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="Card">Card</option>
                    </select>
                  </div>

                  <div className="modal-actions" style={{ marginTop: '12px' }}>
                    <button type="button" className="btn-cancel" onClick={() => setCancelModalOpen(false)}>Close</button>
                    <button type="button" className="btn-submit-modal" style={{ background: '#ef4444', borderColor: '#dc2626' }} onClick={handleConfirmCancel}>
                      Confirm Cancel & Refund
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Refund Receipt Modal */}
          {receiptModalOpen && receiptData && (
            <div className="modal-backdrop" style={{ zIndex: 11000 }} onClick={() => setReceiptModalOpen(false)}>
              <div className="modal-content" style={{ maxWidth: '400px', background: '#020617', border: '1px solid #1e293b' }} onClick={e => e.stopPropagation()}>
                <div className="modal-header" style={{ borderBottom: '1px dashed rgba(255,255,255,0.1)' }}>
                  <h3>🧾 {receiptData.type === 'cancellation' ? 'Cancellation Receipt' : receiptData.type === 'total_bill' ? 'Invoice & Payment Receipt' : 'Payment Receipt'}</h3>
                  <button className="btn-close" onClick={() => setReceiptModalOpen(false)}>&times;</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px', fontSize: '0.85rem', fontFamily: 'monospace' }}>
                  <div style={{ textAlign: 'center', fontSize: '1rem', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase' }}>Abhirami Hotel Group</div>
                  <div style={{ textAlign: 'center', color: '#94a3b8', marginBottom: '12px' }}>
                    {receiptData.type === 'cancellation' ? 'Cancellation & Refund Voucher' : receiptData.type === 'total_bill' ? 'Invoice & Payment Receipt' : 'Payment Receipt Voucher'}
                  </div>
                  <div>Date/Time: {receiptData.timestamp}</div>
                  <div>Guest Name: {receiptData.guestName}</div>
                  <div>Room: Room {receiptData.roomNumber}</div>
                  <div style={{ borderTop: '1px dashed rgba(255,255,255,0.1)', margin: '8px 0' }}></div>
                  
                  {receiptData.type === 'cancellation' ? (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 'bold' }}>
                        <span>REFUND AMOUNT:</span>
                        <span>₹{receiptData.refundAmount.toLocaleString('en-IN')}</span>
                      </div>
                      <div>Refund Method: {receiptData.paymentMethod}</div>
                      <div style={{ borderTop: '1px dashed rgba(255,255,255,0.1)', margin: '8px 0' }}></div>
                      <div style={{ textAlign: 'center', color: '#fb7185', fontWeight: 'bold', fontSize: '0.75rem', marginTop: '6px' }}>REFUND COMPLETED - BOOKING TERMINATED</div>
                    </>
                  ) : receiptData.type === 'total_bill' ? (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Room Tariff:</span>
                        <span>₹{receiptData.stayCost.toLocaleString('en-IN')}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Extra / Incidentals:</span>
                        <span>₹{receiptData.extraCharges.toLocaleString('en-IN')}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '4px' }}>
                        <span>Total Stay Cost:</span>
                        <span>₹{receiptData.totalCost.toLocaleString('en-IN')}</span>
                      </div>
                      <div style={{ borderTop: '1px dashed rgba(255,255,255,0.1)', margin: '8px 0' }}></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 'bold', color: '#4ade80' }}>
                        <span>AMOUNT PAID NOW:</span>
                        <span>₹{receiptData.amountPaid.toLocaleString('en-IN')}</span>
                      </div>
                      <div>Payment Method: {receiptData.paymentMethod}</div>
                      {receiptData.receiptId && <div>Receipt/Txn ID: {receiptData.receiptId}</div>}
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontWeight: 'bold', color: receiptData.outstanding > 0 ? '#f87171' : '#4ade80' }}>
                        <span>OUTSTANDING BALANCE:</span>
                        <span>₹{receiptData.outstanding.toLocaleString('en-IN')}</span>
                      </div>
                      <div style={{ borderTop: '1px dashed rgba(255,255,255,0.1)', margin: '8px 0' }}></div>
                      <div style={{ textAlign: 'center', color: '#4ade80', fontWeight: 'bold', fontSize: '0.75rem', marginTop: '6px' }}>PAYMENT COMPLETED - THANK YOU!</div>
                    </>
                  ) : (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 'bold' }}>
                        <span>AMOUNT PAID:</span>
                        <span>₹{receiptData.amount.toLocaleString('en-IN')}</span>
                      </div>
                      <div>Payment Method: {receiptData.paymentMethod}</div>
                      {receiptData.receiptId && <div>Receipt/Txn ID: {receiptData.receiptId}</div>}
                      <div style={{ borderTop: '1px dashed rgba(255,255,255,0.1)', margin: '8px 0' }}></div>
                      <div style={{ textAlign: 'center', color: '#4ade80', fontWeight: 'bold', fontSize: '0.75rem', marginTop: '6px' }}>PAYMENT COMPLETED - THANK YOU!</div>
                    </>
                  )}
                  
                  <div className="modal-actions" style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
                    <button type="button" className="btn-submit-modal" style={{ width: 'auto', padding: '6px 20px' }} onClick={() => setReceiptModalOpen(false)}>OK</button>
                  </div>
                </div>
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

            <div className="form-group" style={{ marginTop: '1rem', marginBottom: '1.5rem' }}>
              <label className="form-label">Hotel Code or Name</label>
              <input
                type="text"
                className="input-control"
                placeholder="Enter hotel code or name (e.g. GPL01 or Golden Plaza)"
                value={hotelCodeInput}
                onChange={e => setHotelCodeInput(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <button
              type="submit"
              className="btn-submit"
              disabled={loading || !username || !password || !hotelCodeInput}
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
