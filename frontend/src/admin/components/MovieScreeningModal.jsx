import { useState } from 'react';
import { apiDelete } from '../../services/api'; //

export default function MovieScreeningModal({ movie, halls, selectedDate, onAdd, onClose, onDeleted, }) {
  const [hallId, setHallId] = useState(halls[0]?.id || '');
  const [time, setTime] = useState(''); // "HH:mm"
  const [loading, setLoading] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (!hallId || !time) return;

    // naive-МСК "YYYY-MM-DDTHH:mm:00"
    const startStr = `${selectedDate}T${time}:00`;

    // "сейчас" в том же формате
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const nowStr =
      `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` +
      `T${pad(now.getHours())}:${pad(now.getMinutes())}:00`;

    if (startStr <= nowStr) {
      alert('Нельзя создать сеанс в прошлом. Выберите будущее время.');
      return;
    }
    setLoading(true);

    try {
      const pad = (n) => String(n).padStart(2, '0');

      // naive-МСК: "YYYY-MM-DDTHH:mm:00"
      const startStr = `${selectedDate}T${time}:00`;

      // end = start + duration (считаем вручную, без Date, чтобы не зависеть от tz браузера)
      const [h, mi] = time.split(':').map(Number);
      const totalMin = h * 60 + mi + movie.duration;

      // при переходе через полночь — сдвигаем дату
      const dayOffset = Math.floor(totalMin / (24 * 60));
      const endH = Math.floor((totalMin % (24 * 60)) / 60);
      const endMi = totalMin % 60;

      let endDate = selectedDate;
      if (dayOffset > 0) {
        const [y, mo, d] = selectedDate.split('-').map(Number);
        const next = new Date(y, mo - 1, d + dayOffset);
        endDate = `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}`;
      }

      const endStr = `${endDate}T${pad(endH)}:${pad(endMi)}:00`;

      const hall = halls.find((h) => h.id === hallId);

      onAdd({
        movie_id: movie.id,
        hall_id: hallId,
        hall_number: hall?.number ?? 0,
        datetime_start: startStr,
        datetime_end: endStr,
        id: `temp-${Date.now()}`, // временный id, бэкенд переприсвоит
      });
      onClose();
    } catch {
      alert('Не удалось добавить сеанс');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteMovie() {
    if (!window.confirm(`Вы действительно хотите удалить фильм «${movie.title}»?`)) return;
    try {
      await apiDelete(`/movies/${movie.id}`);
      onDeleted?.(); // сообщаем родителю, что фильм удалён
      onClose();
    } catch {
      alert('Не удалось удалить фильм');
    }
  }

  return (
    <div className="popup active" onClick={onClose}>
      <div className="popup__container" onClick={(e) => e.stopPropagation()}>
        <div className="popup__content">
          <header className="popup__header">
            <h2 className="popup__title">Фильм «{movie.title}»</h2>
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

              <div className="conf-step-film__buttons text-center">

                <button
                  type="button"
                  className="conf-step__button conf-step__button-remove"
                  onClick={handleDeleteMovie}
                  title={"Удалить фильм"}
                >
                  Удалить
                </button>

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
                  {loading ? 'Добавление...' : 'Вставить сеанс'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}