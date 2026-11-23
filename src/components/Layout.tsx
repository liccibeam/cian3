import { useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { Button, Icon } from '@/ui';
import { usePrototype } from '@/hooks/prototype-context';
import { useIsMobile } from '@/hooks/useIsMobile';
import s from './Layout.module.css';
import { trackGoal } from '@/analytics/metrika';

const navigation = [
  'Аренда',
  'Продажа',
  'Новостройки',
  'Дома и участки',
  'Коммерческая',
  'Ипотека',
  'Мой дом',
  'Сделка',
  'Сервисы',
];
export function Header() {
  const { favorites, showDemo } = usePrototype();
  const [menu, setMenu] = useState(false);
  const location = useLocation();
  return (
    <header className={s.header}>
      <a className="skip-link" href="#main">
        К содержимому
      </a>
      <div className={s.topbar}>
        <button
          type="button"
          className={s.menuButton}
          aria-label="Меню"
          aria-expanded={menu}
          aria-controls="main-navigation"
          onClick={() => setMenu(!menu)}
        >
          <Icon name="Menu" size={24} />
        </button>
        <Link to="/" aria-label="Циан — главная" className={s.logo}>
          <img src="/images/logo.svg" alt="Циан" width="112" height="28" />
        </Link>
        <div className={s.actions}>
          <button className={s.assistant} onClick={() => showDemo('Умный помощник')}>
            <span>✦</span> Умный помощник
          </button>
          <button
            className={s.desktopIcon}
            aria-label="Сообщения"
            onClick={() => showDemo('Сообщения')}
          >
            <Icon name="Message" />
          </button>
          <Link
            to="/search?favorites=1"
            className={s.favoriteLink}
            aria-label={`Избранное: ${favorites.length}`}
          >
            <Icon name="Heart" />
            {favorites.length > 0 && <span>{favorites.length}</span>}
          </Link>
          <button
            className={s.desktopIcon}
            aria-label="Уведомления"
            onClick={() => showDemo('Уведомления')}
          >
            <Icon name="Bell" />
          </button>
          <Button size="XS" onClick={() => showDemo('Разместить объявление')}>
            <span className={s.desktopText}>+ Разместить за 0 ₽</span>
            <span className={s.mobileText}>Разместить</span>
          </Button>
          <span className={s.signin}>
            <Button size="XS" theme="main_secondary" onClick={() => showDemo('Войти')}>
              Войти
            </Button>
          </span>
        </div>
      </div>
      <nav
        id="main-navigation"
        aria-label="Основная навигация"
        className={clsx(s.nav, menu && s.navOpen)}
      >
        {navigation.map((label) =>
          label === 'Продажа' ? (
            <NavLink
              key={label}
              to="/search"
              className={location.pathname.startsWith('/search') ? s.active : undefined}
              onClick={() => setMenu(false)}
            >
              {label}
            </NavLink>
          ) : (
            <button
              key={label}
              onClick={() => {
                showDemo(label);
                setMenu(false);
              }}
            >
              {label}
            </button>
          ),
        )}
        <Link to="/ui" className={s.kitLink} onClick={() => setMenu(false)}>
          UI kit ↗
        </Link>
      </nav>
    </header>
  );
}

export function Footer() {
  const { showDemo } = usePrototype();
  return (
    <footer className={s.footer}>
      <div className={s.footerInner}>
        <div className={s.footerLinks}>
          {[
            'Справочный центр',
            'Юридические документы',
            'Поиск на карте',
            'Тарифы и цены',
            'Реклама на сайте',
            'Помощь',
            'Ипотечный калькулятор',
            'Карьера в Циане',
          ].map((label) => (
            <button key={label} onClick={() => showDemo(label)}>
              {label}
            </button>
          ))}
        </div>
        <p>
          Циан — база объявлений о продаже и аренде жилой, загородной и коммерческой недвижимости.
        </p>
        <div className={s.footerBottom}>
          <span>Учебный прототип · демонстрационные объявления</span>
          <Link to="/ui">Компоненты и состояния</Link>
          <Link to="/guide">Как создать свой экран</Link>
          <span>0+</span>
        </div>
      </div>
    </footer>
  );
}
function MobileHeader() {
  return (
    <header className={s.appHeader}>
      <a className="skip-link" href="#main">
        К содержимому
      </a>
      <Link to="/" aria-label="Циан — главная">
        <img src="/images/logo.svg" alt="Циан" width="98" height="28" />
      </Link>
      <span className={s.appRegion}>
        <Icon name="MapLocation16" size={16} /> Москва
      </span>
    </header>
  );
}

function MobileNavigation() {
  const { favorites, showDemo } = usePrototype();
  const { pathname, search } = useLocation();
  const isFavorites =
    pathname === '/search' && new URLSearchParams(search).get('favorites') === '1';
  return (
    <nav className={s.tabbar} aria-label="Навигация приложения">
      <Link
        to="/"
        aria-current={pathname === '/' ? 'page' : undefined}
        onClick={() => trackGoal('navigation_open', { destination: 'home', source: 'tabbar' })}
      >
        <Icon name="Home" size={24} />
        <span>Главная</span>
      </Link>
      <Link
        to="/search"
        aria-current={pathname === '/search' && !isFavorites ? 'page' : undefined}
        onClick={() => trackGoal('navigation_open', { destination: 'search', source: 'tabbar' })}
      >
        <Icon name="ActionSearch16" size={24} />
        <span>Поиск</span>
      </Link>
      <Link
        to="/search?favorites=1"
        aria-label={`Избранное: ${favorites.length}`}
        aria-current={isFavorites ? 'page' : undefined}
        onClick={() => trackGoal('navigation_open', { destination: 'favorites', source: 'tabbar' })}
      >
        <span className={s.tabIcon}>
          <Icon name="Heart" size={24} />
          {favorites.length > 0 && <span className={s.tabCount}>{favorites.length}</span>}
        </span>
        <span>Избранное</span>
      </Link>
      <button onClick={() => showDemo('Сообщения')}>
        <Icon name="Message" size={24} />
        <span>Сообщения</span>
      </button>
      <button onClick={() => showDemo('Профиль')}>
        <Icon name="ActionProfile24" size={24} />
        <span>Профиль</span>
      </button>
    </nav>
  );
}

export function AppShell({
  children,
  mobileApp = false,
}: {
  children: ReactNode;
  mobileApp?: boolean;
}) {
  const isMobile = useIsMobile();
  const app = mobileApp && isMobile;
  return (
    <div className={clsx(s.shell, app && s.appShell)}>
      {app ? <MobileHeader /> : <Header />}
      <div className={s.content}>{children}</div>
      {app ? <MobileNavigation /> : <Footer />}
    </div>
  );
}
export function PageLayout({
  children,
  aside,
  className,
}: {
  children: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <main id="main" className={clsx(s.page, className)}>
      {aside ? (
        <div className={s.columns}>
          <div className={s.primary}>{children}</div>
          <aside className={s.aside}>{aside}</aside>
        </div>
      ) : (
        children
      )}
    </main>
  );
}
export function Breadcrumbs({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav aria-label="Хлебные крошки" className={s.breadcrumbs}>
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`}>
          {index > 0 && <Icon name="ActionChevronRight12" size={12} />}{' '}
          {item.to ? (
            <Link to={item.to}>{item.label}</Link>
          ) : (
            <span aria-current="page">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
