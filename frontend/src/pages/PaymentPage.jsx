import { useNavigate, useParams } from 'react-router-dom';
import '../styles/client/normalize.css';
import '../styles/client/styles.css';

export default function PaymentPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Заглушка — позже взять из apiGet(`/bookings/${id}`) или из state
  const movieTitle = 'Звёздные войны XXIII: Атака клонированных клонов';
  const chairs = '6, 7';
  const hall = '1';
  const startTime = '18:30';
  const cost = 600;

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
              На фильм: <span className="ticket__details ticket__title">{movieTitle}</span>
            </p>
            <p className="ticket__info">
              Места: <span className="ticket__details ticket__chairs">{chairs}</span>
            </p>
            <p className="ticket__info">
              В зале: <span className="ticket__details ticket__hall">{hall}</span>
            </p>
            <p className="ticket__info">
              Начало сеанса: <span className="ticket__details ticket__start">{startTime}</span>
            </p>
            <p className="ticket__info">
              Стоимость: <span className="ticket__details ticket__cost">{cost}</span> рублей
            </p>

            <button
              className="acceptin-button"
              onClick={() => navigate(`/ticket/${id}`)}
            >
              Получить код бронирования
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