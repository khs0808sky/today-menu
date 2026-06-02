"""
오늘 뭐 먹지? - FastAPI 서버

손님(클라이언트)이 메뉴 추천을 요청하면
AI한테 물어보고 결과를 돌려주는 서버예요.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.recommender import recommend_menu
from dotenv import load_dotenv  # ← 추가
import os                        # ← 추가

load_dotenv()  # ← 추가 (.env 파일 읽기)

# FastAPI 앱 생성 (서버 본체)
app = FastAPI(title="오늘 뭐 먹지? API")

# ─────────────────────────────────────────
# CORS 설정 (React에서 이 서버 호출 허용)
# ─────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React 주소
    allow_methods=["*"],   # GET, POST 등 모든 메서드 허용
    allow_headers=["*"],   # 모든 헤더 허용
)

# ─────────────────────────────────────────
# 입력 형식 정의 (Pydantic)
# ─────────────────────────────────────────
# 손님이 보내야 하는 데이터 양식이에요.
# 이 형식 안 맞으면 서버가 자동으로 에러 반환 → 우리가 직접 검증 안 해도 됨!
class RecommendRequest(BaseModel):
    mood: str       # 기분/상황 (예: "비 와서 우울해요")
    weather: str    # 날씨 (예: "흐리고 쌀쌀함")
    location: str   # 위치 (예: "서울 강남구")


# ─────────────────────────────────────────
# 엔드포인트 1: 서버 살아있는지 확인용
# ─────────────────────────────────────────
# GET /  →  브라우저로 바로 접속해서 확인 가능
@app.get("/")
def root():
    return {"message": "오늘 뭐 먹지? 서버 작동 중 🍜"}


# ─────────────────────────────────────────
# 엔드포인트 2: 메뉴 추천 (핵심!)
# ─────────────────────────────────────────
# POST /recommend  →  손님이 기분/날씨/위치 보내면 메뉴 3개 추천
@app.post("/recommend")
def recommend(request: RecommendRequest):
    # request 안에 손님이 보낸 데이터가 담겨있어요
    result = recommend_menu(
        mood=request.mood,
        weather=request.weather,
        location=request.location,
    )
    return result  # AI 추천 결과를 그대로 돌려줌

# ─────────────────────────────────────────
# 엔드포인트 3: 좌표 → 동네이름 변환
# ─────────────────────────────────────────
# GET /address?lat=37.5&lon=126.9  →  "인천 미추홀구" 같은 주소 반환
@app.get("/address")
def get_address(lat: float, lon: float):
    import requests

    # API 키 (영문+숫자만, 앞뒤 공백 제거)
    KAKAO_API_KEY = os.getenv("KAKAO_REST_API_KEY")

    headers = {"Authorization": "KakaoAK " + KAKAO_API_KEY}  # f-string 대신 + 연결

    response = requests.get(
        "https://dapi.kakao.com/v2/local/geo/coord2regioncode.json",
        headers=headers,
        params={"x": str(lon), "y": str(lat)},  # 문자열로 변환
    )

    data = response.json()

    if data.get("documents"):
        region = data["documents"][0]
        address = (
            region["region_1depth_name"] + " " +
            region["region_2depth_name"] + " " +
            region["region_3depth_name"]
        )
        return {"address": address}
    else:
        return {"address": f"{lat:.4f}, {lon:.4f}"}