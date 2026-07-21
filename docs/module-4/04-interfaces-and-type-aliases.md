# Module 4 · Теория: интерфейсы и type aliases

Этот материал закрывает четвёртый теоретический пункт `Module 4`: понять, **чем `interface` отличается от `type`**, **когда что выбирать в Vue-проекте**, и **как аккуратно собрать `src/types` без дублей и `any`**.

Связанные материалы:

- [Module 4 · typing props](./01-typing-props.md)
- [Module 4 · typing emits](./02-typing-emits.md)
- [Module 4 · typing composables](./03-typing-composables.md)

---

## 1. Зачем вообще разделять `interface` и `type`

Оба создают именованные типы:

```ts
interface Product {
  id: number
  name: string
}

type SortBy = 'name' | 'price'
```

На практике в Vue app:

- **domain objects** часто описывают через `interface` или `type` object
- **unions / mapped / utility types** — почти всегда `type`
- важнее **единый стиль проекта**, чем священная война

Цель Module 4: уметь объяснить выбор в конкретном месте.

---

## 2. Базовый синтаксис

### `interface`

```ts
interface Product {
  id: number
  name: string
  price: number
  category?: string
}
```

### `type` alias

```ts
type Product = {
  id: number
  name: string
  price: number
  category?: string
}
```

Для object shape оба варианта почти эквивалентны.

---

## 3. Что умеет только `type` (или удобнее через `type`)

### Union

```ts
type SortBy = 'name' | 'price'
type Status = 'idle' | 'loading' | 'error' | 'success'
```

`interface` так не пишется.

### Intersection

```ts
type TimestampedProduct = Product & {
  createdAt: string
}
```

`interface` тоже может `extends`, но intersection через `&` — территория `type`.

### Tuple / function / mapped

```ts
type Point = [number, number]

type Loader = () => Promise<void>

type ProductCardEmits = {
  select: [id: number]
  addToCart: [id: number]
}
```

Для emits contracts и utility shapes `type` обычно естественнее.

---

## 4. Что удобнее через `interface`

### Object contracts с возможным extend

```ts
interface Product {
  id: number
  name: string
  price: number
}

interface DetailedProduct extends Product {
  description: string
  inStock: boolean
}
```

### Declaration merging *(знать, редко нужно в app code)*

```ts
interface Window {
  __APP_VERSION__?: string
}
```

В обычном catalog app declaration merging почти не понадобится.
Это чаще для lib/global augmentation.

---

## 5. Практическое правило для Vue study plan

```text
unions / emits maps / aliases     → type
domain entities (Product, User) → interface или type (выбери один стиль)
props/emits object maps         → type
composable return contracts     → type
```

Рекомендация для этого плана:

| Категория | Предпочтение |
|-----------|--------------|
| `Product`, `User`, `Order` | `type` или `interface` — но **один стиль на проект** |
| `SortBy`, `Status` | `type` |
| `ProductCardProps` | `type` |
| `ProductCardEmits` | `type` |
| `UseProductsReturn` | `type` |

Если сомневаешься — **`type` покрывает почти все учебные кейсы**.

---

## 6. Extends vs intersection

### `interface extends`

```ts
interface Product {
  id: number
  name: string
}

interface CartItem extends Product {
  quantity: number
}
```

### `type` + `&`

```ts
type Product = {
  id: number
  name: string
}

type CartItem = Product & {
  quantity: number
}
```

Для app models оба ок.
Если уже используешь unions активно — `type` + `&` часто выглядит единообразнее.

---

## 7. Optional, readonly, nullability

```ts
type Product = {
  id: number
  name: string
  price: number
  category?: string
  readonly sku?: string
}

type SelectedId = number | null
```

Помни разницу:

```ts
category?: string          // может отсутствовать → undefined
category: string | null    // ключ есть, значение может быть null
```

В API-моделях это важно: backend `null` ≠ «поля нет».

---

## 8. Переиспользование через utility types

Не копируй object руками, если можно выразить отношение:

```ts
type Product = {
  id: number
  name: string
  price: number
  category?: string
}

type ProductDraft = Omit<Product, 'id'>
type ProductPreview = Pick<Product, 'id' | 'name' | 'price'>
type ProductUpdate = Partial<Product>
type RequiredProduct = Required<Product>
```

Для forms/create flows это особенно полезно:

```ts
type CreateProductPayload = Omit<Product, 'id'>
```

---

## 9. Пример `src/types/product.ts`

```ts
export type SortBy = 'name' | 'price'

export type Product = {
  id: number
  name: string
  price: number
  category?: string
}

export type ProductCardProps = {
  id: number
  name: string
  price: number
  isSelected?: boolean
}

export type ProductCardEmits = {
  select: [id: number]
  addToCart: [id: number]
}

export type ProductFiltersEmits = {
  'update:query': [value: string]
  'update:sortBy': [value: SortBy]
  reset: []
}

export type ProductListProps = {
  products: Product[]
  isLoading: boolean
  error: string
}
```

