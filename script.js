(function () {
  "use strict";

  var cfg = window.SITE_CONFIG || {};
  var STORAGE_KEY = "winterTableRSVP";
  var pageLoadedAt = Date.now();

  var form = document.getElementById("rsvp-form");
  var confirmation = document.getElementById("rsvp-confirmation");
  var confirmHeading = document.getElementById("confirm-heading");
  var confirmBody = document.getElementById("confirm-body");
  var editBtn = document.getElementById("edit-rsvp");
  var formErrorEl = document.getElementById("form-error");
  var submitBtn = form.querySelector(".btn-submit");
  var attendingOnlyRows = document.querySelectorAll(".attending-only");
  var noteEl = document.getElementById("note");
  var noteCount = document.getElementById("note-count");
  var guestsSelect = document.getElementById("guests");
  var plusOneRow = document.getElementById("plus-one-row");

  /* ---------------- Calendar links ---------------- */
  function buildCalendarLinks() {
    var start = cfg.EVENT_START, end = cfg.EVENT_END;
    if (!start || !end) return;
    var fmt = function (iso) {
      return new Date(iso).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    };
    var gcalUrl = "https://calendar.google.com/calendar/render?action=TEMPLATE" +
      "&text=" + encodeURIComponent(cfg.EVENT_TITLE || "Event") +
      "&dates=" + fmt(start) + "/" + fmt(end) +
      "&details=" + encodeURIComponent(cfg.EVENT_DESCRIPTION || "") +
      "&location=" + encodeURIComponent(cfg.EVENT_LOCATION || "");
    var gcalLink = document.getElementById("gcal-link");
    if (gcalLink) gcalLink.href = gcalUrl;

    var ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//La Table d'Hiver//RSVP//EN",
      "BEGIN:VEVENT",
      "UID:" + Date.now() + "@latabledhiver",
      "DTSTAMP:" + fmt(new Date().toISOString()),
      "DTSTART:" + fmt(start),
      "DTEND:" + fmt(end),
      "SUMMARY:" + (cfg.EVENT_TITLE || "Event"),
      "DESCRIPTION:" + (cfg.EVENT_DESCRIPTION || ""),
      "LOCATION:" + (cfg.EVENT_LOCATION || ""),
      "END:VEVENT", "END:VCALENDAR"
    ].join("\r\n");
    var icsLink = document.getElementById("ics-link");
    if (icsLink) icsLink.href = "data:text/calendar;charset=utf-8," + encodeURIComponent(ics);
  }

  /* ---------------- Attending toggle ---------------- */
  function updatePlusOneVisibility() {
    var selected = form.querySelector('input[name="attending"]:checked');
    var isYes = selected && selected.value === "yes";
    var isTwo = guestsSelect.value === "2";
    plusOneRow.hidden = !(isYes && isTwo);
  }

  function onAttendingChange() {
    var selected = form.querySelector('input[name="attending"]:checked');
    var isYes = selected && selected.value === "yes";
    attendingOnlyRows.forEach(function (row) {
      row.hidden = !isYes;
    });
    updatePlusOneVisibility();
  }
  form.querySelectorAll('input[name="attending"]').forEach(function (radio) {
    radio.addEventListener("change", onAttendingChange);
  });
  guestsSelect.addEventListener("change", updatePlusOneVisibility);

  /* ---------------- Note char count ---------------- */
  if (noteEl && noteCount) {
    noteEl.addEventListener("input", function () {
      noteCount.textContent = noteEl.value.length;
    });
  }

  /* ---------------- Validation ---------------- */
  function clearErrors() {
    form.querySelectorAll(".field-error").forEach(function (el) { el.textContent = ""; });
    formErrorEl.hidden = true;
    formErrorEl.textContent = "";
  }

  function setError(id, message) {
    var el = document.getElementById("err-" + id);
    if (el) el.textContent = message;
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function validate(data) {
    var valid = true;
    if (!data.name) { setError("name", "Please enter your name."); valid = false; }
    if (!data.email || !isValidEmail(data.email)) { setError("email", "Please enter a valid email."); valid = false; }
    if (!data.attending) { setError("attending", "Please let us know if you can make it."); valid = false; }
    return valid;
  }

  /* ---------------- Submit ---------------- */
  function collectFormData() {
    var selected = form.querySelector('input[name="attending"]:checked');
    return {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      attending: selected ? selected.value : "",
      guests: selected && selected.value === "yes" ? form.guests.value : "0",
      guestName: selected && selected.value === "yes" && form.guests.value === "2" ? form.guestName.value.trim() : "",
      dietary: form.dietary.value.trim(),
      note: form.note.value.trim(),
      website: form.org_website.value, // honeypot
      elapsedMs: Date.now() - pageLoadedAt
    };
  }

  function showConfirmation(data) {
    form.hidden = true;
    confirmation.hidden = false;
    confirmation.focus();
    if (data.attending === "yes") {
      confirmHeading.textContent = "You're all set, " + data.name.split(" ")[0] + "!";
      var guestPart = "We've saved your RSVP for " + data.guests + " guest" + (data.guests === "2" ? "s" : "");
      if (data.guests === "2" && data.guestName) guestPart += " (you + " + data.guestName + ")";
      confirmBody.textContent = guestPart + ". We can't wait to see you on November 15th.";
    } else {
      confirmHeading.textContent = "Thanks for letting us know, " + data.name.split(" ")[0] + ".";
      confirmBody.textContent = "We're sorry you can't make it this time — we'll miss you!";
    }
  }

  function saveLocal(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) { /* localStorage unavailable — confirmation still shown this session */ }
  }

  function loadLocal() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function setLoading(isLoading) {
    submitBtn.classList.toggle("loading", isLoading);
    submitBtn.disabled = isLoading;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    clearErrors();

    var data = collectFormData();

    if (data.website) {
      // Honeypot tripped — pretend success, do nothing.
      showConfirmation(data);
      return;
    }
    if (data.elapsedMs < 800) {
      formErrorEl.textContent = "Hmm, that was fast — please try submitting again.";
      formErrorEl.hidden = false;
      return;
    }
    if (!validate(data)) return;

    if (!cfg.APPS_SCRIPT_URL) {
      formErrorEl.textContent = "RSVP storage isn't connected yet. See README.md to finish setup (this takes 5 minutes).";
      formErrorEl.hidden = false;
      return;
    }

    setLoading(true);
    fetch(cfg.APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(data)
    })
      .then(function (res) { return res.json(); })
      .then(function (result) {
        setLoading(false);
        if (result && result.ok) {
          saveLocal(data);
          showConfirmation(data);
        } else {
          formErrorEl.textContent = (result && result.error) || "Something went wrong saving your RSVP. Please try again.";
          formErrorEl.hidden = false;
        }
      })
      .catch(function () {
        setLoading(false);
        formErrorEl.textContent = "We couldn't reach the server. Check your connection and try again.";
        formErrorEl.hidden = false;
      });
  });

  editBtn.addEventListener("click", function () {
    confirmation.hidden = true;
    form.hidden = false;
    form.querySelector("#name").focus();
  });

  /* ---------------- Restore prior RSVP on return visit ---------------- */
  function restore() {
    var saved = loadLocal();
    if (!saved) return;
    form.name.value = saved.name || "";
    form.email.value = saved.email || "";
    if (saved.guests) form.guests.value = saved.guests;
    if (saved.attending) {
      var radio = form.querySelector('input[name="attending"][value="' + saved.attending + '"]');
      if (radio) radio.checked = true;
      onAttendingChange();
    }
    form.guestName.value = saved.guestName || "";
    form.dietary.value = saved.dietary || "";
    form.note.value = saved.note || "";
    if (noteCount) noteCount.textContent = form.note.value.length;
    showConfirmation(saved);
  }

  buildCalendarLinks();
  restore();
})();
