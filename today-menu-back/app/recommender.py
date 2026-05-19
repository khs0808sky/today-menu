"""
오늘 뭐 먹지? - 메뉴 추천 핵심 로직

LangChain을 사용해서:
1. prompts.py의 템플릿에 사용자 입력을 채우고
2. AI 모델에 보내고
3. JSON 응답을 파싱해서 반환합니다.
"""

import os
import json
from dotenv import load_dotenv

# LangChain - OpenAI 모델 래퍼 (Claude로 바꿀 땐 ChatAnthropic으로만 교체)
from langchain_openai import ChatOpenAI

# LangChain - JSON 출력 파서 (AI 응답 문자열 → 파이썬 딕셔너리 자동 변환)
from langchain_core.output_parsers import JsonOutputParser

# 우리가 만든 프롬프트 템플릿 import
from app.prompts import menu_recommendation_prompt


# ─────────────────────────────────────────────────────────
# [1] 환경변수 로드 (.env에서 OPENAI_API_KEY 읽어옴)
# ─────────────────────────────────────────────────────────
load_dotenv()


# ─────────────────────────────────────────────────────────
# [2] AI 모델 객체 생성
# ─────────────────────────────────────────────────────────
# - 어제 OpenAI 직접 호출과 비교: 더 깔끔하고, 나중에 Claude로 교체 쉬움
# - api_key는 환경변수에서 자동으로 읽어옴 (load_dotenv 덕분)
llm = ChatOpenAI(
    model="gpt-4o-mini",   # 빠르고 저렴한 모델 (테스트용)
    temperature=0.7,        # 응답 다양성: 0(딱딱) ~ 1(창의적). 0.7 = 적당히 다양
)


# ─────────────────────────────────────────────────────────
# [3] 출력 파서: AI 응답(문자열) → 파이썬 딕셔너리로 자동 변환
# ─────────────────────────────────────────────────────────
# - 어제는 응답을 그냥 print 했죠. 오늘은 JSON 파싱까지 자동.
parser = JsonOutputParser()


# ─────────────────────────────────────────────────────────
# [4] 체인 연결 - LangChain의 꽃 🌸
# ─────────────────────────────────────────────────────────
# - `|` (파이프) 연산자로 컴포넌트를 줄줄이 연결합니다.
# - 흐름: 프롬프트(빈칸 채움) → AI 모델(답변 생성) → 파서(JSON으로 변환)
chain = menu_recommendation_prompt | llm | parser


# ─────────────────────────────────────────────────────────
# [5] 메뉴 추천 함수 (외부에서 호출하기 좋게 함수로 감쌈)
# ─────────────────────────────────────────────────────────
def recommend_menu(mood: str, weather: str, location: str) -> dict:
    """
    사용자 입력을 받아 AI 메뉴 추천을 반환합니다.

    Args:
        mood: 사용자의 기분/상황 (예: "비 와서 우울함")
        weather: 현재 날씨 (예: "비, 18도")
        location: 위치 (예: "서울 강남구")

    Returns:
        dict: {"recommendations": [{"name": ..., "reason": ..., "category": ...}, ...]}
    """
    # 체인에 빈칸 값을 채워서 실행
    # invoke()는 {변수명: 값} 딕셔너리 형식으로 받습니다.
    result = chain.invoke({
        "mood": mood,
        "weather": weather,
        "location": location,
    })

    return result


# ─────────────────────────────────────────────────────────
# [6] 이 파일을 직접 실행할 때만 동작하는 테스트 코드
# ─────────────────────────────────────────────────────────
# - python -m app.recommender 로 실행하면 아래 코드 동작
# - 다른 파일에서 import할 땐 아래 코드는 안 돌아감
if __name__ == "__main__":
    print("=" * 60)
    print("🍜 오늘 뭐 먹지? - 메뉴 추천 테스트")
    print("=" * 60)

    # 테스트 케이스
    result = recommend_menu(
        mood="비 와서 우울하고 따뜻한 게 먹고 싶어요",
        weather="비, 18도",
        location="서울 강남구",
    )

    # 결과 출력 (한글이 ascii 인코딩으로 깨지지 않게, 들여쓰기 2칸)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    print("=" * 60)