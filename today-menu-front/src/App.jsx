import { useState } from "react";
import "./App.css";

const MOOD_CHIPS = [
  { emoji: "😢", label: "비 와서 우울", value: "비가 와서 우울해요" },
  { emoji: "🌟", label: "특별한 날", value: "오늘 기념일이에요" },
  { emoji: "💪", label: "운동 후", value: "운동하고 나서 지쳤어요" },
  { emoji: "🤒", label: "몸이 안 좋아", value: "몸이 안 좋고 피곤해요" },
  { emoji: "🎉", label: "기분 최고", value: "오늘 기분이 너무 좋아요" },
];

function App() {
  const [mood, setMood] = useState("");
  const [weather, setWeather] = useState("");
  const [location, setLocation] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [autoLoading, setAutoLoading] = useState(false);
  const [selectedMood, setSelectedMood] = useState(null);

  const getLocation = () =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject("이 브라우저는 위치 기능을 지원하지 않아요.");
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => reject("위치 정보를 가져올 수 없어요. 브라우저 위치 권한을 허용해주세요.")
      );
    });

  const getWeather = async (lat, lon) => {
    const res = await fetch("http://localhost:8000/weather", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat, lon }),
    });
    const data = await res.json();
    return `${data.description}, ${Math.round(data.temp)}°C`;
  };

  const handleAutoFill = async () => {
    try {
      setAutoLoading(true);
      const { lat, lon } = await getLocation();
      const [weatherText, addressRes] = await Promise.all([
        getWeather(lat, lon),
        fetch(`http://localhost:8000/address?lat=${lat}&lon=${lon}`),
      ]);
      const addressData = await addressRes.json();
      setWeather(weatherText);
      setLocation(addressData.address);
    } catch (error) {
      alert(error);
    } finally {
      setAutoLoading(false);
    }
  };

  const handleMoodChip = (chip) => {
    if (selectedMood === chip.value) {
      setSelectedMood(null);
      setMood("");
    } else {
      setSelectedMood(chip.value);
      setMood(chip.value);
    }
  };

  const handleMoodInput = (e) => {
    setMood(e.target.value);
    setSelectedMood(null);
  };

  const handleRecommend = async () => {
    setLoading(true);
    setResults(null);
    try {
      const res = await fetch("http://localhost:8000/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood, weather, location }),
      });
      const data = await res.json();
      setResults(data.recommendations);
    } catch {
      alert("서버 연결 실패! FastAPI 서버가 켜져 있는지 확인해주세요.");
    } finally {
      setLoading(false);
    }
  };

  const isLoading = loading || autoLoading;

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        {/* Brand area — visible on both */}
        <div className="hero-brand">
          <span className="app-logo">🍜</span>
          <h1 className="app-title">오늘 뭐 먹지?</h1>
          <p className="app-subtitle">AI가 당신의 오늘에 꼭 맞는 메뉴를 추천해드려요</p>
        </div>

        {/* PC-only inline form inside hero */}
        <div className="pc-hero-form">
          <div className="pc-inputs-row">
            <div className="pc-input-card">
              <label className="pc-input-label">💭 기분 / 상황</label>
              <input
                className="pc-input-field"
                placeholder="예: 비 와서 우울해요"
                value={mood}
                onChange={handleMoodInput}
              />
              <div className="chips pc-chips">
                {MOOD_CHIPS.map((chip) => (
                  <button
                    key={chip.value}
                    className={`chip${selectedMood === chip.value ? " active" : ""}`}
                    onClick={() => handleMoodChip(chip)}
                  >
                    {chip.emoji} {chip.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pc-input-card">
              <label className="pc-input-label">🌤️ 날씨</label>
              <input
                className="pc-input-field"
                placeholder="예: 맑고 더워요, 비가 와요"
                value={weather}
                onChange={(e) => setWeather(e.target.value)}
              />
            </div>

            <div className="pc-input-card">
              <label className="pc-input-label">🗺️ 위치</label>
              <input
                className="pc-input-field"
                placeholder="예: 서울 강남구, 부산 해운대"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>

          <div className="pc-form-actions">
            <button className="pc-autofill-btn" onClick={handleAutoFill} disabled={isLoading}>
              {autoLoading ? <span className="spinner" /> : <span>📍</span>}
              <span>{autoLoading ? "위치·날씨 가져오는 중..." : "위치·날씨 자동"}</span>
            </button>
            <button className="pc-recommend-btn" onClick={handleRecommend} disabled={isLoading}>
              {loading ? (
                <>
                  <span className="spinner spinner-orange" />
                  <span>AI가 메뉴를 고르는 중...</span>
                </>
              ) : (
                <>
                  <span className="recommend-btn-emoji">🍽️</span>
                  <span>오늘의 메뉴 추천받기</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* PC-only results (3-column grid) */}
      {results && (
        <div className="pc-results-section">
          <div className="results-header pc-results-header">
            <h2 className="results-title">✨ 오늘의 추천 메뉴</h2>
            <p className="results-subtitle">AI가 당신의 상황에 맞게 골라드렸어요</p>
          </div>
          <div className="pc-results-grid">
            {results.map((item, index) => (
              <div
                key={index}
                className={`pc-result-card rank-${index + 1}`}
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <div className={`pc-result-num rank-${index + 1}`}>
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div className="result-top pc-result-top">
                  <h3 className="result-name">{item.name}</h3>
                  <span className="result-category">{item.category}</span>
                </div>
                <p className="result-reason">{item.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mobile-only content */}
      <div className="app-content mobile-only">
        {/* Location auto-fill */}
        <div className="card">
          <button
            className="location-btn"
            onClick={handleAutoFill}
            disabled={isLoading}
          >
            {autoLoading ? (
              <span className="spinner" />
            ) : (
              <span className="btn-icon">📍</span>
            )}
            <span>
              {autoLoading ? "위치와 날씨를 가져오는 중..." : "내 위치와 날씨 자동으로 가져오기"}
            </span>
          </button>

          {(location || weather) && !autoLoading && (
            <div className="location-info">
              {location && (
                <div className="location-info-item">
                  <span>📍</span>
                  <span>{location}</span>
                </div>
              )}
              {weather && (
                <div className="location-info-item">
                  <span>🌤️</span>
                  <span>{weather}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input fields */}
        <div className="card input-section">
          <div className="input-group">
            <label className="input-label">지금 기분이나 상황</label>
            <div className="input-wrapper">
              <span className="input-icon">💭</span>
              <input
                className="input-field"
                placeholder="예: 비 와서 우울해요, 오늘 기분 최고야"
                value={mood}
                onChange={handleMoodInput}
              />
            </div>
            <div className="chips">
              {MOOD_CHIPS.map((chip) => (
                <button
                  key={chip.value}
                  className={`chip${selectedMood === chip.value ? " active" : ""}`}
                  onClick={() => handleMoodChip(chip)}
                >
                  {chip.emoji} {chip.label}
                </button>
              ))}
            </div>
          </div>

          <div className="input-divider" />

          <div className="input-group">
            <label className="input-label">날씨</label>
            <div className="input-wrapper">
              <span className="input-icon">🌤️</span>
              <input
                className="input-field"
                placeholder="예: 맑고 더워요, 비가 와요"
                value={weather}
                onChange={(e) => setWeather(e.target.value)}
              />
            </div>
          </div>

          <div className="input-divider" />

          <div className="input-group">
            <label className="input-label">위치</label>
            <div className="input-wrapper">
              <span className="input-icon">🗺️</span>
              <input
                className="input-field"
                placeholder="예: 서울 강남구, 부산 해운대"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Recommend button */}
        <button
          className="recommend-btn"
          onClick={handleRecommend}
          disabled={isLoading}
        >
          {loading ? (
            <>
              <span className="spinner" />
              <span>AI가 메뉴를 고르는 중...</span>
            </>
          ) : (
            <>
              <span className="recommend-btn-emoji">🍽️</span>
              <span>오늘의 메뉴 추천받기</span>
            </>
          )}
        </button>

        {/* Mobile results */}
        {results && (
          <div className="results-section">
            <div className="results-header">
              <h2 className="results-title">✨ 오늘의 추천 메뉴</h2>
              <p className="results-subtitle">AI가 당신의 상황에 맞게 골라드렸어요</p>
            </div>
            {results.map((item, index) => (
              <div
                key={index}
                className={`result-card rank-${index + 1}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`result-rank rank-${index + 1}`}>{index + 1}</div>
                <div className="result-content">
                  <div className="result-top">
                    <h3 className="result-name">{item.name}</h3>
                    <span className="result-category">{item.category}</span>
                  </div>
                  <p className="result-reason">{item.reason}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bottom-spacer" />
      </div>
    </div>
  );
}

export default App;
