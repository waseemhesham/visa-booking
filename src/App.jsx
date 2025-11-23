import { useState, useEffect } from 'react';
import { supabase } from './db.js';

// Delete any bookings in the past (keep table clean)
const deletePastBookings = async () => {
  const today = new Date();
  const localToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const todayStr = localToday.toISOString().split('T')[0]; // YYYY-MM-DD

  await supabase
    .from('bookings')
    .delete()
    .lt('booking_date', todayStr);
};

function App() {
  // booking form state
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [pin, setPin] = useState('');
  const [message, setMessage] = useState('');

  // cancel section
  const [cancelEmail, setCancelEmail] = useState('');
  const [cancelPin, setCancelPin] = useState('');
  const [myBookings, setMyBookings] = useState([]);
  const [cancelMessage, setCancelMessage] = useState('');

  // calendar info
  const [fullyBookedDates, setFullyBookedDates] = useState([]);

  // tomorrow string (for min date in calendar)
  const tomorrowStr = (() => {
    const now = new Date();
    const tomorrow = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1
    );
    return tomorrow.toISOString().split('T')[0];
  })();

  // load fully booked dates & clean past bookings on start
  useEffect(() => {
    const init = async () => {
      await deletePastBookings();
      await fetchFullyBookedDates();
    };
    init();
  }, []);

  const fetchFullyBookedDates = async () => {
    const { data, error } = await supabase
      .from('bookings')
      .select('booking_date')
      .eq('status', 'active');

    if (error) {
      console.error(error);
      return;
    }

    const counts = {};
    data.forEach((row) => {
      const d = row.booking_date;
      counts[d] = (counts[d] || 0) + 1;
    });

    const fullDates = Object.keys(counts).filter((d) => counts[d] >= 3);
    setFullyBookedDates(fullDates);
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!email || !name || !date || !pin) {
      setMessage('Please fill all fields.');
      return;
    }

    // email must be @sap.com
    if (!email.toLowerCase().endsWith('@sap.com')) {
      setMessage('Booking must use an @sap.com email.');
      return;
    }

    // PIN must be 4 digits
    if (!/^\d{4}$/.test(pin)) {
      setMessage('PIN must be exactly 4 digits.');
      return;
    }

    // cannot book a day in the past
    const today = new Date();
    const localToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const selected = new Date(date + 'T00:00:00');

    if (selected < localToday) {
      setMessage('You cannot book a date in the past.');
      return;
    }

    // only Sunday–Wednesday
    const day = selected.getDay(); // Sun=0, Mon=1, Tue=2, Wed=3
    if (day > 3) {
      setMessage('You can only book from Sunday to Wednesday.');
      return;
    }

    const dateStr = date;

    // clean past bookings again, just in case
    await deletePastBookings();

    // check this email does not have another ACTIVE booking
    const { count: activeForEmail, error: emailCountError } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('employee_email', email)
      .eq('status', 'active');

    if (emailCountError) {
      console.error(emailCountError);
      setMessage('Error checking existing bookings for this email.');
      return;
    }

    if (activeForEmail && activeForEmail > 0) {
      setMessage('You already have an active booking. Cancel it first.');
      return;
    }

    // check how many ACTIVE bookings already exist for this date
    const { count, error: countError } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('booking_date', dateStr)
      .eq('status', 'active');

    if (countError) {
      console.error(countError);
      setMessage('Error checking availability.');
      return;
    }

    if (count >= 3) {
      setMessage('This day already has 3 active bookings.');
      return;
    }

    if (fullyBookedDates.includes(dateStr)) {
      setMessage('This day is fully booked.');
      return;
    }

    // insert booking as ACTIVE with PIN
    const { error: insertError } = await supabase.from('bookings').insert([
      {
        employee_email: email,
        employee_name: name,
        booking_date: dateStr,
        status: 'active',
        pin_code: pin,
      },
    ]);

    if (insertError) {
      console.error(insertError);
      setMessage('Error saving booking.');
      return;
    }

    setMessage('Booking confirmed! 🎉');
    setEmail('');
    setName('');
    setDate('');
    setPin('');

    // refresh fully booked dates and, if same email, reload bookings
    await fetchFullyBookedDates();
    if (cancelEmail && cancelEmail.toLowerCase() === email.toLowerCase()) {
      await loadMyBookings();
    }
  };

  const loadMyBookings = async () => {
    setCancelMessage('');
    setMyBookings([]);

    if (!cancelEmail || !cancelPin) {
      setCancelMessage('Please enter your email and PIN.');
      return;
    }

    const { data, error } = await supabase
      .from('bookings')
      .select('id, booking_date, status')
      .eq('employee_email', cancelEmail)
      .eq('pin_code', cancelPin)
      .order('booking_date', { ascending: true });

    if (error) {
      console.error(error);
      setCancelMessage('Error loading your bookings.');
      return;
    }

    setMyBookings(data);
    if (data.length === 0) {
      setCancelMessage('No bookings found for this email and PIN.');
    }
  };

  const cancelBookingById = async (id) => {
    setCancelMessage('');

    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(error);
      setCancelMessage('Error cancelling booking.');
      return;
    }

    setCancelMessage('Booking cancelled ✅');

    // reload lists
    await loadMyBookings();
    await fetchFullyBookedDates();
  };

  return (
    <div
      style={{
        maxWidth: '480px',
        margin: '40px auto',
        marginLeft: '120px', // shift UI ~3cm to the right
        fontFamily: 'Arial',
      }}
    >
      <h2>Visa Booking (Max 3 per Day)</h2>

      {/* Booking form */}
      <form onSubmit={handleBooking}>
        <div style={{ marginBottom: '12px' }}>
          <label>Email (@sap.com)</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value.trim())}
            style={{ width: '100%', padding: '8px', marginTop: '4px' }}
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: '100%', padding: '8px', marginTop: '4px' }}
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label>Booking Date</label>
          <input
            key={tomorrowStr}
            type="date"
            value={date}
            min={tomorrowStr} // start from tomorrow
            onChange={(e) => setDate(e.target.value)}
            style={{ width: '100%', padding: '8px', marginTop: '4px' }}
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label>PIN (4 digits)</label>
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            maxLength={4}
            inputMode="numeric"
            style={{ width: '100%', padding: '8px', marginTop: '4px' }}
          />
        </div>

        <button
          style={{
            padding: '10px 20px',
            cursor: 'pointer',
          }}
        >
          Book
        </button>
      </form>

      {message && (
        <p style={{ marginTop: '12px' }}>{message}</p>
      )}

      {/* Fully booked dates info */}
      <div style={{ marginTop: '20px' }}>
        <strong>Fully booked dates:</strong>
        {fullyBookedDates.length === 0 ? (
          <p style={{ marginTop: '4px' }}>No fully booked days yet.</p>
        ) : (
          <ul style={{ marginTop: '4px' }}>
            {fullyBookedDates.map((d) => (
              <li key={d} style={{ opacity: 0.6 }}>
                {d}
              </li>
            ))}
          </ul>
        )}
      </div>

      <hr style={{ margin: '30px 0' }} />

      {/* Cancel section */}
      <h3>Cancel my booking</h3>

      <div style={{ marginBottom: '12px' }}>
        <label>Your email (@sap.com)</label>
        <input
          type="email"
          value={cancelEmail}
          onChange={(e) => setCancelEmail(e.target.value.trim())}
          style={{ width: '100%', padding: '8px', marginTop: '4px' }}
        />
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label>Your PIN (4 digits)</label>
        <input
          type="password"
          value={cancelPin}
          onChange={(e) => setCancelPin(e.target.value)}
          maxLength={4}
          inputMode="numeric"
          style={{ width: '100%', padding: '8px', marginTop: '4px' }}
        />
      </div>

      <button
        type="button"
        onClick={loadMyBookings}
        style={{ padding: '8px 16px', marginBottom: '12px', cursor: 'pointer' }}
      >
        Load my bookings
      </button>

      {myBookings.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <strong>Your bookings:</strong>
          <ul style={{ marginTop: '6px', paddingLeft: '18px' }}>
            {myBookings.map((b) => (
              <li key={b.id} style={{ marginBottom: '6px' }}>
                {b.booking_date} — {b.status}
                <button
                  type="button"
                  onClick={() => cancelBookingById(b.id)}
                  style={{
                    marginLeft: '8px',
                    padding: '4px 10px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {cancelMessage && (
        <p style={{ marginTop: '8px' }}>{cancelMessage}</p>
      )}
    </div>
  );
}

export default App;

