import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/client/normalize.css';
import '../styles/client/styles.css';
import { apiGet } from '../services/api';

export default function HallPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [selected, setSelected] = useState([]); // массив seat.id
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiGet(`/screenings/${id}`)
      .then(setData)
      .catch(() => setError('Не удалось загрузить сеанс'))
      .finally(() => setLoading(false));
  }, [id]);

  // группируем места по рядам
  const rows = useMemo(() => {
    if (!data) return [];
    const map = new Map();
    for (const seat of data.seats) {
      if (!map.has(seat.row)) map.set(seat.row, []);
      map.get(seat.row).push(seat);
    }
    for (const arr of map.values()) arr.sort((a, b) => a.number - b.number);
    return [...map.entries()].sort(([a], [b]) => a - b);
  }, [data]);

  function toggleSeat(seat) {
    if (seat.is_blocked || seat.is_taken) return; // занятые не кликаются
    setSelected((prev) =>
      prev.includes(seat.id)
        ? prev.filter((x) => x !== seat.id)
        : [...prev, seat.id]
    );
  }

  function handleBook() {
    if (selected.length === 0) {
      alert('Выберите хотя бы одно место');
      return;
    }
    // передаём данные в PaymentPage через state
    navigate(`/payment/${id}`, {
      state: {
        screening: data,
        selectedSeatIds: selected,
      },
    });
  }

  if (loading) return <p style={{ padding: 16 }}>Загрузка...</p>;
  if (error) return <p style={{ color: 'red', padding: 16 }}>{error}</p>;
  if (!data) return null;

  const { movie, hall } = data;

  if (!hall.is_active) {
    return (
      <>
        <header className="page-header">
          <h1 className="page-header__title">Идём<span>в</span>кино</h1>
        </header>
        <main>
          <section className="buying">
            <p className="buying__info-start" style={{ padding: 32, fontSize: '1.6rem' }}>
              Продажа билетов в этом зале приостановлена
            </p>
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      <header className="page-header">
        <h1 className="page-header__title">Идём<span>в</span>кино</h1>
      </header>

      <main>
        <section className="buying">
          <div className="buying__info">
            <div className="buying__info-description">
              <h2 className="buying__info-title">{movie.title}</h2>
              <p className="buying__info-start">
                Начало сеанса: {data.datetime_start.slice(11, 16)}
              </p>
              <p className="buying__info-hall">Зал {hall.number}</p>
            </div>
            <div className="buying__info-hint">
              <p>Тапните дважды,<br />чтобы увеличить</p>
            </div>
          </div>

          <div className="buying-scheme">
            <div className="buying-scheme__wrapper">
              {rows.map(([rowNum, seats]) => (
                <div className="buying-scheme__row" key={rowNum}>
                  {seats.map((seat) => {
                    let cls;
                    if (seat.is_blocked || seat.is_taken) {
                      cls = 'taken';
                    } else if (selected.includes(seat.id)) {
                      cls = 'selected';
                    } else if (seat.kind === 'vip') {
                      cls = 'vip';
                    } else {
                      cls = 'standart';
                    }
                    return (
                      <span
                        key={seat.id}
                        className={`buying-scheme__chair buying-scheme__chair_${cls}`}
                        onClick={() => toggleSeat(seat)}
                        style={{ cursor: seat.is_blocked || seat.is_taken ? 'not-allowed' : 'pointer' }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="buying-scheme__legend">
              <div className="col">
                <p className="buying-scheme__legend-price">
                  <span className="buying-scheme__chair buying-scheme__chair_standart" /> Свободно
                  (<span className="buying-scheme__legend-value">{hall.price_standard}</span>руб)
                </p>
                <p className="buying-scheme__legend-price">
                  <span className="buying-scheme__chair buying-scheme__chair_vip" /> Свободно VIP
                  (<span className="buying-scheme__legend-value">{hall.price_vip}</span>руб)
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

          <button className="acceptin-button" onClick={handleBook}>
            Забронировать
          </button>
        </section>
      </main>
    </>
  );
}