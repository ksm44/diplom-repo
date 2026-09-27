import { Link } from 'react-router-dom';
import '../styles/client/normalize.css';
import '../styles/client/styles.css';
import poster1 from '../assets/images/poster1.jpg';
import poster2 from '../assets/images/poster2.jpg';

// Заглушка-данные. Позже заменить на apiGet('/movies') и apiGet('/screenings').
const MOVIES = [
  {
    id: 1,
    title: 'Звёздные войны XXIII: Атака клонированных клонов',
    synopsis: 'Две сотни лет назад малороссийские хутора разоряла шайка нехристей-ляхов во главе с могущественным колдуном.',
    duration: 130,
    origin: 'США',
    poster: poster1,
    seances: {
      'Зал 1': ['10:20', '14:10', '18:40', '22:00'],
      'Зал 2': ['11:15', '14:40', '16:00', '18:30', '21:00', '23:30'],
    },
  },
  {
    id: 2,
    title: 'Альфа',
    synopsis: '20 тысяч лет назад Земля была холодным и неуютным местом, в котором смерть подстерегала человека на каждом шагу.',
    duration: 96,
    origin: 'Франция',
    poster: poster2,
    seances: {
      'Зал 1': ['10:20', '14:10', '18:40', '22:00'],
      'Зал 2': ['11:15', '14:40', '16:00', '18:30', '21:00', '23:30'],
    },
  },
  {
    id: 3,
    title: 'Хищник',
    synopsis: 'Самые опасные хищники Вселенной, прибыв из глубин космоса, высаживаются на улицах маленького городка, чтобы начать свою кровавую охоту.',
    duration: 101,
    origin: 'Канада, США',
    poster: poster2,
    seances: {
      'Зал 1': ['09:00', '10:10', '12:55', '14:15', '14:50', '16:30', '18:00', '18:50', '19:50', '20:55', '22:00'],
    },
  },
];

const DAYS = [
  { week: 'Пн', num: 31, today: true, chosen: true  },
  { week: 'Вт', num: 1 },
  { week: 'Ср', num: 2 },
  { week: 'Чт', num: 3 },
  { week: 'Пт', num: 4 },
  { week: 'Сб', num: 5, weekend: true },
];

export default function HomePage() {
  return (
    <>
      <header className="page-header">
        <h1 className="page-header__title">Идём<span>в</span>кино</h1>
      </header>

      <nav className="page-nav">
        {DAYS.map((d) => (
          <a
            key={d.num}
            className={
              'page-nav__day' +
              (d.today ? ' page-nav__day_today' : '') +
              (d.chosen ? ' page-nav__day_chosen' : '') +
              (d.weekend ? ' page-nav__day_weekend' : '')
            }
            href="#"
          >
            <span className="page-nav__day-week">{d.week}</span>
            <span className="page-nav__day-number">{d.num}</span>
          </a>
        ))}
        <a className="page-nav__day page-nav__day_next" href="#" />
      </nav>

      <main>
        {MOVIES.map((movie) => (
          <section className="movie" key={movie.id}>
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
                <p className="movie__synopsis">{movie.synopsis}</p>
                <p className="movie__data">
                  <span className="movie__data-duration">{movie.duration} минут</span>
                  <span className="movie__data-origin">{movie.origin}</span>
                </p>
              </div>
            </div>

            {Object.entries(movie.seances).map(([hall, times]) => (
              <div className="movie-seances__hall" key={hall}>
                <h3 className="movie-seances__hall-title">{hall}</h3>
                <ul className="movie-seances__list">
                  {times.map((time) => (
                    <li className="movie-seances__time-block" key={time}>
                      <Link className="movie-seances__time" to={`/hall/${movie.id}`}>
                        {time}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        ))}
      </main>
    </>
  );
}