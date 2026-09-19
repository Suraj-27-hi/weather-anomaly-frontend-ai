import { useEffect, useState } from "react"
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

// --------------------------------------------------
// LEAFLET MARKER FIX
// --------------------------------------------------

delete L.Icon.Default.prototype._getIconUrl

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
})

// --------------------------------------------------
// BACKEND
// --------------------------------------------------

const BACKEND_URL =
  "https://weather-anomaly-backend--duttasayan976.replit.app"

// --------------------------------------------------
// POPULAR LOCATIONS
// --------------------------------------------------

const POPULAR_LOCATIONS = [
  {
    name: "Bengaluru, Karnataka",
    latitude: "12.9716",
    longitude: "77.5946",
  },
  {
    name: "Mumbai, Maharashtra",
    latitude: "19.0760",
    longitude: "72.8777",
  },
  {
    name: "Delhi",
    latitude: "28.6139",
    longitude: "77.2090",
  },
  {
    name: "Chennai, Tamil Nadu",
    latitude: "13.0827",
    longitude: "80.2707",
  },
  {
    name: "Hyderabad, Telangana",
    latitude: "17.3850",
    longitude: "78.4867",
  },
  {
    name: "Kolkata, West Bengal",
    latitude: "22.5726",
    longitude: "88.3639",
  },
  {
    name: "Pune, Maharashtra",
    latitude: "18.5204",
    longitude: "73.8567",
  },
  {
    name: "Patna, Bihar",
    latitude: "25.5941",
    longitude: "85.1376",
  },
  {
    name: "Jaipur, Rajasthan",
    latitude: "26.9124",
    longitude: "75.7873",
  },
]

// --------------------------------------------------
// MAP CLICK HANDLER
// --------------------------------------------------

function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(event) {
      onLocationSelect(event.latlng.lat, event.latlng.lng)
    },
  })

  return null
}

// --------------------------------------------------
// MOVE MAP
// --------------------------------------------------

function MapMover({ latitude, longitude }) {
  const map = useMap()

  useEffect(() => {
    if (
      Number.isFinite(Number(latitude)) &&
      Number.isFinite(Number(longitude))
    ) {
      map.flyTo(
        [Number(latitude), Number(longitude)],
        10,
        {
          duration: 1,
        }
      )
    }
  }, [latitude, longitude, map])

  return null
}

// --------------------------------------------------
// WEATHER CONDITION
// --------------------------------------------------

function getWeatherCondition(code) {
  const conditions = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow",
    73: "Moderate snow",
    75: "Heavy snow",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
  }

  return conditions[code] || "Unknown"
}

// --------------------------------------------------
// WEATHER ICON
// --------------------------------------------------

function getWeatherIcon(code) {
  if (code === 0) return "☀️"
  if (code === 1 || code === 2) return "🌤️"
  if (code === 3) return "☁️"
  if ([45, 48].includes(code)) return "🌫️"
  if ([51, 53, 55, 56, 57].includes(code)) return "🌦️"
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "🌧️"
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "❄️"
  if ([95, 96, 99].includes(code)) return "⛈️"

  return "🌡️"
}

// --------------------------------------------------
// MAIN APP
// --------------------------------------------------

