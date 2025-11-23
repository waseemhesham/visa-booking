import { useState, useEffect } from 'react';
import { supabase } from './db.js';

// Mark any past active bookings as "used"
const markPastBookingsAsUsed = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().slice(0, 10); // YYYY-MM-DD

  await supabase
    .from('bookings')
    .update({ status: 'used' })
    .lt('booking_date', todayStr)
    .eq('status', 'active');
};

function App() {
  // booking form state
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [message, setMessage] = useState('');

  // cancel section
  const [cancelEmail, setCancelEmail] = useState('');
  const [myBookings, setMyBookings] = useState([]);
  const [cancelMessage, setCancelMessage] = useState('');

  // calendar info
  const [fullyBookedDates, setFullyBookedDates] = useState([]);

  // today string (for logic)
  const todayStr = (() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t.toISOString().slice(0, 10);
  })();

  // tomorrow string (for min date in calendar)
 const tomorrowStr = (() => {
  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2);
  return tomorrow.toISOString().split("T")[0];
})();

  // load fully booked dates on start
  useEffect(() => {
    const init = async () => {
      await markPastBookingsAsUsed();
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

    if (!email || !name || !date) {
      setMessage('Please fill all fields.');
      return;
    }

    // 1) email must be @sap.com
    if (!email.toLowerCase().endsWith('@sap.com')) {
      setMessage('Booking must use an @sap.com email.');
      return;
    }

    // 3) cannot book a day in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(date + 'T00:00:00');
    selected.setHours(0, 0, 0, 0);

    if (selected < today) {
      setMessage('You cannot book a date in the past.');
      return;
    }

    // only allow Sunday–Wednesday
    const day = selected.getDay(); // Sun=0, Mon=1, Tue=2, Wed=3
    if (day > 3) {
      setMessage('You can only book from Sunday to Wednesday.');
      return;
    }

    const dateStr = date;

    // make sure past bookings are marked used
    await markPastBookingsAsUsed();

    // 2) check this email does not have another ACTIVE booking
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

    // extra safety: check UI list too
    if (fullyBookedDates.includes(dateStr)) {
      setMessage('This day is fully booked.');
      return;
    }

    // insert booking as ACTIVE
    const { error: insertError } = await supabase.from('bookings').insert([
      {
        employee_email: email,
        employee_name: name,
        booking_date: dateStr,
        status: 'active',
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

    // refresh fully booked dates and, if relevant, user bookings
    await fetchFullyBookedDates();
    if (cancelEmail && cancelEmail.toLowerCase() === email.toLowerCase()) {
      await loadMyBookings(cancelEmail);
    }
  };

  const loadMyBookings = async (emailToLoad) => {
    setCancelMessage('');
    setMyBookings([]);

    if (!emailToLoad) {
      setCancelMessage('Please enter your email first.');
      return;
    }

    const { data, error } = await supabase
      .from('bookings')
      .select('id, booking_date, status')
      .eq('employee_email', emailToLoad)
      .order('booking_date', { ascending: true });

    if (error) {
      console.error(error);
      setCancelMessage('Error loading your bookings.');
      return;
    }

    setMyBookings(data);
    if (data.length === 0) {
      setCancelMessage('You have no bookings.');
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
    if (cancelEmail) {
      await loadMyBookings(cancelEmail);
    }
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
  key={tomorrowStr}   // 👈 forces browser to re-render with the new min
  type="date"
  value={date}
  min={tomorrowStr}
  onChange={(e) => setDate(e.target.value)}
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

      {/* Simple "calendar" info for fully booked days */}
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
        <button
          type="button"
          onClick={() => loadMyBookings(cancelEmail)}
          style={{ padding: '8px 16px', marginTop: '8px', cursor: 'pointer' }}
        >
          Load my bookings
        </button>
      </div>

      {myBookings.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <strong>Your bookings:</strong>
          <ul style={{ marginTop: '6px', paddingLeft: '18px' }}>
            {myBookings.map((b) => (
              <li key={b.id} style={{ marginBottom: '6px' }}>
                {b.booking_date} — {b.status}
                {b.status === 'active' && (
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
                )}
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
