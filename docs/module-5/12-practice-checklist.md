# Module 5 · Практический checklist

Пошаговый чеклист для закрытия **практической части Module 5**: превратить одноэкранный app в **многостраничное SPA** с Vue Router — pages, dynamic detail, lazy loading, `useRouter` / `useRoute`.

Используй этот файл как рабочий документ: проходи шаги по порядку и отмечай выполненные пункты.

---

## Перед стартом

### Module 4 должен быть закрыт

- [ ] проект на `<script setup lang="ts">` со строгими types
- [ ] есть domain models (`Product` и т.п.)
- [ ] catalog UI уже работает (list / filters / cards)
- [ ] API/parse слой хотя бы базовый

### Прочитай теорию Module 5

- [01 · Vue Router 4](01-vue-router-4.md)
- [02 · создание router instance](02-creating-router-instance.md)
- [03 · RouterLink](03-router-link.md)
- [04 · RouterView](04-router-view.md)
- [05 · useRouter](05-use-router.md)
- [06 · useRoute](06-use-route.md)
- [07 · динамические маршруты](07-dynamic-routes.md)
- [08 · nested routes](08-nested-routes.md) *(можно легко, если layout не нужен)*
- [09 · redirects](09-redirects.md)
- [10 · navigation guards](10-navigation-guards.md) *(понимание обязательно, код — optional)*
- [11 · lazy loading routes](11-lazy-loading-routes.md)

---

## Шаг 1. Выбрать проект

| Вариант | Когда |
|---------|------|
| **Product Catalog из Module 2–4** | recommended |
| **Blog** (list + post detail) | если удобнее текстовый domain |
| **Dashboard** (overview + nested section) | если хочешь сразу nested layouts |

### Рекомендация

Не начинай новый app. Module 5 — про **навигацию и URL** поверх уже готового UI.

### Checklist

- [ ] выбран один проект
- [ ] `npm run dev` стартует
- [ ] понятно, какие экраны станут pages

---

## Шаг 2. Зафиксировать MVP Module 5

### MVP

- `vue-router@4` подключён
- `src/router/index.ts` + `app.use(router)`
- `App.vue` = shell (header/nav) + `<RouterView />`
- минимум **3 pages** (например Home, Catalog, About)
- **detail page** с dynamic param (`/products/:id`)
- навигация через `RouterLink` (named routes)
- хотя бы один сценарий `useRouter().push` / `replace`
- хотя бы один сценарий `useRoute()` (params и/или query)
- все route components — **lazy** (`() => import(...)`)
- catch-all **404** page
- понимаешь, нужны ли тебе guards сейчас (да/нет + почему)

### Не обязательно в MVP

- полноценный auth + protected routes
- nested dashboard layout
- named views
- scroll restoration тонкая настройка
- SSR / Nuxt
- Pinia как источник routing state

### Checklist

- [ ] MVP записан
- [ ] scope не уехал в Module 6 (глобальный store)

---

## Шаг 3. Установить и подключить router

```bash
npm install vue-router@4
```

```ts
// main.ts
app.use(router)
app.mount('#app')
```

History:

```ts
createWebHistory(import.meta.env.BASE_URL)
```

### Checklist

- [ ] пакет установлен
- [ ] `src/router/index.ts` создан
- [ ] `use(router)` **до** `mount()`
- [ ] нет ошибок в консоли при старте

---

## Шаг 4. Разнести UI по pages

Целевая структура:

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
  App.vue          ← shell only
  components/      ← прежние UI pieces
