# Module 13 · Теория: shared / ui / entities / features / pages

Этот материал закрывает третий теоретический пункт Module 13: **слои `shared` → `entities` → `features` → `pages`** (+ `ui` внутри них) — кто от кого зависит, куда класть Product Catalog код, и как решать спорные файлы.

Связанные материалы:

- [Module 13 · feature-based](./02-feature-based.md)
- [Module 13 · структура папок](./01-folder-structure.md)

---

## 1. Стек слоёв (упрощённый FSD)

```text
pages      ← экраны (URL)
   ↓
features   ← сценарии пользователя
   ↓
entities   ← бизнес-сущности (Product, User, CartLine)
   ↓
shared     ← ui kit, http, lib, config (без домена)
```

```text
Импорт только вниз по стрелке.
pages → features → entities → shared   ✅
shared → pages                         ❌
features/cart → features/auth (deep)   ❌ (осторожно)
entities → features                    ❌
```

`ui` — не отдельный глобальный слой, а **подпапка** внутри `shared`, `entities` или `features`:

```text
shared/ui/BaseButton.vue
entities/product/ui/ProductCard.vue
features/cart/ui/CartBadge.vue
```

Ориентир: [FSD Layers](https://feature-sliced.design/docs/reference/layers) — адаптируй под pet-project, не копируй все слои (`widgets`, `processes`) без нужды.

---

## 2. `shared` — без знания продукта

**Вопрос:** «Это работало бы в другом app без catalog?»

| Да → shared | Нет → выше |
|-------------|------------|
| `BaseButton`, `BaseModal`, `TextField` | `ProductCard` |
| `httpClient`, `parseJson` | `fetchProducts` |
| `formatPrice`, `debounce` | `cartSubtotal` с CartItem |
| `useDisclosure`, `useToast` | `useAddToCart` |
| `env` wrappers | `VITE_CATALOG_*` business rules |

```text
shared/
  ui/
  api/          # transport only
  lib/
  composables/
  config/
```

**Запрет:** импорт из `entities`, `features`, `pages`.

```ts
// shared/ui/BaseButton.vue
import { useCartStore } from '@/features/cart' // ❌
```

---

## 3. `shared/ui` vs entity/feature UI

| Компонент | Слой | Почему |
|-----------|------|--------|
| `BaseModal` | `shared/ui` | generic overlay |
| `Tabs` | `shared/ui` | generic pattern (Module 10) |
| `ProductCard` | `entities/product/ui` | знает Product shape |
| `AddToCartButton` | `features/cart/...` | знает cart action |
| `LoginForm` | `features/auth/...` | сценарий login |
| `AppHeader` | `pages` layout или `widgets`/`app` | композиция routes |

```vue
<!-- entities/product/ui/ProductCard.vue — presentational -->
<script setup lang="ts">
defineProps<{ product: Product }>()
defineEmits<{ add: [] }>()
</script>
```

```vue
<!-- features/cart/add-to-cart/AddToCartButton.vue -->
<script setup lang="ts">
const cart = useCartStore()
function onAdd(product: Product) {
  cart.add(product)
}
</script>
```

Entity UI **эмитит**; feature **подключает store**.

---

## 4. `entities` — существительные домена

**Вопрос:** «Это Product / User / Order, а не „оформить заказ“?»

```text
entities/
  product/
    model/types.ts       # Product, ProductId
    model/schemas.ts     # zod ProductSchema (optional)
    api/fetchProducts.ts
    api/parseProduct.ts
    ui/ProductCard.vue
    ui/ProductPrice.vue
    queries/productKeys.ts
    index.ts
  user/
  cart-line/             # или cart как entity + feature
```

| Entity владеет | Entity не владеет |
|----------------|-------------------|
| тип `Product` | экран `/catalog` |
| parse API payload | login redirect |
| query keys `['products']` | toast «Added!» |
| карточка товара | фильтры + debounce search |

**Cart как entity vs feature:**

```text
entities/cart-line     → тип строки, id, qty helpers
features/cart          → store, drawer, add-to-cart UX
```

Или один `entities/cart` + feature только для UI flows — главное **не дублировать** `CartItem` type в трёх местах.

---

## 5. `features` — глаголы / сценарии

Повтор из [урока 02](./02-feature-based.md), в контексте слоёв:

```text
features/
  catalog/
    product-filters/     # UI + local state filters
    product-grid/        # склеивает entity cards + feature cart
  cart/
    add-to-cart/
    cart-drawer/
  auth/
    login-form/
    require-auth/        # guard helper used by pages
```

Feature **может** импортировать:

- несколько `entities`
- `shared`
- public API **другого** feature *(редко, осознанно)*

Feature **не** импортирует `pages`.

---

## 6. `pages` — тонкие экраны

```text
pages/
  catalog/CatalogPage.vue
  product/ProductDetailsPage.vue
  cart/CartPage.vue
  auth/LoginPage.vue
  not-found/NotFoundPage.vue
```

```vue
<!-- CatalogPage.vue -->
<script setup lang="ts">
import { ProductFilters, ProductGrid } from '@/features/catalog'
import { CartBadge } from '@/features/cart'
</script>

<template>
  <header><CartBadge /></header>
  <ProductFilters />
  <ProductGrid />
</template>
```

```text
Page = routing + layout slots + feature composition
Не = fetch + store + 15 компонентов в одном файле
```

Router:

```ts
{
  path: '/catalog',
  component: () => import('@/pages/catalog/CatalogPage.vue'),
}
```

---

## 7. `app/` — bootstrap (рядом со стеком)

```text
app/
  main.ts
  App.vue
  router/index.ts
  providers/     # pinia, query client
```

`app` знает **все** слои (собирает приложение). Обратно: слои не импортируют `app` кроме entry.

Иногда layout (`AppLayout`) живёт в `app` или `pages/layouts` — как в Nuxt mental model.

---

## 8. Карта зависимостей (catalog)

```text
CatalogPage
  ├─ features/catalog/product-filters
  │    └─ shared/ui (inputs)
  ├─ features/catalog/product-grid
  │    ├─ entities/product/ui/ProductCard
  │    └─ features/cart/add-to-cart
  │         ├─ entities/product (type)
  │         └─ features/cart/model (store)
  └─ features/cart/cart-badge
       └─ features/cart/model
```

```text
ProductDetailsPage
  ├─ entities/product (query + ui)
  ├─ features/cart/add-to-cart
  └─ features/reviews (lazy) → shared + entity product id
```

---

## 9. Решения спорных файлов

| Файл | Решение | Почему |
|------|---------|--------|
| `formatPrice` | `shared/lib` | нет Product |
| `ProductSchema` (zod) | `entities/product` | домен |
| `loginSchema` | `features/auth` или `entities/user` | сценарий / entity |
| `useToast` | `shared/composables` | UI infra |
| `useProductQuery` | `entities/product` | server entity |
| `useCatalogFilters` | `features/catalog` | UI scenario |
| `RouterLink` wrappers | `shared/ui` или `app` | navigation chrome |
| `CheckoutStepper` | `features/checkout` | multi-step scenario |
| `AdminDashboard` | `pages/admin` + `features/admin-*` | page + features |

**Правило tie-break:**

```text
1. Есть ли доменный тип? → entity
2. Есть ли user scenario / side effect store? → feature
3. Переиспользуется вне домена? → shared
4. Привязано к URL? → page
```

---

## 10. Public API на каждом слое

```ts
// entities/product/index.ts
export type { Product } from './model/types'
export { ProductCard } from './ui/ProductCard.vue'
export { fetchProducts } from './api/fetchProducts'
export { productKeys } from './queries/productKeys'
```

```ts
// features/catalog/index.ts
export { ProductFilters } from './product-filters'
export { ProductGrid } from './product-grid'
```

```ts
// pages — обычно default export page component only
```

Снаружи feature/entity — **только** `index.ts`. Внутри — deep ok.

---

## 11. Упрощённый аналог (критерии README)

Если полный стек тяжеловат:

```text
src/
  pages/
  features/     # cart, auth, catalog
  components/   # = shared/ui + entity ui вместе на старте
  shared/       # api, lib, composables
```

Потом выдели `entities/product` когда типы/api начнут дублироваться.

README: «`ui`, `features`, `entities`, `pages` **или упрощённый аналог**» — этот вариант ок.

---

## 12. Частые ошибки

### Всё в `shared/ui`

`ProductCard`, `LoginForm`, `CartDrawer` — shared перестаёт быть shared.

### Entity знает feature

```ts
// entities/product/ui/ProductCard.vue
import { useCartStore } from '@/features/cart' // ❌
```

### Page на 500 строк

Слои есть на диске, логика всё ещё в page.

### Цикл entity ↔ feature

Feature меняет entity type → entity импортирует feature для «удобства».

### Пустые слои ради FSD

`widgets/`, `processes/` без содержимого — удали до появления нужды.

### Импорт через относительный `../../../`

Используй `@/entities/...`, `@/features/...`.

---

## 13. Что важно понять после этого блока

Проверь себя:

1. Направление импортов между четырьмя слоями?
2. Почему `ProductCard` не в `shared/ui`?
3. Чем entity UI отличается от feature UI?
4. Что остаётся в `CatalogPage` после разложения?
5. Tie-break: schema login — куда?
6. Когда упрощённый аналог без `entities/` ок?

---

## 14. Что почитать

### Ориентиры

- [FSD · Layers](https://feature-sliced.design/docs/reference/layers)
- [FSD · Public API](https://feature-sliced.design/docs/reference/public-api)

### Связанные материалы этого плана

- [Module 13 · feature-based](./02-feature-based.md)
- [Module 10 · UI patterns](../module-10/06-ui-patterns.md)
- [Module 8 · server vs client state](../module-8/01-server-state-vs-client-state.md)

---

## 15. Практическое мини-задание

1. Таблица: 15 файлов catalog → слой (shared/entity/feature/page).
2. Вынеси один `Base*` в `shared/ui`.
3. Вынеси `Product` type + api в `entities/product`.
4. `ProductCard`: убери store, оставь emit; feature подключи cart.
5. `CatalogPage` < 50 строк композиции?

---

## 16. Мини-конспект

- стек: **pages → features → entities → shared**
- `ui` живёт **внутри** слоя, не вместо него
- shared = no domain; entity = noun; feature = verb; page = URL
- public API (`index.ts`) на entity/feature
- упрощённый аналог допустим; полная сетка — цель Module 13
- дальше — **подходы к naming**

---

## 17. Что делать дальше

Следующий теоретический блок Module 13:

- [Подходы к naming](./04-naming.md)
