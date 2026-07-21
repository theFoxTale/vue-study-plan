# Module 5 · Теория: создание router instance

Этот материал закрывает второй теоретический пункт `Module 5`: понять, **как создать router**, **как описать `routes`**, **как выбрать history mode** и **как подключить router к Vue app**.

Связанные материалы:

- [Module 5 · Vue Router 4](./01-vue-router-4.md)
- [Module 4 · types in store & router](../module-4/07-types-in-store-and-router.md)

---

## 1. Что такое router instance

**Router instance** — объект, который:

- знает список routes
- следит за URL
- решает, какой page component показать
- умеет делать navigation (`push`, `replace`, `back`)

Создаётся через:

```ts
import { createRouter, createWebHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    // ...
  ],
})
```

Официально:

- [Getting Started · Vue Router](https://router.vuejs.org/guide/)
- [API: createRouter](https://router.vuejs.org/api/interfaces/RouterOptions.html)

---

## 2. Минимальный рабочий setup

### 1) Установка

```bash
npm install vue-router@4
```

Если проект создан через `create-vue` с Router — пакет уже есть.

### 2) Файл router

```ts
// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '@/pages/HomePage.vue'
import CatalogPage from '@/pages/CatalogPage.vue'
import AboutPage from '@/pages/AboutPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage,
    },
    {
      path: '/catalog',
      name: 'catalog',
      component: CatalogPage,
    },
    {
      path: '/about',
      name: 'about',
      component: AboutPage,
    },
  ],
})

export default router
```

### 3) Подключение в `main.ts`

```ts
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(router)
app.mount('#app')
```

Порядок важен: `use(router)` **до** `mount()`.

### 4) Outlet в `App.vue`

```vue
<template>
  <div class="app">
    <nav>
      <!-- RouterLink разберём отдельно -->
      <a href="/">Home</a>
    </nav>

    <RouterView />
  </div>
</template>
```

Без `RouterView` router некуда рендерить page components.

---

## 3. Опции `createRouter`

Минимально нужные:

| Option | Зачем |
|--------|------|
| `history` | режим URL |
| `routes` | карта path → component |

Часто полезные:

| Option | Зачем |
|--------|------|
| `scrollBehavior` | куда скроллить после navigation |
| `linkActiveClass` | CSS class для active link |

Пример scroll:

```ts
const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})
```

---

## 4. History: что выбрать

### Recommended: `createWebHistory()`

```ts
history: createWebHistory()
```

URL:

```text
/catalog
/products/42
```

Нужен server fallback на `index.html` при прямом заходе на deep link.

Для Vite:

```ts
createWebHistory(import.meta.env.BASE_URL)
```

`BASE_URL` важен, если app деплоится не в корень (`/my-app/`).

### `createWebHashHistory()`

```ts
history: createWebHashHistory()
```

URL:

```text
/#/catalog
/#/products/42
```

Проще на статическом hosting без rewrite, но URL хуже для UX/SEO.

### Для Module 5 practice

```text
createWebHistory(import.meta.env.BASE_URL)
```

---

## 5. Структура `routes`

Базовый route record:

```ts
{
  path: '/catalog',
  name: 'catalog',
  component: CatalogPage,
}
```

### `path`

URL pattern.

### `name`

Стабильное имя для `router.push({ name: 'catalog' })`.
Лучше опираться на `name`, а не только на raw path strings.

### `component`

Page component, который попадёт в `RouterView`.

Позже:

```ts
component: () => import('@/pages/CatalogPage.vue') // lazy
```

Пока можно import напрямую. Lazy loading — отдельный урок.

---

## 6. Рекомендуемая файловая структура

```text
src/
  pages/
    HomePage.vue
    CatalogPage.vue
    ProductDetailsPage.vue
    AboutPage.vue
    NotFoundPage.vue
  router/
    index.ts
  App.vue
  main.ts
```

Иногда используют `views/` вместо `pages/` — это тот же смысл.
В этом плане предпочитаем `pages/`.

---

## 7. Пример routes для catalog app

```ts
import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '@/pages/HomePage.vue'
import CatalogPage from '@/pages/CatalogPage.vue'
import AboutPage from '@/pages/AboutPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage,
    },
    {
      path: '/catalog',
      name: 'catalog',
      component: CatalogPage,
    },
    {
      path: '/products/:id',
      name: 'product-details',
      component: () => import('@/pages/ProductDetailsPage.vue'),
    },
    {
      path: '/about',
      name: 'about',
      component: AboutPage,
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/pages/NotFoundPage.vue'),
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
```

`:id` и catch-all подробно будут в уроках про dynamic routes / redirects.
Здесь важно увидеть **цельный router file**.

---

## 8. Что делает `app.use(router)`

Плагин router:

1. регистрирует `RouterView` и `RouterLink` глобально
2. добавляет `$router` / `$route`
3. включает `useRouter()` / `useRoute()`
4. запускает initial route resolution

Поэтому после `use(router)` можно писать:

```vue
<RouterView />
<RouterLink to="/catalog">Catalog</RouterLink>
```

без локального import *(хотя import тоже допустим)*.

---

## 9. `App.vue` после подключения router

```vue
<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="app">
    <header class="app__header">
      <strong>Product Catalog</strong>
      <nav>
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/catalog">Catalog</RouterLink>
        <RouterLink to="/about">About</RouterLink>
      </nav>
    </header>

    <main class="app__main">
      <RouterView />
    </main>
  </div>
</template>
```

`App.vue` = layout shell.
Pages меняются внутри `RouterView`.

---

## 10. Перенос логики из одного экрана в pages

Если раньше всё было в `App.vue`:

1. вынеси catalog UI в `CatalogPage.vue`
2. оставь в `App.vue` только header/nav + `RouterView`
3. home/about сделай простыми pages

Это первый практический refactor Module 5.

---

## 11. Частые ошибки

### Забыли `app.use(router)`

`useRouter()` / `RouterView` не работают как надо.

### `mount()` до `use(router)`

```ts
app.mount('#app')
app.use(router) // ❌ поздно
```

### Нет `RouterView`

Routes есть, UI не меняется.

### Неправильный `BASE_URL`

Deep links ломаются при deploy в subfolder.

### Все pages импортированы eagerly без нужды

Для старта ок. Потом тяжёлые pages лучше lazy.

### Route без `name`

Жить можно, но programmatic navigation становится хрупче.

---

## 12. Проверка, что setup работает

1. `npm run dev`
2. Открой `/`
3. Вручную зайди на `/catalog`
4. Убедись, что page меняется без full reload
5. Обнови страницу на `/catalog` — при `createWebHistory` должно открыться снова *(на Vite dev server это ок)*

---

## 13. Что важно понять после этого блока

Проверь себя:

1. Что возвращает `createRouter()`?
2. Зачем `history` и `routes`?
3. Почему `app.use(router)` нужен до `mount()`?
4. Что будет, если забыть `RouterView`?
5. Зачем `import.meta.env.BASE_URL`?
6. Какую структуру files использовать для pages/router?

---

## 14. Что почитать

### Официальное

- [Getting Started · Vue Router](https://router.vuejs.org/guide/)
- [History Modes · Vue Router](https://router.vuejs.org/guide/essentials/history-mode.html)
- [createRouter API](https://router.vuejs.org/api/functions/createRouter.html)

### Связанные материалы этого плана

- [Module 5 · Vue Router 4](./01-vue-router-4.md)

---

## 15. Практическое мини-задание

1. Установи/проверь `vue-router@4`
2. Создай `src/router/index.ts`
3. Добавь минимум 3 routes: `home`, `catalog`, `about`
4. Подключи router в `main.ts`
5. Положи `<RouterView />` в `App.vue`
6. Вынеси текущий catalog UI в `CatalogPage.vue`

---

## 16. Мини-конспект

- router instance создаётся через `createRouter({ history, routes })`
- для Vite SPA бери `createWebHistory(import.meta.env.BASE_URL)`
- подключение: `app.use(router)` до `mount()`
- `RouterView` — место рендера pages
- routes лучше держать в `src/router/index.ts`
- pages живут отдельно от reusable components

---

## 17. Что делать дальше

Следующий теоретический блок Module 5:

- [`RouterLink`](./03-router-link.md)
