import { useState, useSyncExternalStore } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Button, Icon, Modal } from '@/ui';
import { goalParameters, goals } from '@/analytics/goals';
import { clearGoalLog, getGoalLog, METRIKA_COUNTER_ID, subscribeGoals } from '@/analytics/metrika';
import { experimentSize } from '@/data/experiment';
import { mapLanes, mapScreens, type MapScreenId } from '@/data/scenarioMap';
import s from './ScenarioMap.module.css';

const WIDTH = 1712;
const LANE_HEIGHT = 670;
const CARD_WIDTH = 224;
const CARD_Y = 112;
const x = (column: number) => 24 + column * 360;
const number = (value: number) => value.toLocaleString('ru-RU');

function Experiment() {
  const [baseline, setBaseline] = useState(20);
  const [uplift, setUplift] = useState(2);
  const [traffic, setTraffic] = useState(1000);
  const size = experimentSize(baseline, uplift, traffic);
  return (
    <section id="experiment" className={s.section}>
      <div className={s.sectionTitle}>
        <span>02 / Проверка решения</span>
        <h2>A/B: быстрее продолжить поиск</h2>
      </div>
      <p className={s.lead}>
        Если возвращающемуся пользователю показать продолжение поиска сразу под шапкой, больше людей
        дойдут до карточки квартиры: им не придётся заново искать свои параметры.
      </p>
      <div className={s.variants}>
        <article>
          <Badge>Вариант A · текущий прототип</Badge>
          <h3>Поиск → направления → продолжение</h3>
          <p>
            Блок сохранённого или последнего поиска расположен после направлений, перед
            рекомендациями.
          </p>
        </article>
        <article>
          <Badge tone="main">Вариант B · план</Badge>
          <h3>Продолжение → поиск → направления</h3>
          <p>
            Переносим тот же компактный блок сразу под шапку, добавляем явный текст «Продолжить
            поиск». Остальная композиция и рекомендации одинаковы. Вариант B пока не реализован.
          </p>
        </article>
      </div>
      <div className={s.metricGrid}>
        <article>
          <span>Основная метрика</span>
          <h3>Доля пользователей, открывших карточку</h3>
          <p>
            Уникальные участники с <code>listing_view</code> в течение 24 часов после первого{' '}
            <code>home_view</code> / все участники с этим показом главной. Один пользователь
            считается один раз, независимо от числа визитов и карточек.
          </p>
        </article>
        <article>
          <span>Ограничивающая метрика</span>
          <h3>Пустая выдача или ошибка</h3>
          <p>
            Доля участников хотя бы с одним <code>search_view(status=empty|error)</code> за те же 24
            часа. Допустимый рост — менее 1 п.п. Верхняя односторонняя 95% граница разницы B − A
            должна быть ниже +1 п.п.
          </p>
        </article>
      </div>
      <p>
        Аудитория — только мобильные возвращающиеся пользователи с последним или сохранённым поиском
        на первом показе. Распределение 50/50 по стабильному ID пользователя, вариант закрепляется
        на весь тест. Исключаем сотрудников, ботов и просмотры <code>/map</code>. Новичков не
        смешиваем с этой когортой.
      </p>
      <div className={s.calculator}>
        <div className={s.calculatorInputs}>
          <label>
            Базовая конверсия, %
            <input
              type="number"
              min="1"
              max="95"
              step="1"
              value={baseline || ''}
              onChange={(e) => setBaseline(Number(e.target.value))}
            />
          </label>
          <label>
            Минимальный эффект, п.п.
            <input
              type="number"
              min="0.1"
              max="20"
              step="0.1"
              value={uplift || ''}
              onChange={(e) => setUplift(Number(e.target.value))}
            />
          </label>
          <label>
            Подходящих пользователей в день
            <input
              type="number"
              min="1"
              step="100"
              value={traffic || ''}
              onChange={(e) => setTraffic(Number(e.target.value))}
            />
          </label>
        </div>
        <div aria-live="polite" className={s.calculatorResult}>
          {size ? (
            <>
              <strong>{number(size.total)} пользователей</strong>
              <span>
                по {number(size.perArm)} на вариант · {size.recruitmentDays} дней набора + 24 часа
                на дозревание
              </span>
              <small>
                Итого минимум {size.totalDays} дней при указанном трафике. Основная метрика требует{' '}
                {number(size.primary)} на вариант, ограничивающая — {number(size.guardrail)}. Берём
                максимум и округляем вверх до сотни.
              </small>
            </>
          ) : (
            <p role="alert">
              Введите положительные значения; базовая конверсия вместе с эффектом должна быть меньше
              100%.
            </p>
          )}
        </div>
      </div>
      <p className={s.assumption}>
        Это расчётные допущения, а не метрики Циана: база 20%, эффект +2 п.п. (20% → 22%, +10%
        относительно), трафик 1000 подходящих пользователей в день. Для ограничивающей метрики
        предполагаем базу 5% и отсутствие реального ухудшения. До запуска заменить их данными
        пилота. Объём — нормальное приближение для двух долей, α = 0,05, мощность 80%; для основной
        метрики критерий двусторонний, для ограничения — односторонний.
      </p>
      <p>
        Набор — минимум две полные недели и до расчётной выборки; срок округлён до полных недель. Не
        останавливаем тест при первом значимом результате. B принимаем, если прирост основной
        метрики положителен с двусторонним p &lt; 0,05 и пройдено ограничение. Иначе сохраняем A или
        фиксируем недостаток данных. До старта проверяем A/A, соответствие 50/50, дедупликацию
        пользователей и полноту событий; при потере данных тест не интерпретируем.
      </p>
      <p className={s.assumption}>
        Эксперимент не запущен: счётчик и случайное распределение не подключены, текущие события
        имеют variant=A. Синтетический прототип проверяет сценарий и разметку, но не подтверждает
        гипотезу.
      </p>
    </section>
  );
}

