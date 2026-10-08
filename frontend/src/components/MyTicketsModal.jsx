import { useEffect, useState } from 'react';
import { apiGet } from '../services/api';

export default function MyTicketsModal({ onClose }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet('/tickets/my')
      .then(setTickets)
      .catch(() => alert('Не удалось загрузить билеты'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="popup active" onClick={onClose}>
      <div className="popup__container" onClick={(e) => e.stopPropagation()}>
        <div className="popup__content">
          <header className="popup__header">
            <h2 className="popup__title">Мои билеты</h2>
            <div className="popup__dismiss">
              <button
                type="button"
                className="conf-step__button conf-step__button-regular"
                onClick={onClose}
              >
                ✕
              </button>
            </div>
          </header>

          <div className="popup__wrapper">
            {loading && <p className="conf-step__paragraph">Загрузка...</p>}
            {!loading && tickets.length === 0 && (
              <p className="conf-step__paragraph">У вас пока нет билетов</p>
            )}

            {tickets.map((t) => (
              <div
                key={t.id}
                style={{
                  border: '1px solid #ccc',
                  borderRadius: 6,
                  padding: 12,
                  marginBottom: 12,
                  display: 'flex',
                  gap: 12,
                  alignItems: 'center',
                }}
              >
                <img
                  src={t.qr_code_url}
                  alt="QR"
                  style={{ width: 120, height: 120 }}
                />
                <div>
                  <p className="conf-step__paragraph">
                    Код: <b>{t.code}</b>
                  </p>
                  <p className="conf-step__paragraph">
                    Места:{' '}
                    <b>
                      {t.seats
                        .map((s) => `${s.number}(ряд ${s.row})`)
                        .join(', ')}
                    </b>
                  </p>
                  <p className="conf-step__paragraph">
                    Сумма: <b>{t.total_price} руб.</b>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}