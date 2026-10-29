// DOC GEN portfolio demo. The real app (SOFTWARE/DOC GEN) reads a student's record copied from the school portal and
// fills the official Word template on the server. Here the same pages run on their own: clicking a "copied" box stands
// in for the portal copy, and Generate shows the filled document on the page instead of downloading it.
// The student is made up; the registrar's name is left out.
(function () {
  const TOOLS = [
    ["grades", "Certification of Grades", "Subjects with final grades, units and weighted average per term.", "linear-gradient(135deg, #3b82f6, #0ea5e9)"],
    ["transcript", "Official Transcript of Records", "Fills the OTR (Word) for the pre-printed transcript paper: every term's grades, header and signatories.", "linear-gradient(135deg, #0ea5e9, #f59e0b)"],
    ["enrollment", "Certification of Enrollment", "Subjects with units per term. No grades.", "linear-gradient(135deg, #3b82f6, #d946ef)"],
    ["grades_enrollment", "Certification of Grades & Enrollment", "Graded terms with weighted average, current term marked IP.", "linear-gradient(135deg, #3b82f6, #d946ef, #0ea5e9)"],
    ["graduation", "Certification of Graduation", "Degree, graduation date and CHED Special Order. No record to paste.", "linear-gradient(135deg, #0ea5e9, #10b981)"],
    ["gwa", "Certification of GWA", "Paste every term's grades; the overall GWA is computed and certified.", "linear-gradient(135deg, #10b981, #3b82f6)"],
    ["pending_id", "Certification of Enrollment with Pending ID", "Currently enrolled, student ID card not yet issued. No record to paste.", "linear-gradient(135deg, #d946ef, #f59e0b)"],
    ["cmi", "Certification of Medium of Instruction", "CCDC teaches in English. Graduate or current-student version. No record to paste.", "linear-gradient(135deg, #0ea5e9, #d946ef)"],
    ["pce", "Permit to Cross-Enroll", "Letter to another school's registrar listing the subjects the student may take there.", "linear-gradient(135deg, #f59e0b, #10b981)"],
    ["transfer", "Transfer Credential", "Honorable Dismissal and the Transfer Credentials for the accepting school.", "linear-gradient(135deg, #f59e0b, #3b82f6)"],
    ["otr", "Request for OTR", "Letter asking another school to send the Official Transcript of Records of one or more transferees.", "linear-gradient(135deg, #10b981, #d946ef)"],
  ];

  // Inside the portfolio's tablet this page sits in a 3D-transformed frame, where Chrome won't scroll on the wheel
  // and Esc wouldn't reach the scene: handle both here.
  if (window !== window.top) {
    addEventListener("wheel", (e) => {
      if (e.ctrlKey) return;
      e.preventDefault();
      const dy = e.deltaY * (e.deltaMode === 1 ? 40 : 1);
      for (let el = e.target; el && el !== document.documentElement; el = el.parentElement) {
        if (/auto|scroll/.test(getComputedStyle(el).overflowY) && el.scrollHeight > el.clientHeight) return el.scrollBy(0, dy);
      }
      scrollBy(0, dy);
    }, { passive: false });
    addEventListener("keydown", (e) => {
      if (e.key === "Escape") parent.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });
  }
  document.querySelectorAll("[data-helper]").forEach((a) => a.addEventListener("click", (e) => {
    e.preventDefault();
    alert("The one-click helper is a bookmark for the school portal: one click copies the student's info and grades for DOC GEN.");
  }));

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

  // ---- Home ----
  const tiles = document.getElementById("tiles");
  if (tiles) {
    tiles.innerHTML = TOOLS.map(([id, title, desc, color]) => `
      <a class="tile${id === "transcript" ? " tile-under-first" : ""}" href="tool.html?id=${id}" style="--grad: ${color}">
        <span class="tile-line"></span>
        <div class="tile-icon"><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h6M9 9h2"/></svg></div>
        <h2>${title}</h2><p>${desc}</p><span class="tile-go">Open tool →</span>
      </a>`).join("");
    const greetings = [
      "Good day, registrar extraordinaire!", "Welcome back, keeper of the transcripts.", "Another day, another bona fide student.",
      "May your weighted averages always round up.", "Coffee first. Certificates second.", "Paste it, click it, print it. Easy.",
      "No erasures, no alterations, no problem.", "Ready when you are, chief.", "Making paperwork slightly less paperworky.",
      "Your GWA is safe with me.", "Not all heroes wear capes. Some wear lanyards.",
    ];
    const el = document.getElementById("greeting");
    let i = 0;
    setInterval(() => {
      el.style.opacity = 0;
      setTimeout(() => { el.textContent = greetings[(i = (i + 1) % greetings.length)]; el.style.opacity = 1; }, 400);
    }, 5000);
    return;
  }

  // ---- Tool page ----
  const id = new URLSearchParams(location.search).get("id") || "grades";
  const tool = TOOLS.find((t) => t[0] === id) || TOOLS[0];
  const head = document.getElementById("head");
  head.style.setProperty("--grad", tool[3]);
  head.querySelector("h1").textContent = tool[1];
  head.querySelector("p").textContent = tool[2];
  document.title = `${tool[1]} · CCDC`;

  // Sample student (made up), as the portal copy would give it
  const S = { last: "SANTOS", first: "MARIA", middle: "Clara", sex: "F", program: "Bachelor of Science in Information Technology", short: "BSIT", year: "third", idNo: "2024-00417" };
  const T = (label, sy, short, order, rows) => ({ label, sy, short, order, rows });
  const TERMS = [
    T("FIRST SEMESTER, SY 2024-2025", "2024-2025", "1st Semester", 1, [["GE 1", "Understanding the Self", 88, 3], ["GE 2", "Readings in Philippine History", 90, 3], ["IT 101", "Introduction to Computing", 92, 3], ["IT 102", "Computer Programming 1", 89, 3], ["NSTP 1", "National Service Training Program 1", 93, 3], ["PE 1", "Movement Enhancement", 95, 2]]),
    T("SECOND SEMESTER, SY 2024-2025", "2024-2025", "2nd Semester", 2, [["GE 3", "The Contemporary World", 87, 3], ["GE 4", "Mathematics in the Modern World", 85, 3], ["IT 103", "Computer Programming 2", 91, 3], ["IT 104", "Discrete Mathematics", 86, 3], ["NSTP 2", "National Service Training Program 2", 94, 3], ["PE 2", "Fitness Exercises", 96, 2]]),
    T("SHORT TERM, 2025", "2024-2025", "Short Term", 4, [["GE 5", "Purposive Communication", 90, 3]]),
    T("FIRST SEMESTER, SY 2025-2026", "2025-2026", "1st Semester", 1, [["IT 201", "Data Structures and Algorithms", 88, 3], ["IT 202", "Information Management", 91, 3], ["IT 203", "Networking 1", 87, 3], ["GE 6", "Art Appreciation", 92, 3], ["PE 3", "Individual and Dual Sports", 94, 2]]),
    T("SECOND SEMESTER, SY 2025-2026", "2025-2026", "2nd Semester", 2, [["IT 204", "Object-Oriented Programming", 93, 3], ["IT 205", "Web Systems and Technologies", 95, 3], ["IT 206", "Networking 2", 88, 3], ["GE 7", "Science, Technology and Society", 89, 3], ["PE 4", "Team Sports", 95, 2]]),
    T("FIRST SEMESTER, SY 2026-2027", "2026-2027", "1st Semester", 1, [["IT 301", "Systems Integration and Architecture", null, 3], ["IT 302", "Information Assurance and Security", null, 3], ["IT 303", "Mobile Application Development", null, 3], ["IT 304", "Quantitative Methods", null, 3], ["GE 8", "Ethics", null, 3]]),
  ];
  const graded = TERMS.filter((t) => t.rows[0][2] != null);

  const today = new Date();
  const iso = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const field = (label, inner, cls = "field") => `<label class="${cls}"><span>${label}</span>${inner}</label>`;
  const seg = (label, name, opts) => `<div class="field"><span>${label}</span><div class="seg">${opts.map(([v, l], i) => `<label><input type="radio" name="${name}" value="${v}"${i ? "" : " checked"}> ${l}</label>`).join("")}</div></div>`;
  const sel = (name, opts, pick) => `<select name="${name}">${opts.map((o) => `<option${o === pick ? " selected" : ""}>${o}</option>`).join("")}</select>`;
  const SEMS = ["First Semester", "Second Semester", "Short Term"];
  const SCHOOLS = `<datalist id="schools"><option value="Saint Louis University"><option value="University of the Cordilleras"><option value="Benguet State University"></datalist>`;
  const usesGrades = ["grades", "enrollment", "grades_enrollment", "gwa", "transcript", "transfer"].includes(id);
  const picksTerms = ["grades", "enrollment", "grades_enrollment", "gwa"].includes(id);
  const editedBy = field("Edited by", `<input type="text" name="initials" value="wvb" maxlength="6" required>`);
  const issue = `<div class="grid2">${field("Issue date", `<input type="date" name="date" value="${iso}">`)}${editedBy}</div>`;

  let body = "";
  if (usesGrades) {
    body += `<div class="field"><div class="copied-row">
        <div class="copied" id="c-info" tabindex="0"><b>Student info</b><small>Waiting for the portal copy</small></div>
        <div class="copied" id="c-grades" tabindex="0"><b>Transcript &amp; grades</b><small>Waiting for the portal copy</small></div>
      </div><p class="copied-hint demo-hint">Demo: click each box to copy the sample student from the school portal.</p></div>`;
    if (picksTerms) body += `<div class="field" id="term-pick" hidden><span>Terms to include</span>
        <div class="term-range"><label>From SY <select id="sy-from"></select></label><label>to <select id="sy-to"></select></label>
        <button type="button" class="chip-btn" data-pick="all">All years</button></div>
        <div id="term-years" class="term-years"></div></div>`;
    if (id === "transcript" || id === "transfer") {
      body += `<div class="grid3">${field("Date admitted <em>(from the first term)</em>", `<input type="text" name="date_admitted" value="August 2024">`)}
        ${field(id === "transfer" ? "Credentials submitted" : "Admission credentials", `<input type="text" name="admission_credentials" placeholder="Form 138">`)}
        ${field("Admission status", `<input type="text" name="admission_status" placeholder="HS Graduate / Transferee">`)}</div>
        <label class="field narrow"><span>NSTP serial number</span><input type="text" name="nstp_serial" placeholder="C-2141515-314"></label>`;
    }
    if (id === "transcript") {
      body += `<div class="grid2">${field("Remarks", sel("remarks", ["Issued for Board Examination", "Issued for General Purposes", "Issued for Employment"], "Issued for General Purposes"))}</div>
        <div class="grid3">${field("Date applied", `<input type="date" name="date" value="${iso}">`)}${field("Prepared by", `<input type="text" name="prepared_by" value="wvbanase">`)}${field("Checked by", `<input type="text" name="checked_by" placeholder="initials">`)}</div>
        ${field("Dean <em>(a new name is remembered)</em>", `<input type="text" name="dean" placeholder="Dean's name">`)}`;
    } else if (id === "transfer") {
      body += `<div class="grid2">${field("Date", `<input type="date" name="date" value="${iso}">`)}${editedBy}</div>`;
    } else body += issue;
  } else {
    body += `<div class="field" id="info-box"><div class="copied" id="c-info" tabindex="0"><b>Student info</b><small>Waiting for the portal copy</small></div>
      <p class="copied-hint demo-hint">Demo: click the box to copy the sample student from the school portal.</p></div>`;
    if (id === "graduation") {
      body += `<label class="field narrow"><span>Date of graduation <em>(remembered)</em></span><input type="date" name="grad_date" value="2026-06-20" required></label>
        <div class="grid3">${field("CHED S.O. No. <em>(remembered)</em>", `<input type="text" name="so_no" value="50-260415-123">`)}${field("Series", `<input type="text" name="so_series" value="2026">`)}${field("S.O. dated", `<input type="date" name="so_date" value="2026-07-15">`)}</div>${issue}`;
    } else if (id === "pending_id") {
      body += `<div class="grid2">${field("Semester", sel("semester", SEMS, "First Semester"))}${field("School year", `<input type="text" name="school_year" value="2026-2027">`)}</div>
        <div class="grid2">${field("As of", `<input type="date" name="as_of" value="${iso}">`)}${field("Issue date", `<input type="date" name="date" value="${iso}">`)}</div><div class="narrow-box">${editedBy}</div>`;
    } else if (id === "cmi") {
      body += seg("Requested by a", "cmi_status", [["graduate", "Graduate"], ["student", "Current student"]]) + issue;
    } else if (id === "pce" || id === "otr") {
      if (id === "otr") body = seg("Request for", "otr_mode", [["one", "One student"], ["many", "Multiple students"]]) + body;
      body += `<label class="field narrow"><span>Date</span><input type="date" name="date" value="${iso}"></label>
        ${field("School <em>(pick or type a new one)</em>", `<input type="text" name="school" list="schools" value="Saint Louis University">${SCHOOLS}`)}
        ${field("School address", `<input type="text" name="address" value="A. Bonifacio Street, Baguio City">`)}`;
      if (id === "pce") {
        body += `<div class="grid2">${field("Semester", sel("semester", SEMS, "First Semester"))}${field("School year", `<input type="text" name="school_year" value="2026-2027">`)}</div>
          <div class="field"><span>Subjects</span><div id="subjects" class="subjects">
            <div class="subj-head"><span>Course code</span><span>Course title</span><span>Units</span><span></span></div>
            ${[["FIL 2", "Filipino sa Iba't Ibang Disiplina", 3], ["RIZAL", "Life and Works of Rizal", 3]].map(subjRow).join("")}
          </div><button type="button" id="add-subject" class="btn-ghost">+ Add subject</button></div>`;
      } else {
        body += `<div class="grid2">${seg("Request", "request", [["1", "1st"], ["2", "2nd"], ["3", "3rd"]])}${seg("Urgent", "delivery", [["mail", "Mail it"], ["bearer", "Entrust to bearer"]])}</div>`;
      }
      body += `<div class="narrow-box">${editedBy}</div>`;
    }
  }
  function subjRow([code, title, units] = ["", "", ""]) {
    return `<div class="subj-row"><input type="text" data-f="code" value="${esc(code)}" placeholder="FIL 2"><input type="text" data-f="title" value="${esc(title)}" placeholder="Course title"><input type="text" data-f="units" value="${units}" placeholder="3"><button type="button" class="subj-del" aria-label="Remove subject">×</button></div>`;
  }

  const form = document.getElementById("form");
  form.innerHTML = body + `<div class="actions"><button type="submit" id="btn-generate" class="btn">Generate &amp; Download</button></div><div id="msg" class="msg" hidden></div>`;
  const msg = form.querySelector("#msg"), out = document.getElementById("out");

  // The "copied" boxes: the portal copy, simulated by a click
  const copied = { info: false, grades: false };
  const showCopy = (box, text) => { box.classList.add("on"); box.querySelector("small").textContent = text; };
  form.querySelectorAll(".copied").forEach((box) => {
    const go = () => {
      if (box.id === "c-info") {
        copied.info = true;
        showCopy(box, `${S.last}, ${S.first} ${S.middle} · ${S.short} · ${S.year[0].toUpperCase() + S.year.slice(1)} year · ${S.sex}`);
      } else {
        copied.grades = true;
        const list = id === "enrollment" || id === "grades_enrollment" ? TERMS : graded;
        showCopy(box, `${list.length} terms · ${list.reduce((n, t) => n + t.rows.length, 0)} subjects`);
        setupTerms();
      }
      msg.hidden = true;
    };
    box.addEventListener("click", go);
    box.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
  });

  // Term picker, as in the real app: SY span, then single terms toggled; a new record starts on its latest term only
  const pick = form.querySelector("#term-pick");
  let terms = [], sys = [];
  function setupTerms() {
    if (!pick) return;
    terms = (id === "enrollment" || id === "grades_enrollment" ? TERMS : graded).map((t) => ({ ...t, on: false }));
    sys = [...new Set(terms.map((t) => t.sy))];
    const from = form.querySelector("#sy-from"), to = form.querySelector("#sy-to");
    for (const s of [from, to]) s.innerHTML = sys.map((y) => `<option>${y}</option>`).join("");
    from.value = to.value = sys[sys.length - 1];
    terms[terms.length - 1].on = true;
    if (id === "gwa") terms.forEach((t) => { t.on = true; from.value = sys[0]; });
    const span = (e) => {
      if (from.value > to.value) (e.target === from ? to : from).value = e.target.value;
      terms.forEach((t) => { t.on = t.sy >= from.value && t.sy <= to.value; });
      draw();
    };
    from.onchange = to.onchange = span;
    form.querySelector("[data-pick=all]").onclick = () => { from.value = sys[0]; to.value = sys[sys.length - 1]; terms.forEach((t) => { t.on = true; }); draw(); };
    pick.hidden = false;
    draw();
    function draw() {
      const box = form.querySelector("#term-years");
      box.innerHTML = "";
      for (const sy of sys.filter((y) => y >= from.value && y <= to.value).reverse()) {
        const ts = terms.filter((t) => t.sy === sy).sort((a, b) => a.order - b.order);
        const row = document.createElement("div");
        row.className = "term-year";
        const yb = document.createElement("button");
        yb.type = "button";
        yb.className = "sy-btn" + (ts.every((t) => t.on) ? " on" : ts.some((t) => t.on) ? " part" : "");
        yb.textContent = sy;
        yb.onclick = () => { const on = !ts.every((t) => t.on); ts.forEach((t) => { t.on = on; }); draw(); };
        row.append(yb);
        for (const t of ts) {
          const c = document.createElement("button");
          c.type = "button";
          c.className = "term-chip" + (t.on ? " on" : "");
          c.textContent = t.short;
          c.title = `${t.label} · ${t.rows.length} subjects`;
          c.onclick = () => { t.on = !t.on; draw(); };
          row.append(c);
        }
        box.append(row);
      }
    }
  }

  // Permit to Cross-Enroll: subject rows
  const subjects = form.querySelector("#subjects");
  if (subjects) {
    form.querySelector("#add-subject").onclick = () => subjects.insertAdjacentHTML("beforeend", subjRow());
    subjects.addEventListener("click", (e) => { if (e.target.classList.contains("subj-del")) e.target.closest(".subj-row").remove(); });
  }

  // ---- Generate: the filled document, shown on the page ----
  const ord = (n) => n + (n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th");
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const longDate = (v) => { const d = v ? new Date(v + "T00:00") : today; return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`; };
  const issued = (v) => { const d = v ? new Date(v + "T00:00") : today; return `Issued this ${ord(d.getDate())} day of ${MONTHS[d.getMonth()]} ${d.getFullYear()} at Buyagan, Poblacion, La Trinidad, Benguet.`; };
  const who = `Ms. ${S.first} ${S.middle} ${S.last}`, she = "she", her = "her", short = "Ms. Santos";
  const avg = (rows) => { const u = rows.reduce((n, r) => n + r[3], 0); return u ? rows.reduce((n, r) => n + r[2] * r[3], 0) / u : 0; };
  const v = (name) => (form.elements[name] ? form.elements[name].value : "");
  const checked = (name) => (form.querySelector(`[name=${name}]:checked`) || {}).value;

  function termTable(list, mode) {
    let rows = "";
    for (const t of list) {
      rows += `<tr class="term"><td colspan="${mode === "units" ? 3 : 4}">${t.label}</td></tr>`;
      for (const r of t.rows) rows += mode === "units" ? `<tr><td>${r[0]}</td><td>${r[1]}</td><td class="n">${r[3]}</td></tr>`
        : `<tr><td>${r[0]}</td><td>${r[1]}</td><td class="n">${r[2] == null ? "IP" : r[2]}</td><td class="n">${r[3]}</td></tr>`;
      const done = t.rows.filter((r) => r[2] != null);
      if (mode === "grades" && done.length) rows += `<tr class="avg"><td></td><td>Weighted Average</td><td class="n">${avg(done).toFixed(2)}</td><td class="n">${done.reduce((n, r) => n + r[3], 0)}</td></tr>`;
    }
    const head = mode === "units" ? "<th>Course Code</th><th>Course Title</th><th class='n'>Units</th>" : "<th>Course Code</th><th>Course Title</th><th class='n'>Grades</th><th class='n'>Units</th>";
    return `<table class="doc-table"><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table><p class="end">*****End of the List*****</p>`;
  }

  function documentHtml() {
    const picked = terms.filter((t) => t.on);
    const lead = `This is to certify that <b>${who}</b> is a bona fide ${S.year} year student of Cordillera Career Development College (CCDC) under the ${S.program} program.`;
    const close = `This certification is being issued upon the request of ${short} for whatever legal purpose it may serve.`;
    let title = tool[1].replace(" & ", " and "), main = "";
    if (id === "grades") main = `<p>${lead} The following is the list of subjects ${she} officially enrolled with the corresponding final grades and units obtained during the indicated school term${picked.length > 1 ? "s" : ""}.</p>${termTable(picked, "grades")}<p>${close}</p>`;
    else if (id === "enrollment") main = `<p>${lead} The following is the list of subjects with the corresponding units ${she} officially enrolled during the indicated school term${picked.length > 1 ? "s" : ""}.</p>${termTable(picked, "units")}<p>${close}</p>`;
    else if (id === "grades_enrollment") main = `<p>${lead} The following is the list of subjects ${she} officially enrolled with the corresponding final grades and units. Subjects of the current term are marked IP (in progress).</p>${termTable(picked, "grades")}<p>${close}</p>`;
    else if (id === "gwa") {
      const rows = picked.flatMap((t) => t.rows);
      title = "Certification of General Weighted Average";
      main = `<p>${lead}</p><p>Based on ${her} academic records for the terms listed below, ${she} obtained a <b>General Weighted Average of ${avg(rows).toFixed(2)}</b> over ${rows.reduce((n, r) => n + r[3], 0)} units.</p>
        <table class="doc-table"><thead><tr><th>School term</th><th class="n">Weighted average</th><th class="n">Units</th></tr></thead><tbody>${picked.map((t) => `<tr><td>${t.label}</td><td class="n">${avg(t.rows).toFixed(2)}</td><td class="n">${t.rows.reduce((n, r) => n + r[3], 0)}</td></tr>`).join("")}</tbody></table><p>${close}</p>`;
    } else if (id === "graduation") main = `<p>This is to certify that <b>${who}</b> has satisfactorily completed all the academic requirements and graduated with the degree of <b>${S.program}</b> on ${longDate(v("grad_date"))} at Cordillera Career Development College (CCDC) per CHED Special Order No. ${esc(v("so_no"))}, Series of ${esc(v("so_series"))}, dated ${longDate(v("so_date"))}.</p><p>${close}</p>`;
    else if (id === "pending_id") { title = "Certification"; main = `<p>This is to certify that <b>${who}</b> is officially enrolled as a ${S.year} year student under the ${S.program} program for the ${esc(v("semester"))}, SY ${esc(v("school_year"))} as of ${longDate(v("as_of"))}.</p><p>This further certifies that ${her} student identification card is still being processed and has not yet been issued.</p><p>${close}</p>`; }
    else if (id === "cmi") { title = "Certification"; main = checked("cmi_status") === "student"
      ? `<p>${lead}</p><p>This further certifies that English is the medium of instruction used in all ${her} courses in this institution.</p><p>${close}</p>`
      : `<p>This is to certify that <b>${who}</b> graduated with the degree of ${S.program} at Cordillera Career Development College (CCDC).</p><p>This further certifies that English was the medium of instruction used in all ${her} courses in this institution.</p><p>${close}</p>`; }
    else if (id === "pce") {
      const rows = [...form.querySelectorAll(".subj-row")].map((r) => [...r.querySelectorAll("input")].map((i) => esc(i.value))).filter((r) => r[0]);
      main = `<p class="addr">The Registrar<br>${esc(v("school"))}<br>${esc(v("address"))}</p><p>Dear Sir/Madam:</p><p>This is to permit <b>${who}</b>, a ${S.year} year ${S.program} student of this institution, to cross-enroll in your institution the following subject${rows.length > 1 ? "s" : ""} during the ${esc(v("semester"))}, SY ${esc(v("school_year"))}:</p>
        <table class="doc-table"><thead><tr><th>Course Code</th><th>Course Title</th><th class="n">Units</th></tr></thead><tbody>${rows.map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td class="n">${r[2]}</td></tr>`).join("")}</tbody></table>
        <p>Kindly send ${her} grades to this office upon completion. Thank you.</p>`;
    } else if (id === "otr") {
      const n = { 1: "first", 2: "second", 3: "third" }[checked("request")];
      main = `<p class="addr">The Registrar<br>${esc(v("school"))}<br>${esc(v("address"))}</p><p>Dear Sir/Madam:</p><p>May we request the Official Transcript of Records of <b>${who}</b>, who is now enrolled in this institution under the ${S.program} program. This is our ${n} request.</p>
        <p>${checked("delivery") === "bearer" ? "The transcript may be entrusted to the bearer of this letter." : "Kindly send the transcript by mail to this office."} Thank you.</p>`;
    } else if (id === "transfer") {
      const last = graded[graded.length - 1];
      title = "Honorable Dismissal";
      main = `<p>This is to certify that <b>${who}</b>, a student of this institution under the ${S.program} program until the ${last.label.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()).replace("Sy", "SY")}, is hereby granted <b>honorable dismissal</b>. ${S.sex === "F" ? "She" : "He"} has no pending obligation or disciplinary case with this institution.</p><p>${her[0].toUpperCase() + her.slice(1)} Transfer Credentials will be sent directly to the accepting school upon its request.</p><p>${close}</p>`;
    } else if (id === "transcript") {
      main = `<table class="doc-meta"><tr><td>Name</td><td><b>${S.last}, ${S.first} ${S.middle}</b></td><td>ID number</td><td>${S.idNo}</td></tr>
        <tr><td>Program</td><td>${S.program}</td><td>Date admitted</td><td>${esc(v("date_admitted"))}</td></tr>
        <tr><td>Admission</td><td>${esc(v("admission_credentials") || "Form 138")}</td><td>Remarks</td><td>${esc(v("remarks")).toUpperCase()}</td></tr></table>${termTable(graded, "grades")}`;
    }
    return `<div class="doc">
      <div class="doc-head"><img src="logo.svg" alt=""><div><b>OFFICE OF THE REGISTRAR</b><small>2nd Floor, Saleng Building, CCDC</small><small>registrar@ccdc.edu.ph</small></div></div>
      <h3>${title}</h3>${main}
      ${id === "pce" || id === "otr" || id === "transcript" ? "" : `<p>${issued(v("date"))}</p>`}
      <div class="doc-sign"><b>[Registrar's name]</b><span>Registrar</span></div>
      <div class="doc-foot"><span>/${esc(v("initials") || "wvb")}</span><span>Not valid without official school dry seal</span></div>
      <p class="doc-note">Note: Any erasure or alteration voids this certification.</p></div>`;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const need = usesGrades ? !copied.info ? "Copy the student's info from the portal first." : !copied.grades ? "Copy the student's transcript & grades from the portal first." : ""
      : !copied.info ? "Copy the student's info from the portal first." : "";
    const none = pick && !need && !terms.some((t) => t.on) ? "Pick at least one term." : "";
    if (need || none) {
      msg.className = "msg error";
      msg.textContent = need || none;
      msg.hidden = false;
      out.innerHTML = "";
      return;
    }
    msg.className = "msg ok";
    msg.textContent = `Generated ${tool[1]} - ${S.last}, ${S.first}.docx. In the real app it downloads ready to print; here it's shown below.`;
    msg.hidden = false;
    out.innerHTML = documentHtml();
    out.scrollIntoView({ behavior: "smooth", block: "start" });
  });
})();
