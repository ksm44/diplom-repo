import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/client/normalize.css';
import '../styles/client/styles.css';
import { apiGet } from '../services/api';
import LogoutButton from '../components/LogoutButton';
import MyTicketsModal from '../components/MyTicketsModal';

const WEEK_DAYS_SHORT = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

// YYYY-MM-DD (локальное)
function toDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// 6 дней, начиная с startDate
function buildDays(startDate) {
  return Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    return {
      date: toDateStr(d),
      week: WEEK_DAYS_SHORT[d.getDay()],
      num: d.getDate(),
      isWeekend: d.getDay() === 0 || d.getDay() === 6,
    };
  });
}

// "18:30" из naive-строки (бэкенд отдаёт уже МСК, без Z)
function formatTime(iso) {
  return iso.slice(11, 16);
}

// Сегодня в 00:00 (локально)
function getToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function HomePage() {
  const today = useMemo(getToday, []);
  const [batchStart, setBatchStart] = useState(today);
  const [showMyTickets, setShowMyTickets] = useState(false);

  const days = useMemo(() => {
    const list = buildDays(batchStart);
    list[0] = { ...list[0], isToday: batchStart.getTime() === today.getTime() };
    return list;
  }, [batchStart, today]);

  const [selectedDate, setSelectedDate] = useState(days[0].date);

  useEffect(() => {
    setSelectedDate(days[0].date);
  }, [batchStart]);

  const [movies, setMovies] = useState([]);
  const [screenings, setScreenings] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiGet('/movies')
      .then(setMovies)
      .catch(() => setError('Не удалось загрузить фильмы'));
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ date_screening: selectedDate });
    apiGet(`/screenings?${params.toString()}`)
      .then(setScreenings)
      .catch(() => setError('Не удалось загрузить сеансы'))
      .finally(() => setLoading(false));
  }, [selectedDate]);

  // movie_id -> hall_number -> { times: [...], is_active }
  const grouped = useMemo(() => {
    const map = new Map();
    for (const s of screenings) {
      if (!map.has(s.movie_id)) map.set(s.movie_id, new Map());
      const byHall = map.get(s.movie_id);
      if (!byHall.has(s.hall_number)) {
        byHall.set(s.hall_number, { times: [], is_active: s.is_active });
      }
      byHall.get(s.hall_number).times.push({ id: s.id, start: s.datetime_start });
    }
    for (const byHall of map.values()) {
      for (const obj of byHall.values()) {
        obj.times.sort((a, b) => a.start.localeCompare(b.start));
      }
    }
    return map;
  }, [screenings]);

  const movieById = useMemo(
    () => Object.fromEntries(movies.map((m) => [m.id, m])),
    [movies]
  );

  const canGoBack = batchStart.getTime() > today.getTime();

  function goNext() {
    const next = new Date(batchStart);
    next.setDate(batchStart.getDate() + 6);
    setBatchStart(next);
  }

  function goBack() {
    const prev = new Date(batchStart);
    prev.setDate(batchStart.getDate() - 6);
    if (prev.getTime() < today.getTime()) {
      setBatchStart(today);
    } else {
      setBatchStart(prev);
    }
  }

  return (
    <>
      <header className="page-header">
        <div className="page-header__actions">
          <button
            className="page-header__logout"
            onClick={() => setShowMyTickets(true)}
          >
            Мои билеты
          </button>
          <LogoutButton />
        </div>
      </header>

      <nav className="page-nav">
        {canGoBack && (
          <a
            className="page-nav__day page-nav__day_prev"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              goBack();
            }}
          />
        )}

        {days.map((d) => (
          <a
            key={d.date}
            className={
              'page-nav__day' +
              (d.isToday ? ' page-nav__day_today' : '') +
              (d.date === selectedDate ? ' page-nav__day_chosen' : '') +
              (d.isWeekend ? ' page-nav__day_weekend' : '')
            }
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setSelectedDate(d.date);
            }}
          >
            <span className="page-nav__day-week">{d.week}</span>
            <span className="page-nav__day-number">{d.num}</span>
          </a>
        ))}

        <a
          className="page-nav__day page-nav__day_next"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            goNext();
          }}
        />
      </nav>

      <main>
        {error && <p style={{ color: 'red', padding: 16 }}>{error}</p>}
        {loading && <p style={{ padding: 16 }}>Загрузка...</p>}

        {[...grouped.entries()].map(([movieId, hallsMap]) => {
          const movie = movieById[movieId];
          if (!movie) return null;

          return (
            <section className="movie" key={movieId}>
              <div className="movie__info">
                <div className="movie__poster">
                  <img
                    className="movie__poster-image"
                    alt={`${movie.title} постер`}
                    src={movie.poster_url}
                  />
                </div>
                <div className="movie__description">
                  <h2 className="movie__title">{movie.title}</h2>
                  <p className="movie__synopsis">{movie.description}</p>
                  <p className="movie__data">
                    <span className="movie__data-duration">{movie.duration} минут </span>
                    <span className="movie__data-origin">{movie.countries}</span>
                  </p>
                </div>
              </div>

              {[...hallsMap.entries()]
                .sort(([a], [b]) => a - b)
                .map(([hallNumber, { times, is_active }]) => (
                  <div className="movie-seances__hall" key={hallNumber}>
                    <h3 className="movie-seances__hall-title">Зал {hallNumber}</h3>
                    <ul className="movie-seances__list">
                      {times.map((s) =>
                        is_active ? (
                          <li
                              className="movie-seances__time-block"

                              key={s.id}
                          >
                            <Link className="movie-seances__time" to={`/hall/${s.id}`}>
                              {formatTime(s.start)}
                            </Link>
                          </li>
                        ) : (
                          <li className="movie-seances__time-block" key={s.id}>
                            <span
                              className="movie-seances__time movie-seances__time_disabled"
                              title="Продажа билетов приостановлена"
                            >
                              {formatTime(s.start)}
                            </span>
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                ))}
            </section>
          );
        })}

        {!loading && grouped.size === 0 && !error && (
          <p style={{ padding: 16, fontSize: 20, color: 'yellow' }}>На эту дату сеансов нет</p>
        )}
      </main>

      {/* Модалки (всплывающие окна) */}
      {showMyTickets && (
        <MyTicketsModal onClose={() => setShowMyTickets(false)} />
      )}

    </>
  );
}