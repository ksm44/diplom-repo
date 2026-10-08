#!/usr/bin/env bash
#
# deploy.sh — автоматическое развёртывание проекта
# Запуск: sudo bash deploy.sh
# (запускал на ubuntu-26.04)



set -euo pipefail

# ==== Настройки ====
REPO_URL="https://github.com/ksm44/diplom-repo.git"
PROJECT_DIR="/root/diplom-repo"
WEB_ROOT="/var/www/diplom"
NGINX_CONF_NAME="diplom"
BACKEND_URL="http://localhost:8000"

ADMIN_USERNAME="admin@admin.ru"
ADMIN_PASSWORD="superpassword"

GUEST_USERNAME="guest@guest.ru"
GUEST_PASSWORD="superpassword2"

# ==== Цвета для вывода ====
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}==>${NC} $*"; }
warn() { echo -e "${YELLOW}[!]${NC} $*"; }
fail() { echo -e "${RED}[x]${NC} $*" >&2; exit 1; }

# ==== Проверка root ====
if [[ $EUID -ne 0 ]]; then
  fail "Скрипт нужно запускать от root: sudo bash deploy.sh"
fi

# ==== Отключаем фоновые автообновления, чтобы apt не блокировался ====
systemctl stop unattended-upgrades 2>/dev/null || true
systemctl disable unattended-upgrades 2>/dev/null || true


# ==== 1. Клонирование / обновление репозитория ====
if [[ -d "$PROJECT_DIR/.git" ]]; then
  log "Обновляю репозиторий в $PROJECT_DIR"
  git -C "$PROJECT_DIR" pull
else
  log "Клонирую репозиторий в $PROJECT_DIR"
  git clone "$REPO_URL" "$PROJECT_DIR"
fi

cd "$PROJECT_DIR"

# ==== 2. Установка Docker, Nginx, npm ====
if ! command -v docker &>/dev/null; then
  log "Устанавливаю Docker"
  curl -fsSL https://get.docker.com | sh
else
  log "Docker уже установлен: $(docker --version)"
fi

if ! command -v nginx &>/dev/null; then
  log "Устанавливаю Nginx"
  apt update -y
  apt install -y nginx
else
  log "Nginx уже установлен: $(nginx -v 2>&1)"
fi

if ! command -v npm &>/dev/null; then
  log "Устанавливаю npm"
  apt install -y npm
fi

# ==== 3. backend/.env ====
if [[ ! -f backend/.env ]]; then
  log "Создаю backend/.env"
  cat > backend/.env <<'EOF'
# PostgreSQL
POSTGRES_USER=postgresUser
POSTGRES_PASSWORD=postgresPassword
POSTGRES_DB=cinema
POSTGRES_HOST_AUTH_METHOD=scram-sha-256

# Backend
SECRET_KEY=change_me_to_long_random_string
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=20

# Подключение к БД внутри Docker-сети
DB_HOST=db
DB_PORT=5432
EOF
  warn "Проверьте backend/.env — при необходимости смените SECRET_KEY и пароль БД"
else
  log "backend/.env уже существует — пропускаю"
fi

# ==== 4. Запуск backend + db ====
log "Поднимаю backend + db"
docker compose up -d --build

log "Ожидание готовности backend..."
for i in {1..30}; do
  if curl -sf -o /dev/null "${BACKEND_URL}/docs"; then
    log "Backend отвечает на ${BACKEND_URL}/docs"
    break
  fi
  sleep 2
  if [[ $i -eq 30 ]]; then
    fail "Backend не поднялся за 60 секунд. Смотрите: docker compose logs backend"
  fi
done

# ==== 5. Создание учётки администратора (если её нет) ====
log "Проверяю наличие администратора..."
ADMIN_EXISTS=$(docker compose exec -T db psql -U postgresUser -d cinema -tAc \
  "SELECT 1 FROM users WHERE username='${ADMIN_USERNAME}' LIMIT 1;" 2>/dev/null || echo "")

if [[ "$ADMIN_EXISTS" != "1" ]]; then
  log "Создаю пользователя ${ADMIN_USERNAME} через API"
  curl -s -X POST "${BACKEND_URL}/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"${ADMIN_USERNAME}\",\"password\":\"${ADMIN_PASSWORD}\"}" \
    > /dev/null || warn "Не удалось зарегистрировать пользователя (возможно, уже существует)"

  log "Повышаю роль до ADMINISTRATOR"
  docker compose exec -T db psql -U postgresUser -d cinema -c \
    "UPDATE users SET role='ADMINISTRATOR' WHERE username='${ADMIN_USERNAME}';" \
    > /dev/null
  log "Администратор ${ADMIN_USERNAME} готов"
else
  log "Администратор ${ADMIN_USERNAME} уже существует — пропускаю"
fi

# Создание пользователя гостя
  curl -s -X POST "${BACKEND_URL}/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"${GUEST_USERNAME}\",\"password2\":\"${GUEST_PASSWORD}\"}" \
    > /dev/null || warn "Не удалось зарегистрировать пользователя (возможно, уже существует)"

# ==== 6. Сборка frontend ====
log "Собираю frontend"
cd "$PROJECT_DIR/frontend"
npm install
npm run build

if [[ ! -f dist/index.html ]]; then
  fail "Сборка frontend не удалась: нет dist/index.html"
fi
log "Сборка готова: $(du -sh dist | cut -f1)"

# ==== 7. Копирование dist/ в /var/www/diplom ====
log "Копирую dist/ в $WEB_ROOT"
mkdir -p "$WEB_ROOT"
rm -rf "${WEB_ROOT:?}/"*
cp -r "$PROJECT_DIR/frontend/dist/"* "$WEB_ROOT/"
chown -R www-data:www-data "$WEB_ROOT"

# ==== 8. Nginx ====
NGINX_AVAILABLE="/etc/nginx/sites-available/${NGINX_CONF_NAME}"
NGINX_ENABLED="/etc/nginx/sites-enabled/${NGINX_CONF_NAME}"

if [[ -f "$PROJECT_DIR/frontend/nginx.conf" ]]; then
  log "Копирую nginx.conf из репозитория"
  cp "$PROJECT_DIR/frontend/nginx.conf" "$NGINX_AVAILABLE"
else
  warn "frontend/nginx.conf не найден — создаю минимальный"
  cat > "$NGINX_AVAILABLE" <<EOF
server {
    listen 80;
    server_name _;

    root ${WEB_ROOT};
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    location /static/ {
        proxy_pass http://localhost:8000/static/;
        proxy_set_header Host \$host;
    }
}
EOF
fi

log "Активирую конфиг Nginx"
ln -sf "$NGINX_AVAILABLE" "$NGINX_ENABLED"
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl reload nginx

# ==== 9. Итоговая проверка ====
log "Проверяю фронт"
if curl -sf -o /dev/null http://localhost/; then
  log "Frontend отвечает на http://localhost/"
else
  warn "Frontend не отвечает — смотрите /var/log/nginx/error.log"
fi

echo
log "Готово!"
echo "  Backend:  ${BACKEND_URL}/docs"
echo "  Frontend: локальный http://$(hostname -I | awk '{print $1}')/"
echo
echo "  Админ:    ${ADMIN_USERNAME} / ${ADMIN_PASSWORD}"
echo "  Гость:    ${GUEST_USERNAME} / ${GUEST_PASSWORD}"
echo