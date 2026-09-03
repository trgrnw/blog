# Thugger Blog

React-блог с публичной лентой и закрытым редактором публикаций на Supabase.

## Запуск

```bash
npm install
cp .env.example .env
npm run dev
```

Заполните в `.env` адрес проекта и публичный `anon key` из Supabase. Затем откройте SQL Editor, выполните `supabase/schema.sql`, создайте пользователя в Authentication → Users и добавьте его в `admin_users` последней SQL-командой из файла.

Админка: `/blog/admin`. Публичный блог: `/blog/`.

## Размещение в `thugger.ru/blog`

```bash
npm run build
```

Загрузите **содержимое** папки `dist` в папку `blog` на хостинге. Vite уже настроен с `base: '/blog/'`. Для Apache добавьте перенаправление всех неизвестных `/blog/*` маршрутов на `/blog/index.html`; файл `public/_redirects` подходит для Netlify-подобных хостингов.

Никогда не добавляйте `service_role key` во frontend или `.env`. Проект использует только публичный `anon key`, а права защищаются RLS-политиками Supabase.