Один файл = source of truth для catalog domain.

---

## 10. Когда дробить types-файлы

Пока domain маленький — один `product.ts` ок.

Когда растет:

```text
src/types/
  product.ts
  cart.ts
  user.ts
  api.ts
  index.ts   # optional re-exports
```

Не создавай `types.ts` на 800 строк «всего подряд» без структуры.

---

## 11. `interface` для props в `defineProps`

Оба варианта валидны:

```ts
interface Props {
  query: string
  sortBy: SortBy
}

defineProps<Props>()
```

```ts
type Props = {
  query: string
  sortBy: SortBy
}

defineProps<Props>()
```

Для emits tuple maps обычно `type`:

```ts
type Emits = {
  'update:query': [value: string]
}
```

---

## 12. Nominal-like unions вместо magic strings

Плохо:

```ts
sortBy: string
status: string
```

Лучше:

```ts
type SortBy = 'name' | 'price'
type LoadStatus = 'idle' | 'loading' | 'success' | 'error'
```

Это один из самых больших wins TypeScript в UI code.

---

## 13. Не плоди дубли

Плохо:

```ts
// в ProductCard
type CardProduct = { id: number; name: string; price: number }

// в ProductList
type ListProduct = { id: number; name: string; price: number }
```

Хорошо:

```ts
import type { Product } from '@/types/product'
```

Если card хочет узкий API — используй `Pick`:

```ts
type ProductCardProps = Pick<Product, 'id' | 'name' | 'price'> & {
  isSelected?: boolean
}
```

---

## 14. `type` для composable contracts

```ts
import type { Ref, ComputedRef } from 'vue'
import type { Product, SortBy } from '@/types/product'

export type UseProductFiltersReturn = {
  query: Ref<string>
  sortBy: Ref<SortBy>
  visibleProducts: ComputedRef<Product[]>
  resetFilters: () => void
}
```

Здесь `type` читается естественно: это alias для object contract, не «сущность мира».

---

## 15. Частые ошибки

### Использовать `interface` для union

```ts
interface SortBy = 'name' | 'price' // ❌ syntax nonsense
type SortBy = 'name' | 'price'     // ✅
```

### Дублировать Product shape в 5 местах

Потом одно поле `category` добавили только в одном файле.

### Путать optional и nullable

```ts
error?: string
error: string | null
```

Это разные контракты UI/API.

### `any` «временно» в models

```ts
type Product = any // ❌ сразу ломает Module 4 goal
```

### Слишком рано усложнять mapped types

Для catalog MVP хватит `type`/`interface`, unions и `Pick`/`Omit`.
Глубокая type magic не обязательна.

---

## 16. Мини-гайд выбора за 10 секунд

```text
Нужен union / tuple / emits map?     → type
Нужен object entity?                 → type или interface (единый стиль)
Нужно extend object?                 → interface extends или type &
Нужен Pick/Omit/Partial?             → type
Не уверен?                           → type
```

---

## 17. Что важно понять после этого блока

Проверь себя:

1. Чем `type SortBy = 'name' | 'price'` лучше `sortBy: string`?
2. Когда `interface` особенно уместен?
3. Что умеет `type`, чего не выразить через `interface` напрямую?
4. Чем `category?: string` отличается от `category: string | null`?
5. Зачем `Pick` / `Omit` в Vue models?
6. Какой стиль types ты зафиксируешь для своего catalog проекта?

---

## 18. Что почитать

### TypeScript

- [Everyday Types · TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html)
- [Object Types · TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/2/objects.html)
- [Utility Types · TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/utility-types.html)

### Связанные материалы этого плана

- [Module 4 · typing props](./01-typing-props.md)
- [Module 4 · typing emits](./02-typing-emits.md)
- [Module 4 · typing composables](./03-typing-composables.md)

---

## 19. Практическое мини-задание

Приведи types catalog к одному стилю:

1. Создай/почисти `src/types/product.ts`
2. Опиши:
   - `Product`
   - `SortBy`
   - `ProductCardProps`
   - `ProductCardEmits`
   - `ProductFiltersEmits`
3. Используй `Pick` или явное переиспользование вместо copy-paste
4. Замени все `string` status/sort magic unions на named `type`
5. Пройдись по проекту и удали локальные duplicate product shapes

---

## 20. Мини-конспект

- `interface` и `type` часто взаимозаменяемы для object shapes
- unions/tuples/emits maps → `type`
- выбери один стиль для domain entities и держись его
- optional ≠ nullable
- `Pick` / `Omit` / `Partial` уменьшают дубли
- сильные named unions > голые `string`

---

## 21. Что делать дальше

Следующий теоретический блок Module 4:

- **[`типизация API-ответов`](./05-typing-api-responses.md)**

После аккуратных domain types логично научиться безопасно описывать данные, которые приходят с `fetch` / backend.
