"""
오늘 뭐 먹지? - FastAPI 서버
"""

from fastapi import FastAPI, HTTPException          # ← HTTPException 추가
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.recommender import recommend_menu
from dotenv import load_dotenv
import os
import httpx                                        # ← httpx 추가
from app.auth import router as auth_router

load_dotenv()

app = FastAPI(title="오늘 뭐 먹지? API")
app.include_router(auth_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 배포 후 Vercel 주소 확인하면 실제 주소로 교체 예정
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────
# 입력 형식 정의 (Pydantic)
# ─────────────────────────────────────────
class RecommendRequest(BaseModel):
    mood: str
    weather: str
    location: str

class WeatherRequest(BaseModel):                   # ← 추가: 날씨 요청 스키마
    lat: float  # 위도
    lon: float  # 경도


# ─────────────────────────────────────────
# 엔드포인트 1: 서버 확인용
# ─────────────────────────────────────────
@app.get("/")
def root():
    return {"message": "오늘 뭐 먹지? 서버 작동 중 🍜"}


# ─────────────────────────────────────────
# 엔드포인트 2: 메뉴 추천
# ─────────────────────────────────────────
@app.post("/recommend")
def recommend(request: RecommendRequest):
    result = recommend_menu(
        mood=request.mood,
        weather=request.weather,
        location=request.location,
    )
    return result


# ─────────────────────────────────────────
# 엔드포인트 3: 좌표 → 동네이름 변환
# ─────────────────────────────────────────
@app.get("/address")
def get_address(lat: float, lon: float):
    import requests

    KAKAO_API_KEY = os.getenv("KAKAO_REST_API_KEY")
    headers = {"Authorization": "KakaoAK " + KAKAO_API_KEY}

    response = requests.get(
        "https://dapi.kakao.com/v2/local/geo/coord2regioncode.json",
        headers=headers,
        params={"x": str(lon), "y": str(lat)},
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


# ─────────────────────────────────────────
# 엔드포인트 4: 날씨 조회 (신규 추가!)  ← 여기서부터 전부 추가
# ─────────────────────────────────────────
@app.post("/weather")
async def get_weather(req: WeatherRequest):
    api_key = os.getenv("OPENWEATHER_API_KEY")

    url = (
        f"https://api.openweathermap.org/data/2.5/weather"
        f"?lat={req.lat}&lon={req.lon}&appid={api_key}&units=metric&lang=kr"
    )

    async with httpx.AsyncClient() as client:
        response = await client.get(url)

    if response.status_code != 200:
        raise HTTPException(status_code=502, detail="날씨 정보를 가져오지 못했어요.")

    data = response.json()

    return {
        "description": data["weather"][0]["description"],  # 예: "맑음", "흐림"
        "temp": data["main"]["temp"],                       # 기온 (섭씨)
        "city": data["name"],                               # 도시명
    }

# 근처 식당 검색 요청 스키마
class NearbyRequest(BaseModel):
    menu: str      # 추천받은 메뉴명 (예: "김치찌개")
    location: str  # 사용자 위치 (예: "경기도 부천시 원미구 중동")

@app.post("/nearby")
async def get_nearby(req: NearbyRequest):
    api_key = os.getenv("KAKAO_REST_API_KEY")

    # "부천시 원미구 중동 김치찌개" 형태로 검색
    query = f"{req.location} {req.menu}"

    url = "https://dapi.kakao.com/v2/local/search/keyword.json"
    headers = {"Authorization": f"KakaoAK {api_key}"}
    params = {
        "query": query,
        "size": 5,          # 최대 5개
        "category_group_code": "FD6",  # 음식점만 필터
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers, params=params)

    if response.status_code != 200:
        raise HTTPException(status_code=502, detail="카카오 장소 검색 실패")

    data = response.json()
    places = data.get("documents", [])

    # 필요한 정보만 추려서 반환
    return {
        "places": [
            {
                "name": p["place_name"],           # 식당명
                "address": p["road_address_name"] or p["address_name"],  # 주소
                "phone": p["phone"],               # 전화번호
                "url": p["place_url"],             # 카카오맵 링크
                "distance": p.get("distance", ""), # 거리 (미터)
            }
            for p in places
        ]
    }