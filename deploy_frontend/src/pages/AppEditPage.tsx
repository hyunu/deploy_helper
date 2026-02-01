import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Save, ExternalLink, Code, Palette, RotateCcw, Plus } from 'lucide-react'
import { getApp, updateApp } from '../api/apps'
import Editor from '@monaco-editor/react'

// HTML 템플릿 (플레이스홀더 사용)
// {{APP_NAME}}, {{APP_DESCRIPTION}}, {{APP_ID}}, {{ICON_URL}}, {{DOWNLOAD_URL}}, {{DOWNLOAD_BUTTON}}, {{MANUAL_DOWNLOAD_URL}}, {{MANUAL_DOWNLOAD_BUTTON}}, {{LATEST_VERSION}}
// 참고: 폰트는 PublicAppPage.tsx에서 자동으로 CSS로 주입됩니다.

const HTML_TEMPLATES = [
  {
    id: 'hero-download',
    name: '히어로 + 다운로드',
    icon: '🎯',
    description: '다운로드 버튼이 포함된 히어로 섹션',
    html: `<!-- 히어로 섹션 + 다운로드 버튼 -->
<div class="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700" style="font-family: 'LG Smart', sans-serif;">
  <div class="container mx-auto px-4 py-20">
    <div class="max-w-4xl mx-auto text-center text-white">
      <!-- 앱 아이콘 -->
      <img src="{{ICON_URL}}" alt="{{APP_NAME}}" class="w-24 h-24 mx-auto mb-6 rounded-2xl shadow-2xl" onerror="this.style.display='none'">
      
      <!-- 앱 이름 -->
      <h1 class="text-5xl font-bold mb-4">{{APP_NAME}}</h1>
      
      <!-- 앱 설명 -->
      <p class="text-xl opacity-90 mb-8">{{APP_DESCRIPTION}}</p>
      
      <!-- 다운로드 버튼 -->
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        {{DOWNLOAD_BUTTON}}
        {{MANUAL_DOWNLOAD_BUTTON}}
      </div>
      
      <!-- 버전 정보 (공개 페이지에서 자동 표시됨) -->
      <p class="mt-4 text-sm opacity-70">Windows 64-bit | 최신 버전</p>
    </div>
  </div>
</div>`,
  },
  {
    id: 'minimal-card',
    name: '미니멀 카드',
    icon: '🃏',
    description: '깔끔한 카드 스타일',
    html: `<!-- 미니멀 카드 스타일 -->
<div class="min-h-screen bg-gray-100 flex items-center justify-center p-4" style="font-family: 'LG Smart', sans-serif;">
  <div class="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
    <!-- 헤더 배경 -->
    <div class="h-32 bg-gradient-to-r from-violet-500 to-purple-500"></div>
    
    <!-- 콘텐츠 -->
    <div class="px-8 pb-8 -mt-16">
      <!-- 아이콘 -->
      <img src="{{ICON_URL}}" alt="{{APP_NAME}}" class="w-24 h-24 rounded-2xl shadow-lg border-4 border-white mb-4" onerror="this.src='https://via.placeholder.com/96?text=App'">
      
      <!-- 앱 정보 -->
      <h1 class="text-2xl font-bold text-gray-900 mb-2">{{APP_NAME}}</h1>
      <p class="text-gray-600 mb-6">{{APP_DESCRIPTION}}</p>
      
      <!-- 다운로드 버튼 -->
      <div class="space-y-3">
        {{DOWNLOAD_BUTTON}}
        {{MANUAL_DOWNLOAD_BUTTON}}
      </div>
      
      <!-- 추가 정보 -->
      <div class="flex justify-center gap-6 mt-6 text-sm text-gray-500">
        <span>Windows</span>
        <span>•</span>
        <span>무료</span>
      </div>
    </div>
  </div>
</div>`,
  },
  {
    id: 'landing-full',
    name: '풀 랜딩 페이지',
    icon: '🌐',
    description: '완전한 랜딩 페이지 (네비게이션 포함)',
    html: `<!-- 풀 랜딩 페이지 -->
<div class="min-h-screen" style="font-family: 'LG Smart', sans-serif;">
  <!-- 네비게이션 -->
  <nav class="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b">
    <div class="container mx-auto px-4 py-4 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <img src="{{ICON_URL}}" alt="" class="w-8 h-8 rounded-lg" onerror="this.style.display='none'">
        <span class="font-bold text-xl">{{APP_NAME}}</span>
      </div>
      {{MANUAL_DOWNLOAD_BUTTON}}
    </div>
  </nav>
  
  <!-- 히어로 -->
  <section class="pt-32 pb-20 bg-gradient-to-b from-blue-50 to-white">
    <div class="container mx-auto px-4 text-center">
      <div class="inline-block px-4 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
        ✨ 새 버전 출시
      </div>
      <h1 class="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
        {{APP_NAME}}
      </h1>
      <p class="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
        {{APP_DESCRIPTION}}
      </p>
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        {{DOWNLOAD_BUTTON}}
        {{MANUAL_DOWNLOAD_BUTTON}}
        <a href="#features" class="inline-flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-8 py-4 rounded-xl font-semibold hover:bg-gray-200 transition">
          기능 살펴보기
        </a>
      </div>
    </div>
  </section>
  
  <!-- 기능 -->
  <section id="features" class="py-20">
    <div class="container mx-auto px-4">
      <h2 class="text-3xl font-bold text-center mb-4">강력한 기능</h2>
      <p class="text-gray-600 text-center mb-12">업무 효율을 높여주는 핵심 기능들</p>
      <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="p-6 border rounded-xl hover:shadow-lg transition">
          <div class="text-3xl mb-4">🚀</div>
          <h3 class="font-semibold mb-2">빠른 속도</h3>
          <p class="text-sm text-gray-600">최적화된 성능</p>
        </div>
        <div class="p-6 border rounded-xl hover:shadow-lg transition">
          <div class="text-3xl mb-4">🔒</div>
          <h3 class="font-semibold mb-2">안전한 보안</h3>
          <p class="text-sm text-gray-600">데이터 암호화</p>
        </div>
        <div class="p-6 border rounded-xl hover:shadow-lg transition">
          <div class="text-3xl mb-4">🔄</div>
          <h3 class="font-semibold mb-2">자동 업데이트</h3>
          <p class="text-sm text-gray-600">항상 최신 버전</p>
        </div>
        <div class="p-6 border rounded-xl hover:shadow-lg transition">
          <div class="text-3xl mb-4">💡</div>
          <h3 class="font-semibold mb-2">쉬운 사용</h3>
          <p class="text-sm text-gray-600">직관적 인터페이스</p>
        </div>
      </div>
    </div>
  </section>
  
  <!-- CTA -->
  <section class="py-20 bg-gray-900 text-white">
    <div class="container mx-auto px-4 text-center">
      <h2 class="text-3xl font-bold mb-4">지금 시작하세요</h2>
      <p class="text-gray-400 mb-8">무료로 다운로드하고 사용해보세요</p>
      <div class="flex flex-wrap gap-4 justify-center">
        {{DOWNLOAD_BUTTON}}
        {{MANUAL_DOWNLOAD_BUTTON}}
      </div>
    </div>
  </section>
  
  <!-- 푸터 -->
  <footer class="py-8 bg-gray-950 text-gray-400 text-center text-sm">
    <p>© 2024 {{APP_NAME}}. All rights reserved.</p>
  </footer>
</div>`,
  },
  {
    id: 'download-only',
    name: '다운로드 버튼만',
    icon: '⬇️',
    description: '설치파일 + 설명서 다운로드 버튼',
    html: `<!-- 다운로드 버튼 블록 -->
<div class="flex flex-col items-center gap-4 p-8" style="font-family: 'LG Smart', sans-serif;">
  <div class="flex flex-col sm:flex-row gap-4 items-center">
    {{DOWNLOAD_BUTTON}}
    {{MANUAL_DOWNLOAD_BUTTON}}
  </div>
  <span class="text-sm text-gray-500">Windows 64-bit</span>
</div>`,
  },
  {
    id: 'version-info',
    name: '버전 정보 블록',
    icon: '📋',
    description: '버전 정보 + 설치파일/설명서 다운로드',
    html: `<!-- 버전 정보 블록 -->
<!-- 참고: 버전 정보는 공개 페이지(/p/앱ID)에서 자동으로 로드됩니다 -->
<div class="bg-gray-50 rounded-xl p-6 max-w-lg mx-auto" style="font-family: 'LG Smart', sans-serif;">
  <h3 class="font-bold text-lg mb-4 flex items-center gap-2">
    <span class="text-2xl">📦</span>
    버전 정보
  </h3>
  
  <div class="space-y-3 text-sm">
    <div class="flex justify-between py-2 border-b">
      <span class="text-gray-600">앱 이름</span>
      <span class="font-medium">{{APP_NAME}}</span>
    </div>
    <div class="flex justify-between py-2 border-b">
      <span class="text-gray-600">앱 ID</span>
      <code class="bg-gray-200 px-2 py-0.5 rounded text-xs">{{APP_ID}}</code>
    </div>
    <div class="flex justify-between py-2 border-b">
      <span class="text-gray-600">플랫폼</span>
      <span class="font-medium">Windows</span>
    </div>
  </div>
  
  <div class="mt-6 space-y-3">
    {{DOWNLOAD_BUTTON}}
    {{MANUAL_DOWNLOAD_BUTTON}}
  </div>
</div>`,
  },
  {
    id: 'version-history',
    name: '버전 히스토리',
    icon: '📜',
    description: 'API에서 버전 목록을 자동으로 불러와 표시',
    html: `<!-- 버전 히스토리 (API에서 자동 로드) -->
<div class="max-w-2xl mx-auto p-6" style="font-family: 'LG Smart', sans-serif;">
  <h2 class="text-2xl font-bold mb-6 flex items-center gap-2">
    <span>📜</span> 버전 히스토리
  </h2>
  
  <!-- 버전 목록 컨테이너 -->
  <div id="version-history-list" class="space-y-4">
    <div class="text-center py-8 text-gray-500">
      <div class="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
      버전 정보를 불러오는 중...
    </div>
  </div>
</div>

<script>
(function() {
  const appId = '{{APP_ID}}';
  const container = document.getElementById('version-history-list');
  
  fetch('/api/update/history/' + appId + '?limit=10')
    .then(res => res.json())
    .then(data => {
      if (!data.versions || data.versions.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500 py-8">등록된 버전이 없습니다.</p>';
        return;
      }
      
      container.innerHTML = data.versions.map((v, i) => \`
        <div class="bg-white border rounded-xl p-4 \${i === 0 ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200'}">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <span class="font-bold text-lg">v\${v.version}</span>
              \${i === 0 ? '<span class="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">최신</span>' : ''}
              \${v.is_mandatory ? '<span class="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">필수</span>' : ''}
            </div>
            <span class="text-sm text-gray-500">\${v.published_at ? new Date(v.published_at).toLocaleDateString('ko-KR') : ''}</span>
          </div>
          \${v.release_notes ? '<p class="text-gray-600 text-sm whitespace-pre-line">' + v.release_notes + '</p>' : ''}
          \${v.file_size ? '<p class="text-xs text-gray-400 mt-2">파일 크기: ' + (v.file_size / 1024 / 1024).toFixed(2) + ' MB</p>' : ''}
        </div>
      \`).join('');
    })
    .catch(err => {
      container.innerHTML = '<p class="text-center text-red-500 py-8">버전 정보를 불러올 수 없습니다.</p>';
    });
})();
</script>`,
  },
  {
    id: 'full-product-with-history',
    name: '풀 페이지 + 버전 히스토리',
    icon: '🏆',
    description: '히어로 + 기능 + 다운로드 + 버전 히스토리 통합',
    html: `<!-- 풀 프로덕트 페이지 + 버전 히스토리 -->
<div class="min-h-screen" style="font-family: 'LG Smart', sans-serif;">
  <!-- 히어로 섹션 -->
  <div class="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-20">
    <div class="container mx-auto px-4 text-center">
      <img src="{{ICON_URL}}" alt="{{APP_NAME}}" class="w-24 h-24 mx-auto mb-6 rounded-2xl shadow-2xl" onerror="this.style.display='none'">
      <h1 class="text-5xl font-bold mb-4">{{APP_NAME}}</h1>
      <p class="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">{{APP_DESCRIPTION}}</p>
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        {{DOWNLOAD_BUTTON}}
        {{MANUAL_DOWNLOAD_BUTTON}}
        <a href="#versions" class="inline-flex items-center justify-center gap-2 border border-gray-600 hover:border-gray-500 px-8 py-4 rounded-xl font-semibold transition">
          버전 히스토리
        </a>
      </div>
      <!-- 최신 버전 정보 -->
      <p id="latest-version-badge" class="mt-6 text-sm text-gray-400"></p>
    </div>
  </div>

  <!-- 기능 섹션 -->
  <div class="py-20 bg-white">
    <div class="container mx-auto px-4">
      <h2 class="text-3xl font-bold text-center mb-12">주요 기능</h2>
      <div class="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
        <div class="text-center p-6">
          <div class="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span class="text-3xl">⚡</span>
          </div>
          <h3 class="font-semibold text-lg mb-2">빠른 성능</h3>
          <p class="text-gray-600">최적화된 코드로 빠르고 안정적으로 동작합니다.</p>
        </div>
        <div class="text-center p-6">
          <div class="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span class="text-3xl">🔄</span>
          </div>
          <h3 class="font-semibold text-lg mb-2">자동 업데이트</h3>
          <p class="text-gray-600">새 버전이 나오면 자동으로 업데이트됩니다.</p>
        </div>
        <div class="text-center p-6">
          <div class="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span class="text-3xl">🔒</span>
          </div>
          <h3 class="font-semibold text-lg mb-2">안전한 보안</h3>
          <p class="text-gray-600">데이터를 안전하게 암호화하여 보호합니다.</p>
        </div>
      </div>
    </div>
  </div>

  <!-- 버전 히스토리 섹션 -->
  <div id="versions" class="py-20 bg-gray-50">
    <div class="container mx-auto px-4">
      <h2 class="text-3xl font-bold text-center mb-4">버전 히스토리</h2>
      <p class="text-gray-600 text-center mb-12">{{APP_NAME}}의 업데이트 내역</p>
      
      <div id="version-history-container" class="max-w-2xl mx-auto space-y-4">
        <div class="text-center py-8">
          <div class="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p class="text-gray-500">버전 정보를 불러오는 중...</p>
        </div>
      </div>
    </div>
  </div>

  <!-- 다운로드 CTA -->
  <div class="py-16 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-center">
    <h2 class="text-3xl font-bold mb-4">지금 시작하세요</h2>
    <p class="mb-8 opacity-90">무료로 다운로드하고 사용해보세요</p>
    <div class="flex flex-wrap gap-4 justify-center">
      {{MANUAL_DOWNLOAD_BUTTON}}
    </div>
  </div>

  <!-- 푸터 -->
  <footer class="py-8 bg-slate-900 text-gray-400 text-center text-sm">
    <p>© 2024 {{APP_NAME}}. All rights reserved.</p>
  </footer>
</div>

<script>
(function() {
  const appId = '{{APP_ID}}';
  const container = document.getElementById('version-history-container');
  const badge = document.getElementById('latest-version-badge');
  
  fetch('/api/update/history/' + appId + '?limit=10')
    .then(res => res.json())
    .then(data => {
      if (!data.versions || data.versions.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500 py-8">등록된 버전이 없습니다.</p>';
        return;
      }
      
      // 최신 버전 배지 표시
      const latest = data.versions[0];
      badge.innerHTML = 'v' + latest.version + ' • ' + (latest.published_at ? new Date(latest.published_at).toLocaleDateString('ko-KR') : '');
      
      container.innerHTML = data.versions.map((v, i) => \`
        <div class="bg-white border rounded-xl p-5 shadow-sm \${i === 0 ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200'}">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-3">
              <span class="text-xl font-bold">v\${v.version}</span>
              \${i === 0 ? '<span class="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">최신 버전</span>' : ''}
              \${v.is_mandatory ? '<span class="bg-red-500 text-white text-xs px-2 py-1 rounded-full">필수 업데이트</span>' : ''}
            </div>
            <span class="text-sm text-gray-500">\${v.published_at ? new Date(v.published_at).toLocaleDateString('ko-KR') : ''}</span>
          </div>
          \${v.release_notes ? '<div class="text-gray-600 whitespace-pre-line bg-gray-50 p-3 rounded-lg text-sm">' + v.release_notes + '</div>' : '<p class="text-gray-400 text-sm">릴리즈 노트가 없습니다.</p>'}
          <div class="flex items-center justify-between mt-3 text-xs text-gray-400">
            <span>\${v.file_size ? '파일 크기: ' + (v.file_size / 1024 / 1024).toFixed(2) + ' MB' : ''}</span>
            \${i === 0 ? '<div class="flex flex-wrap gap-2"><a href="{{DOWNLOAD_URL}}" class="text-blue-600 hover:underline font-medium">다운로드 →</a>' + ('{{MANUAL_DOWNLOAD_URL}}' !== '' ? '<a href="{{MANUAL_DOWNLOAD_URL}}" class="text-gray-600 hover:underline font-medium">설명서 →</a>' : '') + '</div>' : ''}
          </div>
        </div>
      \`).join('');
    })
    .catch(err => {
      container.innerHTML = '<p class="text-center text-red-500 py-8">버전 정보를 불러올 수 없습니다.</p>';
    });
})();
</script>`,
  },
  {
    id: 'product-manual-fullscreen',
    name: '제품설명서 전체화면',
    icon: '📄',
    description: '중앙 배치, 중간 구분선 (왼쪽 제목/버전, 오른쪽 설명/버튼)',
    html: `<!-- 제품설명서 전체화면 템플릿 - 중앙 배치 -->
<div class="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-8 md:p-12 lg:p-16" style="font-family: 'LG Smart', sans-serif;">
  <!-- 중앙 컨테이너 -->
  <div class="w-full max-w-5xl flex overflow-hidden">
    <!-- 왼쪽 섹션: 제목 및 버전 -->
    <div class="w-full md:w-96 lg:w-[480px] p-12 md:p-16 lg:p-20 flex flex-col justify-center items-end md:items-start">
      <div class="space-y-8 w-full">
        <!-- 앱 아이콘 -->
        <div class="mb-8">
          <img src="{{ICON_URL}}" alt="{{APP_NAME}}" class="w-24 h-24 md:w-32 md:h-32 rounded-2xl shadow-lg ring-4 ring-gray-200" onerror="this.style.display='none'">
        </div>
        
        <!-- 제목 -->
        <div>
          <div class="inline-block px-4 py-2 bg-gray-200 rounded-full text-sm font-medium text-gray-700 mb-6">
            제품 설명서
          </div>
          <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 tracking-tight leading-tight" style="background: transparent !important;">
            {{APP_NAME}}
          </h1>
        </div>
        
        <!-- 버전 정보 -->
        <div class="pt-3 border-t border-gray-300">
          <div class="flex items-baseline gap-3">
            <span class="text-gray-600 text-base font-medium leading-none">Version</span>
            <span class="px-3 py-0.5 bg-indigo-100 rounded-lg text-lg font-bold text-indigo-700 leading-tight">
              v{{LATEST_VERSION}}
            </span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 중간 구분선 -->
    <div class="hidden md:block w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>
    
    <!-- 오른쪽 섹션: 설명 및 버튼 -->
    <div class="flex-1 p-12 md:p-16 lg:p-20">
      <div class="max-w-xl">
        <!-- 설명 영역 -->
        <div class="mb-6">
          <div class="text-gray-800 text-base md:text-lg lg:text-xl leading-relaxed whitespace-pre-line font-normal" style="background: transparent !important;">
            {{APP_DESCRIPTION}}
          </div>
        </div>
        
        <!-- 버튼 영역 -->
        <div class="flex flex-col sm:flex-row gap-4 justify-start items-start">
          {{DOWNLOAD_BUTTON}}
          {{MANUAL_DOWNLOAD_BUTTON}}
        </div>
        
        <!-- 추가 정보 -->
        <div class="mt-6">
          <p class="text-sm text-gray-600 font-medium">Windows 64-bit 지원 | 최신 버전</p>
        </div>
      </div>
    </div>
  </div>
</div>`,
  },
]

