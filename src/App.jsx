import { useState, useEffect } from "react";
import { supabase } from "./db.js";

<<<<<<< HEAD
// Helper: format YYYY-MM-DD from year, monthIndex (0-based), day
const formatYMD = (year, monthIndex, day) => {
  const m = String(monthIndex + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
};

// Helper: format YYYY-MM-DD from Date object in local time
=======
// ---------- helpers ----------
const formatYMD = (year, monthIndex, day) => {
  const m = String(monthIndex + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
};

>>>>>>> 4c0d016 (UI updates and calendar reposition)
const formatLocalDate = (dateObj) => {
  return formatYMD(
    dateObj.getFullYear(),
    dateObj.getMonth(),
    dateObj.getDate()
  );
};

<<<<<<< HEAD
// Delete any bookings in the past (keep table clean)
=======
// delete all past bookings (keep table clean)
>>>>>>> 4c0d016 (UI updates and calendar reposition)
const deletePastBookings = async () => {
  const today = new Date();
  const localToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
<<<<<<< HEAD
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
=======
  const todayStr = formatLocalDate(localToday);

  await supabase.from("bookings").delete().lt("booking_date", todayStr);
};

function App() {
  // booking form
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState("");

  // cancel section
  const [cancelEmail, setCancelEmail] = useState("");
  const [cancelPin, setCancelPin] = useState("");
>>>>>>> 4c0d016 (UI updates and calendar reposition)
  const [myBookings, setMyBookings] = useState([]);
  const [cancelMessage, setCancelMessage] = useState("");

<<<<<<< HEAD
  // fully booked info
  const [fullyBookedDates, setFullyBookedDates] = useState([]);

  // calendar counts: { 'YYYY-MM-DD': numberOfBookings }
  const [calendarCounts, setCalendarCounts] = useState({});

  // popup for clicking on a date in the calendar
  const [popupDate, setPopupDate] = useState(null);
  const [popupBookings, setPopupBookings] = useState([]);

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
=======
  // fully booked list
  const [fullyBookedDates, setFullyBookedDates] = useState([]);

  // calendar
  const now = new Date();
  const [calendarYear, setCalendarYear] = useState(now.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(now.getMonth()); // 0-11
  const [calendarCounts, setCalendarCounts] = useState({});

  // popup for clicked date
  const [popupDate, setPopupDate] = useState(null);
  const [popupBookings, setPopupBookings] = useState([]);

  // tomorrow (min date)
  const tomorrowStr = (() => {
    const today = new Date();
    const t = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 1
    );
    return formatLocalDate(t);
  })();

  // initial load
>>>>>>> 4c0d016 (UI updates and calendar reposition)
  useEffect(() => {
    const init = async () => {
      await deletePastBookings();
      await fetchFullyBookedDates();
      await fetchCalendarCounts();
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

<<<<<<< HEAD
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
      .select('booking_date'); // no status filter

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
      .gte('booking_date', firstDayStr)
      .lte('booking_date', lastDayStr); // no status filter
=======
  // reload calendar when month/year changes
  useEffect(() => {
    fetchCalendarCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendarMonth, calendarYear]);

  // ---------- data loaders ----------
  const fetchFullyBookedDates = async () => {
    const { data, error } = await supabase
      .from("bookings")
      .select("booking_date");
>>>>>>> 4c0d016 (UI updates and calendar reposition)

    if (error) {
      console.error(error);
      return;
    }

    const counts = {};
    (data || []).forEach((row) => {
      counts[row.booking_date] = (counts[row.booking_date] || 0) + 1;
    });

<<<<<<< HEAD
    setCalendarCounts(counts);
=======
    const today = new Date();
    const localToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const todayStr = formatLocalDate(localToday);

    const fullDates = Object.keys(counts).filter(
      (d) => counts[d] >= 3 && d >= todayStr
    );

    setFullyBookedDates(fullDates);
>>>>>>> 4c0d016 (UI updates and calendar reposition)
  };

  const fetchCalendarCounts = async () => {
    const firstDay = new Date(calendarYear, calendarMonth, 1);
    const lastDay = new Date(calendarYear, calendarMonth + 1, 0); // last day in month

    const firstStr = formatLocalDate(firstDay);
    const lastStr = formatLocalDate(lastDay);

    const { data, error } = await supabase
      .from("bookings")
      .select("booking_date")
      .gte("booking_date", firstStr)
      .lte("booking_date", lastStr);

    if (error) {
      console.error(error);
      return;
    }

    const counts = {};
    (data || []).forEach((row) => {
      counts[row.booking_date] = (counts[row.booking_date] || 0) + 1;
    });

    setCalendarCounts(counts);
  };

  const loadBookingsForDate = async (dateStr) => {
    const { data, error } = await supabase
      .from("bookings")
      .select("employee_email")
      .eq("booking_date", dateStr);

    if (error) {
      console.error(error);
      setPopupBookings([]);
      return;
    }

    setPopupBookings(data || []);
  };

  // ---------- booking ----------
  const handleBooking = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!email || !name || !date || !pin) {
<<<<<<< HEAD
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
=======
      setMessage("Please fill all fields.");
      return;
    }

    if (!email.toLowerCase().endsWith("@sap.com")) {
      setMessage("Booking must use an @sap.com email.");
      return;
    }

    if (!/^\d{4}$/.test(pin)) {
      setMessage("PIN must be exactly 4 digits.");
      return;
    }

    const today = new Date();
    const localToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const selected = new Date(date + "T00:00:00");

    if (selected < localToday) {
      setMessage("You cannot book a date in the past.");
      return;
    }

    const dow = selected.getDay(); // 0=Sun..6=Sat
    if (dow > 3) {
      setMessage("You can only book from Sunday to Wednesday.");
>>>>>>> 4c0d016 (UI updates and calendar reposition)
      return;
    }

    await deletePastBookings();

<<<<<<< HEAD
    // clean past bookings again, just in case
    await deletePastBookings();

    // check this email does not have another booking (table already has only future rows)
    const { count: activeForEmail, error: emailCountError } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('employee_email', email); // removed status filter

    if (emailCountError) {
      console.error(emailCountError);
      setMessage('Error checking existing bookings for this email.');
=======
    // one active booking per email
    const { count: emailCount, error: emailErr } = await supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("employee_email", email);

    if (emailErr) {
      console.error(emailErr);
      setMessage("Error checking existing bookings.");
>>>>>>> 4c0d016 (UI updates and calendar reposition)
      return;
    }

    if (emailCount && emailCount > 0) {
      setMessage("You already have an active booking. Cancel it first.");
      return;
    }

<<<<<<< HEAD
    // check how many bookings already exist for this date
    const { count, error: countError } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('booking_date', dateStr); // removed status filter
=======
    // max 3 per day
    const { count: dayCount, error: dayErr } = await supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("booking_date", date);
>>>>>>> 4c0d016 (UI updates and calendar reposition)

    if (dayErr) {
      console.error(dayErr);
      setMessage("Error checking availability.");
      return;
    }

<<<<<<< HEAD
    if (count >= 3) {
      setMessage('This day already has 3 bookings.');
      return;
    }

    if (fullyBookedDates.includes(dateStr)) {
      setMessage('This day is fully booked.');
      return;
    }

    // insert booking with PIN (status still inserted but not used in filters)
    const { error: insertError } = await supabase.from('bookings').insert([
      {
        employee_email: email,
        employee_name: name,
        booking_date: dateStr,
        status: 'active', // still fine if column exists
=======
    if (dayCount >= 3) {
      setMessage("This day already has 3 bookings.");
      return;
    }

    const { error: insertErr } = await supabase.from("bookings").insert([
      {
        employee_email: email,
        employee_name: name,
        booking_date: date,
        status: "active",
>>>>>>> 4c0d016 (UI updates and calendar reposition)
        pin_code: pin,
      },
    ]);

    if (insertErr) {
      console.error(insertErr);
      setMessage("Error saving booking.");
      return;
    }

<<<<<<< HEAD
    setMessage('Booking confirmed! 🎉');
    setEmail('');
    setName('');
    setDate('');
    setPin('');

    // refresh lists
=======
    setMessage("Booking confirmed! 🎉");
    setEmail("");
    setName("");
    setDate("");
    setPin("");

>>>>>>> 4c0d016 (UI updates and calendar reposition)
    await fetchFullyBookedDates();
    await fetchCalendarCounts();
    if (cancelEmail && cancelEmail.toLowerCase() === email.toLowerCase()) {
      await loadMyBookings();
    }
  };

<<<<<<< HEAD
  const loadMyBookings = async () => {
    setCancelMessage('');
    setMyBookings([]);

    if (!cancelEmail || !cancelPin) {
      setCancelMessage('Please enter your email and PIN.');
=======
  // ---------- cancel section ----------
  const loadMyBookings = async () => {
    setCancelMessage("");
    setMyBookings([]);

    if (!cancelEmail || !cancelPin) {
      setCancelMessage("Please enter your email and PIN.");
>>>>>>> 4c0d016 (UI updates and calendar reposition)
      return;
    }

    const { data, error } = await supabase
<<<<<<< HEAD
      .from('bookings')
      .select('id, booking_date, status')
      .eq('employee_email', cancelEmail)
      .eq('pin_code', cancelPin)
      .order('booking_date', { ascending: true });
=======
      .from("bookings")
      .select("id, booking_date, status")
      .eq("employee_email", cancelEmail)
      .eq("pin_code", cancelPin)
      .order("booking_date", { ascending: true });
>>>>>>> 4c0d016 (UI updates and calendar reposition)

    if (error) {
      console.error(error);
      setCancelMessage("Error loading your bookings.");
      return;
    }

<<<<<<< HEAD
    setMyBookings(data);
    if (data.length === 0) {
      setCancelMessage('No bookings found for this email and PIN.');
=======
    setMyBookings(data || []);
    if (!data || data.length === 0) {
      setCancelMessage("No bookings found for this email and PIN.");
>>>>>>> 4c0d016 (UI updates and calendar reposition)
    }
  };

  const cancelBookingById = async (id) => {
    setCancelMessage("");

    const { error } = await supabase.from("bookings").delete().eq("id", id);

    if (error) {
      console.error(error);
      setCancelMessage("Error cancelling booking.");
      return;
    }

    setCancelMessage("Booking cancelled ✅");

<<<<<<< HEAD
    // reload lists
    await loadMyBookings();
    await fetchFullyBookedDates();
    await fetchCalendarCounts();
  };

  // load bookings for a specific date (for popup)
  const loadBookingsForDate = async (dateStr) => {
    const { data, error } = await supabase
      .from('bookings')
      .select('employee_email')
      .eq('booking_date', dateStr);

    if (error) {
      console.error(error);
      setPopupBookings([]);
      return;
    }

    setPopupBookings(data || []);
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

              const dateStrForClick = formatYMD(
                calendarYear,
                calendarMonth,
                cell.day
              );

              return (
                <div
                  key={key}
                  onClick={() => {
                    setPopupDate(dateStrForClick);
                    loadBookingsForDate(dateStrForClick);
                  }}
                  style={{
                    border: '1px solid #eee',
                    minHeight: '40px',
                    padding: '2px',
                    textAlign: 'center',
                    cursor: 'pointer',
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
=======
    await loadMyBookings();
    await fetchFullyBookedDates();
    await fetchCalendarCounts();
>>>>>>> 4c0d016 (UI updates and calendar reposition)
  };

  // ---------- calendar navigation ----------
  const goPrevMonth = () => {
    setCalendarMonth((prev) => {
      if (prev === 0) {
        setCalendarYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const goNextMonth = () => {
    setCalendarMonth((prev) => {
      if (prev === 11) {
        setCalendarYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  // ---------- render calendar ----------
  const renderCalendar = () => {
    const firstDay = new Date(calendarYear, calendarMonth, 1);
    const firstWeekday = firstDay.getDay(); // 0=Sun..6=Sat
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();

    const cells = [];

    // empty cells before day 1
    for (let i = 0; i < firstWeekday; i++) {
      cells.push(null);
    }

    // actual days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = formatYMD(calendarYear, calendarMonth, d);
      const count = calendarCounts[dateStr] || 0;
      cells.push({ day: d, dateStr, count });
    }

    const weeks = [];
    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, i + 7));
    }

    const monthName = firstDay.toLocaleString("default", { month: "long" });

    return (
      <div>
        {/* header with nav */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "8px",
          }}
        >
          <button
            type="button"
            onClick={goPrevMonth}
            style={{
              padding: "4px 8px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              cursor: "pointer",
            }}
          >
            ◀
          </button>
          <h4 style={{ margin: 0 }}>
            {monthName} {calendarYear}
          </h4>
          <button
            type="button"
            onClick={goNextMonth}
            style={{
              padding: "4px 8px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              cursor: "pointer",
            }}
          >
            ▶
          </button>
        </div>

        {/* weekday row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            textAlign: "center",
            fontWeight: "600",
            marginBottom: "6px",
            fontSize: "0.8rem",
          }}
        >
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        {/* calendar body */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: "4px",
            fontSize: "0.8rem",
          }}
        >
          {weeks.map((week, wi) =>
            week.map((cell, ci) => {
              const key = `${wi}-${ci}`;
              if (!cell) {
                return (
                  <div
                    key={key}
                    style={{
                      border: "1px solid #eee",
                      minHeight: "40px",
                    }}
                  />
                );
              }

              const dayDate = new Date(calendarYear, calendarMonth, cell.day);
              const weekday = dayDate.getDay(); // 0..6

              const isThuFriSat = weekday >= 4; // 4,5,6
              const color =
                isThuFriSat || cell.count === 3 ? "red" : "green";

              return (
                <div
                  key={key}
                  onClick={() => {
                    setPopupDate(cell.dateStr);
                    loadBookingsForDate(cell.dateStr);
                  }}
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    minHeight: "40px",
                    padding: "2px",
                    textAlign: "center",
                    cursor: "pointer",
                    backgroundColor: "#fff",
                  }}
                >
                  <div>{cell.day}</div>
                  <div style={{ marginTop: "2px", fontSize: "0.7rem", color }}>
                    {isThuFriSat ? (
                      <span style={{ fontWeight: "bold" }}>X</span>
                    ) : (
                      cell.count
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

  // ---------- UI ----------
  return (
<<<<<<< HEAD
    <>
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
=======
    <div
      style={{
        minHeight: "100vh",
        padding: "40px 0",
        paddingLeft: "56px", // move whole card 56px to the right
        fontFamily: "Arial, sans-serif",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
          width: "1300px",
          display: "grid",
          gridTemplateColumns: "2fr 1.3fr",
          gap: "48px",
          alignItems: "flex-start",
          backgroundColor: "rgba(255,255,255,0.92)",
          padding: "40px 50px",
          borderRadius: "18px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
        }}
      >
        {/* LEFT: booking + cancel */}
        <div style={{ maxWidth: "540px" }}>
          <h2
            style={{
              textAlign: "center",
              marginBottom: "24px",
              whiteSpace: "nowrap",
>>>>>>> 4c0d016 (UI updates and calendar reposition)
            }}
          >
            German Chamber Booking (Max 3 per Day)
          </h2>

<<<<<<< HEAD
          {/* Booking form */}
          <form onSubmit={handleBooking}>
            <div style={{ marginBottom: '12px' }}>
=======
          <form onSubmit={handleBooking}>
            <div style={{ marginBottom: "12px" }}>
>>>>>>> 4c0d016 (UI updates and calendar reposition)
              <label>Email (@sap.com)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value.trim())}
<<<<<<< HEAD
                style={{ width: '100%', padding: '8px', marginTop: '4px' }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
=======
                style={{
                  width: "100%",
                  padding: "10px",
                  marginTop: "4px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                }}
              />
            </div>

            <div style={{ marginBottom: "12px" }}>
>>>>>>> 4c0d016 (UI updates and calendar reposition)
              <label>Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
<<<<<<< HEAD
                style={{ width: '100%', padding: '8px', marginTop: '4px' }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
=======
                style={{
                  width: "100%",
                  padding: "10px",
                  marginTop: "4px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                }}
              />
            </div>

            <div style={{ marginBottom: "12px" }}>
>>>>>>> 4c0d016 (UI updates and calendar reposition)
              <label>Booking Date</label>
              <input
                key={tomorrowStr}
                type="date"
                value={date}
<<<<<<< HEAD
                min={tomorrowStr} // start from tomorrow
                onChange={(e) => setDate(e.target.value)}
                style={{ width: '100%', padding: '8px', marginTop: '4px' }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
=======
                min={tomorrowStr}
                onChange={(e) => setDate(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  marginTop: "4px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                }}
              />
            </div>

            <div style={{ marginBottom: "12px" }}>
>>>>>>> 4c0d016 (UI updates and calendar reposition)
              <label>PIN (4 digits)</label>
              <input
                type="password"
                value={pin}
<<<<<<< HEAD
                onChange={(e) => setPin(e.target.value)}
                maxLength={4}
                inputMode="numeric"
                style={{ width: '100%', padding: '8px', marginTop: '4px' }}
=======
                maxLength={4}
                inputMode="numeric"
                onChange={(e) => setPin(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  marginTop: "4px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                }}
>>>>>>> 4c0d016 (UI updates and calendar reposition)
              />
            </div>

            <button
<<<<<<< HEAD
              style={{
                padding: '10px 20px',
                cursor: 'pointer',
=======
              type="submit"
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: "#0a66c2",
                color: "#fff",
                cursor: "pointer",
>>>>>>> 4c0d016 (UI updates and calendar reposition)
              }}
            >
              Book
            </button>
          </form>

<<<<<<< HEAD
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
=======
          {message && (
            <p style={{ marginTop: "12px", color: "#333" }}>{message}</p>
          )}

          {/* fully booked list */}
          <div style={{ marginTop: "24px" }}>
            <strong>Fully booked dates (today & future):</strong>
            {fullyBookedDates.length === 0 ? (
              <p style={{ marginTop: "4px" }}>No fully booked days yet.</p>
            ) : (
              <ul style={{ marginTop: "4px" }}>
                {fullyBookedDates.map((d) => (
                  <li key={d}>{d}</li>
>>>>>>> 4c0d016 (UI updates and calendar reposition)
                ))}
              </ul>
            )}
          </div>

<<<<<<< HEAD
          <hr style={{ margin: '30px 0' }} />

          {/* Cancel section */}
          <h3>Cancel my booking</h3>

          <div style={{ marginBottom: '12px' }}>
=======
          <hr style={{ margin: "28px 0" }} />

          {/* cancel block */}
          <h3>Cancel my booking</h3>

          <div style={{ marginBottom: "12px" }}>
>>>>>>> 4c0d016 (UI updates and calendar reposition)
            <label>Your email (@sap.com)</label>
            <input
              type="email"
              value={cancelEmail}
              onChange={(e) => setCancelEmail(e.target.value.trim())}
<<<<<<< HEAD
              style={{ width: '100%', padding: '8px', marginTop: '4px' }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
=======
              style={{
                width: "100%",
                padding: "10px",
                marginTop: "4px",
                borderRadius: "8px",
                border: "1px solid #ccc",
              }}
            />
          </div>

          <div style={{ marginBottom: "12px" }}>
>>>>>>> 4c0d016 (UI updates and calendar reposition)
            <label>Your PIN (4 digits)</label>
            <input
              type="password"
              value={cancelPin}
              onChange={(e) => setCancelPin(e.target.value)}
              maxLength={4}
              inputMode="numeric"
<<<<<<< HEAD
              style={{ width: '100%', padding: '8px', marginTop: '4px' }}
=======
              style={{
                width: "100%",
                padding: "10px",
                marginTop: "4px",
                borderRadius: "8px",
                border: "1px solid #ccc",
              }}
>>>>>>> 4c0d016 (UI updates and calendar reposition)
            />
          </div>

          <button
            type="button"
            onClick={loadMyBookings}
            style={{
<<<<<<< HEAD
              padding: '8px 16px',
              marginBottom: '12px',
              cursor: 'pointer',
=======
              padding: "10px 20px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "#0a66c2",
              color: "#fff",
              cursor: "pointer",
>>>>>>> 4c0d016 (UI updates and calendar reposition)
            }}
          >
            Load my bookings
          </button>

          {myBookings.length > 0 && (
<<<<<<< HEAD
            <div style={{ marginBottom: '12px' }}>
              <strong>Your bookings:</strong>
              <ul style={{ marginTop: '6px', paddingLeft: '18px' }}>
                {myBookings.map((b) => (
                  <li key={b.id} style={{ marginBottom: '6px' }}>
=======
            <div style={{ marginTop: "12px" }}>
              <strong>Your bookings:</strong>
              <ul style={{ marginTop: "6px" }}>
                {myBookings.map((b) => (
                  <li key={b.id} style={{ marginBottom: "4px" }}>
>>>>>>> 4c0d016 (UI updates and calendar reposition)
                    {b.booking_date} — {b.status}
                    <button
                      type="button"
                      onClick={() => cancelBookingById(b.id)}
                      style={{
<<<<<<< HEAD
                        marginLeft: '8px',
                        padding: '4px 10px',
                        cursor: 'pointer',
=======
                        marginLeft: "8px",
                        padding: "4px 10px",
                        borderRadius: "6px",
                        border: "none",
                        cursor: "pointer",
                        backgroundColor: "#c53030",
                        color: "#fff",
>>>>>>> 4c0d016 (UI updates and calendar reposition)
                      }}
                    >
                      Cancel
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

<<<<<<< HEAD
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
=======
          {cancelMessage && (
            <p style={{ marginTop: "8px", color: "#333" }}>{cancelMessage}</p>
          )}
        </div>

        {/* RIGHT: calendar */}
        <div
          style={{
            width: "100%",
            borderRadius: "10px",
            border: "1px solid #ddd",
            padding: "16px",
            backgroundColor: "#fafafa",
            marginLeft: "-35px", // move calendar 35px left
            marginTop: "27px", // move calendar 27px down
>>>>>>> 4c0d016 (UI updates and calendar reposition)
          }}
        >
          {renderCalendar()}

          {/* Legend */}
<<<<<<< HEAD
          <div style={{ marginTop: '16px', fontSize: '0.9rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '6px',
              }}
            >
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

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '6px',
              }}
            >
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

      {/* Popup for date bookings */}
      {popupDate && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'white',
            padding: '20px',
            border: '2px solid #444',
            borderRadius: '8px',
            zIndex: 1000,
            minWidth: '300px',
          }}
        >
          <h3 style={{ marginTop: 0 }}>Bookings on {popupDate}</h3>

          {popupBookings.length === 0 ? (
            <p>No bookings for this date.</p>
          ) : (
            <ul>
              {popupBookings.map((b, index) => (
                <li key={index}>{b.employee_email}</li>
              ))}
            </ul>
          )}

          <button
            onClick={() => setPopupDate(null)}
            style={{
              marginTop: '12px',
              padding: '6px 12px',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      )}
    </>
=======
          <div style={{ marginTop: "16px", fontSize: "0.9rem" }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <div
                style={{
                  width: "14px",
                  height: "14px",
                  backgroundColor: "red",
                  marginRight: "6px",
                }}
              />
              <span>Fully Booked</span>
            </div>

            <div style={{ display: "flex", alignItems: "center" }}>
              <div
                style={{
                  width: "14px",
                  height: "14px",
                  backgroundColor: "green",
                  marginRight: "6px",
                }}
              />
              <span>Available Slot</span>
            </div>

            <div style={{ display: "flex", alignItems: "center" }}>
              <span
                style={{
                  color: "red",
                  fontWeight: "bold",
                  marginRight: "6px",
                }}
              >
                X
              </span>
              <span>Not Available</span>
            </div>
          </div>
        </div>
      </div>

      {/* popup with emails for clicked date */}
      {popupDate && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "#fff",
            border: "2px solid #444",
            borderRadius: "8px",
            padding: "20px",
            zIndex: 1000,
            minWidth: "280px",
          }}
        >
          <h3 style={{ marginTop: 0 }}>Bookings on {popupDate}</h3>

          {popupBookings.length === 0 ? (
            <p>No bookings for this date.</p>
          ) : (
            <ul>
              {popupBookings.map((b, i) => (
                <li key={i}>{b.employee_email}</li>
              ))}
            </ul>
          )}

          <button
            onClick={() => setPopupDate(null)}
            style={{
              marginTop: "12px",
              padding: "6px 12px",
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      )}
    </div>
>>>>>>> 4c0d016 (UI updates and calendar reposition)
  );
}

export default App;
