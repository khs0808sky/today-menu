# auth.py - 카카오 OAuth 로그인 처리

import os
import httpx  # 외부 HTTP 요청을 보내는 라이브러리 (requests랑 비슷한데 FastAPI랑 잘 맞음)
from fastapi import APIRouter
from fastapi.responses import RedirectResponse
from dotenv import load_dotenv

load_dotenv()

# APIRouter = FastAPI에서 엔드포인트를 모듈별로 나눌 때 쓰는 것
# 비유: main.py가 본사라면, router는 지점
router = APIRouter()

KAKAO_REST_API_KEY = os.getenv("KAKAO_REST_API_KEY")
KAKAO_REDIRECT_URI = "http://localhost:8000/auth/kakao/callback"

# ① 로그인 버튼 클릭 시 → 카카오 로그인 페이지로 보내기
@router.get("/auth/kakao/login")
def kakao_login():
    kakao_auth_url = (
        f"https://kauth.kakao.com/oauth/authorize"
        f"?client_id={KAKAO_REST_API_KEY}"
        f"&redirect_uri={KAKAO_REDIRECT_URI}"
        f"&response_type=code"
    )
    # RedirectResponse = 브라우저를 다른 URL로 보내버리는 응답
    return RedirectResponse(kakao_auth_url)


# ② 카카오가 인증코드 들고 돌아오는 곳
@router.get("/auth/kakao/callback")
async def kakao_callback(code: str):
    # Step 1: 인증코드 → 액세스 토큰으로 교환
    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            "https://kauth.kakao.com/oauth/token",
            data={
                "grant_type": "authorization_code",
                "client_id": KAKAO_REST_API_KEY,
                "redirect_uri": KAKAO_REDIRECT_URI,
                "code": code,
            },
        )
    token_data = token_response.json()
    access_token = token_data.get("access_token")

    # Step 2: 액세스 토큰 → 사용자 정보 조회
    async with httpx.AsyncClient() as client:
        user_response = await client.get(
            "https://kapi.kakao.com/v2/user/me",
            headers={"Authorization": f"Bearer {access_token}"},
        )
    user_data = user_response.json()

    # 닉네임 꺼내기
    nickname = user_data.get("kakao_account", {}).get("profile", {}).get("nickname", "사용자")

    # Step 3: 프론트로 닉네임 들고 리다이렉트
    return RedirectResponse(f"http://localhost:5173/auth/callback?nickname={nickname}")