function App() {
  return (
    <div className="app">
      <header>
        <h1>🌦️ Weather Anomaly AI</h1>
        <p>AI-powered weather anomaly detection</p>
      </header>

      <main>
        <section className="search-box">
          <h2>Check a Location</h2>

          <div className="inputs">
            <input
              type="number"
              placeholder="Latitude"
              defaultValue="28.6139"
            />

            <input
              type="number"
              placeholder="Longitude"
              defaultValue="77.2090"
            />

            <button>Analyze Weather</button>
          </div>
        </section>

        <section className="dashboard">
          <div className="card">
            <h3>🌡️ Temperature</h3>
            <p>-- °C</p>
          </div>

          <div className="card">
            <h3>💧 Humidity</h3>
            <p>-- %</p>
          </div>

          <div className="card">
            <h3>🌧️ Rainfall</h3>
            <p>-- mm</p>
          </div>

          <div className="card">
            <h3>💨 Wind Speed</h3>
            <p>-- km/h</p>
          </div>
        </section>

        <section className="anomaly">
          <h2>🚨 Anomaly Detection</h2>
          <p>No weather analysis yet.</p>
        </section>
      </main>
    </div>
  )
}

export default App