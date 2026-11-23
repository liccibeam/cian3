import { useState, type FormEvent, type MouseEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { Badge, Button, Icon, Input, Modal, Select } from '@/ui';
import { usePrototype } from '@/hooks/prototype-context';
import { listingLabel, money, type Listing } from '@/data/listings';
import s from './Realty.module.css';

export function FavoriteButton({ listing }: { listing: Listing }) {
  const { favorites, toggleFavorite } = usePrototype();
  const active = favorites.includes(listing.id);
  return (
    <button
      type="button"
      className={clsx(s.favorite, active && s.favoriteActive)}
      aria-label={`${active ? 'Убрать из избранного' : 'В избранное'}: ${listing.title}`}
      aria-pressed={active}
      onClick={() => toggleFavorite(listing.id)}
    >
      <Icon name="Heart" size={22} />
    </button>
  );
}

export function ListingCard({
  listing,
  compact = false,
  feed = false,
}: {
  listing: Listing;
  compact?: boolean;
  feed?: boolean;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { showDemo } = usePrototype();
  const to = `/listing/${listing.id}`;
  const openCard = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;
    event.preventDefault();
    navigate(to, {
      state: { from: location.pathname + location.search, returnScroll: window.scrollY },
    });
  };
  return (
    <article className={clsx(s.card, compact && s.compact, feed && s.feed)}>
      <div className={s.photo}>
        <Link to={to} onClick={openCard} tabIndex={-1} aria-hidden="true">
          <img src={listing.images[0]} alt="" loading="lazy" />
        </Link>
        <FavoriteButton listing={listing} />
        {listing.badge && (
          <span className={s.photoBadge}>
            <Badge tone={listing.badge === 'Хорошая цена' ? 'positive' : 'main'}>
              {listing.badge}
            </Badge>
          </span>
        )}
        <span className={s.photoCount}>
          <Icon name="PlaceholderImage16" size={14} /> {listing.images.length}
        </span>
      </div>
      <div className={s.cardBody}>
        <Link className={s.cardTitle} to={to} onClick={openCard}>
          {listingLabel(listing)}
        </Link>
        <strong className={s.price}>{money(listing.price)}</strong>
        {!compact && (
          <span className={s.priceMeter}>{money(Math.round(listing.price / listing.area))}/м²</span>
        )}
        <span className={s.metro}>
          <span>М</span> {listing.metro} <small>· {listing.walkMinutes} мин. пешком</small>
        </span>
        <p className={s.address}>Москва, {listing.address}</p>
        {!compact && (
          <>
            <p className={s.description}>
              {listing.title}. {listing.description}
            </p>
            <span className={s.updated}>Обновлено сегодня</span>
          </>
        )}
      </div>
      {!compact && (
        <div className={s.cardSeller}>
          <span className={s.avatar}>
            <Icon name="PlaceholderUser16" size={24} />
          </span>
          <small>ПРОДАВЕЦ</small>
          <strong>{listing.seller}</strong>
          <Badge>Проверенный профиль</Badge>
          <Button
            theme="main_secondary"
            fullWidth
            onClick={() => showDemo('Связаться с продавцом')}
          >
            Связаться
          </Button>
        </div>
      )}
    </article>
  );
}

export function SearchBar() {
  const navigate = useNavigate();
  const { showDemo, rememberSearch } = usePrototype();
  return (
    <div className={s.heroSearch}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const q = String(new FormData(event.currentTarget).get('q') || '').trim();
          const params = new URLSearchParams();
          if (q) params.set('q', q);
          rememberSearch(params);
          navigate(params.size ? `/search?${params}` : '/search');
        }}
      >
        <Icon name="ActionSearch16" size={24} />
        <label htmlFor="home-query" className="sr-only">
          Город, район или метро
        </label>
        <input id="home-query" name="q" placeholder="Город, район или метро" />
        <Button type="submit" aria-label="Найти квартиру" beforeIcon="ActionArrowUpRight16">
          Найти
        </Button>
        <span className={s.mapAction}>
          <Button theme="main_secondary" onClick={() => showDemo('Поиск на карте')}>
            На карте
          </Button>
        </span>
      </form>
      <div className={s.quickSearch}>
        <Link to="/search">Купить квартиру</Link>
        {['Снять надолго', 'Снять посуточно', 'Купить дом', 'Купить участок'].map((label) => (
          <button key={label} onClick={() => showDemo(label)}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SearchFilters({
  params,
  onApply,
}: {
  params: URLSearchParams;
  onApply: (next: URLSearchParams) => void;
}) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const next = new URLSearchParams(params);
    for (const key of ['q', 'rooms', 'maxPrice']) {
      const value = String(form.get(key) || '').trim();
      if (value) next.set(key, value);
      else next.delete(key);
    }
    next.delete('state');
    onApply(next);
  }
  return (
    <form onSubmit={submit} className={s.filters}>
      <Input
        label="Город, район или метро"
        name="q"
        defaultValue={params.get('q') || ''}
        placeholder="Москва"
        leadingIcon="ActionSearch16"
      />
      <Select
        label="Комнатность"
        name="rooms"
        defaultValue={params.get('rooms') || ''}
        options={[
          { value: '', label: 'Любая' },
          { value: '0', label: 'Студия' },
          { value: '1', label: '1 комната' },
          { value: '2', label: '2 комнаты' },
          { value: '3', label: '3 комнаты' },
          { value: '4', label: '4 и больше' },
        ]}
      />
      <Input
        label="Цена до, ₽"
        type="number"
        name="maxPrice"
        min="1"
        step="1"
        defaultValue={params.get('maxPrice') || ''}
        placeholder="Не ограничена"
      />
      <Button type="submit" beforeIcon="ActionSearch16">
        Показать
      </Button>
    </form>
  );
}

export function Sorting({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className={s.sort}>
      <Icon name="Sort" size={18} />
      <label className="sr-only" htmlFor="sort">
        Сортировка
      </label>
      <select id="sort" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="default">По умолчанию</option>
        <option value="price-asc">Сначала дешевле</option>
        <option value="price-desc">Сначала дороже</option>
        <option value="area-desc">Сначала просторнее</option>
      </select>
    </div>
  );
}

export function Gallery({ images, title }: { images: string[]; title: string }) {
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  return (
    <div className={s.gallery}>
      <button
        type="button"
        className={s.galleryMain}
        aria-label="Открыть фотографии"
        onClick={() => setOpen(true)}
      >
        <img src={images[index]} alt={`${title}, фото ${index + 1}`} />
        <span>
          {index + 1} / {images.length}
        </span>
      </button>
      <div className={s.thumbnails}>
        {images.map((src, i) => (
          <button
            key={src}
            type="button"
            aria-label={`Фото ${i + 1}`}
            aria-pressed={index === i}
            onClick={() => setIndex(i)}
          >
            <img src={src} alt="" />
          </button>
        ))}
      </div>
      <Modal
        open={open}
        title={`Фотографии · ${index + 1} из ${images.length}`}
        onClose={() => setOpen(false)}
      >
        <div className="stack">
          <img className={s.largePhoto} src={images[index]} alt={`${title}, фото ${index + 1}`} />
          <div className={s.galleryControls}>
            <Button
              theme="main_secondary"
              aria-label="Предыдущее фото"
              onClick={() => setIndex((index + images.length - 1) % images.length)}
            >
              ← Назад
            </Button>
            <Button
              theme="main_secondary"
              aria-label="Следующее фото"
              onClick={() => setIndex((index + 1) % images.length)}
            >
              Вперёд →
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export function ListingActions({ listing }: { listing: Listing }) {
  const { notify } = usePrototype();
  const [open, setOpen] = useState(false);
  return (
    <section className={s.actionsPanel} aria-label="Стоимость и связь">
      <div className={s.priceRow}>
        <strong>{money(listing.price)}</strong>
        <FavoriteButton listing={listing} />
      </div>
      <p className="muted">{money(Math.round(listing.price / listing.area))}/м²</p>
      <div className={s.facts}>
        <span>Условия сделки</span>
        <span>Свободная продажа</span>
        <span>Ипотека</span>
        <span>Возможна</span>
      </div>
      <Button fullWidth onClick={() => setOpen(true)} beforeIcon="ActionProfile24">
        Связаться с продавцом
      </Button>
      <div className={s.sellerInfo}>
        <span className={s.avatar}>
          <Icon name="PlaceholderUser16" size={24} />
        </span>
        <div>
          <small>ПРОДАВЕЦ</small>
          <strong>{listing.seller}</strong>
          <span>Профиль проверен</span>
        </div>
      </div>
      <Modal open={open} title="Написать продавцу" onClose={() => setOpen(false)}>
        <form
          className="stack"
          onSubmit={(e) => {
            e.preventDefault();
            setOpen(false);
            notify('Сообщение сохранено в прототипе');
          }}
        >
          <p className="muted">Уточните детали квартиры или предложите время просмотра.</p>
          <Input
            label="Ваше имя"
            name="name"
            placeholder="Как к вам обращаться"
            required
            autoFocus
          />
          <label className="stack">
            Сообщение
            <textarea
              className={s.message}
              name="message"
              rows={4}
              defaultValue="Здравствуйте! Когда можно посмотреть квартиру?"
              required
            />
          </label>
          <Button type="submit" fullWidth>
            Отправить сообщение
          </Button>
        </form>
      </Modal>
    </section>
  );
}
