import { useParams } from 'react-router-dom';
import qrCode from '../assets/images/qr-code.png';
import '../styles/client/normalize.css';
import '../styles/client/styles.css';

export default function TicketPage() {
  const { id } = useParams();

  // Заглушка — позже взять из apiGet(`/bookings/${id}`)
  const movieTitle = 'Звёздные войны XXIII: Атака клонированных клонов';
  const chairs = '6, 7';
  const hall = '1';
  const startTime = '18:30';

  return (
    <>
      <header className="page-header">
        <h1 className="page-header__title">Идём<span>в</span>кино</h1>
      </header>

      <main>
        <section className="ticket">
          <header className="tichet__check">
            <h2 className="ticket__check-title">Электронный билет</h2>
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

            <img className="ticket__info-qr" src={qrCode} alt="QR-код бронирования" />

            <p className="ticket__hint">
              Покажите QR-код нашему контроллеру для подтверждения бронирования.
            </p>
            <p className="ticket__hint">Приятного просмотра!</p>
          </div>
        </section>
      </main>
    </>
  );
}