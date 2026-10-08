## Содержание
- [Порядок ручного запуска проекта](#порядок-ручного-запуска-проекта)
- [Автоматическое развёртывание и запуск проекта](#автоматическое-развёртывание-и-запуск-проекта)
- [Детальное описание структуры папок и файлов проекта](#детальное-описание-структуры-папок-и-файлов-проекта)
- [О проекте](#о-проекте)

# Порядок ручного запуска проекта:

Шаг 1. Склонировать репо
    
    git clone https://github.com/ksm44/diplom-repo.git
    cd diplom-repo

Шаг 2. Установить Docker и Docker Compose
    
    sudo apt update && sudo apt upgrade -y
    Установить Docker
    curl -fsSL https://get.docker.com | sudo sh

(на Windows - запустить Docker Desktop + vpn для доступу к образам hub.docker.com)

Шаг 3. Создать .env файл и заполнить его соответствующим содержимым

    touch ~/diplom-repo/backend/.env
    nano ~/diplom-repo/backend/.env

Пример содержимого.env:

    # PostgreSQL
    POSTGRES_USER=randomUser
    POSTGRES_PASSWORD=randomPassword
    POSTGRES_DB=cinema
    POSTGRES_HOST_AUTH_METHOD=scram-sha-256

    # BACKEND
    SECRET_KEY=change-me-to-long-random-string
    ALGORITHM=HS256
    ACCESS_TOKEN_EXPIRE_MINUTES=20

    # Подключение к БД
    DB_HOST=db
    DB_PORT=5432
    DB_NAME=cinema

Шаг 4. Запуск Docker, запуск BACKEND, запуск DATABASE

    docker compose up -d --build

Шаг 5. Проверить, что BACKEND работает 

    docker compose ps
👆 должны подняться и работать 2 сервиса: db и backend

    curl http://localhost:8000/docs -I
👆 в ответе должно быть HTTP/1.1 200 OK

Шаг 6. Создать учётку Администратора кинотеатра

  Сначала создать учётку простого пользователя:

    root@cv7928717:~/diplom-repo# curl -X POST http://localhost:8000/auth/register \
    -H "Content-Type: application/json" \
    -d '{"username":"admin@admin.ru","password":"superpassword"}'

  Потом поменять роль этой учётки с GUEST на ADMINISTRATOR:

    docker compose exec db psql -U mySuperUser -d cinema -c "UPDATE users SET role='ADMINISTRATOR' WHERE username='admin@admin.ru';"

Шаг 7. Запустить FRONTEND

    cd ~/diplom-repo/frontend
    apt install npm
    npm install
    npm run build

  Установить Nginx:

    sudo apt install -y nginx
  
  Скопировать dist/ в /var/www/:

    sudo mkdir -p /var/www/diplom
    sudo cp -r /root/diplom-repo/frontend/dist/* /var/www/diplom/
    sudo chown -R www-data:www-data /var/www/diplom

  Настроить Nginx:

    sudo nano /etc/nginx/sites-available/diplom

  Можно просто перенести настройки для Nginx:

    sudo cp ~/diplom-repo/frontend/nginx.conf /etc/nginx/sites-available/diplom

Активировать конфиг и перезапустить Nginx:

    sudo ln -sf /etc/nginx/sites-available/diplom /etc/nginx/sites-enabled/diplom
    sudo rm -f /etc/nginx/sites-enabled/default
    sudo nginx -t
    sudo systemctl reload nginx

Проверка запуска проекта:

    curl -I http://localhost/
👆 в ответе должно быть HTTP/1.1 200 OK

  Открыть в браузере
    
    http://<адрес сайта>

👆 должна открыться страница регистрации/входа по логину и паролю

#  Автоматическое развёртывание и запуск проекта:
В репо также есть deploy.sh, чтобы запустить - выполнить:

    sudo bash deploy.sh

# Детальное описание структуры папок и файлов проекта

       diplom/
       ├── .dockerignore
       ├── .gitignore
       ├── deploy.sh (скрипт для автоматического развертывания проекта на сервере)
       ├── docker-compose.yml (YAML инструкция для создания образов и контейнеров сервисов: DB и backend)
       ├── Dockerfile (YAML инструкция для создания Docker-образа backend-сервиса)
       ├── README.md (документация проекта)
       │
       ├── backend/ 
       │   ├── .env (секретные настройки: пароли, ключи - в git не коммитится)
       │   ├── requirements.txt (список необходимых Python-библиотек)
       │   │
       │   ├── app/
       │   │   ├── main.py (точка входа: создаёт FastAPI-приложение, подключает роутеры и CORS)
       │   │   ├── __init__.py (помечает папку app как Python-пакет)
       │   │   │
       │   │   ├── api/
       │   │   │   ├── dependencies.py (фабрики зависимостей: сессия БД, сервисы, текущий пользователь, проверка роли админа)
       │   │   │   │
       │   │   │   └── routers/
       │   │   │           auth.py (эндпоинты регистрации и входа)
       │   │   │           hall.py (CRUD залов кинотеатра, конфигурация кресел и цен, активация продаж)
       │   │   │           movie.py (CRUD фильмов, загрузка постера)
       │   │   │           screening.py (CRUD сеансов, массовое сохранение сеансов дня)
       │   │   │           ticket.py (покупка билета, список мои билеты)
       │   │   │
       │   │   ├── core/
       │   │   │       config.py (читает .env: параметры подключения к БД, CORS)
       │   │   │       security.py (хэширование паролей bcrypt, создание и проверка JWT)
       │   │   │
       │   │   ├── db/
       │   │   │       session.py (создаёт engine и фабрику сессий, отдаёт сессию через get_db)
       │   │   │
       │   │   ├── models/
       │   │   │       base.py (общий базовый класс для всех таблиц, генерирует UUID-первичный ключ)
       │   │   │       halls.py (таблица halls - залы)
       │   │   │       movies.py (таблица movies - фильмы)
       │   │   │       screenings.py (таблица screenings)
       │   │   │       seats.py (таблица seats - кресла (места))
       │   │   │       tickets.py (таблицы tickets-биллеты и ticket_seats-связь билет/кресло)
       │   │   │       users.py (таблица users - пользователи)
       │   │   │       __init__.py (помечает папку models как Python-пакет)
       │   │   │
       │   │   ├── repositories/
       │   │   │       halls.py (SQL-запросы к таблице halls)
       │   │   │       movies.py (SQL-запросы к таблице movies)
       │   │   │       screenings.py (SQL-запросы к таблице screenings, фильтр по дате)
       │   │   │       seats.py (SQL-запросы к таблице seats)
       │   │   │       tickets.py (SQL-запросы к таблицам tickets и ticket_seats)
       │   │   │       users.py (SQL-запросы к таблице users)
       │   │   │
       │   │   ├── schemas/
       │   │   │       halls.py (Pydantic-схемы для залов)
       │   │   │       movies.py (Pydantic-схемы для фильмов)
       │   │   │       screenings.py (Pydantic-схемы для сеансов)
       │   │   │       seats.py (Pydantic-схемы для кресел)
       │   │   │       tickets.py (Pydantic-схемы для билетов)
       │   │   │       users.py (Pydantic-схемы: логин, регистрация, токен, пользователь)
       │   │   │       __init__.py (помечает папку schemas как Python-пакет)
       │   │   │
       │   │   ├── services/
       │   │   │       auth.py (логика входа и регистрации)
       │   │   │       hall.py (бизнес-логика залов)
       │   │   │       movie.py (бизнес-логика фильмов)
       │   │   │       screening.py (бизнес-логика сеансов)
       │   │   │       ticket.py (бизнес-логика покупки биллетов)
       │   │   │
       │   │   └── static/
       │   │       ├── posters/
       │   │       │       12d4a563-7330-48a3-a310-a373469e6092.png ... (загружаемые Админом постеры фильмов)
       │   │       │
       │   │       └── qrcodes/
       │   │               1180f008-bd43-433b-9a9b-6d29e3af92a4.png ... (сформированные QR-коды проданных билетов)
       │   │    
       │   │
       │   └── tests/ (для тестов)
       │           conftest.py (общие фикстуры для тестов)
       │           test_movies.py (тесты эндпоинта /movies: успех, 401, 403, 409)
       │           __init__.py (помечает папку tests как Python-пакет)
       │
       └── frontend/
              ├── .babelrc (настройки Babel для старых версий инструментов)
              ├── babel.config.js (настройки Babel для перевода JS и JSX в понятный браузеру код)
              ├── jest.config.js (настройки Jest: где искать тесты и как их запускать)
              ├── nginx.conf (для настройки NGINX при деплое)
              ├── package-lock.json (точные версии всех установленных npm-пакетов)
              ├── package.json (список зависимостей проекта и команды запуска)
              ├── webpack.config.js (настройки сборки: точка входа, прокси на бэкенд, правила для CSS/картинок)
              │
              ├── dist/ (готовая production-сборка фронтенда: index.html и один JS-файл — этот каталог раздаёт Nginx)
              ├── node_modules/ (библиотеки проекта)
              │
              ├── public/
              │       favicon.ico (иконка сайта во вкладке браузера)
              │       index.html (HTML-шаблон, в который Webpack вставит собранный JS)
              │
              ├── src/
              │   ├── App.jsx (корневой компонент: маршруты, проверка токена, обёртка роутера)
              │   ├── main.jsx (точка входа фронтенда)
              │   │
              │   ├── admin/ (всё, что относится к Администрраторской странице)
              │   │   ├── components
              │   │   │       Accordion.jsx (сворачиваемые секции в админке)
              │   │   │       AddMovieModal.jsx (всплывающее окно: добавить фильм + загрузить постер)
              │   │   │       MovieScreeningModal.jsx (всплывающее окно: добавить сеанс фильма + удалить фильм)
              │   │   │       ScreeningDetailsModal.jsx (всплывающее окно: информация о сеансе, схема зала, удаление)
              │   │   │
              │   │   └── pages/
              │   │           AdminDashboardPage.jsx (Администррраторская)
              │   │
              │   ├── assets/ (картинки, фоны, постеры)
              │   │   └── images... 
              │   │
              │   ├── components/ (общие компоненты для всех страниц)
              │   │       Button.jsx (универсальная кнопка)
              │   │       HallScheme.jsx (схема кресел зала)
              │   │       Header.jsx (шапка сайта)
              │   │       LogoutButton.jsx (кнопка Выйти - чистит токен и ведёт на /login)
              │   │       MyTicketsModal.jsx (всплывающее окно: список моих билетов с QR-кодами)
              │   │       Popup.jsx (базовое всплывающее окно)
              │   │       PrivateRoute.jsx (защита страниц: редирект без токена - на /login, без роли - на /)
              │   │
              │   ├── layouts/ (обёртки страниц: шапка/подвал/общее оформление)
              │   │       AdminLayout.jsx (оформление для страниц админки)
              │   │       MainLayout.jsx (оформление для страниц клиента)
              │   │
              │   ├── pages/ (страницы клиентской части)
              │   │       HallPage.jsx (выбор мест в зале на конкретный сеанс)
              │   │       HomePage.jsx (афиша: фильмы, залы, времена сеансов, кнопка Мои билеты)
              │   │       LoginPage.jsx (форма входа)
              │   │       NotFoundPage.jsx (страница 404)
              │   │       PaymentPage.jsx (подтверждение выбранных мест и итоговая стоимость)
              │   │       TicketPage.jsx (электронный билет с QR-кодом)
              │   │
              │   ├── services/
              │   │       api.js (единая обёртка над fetch: подставляет токен, ловит 401 направляет на /login, отдаёт detail ошибки)
              │   │
              │   └── styles/
              │       ├── admin/
              │       │       normalize.css (сброс стилей браузера для админки)
              │       │       styles.css (все стили админки)
              │       │
              │       └── client/
              │               normalize.css (сброс стилей браузера для клиента)
              │               styles.css (все стили клиентской страницы)
              │
              ├── tests/
              │       PrivateRoute.test.jsx (тесты защиты страниц: без токена, с валидным токеном, с ролью guest)
              │       setupTests.js (подготовка Jest)
              │
              └── __mocks__/
                      fileMock.js (заглушка для импорта картинок в тестах)    


# О проекте

SPA приложение (одно React-приложение для client и admin).
Back-end: FastAPI, слои api → services → repositories → models
Front-end: React, React Router.

BACKEND и DB - в Docker-контейнерах
FRONTEND - не в Docker-контейнере (запускается и работает сразу на хосте)

Всё время в системе (БД, API, backend, предполгагается что frontend также на UTC+3) — в часовом поясе UTC+3 (МСК) 
и нигде не конвертируется в тайм-зонах,
(т.е. при смене часового пояса потребуется правка всех мест работы с datetime).

* Нельзя менять схему зала (сетку мест), если есть проданные билеты - будет ошибка 409.
* Сеансы: только в будущем, не выходят за сутки, не пересекаются в одном зале.
* Админ создаётся вручную в БД (role = 'ADMINISTRATOR'), регистрация даёт только роль гостя.
* Регистрация дает JWT и хранит в localStorage, дальше JWT используется в заголовке Authorization: Bearer <token>.
* Роль в JWT-токене должна называться именно administrator (чтобы попасть в Администраторскую).
* JWT-токен по дефолту действует 20 минут (если истек - фронтенд удаляет его из localStorage,
автообновления JWT нет - только логиниться заново)
* Билеты: покупка без оплаты, без возврата денежных средств.
* Сеансы в прошлом — недоступны для редактирования (метод PUT принудительно ограничен в изменении сеансов в прошлом!).
* Пользователь не привязан к билету через UI (в ЛК пользователя не посмотреть биллеты, но в API сделал метод)
* Создаваемые залы по умолчанию неактивны с сеткой 10х8.
* Сеанс создаётся кликом по фильму и указание времени начала.
* После правок в Админке нажимать кнопку «Сохранить», иначе изменения не уйдут в БД.
* Не реализовано получение серверного времени и даты: в теории возможно, что на ПК Админа может быть старое системное
системное время и дата - при PUT сеанса в прошлом.
* Можно удалять фильм (в т.ч. с сеансами, которые ещё не прошли).
* Можно удалять фильмы, на сеансы которых куплены биллеты.
* Подробные ошибки от сервера пока на оригинальном английском (перевод подробностей ошибок на русский не реализован)

Hall - зал кинотеатра
Seat - кресло
Screening - сеанс
Movie - фильм
Tiсket - биллет

Условные договоренности:
- нельзя купить билеты на прошедший сеанс и даже на идущий(начавшийся)
- не учитываем, что после выбора кресел(мест) до нажатия кнопки "Получить код бронирования" будет окно,
в котором другой пользователь может купить одно/несколько/все кресла основного пользователя,
и также не учитываем, что в этом временном окне админ может перенести время начала сеанса,
поменять стоимость, тип кресел.
- реальная покупка(оплата) реализовываться не будет - нажатие кнопки "Получить код бронирования" = покупка билета
- нельзя создать сеанс в прошлом

На все места один QR.
Что в QR(пример): 

    Билет:4ee83622-9ef3-4bee-a5a2-2244b6d10067
    |Сеанс:2026-10-06 14:00
    |Зал:1
    |Места:10-8,10-9
    |Сумма:888

Админ при добавлении фильма загружает постер(картинку).
Постер будет хранить backEnd (в Docker-контейнере в каталоге /code/static/posters)


## Cлоистая архитектура проекта:
    Web application
     ↓
    API
     ↓
    Service
     ↓
    Repository
     ↓
    Database

## Поток данных:
    HTTP-запрос
        │
        ▼
    Pydantic (валидация входа)
        │
        ▼
    FastAPI (роутинг, DI)
        │
        ▼
    SQLAlchemy ORM (Python-объекты ↔ SQL)
        │
        ▼
    psycopg (драйвер, протокол PostgreSQL)
        │
        ▼
    PostgreSQL (таблица halls)
        │
        ▼
    SQLAlchemy ORM (результат → Python-объект)
        │
        ▼
    Pydantic (сериализация в JSON)
        │
        ▼
    HTTP-ответ