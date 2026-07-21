# Module 5 · Теория: nested routes

Этот материал закрывает восьмой теоретический пункт `Module 5`: понять, **зачем `children`**, **как работает вложенный `RouterView`**, **как сделать default child**, и **когда nesting нужен, а когда нет**.

Связанные материалы:

- [Module 5 · RouterView](./04-router-view.md)
- [Module 5 · динамические маршруты](./07-dynamic-routes.md)
- [Module 5 · RouterLink](./03-router-link.md)

---

## 1. Зачем nested routes

Иногда URL и UI вложены одинаково:

```text
/user/ann/profile     → UserLayout + Profile
/user/ann/posts       → UserLayout + Posts
```

Layout (sidebar, заголовок user) **остаётся**, меняется только внутренняя часть.

```text
┌─────────────────────────┐
│ UserLayout              │
│  ┌───────────────────┐  │
│  │ child page        │  │
│  └───────────────────┘  │
└─────────────────────────┘
```

Это и есть nested routes: parent route + `children` + второй `RouterView`.

Официально:

- [Nested Routes · Vue Router](https://router.vuejs.org/guide/essentials/nested-routes.html)

---

## 2. Parent + children

```ts
const routes = [
  {
    path: '/user/:id',
    component: () => import('@/layouts/UserLayout.vue'),
    children: [
      {
        path: '',
        name: 'user',
        component: () => import('@/pages/user/UserHomePage.vue'),
      },
      {
        path: 'profile',
        name: 'user-profile',
        component: () => import('@/pages/user/UserProfilePage.vue'),
      },
      {
        path: 'posts',
        name: 'user-posts',
        component: () => import('@/pages/user/UserPostsPage.vue'),
      },
    ],
  },
]
```

| URL | Parent | Nested outlet |
|-----|--------|---------------|
| `/user/ann` | `UserLayout` | `UserHomePage` |
| `/user/ann/profile` | `UserLayout` | `UserProfilePage` |
| `/user/ann/posts` | `UserLayout` | `UserPostsPage` |

---

## 3. Вложенный `RouterView`

```vue
<!-- UserLayout.vue -->
<script setup lang="ts">
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()
const userId = computed(() => String(route.params.id))
</script>

<template>
  <div class="user-layout">
    <header>
      <h1>User {{ userId }}</h1>
      <nav>
        <RouterLink :to="{ name: 'user', params: { id: userId } }">
          Overview
        </RouterLink>
        <RouterLink :to="{ name: 'user-profile', params: { id: userId } }">
          Profile
        </RouterLink>
        <RouterLink :to="{ name: 'user-posts', params: { id: userId } }">
          Posts
        </RouterLink>
      </nav>
    </header>

    <RouterView />
  </div>
</template>
```

Цепочка outlets:

```text
App.vue <RouterView />
  └── UserLayout
        └── <RouterView />  ← child page
```

Parent **обязан** иметь свой `RouterView`, иначе children негде показать.

---

## 4. Relative vs absolute child `path`

### Relative (обычно так)

```ts
path: 'profile'  // → /user/:id/profile
```

Склеивается с parent path.

### Absolute (начинается с `/`)

```ts
path: '/profile'  // → /profile  (корень сайта!)
```

Component nesting без вложенного URL. Нужно редко и осознанно.

Для Module 5 бери **relative** children.

---

## 5. Default child: `path: ''`

Без пустого child:

```text
/user/ann  → UserLayout, а nested outlet пустой
```

С default:

```ts
{ path: '', name: 'user', component: UserHomePage }
```

```text
/user/ann  → UserLayout + UserHomePage
```

Именование: чаще дают `name` **child**, а не parent — тогда `push({ name: 'user' })` сразу заполняет outlet.

---

## 6. Layout routes для app sections

Типичный dashboard:

```ts
{
  path: '/dashboard',
  component: () => import('@/layouts/DashboardLayout.vue'),
  children: [
    {
      path: '',
      name: 'dashboard',
      component: () => import('@/pages/dashboard/OverviewPage.vue'),
    },
    {
      path: 'orders',
      name: 'dashboard-orders',
      component: () => import('@/pages/dashboard/OrdersPage.vue'),
    },
    {
      path: 'settings',
      name: 'dashboard-settings',
      component: () => import('@/pages/dashboard/SettingsPage.vue'),
    },
  ],
}
```

```vue
<!-- DashboardLayout.vue -->
<template>
  <div class="dashboard">
    <aside class="dashboard__nav">…</aside>
    <main class="dashboard__main">
      <RouterView />
    </main>
  </div>
</template>
```

`App.vue` по-прежнему держит global shell (logo / top nav).
Section layout — через nested parent.

---

## 7. Product details с вкладками (опциональный scenario)

```ts
{
  path: '/products/:id',
  component: () => import('@/layouts/ProductLayout.vue'),
  children: [
    {
      path: '',
      name: 'product-details',
      component: () => import('@/pages/product/ProductOverviewPage.vue'),
    },
    {
      path: 'reviews',
      name: 'product-reviews',
      component: () => import('@/pages/product/ProductReviewsPage.vue'),
    },
    {
      path: 'specs',
      name: 'product-specs',
      component: () => import('@/pages/product/ProductSpecsPage.vue'),
    },
  ],
}
```

URL:

```text
/products/42
/products/42/reviews
/products/42/specs
```

Альтернатива без nesting: один page + `?tab=reviews`.
Nesting лучше, когда вкладки — отдельные экраны/data/lazy chunks.

Для минимального Module 5 catalog **не обязательно** — достаточно flat `/products/:id`.

---

## 8. Parent без `component` (Vue Router 4.1+)

Иногда children группируют path/meta/guards **без** layout component:

```ts
{
  path: '/admin',
  meta: { requiresAuth: true },
  children: [
    { path: '', name: 'admin', component: AdminOverview },
    { path: 'users', name: 'admin-users', component: AdminUsers },
  ],
}
```

Top-level `RouterView` сразу рендерит matched child.
Полезно для shared `meta` — пригодится вместе с guards.

---

## 9. Когда nesting НЕ нужен

Для простого catalog:

```text
/                HomePage
/catalog         CatalogPage
/products/:id    ProductDetailsPage
/about           AboutPage
```

Одного `RouterView` в `App.vue` достаточно.

Добавляй nested routes, когда:

- есть устойчивый section layout (sidebar)
- несколько sub-pages делят chrome
- URL естественно вложен (`/dashboard/...`)

Не добавляй nesting «на будущее» без UI-нужды.

---

## 10. Связь с flat app shell

```text
App.vue
  header / global nav
  <RouterView />          ← top-level: Home | Catalog | DashboardLayout | …
       └── DashboardLayout
             sidebar
             <RouterView />  ← nested: Overview | Orders | Settings
```

Два уровня — нормальная практика.
Глубже 2–3 nested outlets обычно уже запах сложности.

---

## 11. Частые ошибки

### Parent без `<RouterView />`

Children matched, UI пустой.

### Забыли `path: ''`

`/parent` открывается «дырявым» layout без default content.

### Child path с ведущим `/` случайно

Получаешь root URL вместо nested.

### Дали `name` только parent

`push({ name: 'parent' })` может не заполнить nested outlet как ожидаешь — именуй default child.

### Nesting ради nesting

Усложняет router без выигрыша в UI.

### Путать layout component и page

Layout = chrome + outlet.
Page = содержимое child route.

---

## 12. Что важно понять после этого блока

Проверь себя:

1. Что такое `children` у route?
2. Зачем второй `RouterView`?
3. Что делает child с `path: ''`?
4. Чем relative `profile` отличается от `/profile`?
5. Когда nested routes оправданы для catalog/dashboard?
6. Что даёт parent без `component`?

---

## 13. Что почитать

### Официальное

- [Nested Routes](https://router.vuejs.org/guide/essentials/nested-routes.html)
- [Named Views](https://router.vuejs.org/guide/essentials/named-views.html) *(альтернатива для нескольких outlets)*

### Связанные материалы этого плана

- [Module 5 · RouterView](./04-router-view.md)
- [Module 5 · динамические маршруты](./07-dynamic-routes.md)

---

## 14. Практическое мини-задание

Выбери один вариант:

**A. Минимальный catalog (можно skip nesting)**  
Оставь flat routes — зафиксируй в заметках, почему nesting не нужен.

**B. Dashboard / settings**  
1. Сделай `DashboardLayout` с sidebar + `<RouterView />`  
2. Добавь children: `''`, `orders`, `settings`  
3. Навигируй через named child routes  

**C. Product tabs**  
1. Parent `/products/:id` + children overview/reviews  
2. Проверь, что `:id` доступен и в layout, и в child

---

## 15. Мини-конспект

- nested routes = parent layout + `children` + nested `RouterView`
- child `path` обычно relative; `''` = default screen
- именуй child routes для предсказуемого `push`
- для простого list/detail nesting не обязателен
- section layouts (dashboard) — главный use case

---

## 16. Что делать дальше

Следующий теоретический блок Module 5:

- **redirects**

Разберём `redirect` / `alias`, стартовые переходы и «старый URL → новый».