// CSS 프레임워크별 기본 템플릿 (CSS + HTML)
const CSS_FRAMEWORKS = [
  {
    id: 'tailwind',
    name: 'Tailwind CSS',
    description: '유틸리티 기반 CSS 프레임워크',
    cdn: '<script src="https://cdn.tailwindcss.com"></script>',
    docsUrl: 'https://tailwindcss.com/docs',
    example: 'class="bg-blue-500 text-white p-4 rounded-lg"',
    defaultCss: `/* Tailwind CSS - 유틸리티 클래스를 HTML에서 직접 사용 */

/* 추가 커스텀 스타일 */
.custom-shadow {
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}
`,
    defaultHtml: `<!-- 제품설명서 전체화면 템플릿 - 중앙 배치 -->
<div class="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-8 md:p-12 lg:p-16" style="font-family: 'LG Smart', sans-serif;">
  <!-- 중앙 컨테이너 -->
  <div class="w-full max-w-5xl flex overflow-hidden">
    <!-- 왼쪽 섹션: 제목 및 버전 -->
    <div class="w-full md:w-96 lg:w-[480px] p-12 md:p-16 lg:p-20 flex flex-col justify-center items-end md:items-start">
      <div class="space-y-8 w-full">
        <!-- 앱 아이콘 -->
        <div class="mb-8">
          <img src="{{ICON_URL}}" alt="{{APP_NAME}}" class="w-24 h-24 md:w-32 md:h-32 rounded-2xl shadow-lg ring-4 ring-gray-200" onerror="this.style.display='none'">
        </div>
        
        <!-- 제목 -->
        <div>
          <div class="inline-block px-4 py-2 bg-gray-200 rounded-full text-sm font-medium text-gray-700 mb-6">
            제품 설명서
          </div>
          <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 tracking-tight leading-tight" style="background: transparent !important;">
            {{APP_NAME}}
          </h1>
        </div>
        
        <!-- 버전 정보 -->
        <div class="pt-3 border-t border-gray-300">
          <div class="flex items-baseline gap-3">
            <span class="text-gray-600 text-base font-medium leading-none">Version</span>
            <span class="px-3 py-0.5 bg-indigo-100 rounded-lg text-lg font-bold text-indigo-700 leading-tight">
              v{{LATEST_VERSION}}
            </span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 중간 구분선 -->
    <div class="hidden md:block w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>
    
    <!-- 오른쪽 섹션: 설명 및 버튼 -->
    <div class="flex-1 p-12 md:p-16 lg:p-20">
      <div class="max-w-xl">
        <!-- 설명 영역 -->
        <div class="mb-6">
          <div class="text-gray-800 text-base md:text-lg lg:text-xl leading-relaxed whitespace-pre-line font-normal" style="background: transparent !important;">
            {{APP_DESCRIPTION}}
          </div>
        </div>
        
        <!-- 버튼 영역 -->
        <div class="flex flex-col sm:flex-row gap-4 justify-start items-start">
          {{DOWNLOAD_BUTTON}}
          {{MANUAL_DOWNLOAD_BUTTON}}
        </div>
        
        <!-- 추가 정보 -->
        <div class="mt-6">
          <p class="text-sm text-gray-600 font-medium">Windows 64-bit 지원 | 최신 버전</p>
        </div>
      </div>
    </div>
  </div>
</div>`,
  },
  {
    id: 'bootstrap',
    name: 'Bootstrap 5',
    description: '가장 인기 있는 CSS 프레임워크',
    cdn: '<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">',
    docsUrl: 'https://getbootstrap.com/docs/5.3/getting-started/introduction/',
    example: 'class="btn btn-primary container row col-md-6"',
    defaultCss: `/* Bootstrap 5 커스텀 스타일 */

.hero-section {
  padding: 5rem 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.feature-card {
  transition: transform 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
}
`,
    defaultHtml: `<div class="hero-section text-center" style="font-family: 'LG Smart', sans-serif;">
  <div class="container">
    <h1 class="display-4 fw-bold mb-4">앱 이름</h1>
    <p class="lead mb-4">앱에 대한 간단한 설명을 여기에 작성하세요</p>
    <a href="#" class="btn btn-light btn-lg px-5">다운로드</a>
  </div>
</div>

<div class="container py-5">
  <h2 class="text-center mb-5">주요 기능</h2>
  <div class="row g-4">
    <div class="col-md-4">
      <div class="card feature-card h-100">
        <div class="card-body text-center">
          <div class="display-4 mb-3">🚀</div>
          <h5 class="card-title">빠른 속도</h5>
          <p class="card-text text-muted">최적화된 성능으로 빠르게 실행됩니다.</p>
        </div>
      </div>
    </div>
    <div class="col-md-4">
      <div class="card feature-card h-100">
        <div class="card-body text-center">
          <div class="display-4 mb-3">🔒</div>
          <h5 class="card-title">보안</h5>
          <p class="card-text text-muted">안전한 데이터 보호를 제공합니다.</p>
        </div>
      </div>
    </div>
    <div class="col-md-4">
      <div class="card feature-card h-100">
        <div class="card-body text-center">
          <div class="display-4 mb-3">💡</div>
          <h5 class="card-title">간편한 사용</h5>
          <p class="card-text text-muted">직관적인 인터페이스로 쉽게 사용할 수 있습니다.</p>
        </div>
      </div>
    </div>
  </div>
</div>`,
  },
  {
    id: 'bulma',
    name: 'Bulma',
    description: 'Flexbox 기반 모던 CSS',
    cdn: '<link href="https://cdn.jsdelivr.net/npm/bulma@0.9.4/css/bulma.min.css" rel="stylesheet">',
    docsUrl: 'https://bulma.io/documentation/',
    example: 'class="button is-primary hero section columns"',
    defaultCss: `/* Bulma 커스텀 스타일 */

.hero.is-custom {
  background: linear-gradient(135deg, #00d1b2 0%, #3273dc 100%);
}

.card {
  transition: box-shadow 0.3s ease;
}

.card:hover {
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}
`,
    defaultHtml: `<section class="hero is-custom is-medium" style="font-family: 'LG Smart', sans-serif;">
  <div class="hero-body has-text-centered">
    <p class="title is-1 has-text-white">앱 이름</p>
    <p class="subtitle has-text-white">앱에 대한 간단한 설명을 여기에 작성하세요</p>
    <a class="button is-white is-large">다운로드</a>
  </div>
</section>

<section class="section">
  <div class="container">
    <h2 class="title has-text-centered mb-6">주요 기능</h2>
    <div class="columns">
      <div class="column">
        <div class="card">
          <div class="card-content has-text-centered">
            <span class="is-size-1">🚀</span>
            <p class="title is-4 mt-4">빠른 속도</p>
            <p class="subtitle is-6">최적화된 성능으로 빠르게 실행됩니다.</p>
          </div>
        </div>
      </div>
      <div class="column">
        <div class="card">
          <div class="card-content has-text-centered">
            <span class="is-size-1">🔒</span>
            <p class="title is-4 mt-4">보안</p>
            <p class="subtitle is-6">안전한 데이터 보호를 제공합니다.</p>
          </div>
        </div>
      </div>
      <div class="column">
        <div class="card">
          <div class="card-content has-text-centered">
            <span class="is-size-1">💡</span>
            <p class="title is-4 mt-4">간편한 사용</p>
            <p class="subtitle is-6">직관적인 인터페이스로 쉽게 사용할 수 있습니다.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>`,
  },
  {
    id: 'pico',
    name: 'Pico CSS',
    description: '미니멀 클래스리스 CSS',
    cdn: '<link href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css" rel="stylesheet">',
    docsUrl: 'https://picocss.com/docs',
    example: '클래스 없이 <main>, <article>, <button> 등 HTML 태그만 사용',
    defaultCss: `/* Pico CSS - 클래스 없이 HTML 태그에 자동 스타일 적용 */

.hero {
  padding: 4rem 0;
  text-align: center;
  background: linear-gradient(to bottom, #f8f9fa, #ffffff);
}
`,
    defaultHtml: `<main class="container" style="font-family: 'LG Smart', sans-serif;">
  <header class="hero">
    <h1>앱 이름</h1>
    <p>앱에 대한 간단한 설명을 여기에 작성하세요</p>
    <button>다운로드</button>
  </header>

  <section>
    <h2>주요 기능</h2>
    <div class="grid">
      <article>
        <header>🚀 빠른 속도</header>
        <p>최적화된 성능으로 빠르게 실행됩니다.</p>
      </article>
      <article>
        <header>🔒 보안</header>
        <p>안전한 데이터 보호를 제공합니다.</p>
      </article>
      <article>
        <header>💡 간편한 사용</header>
        <p>직관적인 인터페이스로 쉽게 사용할 수 있습니다.</p>
      </article>
    </div>
  </section>
</main>`,
  },
  {
    id: 'water',
    name: 'Water.css',
    description: '심플한 클래스리스 CSS',
    cdn: '<link href="https://cdn.jsdelivr.net/npm/water.css@2/out/water.css" rel="stylesheet">',
    docsUrl: 'https://watercss.kognise.dev/',
    example: '클래스 없이 HTML 태그만으로 스타일 적용',
    defaultCss: `/* Water.css - 순수 HTML에 자동 스타일 적용 */

header {
  text-align: center;
  margin-bottom: 3rem;
}

section {
  margin: 2rem 0;
}
`,
    defaultHtml: `<header style="font-family: 'LG Smart', sans-serif;">
  <h1>앱 이름</h1>
  <p>앱에 대한 간단한 설명을 여기에 작성하세요</p>
  <button>다운로드</button>
</header>

<main>
  <h2>주요 기능</h2>
  
  <section>
    <h3>🚀 빠른 속도</h3>
    <p>최적화된 성능으로 빠르게 실행됩니다.</p>
  </section>

  <section>
    <h3>🔒 보안</h3>
    <p>안전한 데이터 보호를 제공합니다.</p>
  </section>

  <section>
    <h3>💡 간편한 사용</h3>
    <p>직관적인 인터페이스로 쉽게 사용할 수 있습니다.</p>
  </section>
</main>`,
  },
  {
    id: 'none',
    name: '없음 (순수 CSS)',
    description: 'CSS 프레임워크 없이 직접 작성',
    cdn: '',
    docsUrl: 'https://developer.mozilla.org/ko/docs/Web/CSS',
    example: '모든 스타일을 직접 작성',
    defaultCss: `/* 순수 CSS */

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  line-height: 1.6;
  color: #333;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.hero {
  text-align: center;
  padding: 4rem 2rem;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.hero h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.btn {
  display: inline-block;
  padding: 0.75rem 2rem;
  background: white;
  color: #667eea;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  text-decoration: none;
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  padding: 3rem 0;
}

.feature {
  padding: 1.5rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  text-align: center;
}

.feature h3 {
  margin: 1rem 0 0.5rem;
}
`,
    defaultHtml: `<div class="hero" style="font-family: 'LG Smart', sans-serif;">
  <h1>앱 이름</h1>
  <p>앱에 대한 간단한 설명을 여기에 작성하세요</p>
  <a href="#" class="btn">다운로드</a>
</div>

<div class="container">
  <h2 style="text-align:center; margin: 2rem 0;">주요 기능</h2>
  <div class="features">
    <div class="feature">
      <div style="font-size: 2rem;">🚀</div>
      <h3>빠른 속도</h3>
      <p>최적화된 성능으로 빠르게 실행됩니다.</p>
    </div>
    <div class="feature">
      <div style="font-size: 2rem;">🔒</div>
      <h3>보안</h3>
      <p>안전한 데이터 보호를 제공합니다.</p>
    </div>
    <div class="feature">
      <div style="font-size: 2rem;">💡</div>
      <h3>간편한 사용</h3>
      <p>직관적인 인터페이스로 쉽게 사용할 수 있습니다.</p>
    </div>
  </div>
</div>`,
  },
]

