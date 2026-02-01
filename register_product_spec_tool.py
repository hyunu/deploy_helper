#!/usr/bin/env python3
"""
제품명세서 편집툴 공개 페이지 등록 스크립트
"""
import requests
import json
import sys

# 설정
API_BASE_URL = "http://localhost:8000"
ADMIN_EMAIL = "admin@company.com"
ADMIN_PASSWORD = "admin123"

# 로그인하여 토큰 획득
def get_auth_token():
    login_url = f"{API_BASE_URL}/api/auth/login"
    login_data = {
        "username": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    }
    
    response = requests.post(login_url, data=login_data)
    if response.status_code != 200:
        print(f"로그인 실패: {response.status_code}")
        print(response.text)
        sys.exit(1)
    
    token = response.json()["access_token"]
    return token

# 앱 등록
def register_app(token):
    app_data = {
        "app_id": "com.dxi.product-spec-editor",
        "name": "제품명세서 편집툴",
        "description": "DX 인터페이스 환경에서 제품의 모니터링 및 컨트롤 항목, 권한 정보, 사전 설정 규칙을 정의하는 문서를 작성하기 위한 소프트웨어",
        "is_public": True,
        "detail_html": """<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">

<div class="product-spec-editor-page">
  <!-- 히어로 섹션 -->
  <section class="hero-section">
    <div class="hero-background">
      <div class="hero-gradient"></div>
      <div class="hero-pattern"></div>
    </div>
    <div class="container">
      <div class="hero-content">
        <div class="hero-icon-wrapper">
          <span class="material-symbols-rounded hero-icon">straighten</span>
        </div>
        <h1 class="hero-title">
          <span class="title-highlight">제품명세서</span> 편집툴
        </h1>
        <p class="hero-subtitle">
          DX 인터페이스 환경에서 제품의 모니터링 및 컨트롤 항목, 권한 정보, 사전 설정 규칙을 정의하는 문서를 작성하기 위한 소프트웨어
        </p>
        <div class="hero-badges">
          <span class="badge badge-primary">
            <span class="material-symbols-rounded badge-icon">palette</span>
            UI 기반 편집
          </span>
          <span class="badge badge-secondary">
            <span class="material-symbols-rounded badge-icon">link</span>
            JSON 연동
          </span>
          <span class="badge badge-accent">
            <span class="material-symbols-rounded badge-icon">language</span>
            다국어 지원
          </span>
        </div>
      </div>
    </div>
  </section>

  <!-- 개요 섹션 -->
  <section class="overview-section">
    <div class="container">
      <div class="overview-card">
        <span class="material-symbols-rounded overview-icon">auto_awesome</span>
        <h2 class="overview-title">개요</h2>
        <p class="overview-text">
          제품명세서 편집툴은 <strong>UI 기반 편집</strong>과 <strong>JSON 연동</strong>을 지원하여 
          사용자가 직관적으로 명세서를 작성하고 관리할 수 있도록 설계된 전문 소프트웨어입니다.
        </p>
      </div>
    </div>
  </section>

  <!-- 주요 기능 섹션 -->
  <section class="features-section">
    <div class="container">
      <div class="section-header">
        <h2 class="section-title">
          <span class="title-decoration"></span>
          주요 기능
          <span class="title-decoration"></span>
        </h2>
        <p class="section-subtitle">강력하고 직관적인 기능으로 효율적인 명세서 작성</p>
      </div>
      
      <!-- UI 구성 및 JSON 연동 -->
      <div class="feature-card feature-card-primary">
        <div class="feature-header">
          <div class="feature-icon-wrapper">
            <span class="material-symbols-rounded feature-icon">palette</span>
          </div>
          <h3 class="feature-title">UI 구성 및 JSON 연동</h3>
        </div>
        <div class="feature-content">
          <p class="feature-intro">4개 구역으로 구성된 직관적인 인터페이스</p>
          <div class="feature-grid">
            <div class="feature-item">
              <span class="material-symbols-rounded feature-item-icon">description</span>
              <div class="feature-item-content">
                <h4 class="feature-item-title">명세서 1레벨 항목</h4>
                <p>제품명세서를 구성하는 대항목을 구분하는 단위입니다.</p>
              </div>
            </div>
            <div class="feature-item">
              <span class="material-symbols-rounded feature-item-icon">settings</span>
              <div class="feature-item-content">
                <h4 class="feature-item-title">명세서 관리</h4>
                <p>새로운 명세서 작성, 기존 명세서 편집, 자동 점검, 파일 추출 기능 제공</p>
              </div>
            </div>
            <div class="feature-item">
              <span class="material-symbols-rounded feature-item-icon">edit</span>
              <div class="feature-item-content">
                <h4 class="feature-item-title">명세서 UI 편집창</h4>
                <p>1레벨 항목 선택 시 해당 내용이 편집창에 반영되며, 입력 내용이 자동으로 JSON 형식으로 변환됩니다.</p>
              </div>
            </div>
            <div class="feature-item">
              <span class="material-symbols-rounded feature-item-icon">code</span>
              <div class="feature-item-content">
                <h4 class="feature-item-title">명세서 JSON 편집창</h4>
                <p>수동으로 JSON을 편집할 수 있으며, 변경 사항은 [새로읽기] 버튼을 통해 UI에 반영해야 합니다.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 명세서 구성 항목 -->
      <div class="feature-card feature-card-secondary">
        <div class="feature-header">
          <div class="feature-icon-wrapper">
            <span class="material-symbols-rounded feature-icon">list</span>
          </div>
          <h3 class="feature-title">명세서 구성 항목</h3>
        </div>
        <div class="feature-content">
          <p class="feature-intro">제품명세서는 다음 5가지 1레벨 항목으로 구성됩니다</p>
          <div class="spec-items">
            <div class="spec-item spec-item-1">
              <div class="spec-item-number">01</div>
              <span class="material-symbols-rounded spec-item-icon">inventory_2</span>
              <h4 class="spec-item-title">제품정보</h4>
              <p class="spec-item-desc">제품의 기본 정보를 정의합니다.</p>
            </div>
            <div class="spec-item spec-item-2">
              <div class="spec-item-number">02</div>
              <span class="material-symbols-rounded spec-item-icon">analytics</span>
              <h4 class="spec-item-title">상태 정보</h4>
              <p class="spec-item-desc">제품이 모니터링 가능한 항목을 기술합니다.<br><span class="spec-example">예: F_Notch, F_Fan_RPM</span></p>
            </div>
            <div class="spec-item spec-item-3">
              <div class="spec-item-number">03</div>
              <span class="material-symbols-rounded spec-item-icon">tune</span>
              <h4 class="spec-item-title">설정 정보</h4>
              <p class="spec-item-desc">특정 조건에 따라 모니터링 패킷을 생성하거나, 상태 조건 및 예약 시간에 따라 제품을 제어하는 시나리오를 정의합니다.</p>
            </div>
            <div class="spec-item spec-item-4">
              <div class="spec-item-number">04</div>
              <span class="material-symbols-rounded spec-item-icon">control_camera</span>
              <h4 class="spec-item-title">제어요소</h4>
              <p class="spec-item-desc">모니터링/컨트롤 항목으로 노출되지 않는 제품 내부 로직에 대한 정의를 합니다.</p>
            </div>
            <div class="spec-item spec-item-5">
              <div class="spec-item-number">05</div>
              <span class="material-symbols-rounded spec-item-icon">language</span>
              <h4 class="spec-item-title">언어팩</h4>
              <p class="spec-item-desc">모니터링 항목의 이름, 값 등을 다국어(예: ko-KR, en-US)로 치환하여 지역별 맞춤형 디스플레이를 지원합니다.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 모니터링 및 컨트롤 시나리오 -->
      <div class="feature-card feature-card-accent">
        <div class="feature-header">
          <div class="feature-icon-wrapper">
            <span class="material-symbols-rounded feature-icon">search</span>
          </div>
          <h3 class="feature-title">모니터링 및 컨트롤 시나리오</h3>
        </div>
        <div class="feature-content">
          <div class="scenario-container">
            <div class="scenario-card scenario-monitoring">
              <div class="scenario-header">
                <span class="material-symbols-rounded scenario-icon">signal_cellular_alt</span>
                <h4 class="scenario-title">모니터링 규칙</h4>
              </div>
              <div class="scenario-items">
                <div class="scenario-item">
                  <div class="scenario-item-badge">주기형</div>
                  <p class="scenario-item-desc">일정한 시간 단위(100ms 단위)로 패킷 생성</p>
                </div>
                <div class="scenario-item">
                  <div class="scenario-item-badge scenario-item-badge-warning">이벤트형</div>
                  <p class="scenario-item-desc">제품 상태정보가 변경되었을 때 패킷 생성<br><small>오설정 시 대량 패킷 발생 가능</small></p>
                </div>
              </div>
            </div>
            <div class="scenario-card scenario-control">
              <div class="scenario-header">
                <span class="material-symbols-rounded scenario-icon">sports_esports</span>
                <h4 class="scenario-title">컨트롤 시나리오</h4>
              </div>
              <div class="scenario-items">
                <div class="scenario-item">
                  <div class="scenario-item-badge">status형</div>
                  <p class="scenario-item-desc">제품 상태값을 비교연산하여 조건이 만족하는 시점에 수행</p>
                </div>
                <div class="scenario-item">
                  <div class="scenario-item-badge">schedule형</div>
                  <p class="scenario-item-desc">예약된 시간에 수행</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 주의사항 -->
      <div class="feature-card warning-card">
        <div class="warning-header">
          <div class="warning-icon-wrapper">
            <span class="material-symbols-rounded warning-icon">warning</span>
          </div>
          <h3 class="warning-title">주의사항</h3>
        </div>
        <div class="warning-content">
          <div class="warning-items">
            <div class="warning-item">
              <span class="material-symbols-rounded warning-item-icon">lock</span>
              <p>툴은 휴먼에러를 줄이기 위한 검증 기능을 제공하지만, <strong>완전한 무결성을 보장하지 않습니다.</strong></p>
            </div>
            <div class="warning-item">
              <span class="material-symbols-rounded warning-item-icon">check_circle</span>
              <p>작성된 JSON 파일은 반드시 사용자가 <strong>2차 검증을 수행</strong>해야 하며, 일반 JSON 편집기 사용도 가능합니다.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- 결론 섹션 -->
  <section class="conclusion-section">
    <div class="conclusion-background">
      <div class="conclusion-gradient"></div>
    </div>
    <div class="container">
      <div class="conclusion-content">
        <span class="material-symbols-rounded conclusion-icon">rocket_launch</span>
        <h2 class="conclusion-title">결론</h2>
        <p class="conclusion-text">
          제품명세서 편집툴은 <strong>DXI 기반 제품 개발의 효율성을 극대화하는 핵심 도구</strong>입니다. 
          직관적인 UI와 강력한 JSON 연동 기능을 통해 개발자와 서비스 개발자가 제품의 기능을 명확히 정의하고, 
          다양한 환경에 맞게 다국어 지원까지 가능하게 합니다. 
          사용 시 주의사항을 숙지하여 정확한 명세서 작성을 통해 제품의 안정적인 동작을 보장해야 합니다.
        </p>
        <div class="conclusion-highlights">
          <div class="conclusion-highlight">
            <span class="material-symbols-rounded highlight-icon">auto_awesome</span>
            <span>효율성 극대화</span>
          </div>
          <div class="conclusion-highlight">
            <span class="material-symbols-rounded highlight-icon">track_changes</span>
            <span>명확한 정의</span>
          </div>
          <div class="conclusion-highlight">
            <span class="material-symbols-rounded highlight-icon">public</span>
            <span>다국어 지원</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</div>""",
        "custom_css": """/* 제품명세서 편집툴 공개 페이지 - 모던하고 세련된 스타일 */

/* LG스마트체 폰트 로드 (폰트 파일을 직접 호스팅하는 경우) */
/* 
@font-face {
  font-family: 'LG Smart';
  src: url('https://your-cdn-url.com/fonts/LGSmart-Regular.woff2') format('woff2'),
       url('https://your-cdn-url.com/fonts/LGSmart-Regular.woff') format('woff');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
*/

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

@keyframes gradient-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Material Icons 기본 스타일 */
.material-symbols-rounded,
.material-symbols-outlined {
  font-variation-settings:
    'FILL' 1,
    'wght' 400,
    'GRAD' 0,
    'opsz' 48;
  user-select: none;
  font-size: inherit;
  display: inline-block;
}

.product-spec-editor-page {
  font-family: 'Noto Sans KR', 'LG Smart', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: #1a1a2e;
  line-height: 1.6;
  overflow-x: hidden;
  font-weight: 400;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  position: relative;
  z-index: 1;
}

/* 히어로 섹션 */
.hero-section {
  position: relative;
  color: white;
  padding: 8rem 0 6rem;
  text-align: center;
  overflow: hidden;
}

.hero-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
}

.hero-gradient {
  position: absolute;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  background-size: 200% 200%;
  animation: gradient-shift 8s ease infinite;
}

.hero-pattern {
  position: absolute;
  width: 100%;
  height: 100%;
  background-image: 
    radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 0%, transparent 50%);
  opacity: 0.6;
}

.hero-content {
  max-width: 900px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
  animation: slide-up 0.8s ease-out;
}

.hero-icon-wrapper {
  margin-bottom: 2rem;
  animation: float 3s ease-in-out infinite;
}

.hero-icon {
  font-size: 5rem !important;
  display: inline-block;
  filter: drop-shadow(0 10px 20px rgba(0,0,0,0.2));
  font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 48;
}

.hero-title {
  font-size: 4.5rem;
  font-weight: 800;
  margin-bottom: 1.5rem;
  line-height: 1.1;
  text-shadow: 0 4px 20px rgba(0,0,0,0.2);
  font-family: 'Noto Sans KR', 'LG Smart', sans-serif;
}

.title-highlight {
  background: linear-gradient(120deg, #fff 0%, #f0f0f0 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  display: inline-block;
}

.hero-subtitle {
  font-size: 1.4rem;
  margin-bottom: 3rem;
  opacity: 0.95;
  line-height: 1.7;
  font-weight: 300;
  text-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.hero-badges {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  flex-wrap: wrap;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.75rem;
  border-radius: 50px;
  font-size: 1rem;
  font-weight: 600;
  backdrop-filter: blur(20px);
  border: 2px solid rgba(255,255,255,0.3);
  transition: all 0.3s ease;
  box-shadow: 0 8px 20px rgba(0,0,0,0.15);
}

.badge:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 30px rgba(0,0,0,0.2);
}

.badge-primary {
  background: rgba(255,255,255,0.25);
}

.badge-secondary {
  background: rgba(255,255,255,0.2);
}

.badge-accent {
  background: rgba(255,255,255,0.25);
}

.badge-icon {
  font-size: 1.2rem !important;
  font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
  vertical-align: middle;
}

/* 개요 섹션 */
.overview-section {
  padding: 4rem 0;
  background: linear-gradient(to bottom, #f8f9fa 0%, #ffffff 100%);
}

.overview-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 24px;
  padding: 3rem;
  text-align: center;
  color: white;
  box-shadow: 0 20px 60px rgba(102, 126, 234, 0.3);
  position: relative;
  overflow: hidden;
}

.overview-card::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
  animation: pulse 4s ease-in-out infinite;
}

.overview-icon {
  font-size: 4rem !important;
  margin-bottom: 1.5rem;
  display: inline-block;
  animation: float 3s ease-in-out infinite;
  font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 48;
}

.overview-title {
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 1.5rem;
  font-family: 'Noto Sans KR', 'LG Smart', sans-serif;
}

.overview-text {
  font-size: 1.2rem;
  line-height: 1.8;
  opacity: 0.95;
  max-width: 800px;
  margin: 0 auto;
}

.overview-text strong {
  font-weight: 700;
  text-shadow: 0 2px 10px rgba(0,0,0,0.2);
}

/* 주요 기능 섹션 */
.features-section {
  padding: 6rem 0;
  background: linear-gradient(to bottom, #ffffff 0%, #f8f9fa 50%, #ffffff 100%);
  position: relative;
}

.section-header {
  text-align: center;
  margin-bottom: 4rem;
}

.section-title {
  font-size: 3rem;
  font-weight: 800;
  color: #1a1a2e;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  font-family: 'Noto Sans KR', 'LG Smart', sans-serif;
}

.title-decoration {
  width: 60px;
  height: 4px;
  background: linear-gradient(90deg, transparent, #667eea, transparent);
  border-radius: 2px;
}

.section-subtitle {
  font-size: 1.2rem;
  color: #64748b;
  font-weight: 400;
}

.feature-card {
  background: white;
  border-radius: 24px;
  padding: 3rem;
  margin-bottom: 3rem;
  box-shadow: 0 10px 40px rgba(0,0,0,0.08);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.feature-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: linear-gradient(90deg, #667eea, #764ba2, #f093fb);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.4s ease;
}

.feature-card:hover::before {
  transform: scaleX(1);
}

.feature-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 60px rgba(0,0,0,0.15);
}

.feature-card-primary {
  border-top: 4px solid #667eea;
}

.feature-card-secondary {
  border-top: 4px solid #764ba2;
}

.feature-card-accent {
  border-top: 4px solid #f093fb;
}

.feature-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.feature-icon-wrapper {
  width: 80px;
  height: 80px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
}

.feature-card-secondary .feature-icon-wrapper {
  background: linear-gradient(135deg, #764ba2 0%, #f093fb 100%);
}

.feature-card-accent .feature-icon-wrapper {
  background: linear-gradient(135deg, #f093fb 0%, #667eea 100%);
}

.feature-icon {
  font-size: 2.5rem !important;
  font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 48;
}

.feature-title {
  font-size: 2rem;
  font-weight: 800;
  color: #1a1a2e;
  margin: 0;
  font-family: 'Noto Sans KR', 'LG Smart', sans-serif;
}

.feature-content {
  font-size: 1.1rem;
  color: #4a5568;
  line-height: 1.8;
}

.feature-intro {
  font-size: 1.2rem;
  font-weight: 600;
  color: #667eea;
  margin-bottom: 2rem;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.feature-item {
  display: flex;
  gap: 1.5rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border-radius: 16px;
  border: 2px solid #e2e8f0;
  transition: all 0.3s ease;
}

.feature-item:hover {
  border-color: #667eea;
  transform: translateX(5px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.15);
}

.feature-item-icon {
  font-size: 2.5rem !important;
  flex-shrink: 0;
  font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 48;
  color: #667eea;
}

.feature-item-content {
  flex: 1;
}

.feature-item-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 0.5rem;
}

.feature-item-content p {
  margin: 0;
  color: #64748b;
  font-size: 0.95rem;
  line-height: 1.6;
}

/* 명세서 구성 항목 */
.spec-items {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.spec-item {
  position: relative;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  padding: 2.5rem 2rem;
  border-radius: 20px;
  border: 2px solid #e2e8f0;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.spec-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  opacity: 0;
  transition: opacity 0.4s ease;
}

.spec-item:hover::before {
  opacity: 1;
}

.spec-item:hover {
  transform: translateY(-8px) scale(1.02);
  border-color: #667eea;
  box-shadow: 0 20px 40px rgba(102, 126, 234, 0.2);
}

.spec-item-number {
  position: absolute;
  top: 1rem;
  right: 1rem;
  font-size: 3rem;
  font-weight: 900;
  color: rgba(102, 126, 234, 0.1);
  line-height: 1;
}

.spec-item-icon {
  font-size: 3rem !important;
  margin-bottom: 1rem;
  display: inline-block;
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.1));
  font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 48;
  color: #667eea;
}

.spec-item-title {
  font-size: 1.5rem;
  font-weight: 800;
  margin-bottom: 1rem;
  color: #1a1a2e;
}

.spec-item-desc {
  font-size: 1rem;
  color: #64748b;
  line-height: 1.7;
  margin: 0;
}

.spec-example {
  display: block;
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: #667eea;
  font-weight: 600;
  font-style: italic;
}

/* 시나리오 섹션 */
.scenario-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.scenario-card {
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border-radius: 20px;
  padding: 2.5rem;
  border: 2px solid #e2e8f0;
  transition: all 0.4s ease;
}

.scenario-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 40px rgba(0,0,0,0.1);
  border-color: #667eea;
}

.scenario-monitoring {
  border-left: 5px solid #667eea;
}

.scenario-control {
  border-left: 5px solid #764ba2;
}

.scenario-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.scenario-icon {
  font-size: 2.5rem !important;
  font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 48;
  color: #667eea;
}

.scenario-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: #1a1a2e;
  margin: 0;
}

.scenario-items {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.scenario-item {
  padding: 1.5rem;
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
}

.scenario-item:hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
}

.scenario-item-badge {
  display: inline-block;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
}

.scenario-item-badge-warning {
  background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
}

.scenario-item-desc {
  margin: 0;
  color: #4a5568;
  line-height: 1.7;
}

.scenario-item-desc small {
  display: block;
  margin-top: 0.5rem;
  color: #f59e0b;
  font-weight: 600;
}

/* 주의사항 */
.warning-card {
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  border-left: 6px solid #f59e0b;
  border-top: none;
}

.warning-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.warning-icon-wrapper {
  width: 80px;
  height: 80px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
  box-shadow: 0 10px 30px rgba(245, 158, 11, 0.3);
}

.warning-icon {
  font-size: 2.5rem !important;
  font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 48;
}

.warning-title {
  font-size: 2rem;
  font-weight: 800;
  color: #92400e;
  margin: 0;
  font-family: 'Noto Sans KR', 'LG Smart', sans-serif;
}

.warning-content {
  font-size: 1.1rem;
  color: #78350f;
}

.warning-items {
  display: grid;
  gap: 1.5rem;
}

.warning-item {
  display: flex;
  gap: 1.5rem;
  padding: 1.5rem;
  background: white;
  border-radius: 12px;
  border: 2px solid #fde68a;
  transition: all 0.3s ease;
}

.warning-item:hover {
  border-color: #f59e0b;
  transform: translateX(5px);
  box-shadow: 0 8px 20px rgba(245, 158, 11, 0.15);
}

.warning-item-icon {
  font-size: 2rem !important;
  flex-shrink: 0;
  font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 48;
  color: #f59e0b;
}

.warning-item p {
  margin: 0;
  line-height: 1.8;
}

.warning-item strong {
  color: #92400e;
  font-weight: 700;
}

/* 결론 섹션 */
.conclusion-section {
  position: relative;
  padding: 6rem 0;
  color: white;
  overflow: hidden;
}

.conclusion-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
}

.conclusion-gradient {
  position: absolute;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f172a 100%);
  background-size: 200% 200%;
  animation: gradient-shift 10s ease infinite;
}

.conclusion-content {
  max-width: 900px;
  margin: 0 auto;
  text-align: center;
  position: relative;
  z-index: 1;
}

.conclusion-icon {
  font-size: 4rem !important;
  margin-bottom: 1.5rem;
  display: inline-block;
  animation: float 3s ease-in-out infinite;
  filter: drop-shadow(0 10px 20px rgba(0,0,0,0.3));
  font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 48;
}

.conclusion-title {
  font-size: 3rem;
  font-weight: 800;
  margin-bottom: 2rem;
  text-shadow: 0 4px 20px rgba(0,0,0,0.3);
  font-family: 'Noto Sans KR', 'LG Smart', sans-serif;
}

.conclusion-text {
  font-size: 1.25rem;
  line-height: 2;
  opacity: 0.95;
  margin-bottom: 3rem;
  text-shadow: 0 2px 10px rgba(0,0,0,0.2);
}

.conclusion-text strong {
  font-weight: 800;
  color: #fbbf24;
  text-shadow: 0 2px 10px rgba(251, 191, 36, 0.3);
}

.conclusion-highlights {
  display: flex;
  gap: 2rem;
  justify-content: center;
  flex-wrap: wrap;
}

.conclusion-highlight {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 2rem;
  background: rgba(255,255,255,0.1);
  backdrop-filter: blur(20px);
  border-radius: 50px;
  border: 2px solid rgba(255,255,255,0.2);
  font-size: 1.1rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.conclusion-highlight:hover {
  background: rgba(255,255,255,0.2);
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}

.highlight-icon {
  font-size: 1.5rem !important;
  font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
  vertical-align: middle;
}

/* 반응형 디자인 */
@media (max-width: 1024px) {
  .hero-title {
    font-size: 3.5rem;
  }
  
  .scenario-container {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2.5rem;
  }
  
  .hero-subtitle {
    font-size: 1.1rem;
  }
  
  .section-title {
    font-size: 2rem;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .title-decoration {
    width: 40px;
  }
  
  .feature-card {
    padding: 2rem;
  }
  
  .feature-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .spec-items {
    grid-template-columns: 1fr;
  }
  
  .feature-grid {
    grid-template-columns: 1fr;
  }
  
  .container {
    padding: 0 1rem;
  }
  
  .conclusion-highlights {
    flex-direction: column;
    align-items: center;
  }
  
  .conclusion-title {
    font-size: 2rem;
  }
  
  .conclusion-text {
    font-size: 1.1rem;
  }
}"""
    }
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # 기존 앱이 있는지 확인
    check_url = f"{API_BASE_URL}/api/apps/com.dxi.product-spec-editor"
    check_response = requests.get(check_url, headers=headers)
    
    if check_response.status_code == 200:
        # 기존 앱이 있으면 업데이트
        print("기존 앱을 찾았습니다. 업데이트 중...")
        update_url = f"{API_BASE_URL}/api/apps/com.dxi.product-spec-editor"
        response = requests.put(update_url, json=app_data, headers=headers)
        if response.status_code == 200:
            print("✅ 앱이 성공적으로 업데이트되었습니다!")
            print(f"공개 페이지 URL: http://localhost:3000/p/com.dxi.product-spec-editor")
        else:
            print(f"업데이트 실패: {response.status_code}")
            print(response.text)
    else:
        # 새 앱 등록
        print("새 앱을 등록하는 중...")
        create_url = f"{API_BASE_URL}/api/apps"
        response = requests.post(create_url, json=app_data, headers=headers)
        if response.status_code == 201:
            print("✅ 앱이 성공적으로 등록되었습니다!")
            print(f"공개 페이지 URL: http://localhost:3000/p/com.dxi.product-spec-editor")
        else:
            print(f"등록 실패: {response.status_code}")
            print(response.text)

if __name__ == "__main__":
    print("제품명세서 편집툴 공개 페이지 등록 시작...")
    print(f"API 서버: {API_BASE_URL}")
    
    try:
        token = get_auth_token()
        print("✅ 로그인 성공")
        register_app(token)
    except requests.exceptions.ConnectionError:
        print(f"❌ 오류: {API_BASE_URL}에 연결할 수 없습니다.")
        print("백엔드 서버가 실행 중인지 확인해주세요.")
        sys.exit(1)
    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        sys.exit(1)
