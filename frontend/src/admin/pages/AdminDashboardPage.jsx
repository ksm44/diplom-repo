import { useState, useEffect, useMemo } from 'react';
import { apiGet, apiPost, apiDelete, apiPatch, apiPut } from '../../services/api';
import Accordion from "../components/Accordion";
import AddMovieModal from "../components/AddMovieModal";
import AddScreeningModal from '../components/AddScreeningModal';

import '../../styles/admin/normalize.css';
import '../../styles/admin/styles.css';

export default function AdminDashboardPage() {

  const [rows, setRows] = useState(10);
  const [cols, setCols] = useState(8);
  const [halls, setHalls] = useState([]);

  const [selectedHall, setSelectedHall] = useState(null); // исходные данные из API
  const [draftSeats, setDraftSeats] = useState([]); // редактируемая локальная копия данных

  //Состояния цен
  const [priceStandard, setPriceStandard] = useState('');
  const [priceVip, setPriceVip] = useState('');
  const [selectedPriceHall, setSelectedPriceHall] = useState(null); // для какого зала сохранять цены

  //Фильмы
  const [movies, setMovies] = useState([]);
  const [showAddMovie, setShowAddMovie] = useState(false);

  //Сеансы
  const [showAddScreening, setShowAddScreening] = useState(false);
  const [movieForScreening, setMovieForScreening] = useState(null);
  const [screenings, setScreenings] = useState([]);
  const [selectedDate, setSelectedDate] = useState(toLocalDateStr(new Date()));
  const [draftScreenings, setDraftScreenings] = useState([]);   // редактируемая копия
  const [setScreeningsDirty] = useState(false);


  // Длина блока в  px на минуту
  const PX_PER_MIN = 1;

  useEffect(() => {
    loadHalls();
  }, []);

  useEffect(() => {
    if (halls.length > 0 && !selectedHall) {
      loadHall(halls[0].number);
    }
  }, [halls]);

  useEffect(() => {
    if (!selectedHall) return;
    setDraftSeats((prev) =>
        prev.filter((s) => s.row <= Number(rows) && s.number <= Number(cols))
    );
  }, [rows, cols]);

  useEffect(() => { // Автовыбор первого зала для отображения цен
    if (halls.length > 0 && !priceStandard && !priceVip) {
      handlePriceHallChange(halls[0]);
    }
  }, [halls]);

  useEffect(() => { loadMovies(); }, []);

  useEffect(() => { loadScreenings(selectedDate); }, [selectedDate]);

  //Группировка сеансов
  const groupedScreenings = useMemo(() => {
    const byHall = new Map();
    for (const s of draftScreenings) {
      if (!byHall.has(s.hall_number)) byHall.set(s.hall_number, []);
      byHall.get(s.hall_number).push(s);
    }
    for (const arr of byHall.values()) {
      arr.sort((a, b) => new Date(a.datetime_start) - new Date(b.datetime_start));
    }
    return [...byHall.entries()].sort(([a], [b]) => a - b);
  }, [draftScreenings]);

  const days = useMemo(buildDays, []);

  function formatTime(iso) {
    return iso.slice(11, 16); // "2026-10-05T03:00:00" → "03:00"
  }

  // следующие 7 дней, начиная с сегодня (по МСК)
  function buildDays() {
    const now = new Date();
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      const iso = toLocalDateStr(d);
      const weekday = ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'][d.getDay()];
      return { iso, label: `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}, ${weekday}` };
    });
  }

  // при загрузке с бэкенда — заполняем и копию
  function loadScreenings(date = selectedDate) {
    const params = new URLSearchParams({ date_screening: date });

    apiGet(`/screenings?${params.toString()}`)
      .then((data) => {
        setScreenings(data);
        setDraftScreenings(data.map((s) => ({ ...s })));
      })
      .catch(() => alert('Не удалось загрузить сеансы'));
  }


  function minutesFromDayStart(iso) {
    const [h, m] = iso.slice(11, 16).split(':').map(Number);
    return h * 60 + m;
  }

  //Получение Залов
  function loadHalls() {
    apiGet('/halls').then(setHalls).catch(() => alert('Не удалось загрузить залы'));

  }

  // Заполнение цен при выборе зала
  function handlePriceHallChange(hall) {
    setPriceStandard(hall.price_standard);
    setPriceVip(hall.price_vip);

  }

  //Отмена введенных цен
  function resetPrices() {
    if (!selectedPriceHall) return;
    apiGet('/halls').then((data) => {
      setHalls(data);
      const fresh = data.find((h) => h.id === selectedPriceHall.id);
      if (fresh) handlePriceHallChange(fresh);
    });
  }

  //Добавление нового фильма в БД
  function loadMovies() {
    apiGet('/movies').then(setMovies).catch(() => alert('Не удалось загрузить фильмы'));
  }

  //Дата (для правильного формата запроса сеансов)
  function toLocalDateStr(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  //Создание нового Зала
  async function handleCreateHall() {
    try {
      await apiPost('/halls', { rows: 10, cols: 8 });
      loadHalls();
    } catch {
      alert('Не удалось создать зал');
    }
  }

  //Удаление Зала
  async function handleRemoveHall(hall_number) {
    if (!window.confirm(`Действительно хотите удалить Зал ${hall_number}?`)) return;

    try {
      await apiDelete(`/halls/${hall_number}`);
      loadHalls(); // ← обновляем список
    } catch {
      alert('Не удалось удалить зал');
    }
  }

  //Функция загрузки схемы Зала (ряды, мест в ряду, виды кресел и т.д)
  async function loadHall(hallNumber) {
    apiGet(`/halls/${hallNumber}`)
      .then((data) => {
        setSelectedHall(data);
        setDraftSeats(data.seats.map((s) => ({ ...s }))); // копия
        setRows(data.rows);
        setCols(data.cols);
      })
      .catch(() => alert('Не удалось загрузить зал'));
  }

  //Обработчик клика по креслу
  function handleSeatClick(row, number) {
    setDraftSeats((prev) => {
      const existing = prev.find((s) => s.row === row && s.number === number);
      const base = existing || { row, number, kind: 'standard', is_blocked: false };

      let next;
      if (base.is_blocked) {
        next = { ...base, is_blocked: false, kind: 'standard' };
      } else if (base.kind === 'standard') {
        next = { ...base, kind: 'vip' };
      } else {
        next = { ...base, kind: 'standard', is_blocked: true };
      }

      // если кресло уже было в списке — обновляем, иначе добавляем
      if (existing) {
        return prev.map((s) =>
          s.row === row && s.number === number ? next : s
        );
      }
      return [...prev, next];
    });
  }

  //Получение цвета фона фильмов
  function getMovieColor(index) {
    const baseHue = 50;
    const degrees = 48;
    const hue = (baseHue + index * degrees) % 360;
    return `hsl(${hue}, 100%, 76%)`;
  }

  function handleAddScreening(newScreening) {
    setDraftScreenings((prev) => [...prev, newScreening]);
  }


  //Сохраняем изменения кресел — отправка изменений кресел на бэкенд
  async function handleSaveSeats() {
    if (!selectedHall) return;

    const currentRows = Number(rows);
    const currentCols = Number(cols);

    // строим полную сетку, накладывая draftSeats
    const fullSeats = [];
    for (let r = 1; r <= currentRows; r++) {
      for (let n = 1; n <= currentCols; n++) {
        const existing = draftSeats.find((s) => s.row === r && s.number === n);
        fullSeats.push(
          existing
            ? { row: r, number: n, kind: existing.kind, is_blocked: existing.is_blocked }
            : { row: r, number: n, kind: 'standard', is_blocked: false }
        );
      }
    }

    try {
      await apiPatch(`/halls/${selectedHall.number}/seats`, {
        rows: currentRows,
        cols: currentCols,
        seats: fullSeats,
      });
      await loadHall(selectedHall.number);
    } catch {
      alert('Не удалось сохранить/изменить схему зала.' +
          '\n\nНельзя изменить схему зала, пока в нём есть сеансы.' +
          '\n\nПопробуйте удалить и создать зал заново ');
    }
  }

  //Обработчик сохранения цен
  async function handleSavePrices() {
    if (!selectedPriceHall) return;
    try {
      await apiPatch(`/halls/${selectedPriceHall.number}/prices`, {
        price_standard: Number(priceStandard),
        price_vip: Number(priceVip),
      });
      loadHalls();
    } catch {
      alert('Не удалось сохранить цены');
    }
  }

  //Сохранение сеансов в разделе «Сетка сеансов»
  async function handleSaveScreenings() {
    const payload = draftScreenings.map((s) => {
      if (String(s.id).startsWith('temp-')) {
        const { id, ...rest } = s;
        return rest;
      }
      return s;
    });
    try {
      await apiPut(`/screenings?date_screening=${selectedDate}`, payload);
      loadScreenings(selectedDate);
    } catch {
      alert('Не удалось сохранить сеансы');
    }
  }

  //Открыть/приостановить продажи
  async function toggleHallActive(hall) {
    try {
      await apiPatch(`/halls/${hall.number}/activate`);
      loadHalls();
    } catch {
      alert('Не удалось изменить статус продаж');
    }
  }

  return (
    <>
      <header className="page-header">
        <h1 className="page-header__title">Идём<span>в</span>кино</h1>
        <span className="page-header__subtitle">Администраторррская</span>
      </header>

      <main className="conf-steps">

        {/* 1. Управление залами */}
        <Accordion title="Управление залами" opened>
          <p className="conf-step__paragraph">Доступные залы:</p>
          <ul className="conf-step__list">
            {halls.map((hall) => (
              <li key={hall.id}>
                Зал {hall.number}
                <button className="conf-step__button conf-step__button-trash" onClick={() => handleRemoveHall(hall.number)}/>
              </li>
            ))}
          </ul>

          <button className="conf-step__button conf-step__button-accent" onClick={ handleCreateHall }>
            Создать зал
          </button>

        </Accordion>

        {/* 2. Конфигурация залов */}
        <Accordion title="Конфигурация залов" opened>
          <p className="conf-step__paragraph">Выберите зал для конфигурации:</p>
          <ul className="conf-step__selectors-box">
            {halls.map((hall, i) => (
              <li key={hall.id}>
                <input
                  type="radio"
                  className="conf-step__radio"
                  name="chairs-hall"
                  value={hall.id}
                  checked={selectedHall?.number === hall.number}
                  onChange={() => loadHall(hall.number)}
                />
                <span className="conf-step__selector">{hall.number}</span>
              </li>
            ))}
          </ul>

          <p className="conf-step__paragraph">
            Укажите количество рядов и максимальное количество кресел в ряду:
          </p>
          <div className="conf-step__legend">
            <label className="conf-step__label">
              Рядов, шт
              <input
                type="text"
                className="conf-step__input"
                value={rows}
                onChange={(e) => setRows(e.target.value)}
              />
            </label>
            <span className="multiplier">x</span>
            <label className="conf-step__label">
              Мест, шт
              <input
                type="text"
                className="conf-step__input"
                value={cols}
                onChange={(e) => setCols(e.target.value)}
              />
            </label>
          </div>

          <p className="conf-step__paragraph">
            Теперь вы можете указать типы кресел на схеме зала:
          </p>
          <div className="conf-step__legend">
            <span className="conf-step__chair conf-step__chair_standart" /> — обычные кресла
            <span className="conf-step__chair conf-step__chair_vip" /> — VIP кресла
            <span className="conf-step__chair conf-step__chair_disabled" /> — заблокированные (нет кресла)
            <p className="conf-step__hint">
              Чтобы изменить вид кресла, нажмите по нему левой кнопкой мыши
            </p>
          </div>
          
          {selectedHall && (
            <div className="conf-step__hall">
              <div className="conf-step__hall-wrapper">
                {Array.from({ length: Number(rows) }).map((_, rowIdx) => (
                  <div className="conf-step__row" key={rowIdx}>
                    {Array.from({ length: Number(cols) }).map((_, seatIdx) => {
                      const r = rowIdx + 1;
                      const n = seatIdx + 1;
                      const seat = draftSeats.find((s) => s.row === r && s.number === n);
                      const cls = !seat
                        ? 'standart'                            // новое место — стандартное
                        : seat.is_blocked
                        ? 'disabled'
                        : seat.kind === 'vip'
                        ? 'vip'
                        : 'standart';
                      return (
                        <span
                          key={`${r}-${n}`}
                          className={`conf-step__chair conf-step__chair_${cls}`}
                          onClick={() => handleSeatClick(r, n)}
                          style={{ cursor: 'pointer' }}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}

          <fieldset className="conf-step__buttons text-center">
            <button
              className="conf-step__button conf-step__button-regular"
              onClick={() => loadHall(selectedHall.number)}
            >
              Отмена
            </button>
            <input
              type="submit"
              value="Сохранить"
              className="conf-step__button conf-step__button-accent"
              onClick={handleSaveSeats}
            />
          </fieldset>
        </Accordion>

        {/* 3. Конфигурация цен */}
        <Accordion title="Конфигурация цен" opened>
          <p className="conf-step__paragraph">Выберите зал для конфигурации:</p>
          <ul className="conf-step__selectors-box">
            {halls.map((hall, i) => (
              <li key={hall.id}>
                <input
                  type="radio"
                  className="conf-step__radio"
                  name="prices-hall"
                  value={hall.id}
                  checked={selectedPriceHall?.id === hall.id}
                  onChange={() => {
                    setSelectedPriceHall(hall);
                    handlePriceHallChange(hall);
                  }}
                />
                <span className="conf-step__selector">Зал {hall.number}</span>
              </li>
            ))}
          </ul>

          <p className="conf-step__paragraph">Установите цены для типов кресел:</p>
          <div className="conf-step__legend">
            <label className="conf-step__label">
              Цена, рублей
              <input
                type="text"
                className="conf-step__input"
                placeholder="0"
                value={priceStandard}
                onChange={(e) => setPriceStandard(e.target.value)}
              />
            </label>
            за <span className="conf-step__chair conf-step__chair_standart" /> обычные кресла
          </div>
          <div className="conf-step__legend">
            <label className="conf-step__label">
              Цена, рублей
              <input
                type="text"
                className="conf-step__input"
                placeholder="0"
                value={priceVip}
                onChange={(e) => setPriceVip(e.target.value)}
              />
            </label>
            за <span className="conf-step__chair conf-step__chair_vip" /> VIP кресла
          </div>

          <fieldset className="conf-step__buttons text-center">
            <button className="conf-step__button conf-step__button-regular"
              onClick={() => {
                resetPrices();
              }}
            >Отмена</button>
            <input
              type="submit"
              value="Сохранить"
              className="conf-step__button conf-step__button-accent"
              onClick={handleSavePrices}
            />
          </fieldset>
        </Accordion>

        {/* 4. Сетка сеансов */}
        <Accordion title="Сетка сеансов" opened>
          <p className="conf-step__paragraph">
            <button
              className="conf-step__button conf-step__button-accent"
              onClick={() => setShowAddMovie(true)}
            >
              Добавить фильм
            </button>
          </p>

          <div className="conf-step__movies">
            {movies.map((m) => (
              <div
                className="conf-step__movie"
                key={m.id}
                onClick={() => { setMovieForScreening(m); setShowAddScreening(true); }}
                style={{ cursor: 'pointer' }}
              >
                <img className="conf-step__movie-poster" src={m.poster_url} alt={m.title} />
                <h3 className="conf-step__movie-title">{m.title}</h3>
                <p className="conf-step__movie-duration">{m.duration} минут</p>
              </div>
            ))}
          </div>
          <div className="conf-step__dates-box">
            <p className="conf-step__paragraph">Выберите дату:</p>
            <ul className="conf-step__selectors-box">
              {days.map((d) => (
                <li
                  key={d.iso}
                  onClick={() => setSelectedDate(d.iso)}
                  style={{ cursor: 'pointer' }}
                >
                  <input
                    type="radio"
                    className="conf-step__radio"
                    name="screening-date"
                    value={d.iso}
                    checked={selectedDate === d.iso}
                    onChange={() => setSelectedDate(d.iso)}
                  />
                  <span className="conf-step__selector">{d.label}</span>
                </li>
              ))}
            </ul>

            <div className="conf-step__seances">
              {groupedScreenings.map(([hallNumber, items]) => (
                <div className="conf-step__seances-hall" key={hallNumber}>
                  <h3 className="conf-step__seances-title">Зал {hallNumber}</h3>
                  <div className="conf-step__seances-timeline">
                    {items.map((s) => {
                      const movie = movies.find((m) => m.id === s.movie_id);
                      const movieIndex = movies.findIndex((m) => m.id === s.movie_id);
                      const bg = getMovieColor(movieIndex >= 0 ? movieIndex : 0);
                      const start = new Date(s.datetime_start);
                      const end = new Date(s.datetime_end);
                      const durationMin = (end - start) / 60000;
                      const width = durationMin * PX_PER_MIN;
                      const left = minutesFromDayStart(s.datetime_start) * PX_PER_MIN;
                      return (
                        <div
                          className="conf-step__seances-movie"
                          key={s.id}
                          style={{
                            width: `${width}px`,
                            left: `${left}px`,
                            backgroundColor: bg,
                          }}
                          title={movie ? movie.title : ''}
                        >
                          <p className="conf-step__seances-movie-title">
                            {movie ? movie.title : '—'}
                          </p>
                          <p className="conf-step__seances-movie-start">
                            {formatTime(s.datetime_start)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <fieldset className="conf-step__buttons text-center">
            <button
              className="conf-step__button conf-step__button-regular"
              onClick={() => setDraftScreenings(screenings.map((s) => ({ ...s })))}
            >
              Отмена
            </button>
            <input type="submit" value="Сохранить" className="conf-step__button conf-step__button-accent"
              onClick={handleSaveScreenings}
            />
          </fieldset>
        </Accordion>

        {/* 5. Открыть продажи */}
        <Accordion title="Открыть продажи" opened>
          <p className="conf-step__paragraph">Всё готово, теперь можно:</p>
          <ul className="conf-step__sales-list">
            {halls.map((hall) => (
              <li key={hall.id}>
                <span>
                  Зал {hall.number}
                </span>
                <button
                  className="conf-step__button conf-step__button-accent"
                  onClick={() => toggleHallActive(hall)}
                >
                  {hall.is_active ? 'Приостановить продажу билетов' : 'Открыть продажу билетов'}
                </button>
              </li>
            ))}
          </ul>
        </Accordion>

      </main>

      {/* Модалки (всплывающие окна) */}
      {showAddMovie && (
        <AddMovieModal
          onClose={() => setShowAddMovie(false)}
          onCreated={loadMovies}
        />
      )}

      {showAddScreening && movieForScreening && (
        <AddScreeningModal
          movie={movieForScreening}
          halls={halls}
          selectedDate={selectedDate}
          onAdd={handleAddScreening}
          onClose={() => setShowAddScreening(false)}
        />
      )}
    </>
  );
}