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