export function ScenarioMap() {
  const [zoom, setZoom] = useState(0.7);
  const [selected, setSelected] = useState<MapScreenId | null>(null);
  const events = useSyncExternalStore(subscribeGoals, getGoalLog, getGoalLog);
  const screen = selected ? mapScreens[selected] : null;
  return (
    <main className={s.page} id="main">
      <header className={s.header}>
        <Link to="/" aria-label="Циан — главная">
          <img src="/images/logo.svg" width="98" height="28" alt="Циан" />
        </Link>
        <span>Прототип / Главная</span>
        <Link to="/patterns">Все состояния</Link>
      </header>
      <section className={s.intro}>
        <Badge tone="main">Карта сценария</Badge>
        <h1>От главной — к своему месту</h1>
        <p>
          16 экранов и состояний мобильного сценария. На экранах — цели показа, на стрелках —
          события переходов. Повторяющиеся экраны намеренно показаны в каждом пути.
        </p>
        <nav className={s.anchors} aria-label="Разделы карты">
          <a href="#flow">Карта экранов</a>
          <a href="#experiment">A/B-тест</a>
          <a href="#goals">Каталог целей</a>
          <a href="#journal">Журнал событий</a>
        </nav>
      </section>
      <section className={s.section} id="flow">
        <div className={s.sectionTitle}>
          <span>01 / Маршруты и события</span>
          <h2>Карта экранов</h2>
        </div>
        <div className={s.toolbar}>
          <p>
            Нажмите миниатюру для увеличения. Область карты прокручивается по горизонтали;
            клавиатурой — после Tab.
          </p>
          <div>
            <Button
              size="XS"
              theme="stroke_secondary"
              aria-label="Уменьшить карту"
              disabled={zoom <= 0.4}
              onClick={() => setZoom((value) => Math.max(0.4, +(value - 0.1).toFixed(1)))}
            >
              −
            </Button>
            <output aria-label="Масштаб карты">{Math.round(zoom * 100)}%</output>
            <Button
              size="XS"
              theme="stroke_secondary"
              aria-label="Увеличить карту"
              disabled={zoom >= 1}
              onClick={() => setZoom((value) => Math.min(1, +(value + 0.1).toFixed(1)))}
            >
              +
            </Button>
          </div>
        </div>
        <div
          className={s.mapViewport}
          role="region"
          aria-label="Схема экранов с переходами"
          tabIndex={0}
        >
          <div style={{ width: WIDTH * zoom, height: LANE_HEIGHT * mapLanes.length * zoom }}>
            <div
              className={s.board}
              style={{
                width: WIDTH,
                height: LANE_HEIGHT * mapLanes.length,
                transform: `scale(${zoom})`,
              }}
            >
              {mapLanes.map((lane, row) => (
                <section
                  key={lane.title}
                  className={s.lane}
                  style={{ top: row * LANE_HEIGHT }}
                  aria-label={lane.title}
                >
                  <h3>{lane.title}</h3>
                  <p className={s.laneSubtitle}>{lane.subtitle}</p>
                  <svg className={s.arrows} width={WIDTH} height={LANE_HEIGHT} aria-hidden="true">
                    <defs>
                      <marker
                        id={`arrow-${row}`}
                        markerWidth="8"
                        markerHeight="8"
                        refX="7"
                        refY="4"
                        orient="auto"
                      >
                        <path d="M0 0 L8 4 L0 8" fill="var(--text-main-default)" />
                      </marker>
                    </defs>
                    {lane.edges.map((edge, i) => (
                      <g key={i}>
                        <path
                          d={`M ${x(i) + CARD_WIDTH + 3} 316 H ${x(i + 1) - 8}`}
                          markerEnd={`url(#arrow-${row})`}
                        />
                        <foreignObject x={x(i) + CARD_WIDTH + 5} y={216} width={126} height={94}>
                          <div className={s.edgeLabel}>
                            {edge.goals.map((goal) => (
                              <code key={goal}>{goal}</code>
                            ))}
                            <small>{edge.params}</small>
                          </div>
                        </foreignObject>
                      </g>
                    ))}
                    {lane.shortcut && (
                      <g>
                        <path
                          className={s.shortcut}
                          d={`M ${x(0) + 112} ${CARD_Y} V 78 H ${x(lane.shortcut.to) + 112} V ${CARD_Y - 7}`}
                          markerEnd={`url(#arrow-${row})`}
                        />
                        <foreignObject x={x(1)} y={59} width={224} height={48}>
                          <div className={s.shortcutLabel}>
                            <code>{lane.shortcut.goal}</code>
                            <small>{lane.shortcut.params}</small>
                          </div>
                        </foreignObject>
                      </g>
                    )}
                    {lane.returns?.map((back, i) => {
                      const y = 590 + i * 42;
                      return (
                        <g key={`return-${i}`}>
                          <path
                            className={s.shortcut}
                            d={`M ${x(back.from) + 112} 560 V ${y} H ${x(back.to) + 112} V 560`}
                            markerEnd={`url(#arrow-${row})`}
                          />
                          <foreignObject
                            x={(x(back.from) + x(back.to)) / 2}
                            y={y - 16}
                            width={224}
                            height={42}
                          >
                            <div className={s.shortcutLabel}>
                              <code>{back.goal}</code>
                              <small>{back.params}</small>
                            </div>
                          </foreignObject>
                        </g>
                      );
                    })}
                  </svg>
                  {lane.screens.map((id, column) => {
                    const item = mapScreens[id];
                    return (
                      <article
                        key={`${id}-${column}`}
                        className={s.screenCard}
                        style={{ left: x(column), top: CARD_Y }}
                      >
                        <button
                          className={s.previewButton}
                          onClick={() => setSelected(id)}
                          aria-label={`Увеличить: ${item.title}`}
                        >
                          <span className={s.screenTitle}>{item.title}</span>
                          <img
                            src={`/scenario-map/${id}.png`}
                            width="146"
                            height="316"
                            loading="lazy"
                            alt={`Миниатюра: ${item.title}`}
                          />
                        </button>
                        <div className={s.screenGoal}>
                          <code>{item.goal}</code>
                          <span>
                            step={goals[item.goal].step} · {item.params}
                          </span>
                        </div>
                        <a href={item.url}>
                          Открыть экран <Icon name="ActionArrowUpRight16" size={14} />
                        </a>
                      </article>
                    );
                  })}
                </section>
              ))}
            </div>
          </div>
        </div>
        <div className={s.returnNotes}>
          <h3>Обратные переходы и действия на экране</h3>
          <p>
            <code>listing_back</code> → главная или выдача с прежней прокруткой.{' '}
            <code>overlay_close</code> → экран под галереей, формой, списком или демо.{' '}
            <code>search_save</code> сохраняет параметры; после возврата на главную появляется
            состояние saved. <code>saved_search_remove</code> удаляет запись; после последней записи
            появляется recent. <code>gallery_change</code> листает фотографии внутри галереи.
          </p>
          <p>
            Стрелки последовательностей показывают основной маршрут; загрузка может завершиться
            любым из трёх состояний. Реклама остаётся блоком ленты, а не отдельной страницей.
            Подробные параметры — в каталоге целей ниже.
          </p>
        </div>
      </section>
      <Experiment />
      <section id="goals" className={s.section}>
        <div className={s.sectionTitle}>
          <span>03 / Яндекс Метрика</span>
          <h2>Единый каталог целей</h2>
        </div>
        <p>
          Номер счётчика: <code>{METRIKA_COUNTER_ID}</code> — заглушка. Вызов в коде:{' '}
          <code>ym(counterId, 'reachGoal', goal, params)</code>. Без SDK и положительного номера
          события остаются только в локальном журнале. В Метрике нужно создать цели типа «Целевое
          событие» с идентификаторами из таблицы.
        </p>
        <p>
          Каждое событие содержит <code>flow=home</code>, <code>variant=A</code>, <code>step</code>,{' '}
          <code>screen</code>; дополнительные параметры описывают состояние или действие. Шаги: 1 —
          главная, 2 — выдача, 3 — объявление, 4 — форма, 5 — подтверждение; 0 — вспомогательный
          переход. Тексты запросов, имя и сообщение не отправляются.{' '}
          <a
            href="https://yandex.ru/support/metrica/ru/objects/reachgoal"
            target="_blank"
            rel="noreferrer"
          >
            Документация reachGoal
          </a>
          .
        </p>
        <div className={s.tableScroll}>
          <table>
            <thead>
              <tr>
                <th>Идентификатор цели</th>
                <th>Шаг</th>
                <th>Событие</th>
                <th>Дополнительные параметры</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(goals).map(([id, goal]) => (
                <tr key={id}>
                  <td>
                    <code>{id}</code>
                  </td>
                  <td>{goal.step}</td>
                  <td>{goal.label}</td>
                  <td>{goalParameters[id as keyof typeof goals]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section id="journal" className={s.section}>
        <div className={s.sectionTitle}>
          <span>04 / Проверка разметки</span>
          <h2>Локальный журнал событий</h2>
        </div>
        <p>
          Пройдите прототип в этой вкладке и вернитесь на <code>/map</code>. Журнал хранит последние
          200 событий в sessionStorage; сам просмотр карты целей не создаёт.
        </p>
        <div className={s.journalActions}>
          <a href="/?scenario=new">Пройти с начала</a>
          <a href="/?scenario=returning">Продолжить сохранённый поиск</a>
          <Button
            size="XS"
            theme="stroke_secondary"
            disabled={!events.length}
            onClick={clearGoalLog}
          >
            Очистить журнал
          </Button>
        </div>
        {events.length ? (
          <ol className={s.journal}>
            {events
              .slice(-15)
              .reverse()
              .map((event) => (
                <li key={event.id}>
                  <time>{new Date(event.at).toLocaleTimeString('ru-RU')}</time>
                  <code>{event.goal}</code>
                  <pre>{JSON.stringify(event.params, null, 2)}</pre>
                </li>
              ))}
          </ol>
        ) : (
          <p className={s.emptyLog}>
            Пока нет событий. Откройте прототип по ссылке выше и выполните действие.
          </p>
        )}
      </section>
      <Modal open={!!screen} title={screen?.title || ''} onClose={() => setSelected(null)}>
        {screen && (
          <div className={s.expanded}>
            <img src={`/scenario-map/${selected}.png`} alt={screen.title} />
            <p>
              <code>{screen.goal}</code> · {screen.params}
            </p>
            {'note' in screen && <p>{screen.note}</p>}
            <a href={screen.url}>Открыть в прототипе</a>
          </div>
        )}
      </Modal>
    </main>
  );
}