```

### Действия

1. Вырежи catalog UI из `App.vue` → `CatalogPage.vue`
2. Сделай простые `HomePage` / `AboutPage`
3. В `App.vue` оставь brand + nav + `<RouterView />`

### Checklist

- [ ] `App.vue` больше не содержит весь catalog
- [ ] pages лежат отдельно от reusable components
- [ ] header/nav не дублируются в каждой page

---

## Шаг 5. Описать routes

Минимум:

```text
/                 → home
/catalog          → catalog
/products/:id     → product-details
/about            → about
/*                → not-found
```

### Правила

- у каждого рабочего screen есть `name`
- detail — dynamic `:id`
- catch-all **в конце**
- `component: () => import('...')` для всех pages

### Checklist

- [ ] ≥ 3 обычных pages + detail + 404
- [ ] named routes заданы
- [ ] lazy imports без static import pages в router-файле

---

## Шаг 6. Nav через `RouterLink`

```vue
<RouterLink :to="{ name: 'home' }">Home</RouterLink>
<RouterLink :to="{ name: 'catalog' }">Catalog</RouterLink>
<RouterLink :to="{ name: 'about' }">About</RouterLink>
```

### Checklist

- [ ] внутренние ссылки не через сырой `<a href="/...">`
- [ ] есть стиль для active / exact-active
- [ ] nav доступен с клавиатуры (нативные ссылки)

---

## Шаг 7. Catalog → Detail

### Из списка

```vue
<RouterLink
  :to="{ name: 'product-details', params: { id: product.id } }"
>
  {{ product.title }}
</RouterLink>
```

### На details page

- читай `route.params.id` через `useRoute` (или `props: true`)
- валидируй тип (`string`)
- грузи product по id
- **`watch` на id** с `{ immediate: true }` (reuse component!)
- состояния: loading / error / not found / success
- кнопка «Back to catalog» через `router.push({ name: 'catalog' })` *(не слепой `back()`)*

### Checklist

- [ ] `/products/1` открывается напрямую (refresh ок в Vite)
- [ ] переход 1 → 2 обновляет данные без «залипания» старого product
- [ ] shareable URL работает
- [ ] ошибка/нет товара обработаны

---

## Шаг 8. `useRouter` + `useRoute` в реальном сценарии

Сделай **оба**:

| Сценарий | API |
|----------|-----|
| Ссылка в карточке | `RouterLink` |
| После действия (например Apply filters / fake save) | `router.push` / `replace` |
| Чтение id / category | `useRoute` |

Опционально — filters в query:

```text
/catalog?category=phones
```

### Checklist

- [ ] есть declarative navigation (`RouterLink`)
- [ ] есть programmatic navigation (`useRouter`)
- [ ] текущий route реально читается (`useRoute`)
- [ ] можешь объяснить, когда что выбирать

---

## Шаг 9. Redirects и 404

- [ ] хотя бы один legacy/convenience redirect  
  (например `/home` → `home`, или `/products` → `catalog`)
- [ ] `NotFoundPage` с ссылкой/кнопкой на home или catalog
- [ ] неизвестный URL (`/nope`) показывает 404, а не пустой outlet

---

## Шаг 10. Lazy loading — проверить факт

1. Все route components — `() => import(...)`
2. `npm run build`
3. В `dist/assets` видно несколько JS chunks
4. В DevTools → Network при первом заходе на page видна подгрузка chunk *(в dev/preview)*

### Checklist

- [ ] нет static imports pages в `router/index.ts`
- [ ] build проходит
- [ ] понимаешь, зачем lazy (initial bundle)

---

## Шаг 11. Nested routes *(optional)*

Делай, только если есть UI-нужда:

- dashboard с sidebar
- product tabs (`/products/:id/reviews`)

Иначе зафиксируй отказ:

> Nested не нужны: flat pages + App shell достаточно.

### Checklist

- [ ] либо working nested layout + child `RouterView`
- [ ] либо осознанный skip с одной фразой «почему»

---

## Шаг 12. Navigation guards *(optional code, required understanding)*

Минимум понимания (ответь себе):

1. Зачем `beforeEach`?
2. Что такое `meta.requiresAuth`?
3. Когда guard **не** нужен простому catalog?

Опциональный код:

- [ ] `afterEach` → `document.title` из `meta.title`
- [ ] mock auth + один protected route
- [ ] `onBeforeRouteLeave` на «грязной» форме

### Checklist

- [ ] можешь объяснить роль guards без шпаргалки
- [ ] если код guards нет — это ок для MVP, если понимание есть

---

## Шаг 13. Ручной QA сценарий

Пройди как пользователь:

1. Home → Catalog → product → Back to catalog  
2. Refresh на `/products/:id`  
3. Несуществующий id  
4. `/nope` → 404 → Home  
5. Active link подсвечивается  
6. Back/Forward браузера ведут себя ожидаемо  

### Checklist

- [ ] все 6 пунктов пройдены без «странностей»
- [ ] нет full page reload на внутренних переходах

---

## Шаг 14. Финальная самопроверка

Ответь устно/письменно:

1. Чем `RouterLink` лучше `<a href>` в SPA?
2. Что делает `RouterView`?
3. Чем `useRouter` отличается от `useRoute`?
4. Почему при смене `:id` нужен `watch`?
5. Зачем lazy `() => import(...)`?
6. Когда тебе реально понадобятся guards?

### Checklist

- [ ] ответы даются своими словами, на примере своего app

---

## Финальный checklist Module 5

Module 5 можно считать завершённым, если:

### Проект

- [ ] многостраничное SPA на Vue Router 4
- [ ] минимум 3 pages + detail + 404
- [ ] app собирается и работает

### Технические требования

- [ ] dynamic route(s) настроены
- [ ] lazy loading на route components
- [ ] `useRouter` и `useRoute` использованы в реальном сценарии
- [ ] навигация без full reload
- [ ] роль guards понятна (код — по необходимости)

### Понимание

- [ ] pages vs components vs layout shell
- [ ] params vs query
- [ ] redirect vs alias на уровне идеи
- [ ] когда nested routes оправданы

---

## Stretch goals *(optional)*

- nested dashboard layout
- filters полностью в `query` (shareable catalog state)
- `props: true` + typed props на details
- mock login + `meta.requiresAuth`
- `scrollBehavior` + page `Transition`
- `meta.title` + `afterEach`
- prefetch / chunk grouping в Vite

---

## Если что-то пошло не так

### URL меняется, контент нет

- проверь `<RouterView />` в `App.vue`
- проверь `app.use(router)` до `mount()`

### Refresh на `/products/1` даёт 404 от server

- в Vite dev обычно ок
- на static host нужен fallback на `index.html` (см. history mode)

### Details показывает старый product

- добавь `watch` на `route.params.id` с `immediate: true`

### Lazy «не работает»

- убери static `import Page from ...` из router-файла
- проверь `npm run build` / chunks

### `params` пустые при `push`

- не мешай `path` и `params` — используй `name` + `params`

---

## Что делать после Module 5

Переходи к **Module 6 · Управление состоянием**:

- [локальное состояние vs глобальное](../module-6/01-local-vs-global-state.md)
- `provide/inject`
- Pinia: state / getters / actions / setup stores

Routing уже есть — store понадобится для cart, auth, shared catalog filters across pages.

---

## Мини-конспект

- Module 5 = URL ↔ pages в SPA
- shell в `App.vue`, экраны в `pages/`, UI pieces в `components/`
- dynamic + lazy + `useRouter`/`useRoute` = minimum bar
- guards — инструмент доступа/UX, не обязательный декор каждого pet-project
- следующий фокус — **где жить shared state** (Module 6)
