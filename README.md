# 🍜 오늘 뭐 먹지?

> AI가 추천해주는 오늘의 메뉴 - 기분, 날씨, 위치 기반 음식점 추천 서비스

## 🎯 주요 기능

- 사용자 위치 자동 수집 (카카오맵 API)
- 현재 날씨 정보 반영 (OpenWeatherMap API)
- 기분/상황 질문 기반 AI 메뉴 추천 (Claude API + LangChain)
- 추천 메뉴 → 배달앱 / 지도 바로 연결

## 🛠 기술 스택

**Frontend**
- React

**Backend**
- FastAPI (Python)
- LangChain (프롬프트 관리)

**AI**
- Claude API (Anthropic)

**외부 API**
- 카카오맵 API (위치/지도)
- OpenWeatherMap API (날씨)
- 카카오 OAuth (로그인)

**배포**
- Frontend: Vercel
- Backend: Railway

## 📂 폴더 구조

```
today-menu/
├── app/                    # 백엔드 핵심 로직
│   ├── __init__.py
│   ├── recommender.py      # 메뉴 추천 로직
│   └── prompts.py          # 프롬프트 템플릿
├── hello.py                # 학습용 첫 AI 호출 코드
├── requirements.txt        # 파이썬 패키지 목록
├── .env                    # 환경변수 (git 제외)
└── .gitignore
```

## 🚀 실행 방법 (로컬)

```bash
# 1. 저장소 클론
git clone https://github.com/khs0808sky/today-menu.git
cd today-menu

# 2. 가상환경 생성 및 활성화
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Mac/Linux

# 3. 패키지 설치
pip install -r requirements.txt

# 4. .env 파일 생성 (API 키 입력)
# OPENAI_API_KEY=your-key-here

# 5. 실행 (현재는 학습용 코드만)
python hello.py
```

## 📝 개발 일지

- **Day 1** (2026.05.16): 개발 환경 세팅 + OpenAI API 첫 호출 (`hello.py`)
- **Day 2** (2026.05.17): 프로젝트 구조 잡기 + LangChain 도입

## 👤 작성자

**김현수** - 신입 백엔드/AI 개발자
- 포트폴리오: https://khs0808sky.github.io/portfolio/