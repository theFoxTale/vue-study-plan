# Module 14 · Теория: файловый роутинг

Этот материал закрывает третий теоретический пункт Module 14: **файловый роутинг Nuxt** — как `pages/` превращается в routes, динамические сегменты, nested routes, `definePageMeta`, отличие от ручного Vue Router из Module 5.

Связанные материалы:

- [Module 14 · зачем Nuxt](./02-why-nuxt.md)
- [Module 5 · Vue Router 4](../module-5/01-vue-router-4.md)
- [Module 5 · dynamic routes](../module-5/07-dynamic-routes.md)

---

## 1. Идея: файл = маршрут

В Vue + Vite (Module 5) ты писал:

```ts
{ path: '/products/:id', component: () => import('…') }
```

В Nuxt:

```text
pages/products/[id].vue  →  /products/:id
```

Nuxt **сканирует** `pages/` и генерирует Vue Router config. Меньше boilerplate; соглашения важнее ручных `routes[]`.

Официально:

- [Nuxt · pages/](https://nuxt.com/docs/guide/directory-structure/pages)
- [Nuxt · Routing](https://nuxt.com/docs/getting-started/routing)

---

## 2. Базовые правила имён

| Файл | URL |
|------|-----|
| `pages/index.vue` | `/` |
| `pages/about.vue` | `/about` |
| `pages/products/index.vue` | `/products` |
| `pages/products/[id].vue` | `/products/:id` |
| `pages/products/[id]/index.vue` | `/products/:id` *(альтернатива)* |
| `pages/blog/[...slug].vue` | `/blog/*` catch-all |

```text
index.vue     = «корень этой папки»
[param].vue   = динамический сегмент
[...slug].vue = rest / catch-all
[[id]].vue    = optional param (Nuxt)
```

PascalCase / kebab в имени файла обычно приводят к kebab URL — лучше **kebab-case** имён: `product-details` → предсказуемее.

---

## 3. Минимальный page

```vue
<!-- pages/index.vue -->
<script setup lang="ts">
useHead({ title: 'Home' })
</script>

<template>
  <h1>Product Catalog</h1>
  <NuxtLink to="/products">Browse</NuxtLink>
</template>
```

```vue
<!-- pages/products/[id].vue -->
<script setup lang="ts">
const route = useRoute()
const id = route.params.id as string
</script>

<template>
  <p>Product {{ id }}</p>
</template>
```

`useRoute` / `useRouter` / `NuxtLink` — Nuxt auto-imports (или явный import — тоже ок).

---

## 4. Nested routes и parent page

Как Module 5 nested routes: parent с `<NuxtPage />` (аналог `<RouterView>`).

```text
pages/
  products/
    index.vue          → /products
    [id].vue           → /products/:id
```

Для **layout внутри секции** с общим chrome:

```text
pages/
  account.vue              → /account + child outlet
  account/
    index.vue              → /account
    settings.vue           → /account/settings
    orders.vue             → /account/orders
```

```vue
<!-- pages/account.vue -->
<template>
  <div>
    <AccountNav />
    <NuxtPage />
  </div>
</template>
```

```text
Parent file `account.vue` + folder `account/` = nested structure
```

Путать с **layouts/** (app-wide chrome) — layouts в [уроке 04](./04-layouts.md); nested pages — локальная вложенность URL.

---

## 5. `NuxtLink` vs `<a>`

```vue
<NuxtLink to="/products">Products</NuxtLink>
<NuxtLink :to="{ name: 'products-id', params: { id } }">
  Details
</NuxtLink>
```

```text
NuxtLink = client navigation (SPA transition) + prefetch hints
<a href>  = full document navigation (иногда нужно)
```

Имена route Nuxt генерирует из пути (`products-id` для `products/[id].vue`). Смотри Nuxt DevTools → Pages / `.nuxt/types` для точных `name`.

---

## 6. `definePageMeta` — метаданные маршрута

```vue
<script setup lang="ts">
definePageMeta({
  layout: 'account',      // какой layout
  middleware: 'auth',     // route middleware
  ssr: false,             // CSR only для этой page
  title: 'Cart',          // иногда через meta + useHead
})
</script>
```

Частые поля:

| Meta | Зачем |
|------|--------|
| `layout` | выбрать layout ([урок 04](./04-layouts.md)) |
| `middleware` | auth guard и т.п. |
| `ssr: false` | отключить SSR на page |
| `alias` | дополнительные пути |
| `keepalive` | KeepAlive для page |

```text
definePageMeta компилируется на build —
нельзя вычислять meta из runtime API произвольно как обычный код
(ограничения: см. docs)
```

---

## 7. Динамика и валидация params

```vue
<!-- pages/products/[id].vue -->
<script setup lang="ts">
definePageMeta({
  validate(route) {
    return /^\d+$/.test(route.params.id as string)
  },
})
</script>
```

`validate` → `false` даёт **404** вместо битой страницы.

Typed params — через поддержку Nuxt typed router / modules; на старте `as string` достаточно.

---

## 8. Catch-all и 404

```vue
<!-- pages/[...slug].vue — осторожно: ловит много URL -->
```

Лучше явный:

```vue
<!-- pages/404.vue или error.vue на уровне app -->
```

Nuxt: `error.vue` в корне проекта для error page; `pages` catch-all — только если нужен CMS-like `/**`.

---

## 9. Группы маршрутов `(group)` *(Nuxt 3)*

Иногда используют папки только для организации **без** сегмента URL (зависит от версии/доков — проверь актуальную Directory Structure).

```text
Цель: логическая группировка файлов ≠ всегда новый path segment
```

Для MVP storefront достаточно классических `products/[id].vue` без экзотики.

---

## 10. Связь с Module 5 (mental map)

| Vue Router | Nuxt |
|------------|------|
| `routes: [...]` | `pages/**` |
| `RouterView` | `NuxtPage` |
| `RouterLink` | `NuxtLink` |
| `useRoute` | `useRoute` |
| `meta: { requiresAuth }` | `definePageMeta` + middleware |
| lazy `() => import` | pages lazy by default |

Ручной `router.options.ts` / `pages:extend` hook — когда соглашения не хватает (редко на старте).

---

## 11. Catalog / storefront map

```text
pages/
  index.vue                 → landing (SSG candidate)
  products/
    index.vue               → catalog list
    [id].vue                → product detail (SEO)
  cart.vue                  → cart (часто ssr: false)
  account.vue + account/    → nested account
  blog/
    [slug].vue              → SSG content
```

Тонкие pages (Module 13): page = routing + composition; тяжёлая логика → components/composables/features.

---

## 12. Отладка routes

```bash
npx nuxi info
# DevTools → Pages
# .nuxt/types/nitro* / router types после dev
```

```text
Страница не находится?
1. файл точно в pages/?
2. имя [id].vue не [Id].vue с опечаткой
3. parent без <NuxtPage /> для children
4. middleware редиректит
```

---

## 13. Частые ошибки

### `pages` + ручной дублирующий `createRouter`

Конфликт mental model — в Nuxt обычно **не** создаёшь router с нуля.

### God `pages/products/[id].vue` на 800 строк

File routing ≠ разрешение класть весь feature в page.

### Забыть `<NuxtPage />` в parent

Children не рендерятся.

### `<a href="/products">` везде

Теряешь client navigation / prefetch.

### Optional catch-all без нужды

Ломает приоритет других routes / неожиданные match.

### Путать `layouts/` и nested `pages/`

Layout — chrome app; nested page — вложенный URL segment.

---

## 14. Что важно понять после этого блока

Проверь себя:

1. Как получить `/products/:id` из файлов?
2. Чем `NuxtPage` отличается от обычного div?
3. Зачем `definePageMeta`?
4. Nested account: какие файлы нужны?
5. Когда `validate` на page?
6. Соответствие Module 5 `RouterLink` → ?

---

## 15. Что почитать

### Официальное

- [Routing · Getting Started](https://nuxt.com/docs/getting-started/routing)
- [pages directory](https://nuxt.com/docs/guide/directory-structure/pages)
- [definePageMeta](https://nuxt.com/docs/api/utils/define-page-meta)

### Связанные материалы этого плана

- [Module 5 · nested routes](../module-5/08-nested-routes.md)
- [Module 5 · dynamic routes](../module-5/07-dynamic-routes.md)
- [Module 14 · layouts](./04-layouts.md)

---

## 16. Практическое мини-задание

1. В Nuxt app создай `pages/products/index.vue` и `pages/products/[id].vue`.
2. Список ссылок `NuxtLink` с `params.id`.
3. Nested `account` + `<NuxtPage />` + child `settings`.
4. `definePageMeta({ ssr: false })` на cart — проверь поведение.
5. `validate` для id только digits → 404 на `/products/abc`.

---

## 17. Мини-конспект

- **файл в `pages/` = route**
- `[param]`, `index`, nested folder + parent + `NuxtPage`
- `NuxtLink` / `useRoute` / `definePageMeta`
- те же идеи, что Vue Router, другой способ задать routes
- pages тонкие; features/components — толстые
- дальше — **layouts**

---

## 18. Что делать дальше

Следующий теоретический блок Module 14:

- [Layouts](./04-layouts.md)
