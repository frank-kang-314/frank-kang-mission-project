import AbstractView from "./AbstractView.js";
import { BASE_PATH } from "../js/config.js";

export default class extends AbstractView {
    constructor() {
        super();
        this.setTitle('CookCookCook - Calendar');
    }

    async getHtml() {
        const response = await fetch(`${BASE_PATH}/static/html/calendar.html`);
        return await response.text();
    }

    init() {
        if (!document.querySelector('link[href*="calendar.css"]')) {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = `${BASE_PATH}/static/css/calendar.css`;
            document.head.appendChild(link);
        }

        // ── State ──────────────────────────────────────────
        let currentDate  = new Date();
        let appTasksOnly = false;
        let gcalEvents   = [];   // fetched from Google Calendar
        let appTasks     = [];   // fetched from Sheets

        // ── Element refs ───────────────────────────────────
        const calGrid       = document.getElementById("calendar-grid");
        const monthLabel    = document.getElementById("cal-month-label");
        const prevBtn       = document.getElementById("cal-prev");
        const nextBtn       = document.getElementById("cal-next");
        const toggle        = document.getElementById("cal-toggle");
        const popupDay      = document.getElementById("popup-day");
        const popupDayTitle = document.getElementById("popup-day-title");
        const popupDayEvts  = document.getElementById("popup-day-events");
        const closeDayPopup = document.getElementById("close-day-popup");

        // ── Helpers ────────────────────────────────────────
        const monthNames = [
            "January","February","March","April","May","June",
            "July","August","September","October","November","December"
        ];

        function isSameDay(a, b) {
            return a.getFullYear() === b.getFullYear() &&
                   a.getMonth()    === b.getMonth()    &&
                   a.getDate()     === b.getDate();
        }

        function formatTime(dateStr) {
            if (!dateStr) return null;
            // dateTime format: "2025-04-15T09:30:00-05:00"
            const d = new Date(dateStr);
            if (isNaN(d)) return null;
            return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
        }

        // ── Fetch Google Calendar events for visible month ─
        async function fetchGcalEvents(year, month) {
            const start = new Date(year, month, 1).toISOString();
            const end   = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
            try {
                const res = await gapi.client.calendar.events.list({
                    calendarId: "primary",
                    timeMin: start,
                    timeMax: end,
                    singleEvents: true,
                    orderBy: "startTime",
                    maxResults: 250
                });
                return res.result.items || [];
            } catch (e) {
                console.warn("Could not fetch calendar events:", e);
                return [];
            }
        }

        // ── Fetch app tasks from Sheets ────────────────────
        async function fetchAppTasks() {
            const spreadsheetId = localStorage.getItem("cccSpreadsheetId");
            if (!spreadsheetId) return [];
            try {
                const res = await gapi.client.sheets.spreadsheets.values.get({
                    spreadsheetId,
                    range: "Tasks & Reminders!A2:E"
                });
                const rows = res.result.values || [];
                // columns: Name, Type, Category, Due Date, Reminders
                return rows.map(row => ({
                    name:    row[0] || "",
                    type:    row[1] || "",
                    category:row[2] || "",
                    dueDate: row[3] || "",  // "YYYY-MM-DD"
                    reminders: row[4] || ""
                })).filter(t => t.dueDate);
            } catch (e) {
                console.warn("Could not fetch app tasks:", e);
                return [];
            }
        }

        // ── Get events for a specific day ──────────────────
        function getEventsForDay(date) {
            if (appTasksOnly) {
                return appTasks
                    .filter(t => {
                        const d = new Date(t.dueDate + "T00:00:00");
                        return isSameDay(d, date);
                    })
                    .map(t => ({ title: t.name, time: null, isAppTask: true }));
            } else {
                return gcalEvents
                    .filter(e => {
                        const dateStr = e.start.dateTime || e.start.date;
                        const d = new Date(dateStr);
                        return isSameDay(d, date);
                    })
                    .map(e => ({
                        title: e.summary || "(No title)",
                        time: e.start.dateTime ? formatTime(e.start.dateTime) : "All day",
                        isAppTask: false
                    }));
            }
        }

        // ── Render the calendar grid ───────────────────────
        function renderCalendar() {
            const year  = currentDate.getFullYear();
            const month = currentDate.getMonth();
            monthLabel.textContent = `${monthNames[month]} ${year}`;

            calGrid.innerHTML = "";

            const firstDay    = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const today       = new Date();

            // Empty cells before first day
            for (let i = 0; i < firstDay; i++) {
                const empty = document.createElement("div");
                empty.className = "cal-cell empty";
                calGrid.appendChild(empty);
            }

            for (let d = 1; d <= daysInMonth; d++) {
                const cellDate = new Date(year, month, d);
                const events   = getEventsForDay(cellDate);

                const cell = document.createElement("div");
                cell.className = "cal-cell";
                if (isSameDay(cellDate, today)) cell.classList.add("today");

                const dateEl = document.createElement("div");
                dateEl.className = "cal-date";
                dateEl.textContent = d;
                cell.appendChild(dateEl);

                // Show up to 3 event pills
                const visible = events.slice(0, 3);
                visible.forEach(evt => {
                    const pill = document.createElement("div");
                    pill.className = "cal-event-pill" + (evt.isAppTask ? " app-task" : "");
                    pill.textContent = evt.title;
                    cell.appendChild(pill);
                });

                if (events.length > 3) {
                    const more = document.createElement("div");
                    more.className = "cal-overflow";
                    more.textContent = `+${events.length - 3} more`;
                    cell.appendChild(more);
                }

                // Click to open day pop-up
                cell.addEventListener("click", () => openDayPopup(cellDate, events));
                calGrid.appendChild(cell);
            }
        }

        // ── Day pop-up ─────────────────────────────────────
        function openDayPopup(date, events) {
            const label = `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
            popupDayTitle.textContent = label;
            popupDayEvts.innerHTML = "";

            if (events.length === 0) {
                const empty = document.createElement("div");
                empty.className = "day-event-empty";
                empty.textContent = "No events for this day.";
                popupDayEvts.appendChild(empty);
            } else {
                events.forEach(evt => {
                    const row = document.createElement("div");
                    row.className = "day-event-row";
                    row.innerHTML = `
                        <span class="day-event-title">${evt.title}</span>
                        ${evt.time ? `<span class="day-event-time">${evt.time}</span>` : ""}
                    `;
                    popupDayEvts.appendChild(row);
                });
            }

            popupDay.classList.add("open");
        }

        closeDayPopup.addEventListener("click", () => popupDay.classList.remove("open"));
        popupDay.addEventListener("click", (e) => {
            if (e.target === popupDay) popupDay.classList.remove("open");
        });

        // ── Load data and render ───────────────────────────
        async function loadAndRender() {
            calGrid.innerHTML = "<div style='grid-column:1/-1;text-align:center;padding:4vh;color:#aaa;font-size:1.5cqw'>Loading...</div>";
            const year  = currentDate.getFullYear();
            const month = currentDate.getMonth();

            if (appTasksOnly) {
                appTasks = await fetchAppTasks();
            } else {
                gcalEvents = await fetchGcalEvents(year, month);
            }

            renderCalendar();
        }

        // ── Navigation ─────────────────────────────────────
        prevBtn.addEventListener("click", () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            loadAndRender();
        });

        nextBtn.addEventListener("click", () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            loadAndRender();
        });

        // ── Toggle ─────────────────────────────────────────
        toggle.addEventListener("change", () => {
            appTasksOnly = toggle.checked;
            loadAndRender();
        });

        // ── Initial load ───────────────────────────────────
        loadAndRender();
    }
}