# Module 13 · Теория: feature-based organization

Этот материал закрывает второй теоретический пункт Module 13: **feature-based organization** — группировка кода по **пользовательским сценариям / доменам**, границы feature, публичный API папки и как не превратить `features/` в свалку.

Связанные материалы:

- [Module 13 · структура папок](./01-folder-structure.md)
- [Module 3 · container / presentational](../module-3/07-container-presentational.md)

---

## 1. Идея в одной фразе

```text
Type-based:   «где лежат все компоненты?»
Feature-based: «где лежит всё про корзину / логин / фильтры?»
```

**Feature** — кусок продукта, который можно описать глаголом или сценарием:

| Feature | User story |
|---------|------------|
| `cart` | добавить товар, изменить qty, очистить |
| `auth` | войти, выйти, защитить route |
| `catalog` | фильтровать, листать, открыть карточку |
| `checkout` | оформить заказ |

Код feature живёт **рядом**: UI + composable + store slice + local types — не размазан по `components/`, `composables/`, `stores/`.

Ориентиры:

- [Feature-Sliced Design](https://feature-sliced.design/)
- [Vue Style Guide · Application Structure](https://vuejs.org/style-guide/rules-strongly-recommended.html#application-structure)

---

## 2. Почему type-based перестаёт работать

```text
src/components/ProductCard.vue
src/components/CartDrawer.vue
src/components/LoginForm.vue
src/composables/useCart.ts
src/composables/useAuth.ts
src/stores/cart.ts
src/stores/auth.ts
```

Чтобы изменить **cart**, открываешь 4+ папки. Чтобы понять **зависимости LoginForm** — grep по всему `src/`.

```text
Feature-based:
src/features/cart/
  ui/CartDrawer.vue
  model/useCartStore.ts
  lib/cartTotals.ts
  index.ts
```

Один PR / один mental context = одна папка.

---

## 3. Feature ≠ page ≠ entity

| Слой | Вопрос | Пример |
|------|--------|--------|
| **Page** | Какой URL? | `/catalog`, `/login` |
| **Feature** | Что делает пользователь? | add-to-cart, login-form |
| **Entity** | Что за бизнес-сущность? | Product, User, CartLine |
| **Shared** | Переиспользуется без домена? | BaseButton, http client |

```text
/catalog (page)
  использует features/catalog/product-filters
  использует features/catalog/product-grid
  grid показывает entities/product (ProductCard)
  кнопка «Add» → features/cart/add-to-cart
```

Page **компонует** features. Feature **оркестрирует** entities + shared. Entity **не знает** про login flow.

Детальная сетка слоёв — [урок 03](./03-shared-ui-entities-features-pages.md).

---

## 4. Как нарезать features в Product Catalog

### Рекомендуемый минимум

```text
features/
  auth/
    login-form/
    session/          # или model/useAuthStore
  cart/
    add-to-cart/
    cart-drawer/
    cart-badge/
  catalog/
    product-filters/
    product-grid/
    product-search/
```

### Слишком мелко

```text
features/
  cart-add-button/
  cart-qty-plus/
  cart-qty-minus/
```

Каждая кнопка — «feature» → шум. Группируй по **сценарию** (`add-to-cart` содержит button + action).

### Слишком крупно

```text
features/
  shop/    # cart + catalog + checkout + reviews
```

God-feature. Режь, когда два человека правят разные сценарии в одной папке постоянно.

### Правило нарезки

```text
Можно удалить/отключить feature папку —
и остальной app компилируется (с дыркой в UI),
а не «тянет половину проекта за собой».
```

---

## 5. Внутренняя структура одной feature

Простой вариант (pet-project):

```text
features/cart/
  ui/
    CartDrawer.vue
    CartLine.vue
    CartBadge.vue
  model/
    useCartStore.ts
  lib/
    cartTotals.ts
  index.ts
```

Или по сценариям:

```text
features/cart/
  add-to-cart/
    AddToCartButton.vue
    useAddToCart.ts
  cart-badge/
    CartBadge.vue
  model/
    useCartStore.ts
  index.ts
```

**Оба ок.** Выбери одно соглашение и держись его.

```ts
// features/cart/index.ts — public API
export { CartBadge } from './ui/CartBadge.vue'
export { CartDrawer } from './ui/CartDrawer.vue'
export { useCartStore } from './model/useCartStore'
export { cartSubtotal } from './lib/cartTotals'
```

Снаружи:

```ts
import { CartBadge, useCartStore } from '@/features/cart'
```

Внутри feature — относительные импорты свободно.

---

## 6. Правила зависимостей между features

```text
✅ features/cart → entities/product, shared/*
✅ features/catalog → entities/product, shared/*
❌ features/cart → features/auth/ui/LoginForm.vue  (напрямую вглубь)
❌ features/auth → features/cart
```

**Циклы feature↔feature** — главный запах.

Если cart и auth оба нужны:

```text
page компонует оба
или
shared/session helpers
или
тонкий «контракт»: auth экспортирует isLoggedIn, cart его читает через public API
```

```ts
// ✅ через public API
import { useAuthStore } from '@/features/auth'

// ❌ deep import чужой внутренности
import { SessionCookie } from '@/features/auth/model/internal/SessionCookie'
```

Deep import ломает рефакторинг соседа.

---

## 7. Feature и Pinia / vue-query

| State | Где живёт |
|-------|-----------|
| Cart items | `features/cart/model` |
| Auth session | `features/auth/model` |
| Products list (server) | `entities/product` + query keys **или** `features/catalog` |
| Toast queue | `shared` (UI) |

```text
Не клади все stores в src/stores/ «потому что Pinia».
Store — часть feature/entity, не отдельная вселенная.
```

Подробнее — [урок 07 · stores layer](./07-stores-layer.md).

---

## 8. Feature vs «просто папка components»

```text
❌ features/ui/Button.vue          — это shared
❌ features/utils/formatDate.ts    — это shared/lib
❌ features/Product.ts             — это entity type
```

**Тест:** если файл не про сценарий пользователя — он не feature.

```text
✅ features/checkout/place-order/
✅ features/catalog/product-filters/
```

---

## 9. Миграция catalog на features (пошагово)

```text
1. Выбери самый болезненный домен (обычно cart или auth)
2. Создай features/cart/ + index.ts
3. Перенеси store + badge + drawer
4. Обнови imports через @/features/cart
5. npm run test:run + manual QA
6. Следующий домен: auth → catalog filters
```

Не переноси всё за один вечер. Module 11 tests = safety net.

---

## 10. Catalog: пример до / после

### До

```text
components/ProductCard.vue      # fetch? cart? emit?
composables/useProducts.ts
stores/cart.ts
pages/CatalogPage.vue           # 300 строк filters + grid
```

### После

```text
entities/product/ui/ProductCard.vue
entities/product/api/fetchProducts.ts
features/catalog/product-filters/
features/catalog/product-grid/
features/cart/add-to-cart/
features/cart/model/useCartStore.ts
pages/catalog/CatalogPage.vue   # ~30 строк композиции
```

---

## 11. Когда feature-based **не** нужен

| Ситуация | Подход |
|----------|--------|
| Учебный todo на 8 файлов | type-based ок |
| Один экран, один разработчик, месяц жизни | не over-engineer |
| Команда уже договорилась на FSD/Nuxt layers | следуй команде |

Module 13 цель — **навык границ**, не обязательный FSD-сертификат.

---

## 12. Частые ошибки

### `features/` = новый `components/`

Свалили все `.vue` без model/lib/index.

### Feature импортирует page

```ts
import CatalogPage from '@/pages/catalog/CatalogPage.vue' // ❌
```

### Два feature с одним store

`features/cart` и `features/checkout` оба мутируют один store без public API → race и coupling.

### Переименовать без public API

Все deep imports ломаются — `index.ts` смягчает.

### Feature на каждый файл

100 папок по 1 файлу — хуже плоского src.

### Игнорировать entities

Всё в features → дублирование `Product` type и parse в каждом feature.

---

## 13. Что важно понять после этого блока

Проверь себя:

1. Чем feature отличается от page?
2. Как нарезать cart в catalog — 1 feature или 3?
3. Зачем `features/*/index.ts`?
4. Почему deep import соседней feature — плохо?
5. Куда положить Pinia cart store?
6. Первый шаг миграции с type-based?

---

## 14. Что почитать

### Ориентиры

- [Feature-Sliced Design · Features](https://feature-sliced.design/docs/reference/layers#features)
- [Vue Style Guide · Application Structure](https://vuejs.org/style-guide/rules-strongly-recommended.html#application-structure)

### Связанные материалы этого плана

- [Module 13 · структура папок](./01-folder-structure.md)
- [Module 6 · Pinia](../module-6/04-pinia.md)
- [Module 3 · container/presentational](../module-3/07-container-presentational.md)

---

## 15. Практическое мини-задание

1. Список 4–6 user stories catalog (глаголы).
2. Сопоставь каждой story папку `features/...`.
3. Вынеси **один** домен (cart или auth) в `features/*` + `index.ts`.
4. Запрети deep import: снаружи только через index.
5. CatalogPage: оставь только композицию features — сколько строк ушло?

---

## 16. Мини-конспект

- feature = **сценарий**, не «тип файла»
- код сценария **рядом**: ui + model + lib + index
- pages компонуют; features не импортируют pages
- нет циклов feature↔feature; public API обязателен
- migrate one domain at a time
- дальше — **shared / ui / entities / features / pages**

---

## 17. Что делать дальше

Следующий теоретический блок Module 13:

- [shared / ui / entities / features / pages](./03-shared-ui-entities-features-pages.md)
