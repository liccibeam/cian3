import { useEffect, useState } from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { Badge, Button, Icon, Skeleton } from '@/ui';
import { AppShell, Breadcrumbs, PageLayout } from '@/components/Layout';
import {
  Gallery,
  ListingActions,
  ListingCard,
  SearchBar,
  SearchFilters,
  Sorting,
} from '@/components/Realty';
import { filterListings, listingLabel, listings, resultsLabel } from '@/data/listings';
import { usePrototype } from '@/hooks/prototype-context';
import { useIsMobile } from '@/hooks/useIsMobile';
import { normalizeSearch } from '@/data/searches';
import { MobileHome } from './MobileHome';
import s from './PrototypePages.module.css';

export function HomePage() {
  const isMobile = useIsMobile();
  if (isMobile) return <MobileHome />;
  return (
    <AppShell>
      <main id="main">
        <section className={s.hero}>
          <div className={s.heroInner}>
            <span className={s.location}>
              <Icon name="MapLocation16" size={16} /> Москва
            </span>
            <h1>Циан помогает въехать</h1>
            <SearchBar />
          </div>
        </section>
        <section className={s.recommendations}>
          <div className={s.sectionHeader}>
            <h2>Могут подойти</h2>
            <Link to="/search">
              Все объявления <Icon name="ActionChevronRight16" size={16} />
            </Link>
          </div>
          <div className={s.cardGrid}>
            {listings.slice(0, 4).map((listing) => (
              <ListingCard key={listing.id} listing={listing} compact />
            ))}
          </div>
          <div className={s.localBanner}>
            <div>
              <Badge tone="main">Найдите своё место</Badge>
              <h2>Квартира рядом с любимым парком</h2>
              <p>Собрали предложения в Сокольниках — для прогулок и спокойной жизни.</p>
            </div>
            <Link className={s.primaryLink} to="/search?q=Сокольники">
              Посмотреть квартиры →
            </Link>
          </div>
        </section>
      </main>
    </AppShell>
  );
}

