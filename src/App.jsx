1import { useState, useEffect } from 'react';
import { supabase } from './db.js';

// Helper: format YYYY-MM-DD from year, monthIndex (0-based), day
const formatYMD = (year, monthIndex, day) => {
  const m = String(monthIndex + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
};

// Helper: format YYYY-MM-DD from Date object in local time
const formatLocalDate = (dateObj) => {
  return formatYMD(
    dateObj.getFullYear(),
    dateObj.getMonth(),
    dateObj.getDate()
  );
};

// Delete any bookings in the past (keep table clean)
const deletePastBookings = async () => {
  const today = new Date();
  const localToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const todayStr = formatLocalDate(localToday); // YYYY-MM-DD

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

  // fully booked info
  const [fullyBookedDates, setFullyBookedDates] = useState([]);

  // calendar counts: { 'YYYY-MM-DD': numberOfBookings }
  const [calendarCounts, setCalendarCounts] = useState({});

  // calendar month/year state (starts at current month)
  const now = new Date();
  const [calendarYear, setCalendarYear] = useState(now.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(now.getMonth()); // 0-11

  // tomorrow string (for min date in calendar)
  const tomorrowStr = (() => {
    const nowLocal = new Date();
    const tomorrow = new Date(
      nowLocal.getFullYear(),
      nowLocal.getMonth(),
      nowLocal.getDate() + 1
    );
    return formatLocalDate(tomorrow);
  })();

  // initial: clean old bookings + load fully booked list
  useEffect(() => {
    const init = async () => {
      await deletePastBookings();
      await fetchFullyBookedDates();
    };
    init();
  }, []);

  // reload calendar counts whenever month/year changes
  useEffect(() => {
    const loadCalendar = async () => {
      await fetchCalendarCounts();
    };
    loadCalendar();
  }, [calendarMonth, calendarYear]);

  const fetchFullyBookedDates = async () => {
    const { data, error } = await supabase
      .from('bookings')
      .select('booking_date')
      .eq('status', 'active');

    if (error) {
      console.error(error);
      return;
    }

    // Count bookings per date
    const counts = {};
    data.forEach((row) => {
      const d = row.booking_date;
      counts[d] = (counts[d] || 0) + 1;
    });

    // Compute today as YYYY-MM-DD in local time
    const today = new Date();
    const localToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const todayStr = formatLocalDate(localToday);

    // keep today and future only, with 3+ bookings
    const fullDates = Object.keys(counts).filter(
      (d) => counts[d] >= 3 && d >= todayStr
    );

    setFullyBookedDates(fullDates);
  };

  const fetchCalendarCounts = async () => {
    // Current selected month range
    const firstDay = new Date(calendarYear, calendarMonth, 1);
    const lastDay = new Date(calendarYear, calendarMonth + 1, 0);

    const firstDayStr = formatLocalDate(firstDay);
    const lastDayStr = formatLocalDate(lastDay);

    const { data, error } = await supabase
      .from('bookings')
      .select('booking_date')
      .eq('status', 'active')
      .gte('booking_date', firstDayStr)
      .lte('booking_date', lastDayStr);

    if (error) {
      console.error(error);
      return;
    }

    const counts = {};
    data.forEach((row) => {
      const d = row.booking_date;
      counts[d] = (counts[d] || 0) + 1;
    });

    setCalendarCounts(counts);
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

    // refresh lists
    await fetchFullyBookedDates();
    await fetchCalendarCounts();
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
    await fetchCalendarCounts();
  };

  // month navigation for calendar
  const goToPrevMonth = () => {
    setCalendarMonth((prevMonth) => {
      if (prevMonth === 0) {
        setCalendarYear((y) => y - 1);
        return 11;
      }
      return prevMonth - 1;
    });
  };

  const goToNextMonth = () => {
    setCalendarMonth((prevMonth) => {
      if (prevMonth === 11) {
        setCalendarYear((y) => y + 1);
        return 0;
      }
      return prevMonth + 1;
    });
  };

  // Render calendar cells for current selected month
  const renderCalendar = () => {
    const firstDay = new Date(calendarYear, calendarMonth, 1);
    const firstDayOfWeek = firstDay.getDay(); // 0=Sun..6=Sat
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();

    const cells = [];

    // empty cells before day 1
    for (let i = 0; i < firstDayOfWeek; i++) {
      cells.push(null);
    }

    // days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatYMD(calendarYear, calendarMonth, day);
      const count = calendarCounts[dateStr] || 0;

      cells.push({
        day,
        count,
      });
    }

    // chunk into weeks (rows of 7)
    const weeks = [];
    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, i + 7));
    }

    const monthName = firstDay.toLocaleString('default', {
      month: 'long',
    });

    return (
      <div>
        {/* Header with month navigation */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
          }}
        >
          <button
            type="button"
            onClick={goToPrevMonth}
            style={{
              padding: '2px 8px',
              cursor: 'pointer',
              fontSize: '0.8rem',
            }}
          >
            ◀
          </button>
          <h4 style={{ margin: 0, textAlign: 'center' }}>
            {monthName} {calendarYear}
          </h4>
          <button
            type="button"
            onClick={goToNextMonth}
            style={{
              padding: '2px 8px',
              cursor: 'pointer',
              fontSize: '0.8rem',
            }}
          >
            ▶
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '4px',
            fontSize: '0.8rem',
          }}
        >
          {/* Week day headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div
              key={d}
              style={{ textAlign: 'center', fontWeight: 'bold', padding: '4px 0' }}
            >
              {d}
            </div>
          ))}

          {/* Calendar cells */}
          {weeks.map((week, wi) =>
            week.map((cell, ci) => {
              const key = `${wi}-${ci}`;
              if (!cell) {
                return (
                  <div
                    key={key}
                    style={{
                      border: '1px solid #eee',
                      minHeight: '40px',
                    }}
                  />
                );
              }

              // weekday: 0=Sun .. 6=Sat
              const weekday = new Date(
                calendarYear,
                calendarMonth,
                cell.day
              ).getDay();

              return (
                <div
                  key={key}
                  style={{
                    border: '1px solid #eee',
                    minHeight: '40px',
                    padding: '2px',
                    textAlign: 'center',
                  }}
                >
                  <div>{cell.day}</div>
                  <div
                    style={{
                      marginTop: '2px',
                      fontSize: '0.7rem',
                      textAlign: 'center',
                    }}
                  >
                    {weekday >= 4 ? (
                      // Thu, Fri, Sat -> red X
                      <span style={{ color: 'red', fontWeight: 'bold' }}>X</span>
                    ) : (
                      // Sun–Wed -> show count in green or red if 3
                      <span
                        style={{
                          color: cell.count === 3 ? 'red' : 'green',
                        }}
                      >
                        {cell.count}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        maxWidth: '1100px',
        margin: '40px auto',
        marginLeft: '120px', // main UI shift right
        fontFamily: 'Arial',
      }}
    >
      {/* LEFT: booking + cancel */}
      <div style={{ flex: 1, maxWidth: '480px', marginRight: '24px' }}>
        <h2
          style={{
            textAlign: 'center',
            whiteSpace: 'nowrap',
            marginBottom: '20px',
          }}
        >
          German Chamber Booking (Max 3 per Day)
        </h2>

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

        {message && <p style={{ marginTop: '12px' }}>{message}</p>}

        {/* Fully booked dates info */}
        <div style={{ marginTop: '20px' }}>
          <strong>Fully booked dates (today & future):</strong>
          {fullyBookedDates.length === 0 ? (
            <p style={{ marginTop: '4px' }}>No fully booked days yet.</p>
          ) : (
            <ul style={{ marginTop: '4px' }}>
              {fullyBookedDates.map((d) => (
                <li key={d} style={{ opacity: 0.8 }}>
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
          style={{
            padding: '8px 16px',
            marginBottom: '12px',
            cursor: 'pointer',
          }}
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

        {cancelMessage && <p style={{ marginTop: '8px' }}>{cancelMessage}</p>}
      </div>

      {/* RIGHT: monthly calendar, shifted right & down */}
      <div
        style={{
          width: '260px',
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '12px',
          backgroundColor: '#fafafa',
          marginLeft: '230px', // ≈ 6 cm to the right
          marginTop: '76px', // ≈ 2 cm down
        }}
      >
        {renderCalendar()}

{/* Legend */}
<div style={{ marginTop: '16px', fontSize: '0.9rem' }}>
  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
    <div
      style={{
        width: '14px',
        height: '14px',
        backgroundColor: 'red',
        marginRight: '6px',
      }}
    ></div>
    <span>Fully Booked</span>
  </div>

  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
    <div
      style={{
        width: '14px',
        height: '14px',
        backgroundColor: 'green',
        marginRight: '6px',
      }}
    ></div>
    <span>Available Slot</span>
  </div>

  <div style={{ display: 'flex', alignItems: 'center' }}>
    <span
      style={{
        color: 'red',
        fontWeight: 'bold',
        marginRight: '6px',
        fontSize: '1rem',
      }}
    >
      X
    </span>
    <span>Not Available</span>
  </div>
</div>

      </div>
    </div>
  );
}

export default App;