export default function AppEditPage() {
  const { appId } = useParams<{ appId: string }>()
  const queryClient = useQueryClient()
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const [activeTab, setActiveTab] = useState<'html' | 'css'>('html')
  const [cssFramework, setCssFramework] = useState('tailwind')
  const [showTemplateMenu, setShowTemplateMenu] = useState(false)
  const [formData, setFormData] = useState({
    app_id: '',
    name: '',
    description: '',
    detail_html: '',
    custom_css: '',
    icon_url: '',
    is_public: true,
    manual_file_path: '',
    manual_file_name: '',
  })
  const [isSaving, setIsSaving] = useState(false)

  const { data: app, isLoading } = useQuery({
    queryKey: ['app', appId],
    queryFn: () => getApp(appId!),
    enabled: !!appId,
  })

  useEffect(() => {
    if (app) {
      setFormData({
        app_id: app.app_id,
        name: app.name,
        description: app.description || '',
        detail_html: app.detail_html || '',
        custom_css: app.custom_css || (CSS_FRAMEWORKS[0]?.defaultCss || ''),
        icon_url: app.icon_url || '',
        is_public: app.is_public ?? true,
        manual_file_path: app.manual_file_path || '',
        manual_file_name: app.manual_file_name || '',
      })
    }
  }, [app])

  // 선택된 CSS 프레임워크 CDN 가져오기
  const getFrameworkCdn = () => {
    const framework = CSS_FRAMEWORKS.find(f => f.id === cssFramework)
    return framework?.cdn || ''
  }

  const selectedFramework = CSS_FRAMEWORKS.find(f => f.id === cssFramework)

  // 프레임워크 변경 핸들러
  const handleFrameworkChange = (frameworkId: string) => {
    const framework = CSS_FRAMEWORKS.find(f => f.id === frameworkId)
    if (framework && frameworkId !== cssFramework) {
      if (confirm(`CSS 프레임워크를 "${framework.name}"(으)로 변경하시겠습니까?\n\n⚠️ HTML과 CSS가 모두 해당 프레임워크에 맞는 템플릿으로 교체됩니다.`)) {
        setCssFramework(frameworkId)
        setFormData({ 
          ...formData, 
          custom_css: framework.defaultCss || '',
          detail_html: framework.defaultHtml || ''
        })
      }
    }
  }

  // 템플릿 초기화 핸들러
  const handleResetTemplate = () => {
    if (selectedFramework && confirm('현재 프레임워크의 기본 템플릿(HTML + CSS)으로 초기화하시겠습니까?')) {
      setFormData({ 
        ...formData, 
        custom_css: selectedFramework.defaultCss || '',
        detail_html: selectedFramework.defaultHtml || ''
      })
    }
  }

  // 플레이스홀더를 실제 값으로 대체
  const replacePlaceholders = useCallback((html: string) => {
    const downloadUrl = `/api/update/download/latest/${appId}`
    const manualDownloadUrl = formData.manual_file_path ? `/api/apps/public/${appId}/manual` : ''
    // 최신 버전 정보는 공개 페이지에서 자동으로 표시되므로 기본값 사용
    const latestVersion = '1.0.0'
    
    // 설치파일 다운로드 버튼 (항상 표시)
    const downloadButton = `<a href="${downloadUrl}" class="inline-flex items-center justify-center px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition">다운로드</a>`
    
    // 설명서 다운로드 버튼 (설명서가 있을 때만 표시)
    const manualButton = manualDownloadUrl ? `<a href="${manualDownloadUrl}" class="inline-flex items-center justify-center px-8 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition">설명서</a>` : ''
    
    return html
      .replace(/\{\{APP_NAME\}\}/g, formData.name || '앱 이름')
      .replace(/\{\{APP_DESCRIPTION\}\}/g, formData.description || '앱 설명')
      .replace(/\{\{APP_ID\}\}/g, appId || '')
      .replace(/\{\{ICON_URL\}\}/g, formData.icon_url || 'https://via.placeholder.com/128?text=App')
      .replace(/\{\{DOWNLOAD_URL\}\}/g, downloadUrl)
      .replace(/\{\{DOWNLOAD_BUTTON\}\}/g, downloadButton)
      .replace(/\{\{MANUAL_DOWNLOAD_URL\}\}/g, manualDownloadUrl || '')
      .replace(/\{\{MANUAL_DOWNLOAD_BUTTON\}\}/g, manualButton)
      .replace(/\{\{LATEST_VERSION\}\}/g, latestVersion)
  }, [appId, formData.name, formData.description, formData.icon_url, formData.manual_file_path])

  // HTML 템플릿 삽입 (기존 내용에 추가)
  const insertTemplate = (template: typeof HTML_TEMPLATES[0]) => {
    const htmlWithValues = replacePlaceholders(template.html)
    const newHtml = formData.detail_html 
      ? formData.detail_html + '\n\n' + htmlWithValues
      : htmlWithValues
    setFormData({ ...formData, detail_html: newHtml })
    setShowTemplateMenu(false)
  }

  // HTML 템플릿으로 전체 교체
  const replaceWithTemplate = (template: typeof HTML_TEMPLATES[0]) => {
    if (formData.detail_html && !confirm('현재 HTML 내용을 이 템플릿으로 교체하시겠습니까?')) {
      return
    }
    const htmlWithValues = replacePlaceholders(template.html)
    setFormData({ ...formData, detail_html: htmlWithValues })
    setShowTemplateMenu(false)
  }

  // 실시간 미리보기 업데이트
  useEffect(() => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument
      if (doc) {
        // 플레이스홀더 치환된 HTML 사용
        const htmlWithPlaceholders = formData.detail_html || '<div style="padding:2rem;color:#999;text-align:center">HTML 탭에서 내용을 입력하세요</div>'
        const htmlReplaced = replacePlaceholders(htmlWithPlaceholders)
        
        doc.open()
        doc.write(`<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${getFrameworkCdn()}
  <style>${formData.custom_css || ''}</style>
</head>
<body>
${htmlReplaced}
</body>
</html>`)
        doc.close()
      }
    }
  }, [formData.detail_html, formData.custom_css, cssFramework, replacePlaceholders])

  const updateMutation = useMutation({
    mutationFn: () => updateApp(appId!, formData),
    onSuccess: async () => {
      // 저장 성공 후 앱 정보 다시 로드하여 최신 상태 반영
      await queryClient.invalidateQueries({ queryKey: ['app', appId] })
      await queryClient.invalidateQueries({ queryKey: ['apps'] })
      setIsSaving(false)
      
      // 등록된 파일명이 있으면 함께 표시
      alert('저장되었습니다.')
    },
    onError: (error: any) => {
      setIsSaving(false)
      alert(error.response?.data?.detail || '저장에 실패했습니다.')
    },
  })

  const handleSave = async () => {
    setIsSaving(true)
    // 페이지 편집만 저장 (설정은 별도 모달에서 처리)
    updateMutation.mutate()
  }


  const handlePreviewNewTab = () => {
    const newWindow = window.open('', '_blank')
    if (newWindow) {
      // 플레이스홀더 치환된 HTML 사용
      const htmlWithPlaceholders = formData.detail_html || '<p>내용이 없습니다.</p>'
      const htmlReplaced = replacePlaceholders(htmlWithPlaceholders)
      
      newWindow.document.write(`<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${formData.name} - 미리보기</title>
  ${getFrameworkCdn().replace('<script', '<script')}
  <style>${formData.custom_css || ''}</style>
</head>
<body>
${htmlReplaced}
</body>
</html>`)
      newWindow.document.close()
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!app) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">앱을 찾을 수 없습니다</p>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between py-4 px-2 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link
            to={`/apps/${appId}`}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-gray-900">페이지 편집</h1>
            <p className="text-xs text-gray-500">{app.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePreviewNewTab}
            className="inline-flex items-center px-3 py-1.5 text-gray-700 bg-white border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50"
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            새 탭
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-1" />
            {isSaving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>

      {/* 메인 콘텐츠 - 좌우 분할 */}
      <div className="flex-1 flex overflow-hidden">
          {/* 좌측: 에디터 */}
          <div className="w-1/2 flex flex-col border-r border-gray-200">
            {/* 탭 */}
            <div className="flex border-b border-gray-200 bg-gray-50 flex-shrink-0">
              <button
                onClick={() => setActiveTab('html')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                  activeTab === 'html'
                    ? 'border-blue-600 text-blue-600 bg-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Code className="w-4 h-4" />
                HTML
              </button>
              <button
                onClick={() => setActiveTab('css')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                  activeTab === 'css'
                    ? 'border-blue-600 text-blue-600 bg-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Palette className="w-4 h-4" />
                CSS
              </button>
            </div>

            {/* HTML 탭일 때 템플릿 선택 UI */}
            {activeTab === 'html' && (
              <div className="px-3 py-2 bg-gray-100 border-b border-gray-200 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-600">HTML 템플릿 삽입</span>
                  <div className="relative">
                    <button
                      onClick={() => setShowTemplateMenu(!showTemplateMenu)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition"
                    >
                      <Plus className="w-3 h-3" />
                      템플릿 추가
                    </button>
                    
                    {showTemplateMenu && (
                      <div className="absolute right-0 top-full mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-[600px] overflow-y-auto flex flex-col">
                        <div className="p-3 border-b bg-gray-50 sticky top-0 z-10 flex-shrink-0">
                          <p className="text-xs font-medium text-gray-700">템플릿 선택</p>
                          <p className="text-xs text-gray-500 mt-1">
                            플레이스홀더(앱이름, 다운로드URL 등)가 자동으로 채워집니다
                          </p>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                          {HTML_TEMPLATES.map((template) => (
                            <div key={template.id} className="p-3 hover:bg-gray-50 border-b last:border-b-0">
                              <div className="flex items-start gap-3">
                                <span className="text-2xl">{template.icon}</span>
                                <div className="flex-1">
                                  <p className="font-medium text-sm text-gray-800">{template.name}</p>
                                  <p className="text-xs text-gray-500 mb-2">{template.description}</p>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => insertTemplate(template)}
                                      className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                    >
                                      추가
                                    </button>
                                    <button
                                      onClick={() => replaceWithTemplate(template)}
                                      className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                    >
                                      전체 교체
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="p-3 bg-yellow-50 border-t sticky bottom-0 z-10 flex-shrink-0">
                          <p className="text-xs text-yellow-800">
                            <strong>플레이스홀더:</strong> {'{{APP_NAME}}'}, {'{{APP_DESCRIPTION}}'}, {'{{ICON_URL}}'}, {'{{DOWNLOAD_URL}}'}, {'{{DOWNLOAD_BUTTON}}'}, {'{{MANUAL_DOWNLOAD_URL}}'}, {'{{MANUAL_DOWNLOAD_BUTTON}}'}, {'{{LATEST_VERSION}}'} 등이 실제 값으로 변환됩니다
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* CSS 탭일 때 프레임워크 선택 UI */}
            {activeTab === 'css' && (
              <div className="px-3 py-2 bg-gray-100 border-b border-gray-200 flex-shrink-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-600">CSS 프레임워크 (변경 시 HTML+CSS 모두 교체)</span>
                  <button
                    onClick={handleResetTemplate}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                  >
                    <RotateCcw className="w-3 h-3" />
                    템플릿 초기화
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {CSS_FRAMEWORKS.map((framework) => (
                    <button
                      key={framework.id}
                      onClick={() => handleFrameworkChange(framework.id)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                        cssFramework === framework.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-600 border border-gray-300 hover:border-blue-400 hover:text-blue-600'
                      }`}
                    >
                      {framework.name}
                    </button>
                  ))}
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    💡 {selectedFramework?.example}
                  </p>
                  {selectedFramework?.docsUrl && (
                    <a
                      href={selectedFramework.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                    >
                      📖 공식 문서
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* 에디터 영역 */}
            <div className="flex-1 overflow-hidden">
              {activeTab === 'html' && (
                <Editor
                  height="100%"
                  language="html"
                  value={formData.detail_html}
                  onChange={(value) => setFormData({ ...formData, detail_html: value || '' })}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: 'on',
                    wordWrap: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    padding: { top: 12 },
                  }}
                />
              )}
              {activeTab === 'css' && (
                <Editor
                  height="100%"
                  language="css"
                  value={formData.custom_css}
                  onChange={(value) => setFormData({ ...formData, custom_css: value || '' })}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: 'on',
                    wordWrap: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    padding: { top: 12 },
                  }}
                />
              )}
            </div>
          </div>

          {/* 우측: 실시간 미리보기 */}
          <div className="w-1/2 flex flex-col bg-gray-100">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">미리보기</span>
                <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                  {selectedFramework?.name}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-red-400"></span>
                <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                <span className="w-3 h-3 rounded-full bg-green-400"></span>
              </div>
            </div>
            
            <div className="flex-1 overflow-hidden bg-white">
              <iframe
                ref={iframeRef}
                className="w-full h-full border-0"
                title="미리보기"
              />
            </div>
          </div>
        </div>
    </div>
  )
}
