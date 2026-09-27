import { useNavigate, useParams } from 'react-router-dom';
import '../styles/client/normalize.css';
import '../styles/client/styles.css';

// Схема зала (12 рядов × 12 мест), как в макете.
// Типы: 'disabled' | 'standart' | 'vip' | 'taken' | 'selected'
const HALL_ROWS = [
  ['disabled','disabled','disabled','disabled','disabled','standart','standart','disabled','disabled','disabled','disabled','disabled'],
  ['disabled','disabled','disabled','disabled','taken','standart','standart','standart','disabled','disabled','disabled','disabled'],
  ['disabled','standart','standart','standart','standart','standart','standart','standart','standart','disabled','disabled','disabled'],
  ['standart','standart','standart','standart','standart','vip','vip','standart','standart','disabled','disabled','disabled'],
  ['standart','standart','standart','standart','vip','vip','vip','vip','standart','disabled','disabled','disabled'],
  ['standart','standart','standart','standart','vip','taken','taken','taken','standart','disabled','disabled','disabled'],
  ['standart','standart','standart','standart','vip','taken','taken','vip','standart','disabled','disabled','disabled'],
  ['standart','standart','standart','standart','standart','selected','selected','standart','standart','disabled','disabled','disabled'],
  ['standart','taken','standart','taken','standart','taken','standart','standart','standart','standart','standart','standart'],
  ['standart','standart','standart','standart','standart','taken','taken','taken','standart','standart','standart','standart'],
];

export default function HallPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Заглушка — позже взять из apiGet(`/screenings/${id}`)
  const movieTitle = 'Звёздные войны XXIII: Атака клонированных клонов';
  const startTime = '18:30';
  const hallName = 'Зал 1';
  const priceStandart = 250;
  const priceVip = 350;

  return (
    <>
      <header className="page-header">
        <h1 className="page-header__title">Идём<span>в</span>кино</h1>
      </header>

      <main>
        <section className="buying">
          <div className="buying__info">
            <div className="buying__info-description">
              <h2 className="buying__info-title">{movieTitle}</h2>
              <p className="buying__info-start">Начало сеанса: {startTime}</p>
              <p className="buying__info-hall">{hallName}</p>
            </div>
            <div className="buying__info-hint">
              <p>Тапните дважды,<br />чтобы увеличить</p>
            </div>
          </div>

          <div className="buying-scheme">
            <div className="buying-scheme__wrapper">
              {HALL_ROWS.map((row, rowIdx) => (
                <div className="buying-scheme__row" key={rowIdx}>
                  {row.map((type, seatIdx) => (
                    <span
                      key={seatIdx}
                      className={`buying-scheme__chair buying-scheme__chair_${type}`}
                    />
                  ))}
                </div>
              ))}
            </div>

            <div className="buying-scheme__legend">
              <div className="col">
                <p className="buying-scheme__legend-price">
                  <span className="buying-scheme__chair buying-scheme__chair_standart" /> Свободно
                  (<span className="buying-scheme__legend-value">{priceStandart}</span>руб)
                </p>
                <p className="buying-scheme__legend-price">
                  <span className="buying-scheme__chair buying-scheme__chair_vip" /> Свободно VIP
                  (<span className="buying-scheme__legend-value">{priceVip}</span>руб)
                </p>
              </div>
              <div className="col">
                <p className="buying-scheme__legend-price">
                  <span className="buying-scheme__chair buying-scheme__chair_taken" /> Занято
                </p>
                <p className="buying-scheme__legend-price">
                  <span className="buying-scheme__chair buying-scheme__chair_selected" /> Выбрано
                </p>
              </div>
            </div>
          </div>

          <button
            className="acceptin-button"
            onClick={() => navigate(`/payment/${id}`)}
          >
            Забронировать
          </button>
        </section>
      </main>
    </>
  );
}