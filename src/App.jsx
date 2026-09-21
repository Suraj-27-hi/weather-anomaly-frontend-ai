import { useEffect, useMemo, useState } from "react"
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import "./App.css"

// ------------------------------------------------------------
// CONFIG
// ------------------------------------------------------------

const BACKEND_URL =
  "https://weather-anomaly-backend--duttasayan976.replit.app"

const POPULAR_LOCATIONS = [
  { name: "Bengaluru, Karnataka", latitude: 12.9716, longitude: 77.5946 },
  { name: "Mumbai, Maharashtra", latitude: 19.076, longitude: 72.8777 },
  { name: "Delhi", latitude: 28.6139, longitude: 77.209 },
  { name: "Chennai, Tamil Nadu", latitude: 13.0827, longitude: 80.2707 },
  { name: "Hyderabad, Telangana", latitude: 17.385, longitude: 78.4867 },
  { name: "Kolkata, West Bengal", latitude: 22.5726, longitude: 88.3639 },
  { name: "Pune, Maharashtra", latitude: 18.5204, longitude: 73.8567 },
  { name: "Patna, Bihar", latitude: 25.5941, longitude: 85.1376 },
  { name: "Jaipur, Rajasthan", latitude: 26.9124, longitude: 75.7873 },
]

const STATES = [
  { name: "Karnataka", latitude: 15.3173, longitude: 75.7139 },
  { name: "Maharashtra", latitude: 19.7515, longitude: 75.7139 },
  { name: "Tamil Nadu", latitude: 11.1271, longitude: 78.6569 },
  { name: "Telangana", latitude: 18.1124, longitude: 79.0193 },
  { name: "Andhra Pradesh", latitude: 15.9129, longitude: 79.74 },
  { name: "Kerala", latitude: 10.8505, longitude: 76.2711 },
  { name: "Bihar", latitude: 25.0961, longitude: 85.3131 },
  { name: "West Bengal", latitude: 22.9868, longitude: 87.855 },
  { name: "Rajasthan", latitude: 27.0238, longitude: 74.2179 },
  { name: "Delhi", latitude: 28.7041, longitude: 77.1025 },
  { name: "Uttar Pradesh", latitude: 26.8467, longitude: 80.9462 },
  { name: "Gujarat", latitude: 22.2587, longitude: 71.1924 },
]

// ------------------------------------------------------------
// LEAFLET MARKER
// ------------------------------------------------------------

