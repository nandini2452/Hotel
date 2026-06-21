import React, { useState, useEffect, useMemo } from 'react';

const TIME_OPTIONS = [
  '12:00 AM', '1:00 AM', '2:00 AM', '3:00 AM', '4:00 AM', '5:00 AM', '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM', '11:00 PM'
];

const ROOM_TYPE_METADATA = {
  Standard: { price: 1500, minAdvance: 500 },
  Deluxe: { price: 2500, minAdvance: 1000 },
  Superior: { price: 4000, minAdvance: 2000 }
};

const formatDateHelper = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getTodayStr = () => formatDateHelper(new Date());
const getTomorrowStr = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return formatDateHelper(tomorrow);
};

function App() {
  const [hotelCodeInput, setHotelCodeInput] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Auth states
  const [token, setToken] = useState(localStorage.getItem('hotel_token') || '');
  const [loggedInUser, setLoggedInUser] = useState(localStorage.getItem('hotel_username') || '');
  const [hotelCode, setHotelCode] = useState(localStorage.getItem('hotel_code') || '');
  const [hotelName, setHotelName] = useState(localStorage.getItem('hotel_name') || '');
  const [userRole, setUserRole] = useState(localStorage.getItem('hotel_role') || '');

  // Registration states
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regPhone, setRegPhone] = useState('');

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
    advance_paid: 500,
    advance_status: 'Unpaid',
    payment_method: 'Cash',
    receipt_id: '',
    room_type: 'Standard',
    kyc_type: 'Aadhaar',
    kyc_number: '',
    kyc_front: null,
    kyc_back: null
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
  const [extraAmountReasonInput, setExtraAmountReasonInput] = useState('');

  // Checkout modal state
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState('Cash');
  const [checkoutReceiptId, setCheckoutReceiptId] = useState('');

  // Cancellation & refund modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelRefundAmount, setCancelRefundAmount] = useState('');
  const [cancelPaymentMethod, setCancelPaymentMethod] = useState('Cash');
  const [rejectionReason, setRejectionReason] = useState('Rooms not available');
  const [customRejectionReason, setCustomRejectionReason] = useState('');

  // Cancellation receipt state
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  // Customer Payment Quick Record states
  const [customerPaymentBooking, setCustomerPaymentBooking] = useState(null);
  const [customerPaymentAmount, setCustomerPaymentAmount] = useState('');
  const [customerPaymentMethod, setCustomerPaymentMethod] = useState('UPI');
  const [customerPaymentReceiptId, setCustomerPaymentReceiptId] = useState('');
  const [customerPaymentModalOpen, setCustomerPaymentModalOpen] = useState(false);

  // Financial reports state
  const [txnFilter, setTxnFilter] = useState('today');
  const [txnStartDate, setTxnStartDate] = useState('');
  const [txnEndDate, setTxnEndDate] = useState('');
  const [managerTab, setManagerTab] = useState('calendar'); // 'calendar' or 'transactions'
  const [extraChargesAlertBooking, setExtraChargesAlertBooking] = useState(null);
  const [seenAlerts, setSeenAlerts] = useState({});

  useEffect(() => {
    if (userRole === 'customer' && bookings.length > 0) {
      const alertTarget = bookings.find(b => 
        (b.status === 'Booked' || b.status === 'Checked_in') && 
        parseFloat(b.extra_charges || 0) > 0 && 
        parseFloat(b.outstanding_amount || 0) > 0 &&
        parseFloat(b.extra_charges || 0) > (seenAlerts[b.id] || 0)
      );
      if (alertTarget) {
        setExtraChargesAlertBooking(alertTarget);
        setSeenAlerts(prev => ({ ...prev, [alertTarget.id]: parseFloat(alertTarget.extra_charges || 0) }));
      }
    }
  }, [bookings, userRole, seenAlerts]);

  useEffect(() => {
    const handleGlobalClick = () => {
      if (contextMenu.visible) {
        setContextMenu(prev => ({ ...prev, visible: false }));
      }
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [contextMenu.visible]);

  // Pre-fill customer details if logged in as customer
  useEffect(() => {
    if (token && userRole === 'customer') {
      setNewBooking(prev => {
        const currentType = prev.room_type || 'Standard';
        const defaultMinAdv = ROOM_TYPE_METADATA[currentType]?.minAdvance || 500;
        return {
          ...prev,
          guest_email: loggedInUser,
          guest_first_name: prev.guest_first_name || '',
          guest_last_name: prev.guest_last_name || '',
          guest_phone: prev.guest_phone || '',
          room_type: currentType,
          check_in: prev.check_in || '',
          check_out: prev.check_out || '',
          advance_paid: prev.advance_paid !== '' ? prev.advance_paid : defaultMinAdv,
          advance_status: 'Unpaid'
        };
      });
    }
  }, [token, userRole, loggedInUser]);

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

  const handleRegister = (e) => {
    e.preventDefault();

    if (!regEmail || !regPassword) {
      triggerToast('Please fill out both email and password fields.');
      return;
    }

    setLoading(true);
    fetch('http://127.0.0.1:8000/api/register/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: regEmail,
        password: regPassword
      })
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.detail || 'Registration failed');
        }
        return data;
      })
      .then(data => {
        triggerToast('Registration successful! Please sign in with your credentials.');
        
        // Switch back to login mode and pre-fill credentials
        setIsRegisterMode(false);
        setUsername(regEmail);
        setPassword(regPassword);
        
        // Reset registration fields
        setRegEmail('');
        setRegPassword('');
        setRegFirstName('');
        setRegLastName('');
        setRegPhone('');
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        triggerToast(err.message || 'Error occurred during registration.');
        setLoading(false);
      });
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
        localStorage.setItem('hotel_role', data.role);
        
        setToken(data.token);
        setLoggedInUser(data.username);
        setHotelCode(data.hotel_code);
        setHotelName(data.hotel_name);
        setUserRole(data.role);
        
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
    localStorage.removeItem('hotel_role');
    setToken('');
    setLoggedInUser('');
    setHotelCode('');
    setHotelName('');
    setUserRole('');
    setHotelCodeInput('');
    setRooms([]);
    setBookings([]);
    setNewBooking({
      guest_first_name: '',
      guest_last_name: '',
      guest_phone: '',
      guest_email: '',
      check_in: getTodayStr(),
      check_in_time: '11:30 AM',
      check_out: getTomorrowStr(),
      check_out_time: '11:30 AM',
      status: 'Booked',
      advance_paid: 0,
      advance_status: 'Paid',
      payment_method: 'Cash',
      receipt_id: '',
      room_type: 'Standard',
      kyc_type: 'Aadhaar',
      kyc_number: '',
      kyc_front: null,
      kyc_back: null
    });
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
      room_id: booking.room_id,
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

  // Aggregate all transactions across all bookings
  const allTransactions = useMemo(() => {
    let txns = [];
    bookings.forEach(b => {
      if (b.transactions && b.transactions.length > 0) {
        b.transactions.forEach(t => {
          txns.push({
            ...t,
            bookingId: b.id,
            guestName: `${b.guest_first_name} ${b.guest_last_name}`,
            roomNumber: b.room_number,
            roomType: b.room_type,
            bookingStatus: b.status,
            bookingCheckIn: b.check_in,
            bookingCheckOut: b.check_out,
            bookingExtraChargesReason: b.extra_charges_reason
          });
        });
      }
    });
    // Sort descending by timestamp / created_at
    return txns.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [bookings]);

  // Date range filtering
  const filteredTransactions = useMemo(() => {
    const getLocalDateStr = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const todayStr = getLocalDateStr(new Date());
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateStr(yesterday);

    return allTransactions.filter(t => {
      const txnDate = t.created_at.split(' ')[0]; // YYYY-MM-DD
      
      if (txnFilter === 'today') {
        return txnDate === todayStr;
      } else if (txnFilter === 'yesterday') {
        return txnDate === yesterdayStr;
      } else if (txnFilter === 'custom') {
        let match = true;
        if (txnStartDate) {
          match = match && txnDate >= txnStartDate;
        }
        if (txnEndDate) {
          match = match && txnDate <= txnEndDate;
        }
        return match;
      }
      return true;
    });
  }, [allTransactions, txnFilter, txnStartDate, txnEndDate]);

  // Transaction summary calculations
  const txnSummary = useMemo(() => {
    const bookingTxns = filteredTransactions.filter(t => parseFloat(t.amount) > 0);
    const refundTxns = filteredTransactions.filter(t => parseFloat(t.amount) < 0);

    const totalBookingAmount = bookingTxns.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const totalRefundAmount = refundTxns.reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);

    const uniqueBookingIds = new Set(bookingTxns.map(t => t.bookingId));
    const uniqueRefundIds = new Set(refundTxns.map(t => t.bookingId));

    return {
      bookingCount: uniqueBookingIds.size,
      refundCount: uniqueRefundIds.size,
      totalBookingAmount,
      totalRefundAmount
    };
  }, [filteredTransactions]);

  const handleExportExcel = () => {
    const queryParams = new URLSearchParams({
      hotel_code: hotelCode,
      filter: txnFilter,
      start_date: txnStartDate || '',
      end_date: txnEndDate || ''
    });
    
    fetch(`http://127.0.0.1:8000/api/my-hotel/transactions/export/?${queryParams.toString()}`, {
      headers: {
        'Authorization': `Token ${token}`
      }
    })
      .then(async res => {
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.detail || 'Failed to export Excel report');
        }
        return res.blob();
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `transactions_${hotelCode}_${txnFilter || 'all'}.xlsx`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      })
      .catch(err => triggerToast(err.message));
  };

  const handlePrintPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      triggerToast('Popup blocked! Please allow popups to download PDF reports.');
      return;
    }

    // Pre-evaluate the transaction rows to prevent any raw code text from rendering in the PDF window
    const rowsHtml = filteredTransactions.length === 0
      ? `<tr>
           <td colspan="7" style="text-align: center; color: #64748b; padding: 30px; font-size: 14px;">No transactions recorded.</td>
         </tr>`
      : filteredTransactions.map(t => {
          const amt = parseFloat(t.amount);
          const isRefund = amt < 0;
          return `
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 12px 16px; color: #475569;">${t.created_at}</td>
              <td style="padding: 12px 16px; font-weight: 600; color: #0f172a;">${t.guestName}</td>
              <td style="padding: 12px 16px; color: #475569;">
                Room ${t.roomNumber} (${t.roomType})
                ${t.bookingExtraChargesReason ? `<div style="font-size: 10px; color: #8b5cf6; margin-top: 2px;">Incid: ${t.bookingExtraChargesReason}</div>` : ''}
              </td>
              <td style="padding: 12px 16px;">
                <span class="badge ${isRefund ? 'badge-refund' : 'badge-payment'}">
                  ${isRefund ? 'Refund' : 'Booking Payment'}
                </span>
              </td>
              <td style="padding: 12px 16px; color: #475569;">${t.payment_method}</td>
              <td style="padding: 12px 16px; color: #64748b; font-family: monospace; font-size: 11px;">${t.receipt_id || '-'}</td>
              <td style="padding: 12px 16px; text-align: right; font-weight: bold; color: ${isRefund ? '#b91c1c' : '#15803d'}; font-size: 13px;">
                ${isRefund ? '-' : ''}₹${Math.abs(amt).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </td>
            </tr>
          `;
        }).join('');

    const html = `
      <html>
        <head>
          <title>Financial Summary Report - ${hotelName}</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
              color: #1e293b; 
              padding: 40px; 
              line-height: 1.6;
              max-width: 1000px;
              margin: 0 auto;
            }
            .header-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            .header-title-cell {
              vertical-align: top;
            }
            .header-info-cell {
              text-align: right;
              vertical-align: top;
              color: #475569;
              font-size: 13px;
            }
            .header-title-cell h1 { 
              margin: 0 0 8px 0; 
              color: #7c3aed; 
              font-size: 28px;
              font-weight: 800;
              letter-spacing: -0.025em;
            }
            .header-title-cell p { 
              margin: 0; 
              color: #64748b; 
              font-size: 14px; 
            }
            .divider {
              height: 2px;
              background: linear-gradient(90deg, #8b5cf6, #ec4899);
              margin-bottom: 30px;
            }
            .summary-title {
              font-size: 16px;
              font-weight: 700;
              color: #0f172a;
              margin-bottom: 12px;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            .summary-grid { 
              display: grid; 
              grid-template-columns: repeat(4, 1fr); 
              gap: 16px; 
              margin-bottom: 40px; 
            }
            .summary-card { 
              background: #f8fafc; 
              border: 1px solid #e2e8f0; 
              padding: 20px; 
              border-radius: 12px;
              box-shadow: 0 1px 3px 0 rgba(0,0,0,0.05);
            }
            .summary-card .label { 
              font-size: 11px; 
              color: #64748b; 
              text-transform: uppercase; 
              font-weight: 600;
              letter-spacing: 0.05em;
              margin-bottom: 6px; 
            }
            .summary-card .value { 
              font-size: 22px; 
              font-weight: 700; 
              color: #0f172a; 
            }
            .table-title {
              font-size: 16px;
              font-weight: 700;
              color: #0f172a;
              margin-bottom: 16px;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
            }
            th { 
              background: #f1f5f9; 
              padding: 12px 16px; 
              text-align: left; 
              font-size: 12px; 
              font-weight: 700; 
              color: #475569;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              border-bottom: 2px solid #e2e8f0; 
            }
            .badge { 
              display: inline-block; 
              padding: 4px 8px; 
              border-radius: 6px; 
              font-size: 11px; 
              font-weight: 600; 
            }
            .badge-payment { 
              background: #dcfce7; 
              color: #15803d; 
            }
            .badge-refund { 
              background: #fee2e2; 
              color: #b91c1c; 
            }
            .footer {
              margin-top: 50px;
              border-top: 1px solid #e2e8f0;
              padding-top: 15px;
              font-size: 12px;
              color: #94a3b8;
              text-align: center;
            }
            @media print {
              body { padding: 0; }
              .summary-card { box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <table class="header-table">
            <tr>
              <td class="header-title-cell">
                <h1>Financial Summary Report</h1>
                <p>Generated for <strong>${hotelName}</strong></p>
              </td>
              <td class="header-info-cell">
                <div><strong>Hotel Code:</strong> ${hotelCode}</div>
                <div><strong>Report Period:</strong> ${txnFilter.toUpperCase()} ${txnFilter === 'custom' ? `(${txnStartDate || 'Start'} to ${txnEndDate || 'End'})` : ''}</div>
                <div><strong>Generated At:</strong> ${new Date().toLocaleString('en-IN')}</div>
              </td>
            </tr>
          </table>
          
          <div class="divider"></div>
          
          <div class="summary-title">Financial Summary Overview</div>
          <div class="summary-grid">
            <div class="summary-card">
              <div class="label">Booking Count</div>
              <div class="value">${txnSummary.bookingCount}</div>
            </div>
            <div class="summary-card" style="border-left: 3px solid #ef4444;">
              <div class="label">Refund Count</div>
              <div class="value">${txnSummary.refundCount}</div>
            </div>
            <div class="summary-card" style="border-left: 3px solid #10b981;">
              <div class="label">Total Booking Amount</div>
              <div class="value">₹${txnSummary.totalBookingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
            <div class="summary-card" style="border-left: 3px solid #f59e0b;">
              <div class="label">Total Refund Amount</div>
              <div class="value">₹${txnSummary.totalRefundAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
          </div>
          
          <div class="table-title">Transaction Log Details</div>
          <table>
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Guest</th>
                <th>Room</th>
                <th>Type</th>
                <th>Method</th>
                <th>Receipt ID</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="footer">
            End of Financial Summary Report. Thank you for using our Hotel Operations Management system.
          </div>
          
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
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

  const handleAddExtraCharges = () => {
    if (!selectedBooking) return;
    const extraAmount = parseFloat(extraAmountInput) || 0;
    if (extraAmount <= 0) {
      triggerToast('Please enter a valid extra charges amount.');
      return;
    }

    const currentExtra = parseFloat(selectedBooking.extra_charges) || 0;
    const newExtra = currentExtra + extraAmount;

    const currentReason = selectedBooking.extra_charges_reason || '';
    const newReason = currentReason 
      ? `${currentReason}, ${extraAmountReasonInput || 'Incidentals'}`
      : (extraAmountReasonInput || 'Incidentals');

    fetch(`http://127.0.0.1:8000/api/my-hotel/bookings/${selectedBooking.id}/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`
      },
      body: JSON.stringify({ 
        extra_charges: newExtra,
        extra_charges_reason: newReason
      })
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Failed to add extra charges');
        return data;
      })
      .then(data => {
        triggerToast(`Added extra charge of ₹${extraAmount.toLocaleString('en-IN')} successfully!`);
        setExtraAmountInput('0');
        setExtraAmountReasonInput('');
        setSelectedBooking(data);
        setAmountToPayInput(data.outstanding_amount.toString());
        setBookings(prev => prev.map(b => b.id === data.id ? data : b));
        refreshBookings(data.id);
      })
      .catch(err => triggerToast(err.message));
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

  const handleUpdateBookingStatus = (bookingId, newStatus) => {
    if (newStatus === 'Checked_out') {
      const targetBooking = bookings.find(b => b.id === bookingId) || selectedBooking;
      if (!targetBooking) return;
      setCheckoutPaymentMethod('Cash');
      setCheckoutReceiptId('');
      setCheckoutModalOpen(true);
      return;
    }

    fetch(`http://127.0.0.1:8000/api/my-hotel/bookings/${bookingId}/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`
      },
      body: JSON.stringify({ status: newStatus })
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Failed to update status');
        return data;
      })
      .then(data => {
        triggerToast(`Status updated successfully!`);
        setSelectedBooking(data);
        setBookings(prev => prev.map(b => b.id === data.id ? data : b));
        
        fetch(`http://127.0.0.1:8000/api/my-hotel/rooms/?hotel_code=${hotelCode}`, {
          headers: { 'Authorization': `Token ${token}` }
        })
          .then(res => res.json())
          .then(roomData => setRooms(roomData));

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
    
    let reasonText = '';
    if (userRole !== 'customer') {
      reasonText = rejectionReason === 'Other' ? customRejectionReason : rejectionReason;
    }
    
    const receipt = {
      type: 'cancellation',
      guestName: `${targetBooking.guest_first_name} ${targetBooking.guest_last_name}`,
      roomNumber: targetBooking.room_number,
      refundAmount: parseFloat(cancelRefundAmount) || 0,
      paymentMethod: cancelPaymentMethod,
      timestamp: new Date().toLocaleString(),
      reason: reasonText
    };
    
    const url = `http://127.0.0.1:8000/api/my-hotel/bookings/${targetBooking.id}/?reason=${encodeURIComponent(reasonText)}&refund=${parseFloat(cancelRefundAmount) || 0}&method=${cancelPaymentMethod}`;
    fetch(url, {
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
        extraChargesReason: finalBooking.extra_charges_reason,
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

    // Validate KYC Document number format
    if (newBooking.kyc_number) {
      const type = newBooking.kyc_type || 'Aadhaar';
      const num = newBooking.kyc_number;
      if (type === 'Aadhaar') {
        const aadhaarRegex = /^\d{12}$/;
        if (!aadhaarRegex.test(num)) {
          triggerToast('Aadhaar number must be exactly 12 digits.');
          return;
        }
      } else if (type === 'PAN') {
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        if (!panRegex.test(num)) {
          triggerToast('PAN Card number must be 10 characters in the format: 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F).');
          return;
        }
      }
    }

    const url = isEditMode 
      ? `http://127.0.0.1:8000/api/my-hotel/bookings/${editingBookingId}/` 
      : 'http://127.0.0.1:8000/api/my-hotel/bookings/';
      
    const method = isEditMode ? 'PUT' : 'POST';

    // Build FormData instead of JSON to support file uploads
    const formData = new FormData();
    formData.append('room_id', isEditMode ? (newBooking.room_id || selectedRoom?.id) : selectedRoom?.id);
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
            roomType: data.room_type,
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

  const handleCustomerCreateBooking = (e) => {
    e.preventDefault();
    
    if (!newBooking.guest_first_name || !newBooking.guest_last_name || !newBooking.guest_phone || !newBooking.check_in || !newBooking.check_out) {
      triggerToast('Please fill out all required fields.');
      return;
    }
    
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(newBooking.guest_phone)) {
      triggerToast('Phone number must be exactly 10 digits.');
      return;
    }
    
    const cin = new Date(newBooking.check_in);
    const cout = new Date(newBooking.check_out);
    if (cout <= cin) {
      triggerToast('Check-out date must be after check-in date.');
      return;
    }
    
    if (newBooking.kyc_number) {
      const type = newBooking.kyc_type || 'Aadhaar';
      const num = newBooking.kyc_number;
      if (type === 'Aadhaar') {
        const aadhaarRegex = /^\d{12}$/;
        if (!aadhaarRegex.test(num)) {
          triggerToast('Aadhaar number must be exactly 12 digits.');
          return;
        }
      } else if (type === 'PAN') {
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        if (!panRegex.test(num)) {
          triggerToast('PAN Card number must be 10 characters in the format: 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F).');
          return;
        }
      }
    }
    
    const metadata = ROOM_TYPE_METADATA[newBooking.room_type || 'Standard'];
    const advancePaidNum = parseFloat(newBooking.advance_paid) || 0;
    const isPaying = advancePaidNum > 0;
    const actualAdvanceStatus = isPaying ? 'Paid' : 'Unpaid';
    
    if (isPaying) {
      if (advancePaidNum < metadata.minAdvance) {
        triggerToast(`Minimum required advance is ₹${metadata.minAdvance} for ${newBooking.room_type} rooms.`);
        return;
      }
    }
    
    const formData = new FormData();
    formData.append('room_type', newBooking.room_type || 'Standard');
    formData.append('guest_first_name', newBooking.guest_first_name);
    formData.append('guest_last_name', newBooking.guest_last_name);
    formData.append('guest_phone', newBooking.guest_phone);
    formData.append('guest_email', newBooking.guest_email || '');
    formData.append('check_in', newBooking.check_in);
    formData.append('check_out', newBooking.check_out);
    formData.append('status', 'Booked');
    formData.append('advance_paid', isPaying ? advancePaidNum : 0.00);
    formData.append('advance_status', actualAdvanceStatus);
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
    
    setLoading(true);
    fetch(`http://127.0.0.1:8000/api/my-hotel/bookings/?hotel_code=${hotelCode}`, {
      method: 'POST',
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
        triggerToast('Reservation created successfully!');
        
        if (isPaying && advancePaidNum > 0) {
          const receipt = {
            type: 'payment',
            guestName: `${data.guest_first_name} ${data.guest_last_name}`,
            roomNumber: 'Assigned on Check-In',
            roomType: data.room_type,
            amount: advancePaidNum,
            paymentMethod: newBooking.payment_method,
            receiptId: newBooking.receipt_id,
            timestamp: new Date().toLocaleString()
          };
          setReceiptData(receipt);
          setReceiptModalOpen(true);
        }
        
        setNewBooking({
          guest_first_name: '',
          guest_last_name: '',
          guest_phone: '',
          guest_email: loggedInUser,
          check_in: '',
          check_in_time: '11:30 AM',
          check_out: '',
          check_out_time: '11:30 AM',
          status: 'Booked',
          advance_paid: 500,
          advance_status: 'Unpaid',
          payment_method: 'Cash',
          receipt_id: '',
          room_type: 'Standard',
          kyc_type: 'Aadhaar',
          kyc_number: '',
          kyc_front: null,
          kyc_back: null
        });
        
        fetch(`http://127.0.0.1:8000/api/my-hotel/bookings/?hotel_code=${hotelCode}`, {
          headers: { 'Authorization': `Token ${token}` }
        })
          .then(res => res.json())
          .then(bookingsData => setBookings(bookingsData));
           
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        triggerToast(err.message || 'Error occurred while saving reservation.');
        setLoading(false);
      });
  };

  const handleCustomerCancelBooking = (bookingId) => {
    if (window.confirm("Are you sure you want to cancel this reservation?")) {
      fetch(`http://127.0.0.1:8000/api/my-hotel/bookings/${bookingId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${token}`
        }
      })
        .then(res => {
          if (!res.ok) throw new Error("Failed to cancel reservation.");
          triggerToast("Reservation cancelled successfully!");
          // Refresh bookings
          fetch(`http://127.0.0.1:8000/api/my-hotel/bookings/?hotel_code=${hotelCode}`, {
            headers: { 'Authorization': `Token ${token}` }
          })
            .then(r => r.json())
            .then(data => setBookings(data));
        })
        .catch(err => triggerToast(err.message));
    }
  };

  const handleCustomerOpenPaymentModal = (booking) => {
    setCustomerPaymentBooking(booking);
    setCustomerPaymentAmount(parseFloat(booking.outstanding_amount).toString());
    setCustomerPaymentMethod('UPI');
    setCustomerPaymentReceiptId('');
    setCustomerPaymentModalOpen(true);
  };

  const handleCustomerPaymentSubmit = (e) => {
    e.preventDefault();
    if (!customerPaymentBooking || !customerPaymentAmount) return;
    
    fetch(`http://127.0.0.1:8000/api/my-hotel/bookings/${customerPaymentBooking.id}/transactions/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`
      },
      body: JSON.stringify({
        amount: parseFloat(customerPaymentAmount),
        payment_method: customerPaymentMethod,
        receipt_id: customerPaymentReceiptId || null
      })
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Failed to submit payment');
        return data;
      })
      .then(data => {
        triggerToast("Payment submitted successfully!");
        setCustomerPaymentModalOpen(false);
        
        // Show receipt
        const receipt = {
          type: 'payment',
          guestName: `${data.guest_first_name} ${data.guest_last_name}`,
          roomNumber: data.status === 'Booked' ? 'Assigned on Check-In' : data.room_number,
          roomType: data.room_type,
          amount: parseFloat(customerPaymentAmount),
          paymentMethod: customerPaymentMethod,
          receiptId: customerPaymentReceiptId,
          timestamp: new Date().toLocaleString()
        };
        setReceiptData(receipt);
        setReceiptModalOpen(true);

        // Refresh bookings list
        fetch(`http://127.0.0.1:8000/api/my-hotel/bookings/?hotel_code=${hotelCode}`, {
          headers: { 'Authorization': `Token ${token}` }
        })
          .then(res => res.json())
          .then(bookingsData => setBookings(bookingsData));
      })
      .catch(err => triggerToast(err.message));
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
  const bookingRequests = bookings.filter(b => b.status === 'Booked' && b.kyc && b.kyc.kyc_type && !b.kyc.kyc_verified);

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

          {userRole !== 'customer' && (
            <div className="manager-dashboard-nav" style={{
              display: 'flex',
              gap: '12px',
              marginBottom: '1rem',
              background: 'rgba(30, 41, 59, 0.4)',
              padding: '6px 12px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              alignItems: 'center'
            }}>
              <button
                onClick={() => setManagerTab('calendar')}
                style={{
                  background: managerTab === 'calendar' ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)' : 'transparent',
                  border: 'none',
                  color: '#fff',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: managerTab === 'calendar' ? '0 4px 12px rgba(139, 92, 246, 0.25)' : 'none'
                }}
              >
                📅 Front Desk Calendar
              </button>
              <button
                onClick={() => setManagerTab('transactions')}
                style={{
                  background: managerTab === 'transactions' ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)' : 'transparent',
                  border: 'none',
                  color: '#fff',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: managerTab === 'transactions' ? '0 4px 12px rgba(139, 92, 246, 0.25)' : 'none'
                }}
              >
                📊 Total Transactions & Reports
              </button>
            </div>
          )}

          {userRole === 'customer' ? (
            <div className="customer-dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '1.5rem', marginTop: '0.5rem' }}>
              {/* Left Card: Booking Form */}
              <div className="calendar-card" style={{ padding: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px', color: '#a78bfa' }}>🛎️ Book a Room</h2>
                <form onSubmit={handleCustomerCreateBooking} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Room Category</label>
                    <select
                      className="input-control"
                      value={newBooking.room_type || 'Standard'}
                      onChange={e => {
                        const type = e.target.value;
                        const minAdv = ROOM_TYPE_METADATA[type]?.minAdvance || 500;
                        setNewBooking(prev => ({
                          ...prev,
                          room_type: type,
                          advance_paid: minAdv
                        }));
                      }}
                      style={{ background: 'rgba(15, 23, 42, 0.85)', color: '#fff' }}
                    >
                      <option value="Standard">Standard Room (Single Bed) (₹1,500/night)</option>
                      <option value="Deluxe">Deluxe Room (Double Bed) (₹2,500/night)</option>
                      <option value="Superior">Superior Room (Duplex) (₹4,000/night)</option>
                    </select>
                  </div>

                  <div className="room-summary-box" style={{ padding: '10px 12px', marginBottom: '4px' }}>
                    <div className="summary-grid" style={{ fontSize: '0.8rem', gap: '6px' }}>
                      <div className="summary-item">Nightly Price: <span>₹{ROOM_TYPE_METADATA[newBooking.room_type || 'Standard'].price.toLocaleString('en-IN')}</span></div>
                      <div className="summary-item">Min Advance Required: <span>₹{ROOM_TYPE_METADATA[newBooking.room_type || 'Standard'].minAdvance.toLocaleString('en-IN')}</span></div>
                      {newBooking.check_in && newBooking.check_out && (
                        <>
                          <div className="summary-item">Stay Nights: <span>{Math.max(1, Math.round((new Date(newBooking.check_out) - new Date(newBooking.check_in)) / (1000 * 60 * 60 * 24)))}</span></div>
                          <div className="summary-item">Estimated Cost: <span>₹{(Math.max(1, Math.round((new Date(newBooking.check_out) - new Date(newBooking.check_in)) / (1000 * 60 * 60 * 24))) * ROOM_TYPE_METADATA[newBooking.room_type || 'Standard'].price).toLocaleString('en-IN')}</span></div>
                        </>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
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
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="form-group">
                      <label className="form-label">Phone Number</label>
                      <input
                        type="tel"
                        className="input-control"
                        required
                        maxLength={10}
                        pattern="\d{10}"
                        placeholder="Enter 10-digit phone"
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
                        disabled
                        value={newBooking.guest_email || ''}
                        style={{ opacity: 0.7, cursor: 'not-allowed' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
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
                      <label className="form-label">Check-Out Date</label>
                      <input
                        type="date"
                        className="input-control"
                        required
                        value={newBooking.check_out}
                        onChange={e => setNewBooking(prev => ({ ...prev, check_out: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div style={{ borderTop: '1px dashed rgba(255,255,255,0.05)', paddingTop: '10px', marginTop: '4px' }}>
                    <label className="form-label" style={{ fontWeight: 'bold', fontSize: '0.8rem', color: 'var(--primary)', marginBottom: '8px', display: 'block' }}>🆔 Customer KYC Verification</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '10px' }}>
                      <div className="form-group">
                        <label className="form-label">ID Type</label>
                        <select
                          className="input-control"
                          value={newBooking.kyc_type || 'Aadhaar'}
                          onChange={e => {
                            const type = e.target.value;
                            setNewBooking(prev => ({ ...prev, kyc_type: type, kyc_number: '' }));
                          }}
                          style={{ background: 'rgba(15, 23, 42, 0.85)', color: '#fff' }}
                        >
                          <option value="Aadhaar">Aadhaar</option>
                          <option value="PAN">PAN Card</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">ID Number</label>
                        <input
                          type="text"
                          className="input-control"
                          placeholder={newBooking.kyc_type === 'PAN' ? 'ABCDE1234F' : 'Enter 12 digits'}
                          maxLength={newBooking.kyc_type === 'PAN' ? 10 : 12}
                          value={newBooking.kyc_number || ''}
                          onChange={e => {
                            let val = e.target.value;
                            const currentType = newBooking.kyc_type || 'Aadhaar';
                            if (currentType === 'Aadhaar') {
                              val = val.replace(/\D/g, '').slice(0, 12);
                            } else {
                              val = val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 10);
                            }
                            setNewBooking(prev => ({ ...prev, kyc_number: val }));
                          }}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px' }}>
                      <div className="form-group">
                        <label className="form-label">ID Front File</label>
                        <input
                          type="file"
                          accept="image/*"
                          className="input-control"
                          style={{ padding: '6px 8px', fontSize: '0.75rem', height: '36px' }}
                          onChange={e => {
                            const file = e.target.files[0];
                            setNewBooking(prev => ({ ...prev, kyc_front: file }));
                          }}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">ID Back File</label>
                        <input
                          type="file"
                          accept="image/*"
                          className="input-control"
                          style={{ padding: '6px 8px', fontSize: '0.75rem', height: '36px' }}
                          onChange={e => {
                            const file = e.target.files[0];
                            setNewBooking(prev => ({ ...prev, kyc_back: file }));
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px dashed rgba(255,255,255,0.05)', paddingTop: '10px', marginTop: '4px' }}>
                    <label className="form-label" style={{ fontWeight: 'bold', fontSize: '0.8rem', color: 'var(--primary)', marginBottom: '8px', display: 'block' }}>💳 Advance Payment (Optional)</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '10px' }}>
                      <div className="form-group col-span-2">
                        <label className="form-label">Advance Paid (₹)</label>
                        <input
                          type="number"
                          className="input-control"
                          placeholder="Leave empty if not paying advance"
                          value={newBooking.advance_paid}
                          onChange={e => setNewBooking(prev => ({ ...prev, advance_paid: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '10px', marginTop: '8px' }}>
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
                          placeholder="Receipt ID"
                          value={newBooking.receipt_id}
                          onChange={e => setNewBooking(prev => ({ ...prev, receipt_id: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>

                  <button type="submit" className="btn-submit" disabled={loading} style={{ marginTop: '8px' }}>
                    {loading ? 'Booking stays...' : '🚀 Confirm Reservation'}
                  </button>
                </form>
              </div>

              {/* Right Card: Booking History Table */}
              <div className="calendar-card" style={{ padding: '1.5rem', overflow: 'hidden' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px', color: '#34d399' }}>📋 Your Booking History</h2>
                <div style={{ overflowX: 'auto', maxHeight: '550px' }}>
                  <table className="txn-table" style={{ width: '100%', fontSize: '0.85rem' }}>
                    <thead>
                      <tr>
                        <th>Stay Dates</th>
                        <th>Room</th>
                        <th>Type</th>
                        <th>Billing Info</th>
                        <th>Status</th>
                        <th>KYC</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.length > 0 ? (
                        bookings.map(b => (
                          <tr key={b.id}>
                            <td style={{ fontWeight: '600' }}>
                              {b.check_in} to {b.check_out}
                            </td>
                            <td>
                              {b.checked_out || b.status === 'Checked_in' ? (
                                <strong>Room {b.room_number}</strong>
                              ) : (
                                <span style={{ fontStyle: 'italic', color: '#94a3b8' }}>Assigned on Check-In</span>
                              )}
                            </td>
                            <td>
                              {b.room_type === 'Standard' ? 'Standard (Single Bed)' : b.room_type === 'Deluxe' ? 'Deluxe (Double Bed)' : b.room_type === 'Superior' ? 'Superior (Duplex)' : b.room_type}
                            </td>
                            <td>
                              <div>Total: ₹{parseFloat(b.total_cost).toLocaleString('en-IN')}</div>
                              {parseFloat(b.extra_charges || 0) > 0 && (
                                <div style={{ fontSize: '0.75rem', color: '#a78bfa' }}>
                                  Extra: ₹{parseFloat(b.extra_charges).toLocaleString('en-IN')} ({b.extra_charges_reason || 'Incidentals'})
                                </div>
                              )}
                              <div style={{ fontSize: '0.75rem', color: parseFloat(b.outstanding_amount) > 0 ? '#fb7185' : '#4ade80' }}>
                                Outstanding: ₹{parseFloat(b.outstanding_amount).toLocaleString('en-IN')}
                              </div>
                            </td>
                            <td>
                              <span style={{
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '0.7rem',
                                fontWeight: 'bold',
                                background: b.status === 'Cancelled'
                                  ? 'rgba(100, 116, 139, 0.2)'
                                  : b.status === 'Rejected'
                                  ? 'rgba(239, 68, 68, 0.2)'
                                  : b.checked_out
                                  ? 'rgba(239, 68, 68, 0.2)'
                                  : b.status === 'Checked_in'
                                  ? 'rgba(34, 197, 94, 0.2)'
                                  : b.kyc?.kyc_verified
                                  ? 'rgba(34, 197, 94, 0.2)'
                                  : 'rgba(245, 158, 11, 0.2)',
                                color: b.status === 'Cancelled'
                                  ? '#cbd5e1'
                                  : b.status === 'Rejected'
                                  ? '#ef4444'
                                  : b.checked_out
                                  ? '#ef4444'
                                  : b.status === 'Checked_in'
                                  ? '#4ade80'
                                  : b.kyc?.kyc_verified
                                  ? '#4ade80'
                                  : '#fbbf24'
                              }}>
                                {b.status === 'Cancelled'
                                  ? 'Cancelled'
                                  : b.status === 'Rejected'
                                  ? 'Rejected'
                                  : b.checked_out
                                  ? 'Checked-Out'
                                  : b.status === 'Checked_in'
                                  ? 'Checked-In'
                                  : b.kyc?.kyc_verified
                                  ? 'Approved'
                                  : 'Pending Approval'}
                              </span>
                              {(b.status === 'Cancelled' || b.status === 'Rejected') && b.rejection_reason && (
                                <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px' }}>
                                  Reason: {b.rejection_reason}
                                </div>
                              )}
                            </td>
                            <td>
                              <span style={{
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '0.7rem',
                                fontWeight: 'bold',
                                background: (b.status === 'Cancelled' || b.status === 'Rejected')
                                  ? 'rgba(255, 255, 255, 0.05)'
                                  : b.kyc?.kyc_verified
                                  ? 'rgba(34, 197, 94, 0.2)'
                                  : 'rgba(245, 158, 11, 0.2)',
                                color: (b.status === 'Cancelled' || b.status === 'Rejected')
                                  ? '#94a3b8'
                                  : b.kyc?.kyc_verified
                                  ? '#4ade80'
                                  : '#fbbf24'
                              }}>
                                {(b.status === 'Cancelled' || b.status === 'Rejected')
                                  ? 'N/A'
                                  : b.kyc?.kyc_verified
                                  ? 'Verified'
                                  : 'Pending'}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '6px', flexDirection: 'column' }}>
                                {parseFloat(b.outstanding_amount) > 0 && !b.checked_out && b.status !== 'Cancelled' && b.status !== 'Rejected' && (
                                  <button
                                    type="button"
                                    className="btn-verify-request"
                                    style={{ padding: '4px 8px', fontSize: '0.7rem', height: 'auto', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: '4px', cursor: 'pointer', color: '#fff' }}
                                    onClick={() => handleCustomerOpenPaymentModal(b)}
                                  >
                                    💳 Pay Bill
                                  </button>
                                )}
                                {b.status === 'Booked' && !b.checked_out && (
                                  <button
                                    type="button"
                                    className="btn-cancel"
                                    style={{ padding: '4px 8px', fontSize: '0.7rem', height: 'auto', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', borderStyle: 'solid', borderWidth: '1px', borderRadius: '4px', cursor: 'pointer' }}
                                    onClick={() => handleCustomerCancelBooking(b.id)}
                                  >
                                    ❌ Cancel
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>No stays booked yet. Book your first room above!</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Guest Booking Requests Panel */}
              {bookingRequests.length > 0 && (
                <div className="booking-requests-container">
                  <div className="alerts-header">
                    <span className="alerts-icon">📩</span>
                    <h3>Guest Booking Requests ({bookingRequests.length})</h3>
                  </div>
                  <div className="alerts-list">
                    {bookingRequests.map(b => {
                      const isPendingKYC = b.kyc && !b.kyc.kyc_verified;
                      return (
                        <div key={b.id} className="request-card">
                          <div className="alert-info">
                            <span style={{ fontSize: '1.0rem' }}>
                              Guest: <strong>{b.guest_first_name} {b.guest_last_name}</strong> ({b.guest_phone})
                            </span>
                            <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                              Requested: <strong>{b.room_type}</strong> room | Stay: <strong>{b.check_in} to {b.check_out}</strong>
                            </span>
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                              Auto-assigned Block: <strong>Room {b.room_number}</strong> | KYC Status: {isPendingKYC ? (
                                <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>⚠️ Pending Verification</span>
                              ) : (
                                <span style={{ color: '#34d399', fontWeight: 'bold' }}>✅ Detail Verified</span>
                              )}
                            </span>
                          </div>
                          <div className="alert-actions">
                            <button 
                              className="btn-verify-request"
                              onClick={() => {
                                handleOpenInfoModal(b);
                              }}
                            >
                              Verify & Allocate
                            </button>
                            {isPendingKYC && (
                              <button 
                                className="btn-approve-request"
                                onClick={() => handleToggleKYCVerification(b.id, true)}
                              >
                                Approve Booking
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

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
              {managerTab === 'calendar' && (
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
                                onChange={e => {
                                  if (e.target.value) {
                                    setStartDate(new Date(e.target.value));
                                  }
                                }}
                              />
                            </div>
                          </div>
                        </th>
                        {dates.map((d, index) => {
                          const isToday = formatDate(d) === formatDate(new Date());
                          return (
                            <th key={index} className={`date-column-header ${isToday ? 'today' : ''}`}>
                              <div className="date-header-day">{d.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                              <div className="date-header-num">{d.getDate()}</div>
                              <div className="date-header-month">{d.toLocaleDateString('en-US', { month: 'short' })}</div>
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
              )}

              {/* 📊 Financial Transactions & Reports */}
              {managerTab === 'transactions' && (
                <div className="calendar-card" style={{ marginTop: '1.5rem', padding: '1.5rem' }}>
                <div className="calendar-header-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.25rem', color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    📊 Financial Transactions & Reports
                  </h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Filter Period:</label>
                      <select
                        value={txnFilter}
                        onChange={e => setTxnFilter(e.target.value)}
                        className="input-control"
                        style={{ width: '130px', padding: '4px 8px', fontSize: '0.8rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', borderRadius: '6px' }}
                      >
                        <option value="today">Today</option>
                        <option value="yesterday">Yesterday</option>
                        <option value="custom">Date Range</option>
                      </select>
                    </div>

                    {txnFilter === 'custom' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="date"
                          value={txnStartDate}
                          onChange={e => setTxnStartDate(e.target.value)}
                          className="input-control"
                          style={{ width: '130px', padding: '4px 8px', fontSize: '0.8rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', borderRadius: '6px' }}
                        />
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>to</span>
                        <input
                          type="date"
                          value={txnEndDate}
                          onChange={e => setTxnEndDate(e.target.value)}
                          className="input-control"
                          style={{ width: '130px', padding: '4px 8px', fontSize: '0.8rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', borderRadius: '6px' }}
                        />
                      </div>
                    )}

                    {/* Export Buttons */}
                    <button
                      onClick={handleExportExcel}
                      style={{
                        background: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        color: '#34d399',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s ease',
                        height: '32px'
                      }}
                      title="Download native Excel (.xlsx) spreadsheet from backend"
                    >
                      📥 Excel Export
                    </button>
                    <button
                      onClick={handlePrintPDF}
                      style={{
                        background: 'rgba(59, 130, 246, 0.15)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        color: '#60a5fa',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s ease',
                        height: '32px'
                      }}
                      title="Print or Save Summary Report as PDF"
                    >
                      🖨️ PDF Report
                    </button>
                  </div>
                </div>

                {/* Financial Summary Cards Panel */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                  <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '1.25rem', borderRadius: '12px' }}>
                    <div style={{ fontSize: '0.8rem', color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Booking Count</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#eff6ff' }}>{txnSummary.bookingCount}</div>
                  </div>
                  <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '1.25rem', borderRadius: '12px' }}>
                    <div style={{ fontSize: '0.8rem', color: '#fca5a5', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Refund Count</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#fef2f2' }}>{txnSummary.refundCount}</div>
                  </div>
                  <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '1.25rem', borderRadius: '12px' }}>
                    <div style={{ fontSize: '0.8rem', color: '#6ee7b7', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Total Booking Amount</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#ecfdf5' }}>₹{txnSummary.totalBookingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  </div>
                  <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '1.25rem', borderRadius: '12px' }}>
                    <div style={{ fontSize: '0.8rem', color: '#fcd34d', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Total Refund Amount</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#fffbeb' }}>₹{txnSummary.totalRefundAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  </div>
                </div>

                {/* Transactions List Table */}
                <div className="table-responsive" style={{ overflowX: 'auto', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: '600' }}>Date & Time</th>
                        <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: '600' }}>Guest</th>
                        <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: '600' }}>Room</th>
                        <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: '600' }}>Type</th>
                        <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: '600' }}>Method</th>
                        <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: '600' }}>Receipt ID</th>
                        <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: '600', textAlign: 'right' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            No transactions recorded for this period.
                          </td>
                        </tr>
                      ) : (
                        filteredTransactions.map(t => {
                          const amt = parseFloat(t.amount);
                          const isRefund = amt < 0;
                          return (
                            <tr key={t.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.02)' }}>
                              <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>{t.created_at}</td>
                              <td style={{ padding: '12px 16px', fontWeight: '500' }}>{t.guestName}</td>
                              <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>
                                Room {t.roomNumber} ({t.roomType})
                                {t.bookingExtraChargesReason && (
                                  <div style={{ fontSize: '0.72rem', color: '#a78bfa', marginTop: '2px' }}>
                                    Incid: {t.bookingExtraChargesReason}
                                  </div>
                                )}
                              </td>
                              <td style={{ padding: '12px 16px' }}>
                                <span style={{
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  fontSize: '0.75rem',
                                  fontWeight: '600',
                                  background: isRefund ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                  color: isRefund ? '#f87171' : '#34d399'
                                }}>
                                  {isRefund ? 'Refund' : 'Booking Payment'}
                                </span>
                              </td>
                              <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>{t.payment_method}</td>
                              <td style={{ padding: '12px 16px', color: '#94a3b8', fontFamily: 'monospace' }}>{t.receipt_id || '-'}</td>
                              <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 'bold', color: isRefund ? '#f87171' : '#34d399' }}>
                                {isRefund ? '-' : ''}₹{Math.abs(amt).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              )}
            </>
          )}

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
                    {isEditMode ? (
                      <div className="form-group" style={{ marginBottom: '12px' }}>
                        <label className="form-label" style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#a78bfa' }}>Change Room Allocation</label>
                        <select
                          className="input-control"
                          value={newBooking.room_id || selectedRoom?.id || ''}
                          onChange={e => {
                            const rId = e.target.value;
                            const r = rooms.find(rm => Number(rm.id) === Number(rId));
                            if (r) {
                              setSelectedRoom(r);
                              setNewBooking(prev => ({ ...prev, room_id: r.id }));
                            }
                          }}
                          style={{ background: 'rgba(15, 23, 42, 0.85)', color: '#fff', fontSize: '0.85rem', padding: '6px 10px' }}
                        >
                          {rooms.map(rm => (
                            <option key={rm.id} value={rm.id}>
                              Room {rm.number} ({rm.room_type}) - {rm.cleanliness === 'dirty' ? '🧹 Dirty' : '🧼 Clean'}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <h4>Room: {selectedRoom?.number} ({selectedRoom?.room_type})</h4>
                    )}
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
                        {isEditMode && <option value="Checked_out">Checked-Out</option>}
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
                            onChange={e => {
                              const type = e.target.value;
                              setNewBooking(prev => ({ ...prev, kyc_type: type, kyc_number: '' }));
                            }}
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
                            placeholder={newBooking.kyc_type === 'PAN' ? 'Enter 10-char PAN (ABCDE1234F)' : 'Enter 12-digit Aadhaar'}
                            maxLength={newBooking.kyc_type === 'PAN' ? 10 : 12}
                            value={newBooking.kyc_number || ''}
                            onChange={e => {
                              let val = e.target.value;
                              const currentType = newBooking.kyc_type || 'Aadhaar';
                              if (currentType === 'Aadhaar') {
                                val = val.replace(/\D/g, '').slice(0, 12);
                              } else {
                                val = val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 10);
                              }
                              setNewBooking(prev => ({ ...prev, kyc_number: val }));
                            }}
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

                {selectedBooking.kyc && (
                  <div style={{
                    padding: '16px 20px',
                    borderRadius: '12px',
                    margin: '16px 24px 0',
                    background: selectedBooking.status === 'Rejected' 
                      ? 'rgba(239, 68, 68, 0.1)' 
                      : selectedBooking.status === 'Cancelled'
                      ? 'rgba(100, 116, 139, 0.1)'
                      : selectedBooking.kyc.kyc_verified 
                      ? 'rgba(16, 185, 129, 0.1)' 
                      : 'rgba(245, 158, 11, 0.1)',
                    border: selectedBooking.status === 'Rejected'
                      ? '1px solid rgba(239, 68, 68, 0.3)'
                      : selectedBooking.status === 'Cancelled'
                      ? '1px solid rgba(100, 116, 139, 0.3)'
                      : selectedBooking.kyc.kyc_verified 
                      ? '1px solid rgba(16, 185, 129, 0.3)' 
                      : '1px solid rgba(245, 158, 11, 0.3)',
                    boxSizing: 'border-box'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '10px', 
                      color: selectedBooking.status === 'Rejected'
                        ? '#f87171'
                        : selectedBooking.status === 'Cancelled'
                        ? '#cbd5e1'
                        : selectedBooking.kyc.kyc_verified 
                        ? '#34d399' 
                        : '#fbbf24' 
                    }}>
                      <span style={{ fontSize: '1.2rem' }}>
                        {selectedBooking.status === 'Rejected' 
                          ? '❌' 
                          : selectedBooking.status === 'Cancelled'
                          ? '🚫'
                          : selectedBooking.kyc.kyc_verified 
                          ? '✅' 
                          : '⚠️'}
                      </span>
                      <div>
                        <strong style={{ fontSize: '0.95rem' }}>
                          {selectedBooking.status === 'Rejected' 
                            ? 'Stay Request Rejected' 
                            : selectedBooking.status === 'Cancelled'
                            ? 'Stay Request Cancelled'
                            : selectedBooking.kyc.kyc_verified 
                            ? 'Details Verified & Room Allocation Approved' 
                            : 'Pending Detail Verification & Room Allocation Approval'}
                        </strong>
                        <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '2px' }}>
                          {selectedBooking.status === 'Rejected'
                            ? `This stay request was rejected and cancelled by the manager. Reason: ${selectedBooking.rejection_reason || 'No reason specified'}`
                            : selectedBooking.status === 'Cancelled'
                            ? `This stay request was cancelled. ${selectedBooking.rejection_reason ? `Reason: ${selectedBooking.rejection_reason}` : ''}`
                            : selectedBooking.kyc.kyc_verified 
                            ? 'This customer stay has been verified and approved.' 
                            : 'Please inspect the uploaded identity documents below and verify details to accept or reject the reservation.'}
                        </div>
                      </div>
                    </div>
                    
                    {selectedBooking.status === 'Booked' && !selectedBooking.kyc.kyc_verified && (
                      <div style={{ display: 'flex', gap: '12px', marginTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '12px' }}>
                        <button
                          type="button"
                          className="btn-approve-request"
                          style={{ padding: '6px 16px', fontSize: '0.8rem', height: '32px' }}
                          onClick={() => handleToggleKYCVerification(selectedBooking.id, true)}
                        >
                          ✅ Verify & Approve Stay
                        </button>
                        <button
                          type="button"
                          className="btn-checkout-alert"
                          style={{ padding: '6px 16px', fontSize: '0.8rem', height: '32px' }}
                          onClick={() => {
                            setCancelRefundAmount(selectedBooking.advance_paid);
                            setCancelPaymentMethod('Cash');
                            setCancelModalOpen(true);
                          }}
                        >
                          ❌ Reject & Cancel Stay
                        </button>
                      </div>
                    )}
                  </div>
                )}

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
                                {!selectedBooking.kyc.kyc_verified && selectedBooking.status === 'Booked' && (
                                  <button
                                    type="button"
                                    className="btn-submit-modal"
                                    style={{
                                      marginLeft: '10px',
                                      padding: '2px 6px',
                                      fontSize: '0.65rem',
                                      height: 'auto',
                                      width: 'auto',
                                      background: 'rgba(34, 197, 94, 0.1)',
                                      borderColor: 'rgba(34, 197, 94, 0.3)',
                                      color: '#34d399'
                                    }}
                                    onClick={() => handleToggleKYCVerification(selectedBooking.id, true)}
                                  >
                                    Verify KYC
                                  </button>
                                )}
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
                      {parseFloat(selectedBooking.extra_charges || 0) > 0 && selectedBooking.extra_charges_reason && (
                        <div style={{ fontSize: '0.72rem', color: '#a78bfa', textAlign: 'right', marginTop: '-2px', marginBottom: '2px', fontStyle: 'italic' }}>
                          ({selectedBooking.extra_charges_reason})
                        </div>
                      )}
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
                        <div style={{ fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '6px' }}>Include Incidental / Extra Charges</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '8px', marginBottom: '8px' }}>
                          <div>
                            <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>Extra Amount (₹)</label>
                            <input
                              type="number"
                              className="input-control-small"
                              placeholder="₹ Amount"
                              value={extraAmountInput === '0' ? '' : extraAmountInput}
                              onChange={e => setExtraAmountInput(e.target.value)}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>Reason for Extra Charge</label>
                            <input
                              type="text"
                              className="input-control-small"
                              placeholder="e.g. Extra Bed, Food, Late Check-out"
                              value={extraAmountReasonInput}
                              onChange={e => setExtraAmountReasonInput(e.target.value)}
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          className="btn-submit-modal"
                          style={{ height: '32px', fontSize: '0.8rem', width: '100%', background: 'rgba(139, 92, 246, 0.15)', borderColor: 'rgba(139, 92, 246, 0.3)', color: '#a78bfa', fontWeight: 'bold' }}
                          onClick={handleAddExtraCharges}
                        >
                          ➕ Submit Incidental Charge
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="modal-actions" style={{ justifyContent: 'space-between', display: 'flex', width: '100%', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '12px', marginTop: '12px' }}>
                  {(() => {
                    const isEnded = selectedBooking.checked_out || selectedBooking.status === 'Cancelled' || selectedBooking.status === 'Rejected';
                    const currentRoomObj = rooms.find(r => Number(r.id) === Number(selectedBooking.room_id));
                    const roomIsDirty = currentRoomObj && currentRoomObj.cleanliness === 'dirty';
                    
                    if (isEnded) {
                      return <div />;
                    }
                    
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        {!selectedBooking.checked_out && (
                          <button 
                            type="button" 
                            className="btn-cancel" 
                            style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#ef4444', height: '30px', padding: '0 12px', display: 'flex', alignItems: 'center', fontSize: '0.75rem' }}
                            onClick={() => {
                              setCancelRefundAmount(selectedBooking.advance_paid);
                              setCancelPaymentMethod('Cash');
                              setCancelModalOpen(true);
                            }}
                          >
                            ❌ Cancel Reservation
                          </button>
                        )}
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '6px' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Status:</span>
                          <select
                            className="input-control-small"
                            style={{ width: '130px', height: '30px' }}
                            value={selectedBooking.checked_out ? 'Checked_out' : selectedBooking.status}
                            onChange={e => handleUpdateBookingStatus(selectedBooking.id, e.target.value)}
                          >
                            <option value="Booked">📅 Booked</option>
                            <option value="Checked_in">🟢 Checked-In</option>
                            <option value="Checked_out">🚪 Checked-Out</option>
                          </select>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '6px', borderLeft: '1px solid rgba(255, 255, 255, 0.1)', paddingLeft: '12px' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Cleanliness:</span>
                          <select
                            className="input-control-small"
                            style={{ width: '160px', height: '30px' }}
                            value={roomIsDirty ? 'dirty' : 'clean'}
                            onChange={e => handleUpdateCleanliness(e.target.value)}
                          >
                            <option value="clean">🧼 Clean</option>
                            <option value="dirty">🧹 Dirty (Needs Cleaning)</option>
                          </select>
                        </div>
                        
                        {!selectedBooking.checked_out && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '6px', borderLeft: '1px solid rgba(255, 255, 255, 0.1)', paddingLeft: '12px' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Allot Room:</span>
                            <select
                              className="input-control-small"
                              style={{ width: '155px', height: '30px' }}
                              value={selectedBooking.room_id || ''}
                              onChange={async e => {
                                const rId = e.target.value;
                                if (!rId) return;
                                try {
                                  const res = await fetch(`http://127.0.0.1:8000/api/my-hotel/bookings/${selectedBooking.id}/`, {
                                    method: 'PUT',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      'Authorization': `Token ${token}`
                                    },
                                    body: JSON.stringify({ room_id: rId })
                                  });
                                  const data = await res.json();
                                  if (!res.ok) throw new Error(data.detail || 'Failed to reallocate room');
                                  triggerToast(`Room reallocated to Room ${data.room_number}!`);
                                  setSelectedBooking(data);
                                  setBookings(prev => prev.map(b => b.id === data.id ? data : b));
                                } catch (err) {
                                  triggerToast(err.message);
                                }
                              }}
                            >
                              {rooms.map(rm => (
                                <option key={rm.id} value={rm.id}>
                                  Room {rm.number} ({rm.room_type})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {!(selectedBooking.checked_out || selectedBooking.status === 'Cancelled' || selectedBooking.status === 'Rejected') && (
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

          {/* Customer Payment Modal */}
          {customerPaymentModalOpen && customerPaymentBooking && (
            <div className="modal-backdrop" style={{ zIndex: 10000 }} onClick={() => setCustomerPaymentModalOpen(false)}>
              <div className="modal-content" style={{ maxWidth: '400px', background: '#020617', border: '1px solid #1e293b' }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>💳 Pay Stay's Outstanding Balance</h3>
                  <button className="btn-close" onClick={() => setCustomerPaymentModalOpen(false)}>&times;</button>
                </div>
                <form onSubmit={handleCustomerPaymentSubmit}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                    <div style={{ background: 'rgba(52, 211, 153, 0.05)', border: '1px solid rgba(52, 211, 153, 0.2)', padding: '10px 12px', borderRadius: '8px', fontSize: '0.85rem' }}>
                      <div>Stay: <strong>{customerPaymentBooking.check_in} to {customerPaymentBooking.check_out}</strong></div>
                      <div>Total Stay Cost: <strong>₹{parseFloat(customerPaymentBooking.total_cost).toLocaleString('en-IN')}</strong></div>
                      <div style={{ color: '#4ade80', fontWeight: 'bold', marginTop: '4px' }}>Remaining Balance Due: ₹{parseFloat(customerPaymentBooking.outstanding_amount).toLocaleString('en-IN')}</div>
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Payment Amount (₹)</label>
                      <input
                        type="number"
                        className="input-control"
                        required
                        max={parseFloat(customerPaymentBooking.outstanding_amount)}
                        min={0.01}
                        step="0.01"
                        placeholder="Enter amount to pay"
                        value={customerPaymentAmount}
                        onChange={e => setCustomerPaymentAmount(e.target.value)}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Payment Method</label>
                      <select
                        className="input-control"
                        value={customerPaymentMethod}
                        onChange={e => setCustomerPaymentMethod(e.target.value)}
                        style={{ background: 'rgba(15, 23, 42, 0.85)', color: '#fff' }}
                      >
                        <option value="UPI">UPI</option>
                        <option value="Card">Card</option>
                        <option value="Cash">Cash</option>
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Receipt ID / Transaction ID</label>
                      <input
                        type="text"
                        className="input-control"
                        placeholder="e.g. UPI Ref Number or Txn ID"
                        value={customerPaymentReceiptId}
                        onChange={e => setCustomerPaymentReceiptId(e.target.value)}
                      />
                    </div>
                    
                    <div className="modal-actions" style={{ marginTop: '12px' }}>
                      <button type="button" className="btn-cancel" onClick={() => setCustomerPaymentModalOpen(false)}>Cancel</button>
                      <button type="submit" className="btn-submit-modal" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>Submit Payment</button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}
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

                  {userRole !== 'customer' && (
                    <>
                      <div className="form-group" style={{ marginTop: '10px' }}>
                        <label className="form-label">Rejection Reason</label>
                        <select
                          className="input-control"
                          value={rejectionReason}
                          onChange={e => setRejectionReason(e.target.value)}
                          style={{ background: '#0f172a' }}
                        >
                          <option value="Rooms not available">Rooms not available</option>
                          <option value="Documents incomplete / invalid">Documents incomplete / invalid</option>
                          <option value="KYC verification failed">KYC verification failed</option>
                          <option value="Other">Other (Specify below)</option>
                        </select>
                      </div>
                      {rejectionReason === 'Other' && (
                        <div className="form-group">
                          <label className="form-label">Custom Rejection Reason</label>
                          <input
                            type="text"
                            className="input-control"
                            placeholder="Enter custom rejection reason"
                            value={customRejectionReason}
                            onChange={e => setCustomRejectionReason(e.target.value)}
                          />
                        </div>
                      )}
                    </>
                  )}

                  <div className="modal-actions" style={{ marginTop: '12px' }}>
                    <button type="button" className="btn-cancel" onClick={() => setCancelModalOpen(false)}>Close</button>
                    <button
                      type="button"
                      className="btn-danger"
                      onClick={handleConfirmCancel}
                    >
                      Confirm Cancel & Refund
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
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
                  <div>Room: {receiptData.roomNumber && receiptData.roomNumber.toString().startsWith('Assigned') ? receiptData.roomNumber : `Room ${receiptData.roomNumber}`}</div>
                  {receiptData.roomType && <div>Room Type: {receiptData.roomType}</div>}
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
                        <span>Extra / Incidentals {receiptData.extraChargesReason ? `(${receiptData.extraChargesReason})` : ''}:</span>
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

          {/* Extra Charges Customer Alert Popup */}
          {extraChargesAlertBooking && (
            <div className="modal-backdrop" style={{ zIndex: 12000 }} onClick={() => setExtraChargesAlertBooking(null)}>
              <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px', border: '1px solid rgba(139, 92, 246, 0.3)', background: '#020617' }}>
                <div className="modal-header">
                  <h3 style={{ color: '#a78bfa', margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    🛎️ Incidental Charges Added
                  </h3>
                  <button className="btn-close" onClick={() => setExtraChargesAlertBooking(null)}>&times;</button>
                </div>
                <div style={{ margin: '16px 0', fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.5' }}>
                  <p>Dear Guest, an additional charge has been added to your stay:</p>
                  <div style={{ background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.15)', padding: '12px', borderRadius: '8px', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Extra Amount:</span>
                      <strong style={{ color: '#a78bfa' }}>₹{parseFloat(extraChargesAlertBooking.extra_charges).toLocaleString('en-IN')}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Reason:</span>
                      <span style={{ fontWeight: '500', color: '#fff' }}>{extraChargesAlertBooking.extra_charges_reason || 'Incidentals'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '6px', marginTop: '4px', fontWeight: 'bold' }}>
                      <span>Total Outstanding:</span>
                      <strong style={{ color: '#f87171' }}>₹{parseFloat(extraChargesAlertBooking.outstanding_amount).toLocaleString('en-IN')}</strong>
                    </div>
                  </div>
                  <p>Please pay the outstanding balance to complete your bill settlement.</p>
                </div>
                <div className="modal-actions" style={{ justifyContent: 'center', borderTop: 'none', paddingTop: 0 }}>
                  <button
                    type="button"
                    className="btn-submit-modal"
                    style={{ width: '100%', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}
                    onClick={() => {
                      setCustomerPaymentBooking(extraChargesAlertBooking);
                      setCustomerPaymentAmount(extraChargesAlertBooking.outstanding_amount.toString());
                      setCustomerPaymentModalOpen(true);
                      setExtraChargesAlertBooking(null);
                    }}
                  >
                    💳 Pay Total Outstanding Bill
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Auth Page (Login or Register)
        <div className="auth-wrapper">
          {isRegisterMode ? (
            // Customer Registration Form
            <form onSubmit={handleRegister}>
              <h2 style={{ fontSize: '3.2rem', marginBottom: '3.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '20px', color: '#a78bfa', textAlign: 'center' }}>📝 Register Guest Account</h2>
              
              <div className="form-group">
                <label className="form-label">Email Address (Username)</label>
                <input
                  type="email"
                  className="input-control"
                  placeholder="Enter email address"
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
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
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn-submit"
                disabled={loading || !regEmail || !regPassword}
              >
                {loading ? 'Registering Account...' : 'Register'}
              </button>

              <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '1.25rem' }}>
                Already have an account?{' '}
                <span 
                  onClick={() => setIsRegisterMode(false)} 
                  style={{ color: '#a78bfa', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Sign In
                </span>
              </div>
            </form>
          ) : (
            // Login Form
            <form onSubmit={handleLogin}>
              <h2 style={{ fontSize: '3.2rem', marginBottom: '3.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '20px', color: '#a78bfa', textAlign: 'center' }}>🔑 Sign In</h2>
              
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
                  placeholder="Enter hotel code or name (e.g. ABH01 or Golden Plaza)"
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

              <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '1.25rem' }}>
                New guest?{' '}
                <span 
                  onClick={() => setIsRegisterMode(true)} 
                  style={{ color: '#a78bfa', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Register Account
                </span>
              </div>
            </form>
          )}
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
