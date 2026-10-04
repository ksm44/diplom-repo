import { useState } from 'react';
import { apiPost, apiUpload } from '../../services/api';

export default function AddMovieModal({ onClose, onCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');
  const [countries, setCountries] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) return alert('Выберите постер');
    setLoading(true);
    try {
      // 1) сначала запрос для загрузки постера
      const { poster_url } = await apiUpload('/movies/upload-poster', file);
      // 2) потом запрос для создания фильма
      await apiPost('/movies', {
        title,
        description,
        duration: Number(duration),
        countries,
        poster_url,
      });
      onCreated();
      onClose();
    } catch {
      alert('Не удалось добавить фильм');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="popup active" onClick={onClose}>
      <div className="popup__container" onClick={(e) => e.stopPropagation()}>
        <div className="popup__content">
          <header className="popup__header">
            <h2 className="popup__title">Добавить фильм</h2>
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
                Название
                <input
                  className="conf-step__input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </label>

              <label className="conf-step__label">
                Описание
                <textarea
                  className="conf-step__input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </label>

              <label className="conf-step__label">
                Длительность (мин)
                <input
                  className="conf-step__input"
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  required
                />
              </label>

              <label className="conf-step__label">
                Страна (страны)
                <input
                  className="conf-step__input"
                  value={countries}
                  onChange={(e) => setCountries(e.target.value)}
                  required
                />
              </label>

              <label className="conf-step__label">
                Постер
                <input
                  className="conf-step__input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files[0])}
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
                  {loading ? 'Добавление...' : 'Создать новый фильм'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}