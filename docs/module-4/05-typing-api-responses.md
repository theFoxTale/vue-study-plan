# Module 4 · Теория: типизация API-ответов

Этот материал закрывает пятый теоретический пункт `Module 4`: понять, **как описывать данные с backend**, **почему голый `as Product[]` опасен**, и **как безопасно провести API response → typed domain model**.

Связанные материалы:

- [Module 4 · interfaces & type aliases](./04-interfaces-and-type-aliases.md)
- [Module 4 · typing composables](./03-typing-composables.md)
- [Module 2 · watch / fetch](../module-2/04-watch.md)

---

## 1. Проблема: `fetch` возвращает неизвестность

```ts
const response = await fetch('/api/products')
const data = await response.json()
```

Для TypeScript `data` — это по сути **непроверенные данные**.

Даже если написать:

```ts
const data = (await response.json()) as Product[]
```

это **не проверка**, а только утверждение разработчика.
Если backend пришлёт другую shape — UI упадёт уже в runtime.

Цель урока:

```text
описать ожидаемый контракт
отделить API DTO от UI model (когда нужно)
проверить/сузить данные перед записью в state
```

---

## 2. Базовый слой: domain type

Сначала должен быть ясный app model:

```ts
// src/types/product.ts
export type Product = {
  id: number
  name: string
  price: number
  category?: string
}
```

Это тип, с которым работают components/composables.

---

## 3. API DTO vs domain model

Иногда backend отдаёт не то же самое, что удобно UI.

### API DTO

```ts
// src/types/api.ts
export type ProductDto = {
  id: number
  title: string
  price_cents: number
  category_name?: string | null
}
```

### Domain model

```ts
export type Product = {
  id: number
  name: string
  price: number
  category?: string
}
```

### Mapper

```ts
export function mapProductDto(dto: ProductDto): Product {
  return {
    id: dto.id,
    name: dto.title,
    price: dto.price_cents / 100,
    category: dto.category_name ?? undefined,
  }
}
```

Если backend уже совпадает с UI — отдельный DTO может не понадобиться.
Но идея полезная: **не тащить сырой API shape по всему фронту**.

---

## 4. Типичный response wrapper

Backend часто отдаёт не голый array:

```ts
type ProductsResponse = {
  data: ProductDto[]
  meta?: {
    total: number
    page: number
  }
}
```

или:

```ts
type ApiSuccess<T> = {
  ok: true
  data: T
}

type ApiError = {
  ok: false
  message: string
}

type ApiResponse<T> = ApiSuccess<T> | ApiError
```

Generics здесь уже полезны — подробнее в следующем уроке.
Пока достаточно уметь описать конкретный response type.

---

## 5. Минимально честный fetch в composable

```ts
async function loadProducts() {
  isLoading.value = true
  error.value = ''

  try {
    const response = await fetch('/api/products')

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`)
    }

    const data: unknown = await response.json()
    products.value = parseProducts(data)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unknown error'
    products.value = []
  } finally {
    isLoading.value = false
  }
}
```

Ключевой момент:

```ts
const data: unknown = await response.json()
```

Сначала `unknown`, потом узкое преобразование.

---

## 6. Type guard / parser своими руками

Для учебного MVP можно написать простой parser:

```ts
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parseProduct(value: unknown): Product {
  if (!isRecord(value)) {
    throw new Error('Invalid product')
  }

  if (
    typeof value.id !== 'number' ||
    typeof value.name !== 'string' ||
    typeof value.price !== 'number'
  ) {
    throw new Error('Invalid product fields')
  }

  return {
    id: value.id,
    name: value.name,
    price: value.price,
    category: typeof value.category === 'string' ? value.category : undefined,
  }
}

function parseProducts(value: unknown): Product[] {
  if (!Array.isArray(value)) {
    throw new Error('Products response must be an array')
  }

  return value.map(parseProduct)
}
```

Это verbose, но честно: данные проверены.

---

## 7. Более удобный путь: schema validation *(preview)*

В реальных проектах часто используют Zod / Valibot.

```ts
import { z } from 'zod'

const ProductSchema = z.object({
  id: z.number(),
  name: z.string(),
  price: z.number(),
  category: z.string().optional(),
})

const ProductsSchema = z.array(ProductSchema)

const products = ProductsSchema.parse(await response.json())
// Product[]
```

В этом учебном плане глубокий Zod будет позже (Module 9).
На Module 4 достаточно понимать:

```text
type = compile-time contract
runtime validation = защита от реального API
```

Для практики Module 4 допустимы:

1. аккуратный `as Product[]` + комментарий о допущении *(минимум)*
2. ручной parser/type guard *(лучше)*
3. Zod preview *(optional stretch)*

---

## 8. Ошибки API тоже нужно типизировать

Не оставляй `catch (err: any)`.

```ts
function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err
  return 'Unknown error'
}
```

Или dedicated type:

```ts
type ApiClientError = {
  message: string
  statusCode?: number
}
```

```ts
if (!response.ok) {
  const errorBody: unknown = await response.json().catch(() => null)
  throw {
    message: 'Failed to load products',
    statusCode: response.status,
  } satisfies ApiClientError
}
```

---

## 9. Где жить API types

Рекомендуемая раскладка:

```text
src/types/
  product.ts      # domain
  api.ts          # DTO / response wrappers

