// src/pages/HomePage.jsx
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/client/normalize.css';
import '../styles/client/styles.css';
import { apiGet } from '../services/api';

const WEEK_DAYS_SHORT = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

// Формат YYYY-MM-DD в локальном времени
function toLocalDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Следующие 6 дней, начиная с сегодня
function buildDays() {
  const today = new Date();
  return Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return {
      date: toLocalDateStr(d),
      week: WEEK_DAYS_SHORT[d.getDay()],
      num: d.getDate(),
      isToday: i === 0,
      isWeekend: d.getDay() === 0 || d.getDay() === 6,
    };
  });
}

// "18:30" из ISO-строки в UTC
function formatTime(iso) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function HomePage() {
  const days = useMemo(buildDays, []);
  const [selectedDate, setSelectedDate] = useState(days[0].date);

  const [movies, setMovies] = useState([]);   // все фильмы
  const [halls, setHalls] = useState([]);     // все залы
  const [screenings, setScreenings] = useState([]); // сеансы на выбранную дату
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // один раз — справочники
  useEffect(() => {
    Promise.all([apiGet('/movies'), apiGet('/halls')])
      .then(([m, h]) => {
        setMovies(m);
        setHalls(h);
      })
      .catch(() => setError('Не удалось загрузить фильмы/залы'));
  }, []);

  // при смене даты — сеансы
  useEffect(() => {
    setLoading(true);
    apiGet(`/screenings?date_screening=${selectedDate}`)
      .then(setScreenings)
      .catch(() => setError('Не удалось загрузить сеансы'))
      .finally(() => setLoading(false));
  }, [selectedDate]);

  // группировка: movie_id -> hall_id -> [times]
  const grouped = useMemo(() => {
    const map = new Map();
    for (const s of screenings) {
      if (!map.has(s.movie_id)) map.set(s.movie_id, new Map());
      const byHall = map.get(s.movie_id);
      if (!byHall.has(s.hall_id)) byHall.set(s.hall_id, []);
      byHall.get(s.hall_id).push(s.datetime_start);
    }
    // сортировка времён
    for (const byHall of map.values()) {
      for (const arr of byHall.values()) {
        arr.sort((a, b) => new Date(a) - new Date(b));
      }
    }
    return map;
  }, [screenings]);

  const movieById = useMemo(
    () => Object.fromEntries(movies.map((m) => [m.id, m])),
    [movies]
  );
  const hallById = useMemo(
    () => Object.fromEntries(halls.map((h) => [h.id, h])),
    [halls]
  );

  return (
    <>
      <header className="page-header">
        <h1 className="page-header__title">Идём<span>в</span>кино</h1>
      </header>

      <nav className="page-nav">
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
        <a className="page-nav__day page-nav__day_next" href="#" />
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
                    src={movie.poster}
                  />
                </div>
                <div className="movie__description">
                  <h2 className="movie__title">{movie.title}</h2>
                  <p className="movie__synopsis">{movie.description}</p>
                  <p className="movie__data">
                    <span className="movie__data-duration">
                      {movie.duration} минут
                    </span>
                    <span className="movie__data-origin">{movie.country}</span>
                  </p>
                </div>
              </div>

              {[...hallsMap.entries()].map(([hallId, times]) => {
                const hall = hallById[hallId];
                return (
                  <div className="movie-seances__hall" key={hallId}>
                    <h3 className="movie-seances__hall-title">
                      {hall ? hall.name : 'Зал'}
                    </h3>
                    <ul className="movie-seances__list">
                      {times.map((iso) => (
                        <li className="movie-seances__time-block" key={iso}>
                          <Link
                            className="movie-seances__time"
                            to={`/hall/${movieId}`}
                          >
                            {formatTime(iso)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </section>
          );
        })}

        {!loading && grouped.size === 0 && !error && (
          <p style={{ padding: 16 }}>На эту дату сеансов нет</p>
        )}
      </main>
    </>
  );
}