const locationIcon = L.divIcon({
  className: "custom-location-marker",
  html: `<div class="location-marker-pin">●</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
})

// ------------------------------------------------------------
// MAP HELPERS
// ------------------------------------------------------------

function MapMover({ latitude, longitude }) {
  const map = useMap()

  useEffect(() => {
    map.flyTo([latitude, longitude], 5, {
      duration: 1,
    })
  }, [latitude, longitude, map])

  return null
}

function MapClickHandler({ onLocationClick }) {
  useMapEvents({
    click(event) {
      onLocationClick(event.latlng.lat, event.latlng.lng)
    },
  })

  return null
}

function LocateButton({ onLocate }) {
  const map = useMap()

  const locate = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.")
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        map.flyTo([latitude, longitude], 8, {
          duration: 1,
        })
        onLocate(latitude, longitude)
      },
      () => {
        alert("Location permission was not available.")
      }
    )
  }

  return (
    <button className="map-locate-button" onClick={locate}>
      ⦿
    </button>
  )
}

// ------------------------------------------------------------
// WEATHER HELPERS
// ------------------------------------------------------------

function getWeatherCondition(code) {
  const weatherCodes = {
    0: "Clear Sky",
    1: "Mainly Clear",
    2: "Partly Cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Foggy",
    51: "Light Drizzle",
    53: "Drizzle",
    55: "Heavy Drizzle",
    61: "Light Rain",
    63: "Rain",
    65: "Heavy Rain",
    71: "Light Snow",
    73: "Snow",
    75: "Heavy Snow",
    80: "Rain Showers",
    81: "Rain Showers",
    82: "Heavy Rain Showers",
    95: "Thunderstorm",
    96: "Thunderstorm",
    99: "Thunderstorm",
  }

  return weatherCodes[code] || "Unknown"
}

function getWeatherIcon(code) {
  if (code === 0) return "☀️"
  if ([1, 2].includes(code)) return "🌤️"
  if ([3].includes(code)) return "☁️"
  if ([45, 48].includes(code)) return "🌫️"
  if ([51, 53, 55].includes(code)) return "🌦️"
  if ([61, 63, 65, 80, 81, 82].includes(code)) return "🌧️"
  if ([95, 96, 99].includes(code)) return "⛈️"

  return "🌤️"
}

function getWindDirection(degrees) {
  if (degrees === undefined || degrees === null) return "—"

  const directions = [
    "N",
    "NE",
    "E",
    "SE",
    "S",
    "SW",
    "W",
    "NW",
  ]

  return directions[Math.round(degrees / 45) % 8]
}

function getSeverityClass(severity) {
  if (!severity) return "normal"

  return severity.toLowerCase()
}

// ------------------------------------------------------------
// GRAPH
// ------------------------------------------------------------

function WeatherGraph({ hourlyWeather }) {
  if (!hourlyWeather?.time?.length) {
    return (
      <div className="graph-empty">
        Loading 24-hour weather data...
      </div>
    )
  }

  const temperatures = hourlyWeather.temperature_2m || []
  const rainfall = hourlyWeather.precipitation || []

  const width = 700
  const height = 250
  const left = 45
  const right = 25
  const top = 25
  const bottom = 45

  const plotWidth = width - left - right
  const plotHeight = height - top - bottom

  const maxTemp = Math.max(...temperatures, 35)
  const minTemp = Math.min(...temperatures, 15)

  const maxRain = Math.max(...rainfall, 5)

  const getX = (index) => {
    if (temperatures.length <= 1) return left

    return left + (index / (temperatures.length - 1)) * plotWidth
  }

  const getTempY = (temp) => {
    const range = maxTemp - minTemp || 1

    return (
      top +
      plotHeight -
      ((temp - minTemp) / range) * plotHeight
    )
  }

  const getRainHeight = (rain) => {
    return (rain / maxRain) * plotHeight * 0.55
  }

  const temperaturePoints = temperatures
    .map((temp, index) => `${getX(index)},${getTempY(temp)}`)
    .join(" ")

  const timeLabels = hourlyWeather.time.map((time) => {
    const date = new Date(time)

    return date.toLocaleTimeString([], {
      hour: "numeric",
    })
  })

  const labelIndexes = [0, 6, 12, 18, 23].filter(
    (index) => index < hourlyWeather.time.length
  )

  return (
    <div className="weather-graph">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
      >
        {/* Grid */}
        {[0, 1, 2, 3].map((line) => {
          const y = top + (plotHeight / 3) * line

          return (
            <line
              key={line}
              x1={left}
              x2={width - right}
              y1={y}
              y2={y}
              className="graph-grid"
            />
          )
        })}

        {/* Rainfall bars */}
        {rainfall.map((rain, index) => {
          const barWidth =
            Math.max(plotWidth / rainfall.length - 3, 3)

          const barHeight = getRainHeight(rain)

          return (
            <rect
              key={index}
              x={getX(index) - barWidth / 2}
              y={top + plotHeight - barHeight}
              width={barWidth}
              height={barHeight}
              rx="2"
              className="rain-bar"
            />
          )
        })}

        {/* Temperature line */}
        <polyline
          points={temperaturePoints}
          fill="none"
          className="temperature-line"
        />

        {/* Temperature points */}
        {temperatures.map((temp, index) => {
          if (index % 3 !== 0) return null

          return (
            <circle
              key={index}
              cx={getX(index)}
              cy={getTempY(temp)}
              r="3"
              className="temperature-point"
            />
          )
        })}

        {/* X labels */}
        {labelIndexes.map((index) => (
          <text
            key={index}
            x={getX(index)}
            y={height - 14}
            textAnchor="middle"
            className="graph-label"
          >
            {timeLabels[index]}
          </text>
        ))}

        {/* Y labels */}
        <text x="8" y={top + 5} className="graph-label">
          {Math.round(maxTemp)}°
        </text>

        <text
          x="8"
          y={top + plotHeight}
          className="graph-label"
        >
          {Math.round(minTemp)}°
        </text>
      </svg>

      <div className="graph-legend">
        <span>
          <i className="legend-dot temp-dot" />
          Temperature (°C)
        </span>

        <span>
          <i className="legend-box rain-dot" />
          Rainfall (mm)
        </span>
      </div>
    </div>
  )
}

// ------------------------------------------------------------
// MAIN APP
// ------------------------------------------------------------

export default function App() {
  const [latitude, setLatitude] = useState(12.9716)
  const [longitude, setLongitude] = useState(77.5946)

  const [selectedLocation, setSelectedLocation] = useState({
    name: "Bengaluru, Karnataka",
    latitude: 12.9716,
    longitude: 77.5946,
  })

  const [selectedState, setSelectedState] =
    useState("Karnataka")

  const [searchPlace, setSearchPlace] = useState("")

  const [weather, setWeather] = useState(null)
  const [hourlyWeather, setHourlyWeather] = useState(null)

  const [weatherLoading, setWeatherLoading] = useState(true)
  const [graphLoading, setGraphLoading] = useState(true)

  const [result, setResult] = useState(null)
  const [anomalyLoading, setAnomalyLoading] = useState(true)

  const [error, setError] = useState("")

  const [mapMode, setMapMode] = useState("satellite")
  const [radarTile, setRadarTile] = useState(null)

  const [searchHistory, setSearchHistory] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("weatherSearchHistory") || "[]"
      )
    } catch {
      return []
    }
  })

  const [currentTime, setCurrentTime] = useState(
    new Date()
  )

  // ----------------------------------------------------------
  // LIVE CLOCK
  // ----------------------------------------------------------

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // ----------------------------------------------------------
  // RADAR DATA
  // ----------------------------------------------------------

  useEffect(() => {
    let cancelled = false

    async function loadRadar() {
      try {
        const response = await fetch(
          "https://api.rainviewer.com/public/weather-maps.json"
        )

        if (!response.ok) {
          throw new Error("Radar unavailable")
        }

        const data = await response.json()

        const past = data?.radar?.past || []

        if (!past.length) {
          throw new Error("No radar frame available")
        }

        const latest = past[past.length - 1]

        const tileUrl =
          `${data.host}${latest.path}` +
          `/256/{z}/{x}/{y}/2/1_1.png`

        if (!cancelled) {
          setRadarTile(tileUrl)
        }
      } catch (err) {
        console.error("Radar error:", err)

        if (!cancelled) {
          setRadarTile(null)
        }
      }
    }

    loadRadar()

    const interval = setInterval(loadRadar, 5 * 60 * 1000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  // ----------------------------------------------------------
  // SEARCH HISTORY
  // ----------------------------------------------------------

  function saveSearchHistory(location) {
    const newItem = {
      name: location.name,
      latitude: location.latitude,
      longitude: location.longitude,
    }

    const filtered = searchHistory.filter(
      (item) =>
        item.name.toLowerCase() !==
        location.name.toLowerCase()
    )

    const updated = [newItem, ...filtered].slice(0, 6)

    setSearchHistory(updated)

    localStorage.setItem(
      "weatherSearchHistory",
      JSON.stringify(updated)
    )
  }

  function clearSearchHistory() {
    setSearchHistory([])
    localStorage.removeItem("weatherSearchHistory")
  }

  // ----------------------------------------------------------
  // WEATHER
  // ----------------------------------------------------------

  async function fetchWeather(lat, lon) {
    setWeatherLoading(true)
    setError("")

    try {
      const url =
        `https://api.open-meteo.com/v1/forecast` +
        `?latitude=${lat}` +
        `&longitude=${lon}` +
        `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,visibility` +
        `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max` +
        `&timezone=auto`

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error("Weather request failed")
      }

      const data = await response.json()

      setWeather(data)
    } catch (err) {
      console.error(err)
      setError("Unable to load weather data.")
    } finally {
      setWeatherLoading(false)
    }
  }

  async function fetchHourlyWeather(lat, lon) {
    setGraphLoading(true)

    try {
      const url =
        `https://api.open-meteo.com/v1/forecast` +
        `?latitude=${lat}` +
        `&longitude=${lon}` +
        `&hourly=temperature_2m,precipitation` +
        `&past_hours=24` +
        `&forecast_hours=1` +
        `&timezone=auto`

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error("Hourly weather request failed")
      }

      const data = await response.json()

      setHourlyWeather(data.hourly)
    } catch (err) {
      console.error(err)
      setHourlyWeather(null)
    } finally {
      setGraphLoading(false)
    }
  }

  async function fetchAnomaly(lat, lon) {
    setAnomalyLoading(true)

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/weather/analyze?latitude=${lat}&longitude=${lon}`
      )

      if (!response.ok) {
        throw new Error("Anomaly request failed")
      }

      const data = await response.json()

      setResult(data)
    } catch (err) {
      console.error(err)

      setResult(null)
    } finally {
      setAnomalyLoading(false)
    }
  }

  async function loadLocation(lat, lon) {
    setLatitude(lat)
    setLongitude(lon)

    await Promise.all([
      fetchWeather(lat, lon),
      fetchHourlyWeather(lat, lon),
      fetchAnomaly(lat, lon),
    ])
  }

  // ----------------------------------------------------------
  // SELECT LOCATION
  // ----------------------------------------------------------

  async function selectLocation(location, saveHistory = true) {
    setSelectedLocation(location)

    setLatitude(Number(location.latitude))
    setLongitude(Number(location.longitude))

    const stateMatch = STATES.find((state) =>
      location.name.includes(state.name)
    )

    if (stateMatch) {
      setSelectedState(stateMatch.name)
    }

    if (saveHistory) {
      saveSearchHistory(location)
    }

    await loadLocation(
      Number(location.latitude),
      Number(location.longitude)
    )
  }

  // ----------------------------------------------------------
  // INITIAL LOAD
  // ----------------------------------------------------------

  useEffect(() => {
    loadLocation(12.9716, 77.5946)
  }, [])

  // ----------------------------------------------------------
  // MAP CLICK
  // ----------------------------------------------------------

  async function handleMapClick(lat, lon) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
      )

      const data = await response.json()

      const address = data.address || {}

      const city =
        address.city ||
        address.town ||
        address.village ||
        address.municipality ||
        "Selected Location"

      const state = address.state || ""

      const name = state
        ? `${city}, ${state}`
        : city

      const location = {
        name,
        latitude: lat,
        longitude: lon,
      }

      await selectLocation(location)
    } catch (err) {
      console.error(err)
    }
  }

  // ----------------------------------------------------------
  // SEARCH
  // ----------------------------------------------------------

  async function handleSearch(event) {
    event.preventDefault()

    const query = searchPlace.trim()

    if (!query) return

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&limit=1`
      )

      const data = await response.json()

      if (!data.length) {
        alert("Location not found.")
        return
      }

      const place = data[0]

      const location = {
        name: place.display_name
          .split(",")
          .slice(0, 2)
          .join(","),
        latitude: Number(place.lat),
        longitude: Number(place.lon),
      }

      setSearchPlace("")

      await selectLocation(location)
    } catch (err) {
      console.error(err)
      alert("Search failed.")
    }
  }

  // ----------------------------------------------------------
  // STATE SELECT
  // ----------------------------------------------------------

  async function handleStateChange(event) {
    const stateName = event.target.value

    setSelectedState(stateName)

    const state = STATES.find(
      (item) => item.name === stateName
    )

    if (!state) return

    const location = {
      name: state.name,
      latitude: state.latitude,
      longitude: state.longitude,
    }

    await selectLocation(location)
  }

  // ----------------------------------------------------------
  // DERIVED WEATHER VALUES
  // ----------------------------------------------------------

  const current = weather?.current
  const daily = weather?.daily

  const temperature = current?.temperature_2m
  const condition = current
    ? getWeatherCondition(current.weather_code)
    : "Loading..."

  const icon = current
    ? getWeatherIcon(current.weather_code)
    : "🌤️"

  const rainfallLastHour = current?.precipitation ?? 0

  const rainfallToday =
    daily?.precipitation_sum?.[0] ?? 0

  const windSpeed = current?.wind_speed_10m ?? 0

  const windDirection = getWindDirection(
    current?.wind_direction_10m
  )

  const minTemperature =
    daily?.temperature_2m_min?.[0] ?? "—"

  const maxTemperature =
    daily?.temperature_2m_max?.[0] ?? "—"

  const maxWind =
    daily?.wind_speed_10m_max?.[0] ?? "—"

  // ----------------------------------------------------------
  // ANOMALY
  // ----------------------------------------------------------

  const anomalies = result?.anomalies || []

  const anomalyDetected = anomalies.length > 0

  const strongestAnomaly = useMemo(() => {
    if (!anomalies.length) return null

    return anomalies.reduce((strongest, currentItem) => {
      if (!strongest) return currentItem

      return Math.abs(currentItem.zScore || 0) >
        Math.abs(strongest.zScore || 0)
        ? currentItem
        : strongest
    }, null)
  }, [anomalies])

  const anomalyClass = getSeverityClass(
    strongestAnomaly?.severity
  )

  const anomalyTitle = anomalyDetected
    ? "Anomaly detected"
    : "No anomaly detected"

  const anomalyDescription = anomalyDetected
    ? strongestAnomaly?.explanation ||
      "Weather conditions differ from the recent baseline."
    : "Conditions are normal for this region."

  // ----------------------------------------------------------
  // CLIMATE / TYPE
  // ----------------------------------------------------------

  const climate =
    selectedState === "Rajasthan"
      ? "Arid / Semi-arid"
      : selectedState === "Delhi"
      ? "Semi-arid"
      : "Tropical / Monsoon"

  const weatherType =
    current?.weather_code >= 61
      ? "Rainy"
      : current?.weather_code >= 45
      ? "Cloudy"
      : "Mixed"

  const formattedDate = currentTime.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  )

  const formattedTime = currentTime.toLocaleTimeString(
    "en-IN",
    {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }
  )

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------

  return (
    <div className="app">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">
            <span>AI</span>
            <span className="brand-cloud">☁</span>
          </div>

          <div>
            <h1>
              Weather Anomaly
              <span> Detector</span>
            </h1>

            <p>
              Real-time weather data
              <b> • </b>
              Satellite view
              <b> • </b>
              Anomaly detection
            </p>
          </div>
        </div>

        <div className="header-status">
          <span className="live-dot" />
          <span>Live Data</span>

          <div className="header-divider" />

          <span>
            {formattedDate} {formattedTime} IST
          </span>

          <button className="settings-button">
            ⚙
          </button>
        </div>
      </header>

      {/* ======================================================
          MAIN
      ====================================================== */}

      <main className="dashboard">
        {/* ==================================================
            LEFT DASHBOARD
        ================================================== */}

        <section className="left-panel">

          {/* LOCATION ROW */}
          <div className="selector-row">
            <div className="selector-group">
              <label>
                <span className="label-icon">●</span>
                Location
              </label>

              <div className="select-wrapper">
                <select
                  value={
                    POPULAR_LOCATIONS.some(
                      (item) =>
                        item.name === selectedLocation.name
                    )
                      ? selectedLocation.name
                      : ""
                  }
                  onChange={(event) => {
                    const location =
                      POPULAR_LOCATIONS.find(
                        (item) =>
                          item.name === event.target.value
                      )

                    if (location) {
                      selectLocation(location)
                    }
                  }}
                >
                  <option value="">
                    {selectedLocation.name}
                  </option>

                  {POPULAR_LOCATIONS.map((location) => (
                    <option
                      key={location.name}
                      value={location.name}
                    >
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="selector-group">
              <label>
                <span className="label-icon">⌖</span>
                State
              </label>

              <div className="select-wrapper">
                <select
                  value={selectedState}
                  onChange={handleStateChange}
                >
                  {STATES.map((state) => (
                    <option
                      key={state.name}
                      value={state.name}
                    >
                      {state.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* SEARCH */}
          <form
            className="search-box"
            onSubmit={handleSearch}
          >
            <span>⌕</span>

            <input
              value={searchPlace}
              onChange={(event) =>
                setSearchPlace(event.target.value)
              }
              placeholder="Search another city or location..."
            />

            <button type="submit">
              Search
            </button>
          </form>

          {/* SEARCH HISTORY */}
          {searchHistory.length > 0 && (
            <div className="history-row">
              <div className="history-title">
                Recent
              </div>

              <div className="history-items">
                {searchHistory.map((item) => (
                  <button
                    key={`${item.name}-${item.latitude}`}
                    onClick={() =>
                      selectLocation(item, false)
                    }
                  >
                    • {item.name}
                  </button>
                ))}

                <button
                  className="clear-history"
                  onClick={clearSearchHistory}
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* =================================================
              MAIN WEATHER CARD
          ================================================= */}

          <div className="main-weather-card">
            <div className="main-weather">
              <div className="weather-big-icon">
                {weatherLoading ? "…" : icon}
              </div>

              <div>
                <div className="temperature">
                  {weatherLoading
                    ? "—"
                    : `${Math.round(temperature)}°C`}
                </div>

                <div className="condition">
                  {condition}
                </div>
              </div>
            </div>

            <div className="weather-divider" />

            <div
              className={`anomaly-summary ${anomalyClass}`}
            >
              <div className="anomaly-symbol">
                {anomalyDetected ? "!" : "✓"}
              </div>

              <div>
                <strong>
                  {anomalyLoading
                    ? "Analyzing..."
                    : anomalyTitle}
                </strong>

                <p>
                  {anomalyLoading
                    ? "Checking recent weather patterns."
                    : anomalyDescription}
                </p>
              </div>
            </div>
          </div>

          {/* =================================================
              THREE INFO CARDS
          ================================================= */}

          <div className="three-card-grid">
            <div className="info-card">
              <div className="info-icon">☁</div>

              <div>
                <span>Weather</span>
                <strong>{condition}</strong>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon leaf">
                ◇
              </div>

              <div>
                <span>Climate</span>
                <strong>{climate}</strong>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">
                🌤
              </div>

              <div>
                <span>Type</span>
                <strong>
                  {weatherType}
                </strong>
              </div>
            </div>
          </div>

          {/* =================================================
              RAIN + WIND
          ================================================= */}

          <div className="two-card-grid">
            <div className="metric-card">
              <div className="metric-icon rain-icon">
                💧
              </div>

              <div className="metric-content">
                <span>Rainfall</span>

                <strong>
                  {rainfallLastHour.toFixed(1)} mm
                </strong>

                <small>
                  (Last 1 hour)
                </small>

                <div className="secondary-value">
                  {rainfallToday.toFixed(1)} mm
                  <small> (Today)</small>
                </div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon wind-icon">
                ≋
              </div>

              <div className="metric-content">
                <span>Wind Speed</span>

                <strong>
                  {Math.round(windSpeed)} km/h
                  <em> ({windDirection})</em>
                </strong>

                <small>
                  Max: {Math.round(maxWind)} km/h
                </small>
              </div>
            </div>
          </div>

          {/* =================================================
              TEMPERATURE
          ================================================= */}

          <div className="temperature-card">
            <div className="section-title">
              <span className="temperature-icon">
                ♨
              </span>

              Temperature
            </div>

            <div className="temperature-stats">
              <div>
                <span>Current</span>
                <strong>
                  {temperature !== undefined
                    ? `${Math.round(temperature)}°C`
                    : "—"}
                </strong>
              </div>

              <div>
                <span>Min (Today)</span>
                <strong>
                  {typeof minTemperature === "number"
                    ? `${Math.round(
                        minTemperature
                      )}°C`
                    : "—"}
                </strong>
              </div>

              <div>
                <span>Max (Today)</span>
                <strong>
                  {typeof maxTemperature ===
                  "number"
                    ? `${Math.round(
                        maxTemperature
                      )}°C`
                    : "—"}
                </strong>
              </div>
            </div>
          </div>

          {/* =================================================
              GRAPH
          ================================================= */}

          <div className="graph-card">
            <div className="section-title">
              <span>◈</span>
              Last 24 Hours
              <small>
                (Temperature & Rainfall)
              </small>
            </div>

            {graphLoading ? (
              <div className="graph-empty">
                Loading graph...
              </div>
            ) : (
              <WeatherGraph
                hourlyWeather={hourlyWeather}
              />
            )}
          </div>

        </section>

        {/* ==================================================
            RIGHT MAP
        ================================================== */}

        <section className="map-panel">

          <div className="map-header">
            <div className="map-tabs">
              <button
                className={
                  mapMode === "satellite"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setMapMode("satellite")
                }
              >
                Live Satellite
              </button>

              <button
                className={
                  mapMode === "radar"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setMapMode("radar")
                }
              >
                Radar / Rainfall
              </button>
            </div>
          </div>

          <div className="map-container-wrapper">
            <MapContainer
              center={[latitude, longitude]}
              zoom={5}
              minZoom={3}
              maxZoom={18}
              className="main-map"
              scrollWheelZoom={true}
            >

              <MapMover
                latitude={latitude}
                longitude={longitude}
              />

              <MapClickHandler
                onLocationClick={handleMapClick}
              />

              {/* SATELLITE */}
              {mapMode === "satellite" ? (
                <TileLayer
                  attribution='&copy; Esri, Maxar, Earthstar Geographics'
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  maxZoom={18}
                />
              ) : (
                <>
                  <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    maxZoom={19}
                  />

                  {radarTile && (
                    <TileLayer
                      url={radarTile}
                      opacity={0.72}
                      zIndex={500}
                      attribution='Weather radar &copy; RainViewer'
                      maxZoom={7}
                    />
                  )}
                </>
              )}

              <Marker
                position={[latitude, longitude]}
                icon={locationIcon}
              >
                <Popup>
                  <strong>
                    {selectedLocation.name}
                  </strong>
                  <br />
                  {latitude.toFixed(4)},{" "}
                  {longitude.toFixed(4)}
                </Popup>
              </Marker>

              <LocateButton
                onLocate={async (lat, lon) => {
                  await handleMapClick(lat, lon)
                }}
              />

            </MapContainer>

            {/* MAP INFORMATION */}
            <div className="map-info">
              <span className="map-live-dot" />
              {mapMode === "satellite"
                ? "Satellite imagery"
                : radarTile
                ? "Live radar overlay"
                : "Radar unavailable"}
            </div>

            {/* RADAR LEGEND */}
            {mapMode === "radar" && (
              <div className="rainfall-legend">
                <strong>
                  Rainfall Intensity
                </strong>

                <div className="rainbow-bar" />

                <div className="legend-labels">
                  <span>Light</span>
                  <span>Heavy</span>
                </div>
              </div>
            )}

            {mapMode === "radar" && (
              <div className="radar-credit">
                Weather radar by RainViewer
              </div>
            )}
          </div>
        </section>
      </main>

      {/* ERROR */}
      {error && (
        <div className="global-error">
          {error}
        </div>
      )}
    </div>
  )
}