import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthCallback from "./AuthCallback";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function ErrorBanner({ error, onClose }) {
  if (!error) return null;
  return (
    <div className="error-banner">
      <span>⚠️ {error}</span>
      <button className="error-close" onClick={onClose}>✕</button>
    </div>
  );
}

function NearbySection({ nearbyPlaces, selectedMenu }) {
  if (!nearbyPlaces) return null;
  return (
    <div className="nearby-section">
      <h3 className="nearby-title">📍 {selectedMenu} 근처 식당</h3>
      {nearbyPlaces.length === 0 ? (
        <p className="nearby-empty">근처 식당을 찾지 못했어요.</p>
      ) : (
        nearbyPlaces.map((place, i) => (
          <a
            key={i}
            href={place.url}
            target="_blank"
            rel="noreferrer"
            className="nearby-card"
          >
            <div className="nearby-name">{place.name}</div>
            <div className="nearby-address">{place.address}</div>
            {place.phone && (
              <div className="nearby-phone">📞 {place.phone}</div>
            )}
            <div className="nearby-link">카카오맵에서 보기 →</div>
          </a>
        ))
      )}
    </div>
  );
}

const MOOD_CHIPS = [
  { emoji: "😢", label: "비 와서 우울", value: "비가 와서 우울해요" },
  { emoji: "🌟", label: "특별한 날", value: "오늘 기념일이에요" },
  { emoji: "💪", label: "운동 후", value: "운동하고 나서 지쳤어요" },
  { emoji: "🤒", label: "몸이 안 좋아", value: "몸이 안 좋고 피곤해요" },
  { emoji: "🎉", label: "기분 최고", value: "오늘 기분이 너무 좋아요" },
];

