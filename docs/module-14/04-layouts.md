# Module 14 · Теория: layouts

Этот материал закрывает четвёртый теоретический пункт Module 14: **layouts в Nuxt** — `layouts/`, `<NuxtLayout>`, `definePageMeta({ layout })`, default vs named layouts, вложенность с pages, и чем layout отличается от nested routes.

Связанные материалы:

- [Module 14 · файловый роутинг](./03-file-routing.md)
- [Module 10 · Teleport / UI chrome](../module-10/01-teleport.md)

---

## 1. Зачем layouts

```text
Повторять header/footer в каждом pages/*.vue — плохо
App.vue с одним chrome на все URL — inflexible (admin ≠ marketing)
```

**Layout** — обёртка страницы: общий chrome (nav, footer, sidebar), внутри — **slot для page**.

```text
Layout (default)
  ├─ Header
  ├─ <slot />  ← сюда рендерится pages/…
  └─ Footer
```

Официально:

- [Nuxt · layouts/](https://nuxt.com/docs/guide/directory-structure/layouts)
- [Nuxt · Layouts](https://nuxt.com/docs/guide/directory-structure/app#layouts)

---

## 2. `app.vue` + `NuxtLayout` + `NuxtPage`

Типичный корень:

```vue
<!-- app.vue -->
<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
```

```text
NuxtLayout  → выбирает layout по meta страницы
NuxtPage    → текущий page component (как RouterView)
```

Без `layouts/` Nuxt использует неявный пустой default. Как только появляется `layouts/default.vue` — он подхватывается.

---

## 3. Default layout

```vue
<!-- layouts/default.vue -->
<script setup lang="ts">
const cartCount = /* store or composable */
</script>

<template>
  <div class="app-shell">
    <header>
      <NuxtLink to="/">Catalog</NuxtLink>
      <NuxtLink to="/cart">Cart ({{ cartCount }})</NuxtLink>
    </header>

    <main>
      <slot />
    </main>

    <footer>© Product Catalog</footer>
  </div>
</template>
```

```text
pages/index.vue
pages/products/[id].vue
→ автоматически в default layout (если не указано иное)
```

`<slot />` — обязательная точка для содержимого page.

---

## 4. Named layouts

```text
layouts/
  default.vue
  account.vue
  blank.vue      # login / minimal
  admin.vue
```

```vue
<!-- layouts/blank.vue -->
<template>
  <div class="blank">
    <slot />
  </div>
</template>
```

```vue
<!-- pages/login.vue -->
<script setup lang="ts">
definePageMeta({
  layout: 'blank',
})
</script>

<template>
  <LoginForm />
</template>
```

```vue
<!-- pages/account/settings.vue -->
<script setup lang="ts">
definePageMeta({
  layout: 'account',
})
</script>
```

Имя файла `account.vue` → meta `layout: 'account'` (без `.vue`, без слова layout).

---

## 5. Отключить layout

```vue
<script setup lang="ts">
definePageMeta({
  layout: false,
})
</script>
```

Полезно для: fullscreen editor, special landing, error-like pages.

Или пустой `blank` layout — читаемее, чем `false`, если всё же нужен минимальный wrapper.

---

## 6. Смена layout при навигации

Nuxt **переключает** layout при переходе между pages с разным `layout` meta.

```text
/products     → default
/login        → blank
/account/***  → account
```

Layout может **перемонтироваться** — не храни уникальный эфемерный state только в layout, если он должен пережить смену layout (лучше Pinia / cookie).

Keyed layout / `NuxtLayout :name` — advanced; для MVP хватает meta.

---

## 7. Layout vs nested pages

| | Layout | Nested `pages/account.vue` |
|---|--------|----------------------------|
| Назначение | chrome app / секции | URL hierarchy + local nav |
| URL | не добавляет segment | parent path + children |
| Выбор | `definePageMeta` | структура файлов |
| Outlet | `<slot />` | `<NuxtPage />` |

Часто **вместе**:

```text
layout: account     → sidebar shell
pages/account/*.vue → settings, orders внутри <NuxtPage />
```

```vue
<!-- layouts/account.vue -->
<template>
  <div class="account-shell">
    <AccountSidebar />
    <div class="account-content">
      <slot />  <!-- page: account.vue OR child already composed -->
    </div>
  </div>
</template>
```

Для nested: parent `pages/account.vue` содержит `<NuxtPage />`, и **этот parent** рендерится в slot layout.

```text
Layout slot
  └─ pages/account.vue (nav + NuxtPage)
        └─ pages/account/settings.vue
```

---

## 8. Что класть в layout (и что нет)

| ✅ В layout | ❌ В layout |
|------------|------------|
| Header, footer, sidebar shell | Product fetch / catalog filters |
| Cart badge (read store) | God business logic |
| Skip links / a11y landmarks | Page-specific forms |
| Theme provider wrapper | Уникальный SEO текст страницы |

SEO title/description — обычно **page** (`useHead` / `useSeoMeta`), не один title на весь layout.

Толстая логика — composables/features (Module 13); layout тонкий.

---

## 9. Storefront: набор layouts

```text
layouts/default.vue   — storefront: header + footer
layouts/blank.vue     — login, register, password reset
layouts/account.vue   — sidebar + account pages
layouts/checkout.vue  — minimal chrome, focus on funnel (optional)
```

```text
pages/index.vue              → default
pages/products/[id].vue      → default
pages/cart.vue               → default или checkout
pages/login.vue              → blank
pages/account/**             → account
```

---

## 10. Стили и layout

```vue
<!-- layouts/default.vue -->
<template>
  <div class="layout-default">
    <slot />
  </div>
</template>

<style scoped>
.layout-default { min-height: 100dvh; display: flex; flex-direction: column; }
.layout-default main { flex: 1; }
</style>
```

Глобальные токены — `assets/css` / `nuxt.config` css; layout задаёт **структуру**, не всю дизайн-систему.

---

## 11. Custom layout name в runtime *(редко)*

```vue
<!-- app.vue -->
<template>
  <NuxtLayout :name="layoutName">
    <NuxtPage />
  </NuxtLayout>
</template>
```

Обычно **не нужно** — `definePageMeta` достаточно. Динамическое имя — edge cases (A/B chrome).

---

## 12. Связь с `error.vue`

`error.vue` в корне проекта — отдельная error page; может использовать layout или быть standalone.

Не путай: layout error state vs Nuxt error boundary page.

---

## 13. Частые ошибки

### Забыть `<slot />`

Page не появляется — «пустой layout».

### Весь сайт в `app.vue` без layouts

Потом сложно сделать blank login.

### Путать layout и component

`components/AppHeader.vue` — кусок; `layouts/default.vue` — **выбираемая** обёртка page.

### Тяжёлый fetch в layout

Каждая смена page в том же layout не всегда remount — но layout fetch на все pages секции = лишняя связность. Данные page — в page/`useAsyncData`.

### `layout: 'Default'` с большой буквы

Имя = имя файла: `default`, не `Default` (зависит от резолва — придерживайся lowercase имени файла).

### Nested без понимания slot vs NuxtPage

Два уровня outlets — нарисуй дерево (layout → page → child).

---

## 14. Что важно понять после этого блока

Проверь себя:

1. Цепочка `app.vue` → `NuxtLayout` → `NuxtPage`?
2. Как page выбирает `blank` layout?
3. Чем layout отличается от nested `account.vue`?
4. Что обязательно внутри layout template?
5. Какие layouts нужны storefront?
6. Почему SEO title не только в default layout?

---

## 15. Что почитать

### Официальное

- [layouts directory](https://nuxt.com/docs/guide/directory-structure/layouts)
- [definePageMeta · layout](https://nuxt.com/docs/api/utils/define-page-meta)

### Связанные материалы этого плана

- [Module 14 · file routing](./03-file-routing.md)
- [Module 13 · pages тонкие](../module-13/03-shared-ui-entities-features-pages.md)

---

## 16. Практическое мини-задание

1. Создай `layouts/default.vue` с header + `<slot />` + footer.
2. `layouts/blank.vue` + `pages/login.vue` с `layout: 'blank'`.
3. `layouts/account.vue` + account pages.
4. Одна page с `layout: false` — когда уместно?
5. Нарисуй дерево outlets для `/account/settings`.

---

## 17. Мини-конспект

- **layout** = chrome вокруг page через `<slot />`
- `layouts/default.vue` + named layouts через `definePageMeta`
- `app.vue`: `NuxtLayout` + `NuxtPage`
- layout ≠ nested URL; часто комбинируются
- тонкий layout; данные и SEO — в pages
- дальше — **pages** (детали page-слоя в Nuxt)

---

## 18. Что делать дальше

Следующий теоретический блок Module 14:

- [Pages](./05-pages.md)
