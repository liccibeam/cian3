import { useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Icon, Modal, type IconName } from '@/ui';
import { AppShell } from '@/components/Layout';
import { ListingCard } from '@/components/Realty';
import { listings } from '@/data/listings';
import { searchDescription, searchHref, searchTitle } from '@/data/searches';
import { usePrototype } from '@/hooks/prototype-context';
import s from './MobileHome.module.css';

const verticals: { label: string; description: string; icon: IconName; demo?: string }[] = [
  { label: 'Купить', description: 'Квартиру для себя', icon: 'Key' },
  { label: 'Снять', description: 'Надолго', icon: 'Home', demo: 'Долгосрочная аренда' },
  {
    label: 'Новостройки',
    description: 'Выбрать свой ЖК',
    icon: 'Building',
    demo: 'Поиск жилых комплексов',
  },
  {
    label: 'Посуточно',
    description: 'Пожить и отдохнуть',
    icon: 'FunctionalCalendar24',
    demo: 'Посуточная аренда',
  },
  {
    label: 'Коммерческая',
    description: 'Для вашего дела',
    icon: 'Briefcase',
    demo: 'Коммерческая недвижимость',
  },
];

export function MobileHome() {
  const navigate = useNavigate();
  const { lastSearch, savedSearches, removeSearch, showDemo, rememberSearch } = usePrototype();
  const [savedOpen, setSavedOpen] = useState(false);
  const resumeRef = useRef<HTMLAnchorElement>(null);
  const closeSaved = () => {
    setSavedOpen(false);
    if (!savedSearches.length) requestAnimationFrame(() => resumeRef.current?.focus());
  };
  const resume = savedSearches[0] ?? lastSearch;
  const hasSaved = savedSearches.length > 0;
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams();
    const q = String(new FormData(event.currentTarget).get('q') || '').trim();
    if (q) params.set('q', q);
    rememberSearch(params);
    navigate(searchHref(params.toString()));
  };
  return (
    <AppShell mobileApp>
      <main id="main" className={s.home}>
        <section className={s.discovery} aria-labelledby="home-title">
          <h1 id="home-title">Найдите своё место</h1>
          <p className={s.subtitle}>Для жизни, работы и новых планов</p>
          <form className={s.search} onSubmit={submit} role="search">
            <Icon name="ActionSearch16" size={20} />
            <label htmlFor="home-query" className="sr-only">
              Город, район или метро
            </label>
            <input
              id="home-query"
              name="q"
              placeholder="Район, метро или адрес"
              autoComplete="off"
              enterKeyHint="search"
            />
            <Button type="submit" size="XS" aria-label="Найти квартиру">
              Найти
            </Button>
          </form>
          <nav className={s.verticals} aria-label="Что вы ищете?">
            {verticals.map(({ label, description, icon, demo }) => {
              const content = (
                <>
                  <Icon name={icon} size={24} />
                  <strong>{label}</strong>
                  <small>{description}</small>
                </>
              );
              return demo ? (
                <button key={label} onClick={() => showDemo(demo)}>
                  {content}
                </button>
              ) : (
                <Link key={label} to="/search" className={s.buy}>
                  {content}
                  <span className={s.buyArrow}>
                    <Icon name="ActionArrowUpRight16" size={20} />
                  </span>
                </Link>
              );
            })}
          </nav>
        </section>

        {resume !== null && (
          <section className={s.resume} aria-label="Продолжить поиск">
            <div className={s.resumeHeader}>
              <span>{hasSaved ? 'Сохранённый поиск' : 'Вы недавно искали'}</span>
              {hasSaved && (
                <button onClick={() => setSavedOpen(true)} aria-label="Все сохранённые поиски">
                  Все <Icon name="ActionChevronRight12" size={12} />
                </button>
              )}
            </div>
            <Link ref={resumeRef} to={searchHref(resume)} className={s.resumeLink}>
              <span className={s.resumeIcon}>
                <Icon name={hasSaved ? 'Bookmark' : 'ActionSearch16'} size={20} />
              </span>
              <span className={s.resumeText}>
                <strong>{searchTitle(resume)}</strong>
                <small>{searchDescription(resume)}</small>
              </span>
              <Icon name="ActionChevronRight16" size={18} />
            </Link>
          </section>
        )}

        <section className={s.recommendations} aria-labelledby="recommendations-title">
          <div className={s.sectionHeading}>
            <div>
              <h2 id="recommendations-title">Могут подойти</h2>
              <p>Квартиры в Москве</p>
            </div>
            <Link to="/search" aria-label="Все объявления">
              <Icon name="ActionChevronRight16" size={20} />
            </Link>
          </div>
          <div className={s.feed}>
            {listings.slice(0, 4).map((listing) => (
              <ListingCard key={listing.id} listing={listing} compact feed />
            ))}
          </div>
          <aside className={s.ad} aria-label="Реклама">
            <div className={s.adCopy}>
              <span className={s.adLabel}>Реклама</span>
              <h3>
                Ближе к парку.
                <br />
                Ближе к своему.
              </h3>
              <p>Квартиры в Сокольниках</p>
              <button onClick={() => showDemo('Рекламное предложение: квартиры у парка')}>
                Узнать больше <Icon name="ActionArrowUpRight16" size={16} />
              </button>
            </div>
            <img src="/images/hero.jpg" alt="" loading="lazy" />
          </aside>
          <div className={s.feed}>
            {listings.slice(4).map((listing) => (
              <ListingCard key={listing.id} listing={listing} compact feed />
            ))}
          </div>
          <Link className={s.allListings} to="/search">
            Все квартиры в Москве <Icon name="ActionChevronRight16" size={16} />
          </Link>
        </section>
      </main>
      <Modal open={savedOpen} title="Сохранённые поиски" onClose={closeSaved}>
        {savedSearches.length === 0 ? (
          <p className="muted">
            Пока нет сохранённых поисков. Сохраните подходящие параметры в выдаче.
          </p>
        ) : (
          <ul className={s.savedList}>
            {savedSearches.map((search) => (
              <li key={search}>
                <Link to={searchHref(search)} onClick={() => setSavedOpen(false)}>
                  <strong>{searchTitle(search)}</strong>
                  <span>{searchDescription(search)}</span>
                </Link>
                <Button
                  theme="stroke_secondary"
                  size="XS"
                  onClick={() => removeSearch(search)}
                  aria-label={`Удалить поиск: ${searchTitle(search)}`}
                >
                  Удалить
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </AppShell>
  );
}
