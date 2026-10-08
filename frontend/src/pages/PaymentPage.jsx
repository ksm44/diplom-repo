import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { apiPost } from '../services/api';
import '../styles/client/normalize.css';
import '../styles/client/styles.css';

export default function PaymentPage() {
  const { id } = useParams(); // screening_id
  const navigate = useNavigate();
  const location = useLocation();
  const { screening, selectedSeatIds } = location.state || {};

  const [loading, setLoading] = useState(false);

  if (!screening || !selectedSeatIds || selectedSeatIds.length === 0) {
    return (
      <>
        <header className="page-header">
          <h1 className="page-header__title">Идём<span>в</span>кино</h1>
        </header>
        <main>
          <section className="ticket">
            <p style={{ padding: 32, fontSize: '1.6rem' }}>
              Данные о бронировании потеряны. Выберите места заново.
            </p>
          </section>
        </main>
      </>
    );
  }

  const { movie, hall, datetime_start, seats } = screening;
  const chosenSeats = seats
    .filter((s) => selectedSeatIds.includes(s.id))
    .sort((a, b) => a.row - b.row || a.number - b.number);

  // уникальные подписи вида "2(ряд 1)"
  const chairs = chosenSeats
    .map((s) => `${s.number}(ряд ${s.row})`)
    .join(', ');

  const cost = chosenSeats.reduce(
    (sum, s) => sum + (s.kind === 'vip' ? hall.price_vip : hall.price_standard),
    0
  );

  async function handleBuy() {
    setLoading(true);
    try {
      const ticket = await apiPost('/tickets', {
        screening_id: id,
        seat_ids: selectedSeatIds,
      });

      navigate(`/ticket/${ticket.id}`, {
        state: {
          ticket,
          movie,
          hall,
          datetime_start,
          chosenSeats,
        },
      });
    } catch (err) {
      alert(`Не удалось забронировать билеты: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <header className="page-header">
        <h1 className="page-header__title">Идём<span>в</span>кино</h1>
      </header>

      <main>
        <section className="ticket">
          <header className="tichet__check">
            <h2 className="ticket__check-title">Вы выбрали билеты:</h2>
          </header>

          <div className="ticket__info-wrapper">
            <p className="ticket__info">
              На фильм: <span className="ticket__details ticket__title">{movie.title}</span>
            </p>
            <p className="ticket__info">
              Места: <span className="ticket__details ticket__chairs">{chairs}</span>
            </p>
            <p className="ticket__info">
              В зале: <span className="ticket__details ticket__hall">{hall.number}</span>
            </p>
            <p className="ticket__info">
              Начало сеанса:{' '}
              <span className="ticket__details ticket__start">
                {datetime_start.slice(11, 16)}
              </span>
            </p>
            <p className="ticket__info">
              Стоимость:{' '}
              <span className="ticket__details ticket__cost">{cost}</span> рублей
            </p>

            <button
              className="acceptin-button"
              onClick={handleBuy}
              disabled={loading}
            >
              {loading ? 'Бронируем...' : 'Получить код бронирования'}
            </button>

            <p className="ticket__hint">
              После оплаты билет будет доступен в этом окне, а также придёт вам на почту.
              Покажите QR-код нашему контроллёру у входа в зал.
            </p>
            <p className="ticket__hint">Приятного просмотра!</p>
          </div>
        </section>
      </main>
    </>
  );
}