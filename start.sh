#!/bin/bash
# ================================================================
# GAM (General Academic Manager) - 전체 서비스 시작 스크립트
# 사용법: bash start.sh
# ================================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo "🚀 GAM 서비스 시작..."
echo "=================================================="

# ── 1. fnm(Node.js) 환경 로드 ───────────────────────────────────
export PATH="$LOCALAPPDATA/Microsoft/WinGet/Links:$PATH"
eval "$(fnm env --shell bash)" 2>/dev/null || true

# ── 2. Docker Desktop 확인 및 시작 ──────────────────────────────
echo "🐳 Docker Desktop 확인 중..."
if ! docker info > /dev/null 2>&1; then
  echo "   Docker Desktop이 꺼져 있습니다. 시작합니다..."
  start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
  echo "   Docker Desktop이 준비될 때까지 대기 중 (최대 60초)..."
  for i in $(seq 1 12); do
    sleep 5
    if docker info > /dev/null 2>&1; then
      echo "   ✅ Docker Desktop 준비 완료"
      break
    fi
    echo "   대기 중... ($((i*5))초)"
  done
fi

if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker Desktop 시작 실패. Docker Desktop을 수동으로 실행 후 다시 시도하세요."
  exit 1
fi

# ── 3. Docker 컨테이너 시작 (PostgreSQL + Redis) ─────────────────
echo ""
echo "🗄️  DB/Redis 컨테이너 시작 중..."
docker compose up -d
echo "   ✅ DB/Redis 준비 완료"

# ── 4. 기존 포트 프로세스 정리 ──────────────────────────────────
echo ""
echo "🧹 포트 정리 중..."
PORT_3000=$(netstat -ano 2>/dev/null | grep ":3000 " | grep "LISTENING" | awk '{print $5}' | head -1)
PORT_4000=$(netstat -ano 2>/dev/null | grep ":4000 " | grep "LISTENING" | awk '{print $5}' | head -1)

if [ -n "$PORT_3000" ] && [ "$PORT_3000" != "0" ]; then
  taskkill //PID "$PORT_3000" //F > /dev/null 2>&1 && echo "   포트 3000 기존 프로세스 종료"
fi
if [ -n "$PORT_4000" ] && [ "$PORT_4000" != "0" ]; then
  taskkill //PID "$PORT_4000" //F > /dev/null 2>&1 && echo "   포트 4000 기존 프로세스 종료"
fi

# ── 5. API 서버 시작 (NestJS) ────────────────────────────────────
echo ""
echo "⚙️  API 서버 시작 중 (포트 4000)..."
cd "$SCRIPT_DIR/apps/api"
node dist/src/main.js > "$SCRIPT_DIR/logs/api.log" 2>&1 &
API_PID=$!
echo "   ✅ API 서버 시작됨 (PID: $API_PID)"

# ── 6. Web 서버 시작 (Next.js) ───────────────────────────────────
echo ""
echo "🌐 Web 서버 시작 중 (포트 3000)..."
cd "$SCRIPT_DIR/apps/web"
rm -rf .next  # Windows 파일 잠금 캐시 방지
pnpm dev > "$SCRIPT_DIR/logs/web.log" 2>&1 &
WEB_PID=$!
echo "   ✅ Web 서버 시작됨 (PID: $WEB_PID)"

# ── 7. 준비 대기 ─────────────────────────────────────────────────
echo ""
echo "⏳ 서버 준비 대기 중..."
sleep 6

echo ""
echo "=================================================="
echo "✅ 모든 서비스가 시작되었습니다!"
echo ""
echo "  🌐 Web:  http://localhost:3000"
echo "  ⚙️  API:  http://localhost:4000"
echo "  📚 Swagger: http://localhost:4000/api"
echo ""
echo "  📄 로그 확인:"
echo "     API: tail -f logs/api.log"
echo "     Web: tail -f logs/web.log"
echo ""
echo "  🔑 테스트 계정:"
echo "     선생님: teacher@example.com / Password123!"
echo "     학생:   student@example.com / Password123!"
echo "=================================================="
