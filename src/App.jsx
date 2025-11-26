import { useState, useEffect } from "react";
import { supabase } from "./db.js";

// ---------- helpers ----------
const formatYMD = (year, monthIndex, day) => {
  const m = String(monthIndex + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
};

const formatLocalDate = (dateObj) => {
  return formatYMD(
    dateObj.getFullYear(),
    dateObj.getMonth(),
    dateObj.getDate()
  );
};

// delete all past bookings (keep table clean)
const deletePastBookings = async () => {
  const today = new Date();
  const localToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
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
  const [myBookings, setMyBookings] = useState([]);
  const [cancelMessage, setCancelMessage] = useState("");

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
      today.getDate()
    );
    return formatLocalDate(t);
  })();

  // initial load
  useEffect(() => {
    const init = async () => {
      await deletePastBookings();
      await fetchFullyBookedDates();
      await fetchCalendarCounts();
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

    if (error) {
      console.error(error);
      return;
    }

    const counts = {};
    (data || []).forEach((row) => {
      counts[row.booking_date] = (counts[row.booking_date] || 0) + 1;
    });

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
      return;
    }

    await deletePastBookings();

    // one active booking per email
    const { count: emailCount, error: emailErr } = await supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("employee_email", email);

    if (emailErr) {
      console.error(emailErr);
      setMessage("Error checking existing bookings.");
      return;
    }

    if (emailCount && emailCount > 0) {
      setMessage("You already have an active booking. Cancel it first.");
      return;
    }

    // max 3 per day
    const { count: dayCount, error: dayErr } = await supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("booking_date", date);

    if (dayErr) {
      console.error(dayErr);
      setMessage("Error checking availability.");
      return;
    }

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
        pin_code: pin,
      },
    ]);

    if (insertErr) {
      console.error(insertErr);
      setMessage("Error saving booking.");
      return;
    }

    setMessage("Booking confirmed! 🎉");
    setEmail("");
    setName("");
    setDate("");
    setPin("");

    await fetchFullyBookedDates();
    await fetchCalendarCounts();
    if (cancelEmail && cancelEmail.toLowerCase() === email.toLowerCase()) {
      await loadMyBookings();
    }
  };

  // ---------- cancel section ----------
  const loadMyBookings = async () => {
    setCancelMessage("");
    setMyBookings([]);

    if (!cancelEmail || !cancelPin) {
      setCancelMessage("Please enter your email and PIN.");
      return;
    }

    const { data, error } = await supabase
      .from("bookings")
      .select("id, booking_date, status")
      .eq("employee_email", cancelEmail)
      .eq("pin_code", cancelPin)
      .order("booking_date", { ascending: true });

    if (error) {
      console.error(error);
      setCancelMessage("Error loading your bookings.");
      return;
    }

    setMyBookings(data || []);
    if (!data || data.length === 0) {
      setCancelMessage("No bookings found for this email and PIN.");
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

    await loadMyBookings();
    await fetchFullyBookedDates();
    await fetchCalendarCounts();
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
            }}
          >
            German Chamber Booking (Max 3 per Day)
          </h2>

          <form onSubmit={handleBooking}>
            <div style={{ marginBottom: "12px" }}>
              <label>Email (@sap.com)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value.trim())}
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
              <label>Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
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
              <label>Booking Date</label>
              <input
                key={tomorrowStr}
                type="date"
                value={date}
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
              <label>Enter any PIN (4 digits)</label>
              <input
                type="password"
                value={pin}
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
              />
            </div>

            <button
              type="submit"
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: "#0a66c2",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Book
            </button>
          </form>

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
                ))}
              </ul>
            )}
          </div>

          <hr style={{ margin: "28px 0" }} />

          {/* cancel block */}
          <h3>Cancel my booking</h3>

          <div style={{ marginBottom: "12px" }}>
            <label>Your email (@sap.com)</label>
            <input
              type="email"
              value={cancelEmail}
              onChange={(e) => setCancelEmail(e.target.value.trim())}
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
            <label>Your PIN (4 digits)</label>
            <input
              type="password"
              value={cancelPin}
              onChange={(e) => setCancelPin(e.target.value)}
              maxLength={4}
              inputMode="numeric"
              style={{
                width: "100%",
                padding: "10px",
                marginTop: "4px",
                borderRadius: "8px",
                border: "1px solid #ccc",
              }}
            />
          </div>

          <button
            type="button"
            onClick={loadMyBookings}
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "#0a66c2",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Load my bookings
          </button>

          {myBookings.length > 0 && (
            <div style={{ marginTop: "12px" }}>
              <strong>Your bookings:</strong>
              <ul style={{ marginTop: "6px" }}>
                {myBookings.map((b) => (
                  <li key={b.id} style={{ marginBottom: "4px" }}>
                    {b.booking_date} — {b.status}
                    <button
                      type="button"
                      onClick={() => cancelBookingById(b.id)}
                      style={{
                        marginLeft: "8px",
                        padding: "4px 10px",
                        borderRadius: "6px",
                        border: "none",
                        cursor: "pointer",
                        backgroundColor: "#c53030",
                        color: "#fff",
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
          }}
        >
          {renderCalendar()}

{/* Legend */}
<div
  style={{
    marginTop: "16px",
    fontSize: "0.9rem",
    display: "flex",
    gap: "32px",
    alignItems: "center",
  }}
>
  {/* Left column (existing legends) */}
  <div>
    <div style={{ display: "flex", alignItems: "center", marginBottom: "4px" }}>
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

    <div style={{ display: "flex", alignItems: "center", marginBottom: "4px" }}>
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

  {/* RIGHT column — sample day legend */}
  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
    <div
  style={{
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginLeft: "100px",   // 👈 move ONLY the sample legend right
  }}
></div>
    {/* Sample box */}
    <div
      style={{
        border: "1px solid #ccc",
        borderRadius: "6px",
        width: "40px",
        padding: "4px 0",
        backgroundColor: "#fff",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "0.8rem" }}>15</div>
      <div style={{ color: "green", fontSize: "0.75rem", marginTop: "2px" }}>
        1
      </div>
    </div>

    {/* Arrow labels */}
    <div style={{ fontSize: "0.75rem", lineHeight: "1.4" }}>
      <div>⬅ Day</div>
      <div>⬅ Number of Bookings</div>
    </div>
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
  );
}

export default App;
