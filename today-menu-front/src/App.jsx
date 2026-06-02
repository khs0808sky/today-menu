import { useState } from "react";

function App() {
  // 사용자 입력값 상태
  const [mood, setMood] = useState("");
  const [weather, setWeather] = useState("");
  const [location, setLocation] = useState("");

  // AI 추천 결과 상태
  const [results, setResults] = useState(null);

  // 로딩 상태 (버튼 눌렀을 때 빙글빙글)
  const [loading, setLoading] = useState(false);

  // 📍 GPS로 위도/경도 가져오는 함수
  const getLocation = () => {
    return new Promise((resolve, reject) => {
      // 브라우저에 GPS 기능이 있는지 확인
      if (!navigator.geolocation) {
        reject("이 브라우저는 위치 기능을 지원하지 않아요.");
        return;
      }

      // GPS 요청 — 브라우저가 "위치 허용하시겠어요?" 팝업 띄움
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,  // 위도 (예: 37.5665)
            lon: position.coords.longitude, // 경도 (예: 126.9780)
          });
        },
        (error) => {
          reject("위치 정보를 가져올 수 없어요. 브라우저 위치 권한을 허용해주세요.");
        }
      );
    });
  };

  // 🌤️ 위도/경도로 날씨 가져오는 함수
  const getWeather = async (lat, lon) => {
    const API_KEY = "e7602eeffdd427783fb5a54fc4f810db";

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=kr`
    );

    const data = await response.json();

    // API 키 오류 또는 응답 이상할 때 처리
    if (!data.weather) {
      throw new Error(`날씨 API 오류: ${data.message || "알 수 없는 오류"}`);
    }

    const desc = data.weather[0].description;
    const temp = Math.round(data.main.temp);

    return `${desc}, ${temp}°C`;
  };
  
  // 🔄 위치 + 날씨 한번에 자동완성하는 함수
  const handleAutoFill = async () => {
    try {
      setLoading(true); // 로딩 시작

      // 1. GPS로 위도/경도 가져오기
      const { lat, lon } = await getLocation();

      // 2. 위도/경도로 날씨 가져오기
      const weatherText = await getWeather(lat, lon);

      // 3. 날씨 input 자동완성
      setWeather(weatherText); // 예: "맑음, 23°C"

      // 4. 백엔드 통해서 좌표 → 동네이름 변환
      const addressResponse = await fetch(
        `http://localhost:8000/address?lat=${lat}&lon=${lon}`
      );
      const addressData = await addressResponse.json();
      setLocation(addressData.address); // 예: "경기도 부천시 원미구 중동"

    } catch (error) {
      alert(error); // getLocation/getWeather에서 reject한 메시지 표시
    } finally {
      setLoading(false); // 로딩 끝
    }
  };

  // 추천 요청 함수
  const handleRecommend = async () => {
    setLoading(true);   // 로딩 시작
    setResults(null);   // 이전 결과 초기화

    try {
      // FastAPI 서버에 POST 요청
      const response = await fetch("http://localhost:8000/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood, weather, location }),
      });

      const data = await response.json();
      setResults(data.recommendations); // 결과 저장

    } catch (error) {
      alert("서버 연결 실패! FastAPI 서버 켜져 있는지 확인해주세요.");
    } finally {
      setLoading(false); // 로딩 끝
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "50px auto", padding: "20px" }}>
      <h1>🍜 오늘 뭐 먹지?</h1>

      {/* 📍 위치/날씨 자동완성 버튼 */}
      <button
        onClick={handleAutoFill}
        disabled={loading}
        style={{
          padding: "10px 20px",
          fontSize: "14px",
          cursor: "pointer",
          backgroundColor: "#FEE500", // 카카오 노란색 느낌으로!
          border: "none",
          borderRadius: "8px",
          marginBottom: "10px",
        }}
      >
        📍 내 위치/날씨 자동으로 가져오기
      </button>

      {/* 입력 폼 */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <input
          placeholder="기분이나 상황 (예: 비 와서 우울해요)"
          value={mood}
          onChange={(e) => setMood(e.target.value)}
          style={{ padding: "10px", fontSize: "16px" }}
        />
        <input
          placeholder="날씨 (예: 흐리고 쌀쌀함)"
          value={weather}
          onChange={(e) => setWeather(e.target.value)}
          style={{ padding: "10px", fontSize: "16px" }}
        />
        <input
          placeholder="위치 (예: 서울 강남구)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          style={{ padding: "10px", fontSize: "16px" }}
        />
        <button
          onClick={handleRecommend}
          disabled={loading}
          style={{ padding: "12px", fontSize: "16px", cursor: "pointer" }}
        >
          {loading ? "추천 중... 🤔" : "메뉴 추천받기 🍽️"}
        </button>
      </div>

      {/* 추천 결과 */}
      {results && (
        <div style={{ marginTop: "30px" }}>
          <h2>추천 메뉴</h2>
          {results.map((item, index) => (
            <div
              key={index}
              style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "15px",
                marginBottom: "10px",
              }}
            >
              <h3>{item.name} ({item.category})</h3>
              <p>{item.reason}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;