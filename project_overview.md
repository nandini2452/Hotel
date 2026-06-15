# Front Desk Booking Calendar Grid – Project Overview

The application includes two main modules:

- **Room Module**: Manages room details such as room number, room type, category, pricing, and minimum advance amount.
- **Booking Module**: Manages guest information, check-in and check-out dates/timings, booking status, advance paid amount, and advance payment status.

The system supports the following booking statuses:

- Booked
- Checked-In
- Checked-Out

When a booking is marked as Checked-Out, the room becomes immediately available for new reservations.

---

### Room Category Setup & Pricing

The system is pre-populated with **13 rooms per hotel**, categorized into different types with specific nightly rates (in Indian Rupees ₹) and minimum advance deposit rules:

* **Standard Rooms**:
  * Nightly Rate: **₹1,500**
  * Minimum Required Advance: **₹500**
  * Seeded Rooms: `STD-101` to `STD-105` (5 rooms)
* **Deluxe Rooms**:
  * Nightly Rate: **₹2,500**
  * Minimum Required Advance: **₹1,000**
  * Seeded Rooms: `DLX-116` to `DLX-120` (5 rooms)
* **Superior Rooms**:
  * Nightly Rate: **₹4,000**
  * Minimum Required Advance: **₹2,000**
  * Seeded Rooms: `SUP-131` to `SUP-133` (3 rooms)

---

### Saved Check-in & Check-out Timings

Reservations explicitly save both the dates and specific check-in/check-out times of day. 
* The interface features synchronized dropdown select fields matching check-in and check-out timings (e.g., if a guest checks in at `12:00 AM`, the auto-checkout time automatically shifts to match `12:00 AM` on their departure day).
* These timings are stored directly in the database (`check_in_time` and `check_out_time`) and are used alongside dates to check stay duration and trigger stay-expiry alerts for check-out reminders.

---

### Database Structure

The system uses three relational tables to store properties, rooms, and reservations:

#### 1. Hotel Model (`api_hotel`)
Maps hotel properties to their owner and managers.
- `id` (Integer, Primary Key): Unique auto-incrementing ID.
- `name` (Varchar): The descriptive name of the hotel property.
- `code` (Varchar, Unique): Unique identifier code for login (e.g. `ABH01`, `ABL02`).
- `owner` (ForeignKey to Django `User`): The Owner of the hotel.
- `managers` (ManyToManyField to Django `User`): Authorized managers for the hotel.

#### 2. Room Model (`api_room`)
Stores individual rooms associated with a hotel.
- `id` (Integer, Primary Key): Unique auto-incrementing ID.
- `hotel` (ForeignKey to `Hotel`, Cascade): Links the room to its hotel.
- `number` (Varchar): Room identifier (e.g. `STD-101`, `DLX-116`, `SUP-131`).
- `room_type` (Varchar): Tier category (`Standard`, `Deluxe`, `Superior`).
- `price` (Decimal): Nightly pricing rate in Indian Rupees (₹).
- *Unique Constraint*: A room number must be unique within a single hotel.

#### 3. Booking Model (`api_booking`)
Stores reservations and stay details for guests.
- `id` (Integer, Primary Key): Unique auto-incrementing ID.
- `room` (ForeignKey to `Room`, Cascade): Assigned room for the booking.
- `guest_first_name` (Varchar): Guest first name.
- `guest_last_name` (Varchar): Guest last name.
- `guest_phone` (Varchar): Guest's 10-digit mobile number.
- `guest_email` (Varchar, Optional): Guest's email address.
- `check_in` (Date): Check-in date.
- `check_in_time` (Varchar): Time of check-in (e.g., `12:00 PM`).
- `check_out` (Date): Check-out date.
- `check_out_time` (Varchar): Time of check-out (e.g., `12:00 PM`).
- `status` (Varchar): Booking status (`Hold`, `Temp Reserve`, `Booked`, `Checked-In`, `Checked-Out`).
- `advance_paid` (Decimal): Advance payment deposit amount in Indian Rupees (₹).
- `advance_status` (Varchar): Payment status (`Paid`, `Unpaid`).

---

### Implemented APIs

- GET `"/api/my-hotel/rooms/"` – Retrieves room details and minimum advance requirements.
- GET `"/api/my-hotel/bookings/"` – Retrieves active bookings.
- POST and PUT booking APIs – Create and update booking information.

The booking API returns complete booking details, including:

- `"room_id"`
- `"room_number"`
- `"room_type"`
- Guest details (first name, last name, phone, email)
- Check-in and check-out dates & times
- Booking status
- Advance paid amount
- Advance payment status

---

### UI Features & Grid Scheduler

- **14-day Rolling Grid View**: Displays rooms vertically by category; plots reservation blocks horizontally spanning check-in to check-out dates.
- **Checked-Out Room Re-allotment**: Excluding `'Checked-Out'` bookings from active grid checks frees up those slots immediately for new bookings.
- **Booking Modification**: Selecting a block opens the edit modal to allow updating details (e.g., changing unpaid status to paid).
- **Overdue Check-Out alerts**: Automatically detects stayed-in rooms where the scheduled checkout date/time is passed, listing them in a warning banner.
- **Guest Communication Quick Options**: Direct access to Send SMS (`sms:...`) or Send WhatsApp (`https://api.whatsapp.com/send...`) for checkout reminders.