function ResultsSkeleton() {
  return (
    <div role="status" aria-label="Загрузка объявлений">
      {[1, 2, 3].map((item) => (
        <div key={item} className={s.skeletonCard}>
          <Skeleton height={230} />
          <div className="stack">
            <Skeleton height={28} width="85%" />
            <Skeleton width="55%" />
            <Skeleton height={40} width="60%" />
            <Skeleton />
            <Skeleton width="75%" />
          </div>
        </div>
      ))}
    </div>
  );
}
export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const { favorites, showDemo, saveSearch, savedSearches, rememberSearch } = usePrototype();
  const [loading, setLoading] = useState(true);
  const signature = params.toString();
  useEffect(() => {
    // Opening the search tab is navigation, not a new search across all of Moscow.
    if (normalizeSearch(signature)) rememberSearch(new URLSearchParams(signature));
  }, [signature, rememberSearch]);
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 280);
    return () => clearTimeout(timer);
  }, [signature]);
  const apply = (next: URLSearchParams) => {
    rememberSearch(next);
    setLoading(next.toString() !== signature);
    setParams(next);
  };
  const resetSearch = () => {
    rememberSearch(new URLSearchParams());
    setLoading(true);
  };
  const state = params.get('state');
  const found = state === 'empty' ? [] : filterListings(listings, params, favorites);
  const isFavorites = params.get('favorites') === '1';
  return (
    <AppShell mobileApp>
      <PageLayout>
        <SearchFilters key={signature} params={params} onApply={apply} />
        <Breadcrumbs
          items={[
            { label: 'Недвижимость в Москве', to: '/' },
            { label: isFavorites ? 'Избранное' : 'Продажа' },
          ]}
        />
        <h1>{isFavorites ? 'Избранные квартиры' : 'Продажа квартир в Москве'}</h1>
        <div className={s.resultsToolbar}>
          <strong>
            {loading || state === 'loading' ? 'Ищем объявления…' : resultsLabel(found.length)}
          </strong>
          <Sorting
            value={params.get('sort') || 'default'}
            onChange={(value) => {
              const next = new URLSearchParams(params);
              next.set('sort', value);
              apply(next);
            }}
          />
          <Button
            theme="main_secondary"
            size="XS"
            beforeIcon="ActionMap16"
            onClick={() => showDemo('Поиск на карте')}
          >
            На карте
          </Button>
          {!isFavorites && (
            <button
              className={s.saveSearch}
              onClick={() => saveSearch(params)}
              disabled={savedSearches.includes(normalizeSearch(params))}
            >
              {savedSearches.includes(normalizeSearch(params))
                ? 'Поиск сохранён'
                : 'Сохранить поиск'}
            </button>
          )}
        </div>
        {(params.has('q') || params.has('rooms') || params.has('maxPrice') || isFavorites) && (
          <div className={s.activeFilters}>
            <Badge tone="main">
              {[
                params.get('q'),
                params.has('rooms') ? `Комнат: ${params.get('rooms')}` : '',
                params.get('maxPrice')
                  ? `До ${Number(params.get('maxPrice')).toLocaleString('ru-RU')} ₽`
                  : '',
                isFavorites ? 'Избранное' : '',
              ]
                .filter(Boolean)
                .join(' · ')}
            </Badge>
            <Link to="/search" onClick={resetSearch}>
              Сбросить фильтры
            </Link>
          </div>
        )}
        {loading || state === 'loading' ? (
          <ResultsSkeleton />
        ) : state === 'error' ? (
          <section className={s.empty} role="alert">
            <Icon name="FunctionalInformationCircle16" size={40} />
            <h2>Не удалось загрузить объявления</h2>
            <p>Попробуйте ещё раз. Выбранные параметры сохранятся.</p>
            <Button
              onClick={() => {
                const next = new URLSearchParams(params);
                next.delete('state');
                apply(next);
              }}
            >
              Попробовать снова
            </Button>
          </section>
        ) : found.length === 0 ? (
          <section className={s.empty}>
            <Icon name={isFavorites ? 'Heart' : 'ActionSearch16'} size={40} />
            <h2>
              {isFavorites
                ? 'Здесь будут избранные квартиры'
                : 'По вашему запросу ничего не найдено'}
            </h2>
            <p>
              {isFavorites
                ? 'Нажмите на сердечко в карточке, чтобы вернуться к ней позже.'
                : 'Попробуйте увеличить бюджет или выбрать другой район.'}
            </p>
            <Link className={s.primaryLink} to="/search" onClick={resetSearch}>
              Показать все квартиры
            </Link>
          </section>
        ) : (
          <div aria-label="Объявления">
            {found.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </PageLayout>
    </AppShell>
  );
}

export function DetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const listing = listings.find((item) => item.id === id);
  const { notify } = usePrototype();
  const candidate: unknown = location.state?.from;
  const from =
    typeof candidate === 'string' && /^(\/search(?:\?|$)|\/(?:\?|$))/.test(candidate)
      ? candidate
      : '/search';
  const fromHome = from === '/' || from.startsWith('/?');
  if (!listing) return <NotFoundPage />;
  return (
    <AppShell mobileApp>
      <PageLayout aside={<ListingActions listing={listing} />}>
        <Breadcrumbs
          items={[
            { label: 'Недвижимость в Москве', to: '/' },
            { label: 'Продажа', to: from },
            { label: listing.district },
          ]}
        />
        <Link className={s.back} to={from} state={{ restoreScroll: location.state?.returnScroll }}>
          {fromHome ? '← На главную' : '← К результатам поиска'}
        </Link>
        <div className={s.detailLabels}>
          <Badge tone="positive">Хорошая цена</Badge>
          <Badge>С мебелью</Badge>
          <span>Обновлено сегодня</span>
        </div>
        <h1 className={s.detailTitle}>
          Продаётся {listingLabel(listing).split(',').slice(0, 2).join(',')}
        </h1>
        <p className={s.detailAddress}>
          Москва, {listing.district}, {listing.address}
        </p>
        <p className={s.detailMetro}>
          <span>М</span> {listing.metro}{' '}
          <span className="muted">· {listing.walkMinutes} минут пешком</span>
        </p>
        <div className={s.detailTools}>
          <Button
            size="XS"
            theme="stroke_secondary"
            onClick={() => notify('Квартира добавлена к сравнению в примере')}
          >
            Сравнить
          </Button>
          <Button
            size="XS"
            theme="stroke_secondary"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(window.location.href);
                notify('Ссылка скопирована');
              } catch {
                notify('Скопируйте ссылку из адресной строки');
              }
            }}
          >
            Поделиться
          </Button>
        </div>
        <Gallery images={listing.images} title={listing.title} />
        <section className={s.descriptionSection}>
          <h2>{listing.title}</h2>
          <dl className={s.specs}>
            <div>
              <dt>Общая площадь</dt>
              <dd>{listing.area} м²</dd>
            </div>
            <div>
              <dt>Кухня</dt>
              <dd>{listing.kitchen} м²</dd>
            </div>
            <div>
              <dt>Этаж</dt>
              <dd>
                {listing.floor} из {listing.floors}
              </dd>
            </div>
          </dl>
          <p>{listing.description}</p>
          <h2>О квартире</h2>
          <dl className={s.specTable}>
            <dt>Тип жилья</dt>
            <dd>Вторичка</dd>
            <dt>Комнат</dt>
            <dd>{listing.rooms || 'Студия'}</dd>
            <dt>Ремонт</dt>
            <dd>Косметический</dd>
            <dt>Мебель</dt>
            <dd>Есть</dd>
            <dt>Санузел</dt>
            <dd>Совмещённый</dd>
          </dl>
        </section>
      </PageLayout>
    </AppShell>
  );
}

