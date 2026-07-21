# Module 5 · Теория: RouterView

Этот материал закрывает четвёртый теоретический пункт `Module 5`: понять, **что такое `RouterView`**, **куда router рендерит page**, **как строить layout shell**, и **чем top-level outlet отличается от nested**.

Связанные материалы:

- [Module 5 · создание router instance](./02-creating-router-instance.md)
- [Module 5 · RouterLink](./03-router-link.md)
- [Module 3 · UI decomposition](../module-3/08-ui-decomposition.md)

---

## 1. Что такое `RouterView`

`RouterView` — **outlet**: место в template, куда Vue Router вставляет matched page component.

```text
URL /catalog
   ↓
router находит route { path: '/catalog', component: CatalogPage }
   ↓
CatalogPage рендерится внутри <RouterView />
```

Без `RouterView` routes существуют, но UI некуда показать.

Официально:

- [Getting Started · Vue Router](https://router.vuejs.org/guide/)
- [Nested Routes](https://router.vuejs.org/guide/essentials/nested-routes.html) *(nested outlets)*

---

## 2. Базовый layout: `App.vue`

```vue
<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="app">
    <header class="app__header">
      <strong>Product Catalog</strong>
      <nav aria-label="Main">
        <RouterLink :to="{ name: 'home' }">Home</RouterLink>
        <RouterLink :to="{ name: 'catalog' }">Catalog</RouterLink>
        <RouterLink :to="{ name: 'about' }">About</RouterLink>
      </nav>
    </header>

    <main class="app__main">
      <RouterView />
    </main>
  </div>
</template>
```

Разделение ролей:

| Часть | Что живёт здесь |
|-------|-----------------|
| `App.vue` | shell: header, nav, footer |
| `RouterView` | текущая page |
| `pages/*` | содержимое экрана |

`App.vue` **не** должен содержать весь catalog UI — только оболочку.

---

## 3. Как router выбирает component

Для flat routes:

```ts
routes: [
  { path: '/', name: 'home', component: HomePage },
  { path: '/catalog', name: 'catalog', component: CatalogPage },
  { path: '/about', name: 'about', component: AboutPage },
]
```

| URL | Что в `RouterView` |
|-----|--------------------|
| `/` | `HomePage` |
| `/catalog` | `CatalogPage` |
| `/about` | `AboutPage` |

Один top-level `RouterView` = один текущий page component.

---

## 4. Page components — обычные Vue SFC

```vue
<!-- src/pages/CatalogPage.vue -->
<script setup lang="ts">
import ProductList from '@/components/ProductList.vue'
import { useProducts } from '@/composables/useProducts'

const { products, isLoading } = useProducts()
</script>

<template>
  <section>
    <h1>Catalog</h1>
    <ProductList v-if="!isLoading" :products="products" />
  </section>
</template>
```

Page:

- знает **экран**
- собирает container/presentational pieces
- не обязана знать про header/nav (это layout)

---

## 5. `RouterView` + `<Transition>`

Частый паттерн плавной смены pages:

```vue
<RouterView v-slot="{ Component }">
  <Transition name="fade" mode="out-in">
    <component :is="Component" />
  </Transition>
</RouterView>
```

```css
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
```

Для Module 5 practice это optional.
Главное — понять, что `RouterView` может отдавать matched component через slot.

---

## 6. Nested `RouterView` (preview)

Иногда page сама содержит outlet для child routes:

```text
/dashboard          → DashboardLayout + Overview
/dashboard/settings → DashboardLayout + Settings
```

```vue
<!-- DashboardLayout.vue -->
<template>
  <div class="dashboard">
    <aside>…</aside>
    <RouterView /> <!-- nested outlet -->
  </div>
</template>
```

```ts
{
  path: '/dashboard',
  component: DashboardLayout,
  children: [
    { path: '', name: 'dashboard', component: DashboardOverview },
    { path: 'settings', name: 'dashboard-settings', component: DashboardSettings },
  ],
}
```

Для catalog app на старте обычно хватает **одного** top-level `RouterView`.
Полный разбор — в уроке **nested routes**.

---

## 7. Named views (кратко)

Можно рендерить несколько components одновременно в разные outlets:

```vue
<RouterView />
<RouterView name="sidebar" />
```

```ts
{
  path: '/catalog',
  components: {
    default: CatalogPage,
    sidebar: CatalogFilters,
  },
}
```

Это advanced layout technique. Для Module 5 practice обычно не нужно — один `RouterView` в `App.vue` достаточно.

---

## 8. `keep-alive` вокруг page (кратко)

Если нужно сохранять state page при уходе и возврате:

```vue
<RouterView v-slot="{ Component }">
  <KeepAlive>
    <component :is="Component" />
  </KeepAlive>
</RouterView>
```

Осторожно: кешируются все matched pages, если не ограничить `include`/`exclude`.
В учебном catalog чаще проще перезагружать data на каждом заходе.

---

## 9. Что НЕ класть в `RouterView`

`RouterView` — не «ещё один layout wrapper для всего».

Плохо:

```vue
<!-- App.vue -->
<RouterView />
<!-- а header живёт внутри каждой page отдельно → дублирование -->
```

Лучше:

```text
App shell (header/nav)
  └── RouterView → current page
```

Исключение: разные layouts (auth vs app) — тогда layout может быть parent route с nested `RouterView`. Это уже nested routes.

---

## 10. Типичный refactor из Module 2–4

Было:

```text
App.vue = header + весь catalog
```

Стало:

```text
App.vue          = header + nav + <RouterView />
CatalogPage.vue  = catalog screen
HomePage.vue     = intro
AboutPage.vue    = about
ProductDetailsPage.vue = detail (позже)
```

Шаги:

1. Вырезать catalog UI из `App.vue` → `CatalogPage.vue`
2. Оставить shell + `RouterView`
3. Подключить routes
4. Проверить `/`, `/catalog`, `/about`

---

## 11. Частые ошибки

### Забыли `RouterView`

Nav кликается, URL меняется, контент тот же.

### Несколько top-level `RouterView` без named views

Оба покажут один и тот же matched component — обычно не то, что нужно.

### Вся разметка приложения внутри каждой page

Дубли header/footer, сложнее поддерживать.

### Путать page и layout

Layout = стабильная оболочка.
Page = меняется в outlet.

### Ждать nested routes слишком рано

Для 3–4 простых pages один outlet в `App.vue` — правильный старт.

---

## 12. Проверка

1. На `/` видишь `HomePage`
2. На `/catalog` — catalog UI
3. Header/nav не пропадают при смене page
4. Full reload на `/catalog` снова показывает catalog *(Vite + history mode)*

---

## 13. Что важно понять после этого блока

Проверь себя:

1. Что рендерит `RouterView`?
2. Почему его ставят в `App.vue`?
3. Чем page отличается от layout shell?
4. Зачем slot API у `RouterView`?
5. Когда появляется второй (nested) `RouterView`?
6. Как разнести текущий catalog по pages?

---

## 14. Что почитать

### Официальное

- [Getting Started](https://router.vuejs.org/guide/)
- [Nested Routes](https://router.vuejs.org/guide/essentials/nested-routes.html)
- [Named Views](https://router.vuejs.org/guide/essentials/named-views.html)

### Связанные материалы этого плана

- [Module 5 · RouterLink](./03-router-link.md)
- [Module 3 · container / presentational](../module-3/07-container-presentational.md)

---

## 15. Практическое мини-задание

1. В `App.vue` оставь только shell + `<RouterView />`
2. Создай `HomePage`, `CatalogPage`, `AboutPage`
3. Убедись, что смена route меняет только `<main>`
4. Опционально оберни page в `<Transition>`

---

## 16. Мини-конспект

- `RouterView` = outlet для matched page component
- `App.vue` держит layout, pages — содержимое экранов
- один top-level outlet покрывает большинство учебных SPA
- nested / named views — для сложных layouts позже
- без `RouterView` routing невидим в UI

---

## 17. Что делать дальше

Следующий теоретический блок Module 5:

- **`useRouter`**

Разберём programmatic navigation: `push`, `replace`, `back` из Composition API.
