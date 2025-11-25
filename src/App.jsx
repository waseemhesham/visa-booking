import React, { useState, useEffect } from "react";
import { supabase } from "./db.js";

export default function App() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [pin, setPin] = useState("");

  const [cancelEmail, setCancelEmail] = useState("");
  const [cancelPin, setCancelPin] = useState("");
  const [userBookings, setUserBookings] = useState([]);
  const [showUserBookings, setShowUserBookings] = useState(false);

  const [fullyBookedDates, setFullyBookedDates] = useState([]);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [calendarBookings, setCalendarBookings] = useState({});
  const [selectedDayBookings, setSelectedDayBookings] = useState([]);

  // ------------------------------
  // CLEAN OLD BOOKINGS
  // ------------------------------
  useEffect(() => {
    const cleanOldBookings = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await supabase
        .from("bookings")
        .delete()
        .lt("booking_date", today.toISOString().split("T")[0]);
    };

    cleanOldBookings();
  }, []);

  // ------------------------------
  // LOAD FULLY-BOOKED DAYS & MONTH DATA
  // ------------------------------
  const loadCalendarData = async () => {
    const { data } = await supabase.from("bookings").select("*");

    // Build counts per day
    const counts = {};
    data.forEach((b) => {
      if (!counts[b.booking_date]) counts[b.booking_date] = 0;
      counts[b.booking_date]++;
    });

    setCalendarBookings(counts);

    // Filter fully booked (future only)
    const today = new Date().toISOString().split("T")[0];
    const full = Object.keys(counts).filter(
      (d) => counts[d] >= 3 && d >= today
    );
    setFullyBookedDates(full);
  };

  useEffect(() => {
    loadCalendarData();
  }, []);

  // ------------------------------
  // HANDLE BOOKING
  // ------------------------------
  const handleBooking = async () => {
    if (!email.endsWith("@sap.com")) {
      alert("Email must end with @sap.com");
      return;
    }

    if (pin.length !== 4) {
      alert("PIN must be 4 digits");
      return;
    }

    const today = new Date();
    const chosen = new Date(bookingDate);
    today.setHours(0, 0, 0, 0);

    if (chosen <= today) {
      alert("You cannot book today or a past day.");
      return;
    }

    // Check if user already has a booking
    const { data: existing } = await supabase
      .from("bookings")
      .select("*")
      .eq("employee_email", email);

    if (existing.length > 0) {
      alert("You already have a booking. Cancel it first.");
      return;
    }

    // Check slots
    const { data: dayBookings } = await supabase
      .from("bookings")
      .select("*")
      .eq("booking_date", bookingDate);

    if (dayBookings.length >= 3) {
      alert("This date is already fully booked.");
      return;
    }

    const { error } = await supabase.from("bookings").insert([
      {
        employee_email: email,
        employee_name: name,
        booking_date: bookingDate,
        pin: pin,
        created_at: new Date(),
      },
    ]);

    if (error) {
      alert("Error saving booking.");
    } else {
      alert("Booking confirmed!");
      loadCalendarData();
    }
  };

  // ------------------------------
  // LOAD USER BOOKINGS
  // ------------------------------
  const loadUserBookings = async () => {
    if (!cancelEmail.endsWith("@sap.com")) {
      alert("Email must be @sap.com");
      return;
    }

    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("employee_email", cancelEmail);

    if (error) {
      alert("Error loading your bookings.");
      return;
    }

    setUserBookings(data);
    setShowUserBookings(true);
  };

  // ------------------------------
  // CANCEL BOOKING
  // ------------------------------
  const cancelBooking = async (bookingId, bookingPin) => {
    if (bookingPin !== cancelPin) {
      alert("Incorrect PIN.");
      return;
    }

    await supabase.from("bookings").delete().eq("id", bookingId);

    alert("Booking cancelled.");
    setShowUserBookings(false);
    loadCalendarData();
  };

  // ------------------------------
  // CALENDAR HELPERS
  // ------------------------------
  const daysInMonth = (year, month) =>
    new Date(year, month + 1, 0).getDate();

  const handleDayClick = async (day) => {
    const dateStr = `${calendarMonth.getFullYear()}-${String(
      calendarMonth.getMonth() + 1
    ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    const { data } = await supabase
      .from("bookings")
      .select("employee_email")
      .eq("booking_date", dateStr);

    setSelectedDayBookings(data);
  };

  const monthName = calendarMonth.toLocaleString("en-US", {
    month: "long",
  });

  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();
  const totalDays = daysInMonth(year, month);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundImage: "url('/german-chamber-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        padding: "40px",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "1100px",
          background: "rgba(255,255,255,0.9)",
          padding: "40px",
          borderRadius: "18px",
          display: "flex",
          gap: "50px",
          marginLeft: "56px",
        }}
      >
        {/* LEFT PANEL */}
        <div style={{ flex: 1 }}>
          <h2>German Chamber Booking (Max 3 per Day)</h2>

          <label>Email (@sap.com)</label>
          <input
            style={{ width: "100%", padding: "10px" }}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <br /><br />
          <label>Name</label>
          <input
            style={{ width: "100%", padding: "10px" }}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <br /><br />
          <label>Booking Date</label>
          <input
            type="date"
            style={{ width: "100%", padding: "10px" }}
            value={bookingDate}
            onChange={(e) => setBookingDate(e.target.value)}
          />

          <br /><br />
          <label>PIN (4 digits)</label>
          <input
            style={{ width: "100%", padding: "10px" }}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
          />

          <br /><br />
          <button
            style={{
              padding: "10px 20px",
              background: "#0d6efd",
              color: "white",
              borderRadius: "6px",
              border: "none",
            }}
            onClick={handleBooking}
          >
            Book
          </button>

          <br /><br /><br />

          <h3>Fully booked dates (today & future):</h3>
          <ul>
            {fullyBookedDates.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>

          <hr />

          <h3>Cancel my booking</h3>
          <label>Your email (@sap.com)</label>
          <input
            style={{ width: "100%", padding: "10px" }}
            value={cancelEmail}
            onChange={(e) => setCancelEmail(e.target.value)}
          />

          <br /><br />
          <label>Your PIN (4 digits)</label>
          <input
            style={{ width: "100%", padding: "10px" }}
            value={cancelPin}
            onChange={(e) => setCancelPin(e.target.value)}
          />

          <br /><br />
          <button
            style={{
              padding: "10px 20px",
              background: "#0d6efd",
              color: "white",
              borderRadius: "6px",
              border: "none",
            }}
            onClick={loadUserBookings}
          >
            Load my bookings
          </button>

          {showUserBookings && (
            <>
              <h4>Your bookings:</h4>
              <ul>
                {userBookings.map((b) => (
                  <li key={b.id}>
                    {b.booking_date} – {b.employee_email}
                    <button
                      style={{
                        marginLeft: "10px",
                        padding: "5px 10px",
                        background: "red",
                        color: "white",
                        border: "none",
                        borderRadius: "5px",
                      }}
                      onClick={() => cancelBooking(b.id, b.pin)}
                    >
                      Cancel
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* RIGHT CALENDAR PANEL */}
        <div
          style={{
            width: "430px",
            background: "white",
            padding: "20px",
            borderRadius: "14px",
            marginLeft: "-15px",
            marginTop: "27px",
            border: "1px solid #ccc",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <button
              onClick={() =>
                setCalendarMonth(
                  new Date(year, month - 1, 1)
                )
              }
            >
              ◀
            </button>

            <strong>{monthName} {year}</strong>

            <button
              onClick={() =>
                setCalendarMonth(
                  new Date(year, month + 1, 1)
                )
              }
            >
              ▶
            </button>
          </div>

          {/* CALENDAR GRID */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              textAlign: "center",
              marginTop: "15px",
            }}
          >
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} style={{ fontWeight: "bold" }}>{d}</div>
            ))}

            {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => {
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const count = calendarBookings[dateStr] || 0;
              const dayObj = new Date(dateStr);
              const weekday = dayObj.getDay();

              let color = "green";
              if (weekday === 4 || weekday === 5 || weekday === 6) {
                color = "red";
              } else if (count >= 3) {
                color = "red";
              }

              return (
                <div
                  key={day}
                  onClick={() => handleDayClick(day)}
                  style={{
                    padding: "6px",
                    margin: "3px",
                    borderRadius: "6px",
                    background: "#f7f7f7",
                    cursor: "pointer",
                  }}
                >
                  <strong>{day}</strong>
                  <div style={{ color: color, marginTop: "3px" }}>
                    {weekday === 4 || weekday === 5 || weekday === 6 ? "X" : count}
                  </div>
                </div>
              );
            })}
          </div>

          {/* LEGENDS */}
          <div style={{ marginTop: "15px" }}>
            <div><span style={{ color: "red" }}>■</span> Fully Booked</div>
            <div><span style={{ color: "green" }}>■</span> Available Slot</div>
            <div><span style={{ color: "red" }}>X</span> Not Available</div>
          </div>

          {/* POPUP SELECTED DAY */}
          {selectedDayBookings.length > 0 && (
            <div
              style={{
                marginTop: "15px",
                padding: "10px",
                background: "#eef",
                borderRadius: "8px",
              }}
            >
              <strong>Booked emails:</strong>
              <ul>
                {selectedDayBookings.map((b, i) => (
                  <li key={i}>{b.employee_email}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
