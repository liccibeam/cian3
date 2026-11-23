import type { GoalId } from '@/analytics/goals';

export type MapScreen = { title: string; url: string; goal: GoalId; params: string; note?: string };
export const mapScreens = {
  newcomer: {
    title: 'Главная · новый',
    url: '/?scenario=new',
    goal: 'home_view',
    params: 'home_state=new',
  },
  returning: {
    title: 'Главная · сохранённый поиск',
    url: '/?scenario=returning',
    goal: 'home_view',
    params: 'home_state=saved',
  },
  recent: {
    title: 'Главная · последний поиск',
    url: '/?scenario=recent',
    goal: 'home_view',
    params: 'home_state=recent',
  },
  saved: {
    title: 'Сохранённые поиски',
    url: '/?scenario=returning&panel=saved',
    goal: 'saved_list_view',
    params: 'count=1',
    note: 'Удаление: saved_search_remove. После удаления последнего остаётся недавний поиск.',
  },
  results: {
    title: 'Выдача квартир',
    url: '/search?q=Сокольники&scenario=new',
    goal: 'search_view',
    params: 'status=results',
    note: 'Сохранить: search_save. Сортировка: sort_change. Фильтры: filters_apply.',
  },
  loading: {
    title: 'Выдача · загрузка',
    url: '/search?state=loading&scenario=new',
    goal: 'search_view',
    params: 'status=loading',
    note: 'Промежуточное состояние до results / empty / error, не отдельное действие пользователя.',
  },
  empty: {
    title: 'Выдача · пусто',
    url: '/search?state=empty&scenario=new',
    goal: 'search_view',
    params: 'status=empty',
  },
  error: {
    title: 'Выдача · ошибка',
    url: '/search?q=Сокольники&state=error&scenario=new',
    goal: 'search_view',
    params: 'status=error',
  },
  listing: {
    title: 'Карточка квартиры',
    url: '/listing/1?scenario=new',
    goal: 'listing_view',
    params: 'listing_id=1',
    note: 'Возврат: listing_back(destination=home|search), с восстановлением прокрутки.',
  },
  favorites: {
    title: 'Избранное',
    url: '/search?favorites=1&scenario=favorites',
    goal: 'favorites_view',
    params: 'status=results',
  },
  favoritesEmpty: {
    title: 'Избранное · пусто',
    url: '/search?favorites=1&scenario=new',
    goal: 'favorites_view',
    params: 'status=empty',
  },
  gallery: {
    title: 'Галерея',
    url: '/listing/1?scenario=new&panel=gallery',
    goal: 'gallery_view',
    params: 'screen=gallery',
    note: 'Листать: gallery_change(photo_index). Закрыть: overlay_close.',
  },
  contact: {
    title: 'Связаться с продавцом',
    url: '/listing/1?scenario=new&panel=contact',
    goal: 'contact_view',
    params: 'listing_id=1',
    note: 'Валидация обязательных полей до contact_submit. Имя и текст сообщения в события не передаются.',
  },
  sent: {
    title: 'Подтверждение отправки',
    url: '/listing/1?scenario=new&panel=sent',
    goal: 'contact_success_view',
    params: 'screen=contact_success',
    note: 'Уведомление на карточке. Только локальное сохранение, реального сообщения нет.',
  },
  demo: {
    title: 'Демонстрационное окно',
    url: '/?scenario=new&panel=demo',
    goal: 'demo_view',
    params: 'destination=Посуточная аренда',
    note: 'Общий шаблон для аренды, новостроек, посуточной, коммерческой, рекламы, сообщений и профиля. Отдельных экранов этих разделов нет.',
  },
  notFound: {
    title: 'Неизвестное объявление',
    url: '/listing/unknown?scenario=new',
    goal: 'not_found_view',
    params: 'screen=not_found',
    note: 'Прямой некорректный адрес; не штатный шаг основного пути.',
  },
} satisfies Record<string, MapScreen>;
export type MapScreenId = keyof typeof mapScreens;
export type MapEdge = { goals: GoalId[]; params?: string };
export const mapLanes: {
  title: string;
  subtitle: string;
  screens: MapScreenId[];
  edges: MapEdge[];
  shortcut?: { to: number; goal: GoalId; params: string };
  returns?: { from: number; to: number; goal: GoalId; params?: string }[];
}[] = [
  {
    title: '01 · Найти квартиру и связаться',
    subtitle: 'Основной путь нового пользователя. Цель последнего шага — локальная отправка формы.',
    screens: ['newcomer', 'results', 'listing', 'contact', 'sent'],
    edges: [
      { goals: ['search_submit'] },
      { goals: ['listing_open'], params: 'source=search' },
      { goals: ['contact_open'] },
      { goals: ['contact_submit'] },
    ],
    shortcut: { to: 2, goal: 'listing_open', params: 'source=recommendations' },
    returns: [
      { from: 2, to: 1, goal: 'listing_back', params: 'destination=search' },
      { from: 3, to: 2, goal: 'overlay_close', params: 'форма → карточка' },
    ],
  },
  {
    title: '02 · Продолжить сохранённый поиск',
    subtitle:
      'Вход из блока продолжения или через список. Галерея закрывается обратно на карточку.',
    screens: ['returning', 'saved', 'results', 'listing', 'gallery'],
    edges: [
      { goals: ['saved_list_open'] },
      { goals: ['saved_search_open'] },
      { goals: ['listing_open'] },
      { goals: ['gallery_open'] },
    ],
    shortcut: { to: 2, goal: 'search_resume', params: 'source=saved' },
    returns: [
      { from: 1, to: 0, goal: 'overlay_close', params: 'список → главная' },
      { from: 4, to: 3, goal: 'overlay_close', params: 'галерея → карточка' },
    ],
  },
  {
    title: '03 · Вернуться к последнему поиску и отложить квартиру',
    subtitle: 'Переход в избранное выполняется отдельно от нажатия на сердечко.',
    screens: ['recent', 'results', 'listing', 'favorites', 'favoritesEmpty'],
    edges: [
      { goals: ['search_resume'], params: 'source=recent' },
      { goals: ['listing_open'] },
      { goals: ['favorite_toggle', 'navigation_open'], params: 'add → favorites' },
      { goals: ['favorite_toggle'], params: 'action=remove' },
    ],
  },
  {
    title: '04 · Альтернативные состояния выдачи',
    subtitle:
      'После загрузки возможны также results и empty. Здесь показан путь через ошибку и восстановление.',
    screens: ['loading', 'error', 'results', 'empty', 'results'],
    edges: [
      { goals: ['search_view'], params: 'status=error · автоматически' },
      { goals: ['search_retry'] },
      { goals: ['filters_apply'], params: 'нет совпадений' },
      { goals: ['filters_reset'] },
    ],
  },
  {
    title: '05 · Боковые ветки и выходы',
    subtitle:
      'Демо закрывается кнопкой или Escape. Неизвестный адрес доступен только по прямой ссылке.',
    screens: ['newcomer', 'demo', 'notFound'],
    edges: [{ goals: ['vertical_open', 'demo_open'], params: 'или реклама / сообщения / профиль' }],
    returns: [
      { from: 1, to: 0, goal: 'overlay_close' },
      { from: 2, to: 0, goal: 'navigation_open', params: 'destination=home' },
    ],
  },
];