export function NotFoundPage() {
  return (
    <AppShell>
      <PageLayout>
        <section className={s.empty}>
          <Badge>404</Badge>
          <h1>Этой страницы пока нет</h1>
          <p>Вернитесь к поиску или начните с главной страницы.</p>
          <Link className={s.primaryLink} to="/">
            На главную
          </Link>
        </section>
      </PageLayout>
    </AppShell>
  );
}
export function GuidePage() {
  return (
    <AppShell>
      <PageLayout>
        <Breadcrumbs
          items={[{ label: 'Главная', to: '/' }, { label: 'Рабочее место дизайнера' }]}
        />
        <div className={s.guide}>
          <Badge tone="main">Cian design workspace</Badge>
          <h1>От идеи до кликабельного прототипа</h1>
          <p className="muted">
            Начните с существующей страницы, компонентов и референсов. Скилл cian-design поможет
            агенту сохранить характер интерфейса.
          </p>
          <div className={s.guideCards}>
            <Link to="/ui">
              <Icon name="PlaceholderImages40" size={32} />
              <h2>UI kit</h2>
              <p>Кнопки, поля, типографика и состояния.</p>
              <span>Открыть каталог →</span>
            </Link>
            <Link to="/patterns">
              <Icon name="ActionMap16" size={32} />
              <h2>Компоненты страниц</h2>
              <p>Карточки, галерея, layout и сценарии.</p>
              <span>Посмотреть примеры →</span>
            </Link>
            <a href="/reference/">
              <Icon name="FunctionalInformationCircle16" size={32} />
              <h2>Первоисточник</h2>
              <p>526 токенов и извлечённые материалы.</p>
              <span>Изучить справочник →</span>
            </a>
          </div>
          <section className="stack">
            <h2>Первый экран</h2>
            <ol>
              <li>
                Откройте проект в агентной среде и попросите использовать <code>cian-design</code>.
              </li>
              <li>Опишите пользователя, задачу и результат сценария.</li>
              <li>Попросите собрать экран из существующих компонентов и связать переходами.</li>
              <li>Пройдите сценарий на компьютере и телефоне, включая ошибки и пустые данные.</li>
            </ol>
            <p>Подробности запуска и шаблон страницы находятся в документации проекта.</p>
          </section>
        </div>
      </PageLayout>
    </AppShell>
  );
}
export function PatternsPage() {
  return (
    <AppShell>
      <PageLayout>
        <Breadcrumbs
          items={[{ label: 'Рабочее место', to: '/guide' }, { label: 'Компоненты страниц' }]}
        />
        <div className="stack">
          <h1>Компоненты страниц</h1>
          <p className="muted">Готовые композиции поверх общего UI kit.</p>
          <div className={s.patternLinks}>
            <Link to="/">Header · Footer · SearchBar</Link>
            <Link to="/search">SearchFilters · Sorting · ListingCard</Link>
            <Link to="/listing/1">PageLayout · Gallery · ListingActions</Link>
            <Link to="/ui">Базовые компоненты →</Link>
          </div>
          <h2>Карточка в выдаче</h2>
          <ListingCard listing={listings[0]} />
          <h2>Компактные карточки</h2>
          <div className={s.cardGrid}>
            {listings.slice(0, 4).map((listing) => (
              <ListingCard key={listing.id} listing={listing} compact />
            ))}
          </div>
          <h2>Состояния выдачи</h2>
          <div className={s.patternLinks}>
            <Link to="/search?state=loading">Загрузка</Link>
            <Link to="/search?state=empty">Пустые данные</Link>
            <Link to="/search?state=error">Ошибка и повторная попытка</Link>
            <Link to="/listing/unknown">Неизвестное объявление</Link>
          </div>
          <h2>Состояния мобильной главной</h2>
          <p className="muted">
            Откройте на ширине до 760 px. Примеры работают в отдельной сессии и не меняют ваши
            сохранённые данные.
          </p>
          <div className={s.patternLinks}>
            <a href="/?scenario=new">Новый пользователь</a>
            <a href="/?scenario=returning">Возвращающийся с сохранённым поиском</a>
            <a href="/">Главная с моими данными</a>
          </div>
        </div>
      </PageLayout>
    </AppShell>
  );
}
