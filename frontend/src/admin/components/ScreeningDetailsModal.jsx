import { useMemo } from 'react';
import { apiDelete } from '../../services/api';


export default function ScreeningDetailsModal({ screening, movie, hall, onClose, onDeleted }) {
  // группируем места по рядам
  const rows = useMemo(() => {
    if (!screening?.seats) return [];
    const map = new Map();
    for (const seat of screening.seats) {
      if (!map.has(seat.row)) map.set(seat.row, []);
      map.get(seat.row).push(seat);
    }
    for (const arr of map.values()) arr.sort((a, b) => a.number - b.number);
    return [...map.entries()].sort(([a], [b]) => a - b);
  }, [screening]);

  async function handleDelete() {
    if (!window.confirm('Удалить этот сеанс?')) return;
    try {
      await apiDelete(`/screenings/${screening.id}`);
      onDeleted();
      onClose();
    } catch {
      alert('Не удалось удалить сеанс');
    }
  }

  return (
    <div className="popup active" onClick={onClose}>
      <div className="popup__container" onClick={(e) => e.stopPropagation()}>
        <div className="popup__content">
          <header className="popup__header">
            <h2 className="popup__title">Информация о сеансе</h2>
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
            <p className="conf-step__paragraph">
              Фильм: <b>{movie ? movie.title : screening.movie?.title ?? '—'}</b>
            </p>
            <p className="conf-step__paragraph">
              Зал: <b>{hall ? hall.number : screening.hall?.number ?? screening.hall_number}</b>
            </p>
            <p className="conf-step__paragraph">
              Начало: <b>{screening.datetime_start.slice(11, 16)}</b>
            </p>
            <p className="conf-step__paragraph">
              Окончание: <b>{screening.datetime_end.slice(11, 16)}</b>
            </p>

            {/* Схема зала */}
            <div className="buying-scheme" style={{ marginTop: 20 }}>
              <div className="buying-scheme__wrapper">
                {rows.map(([rowNum, seats]) => (
                  <div className="buying-scheme__row" key={rowNum}>
                    {seats.map((seat) => {
                      let cls;
                      if (seat.is_blocked) {
                        cls = 'blocked';
                      } else if (seat.is_taken) {
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
                    (<span className="buying-scheme__legend-value">
                      {screening.hall?.price_standard ?? hall?.price_standard}
                    </span>руб)
                  </p>
                  <p className="buying-scheme__legend-price">
                    <span className="buying-scheme__chair buying-scheme__chair_vip" /> Свободно VIP
                    (<span className="buying-scheme__legend-value">
                      {screening.hall?.price_vip ?? hall?.price_vip}
                    </span>руб)
                  </p>
                </div>
                <div className="col">
                  <p className="buying-scheme__legend-price">
                    <span className="buying-scheme__chair buying-scheme__chair_selected" /> Забронировано
                  </p>
                  <p className="buying-scheme__legend-price">
                    <span className="buying-scheme__chair buying-scheme__chair_taken" /> Занято
                  </p>
                </div>
              </div>
            </div>

            <div className="conf-step__buttons text-center">
              <button
                type="button"
                className="conf-step__button conf-step__button-regular"
                onClick={onClose}
              >
                Отмена
              </button>
              <button
                type="button"
                className="conf-step__button conf-step__button-accent"
                onClick={handleDelete}
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}