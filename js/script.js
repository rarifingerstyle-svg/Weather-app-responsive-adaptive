(function() {
  'use strict';

  // ==================== STATE ====================
  const state = {
    units: {
      temp: 'celsius',      // celsius | fahrenheit
      wind: 'kmh',          // kmh | mph
      precip: 'mm'          // mm | in
    },
    weatherData: null,
    location: { name: 'Berlin, Germany', lat: 52.52, lon: 13.405 },
    selectedDayIndex: 0,
    searchResults: [],
    abortController: null
  };

  // ==================== WEATHER CODE MAPPING ====================
  const weatherCodes = {
    0: { label: 'Clear sky', icon: 'sun' },
    1: { label: 'Mainly clear', icon: 'partly' },
    2: { label: 'Partly cloudy', icon: 'partly' },
    3: { label: 'Overcast', icon: 'cloud' },
    45: { label: 'Fog', icon: 'fog' },
    48: { label: 'Depositing rime fog', icon: 'fog' },
    51: { label: 'Light drizzle', icon: 'rain' },
    53: { label: 'Moderate drizzle', icon: 'rain' },
    55: { label: 'Dense drizzle', icon: 'rain' },
    56: { label: 'Light freezing drizzle', icon: 'rain' },
    57: { label: 'Dense freezing drizzle', icon: 'rain' },
    61: { label: 'Slight rain', icon: 'rain' },
    63: { label: 'Moderate rain', icon: 'rain' },
    65: { label: 'Heavy rain', icon: 'rain' },
    66: { label: 'Light freezing rain', icon: 'rain' },
    67: { label: 'Heavy freezing rain', icon: 'rain' },
    71: { label: 'Slight snow', icon: 'snow' },
    73: { label: 'Moderate snow', icon: 'snow' },
    75: { label: 'Heavy snow', icon: 'snow' },
    77: { label: 'Snow grains', icon: 'snow' },
    80: { label: 'Slight rain showers', icon: 'rain' },
    81: { label: 'Moderate rain showers', icon: 'rain' },
    82: { label: 'Violent rain showers', icon: 'rain' },
    85: { label: 'Slight snow showers', icon: 'snow' },
    86: { label: 'Heavy snow showers', icon: 'snow' },
    95: { label: 'Thunderstorm', icon: 'thunder' },
    96: { label: 'Thunderstorm with hail', icon: 'thunder' },
    99: { label: 'Thunderstorm with heavy hail', icon: 'thunder' }
  };

  // ==================== SVG ICONS ====================
  const icons = {
    sun: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="14" fill="#fbbf24"/><path d="M32 4V12M32 52V60M4 32H12M52 32H60M12.2 12.2L17.8 17.8M46.2 46.2L51.8 51.8M12.2 51.8L17.8 46.2M46.2 17.8L51.8 12.2" stroke="#fbbf24" stroke-width="3" stroke-linecap="round"/></svg>`,
    partly: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="24" cy="24" r="10" fill="#fbbf24"/><path d="M24 4V8M24 40V44M4 24H8M40 24H44M10.3 10.3L13.5 13.5M34.5 34.5L37.7 37.7M10.3 37.7L13.5 34.5M34.5 13.5L37.7 10.3" stroke="#fbbf24" stroke-width="2.5" stroke-linecap="round"/><path d="M44 36C50.6 36 56 41.4 56 48C56 54.6 50.6 60 44 60H28C21.4 60 16 54.6 16 48C16 41.4 21.4 36 28 36" fill="#9ca3af" opacity="0.9"/></svg>`,
    cloud: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M48 28C55.7 28 62 34.3 62 42C62 49.7 55.7 56 48 56H16C8.3 56 2 49.7 2 42C2 34.3 8.3 28 16 28" fill="#9ca3af" opacity="0.9"/></svg>`,
    rain: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M44 24C51.7 24 58 30.3 58 38C58 45.7 51.7 52 44 52H20C12.3 52 6 45.7 6 38C6 30.3 12.3 24 20 24" fill="#9ca3af" opacity="0.9"/><path d="M20 56L16 64M32 56L28 64M44 56L40 64" stroke="#60a5fa" stroke-width="2.5" stroke-linecap="round"/></svg>`,
    thunder: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M44 24C51.7 24 58 30.3 58 38C58 45.7 51.7 52 44 52H20C12.3 52 6 45.7 6 38C6 30.3 12.3 24 20 24" fill="#9ca3af" opacity="0.9"/><path d="M34 40L24 54H32L28 64L42 48H32L34 40Z" fill="#fbbf24" stroke="#fbbf24" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
    snow: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M44 24C51.7 24 58 30.3 58 38C58 45.7 51.7 52 44 52H20C12.3 52 6 45.7 6 38C6 30.3 12.3 24 20 24" fill="#9ca3af" opacity="0.9"/><circle cx="20" cy="58" r="2.5" fill="white"/><circle cx="32" cy="62" r="2.5" fill="white"/><circle cx="44" cy="58" r="2.5" fill="white"/></svg>`,
    fog: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 20H56M4 32H60M8 44H56" stroke="#9ca3af" stroke-width="3" stroke-linecap="round" opacity="0.7"/></svg>`
  };

  function getIcon(code) {
    const info = weatherCodes[code] || weatherCodes[0];
    return icons[info.icon] || icons.sun;
  }

  function getLabel(code) {
    return (weatherCodes[code] || weatherCodes[0]).label;
  }

  // ==================== UNIT CONVERSIONS ====================
  function cToF(c) { return Math.round((c * 9/5) + 32); }
  function kmhToMph(kmh) { return Math.round(kmh * 0.621371); }
  function mmToIn(mm) { return (mm * 0.0393701).toFixed(2); }

  function formatTemp(c) {
    if (state.units.temp === 'fahrenheit') return cToF(c) + '°';
    return Math.round(c) + '°';
  }

  function formatWind(kmh) {
    if (state.units.wind === 'mph') return kmhToMph(kmh) + ' mph';
    return Math.round(kmh) + ' km/h';
  }

  function formatPrecip(mm) {
    if (state.units.precip === 'in') return mmToIn(mm) + ' in';
    return Math.round(mm) + ' mm';
  }

  // ==================== DOM ELEMENTS ====================
  const els = {
    loadingState: document.getElementById('loading-state'),
    errorState: document.getElementById('error-state'),
    noResultsState: document.getElementById('no-results-state'),
    weatherData: document.getElementById('weather-data'),
    searchInput: document.getElementById('search-input'),
    searchBtn: document.getElementById('search-btn'),
    searchResults: document.getElementById('search-results'),
    searchSpinner: document.getElementById('search-spinner'),
    searchStatus: document.getElementById('search-status'),
    unitsBtn: document.getElementById('units-btn'),
    unitsMenu: document.getElementById('units-menu'),
    switchAllBtn: document.getElementById('switch-all-btn'),
    retryBtn: document.getElementById('retry-btn'),
    locationName: document.getElementById('location-name'),
    locationDate: document.getElementById('location-date'),
    currentTemp: document.getElementById('current-temp'),
    currentIcon: document.getElementById('current-icon'),
    feelsLike: document.getElementById('feels-like'),
    humidity: document.getElementById('humidity'),
    wind: document.getElementById('wind'),
    precipitation: document.getElementById('precipitation'),
    dailyList: document.getElementById('daily-forecast-list'),
    hourlyList: document.getElementById('hourly-list'),
    dayDropdownBtn: document.getElementById('day-dropdown-btn'),
    dayDropdownMenu: document.getElementById('day-dropdown-menu'),
    selectedDay: document.getElementById('selected-day')
  };

  // ==================== API FUNCTIONS ====================
  async function fetchWeather(lat, lon) {
    if (state.abortController) state.abortController.abort();
    state.abortController = new AbortController();

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,precipitation&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
    
    const res = await fetch(url, { signal: state.abortController.signal });
    if (!res.ok) throw new Error('API error');
    return res.json();
  }

  async function searchLocations(query) {
    if (!query || query.length < 2) return [];
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Search error');
    const data = await res.json();
    return data.results || [];
  }

  // ==================== UI STATE FUNCTIONS ====================
  function showLoading() {
    els.loadingState.classList.add('active');
    els.errorState.classList.remove('active');
    els.noResultsState.classList.remove('active');
    els.weatherData.hidden = true;
  }

  function showError() {
    els.loadingState.classList.remove('active');
    els.errorState.classList.add('active');
    els.noResultsState.classList.remove('active');
    els.weatherData.hidden = true;
  }

  function showWeather() {
    els.loadingState.classList.remove('active');
    els.errorState.classList.remove('active');
    els.noResultsState.classList.remove('active');
    els.weatherData.hidden = false;
  }

  // ==================== RENDER FUNCTIONS ====================
  function formatDate(d) {
    return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
  }

  function getDayName(dateStr) {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' });
  }

  function getFullDayName(dateStr) {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' });
  }

  function renderCurrent() {
    const current = state.weatherData.current;
    els.locationName.textContent = state.location.name;
    els.locationDate.textContent = formatDate(new Date());
    els.currentTemp.textContent = formatTemp(current.temperature_2m);
    els.currentIcon.innerHTML = getIcon(current.weather_code);
    els.currentIcon.setAttribute('aria-label', getLabel(current.weather_code));
  }

  function renderStats() {
    const current = state.weatherData.current;
    els.feelsLike.textContent = formatTemp(current.apparent_temperature);
    els.humidity.textContent = Math.round(current.relative_humidity_2m) + '%';
    els.wind.textContent = formatWind(current.wind_speed_10m);
    els.precipitation.textContent = formatPrecip(current.precipitation);
  }

  function renderDaily() {
    const daily = state.weatherData.daily;
    els.dailyList.innerHTML = '';
    daily.time.forEach((date, i) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'day-card' + (i === state.selectedDayIndex ? ' active' : '');
      card.setAttribute('role', 'listitem');
      card.setAttribute('aria-label', `${getFullDayName(date)}: High ${formatTemp(daily.temperature_2m_max[i])}, Low ${formatTemp(daily.temperature_2m_min[i])}, ${getLabel(daily.weather_code[i])}`);
      card.innerHTML = `
        <div class="day-name">${getDayName(date)}</div>
        <div class="day-icon">${getIcon(daily.weather_code[i])}</div>
        <div class="day-temps">
          <span class="day-temp-high">${formatTemp(daily.temperature_2m_max[i])}</span>
          <span class="day-temp-low">${formatTemp(daily.temperature_2m_min[i])}</span>
        </div>
      `;
      card.addEventListener('click', () => selectDay(i));
      els.dailyList.appendChild(card);
    });
  }

  function renderHourly() {
    const hourly = state.weatherData.hourly;
    const daily = state.weatherData.daily;
    const selectedDate = daily.time[state.selectedDayIndex];
    
    els.selectedDay.textContent = getFullDayName(selectedDate);
    els.hourlyList.innerHTML = '';

    const dayStart = new Date(selectedDate + 'T00:00:00');
    const dayEnd = new Date(selectedDate + 'T23:59:59');

    hourly.time.forEach((time, i) => {
      const t = new Date(time);
      if (t >= dayStart && t <= dayEnd) {
        const item = document.createElement('div');
        item.className = 'hourly-item';
        item.setAttribute('role', 'listitem');
        const hourStr = t.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
        item.innerHTML = `
          <div class="hourly-left">
            <div class="hourly-icon">${getIcon(hourly.weather_code[i])}</div>
            <span class="hourly-time">${hourStr}</span>
          </div>
          <span class="hourly-temp">${formatTemp(hourly.temperature_2m[i])}</span>
        `;
        els.hourlyList.appendChild(item);
      }
    });
  }

  function renderDayDropdown() {
    const daily = state.weatherData.daily;
    els.dayDropdownMenu.innerHTML = '';
    daily.time.forEach((date, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'day-dropdown-item';
      btn.setAttribute('role', 'option');
      btn.setAttribute('aria-selected', i === state.selectedDayIndex ? 'true' : 'false');
      btn.textContent = getFullDayName(date);
      btn.addEventListener('click', () => {
        selectDay(i);
        toggleDayDropdown(false);
      });
      els.dayDropdownMenu.appendChild(btn);
    });
  }

  function selectDay(index) {
    state.selectedDayIndex = index;
    renderDaily();
    renderHourly();
    renderDayDropdown();
  }

  function updateUnitsUI() {
    const isMetric = state.units.temp === 'celsius' && state.units.wind === 'kmh' && state.units.precip === 'mm';
    els.switchAllBtn.textContent = isMetric ? 'Switch to Imperial' : 'Switch to Metric';

    document.querySelectorAll('.menu-option').forEach(opt => {
      const unit = opt.dataset.unit;
      const value = opt.dataset.value;
      const isActive = state.units[unit] === value;
      opt.classList.toggle('active', isActive);
      opt.setAttribute('aria-checked', isActive ? 'true' : 'false');
    });

    if (state.weatherData) {
      renderCurrent();
      renderStats();
      renderDaily();
      renderHourly();
    }
  }

  function toggleUnitsMenu(show) {
    const isOpen = show !== undefined ? show : !els.unitsMenu.classList.contains('open');
    els.unitsMenu.classList.toggle('open', isOpen);
    els.unitsBtn.setAttribute('aria-expanded', isOpen);
  }

  function toggleDayDropdown(show) {
    const isOpen = show !== undefined ? show : !els.dayDropdownMenu.classList.contains('open');
    els.dayDropdownMenu.classList.toggle('open', isOpen);
    els.dayDropdownBtn.setAttribute('aria-expanded', isOpen);
  }

  // ==================== SEARCH ====================
  let searchTimeout;

  async function handleSearchInput() {
    const query = els.searchInput.value.trim();
    if (query.length < 2) {
      els.searchResults.classList.remove('open');
      els.searchSpinner.classList.remove('active');
      return;
    }

    els.searchSpinner.classList.add('active');
    els.searchStatus.textContent = 'Search in progress';

    try {
      const results = await searchLocations(query);
      state.searchResults = results;
      renderSearchResults(results);
      els.searchStatus.textContent = results.length > 0 ? `${results.length} results found` : '';
    } catch (e) {
      state.searchResults = [];
      renderSearchResults([]);
      els.searchStatus.textContent = '';
    } finally {
      els.searchSpinner.classList.remove('active');
    }
  }

  function renderSearchResults(results) {
    els.searchResults.innerHTML = '';
    if (results.length === 0) {
      els.searchResults.classList.remove('open');
      return;
    }

    results.forEach((result) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'search-result-item';
      btn.setAttribute('role', 'option');
      btn.setAttribute('aria-selected', 'false');
      const region = result.admin1 || result.country || '';
      btn.innerHTML = `<span>${result.name}${region ? ', ' + region : ''}</span>`;
      btn.addEventListener('click', () => selectLocation(result));
      els.searchResults.appendChild(btn);
    });

    els.searchResults.classList.add('open');
  }

  async function selectLocation(result) {
    els.searchResults.classList.remove('open');
    els.searchInput.value = '';
    els.searchStatus.textContent = '';
    state.location = {
      name: `${result.name}${result.country ? ', ' + result.country : ''}`,
      lat: result.latitude,
      lon: result.longitude
    };
    await loadWeather();
  }

  // ==================== MAIN LOAD ====================
  async function loadWeather() {
    showLoading();
    try {
      const data = await fetchWeather(state.location.lat, state.location.lon);
      state.weatherData = data;
      state.selectedDayIndex = 0;
      showWeather();
      renderCurrent();
      renderStats();
      renderDaily();
      renderHourly();
      renderDayDropdown();
    } catch (e) {
      if (e.name !== 'AbortError') {
        showError();
      }
    }
  }

  // ==================== EVENT LISTENERS ====================
  els.unitsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleUnitsMenu();
  });

  els.switchAllBtn.addEventListener('click', () => {
    const isMetric = state.units.temp === 'celsius';
    if (isMetric) {
      state.units = { temp: 'fahrenheit', wind: 'mph', precip: 'in' };
    } else {
      state.units = { temp: 'celsius', wind: 'kmh', precip: 'mm' };
    }
    updateUnitsUI();
  });

  document.querySelectorAll('.menu-option').forEach(opt => {
    opt.addEventListener('click', () => {
      const unit = opt.dataset.unit;
      const value = opt.dataset.value;
      state.units[unit] = value;
      updateUnitsUI();
    });
  });

  els.searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(handleSearchInput, 300);
  });

  els.searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchInput();
    }
  });

  els.searchBtn.addEventListener('click', handleSearchInput);

  els.retryBtn.addEventListener('click', loadWeather);

  els.dayDropdownBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleDayDropdown();
  });

  // Close dropdowns on outside click
  document.addEventListener('click', (e) => {
    if (!els.unitsMenu.contains(e.target) && !els.unitsBtn.contains(e.target)) {
      toggleUnitsMenu(false);
    }
    if (!els.dayDropdownMenu.contains(e.target) && !els.dayDropdownBtn.contains(e.target)) {
      toggleDayDropdown(false);
    }
    if (!els.searchResults.contains(e.target) && !els.searchInput.contains(e.target)) {
      els.searchResults.classList.remove('open');
    }
  });

  // ==================== INIT ====================
  loadWeather();
})();