function App() {
  // ------------------------------------------------
  // LOCATION
  // ------------------------------------------------

  const [latitude, setLatitude] = useState("12.9716")
  const [longitude, setLongitude] = useState("77.5946")

  const [selectedLocation, setSelectedLocation] = useState({
    name: "Bengaluru, Karnataka",
    latitude: "12.9716",
    longitude: "77.5946",
  })

  const [searchPlace, setSearchPlace] = useState("")

  // ------------------------------------------------
  // WEATHER
  // ------------------------------------------------

  const [weather, setWeather] = useState(null)
  const [weatherLoading, setWeatherLoading] = useState(false)

  // ------------------------------------------------
  // GRAPH
  // ------------------------------------------------

  const [hourlyWeather, setHourlyWeather] = useState(null)
  const [graphLoading, setGraphLoading] = useState(false)
  const [graphType, setGraphType] = useState("temperature")

  // ------------------------------------------------
  // ANOMALY
  // ------------------------------------------------

  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  // ------------------------------------------------
  // ERROR
  // ------------------------------------------------

  const [error, setError] = useState("")

  // ------------------------------------------------
  // SEARCH HISTORY
  // ------------------------------------------------

  const [searchHistory, setSearchHistory] = useState(() => {
    try {
      const saved = localStorage.getItem("weatherSearchHistory")

      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // ------------------------------------------------
  // SAVE SEARCH HISTORY
  // ------------------------------------------------

  const saveSearchHistory = (location) => {
    setSearchHistory((previous) => {
      const filtered = previous.filter(
        (item) => item.name !== location.name
      )

      const updated = [location, ...filtered].slice(0, 6)

      localStorage.setItem(
        "weatherSearchHistory",
        JSON.stringify(updated)
      )

      return updated
    })
  }

  // ------------------------------------------------
  // CLEAR HISTORY
  // ------------------------------------------------

  const clearSearchHistory = () => {
    localStorage.removeItem("weatherSearchHistory")
    setSearchHistory([])
  }

  // ------------------------------------------------
  // FETCH CURRENT WEATHER
  // ------------------------------------------------

  const fetchCurrentWeather = async (lat, lon) => {
    try {
      setWeatherLoading(true)

      const url =
        `https://api.open-meteo.com/v1/forecast` +
        `?latitude=${lat}` +
        `&longitude=${lon}` +
        `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,visibility` +
        `&timezone=auto`

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error("Weather request failed")
      }

      const data = await response.json()

      setWeather(data)
    } catch (err) {
      console.error(err)
      setError("Unable to load current weather.")
    } finally {
      setWeatherLoading(false)
    }
  }

  // ------------------------------------------------
  // FETCH HOURLY WEATHER
  // ------------------------------------------------

  const fetchHourlyWeather = async (lat, lon) => {
    try {
      setGraphLoading(true)

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

      setHourlyWeather(data)
    } catch (err) {
      console.error(err)
      setError("Unable to load weather graph.")
    } finally {
      setGraphLoading(false)
    }
  }

  // ------------------------------------------------
  // LOAD WEATHER
  // ------------------------------------------------

  const loadWeather = async (lat, lon) => {
    setError("")

    await Promise.all([
      fetchCurrentWeather(lat, lon),
      fetchHourlyWeather(lat, lon),
    ])
  }

  // ------------------------------------------------
  // SELECT LOCATION
  // ------------------------------------------------

  const selectLocation = (location, saveHistory = true) => {
    setLatitude(String(location.latitude))
    setLongitude(String(location.longitude))

    setSelectedLocation({
      name: location.name,
      latitude: String(location.latitude),
      longitude: String(location.longitude),
    })

    setResult(null)

    loadWeather(
      Number(location.latitude),
      Number(location.longitude)
    )

    if (saveHistory) {
      saveSearchHistory(location)
    }
  }

  // ------------------------------------------------
  // MAP LOCATION CLICK
  // ------------------------------------------------

  const handleMapLocation = async (lat, lon) => {
    setLatitude(String(lat))
    setLongitude(String(lon))

    setResult(null)
    setError("")

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
        address.county ||
        "Selected location"

      const state = address.state || ""

      const name = state
        ? `${city}, ${state}`
        : city

      const location = {
        name,
        latitude: String(lat),
        longitude: String(lon),
      }

      setSelectedLocation(location)

      await loadWeather(lat, lon)
    } catch (err) {
      console.error(err)

      const location = {
        name: "Selected location",
        latitude: String(lat),
        longitude: String(lon),
      }

      setSelectedLocation(location)

      await loadWeather(lat, lon)
    }
  }

  // ------------------------------------------------
  // SEARCH LOCATION
  // ------------------------------------------------

  const searchLocation = async () => {
    const query = searchPlace.trim()

    if (!query) {
      return
    }

    try {
      setError("")

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&limit=1`
      )

      const data = await response.json()

      if (!data.length) {
        setError("Location not found.")
        return
      }

      const place = data[0]

      const location = {
        name: place.display_name
          .split(",")
          .slice(0, 2)
          .join(",")
          .trim(),

        latitude: place.lat,
        longitude: place.lon,
      }

      selectLocation(location)
      setSearchPlace("")
    } catch (err) {
      console.error(err)
      setError("Unable to search for this location.")
    }
  }

  // ------------------------------------------------
  // SEARCH ENTER KEY
  // ------------------------------------------------

  const handleSearchKeyDown = (event) => {
    if (event.key === "Enter") {
      searchLocation()
    }
  }

  // ------------------------------------------------
  // ANOMALY ANALYSIS
  // ------------------------------------------------

  const analyzeWeather = async () => {
    try {
      setLoading(true)
      setError("")

      const response = await fetch(
        `${BACKEND_URL}/api/weather/analyze?latitude=${latitude}&longitude=${longitude}`
      )

      if (!response.ok) {
        throw new Error("Analysis request failed")
      }

      const data = await response.json()

      setResult(data)
    } catch (err) {
      console.error(err)
      setError("Unable to analyze weather right now.")
    } finally {
      setLoading(false)
    }
  }

  // ------------------------------------------------
  // INITIAL WEATHER LOAD
  // ------------------------------------------------

  useEffect(() => {
    loadWeather(
      Number(latitude),
      Number(longitude)
    )
  }, [])

  // ------------------------------------------------
  // WEATHER DATA
  // ------------------------------------------------

  const current = weather?.current

  const temperature = current?.temperature_2m
  const humidity = current?.relative_humidity_2m
  const apparentTemperature = current?.apparent_temperature
  const precipitation = current?.precipitation
  const weatherCode = current?.weather_code
  const cloudCover = current?.cloud_cover
  const pressure = current?.pressure_msl
  const windSpeed = current?.wind_speed_10m
  const windDirection = current?.wind_direction_10m
  const visibility = current?.visibility

  // ------------------------------------------------
  // WIND DIRECTION
  // ------------------------------------------------

  const getWindDirection = (degrees) => {
    if (degrees === undefined || degrees === null) {
      return "--"
    }

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

    const index = Math.round(degrees / 45) % 8

    return directions[index]
  }

  // ------------------------------------------------
  // GRAPH DATA
  // ------------------------------------------------

  const graphTimes =
    hourlyWeather?.hourly?.time || []

  const graphTemperatures =
    hourlyWeather?.hourly?.temperature_2m || []

  const graphRainfall =
    hourlyWeather?.hourly?.precipitation || []

  const graphValues =
    graphType === "temperature"
      ? graphTemperatures
      : graphRainfall

  const maxGraphValue =
    graphValues.length > 0
      ? Math.max(...graphValues)
      : 1

  // ------------------------------------------------
  // ANOMALY INFORMATION
  // ------------------------------------------------

  const anomalies = result?.anomalies || []

  const hasAnomaly = anomalies.length > 0

  const latestAnomaly =
    anomalies.length > 0
      ? anomalies[anomalies.length - 1]
      : null

  // ------------------------------------------------
  // RENDER
  // ------------------------------------------------

  return (
    <div className="app">
      {/* ------------------------------------------ */}
      {/* TOP BAR */}
      {/* ------------------------------------------ */}

      <header className="topbar">
        <div>
          <h1>Weather Anomaly AI</h1>

          <p>
            Detect unusual weather conditions using
            real-time data.
          </p>
        </div>

        <div className="live-status">
          <span className="live-dot"></span>
          Live Data
        </div>
      </header>

      {/* ------------------------------------------ */}
      {/* MAIN */}
      {/* ------------------------------------------ */}

      <main className="main-layout">

        {/* ======================================== */}
        {/* LEFT PANEL */}
        {/* ======================================== */}

        <section className="left-panel">

          {/* LOCATION */}
          <div className="section">
            <div className="section-title">
              Location
            </div>

            <div className="location-name">
              {selectedLocation.name}
            </div>

            <div className="coordinates">
              {Number(latitude).toFixed(4)},{" "}
              {Number(longitude).toFixed(4)}
            </div>

            {/* SEARCH */}
            <div className="search-box">
              <input
                type="text"
                placeholder="Search city or location..."
                value={searchPlace}
                onChange={(event) =>
                  setSearchPlace(event.target.value)
                }
                onKeyDown={handleSearchKeyDown}
              />

              <button onClick={searchLocation}>
                Search
              </button>
            </div>

            {/* POPULAR LOCATIONS */}
            <div className="quick-locations">
              <div className="small-label">
                Popular Locations
              </div>

              <div className="quick-location-list">
                {POPULAR_LOCATIONS.map((location) => (
                  <button
                    key={location.name}
                    className="quick-location-button"
                    onClick={() =>
                      selectLocation(location)
                    }
                  >
                    {location.name}
                  </button>
                ))}
              </div>
            </div>

            {/* SEARCH HISTORY */}
            <div className="history-section">
              <div className="history-header">
                <span className="small-label">
                  Recent Searches
                </span>

                {searchHistory.length > 0 && (
                  <button
                    className="clear-history"
                    onClick={clearSearchHistory}
                  >
                    Clear
                  </button>
                )}
              </div>

              {searchHistory.length === 0 ? (
                <p className="history-empty">
                  No recent searches.
                </p>
              ) : (
                <div className="history-list">
                  {searchHistory.map(
                    (location, index) => (
                      <button
                        key={`${location.name}-${index}`}
                        className="history-point"
                        onClick={() =>
                          selectLocation(location)
                        }
                      >
                        <span className="history-dot">
                          •
                        </span>

                        <span>
                          {location.name}
                        </span>
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          </div>

          {/* CURRENT WEATHER */}
          <div className="section weather-card">
            <div className="section-title">
              Current Weather
            </div>

            {weatherLoading ? (
              <div className="loading">
                Loading weather...
              </div>
            ) : current ? (
              <>
                <div className="weather-main">
                  <div className="weather-icon">
                    {getWeatherIcon(weatherCode)}
                  </div>

                  <div>
                    <div className="temperature">
                      {Math.round(temperature)}°C
                    </div>

                    <div className="condition">
                      {getWeatherCondition(
                        weatherCode
                      )}
                    </div>
                  </div>
                </div>

                <div className="weather-summary">
                  Feels like{" "}
                  <strong>
                    {Math.round(
                      apparentTemperature
                    )}°C
                  </strong>
                </div>

                <div className="weather-grid">
                  <div>
                    <span>Humidity</span>
                    <strong>{humidity}%</strong>
                  </div>

                  <div>
                    <span>Rainfall</span>
                    <strong>
                      {precipitation} mm
                    </strong>
                  </div>

                  <div>
                    <span>Wind</span>
                    <strong>
                      {windSpeed} km/h
                    </strong>
                  </div>

                  <div>
                    <span>Pressure</span>
                    <strong>
                      {pressure} hPa
                    </strong>
                  </div>
                </div>
              </>
            ) : (
              <div className="empty">
                No weather data.
              </div>
            )}
          </div>

          {/* ANOMALY */}
          <div className="section anomaly-card">
            <div className="section-header-row">
              <div className="section-title">
                Anomaly Detection
              </div>

              <button
                className="analyze-button"
                onClick={analyzeWeather}
                disabled={loading}
              >
                {loading
                  ? "Analyzing..."
                  : "Analyze"}
              </button>
            </div>

            {!result ? (
              <div className="anomaly-placeholder">
                Analyze the current location to detect
                unusual weather conditions.
              </div>
            ) : (
              <>
                <div
                  className={`anomaly-status ${
                    hasAnomaly
                      ? "detected"
                      : "normal"
                  }`}
                >
                  <span className="status-dot"></span>

                  {hasAnomaly
                    ? "ANOMALY DETECTED"
                    : "NORMAL"}
                </div>

                {latestAnomaly && (
                  <div className="anomaly-details">
                    <div className="anomaly-row">
                      <span>Type</span>
                      <strong>
                        {latestAnomaly.metric}
                      </strong>
                    </div>

                    <div className="anomaly-row">
                      <span>Current Value</span>
                      <strong>
                        {latestAnomaly.value}{" "}
                        {latestAnomaly.unit}
                      </strong>
                    </div>

                    <div className="anomaly-row">
                      <span>Expected Mean</span>
                      <strong>
                        {latestAnomaly.expectedMean}{" "}
                        {latestAnomaly.unit}
                      </strong>
                    </div>

                    <div className="anomaly-row">
                      <span>Severity</span>
                      <strong>
                        {latestAnomaly.severity}
                      </strong>
                    </div>

                    <p className="anomaly-explanation">
                      {latestAnomaly.explanation}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* WEATHER DETAILS */}
          <div className="section">
            <div className="section-title">
              Weather Details
            </div>

            <div className="details-grid">
              <div className="detail-item">
                <span>Temperature</span>
                <strong>
                  {temperature ?? "--"}°C
                </strong>
              </div>

              <div className="detail-item">
                <span>Humidity</span>
                <strong>
                  {humidity ?? "--"}%
                </strong>
              </div>

              <div className="detail-item">
                <span>Wind Speed</span>
                <strong>
                  {windSpeed ?? "--"} km/h
                </strong>
              </div>

              <div className="detail-item">
                <span>Wind Direction</span>
                <strong>
                  {getWindDirection(
                    windDirection
                  )}
                </strong>
              </div>

              <div className="detail-item">
                <span>Cloud Cover</span>
                <strong>
                  {cloudCover ?? "--"}%
                </strong>
              </div>

              <div className="detail-item">
                <span>Visibility</span>
                <strong>
                  {visibility
                    ? `${(
                        visibility / 1000
                      ).toFixed(1)} km`
                    : "--"}
                </strong>
              </div>
            </div>
          </div>

          {/* GRAPH */}
          <div className="section">
            <div className="section-header-row">
              <div className="section-title">
                Last 24 Hours
              </div>

              <div className="graph-switch">
                <button
                  className={
                    graphType === "temperature"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setGraphType("temperature")
                  }
                >
                  Temperature
                </button>

                <button
                  className={
                    graphType === "rainfall"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setGraphType("rainfall")
                  }
                >
                  Rainfall
                </button>
              </div>
            </div>

            {graphLoading ? (
              <div className="loading">
                Loading graph...
              </div>
            ) : graphValues.length > 0 ? (
              <div className="graph">
                {graphValues.map(
                  (value, index) => {
                    const height =
                      maxGraphValue > 0
                        ? Math.max(
                            6,
                            (value /
                              maxGraphValue) *
                              100
                          )
                        : 6

                    return (
                      <div
                        className="graph-column"
                        key={`${graphTimes[index]}-${index}`}
                        title={`${value}${
                          graphType ===
                          "temperature"
                            ? " °C"
                            : " mm"
                        }`}
                      >
                        <div
                          className="graph-bar"
                          style={{
                            height: `${height}%`,
                          }}
                        />

                        {index %
                          Math.max(
                            1,
                            Math.floor(
                              graphValues.length /
                                6
                            )
                          ) ===
                          0 && (
                          <span className="graph-time">
                            {new Date(
                              graphTimes[index]
                            ).getHours()}
                            :00
                          </span>
                        )}
                      </div>
                    )
                  }
                )}
              </div>
            ) : (
              <div className="empty">
                No graph data.
              </div>
            )}
          </div>

          {/* ERROR */}
          {error && (
            <div className="error-box">
              {error}
            </div>
          )}
        </section>

        {/* ======================================== */}
        {/* RIGHT MAP */}
        {/* ======================================== */}

        <section className="map-section">

          <div className="map-header">
            <div>
              <h2>Weather Map</h2>

              <p>
                Click anywhere on the map to inspect
                another location.
              </p>
            </div>
          </div>

          <div className="map-wrapper">
            <MapContainer
              center={[
                Number(latitude),
                Number(longitude),
              ]}
              zoom={10}
              scrollWheelZoom={true}
              className="map"
            >
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MapMover
                latitude={latitude}
                longitude={longitude}
              />

              <MapClickHandler
                onLocationSelect={
                  handleMapLocation
                }
              />

              <Marker
                position={[
                  Number(latitude),
                  Number(longitude),
                ]}
              >
                <Popup>
                  <strong>
                    {selectedLocation.name}
                  </strong>

                  <br />

                  {Number(latitude).toFixed(4)},{" "}
                  {Number(longitude).toFixed(4)}

                  {current && (
                    <>
                      <br />
                      {Math.round(
                        temperature
                      )}
                      °C —{" "}
                      {getWeatherCondition(
                        weatherCode
                      )}
                    </>
                  )}
                </Popup>
              </Marker>
            </MapContainer>

            <div className="map-info">
              <div>
                <span>Location</span>
                <strong>
                  {selectedLocation.name}
                </strong>
              </div>

              <div>
                <span>Coordinates</span>
                <strong>
                  {Number(latitude).toFixed(4)},{" "}
                  {Number(longitude).toFixed(4)}
                </strong>
              </div>

              {current && (
                <div>
                  <span>Current</span>
                  <strong>
                    {Math.round(temperature)}°C
                  </strong>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App