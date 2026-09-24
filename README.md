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
- процесс покупки реализовываться не будет - нажатие на кнопку "Получить код бронирования" = покупка билета
- возврат билета не предусмотрен
- нельзя создать сеанс в прошлом

Создание QR: 
    qr --output=test.png "Some text"

Просмотр сформированного QR при выдаче биллета:
    http://localhost:8000/static/qrcodes/{code}.png
    Например: http://localhost:8000/static/qrcodes/c46b90fa-e015-47c5-95c6-9d674aa1e661.png

# Здесь будет:
- детальное описание структуры папок и файлов проекта,
- а также инструкции по его развёртыванию и запуску

В случае применения дополнительных инструментов, которые не изучались в программе, должны быть приложены ссылки на документацию по их установке и использованию

# Установка и настройка
sudo apt-get update
sudo apt-get install docker-compose-plugin
(если работа с Docker выполняется на Windows - запустить Docker Desktop )

Фишка FastAPI в его ассинхронности, поэтому при установки SQLAlchemy указываем [asyncio] — это extra-зависимость,
которая автоматически ставит библиотеку greenlet
pip install sqlalchemy[asyncio]

Для работы с локальными "секретными" пременными окружения нужен пакет dotenv и файл .env
pip install python-dotenv

!!! Связка Windows + Docker Desktop + asyncpg не работает. Поэтому пока через psycopg , а перед деплоем нужно будет
вернуться к  asyncpg !!!

DockerDesktop может не запускать работу с контейнерами, если ранее первичный запуск был через VPN
(требется настройка прокси). 

Добавил .dockerignore чтобы ускорить сборку новых Docker-образов и запуск контейнеров в целом

## Примерное описание (текущей) структуры:
    diplom/
    ├── admin/
    │   ├── css/
    │   ├── i/
    │   ├── js/
    │   ├── index.html
    │   └── login.html
    │
    ├── backend/
    │   ├── app/
    │   │   ├── api/
    │   │   │   ├── routers/
    │   │   │   │   └── hall.py
    │   │   │   └── dependencies.py
    │   │   ├── core/
    │   │   │   └── config.py
    │   │   ├── db/
    │   │   │   └── session.py
    │   │   ├── models/
    │   │   │   ├── base.py
    │   │   │   └── halls.py
    │   │   ├── repositories/
    │   │   │   └── halls.py
    │   │   ├── schemas/
    │   │   │   └── halls.py
    │   │   ├── services/
    │   │   │   └── hall.py
    │   │   └── main.py
    │   ├── .env
    │   └── requirements.txt
    ├── frontend/ 
    ...
    ├── client/
    │   ├── css/
    │   ├── i/
    │   ├── hall.html
    │   ├── index.html
    │   ├── payment.html
    │   └── ticket.html
    │
    ├── .dockerignore
    ├── docker-compose.yml
    ├── Dockerfile
    └── README.md

## Начал слоистую архитектуру проекта:
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