function MainPage({
  nickname, setNickname,
  mood, setMood,
  weather, setWeather,
  location, setLocation,
  results, setResults,
  loading, setLoading,
  autoLoading, setAutoLoading,
  selectedMood, setSelectedMood,
  nearbyPlaces, setNearbyPlaces,
  nearbyLoading, setNearbyLoading,
  selectedMenu, setSelectedMenu,
  error, setError,
}) {
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
    const res = await fetch(`${API_URL}/weather`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat, lon }),
    });
    const data = await res.json();
    return `${data.description}, ${Math.round(data.temp)}°C`;
  };

  const handleAutoFill = async () => {
    if (!nickname) {
      setError("로그인 후 이용해주세요!");
      setTimeout(() => {
        window.location.href = `${API_URL}/auth/kakao/login`;
      }, 1500); // 1.5초 후 로그인 페이지로 이동
      return;
    }

    try {
      setError(null);
      setAutoLoading(true);
      const { lat, lon } = await getLocation();
      const [weatherText, addressRes] = await Promise.all([
        getWeather(lat, lon),
        fetch(`${API_URL}/address?lat=${lat}&lon=${lon}`),
      ]);
      const addressData = await addressRes.json();
      setWeather(weatherText);
      setLocation(addressData.address);
    } catch (error) {
      setError(error);
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
    if (!nickname) {
      setError("로그인 후 이용해주세요!");
      setTimeout(() => {
        window.location.href = `${API_URL}/auth/kakao/login`;
      }, 1500);
      return;
    }
    setError(null);
    setLoading(true);
    setResults(null);
    setNearbyPlaces(null);
    setSelectedMenu(null);
    try {
      const res = await fetch(`${API_URL}/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood, weather, location }),
      });
      const data = await res.json();
      setResults(data.recommendations);
    } catch {
      setError("서버 연결 실패! FastAPI 서버가 켜져 있는지 확인해주세요.");
    } finally {
      setLoading(false);
    }
  };

  const handleNearby = async (menuName) => {
    if (selectedMenu === menuName && nearbyPlaces) {
      setNearbyPlaces(null);
      setSelectedMenu(null);
      return;
    }
    setSelectedMenu(menuName);
    setNearbyPlaces(null);
    setNearbyLoading(true);
    try {
      const res = await fetch(`${API_URL}/nearby`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menu: menuName, location }),
      });
      const data = await res.json();
      setNearbyPlaces(data.places);
    } catch {
      setError("근처 식당 검색 실패!");
    } finally {
      setNearbyLoading(false);
    }
  };

  const isLoading = loading || autoLoading;

  return (
    <div className="app">
      <ErrorBanner error={error} onClose={() => setError(null)} />

      <header className="app-header">

        {/* 로그인 버튼 / 닉네임 표시 */}
        <div className="auth-bar">
          {nickname ? (
            <div className="auth-user">
              <span className="auth-nickname">👋 {nickname}님</span>
              <button
                className="logout-btn"
                onClick={() => setNickname(null)}
              >
                로그아웃
              </button>
            </div>
          ) : (
            <button
              className="kakao-login-btn"
              onClick={() => window.location.href = `${API_URL}/auth/kakao/login`}
            >
              카카오 로그인
            </button>
          )}
        </div>

        <div className="hero-brand">
          <span className="app-logo">🍜</span>
          <h1 className="app-title">오늘 뭐 먹지?</h1>
          <p className="app-subtitle">AI가 당신의 오늘에 꼭 맞는 메뉴를 추천해드려요</p>
        </div>

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
                <button
                  className={`nearby-btn${selectedMenu === item.name && nearbyPlaces ? " active" : ""}`}
                  onClick={() => handleNearby(item.name)}
                  disabled={nearbyLoading && selectedMenu !== item.name}
                >
                  {nearbyLoading && selectedMenu === item.name
                    ? "검색 중... 🔍"
                    : selectedMenu === item.name && nearbyPlaces
                    ? "📍 식당 목록 닫기"
                    : "📍 근처 식당 보기"}
                </button>
              </div>
            ))}
          </div>
          <NearbySection nearbyPlaces={nearbyPlaces} selectedMenu={selectedMenu} />
        </div>
      )}

      <div className="app-content mobile-only">
        <div className="card">
          <button className="location-btn" onClick={handleAutoFill} disabled={isLoading}>
            {autoLoading ? <span className="spinner" /> : <span className="btn-icon">📍</span>}
            <span>{autoLoading ? "위치와 날씨를 가져오는 중..." : "내 위치와 날씨 자동으로 가져오기"}</span>
          </button>
          {(location || weather) && !autoLoading && (
            <div className="location-info">
              {location && <div className="location-info-item"><span>📍</span><span>{location}</span></div>}
              {weather && <div className="location-info-item"><span>🌤️</span><span>{weather}</span></div>}
            </div>
          )}
        </div>

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

        <button className="recommend-btn" onClick={handleRecommend} disabled={isLoading}>
          {loading ? (
            <><span className="spinner" /><span>AI가 메뉴를 고르는 중...</span></>
          ) : (
            <><span className="recommend-btn-emoji">🍽️</span><span>오늘의 메뉴 추천받기</span></>
          )}
        </button>

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
                  <button
                    className={`nearby-btn${selectedMenu === item.name && nearbyPlaces ? " active" : ""}`}
                    onClick={() => handleNearby(item.name)}
                    disabled={nearbyLoading && selectedMenu !== item.name}
                  >
                    {nearbyLoading && selectedMenu === item.name
                      ? "검색 중... 🔍"
                      : selectedMenu === item.name && nearbyPlaces
                      ? "📍 식당 목록 닫기"
                      : "📍 근처 식당 보기"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <NearbySection nearbyPlaces={nearbyPlaces} selectedMenu={selectedMenu} />
        <div className="bottom-spacer" />
      </div>
    </div>
  );
}

function App() {
  const [nickname, setNickname] = useState(null);
  const [mood, setMood] = useState("");
  const [weather, setWeather] = useState("");
  const [location, setLocation] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [autoLoading, setAutoLoading] = useState(false);
  const [selectedMood, setSelectedMood] = useState(null);
  const [nearbyPlaces, setNearbyPlaces] = useState(null);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [error, setError] = useState(null);

  const props = {
    nickname, setNickname,
    mood, setMood,
    weather, setWeather,
    location, setLocation,
    results, setResults,
    loading, setLoading,
    autoLoading, setAutoLoading,
    selectedMood, setSelectedMood,
    nearbyPlaces, setNearbyPlaces,
    nearbyLoading, setNearbyLoading,
    selectedMenu, setSelectedMenu,
    error, setError,
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallback onLogin={setNickname} />} />
        <Route path="/" element={<MainPage {...props} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;