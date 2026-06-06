// AuthCallback.jsx
// 카카오 로그인 후 돌아오는 페이지
// URL에서 nickname을 꺼내서 부모(App)한테 전달하는 역할

import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

function AuthCallback({ onLogin }) {
  // useSearchParams: URL의 ?nickname=현수 같은 쿼리스트링을 읽는 Hook
  const [searchParams] = useSearchParams();
  // useNavigate: 페이지 이동시켜주는 Hook
  const navigate = useNavigate();

  useEffect(() => {
    const nickname = searchParams.get("nickname"); // URL에서 nickname 꺼내기
    if (nickname) {
      onLogin(nickname); // 부모(App)한테 닉네임 전달
      navigate("/");     // 메인 페이지로 이동
    }
  }, []);

  return <div>로그인 처리 중...</div>;
}

export default AuthCallback;