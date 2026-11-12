(function () {
  "use strict";

  var LAT = 34.1008, LON = -117.7678;
  var EVENT_DATE = "2026-11-15";
  var EVENT_HOURS = [16, 17, 18, 19];
  var REFRESH_MS = 30 * 60 * 1000;

  var widget = document.getElementById("weather-widget");
  if (!widget) return;

  var iconEl = document.getElementById("weather-icon");
  var tempEl = document.getElementById("weather-temp");
  var conditionEl = document.getElementById("weather-condition");
  var adviceEl = document.getElementById("weather-advice");
  var updatedEl = document.getElementById("weather-updated");

  var ICON_SVGS = {
    sun: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.6"/><path d="M12 2v2.5M12 19.5V22M4 12H1.5M22.5 12H20M5.8 5.8L4.1 4.1M19.9 19.9l-1.7-1.7M5.8 18.2l-1.7 1.7M19.9 4.1l-1.7 1.7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    "part-cloud": '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="8.5" cy="8" r="3" stroke="currentColor" stroke-width="1.6"/><path d="M4.5 17.5a3.5 3.5 0 013-5.4 4.5 4.5 0 018.6 1.1A3.3 3.3 0 0119 17.5H4.5z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
    cloud: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 17.5a3.5 3.5 0 01.6-6.9 5 5 0 019.6-1.4A3.6 3.6 0 0119 17.5H6z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
    fog: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 14.5a3.5 3.5 0 01.6-6.9 5 5 0 019.6-1.4A3.6 3.6 0 0119 14.5H6z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M4 18.5h16M6.5 21.5h11" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    rain: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 13.5a3.5 3.5 0 01.6-6.9 5 5 0 019.6-1.4A3.6 3.6 0 0119 13.5H6z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M8.5 17v3M12.5 17v3M16.5 17v3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    snow: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 13.5a3.5 3.5 0 01.6-6.9 5 5 0 019.6-1.4A3.6 3.6 0 0119 13.5H6z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M8.5 18v.01M12.5 18v.01M16.5 18v.01M8.5 21v.01M12.5 21v.01M16.5 21v.01" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    storm: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 13a3.5 3.5 0 01.6-6.9 5 5 0 019.6-1.4A3.6 3.6 0 0119 13H6z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M13.5 16l-3 4h3l-2 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };
  var WEATHER_ICONS = {
    0: "sun", 1: "sun", 2: "part-cloud", 3: "cloud",
    45: "fog", 48: "fog",
    51: "rain", 53: "rain", 55: "rain",
    56: "rain", 57: "rain",
    61: "rain", 63: "rain", 65: "rain",
    66: "rain", 67: "rain",
    71: "snow", 73: "snow", 75: "snow", 77: "snow",
    80: "rain", 81: "rain", 82: "storm",
    85: "snow", 86: "snow",
    95: "storm", 96: "storm", 99: "storm"
  };
  var WEATHER_LABELS = {
    0: "Clear skies", 1: "Mostly clear", 2: "Partly cloudy", 3: "Cloudy",
    45: "Foggy", 48: "Foggy",
    51: "Light drizzle", 53: "Drizzle", 55: "Drizzle",
    56: "Freezing drizzle", 57: "Freezing drizzle",
    61: "Light rain", 63: "Rain", 65: "Heavy rain",
    66: "Freezing rain", 67: "Freezing rain",
    71: "Light snow", 73: "Snow", 75: "Heavy snow", 77: "Snow grains",
    80: "Rain showers", 81: "Rain showers", 82: "Heavy showers",
    85: "Snow showers", 86: "Snow showers",
    95: "Thunderstorms", 96: "Thunderstorms", 99: "Thunderstorms"
  };
  var RAINY_CODES = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99];

  function deg(f) { return Math.round(f) + "°"; }

  function adviceFor(lowF, code) {
    if (RAINY_CODES.indexOf(code) !== -1) {
      return "There's a chance of rain in the forecast — bring a layer just in case, and we'll adjust as needed.";
    }
    if (lowF < 50) return "It'll be chilly once the sun goes down — bring a jacket.";
    if (lowF < 60) return "Expect a cool evening breeze — a light jacket or sweater is a good call.";
    if (lowF < 68) return "Comfortable, but it may cool off after sunset — a light layer wouldn't hurt.";
    return "Looking mild for the evening — dress comfortably.";
  }

  function setIcon(key) {
    iconEl.innerHTML = ICON_SVGS[key] || ICON_SVGS.sun;
  }

  function showFallback() {
    widget.classList.add("weather-unavailable");
    setIcon("cloud");
    conditionEl.textContent = "Forecast not available right now";
    tempEl.textContent = "";
    adviceEl.textContent = "Check your weather app closer to the date — we'll plan for a cozy evening either way.";
    updatedEl.textContent = "";
  }

  function render(data) {
    var hourly = data && data.hourly;
    if (!hourly || !hourly.time) { showFallback(); return; }

    var times = hourly.time, temps = hourly.temperature_2m, codes = hourly.weathercode;
    var picks = [];
    for (var i = 0; i < times.length; i++) {
      if (times[i].indexOf(EVENT_DATE) === 0) {
        var hour = parseInt(times[i].slice(11, 13), 10);
        if (EVENT_HOURS.indexOf(hour) !== -1) picks.push({ temp: temps[i], code: codes[i] });
      }
    }

    if (!picks.length) { showFallback(); return; }

    var low = Math.min.apply(null, picks.map(function (p) { return p.temp; }));
    var high = Math.max.apply(null, picks.map(function (p) { return p.temp; }));
    var mainCode = picks[Math.floor(picks.length / 2)].code;

    widget.classList.remove("weather-unavailable");
    setIcon(WEATHER_ICONS[mainCode]);
    conditionEl.textContent = WEATHER_LABELS[mainCode] || "Mixed conditions";
    tempEl.textContent = deg(low) + "–" + deg(high) + "F";
    adviceEl.textContent = adviceFor(low, mainCode);
    updatedEl.textContent = "Updated " + new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  function fetchWeather() {
    var url = "https://api.open-meteo.com/v1/forecast?latitude=" + LAT + "&longitude=" + LON +
      "&hourly=temperature_2m,weathercode&temperature_unit=fahrenheit&timezone=America%2FLos_Angeles&forecast_days=16";
    fetch(url, { cache: "no-store" })
      .then(function (res) { return res.json(); })
      .then(render)
      .catch(showFallback);
  }

  fetchWeather();
  setInterval(fetchWeather, REFRESH_MS);
})();
