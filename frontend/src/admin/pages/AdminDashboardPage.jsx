import { useState, useEffect, useMemo } from 'react';
import { apiGet, apiPost, apiDelete, apiPatch, apiPut } from '../../services/api';
import Accordion from "../components/Accordion";
import AddMovieModal from "../components/AddMovieModal";
import MovieScreeningModal from '../components/MovieScreeningModal';
import ScreeningDetailsModal from "../components/ScreeningDetailsModal";
import LogoutButton from '../../components/LogoutButton';

import '../../styles/admin/normalize.css';
import '../../styles/admin/styles.css';

  const WEEK_DAYS_SHORT = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

// YYYY-MM-DD (локальное)
function toLocalDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// 6 дней, начиная с startDate
function buildDaysForBatch(startDate) {
  return Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    return {
      iso: toLocalDateStr(d),
      week: WEEK_DAYS_SHORT[d.getDay()],
      num: d.getDate(),
      isWeekend: d.getDay() === 0 || d.getDay() === 6,
    };
  });
}

// Сегодня в 00:00 (локально)
function getToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

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
  const [draftScreenings, setDraftScreenings] = useState([]);   // редактируемая копия

  //Для изменения состояния кнопок "Сохранить"
  const [seatsDirty, setSeatsDirty] = useState(false);
  const [pricesDirty, setPricesDirty] = useState(false);
  const [screeningsDirty, setScreeningsDirty] = useState(false);

  const [selectedScreening, setSelectedScreening] = useState(null);

  // Длина блока в  px на минуту
  const TIMELINE_WIDTH = 720 - 12; // длина (из styles.css) - padding
  const PX_PER_MIN = TIMELINE_WIDTH / (24 * 60); // = 0.5 пикс в минуте

  // Диапазон дат для "Сетки сеансов" (page-nav)
  const today = useMemo(getToday, []);
  const [batchStart, setBatchStart] = useState(today);
  const [selectedDate, setSelectedDate] = useState(toLocalDateStr(today));

  const days = useMemo(() => {
    const list = buildDaysForBatch(batchStart);
    list[0] = { ...list[0], isToday: batchStart.getTime() === today.getTime() };
    return list;
  }, [batchStart, today]);

  // при смене окна — выбрать первую дату
  useEffect(() => {
    setSelectedDate(days[0].iso);
  }, [batchStart]);

  const canGoBack = batchStart.getTime() > today.getTime();

  async function openScreeningDetails(screeningId) {
  try {
    const full = await apiGet(`/screenings/${screeningId}`);
    setSelectedScreening(full);
  } catch {
    alert('Не удалось загрузить сеанс');
  }
}

  function goNext() {
    const next = new Date(batchStart);
    next.setDate(batchStart.getDate() + 6);
    setBatchStart(next);
  }

  function goBack() {
    const prev = new Date(batchStart);
    prev.setDate(batchStart.getDate() - 6);
    if (prev.getTime() < today.getTime()) {
      setBatchStart(today);
    } else {
      setBatchStart(prev);
    }
  }

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
    if (halls.length > 0 && !selectedPriceHall) {
      setSelectedPriceHall(halls[0]);
      handlePriceHallChange(halls[0]);
    }
  }, [halls]);

  useEffect(() => { loadMovies(); }, []);

  useEffect(() => { loadScreenings(selectedDate); }, [selectedDate]);

  //Группировка сеансов
  const groupedScreenings = useMemo(() => {
    const byHall = new Map();

    // 1) заранее создаём пустой массив для каждого существующего зала
    for (const hall of halls) {
      byHall.set(hall.number, []);
    }

    // 2) раскидываем сеансы по залам
    for (const s of draftScreenings) {
      if (!byHall.has(s.hall_number)) byHall.set(s.hall_number, []);
      byHall.get(s.hall_number).push(s);
    }

    // 3) сортировка сеансов внутри зала
    for (const arr of byHall.values()) {
      arr.sort((a, b) => new Date(a.datetime_start) - new Date(b.datetime_start));
    }

    return [...byHall.entries()].sort(([a], [b]) => a - b);
  }, [draftScreenings, halls]);

  function formatTime(iso) {
    return iso.slice(11, 16); // "2026-10-05T03:00:00" → "03:00"
  }

  // при загрузке с бэкенда — заполняем и копию
  function loadScreenings(date = selectedDate) {
    const params = new URLSearchParams({ date_screening: date });

    apiGet(`/screenings?${params.toString()}`)
      .then((data) => {
        setScreenings(data);
        setDraftScreenings(data.map((s) => ({ ...s })));
      })
      .catch((err) => alert(`Не удалось загрузить сеансы: ${err.message}`));
    setScreeningsDirty(false);
  }


  function minutesFromDayStart(iso) {
    const [h, m] = iso.slice(11, 16).split(':').map(Number);
    return h * 60 + m;
  }

  //Получение Залов
  function loadHalls() {
    apiGet('/halls').then(setHalls).catch((err) => alert(`Не удалось загрузить залы: ${err.message}`));

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
    setPricesDirty(false);
  }

  //Добавление нового фильма в БД
  function loadMovies() {
    apiGet('/movies').then(setMovies).catch((err) => alert(`Не удалось загрузить фильмы: ${err.message}`));
  }

  //Создание нового Зала
  async function handleCreateHall() {
    try {
      await apiPost('/halls', { rows: 10, cols: 8 });
      loadHalls();
    } catch (err) {
      alert(`Не удалось создать зал: ${err.message}`);
    }
  }

  //Удаление Зала
  async function handleRemoveHall(hall_number) {
    if (!window.confirm(`Действительно хотите удалить Зал ${hall_number}?`)) return;

    try {
      await apiDelete(`/halls/${hall_number}`);
      loadHalls(); // ← обновляем список
    } catch (err) {
      alert(`Не удалось удалить зал: ${err.message}`);
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
        setSeatsDirty(false);
      })
      .catch((err) => alert(`Не удалось загрузить зал: ${err.message}`));
  }

  //Обработчик клика по креслу
  function handleSeatClick(row, number) {
    setSeatsDirty(true);
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

  //Для указания одинакового цвета фона фильмов
  const MOVIE_COLORS = [
    '#caff85', // 1
    '#85ff89', // 2
    '#85ffd3', // 3
    '#85e2ff', // 4
    '#8599ff', // 5
    '#ba85ff', // 6
    '#ff85fb', // 7
    '#ff85b1', // 8
    '#ffa285', // 9
  ];

  function getMovieColor(index) {
    return MOVIE_COLORS[index % MOVIE_COLORS.length];
  }

  function handleAddScreening(newScreening) {
    setDraftScreenings((prev) => [...prev, newScreening]);
    setScreeningsDirty(true);
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
    } catch (err) {
      alert(
        'Не удалось сохранить/изменить схему зала.\n\n' +
        'Нельзя изменить схему зала, пока в нём есть сеансы.\n\n' +
        'Попробуйте удалить и создать зал заново.\n\n' +
        `Причина: ${err.message}`
      );
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
      setPricesDirty(false);
    } catch (err) {
      alert(`Не удалось сохранить цены: ${err.message}`);
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
    } catch (err) {
      alert(`Не удалось сохранить сеансы: ${err.message}`);
    }
  }

  //Открыть/приостановить продажи
  async function toggleHallActive(hall) {
    try {
      await apiPatch(`/halls/${hall.number}/activate`);
      loadHalls();
    } catch (err) {
      alert(`Не удалось изменить статус продаж: ${err.message}`);
    }
  }

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-header__title">Идём<span>в</span>кино</h1>
          <span className="page-header__subtitle">Администраторррская</span>
        </div>
        <LogoutButton />
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
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, '').slice(0, 2);
                  setRows(e.target.value);
                  setSeatsDirty(true);
                }}
                maxLength={2}
              />
            </label>
            <span className="multiplier">x</span>
            <label className="conf-step__label">
              Мест, шт
              <input
                type="text"
                className="conf-step__input"
                value={cols}
                onChange={(e) => {
                   const v = e.target.value.replace(/\D/g, '').slice(0, 2);
                  setCols(e.target.value);
                  setSeatsDirty(true);
                }}
                maxLength={2}
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
              disabled={!seatsDirty}
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
                    setPricesDirty(false);
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
                onChange={(e) => {
                  setPriceStandard(e.target.value);
                  setPricesDirty(true);
                }}
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
                onChange={(e) => {
                  setPriceVip(e.target.value);
                  setPricesDirty(true);
                }}
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
              disabled={!pricesDirty}
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

          <p className="conf-step__paragraph">Нажмите на фильм для создания сеанса:</p>

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
            <nav className="page-nav">
              {canGoBack && (
                <a
                  className="page-nav__day page-nav__day_prev"
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    goBack();
                  }}
                />
              )}

              {days.map((d) => (
                <a
                  key={d.iso}
                  className={
                    'page-nav__day' +
                    (d.isToday ? ' page-nav__day_today' : '') +
                    (d.iso === selectedDate ? ' page-nav__day_chosen' : '') +
                    (d.isWeekend ? ' page-nav__day_weekend' : '')
                  }
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedDate(d.iso);
                  }}
                >
                  <span className="page-nav__day-week">{d.week}</span>
                  <span className="page-nav__day-number">{d.num}</span>
                </a>
              ))}

              <a
                className="page-nav__day page-nav__day_next"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  goNext();
                }}
              />
            </nav>

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
                            cursor: 'pointer',
                          }}
                          title={movie ? movie.title : ''}
                          onClick={() => openScreeningDetails(s.id)}
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
              onClick={() =>{
                setDraftScreenings(screenings.map((s) => ({ ...s })));
                setScreeningsDirty(false);
              }}
            >
              Отмена
            </button>
            <input type="submit" value="Сохранить" className="conf-step__button conf-step__button-accent"
                   onClick={handleSaveScreenings}
                   disabled={!screeningsDirty}
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
        <MovieScreeningModal
          movie={movieForScreening}
          halls={halls}
          selectedDate={selectedDate}
          onAdd={handleAddScreening}
          onClose={() => setShowAddScreening(false)}
          onDeleted={loadMovies}
        />
      )}

      {selectedScreening && (
        <ScreeningDetailsModal
          screening={selectedScreening}
          movie={movies.find((m) => m.id === selectedScreening.movie_id)}
          hall={halls.find((h) => h.id === selectedScreening.hall_id)}
          onClose={() => setSelectedScreening(null)}
          onDeleted={() => loadScreenings(selectedDate)}
        />
      )}

    </>
  );
}