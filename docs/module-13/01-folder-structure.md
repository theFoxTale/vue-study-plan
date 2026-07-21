# Module 13 · Теория: структура папок

Этот материал открывает **Module 13** и закрывает первый теоретический пункт: **структура папок** — зачем она нужна растущему catalog app, типичные антипаттерны `src/`, и как выбрать каркас до feature-based деталей.

Связанные материалы:

- [Module 12 · practice checklist](../module-12/11-practice-checklist.md)
- [Module 5 · lazy loading routes](../module-5/11-lazy-loading-routes.md)

---

## 1. Зачем Module 13 после Module 12

```text
Module 5–12  → catalog умеет: router, query, forms, UI, tests, perf
Module 13    → код можно найти и менять через полгода
```

Perf-фиксы и тесты **не спасают**, если:

- `ProductCard.vue` лежит в трёх разных папках
- API вызовы размазаны по pages и components
- новый экран = «куда положить?» 20 минут

**Архитектура** здесь — не enterprise-ритуал, а **карта поиска**: куда положить новый код и откуда его импортировать.

Официально / ориентиры:

- [Vue Style Guide · Application Structure](https://vuejs.org/style-guide/rules-strongly-recommended.html#application-structure)
- [Feature-Sliced Design](https://feature-sliced.design/) *(inspiration, не догма)*

---

## 2. Симптом: «плоский src»

```text
src/
  App.vue
  main.ts
  ProductCard.vue
  ProductList.vue
  CartBadge.vue
  useCart.ts
  api.ts
  types.ts
  utils.ts
  LoginPage.vue
  …
```

Работает на 5 файлах. На 40 —:

| Проблема | Следствие |
|----------|-----------|
| Нет слоёв | UI тянет `fetch` напрямую |
| Нет границ | circular imports |
| Нет дома для feature | «положу рядом» → хаос |
| Тесты не знают путь | `__tests__` vs colocate |

---

## 3. Что должна давать структура

```text
1. Найти ProductCard за < 10 секунд
2. Понять: это UI / feature / page / entity?
3. Добавить FavoriteButton без трогания LoginPage
4. Менять API client в одном месте
5. Импорты идут «вниз» по зависимостям, не вверх
```

**Правило зависимостей** (упрощённо):

```text
pages → features → entities → shared
         ↓           ↓
       stores      api/ui
```

Page может знать feature; **shared UI не знает** page.

Подробнее слои — [урок 03](./03-shared-ui-entities-features-pages.md). Сначала — **общая карта папок**.

---

## 4. Два популярных каркаса

### A. Type-based (по типу файла)

```text
src/
  components/
  composables/
  stores/
  pages/
  api/
  types/
  utils/
```

**Плюсы:** просто, знакомо новичкам.  
**Минусы:** `components/` раздувается; product и auth смешаны.

### B. Feature-based (по домену)

```text
src/
  features/
    cart/
    catalog/
    auth/
  shared/
  pages/
  app/
```

**Плюсы:** связанный код рядом.  
**Минусы:** нужно договориться о границах feature.

Catalog после Module 5–12 обычно **перерастает type-based** → Module 13 ведёт к feature-based ([урок 02](./02-feature-based.md)).

---

## 5. Рекомендуемый каркас для Product Catalog

```text
src/
  app/                 # bootstrap: main, App.vue, providers, router instance
    main.ts
    App.vue
    providers.ts       # pinia + vue-query + router mount helpers

  pages/               # route-level screens (тонкие)
    catalog/
      CatalogPage.vue
    product/
      ProductDetailsPage.vue
    cart/
      CartPage.vue
    auth/
      LoginPage.vue

  features/            # user scenarios / use-cases
    cart/
      add-to-cart/
      cart-badge/
    catalog/
      product-filters/
      product-grid/
    auth/
      login-form/

  entities/            # business nouns: Product, CartItem, User
    product/
      model/
      ui/              # ProductCard (optional)
      api/
    cart/
    user/

  shared/              # reuse без домена
    ui/                # BaseButton, BaseModal, TextField
    api/               # http client, parse helpers
    lib/               # formatPrice, debounce
    config/            # env wrappers
    composables/       # useDisclosure, useToast (UI)

  assets/
  styles/
```

Имена папок можно упростить (`components/ui` вместо `shared/ui`) — **смысл слоёв** важнее орфографии.

---

## 6. Куда что класть — быстрый гид

| Артефакт | Папка |
|----------|--------|
| `CatalogPage.vue` | `pages/catalog/` |
| `ProductCard.vue` | `entities/product/ui/` или `features/catalog/…` |
| `BaseModal.vue` | `shared/ui/` |
| `useCartStore` | `features/cart/` или `entities/cart/` |
| `fetchProducts` | `entities/product/api/` или `shared/api/` + entity |
| `loginSchema` (Zod) | `features/auth/` или `entities/user/` |
| `formatPrice` | `shared/lib/` |
| Router definition | `app/router/` или `app/router.ts` |
| Vitest helpers | `tests/` или `shared/testing/` |

**Спор ProductCard:**

```text
Только отображает Product → entities/product/ui
Знает «Add to cart» flow → features/catalog или features/cart
```

Часто: **entity UI** (presentational) + **feature** оборачивает emit → store.

---

## 7. `app/` vs `pages/` vs `features/`

```text
app/      → как приложение стартует (один раз)
pages/    → URL ↔ экран (композиция)
features/ → что пользователь делает (сценарий)
```

```vue
<!-- pages/catalog/CatalogPage.vue — тонкий -->
<script setup lang="ts">
import { ProductFilters } from '@/features/catalog/product-filters'
import { ProductGrid } from '@/features/catalog/product-grid'
</script>

<template>
  <ProductFilters />
  <ProductGrid />
</template>
```

Page **не** содержит 400 строк fetch + filters + cart logic.

---

## 8. Alias `@/` и глубина импортов

```ts
// vite.config.ts
resolve: {
  alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
}
```

```ts
// ✅
import { ProductCard } from '@/entities/product/ui/ProductCard.vue'
import { formatPrice } from '@/shared/lib/formatPrice'

// ❌ relative hell
import { formatPrice } from '../../../shared/lib/formatPrice'
```

**Public API папки** *(optional, но полезно)*:

```text
entities/product/index.ts  → export { ProductCard, useProductQuery, type Product }
```

Снаружи импортируй из `index`, внутри feature — свободно.

---

## 9. Что НЕ делать

### God `components/`

Все `.vue` в одной куче без подпапок.

### Дублировать дерево по типу **и** feature без правила

```text
components/ProductCard.vue
features/catalog/ProductCard.vue  ← два источника правды
```

### Класть pages внутрь features без router смысла

Route entry points лучше видны в `pages/` (как Vue Router / Nuxt mental model).

### `utils.ts` на 2000 строк

Дроби `shared/lib/*` по теме.

### Импорт page из shared

```ts
// shared/ui/Button.vue
import LoginPage from '@/pages/auth/LoginPage.vue' // ❌
```

---

## 10. Миграция с плоского src (ментальная)

Не нужно «большой bang» в один день:

```text
1. Создать shared/ui — вынести Base*
2. Создать pages/ — перенести *Page.vue
3. Создать entities/product — types + api + card
4. features/cart, features/auth
5. app/ — main + router
```

Каждый шаг — коммит / PR. Tests из Module 11 ловят поломки импортов.

---

## 11. Catalog: целевая карта (минимум)

```text
src/
  app/
  pages/          catalog, product, cart, login
  features/       cart, catalog filters, auth login
  entities/       product, cart-line, user
  shared/         ui, api client, lib, composables
```

Этого достаточно для критериев README Module 13. Feature-Sliced «как в доке FSD» — **не обязателен**.

---

## 12. Частые ошибки

### Переименовать папки без обновления imports

Сломает build — делай incremental + alias.

### Структура ради структуры

Пустые `widgets/`, `processes/` на pet-project — шум.

### Page = feature = entity в одном файле 800 строк

Структура не поможет, пока не разрежешь файл.

### Stores в `shared/`

Cart store — доменный → `features/cart` или `entities/cart`.

### Забыть тесты рядом с кодом

Colocate `ProductCard.spec.ts` с компонентом или зеркало в `tests/` — выбери одно правило.

---

## 13. Что важно понять после этого блока

Проверь себя:

1. Зачем структура, если тесты и perf уже есть?
2. Type-based vs feature-based — когда второй?
3. Чем `pages/` отличается от `features/`?
4. Куда положить `BaseModal` и `ProductCard`?
5. Почему shared не импортирует pages?
6. Как мигрировать плоскость без rewrite?

---

## 14. Что почитать

### Официальное / ориентиры

- [Vue Style Guide · Application Structure](https://vuejs.org/style-guide/rules-strongly-recommended.html#application-structure)
- [Feature-Sliced Design · Overview](https://feature-sliced.design/docs/get-started/overview)

### Связанные материалы этого плана

- [Module 3 · UI decomposition](../module-3/08-ui-decomposition.md)
- [Module 12 · practice](../module-12/11-practice-checklist.md)

---

## 15. Практическое мини-задание

1. Нарисуй текущий `src/` catalog на бумаге (5 мин).
2. Пометь каждый файл: page / feature / entity / shared / app.
3. Найди 3 файла «не на своём месте».
4. Создай целевые пустые папки `pages/`, `shared/ui/`, `entities/product/` *(без большого move)*.
5. Запиши правило: «новый Base* → только shared/ui».

---

## 16. Мини-конспект

- структура = **карта поиска**, не бюрократия
- плоский `src/` ломается после ~20–40 файлов
- каркас: **app / pages / features / entities / shared**
- зависимости идут вниз: pages → … → shared
- migrate incrementally
- дальше — **feature-based organization**

---

## 17. Что делать дальше

Следующий теоретический блок Module 13:

- [Feature-based organization](./02-feature-based.md)
