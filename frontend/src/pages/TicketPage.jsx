import { useLocation, useParams } from 'react-router-dom';
import '../styles/client/normalize.css';
import '../styles/client/styles.css';

export default function TicketPage() {
  const { id } = useParams();
  const location = useLocation();
  const { ticket, movie, hall, datetime_start, chosenSeats } = location.state || {};

  if (!ticket) {
    return (
      <>
        <header className="page-header">
          <h1 className="page-header__title">Идём<span>в</span>кино</h1>
        </header>
        <main>
          <section className="ticket">
            <p style={{ padding: 32, fontSize: '1.6rem' }}>
              Данные о бронировании потеряны.
            </p>
          </section>
        </main>
      </>
    );
  }

  const chairs = chosenSeats
  .slice()
  .sort((a, b) => a.row - b.row || a.number - b.number)
  .map((s) => `${s.number}(ряд ${s.row})`)
  .join(', ');

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

            <img className="ticket__info-qr" src={ticket.qr_code_url} alt="QR-код бронирования" />

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