src/services/
  productsApi.ts  # fetch + parse + map

src/composables/
  useProducts.ts  # state orchestration
```

### `productsApi.ts`

```ts
import type { Product } from '@/types/product'
import { parseProducts } from '@/types/api'

export async function fetchProducts(): Promise<Product[]> {
  const response = await fetch('/api/products')

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`)
  }

  const data: unknown = await response.json()
  return parseProducts(data)
}
```

### `useProducts.ts`

```ts
async function loadProducts() {
  isLoading.value = true
  error.value = ''
  try {
    products.value = await fetchProducts()
  } catch (err) {
    error.value = getErrorMessage(err)
    products.value = []
  } finally {
    isLoading.value = false
  }
}
```

Composable не обязан знать детали JSON parsing.

---

## 10. Mock API тоже типизируй

Если пока нет backend:

```ts
const mockProducts: Product[] = [
  { id: 1, name: 'Keyboard', price: 80 },
  { id: 2, name: 'Mouse', price: 40 },
]

export async function fetchProducts(): Promise<Product[]> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  return mockProducts
}
```

Даже mock должен возвращать `Promise<Product[]>`, а не `any`.

---

## 11. Partial / incomplete responses

Иногда API отдаёт preview:

```ts
type ProductListItemDto = Pick<Product, 'id' | 'name' | 'price'>
```

или:

```ts
type ProductDetailsDto = Product & {
  description: string
  images: string[]
}
```

Не пихай details fields в list model «на всякий случай».
Разные endpoints = разные response types.

---

## 12. Nullable fields из backend

Backend часто шлёт `null`:

```ts
type ProductDto = {
  id: number
  name: string
  price: number
  category: string | null
}
```

UI может хотеть `category?: string`.

Mapper:

```ts
category: dto.category ?? undefined
```

Это место, где optional/nullable различия из прошлого урока становятся практикой.

---

## 13. Антиpatterns

### Слепой cast везде

```ts
const products = (await response.json()) as Product[]
products[0].namme // runtime crash, TS молчит
```

### Протащить DTO по всем components

```ts
// UI знает price_cents и title
```

Лучше map → domain `Product`.

### `any` в service layer

```ts
async function fetchProducts(): Promise<any> {}
```

### Молча глотать invalid JSON

Лучше явная ошибка в `error` state, чем «тихий» пустой UI без причины.

---

## 14. Прагматичная шкала строгости для Module 4

| Уровень | Что делаешь | Ок для |
|---------|-------------|--------|
| 1 | `as Product[]` + TODO | самый первый draft |
| 2 | `unknown` + manual parse | recommended MVP |
| 3 | Zod/Valibot schema | stretch / later modules |

Не нужно сразу строить enterprise validation platform.
Нужно перестать делать вид, будто network data уже typed.

---

## 15. Пример для catalog practice

```ts
// src/types/api.ts
import type { Product } from './product'

export function parseProducts(data: unknown): Product[] {
  if (!Array.isArray(data)) {
    throw new Error('Expected products array')
  }

  return data.map((item) => {
    if (
      typeof item !== 'object' ||
      item === null ||
      typeof (item as any).id !== 'number' ||
      typeof (item as any).name !== 'string' ||
      typeof (item as any).price !== 'number'
    ) {
      throw new Error('Invalid product item')
    }

    const row = item as {
      id: number
      name: string
      price: number
      category?: unknown
    }

    return {
      id: row.id,
      name: row.name,
      price: row.price,
      category: typeof row.category === 'string' ? row.category : undefined,
    }
  })
}
```

Да, тут есть локальные assertions — но на границе системы после checks.
Внутрь app уже уходит честный `Product[]`.

---

## 16. Что важно понять после этого блока

Проверь себя:

1. Почему `as Product[]` не делает данные безопасными?
2. Чем DTO отличается от domain model?
3. Зачем сначала писать `const data: unknown = await response.json()`?
4. Что такое mapper?
5. Где должны жить parse/fetch: в composable или service?
6. Какой уровень строгости ты выберешь для своего catalog MVP?

---

## 17. Что почитать

### Официальное / смежное

- [MDN · Using Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)
- [TypeScript · Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [Zod](https://zod.dev/) *(preview на будущее)*

### Связанные материалы этого плана

- [Module 4 · interfaces & type aliases](./04-interfaces-and-type-aliases.md)
- [Module 4 · typing composables](./03-typing-composables.md)

---

## 18. Практическое мини-задание

Доработай catalog data layer:

1. Добавь `fetchProducts(): Promise<Product[]>`
2. Внутри используй `unknown` + `parseProducts`
3. Подключи это в `useProducts`
4. Сломай mock JSON специально и убедись, что появляется error state
5. *(optional)* если backend fields другие — сделай `ProductDto` + mapper

---

## 19. Мини-конспект

- network data по умолчанию недостоверна для TypeScript
- `as T` ≠ validation
- начинай с `unknown`, затем parse/narrow
- DTO → mapper → domain model
- fetch/parse лучше в service, state — в composable
- ошибки тоже типизируй через `unknown`

---

## 20. Что делать дальше

Следующий теоретический блок Module 4:

- **[`generics в прикладных сценариях`](./06-generics.md)**

Generics помогут описать переиспользуемые `ApiResponse<T>`, `useFetch<T>`, typed lists/tables без copy-paste типов.
