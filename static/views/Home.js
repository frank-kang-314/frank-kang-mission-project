import AbstractView from "./AbstractView.js";
import { BASE_PATH } from "../js/config.js";

export default class extends AbstractView {
    constructor() {
        super();
        this.setTitle('CookCookCook - Home')
    }

    async getHtml() {
        const response = await fetch(`${BASE_PATH}/static/html/home.html`);
        return await response.text();
    }

    init() {
    if (!document.querySelector('link[href*="home.css"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = `${BASE_PATH}/static/css/home.css`;
        document.head.appendChild(link);
    }

    if (localStorage.getItem("loggedIn") === "true") {
        document.querySelectorAll(".hide-before-login").forEach(element =>
            element.classList.remove("hide-before-login")
        );
    }

    // ── State ──────────────────────────────────────────────
    let activeSide = null;       // "task" | "reminder"
    let selectedSort = null;
    let selectedDueDate = null;  // Date object
    let reminderEntries = [];    // [{ date, time }]
    let activeDueDateBubble = null; // which bubble opened due date
    let upcomingBlocks = [];     // populated from Google Calendar

    // ── Element refs ───────────────────────────────────────
    const chatboxSections   = document.querySelectorAll(".chatbox-section");
    const taskSection       = document.getElementById("add-task");
    const taskBackButton    = document.getElementById("back-task");
    const taskInputField    = document.getElementById("new-task");
    const taskBubbles       = document.getElementById("task-bubbles");

    const reminderSection      = document.getElementById("add-reminder");
    const reminderBackButton   = document.getElementById("back-reminder");
    const reminderInputField   = document.getElementById("new-reminder");
    const reminderBubbles      = document.getElementById("reminder-bubbles");

    const submitBtn = document.getElementById("submit-task");

    // Sort pop-up
    const popupSort       = document.getElementById("popup-sort");
    const sortClassesEl   = document.getElementById("sort-classes");
    const sortFoldersEl   = document.getElementById("sort-folders");
    const closeSortBtn    = document.getElementById("close-sort");
    const openAddFolder   = document.getElementById("open-add-folder");
    const popupAddFolder  = document.getElementById("popup-add-folder");
    const closeAddFolder  = document.getElementById("close-add-folder");
    const newFolderName   = document.getElementById("new-folder-name");
    const saveFolderBtn   = document.getElementById("save-folder");

    // Due date pop-up
    const popupDueDate    = document.getElementById("popup-due-date");
    const closeDueDateBtn = document.getElementById("close-due-date");
    const calMonthLabel   = document.getElementById("cal-month-label");
    const calGrid         = document.getElementById("calendar-grid");
    const calPrev         = document.getElementById("cal-prev");
    const calNext         = document.getElementById("cal-next");

    // Reminders pop-up
    const popupReminders      = document.getElementById("popup-reminders");
    const closeRemindersBtn   = document.getElementById("close-reminders");
    const addReminderEntryBtn = document.getElementById("add-reminder-entry");
    const remindersList       = document.getElementById("reminders-list");

    // ── Helpers ────────────────────────────────────────────
    function openPopup(popup) { popup.classList.add("open"); }
    function closePopup(popup) { popup.classList.remove("open"); }

    function resetAll() {
        chatboxSections.forEach(s => {
            s.classList.remove("expanded", "hidden");
            s.classList.add("split");
        });
        [taskBackButton, reminderBackButton].forEach(b => b.classList.remove("visible"));
        [taskInputField, reminderInputField].forEach(f => f.classList.remove("visible"));
        [taskBubbles, reminderBubbles].forEach(b => b.classList.remove("visible"));
        submitBtn.classList.remove("visible");
        activeSide = null;
        selectedSort = null;
        selectedDueDate = null;
        reminderEntries = [];
    }

    // ── Google Calendar: fetch upcoming blocks ─────────────
    async function fetchUpcomingBlocks() {
        try {
            const now = new Date();
            const future = new Date();
            future.setDate(future.getDate() + 60);
            const response = await gapi.client.calendar.events.list({
                calendarId: "primary",
                timeMin: now.toISOString(),
                timeMax: future.toISOString(),
                singleEvents: true,
                orderBy: "startTime",
                q: ":"
            });
            const items = response.result.items || [];
            // Match titles like "A: Math", "B: Science", etc.
            const blockRegex = /^[A-H]:\s+.+/i;
            upcomingBlocks = items.filter(e => blockRegex.test(e.summary));
        } catch (e) {
            console.warn("Could not fetch blocks:", e);
            upcomingBlocks = [];
        }
    }

    // ── Google Calendar: fetch class names for Sort ────────
    async function fetchClassesForSort() {
        try {
            const now = new Date();
            const future = new Date();
            future.setFullYear(future.getFullYear() + 1);
            const response = await gapi.client.calendar.events.list({
                calendarId: "primary",
                timeMin: now.toISOString(),
                timeMax: future.toISOString(),
                singleEvents: true,
                orderBy: "startTime",
            });
            const items = response.result.items || [];
            const blockRegex = /^([A-H]):\s+(.+)/i;
            const seen = new Set();
            const classes = [];
            items.forEach(e => {
                const m = e.summary && e.summary.match(blockRegex);
                if (m && !seen.has(m[1].toUpperCase())) {
                    seen.add(m[1].toUpperCase());
                    classes.push({ letter: m[1].toUpperCase(), name: m[2] });
                }
            });
            return classes;
        } catch (e) {
            console.warn("Could not fetch classes:", e);
            return [];
        }
    }

    // ── Google Sheets: ensure spreadsheet exists ───────────
    async function ensureSpreadsheet() {
        let spreadsheetId = localStorage.getItem("cccSpreadsheetId");
        if (spreadsheetId) {
            // Verify it still exists
            try {
                await gapi.client.sheets.spreadsheets.get({ spreadsheetId });
                return spreadsheetId;
            } catch {
                localStorage.removeItem("cccSpreadsheetId");
            }
        }

        // Search Drive for existing spreadsheet
        try {
            const searchRes = await gapi.client.drive.files.list({
                q: "name contains 'CookCookCook' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false",
                fields: "files(id, name)"
            });
            const files = searchRes.result.files || [];
            if (files.length > 0) {
                spreadsheetId = files[0].id;
                localStorage.setItem("cccSpreadsheetId", spreadsheetId);
                await ensureSheets(spreadsheetId);
                return spreadsheetId;
            }
        } catch (e) {
            console.warn("Drive search failed:", e);
        }

        // Create new spreadsheet
        const profile = JSON.parse(localStorage.getItem("userProfile") || "{}");
        const title = `CookCookCook - ${profile.name || "User"}`;
        const createRes = await gapi.client.sheets.spreadsheets.create({
            properties: { title },
            sheets: [
                { properties: { title: "Tasks & Reminders" } },
                { properties: { title: "Folders" } }
            ]
        });
        spreadsheetId = createRes.result.spreadsheetId;
        localStorage.setItem("cccSpreadsheetId", spreadsheetId);

        // Write headers
        await gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId,
            range: "Tasks & Reminders!A1:E1",
            valueInputOption: "RAW",
            resource: { values: [["Name", "Type", "Category", "Due Date", "Reminders"]] }
        });
        await gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId,
            range: "Folders!A1",
            valueInputOption: "RAW",
            resource: { values: [["Folder Name"]] }
        });

        return spreadsheetId;
    }

    async function ensureSheets(spreadsheetId) {
        const meta = await gapi.client.sheets.spreadsheets.get({ spreadsheetId });
        const sheetNames = meta.result.sheets.map(s => s.properties.title);
        const requests = [];
        if (!sheetNames.includes("Tasks & Reminders")) {
            requests.push({ addSheet: { properties: { title: "Tasks & Reminders" } } });
        }
        if (!sheetNames.includes("Folders")) {
            requests.push({ addSheet: { properties: { title: "Folders" } } });
        }
        if (requests.length > 0) {
            await gapi.client.sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                resource: { requests }
            });
        }
    }

    // ── Folders ────────────────────────────────────────────
    async function fetchFolders() {
        const spreadsheetId = await ensureSpreadsheet();
        try {
            const res = await gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId,
                range: "Folders!A2:A"
            });
            return (res.result.values || []).map(row => row[0]).filter(Boolean);
        } catch {
            return [];
        }
    }

    async function saveFolder(name) {
        const spreadsheetId = await ensureSpreadsheet();
        await gapi.client.sheets.spreadsheets.values.append({
            spreadsheetId,
            range: "Folders!A:A",
            valueInputOption: "RAW",
            resource: { values: [[name]] }
        });
    }

    // ── Sort pop-up logic ──────────────────────────────────
    async function openSortPopup() {
        openPopup(popupSort);
        sortClassesEl.innerHTML = "<em style='font-size:1.2cqw;color:#999'>Loading...</em>";
        sortFoldersEl.innerHTML = "<em style='font-size:1.2cqw;color:#999'>Loading...</em>";

        const [classes, folders] = await Promise.all([fetchClassesForSort(), fetchFolders()]);

        sortClassesEl.innerHTML = "";
        if (classes.length === 0) {
            sortClassesEl.innerHTML = "<em style='font-size:1.2cqw;color:#999'>No classes found</em>";
        } else {
            classes.forEach(cls => {
                const btn = document.createElement("button");
                btn.className = "sort-option-btn";
                btn.textContent = `${cls.letter}: ${cls.name}`;
                if (selectedSort === btn.textContent) btn.classList.add("selected");
                btn.addEventListener("click", () => {
                    document.querySelectorAll(".sort-option-btn").forEach(b => b.classList.remove("selected"));
                    btn.classList.add("selected");
                    selectedSort = btn.textContent;
                });
                sortClassesEl.appendChild(btn);
            });
        }

        sortFoldersEl.innerHTML = "";
        if (folders.length === 0) {
            sortFoldersEl.innerHTML = "<em style='font-size:1.2cqw;color:#999'>No folders yet</em>";
        } else {
            folders.forEach(folder => {
                const btn = document.createElement("button");
                btn.className = "sort-option-btn";
                btn.textContent = folder;
                if (selectedSort === folder) btn.classList.add("selected");
                btn.addEventListener("click", () => {
                    document.querySelectorAll(".sort-option-btn").forEach(b => b.classList.remove("selected"));
                    btn.classList.add("selected");
                    selectedSort = folder;
                });
                sortFoldersEl.appendChild(btn);
            });
        }
    }

    document.getElementById("bubble-sort").addEventListener("click", openSortPopup);
    closeSortBtn.addEventListener("click", () => closePopup(popupSort));

    openAddFolder.addEventListener("click", () => {
        closePopup(popupSort);
        openPopup(popupAddFolder);
    });
    closeAddFolder.addEventListener("click", () => {
        closePopup(popupAddFolder);
        openPopup(popupSort);
    });
    saveFolderBtn.addEventListener("click", async () => {
        const name = newFolderName.value.trim();
        if (!name) return;
        await saveFolder(name);
        newFolderName.value = "";
        closePopup(popupAddFolder);
        await openSortPopup();
    });

    // ── Calendar ───────────────────────────────────────────
    let calCurrentDate = new Date();

    function renderCalendar() {
        const year  = calCurrentDate.getFullYear();
        const month = calCurrentDate.getMonth();
        const monthNames = ["January","February","March","April","May","June",
                            "July","August","September","October","November","December"];
        calMonthLabel.textContent = `${monthNames[month]} ${year}`;

        calGrid.innerHTML = "";
        ["Su","Mo","Tu","We","Th","Fr","Sa"].forEach(d => {
            const h = document.createElement("div");
            h.className = "cal-day-header";
            h.textContent = d;
            calGrid.appendChild(h);
        });

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();

        for (let i = 0; i < firstDay; i++) {
            const empty = document.createElement("div");
            empty.className = "cal-day empty";
            calGrid.appendChild(empty);
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const cell = document.createElement("div");
            cell.className = "cal-day";
            cell.textContent = d;
            const cellDate = new Date(year, month, d);
            if (today.toDateString() === cellDate.toDateString()) cell.classList.add("today");
            if (selectedDueDate && selectedDueDate.toDateString() === cellDate.toDateString()) {
                cell.classList.add("selected");
            }
            cell.addEventListener("click", () => {
                selectedDueDate = cellDate;
                document.querySelectorAll(".cal-day").forEach(c => c.classList.remove("selected"));
                cell.classList.add("selected");
                document.querySelectorAll(".due-option").forEach(b => b.classList.remove("selected"));
            });
            calGrid.appendChild(cell);
        }
    }

    calPrev.addEventListener("click", () => {
        calCurrentDate.setMonth(calCurrentDate.getMonth() - 1);
        renderCalendar();
    });
    calNext.addEventListener("click", () => {
        calCurrentDate.setMonth(calCurrentDate.getMonth() + 1);
        renderCalendar();
    });

    // ── Due date pop-up logic ──────────────────────────────
    function openDueDatePopup(fromBubble) {
        activeDueDateBubble = fromBubble;
        renderCalendar();

        // Block-based options
        const hasBlocks = upcomingBlocks.length > 0;
        document.getElementById("due-next-block").disabled = !hasBlocks;
        document.getElementById("due-in-blocks").disabled  = !hasBlocks;
        document.getElementById("due-blocks-num").disabled = !hasBlocks;

        openPopup(popupDueDate);
    }

    document.getElementById("bubble-due-date-task").addEventListener("click", () => openDueDatePopup("task"));
    document.getElementById("bubble-due-date-reminder").addEventListener("click", () => openDueDatePopup("reminder"));
    closeDueDateBtn.addEventListener("click", () => closePopup(popupDueDate));

    function setDueDateFromToday(daysOffset) {
        const d = new Date();
        d.setDate(d.getDate() + daysOffset);
        selectedDueDate = d;
        renderCalendar();
        document.querySelectorAll(".due-option").forEach(b => b.classList.remove("selected"));
    }

    document.getElementById("due-today").addEventListener("click", () => {
        setDueDateFromToday(0);
        document.getElementById("due-today").classList.add("selected");
    });
    document.getElementById("due-tomorrow").addEventListener("click", () => {
        setDueDateFromToday(1);
        document.getElementById("due-tomorrow").classList.add("selected");
    });
    document.getElementById("due-next-week").addEventListener("click", () => {
        setDueDateFromToday(7);
        document.getElementById("due-next-week").classList.add("selected");
    });
    document.getElementById("due-in-days").addEventListener("click", () => {
        const n = parseInt(document.getElementById("due-days-num").value);
        if (n > 0) { setDueDateFromToday(n); document.getElementById("due-in-days").classList.add("selected"); }
    });
    document.getElementById("due-in-weeks").addEventListener("click", () => {
        const n = parseInt(document.getElementById("due-weeks-num").value);
        if (n > 0) { setDueDateFromToday(n * 7); document.getElementById("due-in-weeks").classList.add("selected"); }
    });
    document.getElementById("due-next-block").addEventListener("click", () => {
        if (upcomingBlocks.length > 0) {
            selectedDueDate = new Date(upcomingBlocks[0].start.dateTime || upcomingBlocks[0].start.date);
            renderCalendar();
            document.querySelectorAll(".due-option").forEach(b => b.classList.remove("selected"));
            document.getElementById("due-next-block").classList.add("selected");
        }
    });
    document.getElementById("due-in-blocks").addEventListener("click", () => {
        const n = parseInt(document.getElementById("due-blocks-num").value);
        if (n > 0 && upcomingBlocks[n - 1]) {
            selectedDueDate = new Date(upcomingBlocks[n - 1].start.dateTime || upcomingBlocks[n - 1].start.date);
            renderCalendar();
            document.querySelectorAll(".due-option").forEach(b => b.classList.remove("selected"));
            document.getElementById("due-in-blocks").classList.add("selected");
        }
    });

    // ── Reminders pop-up logic ─────────────────────────────
    function renderRemindersList() {
        remindersList.innerHTML = "";
        reminderEntries.forEach((entry, i) => {
            const div = document.createElement("div");
            div.className = "reminder-entry";
            div.innerHTML = `
                <div class="reminder-entry-left">
                    <input type="date" class="reminder-date-input" value="${entry.date}" data-i="${i}"/>
                    <input type="time" class="reminder-time-input" value="${entry.time}" data-i="${i}"/>
                </div>
                <button class="reminder-delete" data-i="${i}">✕</button>
            `;
            div.querySelector(".reminder-date-input").addEventListener("change", e => {
                reminderEntries[e.target.dataset.i].date = e.target.value;
            });
            div.querySelector(".reminder-time-input").addEventListener("change", e => {
                reminderEntries[e.target.dataset.i].time = e.target.value;
            });
            div.querySelector(".reminder-delete").addEventListener("click", e => {
                reminderEntries.splice(parseInt(e.target.dataset.i), 1);
                renderRemindersList();
            });
            remindersList.appendChild(div);
        });
    }

    addReminderEntryBtn.addEventListener("click", () => {
        const today = new Date().toISOString().split("T")[0];
        reminderEntries.push({ date: today, time: "08:00" });
        renderRemindersList();
    });

    document.getElementById("bubble-reminders-task").addEventListener("click", () => {
        renderRemindersList();
        openPopup(popupReminders);
    });
    document.getElementById("bubble-reminders-reminder").addEventListener("click", () => {
        renderRemindersList();
        openPopup(popupReminders);
    });
    closeRemindersBtn.addEventListener("click", () => closePopup(popupReminders));

    // ── Expand/collapse chatbox sections ───────────────────
    chatboxSections.forEach(chatboxSection => {
        chatboxSection.addEventListener("click", () => {
            chatboxSections.forEach(s => {
                if (s === chatboxSection) {
                    s.classList.replace("split", "expanded");
                } else {
                    s.classList.replace("split", "hidden");
                }
            });

            setTimeout(async () => {
                if (taskSection.classList.contains("expanded")) {
                    activeSide = "task";
                    taskBackButton.classList.add("visible");
                    taskInputField.classList.add("visible");
                    taskBubbles.classList.add("visible");
                    submitBtn.classList.add("visible");
                    await fetchUpcomingBlocks();
                } else if (reminderSection.classList.contains("expanded")) {
                    activeSide = "reminder";
                    reminderBackButton.classList.add("visible");
                    reminderInputField.classList.add("visible");
                    reminderBubbles.classList.add("visible");
                    submitBtn.classList.add("visible");
                    await fetchUpcomingBlocks();
                }
            }, 300);
        });
    });

    // ── Back buttons ───────────────────────────────────────
    const backButtons = document.querySelectorAll(".back-button");
    backButtons.forEach(backButton => {
        backButton.addEventListener("click", (e) => {
            e.stopPropagation();
            setTimeout(() => resetAll(), 300);
        });
    });

    // ── Submit ─────────────────────────────────────────────
    submitBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const isTask     = activeSide === "task";
        const inputField = isTask ? taskInputField : reminderInputField;
        const name       = inputField.value.trim();
        if (!name) return;

        const type        = isTask ? "Task" : "Reminder";
        const category    = selectedSort || "";
        const dueDateStr  = selectedDueDate ? selectedDueDate.toISOString().split("T")[0] : "";
        const remindersStr = reminderEntries.map(r => `${r.date} ${r.time}`).join("; ");

        try {
            const spreadsheetId = await ensureSpreadsheet();

            // Write to Sheets
            await gapi.client.sheets.spreadsheets.values.append({
                spreadsheetId,
                range: "Tasks & Reminders!A:E",
                valueInputOption: "RAW",
                resource: { values: [[name, type, category, dueDateStr, remindersStr]] }
            });

            // Create Google Calendar event
            const eventDate = selectedDueDate || new Date();
            const event = {
                summary: name,
                start: { date: eventDate.toISOString().split("T")[0] },
                end:   { date: eventDate.toISOString().split("T")[0] },
                reminders: {
                    useDefault: false,
                    overrides: reminderEntries.map(r => {
                        const reminderTime  = new Date(`${r.date}T${r.time}`);
                        const minutesBefore = Math.round((eventDate - reminderTime) / 60000);
                        return { method: "popup", minutes: Math.max(0, minutesBefore) };
                    })
                }
            };
            await gapi.client.calendar.events.insert({ calendarId: "primary", resource: event });

            // Flash green success
            const box = document.querySelector(".add-task-or-reminder");
            box.classList.add("flash-success");
            box.addEventListener("animationend", () => {
                box.classList.remove("flash-success");
                resetAll();
            }, { once: true });

        } catch (err) {
            console.error("Submit failed:", err);
            alert("Something went wrong. Check the console.");
        }
    });

    // ── Init: preload spreadsheet in background ────────────
    ensureSpreadsheet().catch(console.warn);
    }
}