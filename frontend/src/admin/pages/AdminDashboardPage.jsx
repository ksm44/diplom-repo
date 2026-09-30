// покачто тут заглушка с моковыми данными
//нужно будет настроить загрузку по api movies, halls и т.д.

import { useState, useEffect } from 'react';
import { apiGet, apiPost, apiDelete } from '../../services/api';
import Accordion from "../components/Accordion";

const MOVIES = [
  { id: 1, title: 'Звёздные войны XXIII: Атака клонированных клонов', duration: 130 },
  { id: 2, title: 'Миссия выполнима', duration: 120 },
  { id: 3, title: 'Серая пантера', duration: 90 },
  { id: 4, title: 'Движение вбок', duration: 95 },
  { id: 5, title: 'Кот Да Винчи', duration: 100 },
];

const SEANCES = [
  {
    hall: 'Зал 1',
    items: [
      { title: 'Миссия выполнима', start: '00:00', width: 60, left: 0, color: 'rgb(133, 255, 137)' },
      { title: 'Миссия выполнима', start: '12:00', width: 60, left: 360, color: 'rgb(133, 255, 137)' },
      { title: 'Звёздные войны XXIII: Атака клонированных клонов', start: '14:00', width: 65, left: 420, color: 'rgb(202, 255, 133)' },
    ],
  },
  {
    hall: 'Зал 2',
    items: [
      { title: 'Звёздные войны XXIII: Атака клонированных клонов', start: '19:50', width: 65, left: 595, color: 'rgb(202, 255, 133)' },
      { title: 'Миссия выполнима', start: '22:00', width: 60, left: 660, color: 'rgb(133, 255, 137)' },
    ],
  },
];

export default function AdminDashboardPage() {


  const [rows, setRows] = useState(10);
  const [cols, setCols] = useState(8);
  const [halls, setHalls] = useState([]);

  const [selectedHall, setSelectedHall] = useState(null);

  //Получение Залов
  function loadHalls() {
    apiGet('/halls').then(setHalls).catch(() => alert('Не удалось загрузить залы'));
  }

  useEffect(() => {
    loadHalls();
  }, []);

  useEffect(() => {
    if (halls.length > 0 && !selectedHall) {
      loadHall(halls[0].number);
    }
  }, [halls]);

  //Создание нового Зала
  async function handleCreateHall() {
    try {
      await apiPost('/halls', { rows: Number(rows), cols: Number(cols) });
      loadHalls(); // ← обновляем список
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
        setRows(data.rows);
        setCols(data.cols);
      })
      .catch(() => alert('Не удалось загрузить зал'));
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
                {Array.from({ length: selectedHall.rows }).map((_, rowIdx) => (
                  <div className="conf-step__row" key={rowIdx}>
                    {selectedHall.seats
                      .filter((s) => s.row === rowIdx + 1)
                      .sort((a, b) => a.number - b.number)
                      .map((seat) => {
                        const cls = seat.is_blocked
                          ? 'disabled'
                          : seat.kind === 'vip'
                          ? 'vip'
                          : 'standart';
                        return (
                          <span
                            key={seat.id}
                            className={`conf-step__chair conf-step__chair_${cls}`}
                          />
                        );
                      })}
                  </div>
                ))}
              </div>
            </div>
          )}

          <fieldset className="conf-step__buttons text-center">
            <button className="conf-step__button conf-step__button-regular">Отмена</button>
            <input type="submit" value="Сохранить" className="conf-step__button conf-step__button-accent" />
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
                  defaultChecked={i === 1}
                />
                <span className="conf-step__selector">Зал {hall.number}</span>
              </li>
            ))}
          </ul>

          <p className="conf-step__paragraph">Установите цены для типов кресел:</p>
          <div className="conf-step__legend">
            <label className="conf-step__label">
              Цена, рублей<input type="text" className="conf-step__input" placeholder="0" />
            </label>
            за <span className="conf-step__chair conf-step__chair_standart" /> обычные кресла
          </div>
          <div className="conf-step__legend">
            <label className="conf-step__label">
              Цена, рублей<input type="text" className="conf-step__input" placeholder="0" defaultValue="350" />
            </label>
            за <span className="conf-step__chair conf-step__chair_vip" /> VIP кресла
          </div>

          <fieldset className="conf-step__buttons text-center">
            <button className="conf-step__button conf-step__button-regular">Отмена</button>
            <input type="submit" value="Сохранить" className="conf-step__button conf-step__button-accent" />
          </fieldset>
        </Accordion>

        {/* 4. Сетка сеансов */}
        <Accordion title="Сетка сеансов" opened>
          <p className="conf-step__paragraph">
            <button className="conf-step__button conf-step__button-accent">Добавить фильм</button>
          </p>

          <div className="conf-step__movies">
            {MOVIES.map((m) => (
              <div className="conf-step__movie" key={m.id}>
                <div className="conf-step__movie-poster" />
                <h3 className="conf-step__movie-title">{m.title}</h3>
                <p className="conf-step__movie-duration">{m.duration} минут</p>
              </div>
            ))}
          </div>

          <div className="conf-step__seances">
            {SEANCES.map((s) => (
              <div className="conf-step__seances-hall" key={s.hall}>
                <h3 className="conf-step__seances-title">{s.hall}</h3>
                <div className="conf-step__seances-timeline">
                  {s.items.map((item, i) => (
                    <div
                      className="conf-step__seances-movie"
                      key={i}
                      style={{
                        width: `${item.width}px`,
                        left: `${item.left}px`,
                        backgroundColor: item.color,
                      }}
                    >
                      <p className="conf-step__seances-movie-title">{item.title}</p>
                      <p className="conf-step__seances-movie-start">{item.start}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <fieldset className="conf-step__buttons text-center">
            <button className="conf-step__button conf-step__button-regular">Отмена</button>
            <input type="submit" value="Сохранить" className="conf-step__button conf-step__button-accent" />
          </fieldset>
        </Accordion>

        {/* 5. Открыть продажи */}
        <Accordion title="Открыть продажи" opened>
          <div className="text-center">
            <p className="conf-step__paragraph">Всё готово, теперь можно:</p>
            <button className="conf-step__button conf-step__button-accent">
              Открыть продажу билетов
            </button>
          </div>
        </Accordion>

      </main>
    </>
  );
}