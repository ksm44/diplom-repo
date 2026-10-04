import { useState } from 'react';

// Смещение МСК (UTC+3) в миллисекундах
const MSK_OFFSET_MS = 3 * 60 * 60 * 1000;

export default function AddScreeningModal({ movie, halls, selectedDate, onAdd, onClose }) {
  const [hallId, setHallId] = useState(halls[0]?.id || '');
  const [time, setTime] = useState(''); // "HH:mm"
  const [loading, setLoading] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (!hallId || !time) return;
    setLoading(true);

    try {
      // selectedDate = "YYYY-MM-DD" (МСК), time = "HH:mm" (МСК)
      // Собираем "YYYY-MM-DDTHH:mm:00" как UTC-строку, затем вычитаем 3 часа
      const asUtc = new Date(`${selectedDate}T${time}:00Z`);
      const startUtc = new Date(asUtc.getTime() - MSK_OFFSET_MS);

      // end = start + duration
      const endUtc = new Date(startUtc.getTime() + movie.duration * 60000);

      const hall = halls.find((h) => h.id === hallId);

      onAdd({
        movie_id: movie.id,
        hall_id: hallId,
        hall_number: hall?.number ?? 0,
        datetime_start: startUtc.toISOString(),
        datetime_end: endUtc.toISOString(),
        id: `temp-${Date.now()}`, // временный id, бэкенд переприсвоит
      });
      onClose();
    } catch {
      alert('Не удалось добавить сеанс');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="popup active" onClick={onClose}>
      <div className="popup__container" onClick={(e) => e.stopPropagation()}>
        <div className="popup__content">
          <header className="popup__header">
            <h2 className="popup__title">Сеанс для «{movie.title}»</h2>
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
            <form onSubmit={handleSubmit}>
              <label className="conf-step__label">
                Дата
                <input
                  className="conf-step__input"
                  type="text"
                  value={selectedDate}
                  readOnly
                  disabled
                />
              </label>

              <label className="conf-step__label">
                Зал
                <select
                  className="conf-step__input"
                  value={hallId}
                  onChange={(e) => setHallId(e.target.value)}
                  required
                >
                  {halls.map((h) => (
                    <option key={h.id} value={h.id}>Зал {h.number}</option>
                  ))}
                </select>
              </label>

              <label className="conf-step__label">
                Время начала (МСК)
                <input
                  className="conf-step__input"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                />
              </label>

              <div className="conf-step__buttons text-center">
                <button
                  type="button"
                  className="conf-step__button conf-step__button-regular"
                  onClick={onClose}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="conf-step__button conf-step__button-accent"
                  disabled={loading}
                >
                  {loading ? 'Добавление...' : 'Вставить фильм'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}