# Module 4 · Теория: generics в прикладных сценариях

Этот материал закрывает шестой теоретический пункт `Module 4`: понять, **что такое generics**, **где они реально помогают во Vue app**, и **как не усложнять типы ради типов**.

Связанные материалы:

- [Module 4 · typing API responses](./05-typing-api-responses.md)
- [Module 4 · typing composables](./03-typing-composables.md)
- [Module 4 · interfaces & type aliases](./04-interfaces-and-type-aliases.md)

---

## 1. Что такое generic простыми словами

Generic = тип-параметр.

Вместо копирования:

```ts
type ProductsResponse = { data: Product[] }
type UsersResponse = { data: User[] }
```

Пишешь один шаблон:

```ts
type ApiResponse<T> = {
  data: T
}
```

Потом:

```ts
type ProductsResponse = ApiResponse<Product[]>
type UsersResponse = ApiResponse<User[]>
```

`T` — «подставь конкретный тип позже».

Официально:

- [Generics · TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/2/generics.html)

---

## 2. Зачем generics во Vue-проекте

Типичные места:

| Сценарий | Пример |
|----------|--------|
| API wrappers | `ApiResponse<T>` |
| fetch helpers | `fetchJson<T>(url)` |
| composables | `useFetch<T>(url)` |
| list helpers | `useArrayFilter<T>(...)` |
| UI kits | generic table/list item |
| utility types | `Maybe<T> = T \| null` |

Generics нужны, когда **алгоритм один**, а **тип данных разный**.

---

## 3. Базовый пример функции

```ts
function identity<T>(value: T): T {
  return value
}

const a = identity<number>(1) // number
const b = identity('vue')     // string (inferred)
```

TS часто выводит `T` сам — явный `<number>` не всегда нужен.

---

## 4. Прикладной кейс: `ApiResponse<T>`

```ts
type ApiSuccess<T> = {
  ok: true
  data: T
}

type ApiFailure = {
  ok: false
  message: string
}

type ApiResponse<T> = ApiSuccess<T> | ApiFailure
```

Использование:

```ts
type ProductsApiResponse = ApiResponse<Product[]>
type ProductApiResponse = ApiResponse<Product>
```

Без generics пришлось бы дублировать success/failure для каждой сущности.

---

## 5. Прикладной кейс: `fetchJson<T>`

```ts
async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`)
  }

  return (await response.json()) as T
}
```

```ts
const products = await fetchJson<Product[]>('/api/products')
```

### Важно

Это удобно, но `as T` всё ещё **не validation**.
Generics описывают contract использования; runtime parse остаётся нужен для безопасности.

Более честный вариант:

```ts
async function fetchJson<T>(
  url: string,
  parse: (data: unknown) => T,
): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Request failed: ${response.status}`)
  const data: unknown = await response.json()
  return parse(data)
}
```

```ts
const products = await fetchJson('/api/products', parseProducts)
```

Здесь `T` выводится из return type `parseProducts`.

---

## 6. Прикладной кейс: composable `useFetch`-like

Упрощённо:

```ts
import { ref, type Ref } from 'vue'

type UseFetchReturn<T> = {
  data: Ref<T | null>
  error: Ref<string>
  isLoading: Ref<boolean>
  reload: () => Promise<void>
}

export function useFetch<T>(
  url: string,
  parse: (data: unknown) => T,
): UseFetchReturn<T> {
  const data = ref<T | null>(null) as Ref<T | null>
  const error = ref('')
  const isLoading = ref(false)

  async function reload() {
    isLoading.value = true
    error.value = ''
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error(`Request failed: ${response.status}`)
      const json: unknown = await response.json()
      data.value = parse(json)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      data.value = null
    } finally {
      isLoading.value = false
    }
  }

  return { data, error, isLoading, reload }
}
```

```ts
const { data, reload } = useFetch('/api/products', parseProducts)
// data: Ref<Product[] | null>
```

Для catalog обычно достаточно `useProducts`.
Generic `useFetch` полезен, когда endpoints много и паттерн повторяется.

---

## 7. Constraints: `T extends ...`

Иногда generic должен иметь минимальную shape:

```ts
type HasId = {
  id: number | string
}

function findById<T extends HasId>(
  items: T[],
  id: T['id'],
): T | undefined {
  return items.find((item) => item.id === id)
}
```

```ts
findById(products, 1) // Product | undefined
```

Без `extends HasId` нельзя было бы безопасно читать `item.id`.

---

## 8. Прикладной кейс: list helpers

```ts
import { computed, type ComputedRef, type Ref } from 'vue'

export function useArrayFilter<T>(
  items: Ref<T[]>,
  predicate: (item: T) => boolean,
): ComputedRef<T[]> {
  return computed(() => items.value.filter(predicate))
}
```

```ts
const cheapProducts = useArrayFilter(products, (p) => p.price < 100)
```

Ещё пример:

```ts
export function useByIdMap<T extends { id: number }>(
  items: Ref<T[]>,
): ComputedRef<Map<number, T>> {
  return computed(() => new Map(items.value.map((item) => [item.id, item])))
}
```

---

## 9. Generics в Vue components *(кратко)*

В SFC можно объявить generic parameter:

```vue
<script setup lang="ts" generic="T extends { id: number | string }">
defineProps<{
  items: T[]
  selectedId?: T['id'] | null
}>()

defineEmits<{
  select: [id: T['id']]
}>()
</script>
```

Это мощно для `DataTable` / `Select` / `List`.

На Module 4:

- понять, что так можно
- не обязательно сразу переписывать `ProductList` в generic

Для feature list (`ProductList`) конкретный `Product[]` часто яснее.
Generic component — когда UI-kit реально переиспользуется для разных entities.

---

## 10. Utility generics, которые уже используешь

Ты уже встречал generics в стандартной библиотеке TS/Vue:

```ts
Partial<Product>
Pick<Product, 'id' | 'name'>
Omit<Product, 'id'>
Ref<Product[]>
ComputedRef<Product[]>
Promise<Product[]>
Record<string, Product>
```

Это те же generics: тип-конструкторы от параметров.

---

## 11. Когда generics НЕ нужны

Не усложняй, если тип один:

```ts
// достаточно
function loadProducts(): Promise<Product[]> {}

// избыточно
function loadProductsGeneric<T = Product>(): Promise<T[]> {}
```

Не вводи `T`, если:

- нет второго use-case
- читаемость падает
- можно выразить обычным конкретным type

```text
сначала конкретный useProducts
потом generic useFetch, если появилось повторение
```

---

## 12. Частые ошибки

### Generic без constraint, но код предполагает поля

```ts
function getName<T>(item: T) {
  return item.name // ❌ Property 'name' does not exist
}
```

Нужно:

```ts
function getName<T extends { name: string }>(item: T) {
  return item.name
}
```

### Слишком много type params

```ts
function f<T, U, V, X, Y>() {}
```

Обычно smell. Разбей API.

### `T = any` по умолчанию

```ts
function useFetch<T = any>() {} // ❌ возвращает any-дыру
```

Лучше требовать явный `T` или вывод из parser.

### Думать, что generic = runtime check

Generics стираются при компиляции.
Они не валидируют JSON сами по себе.

---

## 13. Практический набор для catalog

Что стоит внедрить уже сейчас:

```ts
type ApiResponse<T> = {
  data: T
  message?: string
}

type Maybe<T> = T | null

async function fetchJson<T>(
  url: string,
  parse: (data: unknown) => T,
): Promise<T>
```

Что можно отложить:

- generic `ProductList<T>`
- сложные conditional types
- infer-heavy utility magic

---

## 14. Связка с предыдущими уроками

```text
domain types          → Product, SortBy
API responses         → unknown + parse
generics              → reuse parse/fetch/response wrappers
composables           → useProducts конкретный, useFetch<T> при повторении
```

Generics — инструмент переиспользования types, не замена хорошим models.

---

## 15. Что важно понять после этого блока

Проверь себя:

1. Что означает `T` в `ApiResponse<T>`?
2. Чем `fetchJson<T>(url, parse)` безопаснее, чем `as T` внутри helper?
3. Зачем нужен `T extends { id: number }`?
4. Когда generic composable лучше конкретного `useProducts`?
5. Почему generics не проверяют API response в runtime?
6. Какой один generic helper стоит добавить в catalog прямо сейчас?

---

## 16. Что почитать

### TypeScript

- [Generics · TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/2/generics.html)
- [Generic Constraints · TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/2/generics.html#generic-constraints)
- [Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html)

### Vue

- [Generic Components · Vue.js](https://vuejs.org/api/sfc-script-setup.html#generics) *(overview)*

### Связанные материалы этого плана

- [Module 4 · typing API responses](./05-typing-api-responses.md)
- [Module 4 · typing composables](./03-typing-composables.md)

---

## 17. Практическое мини-задание

1. Опиши `ApiResponse<T>` или `Maybe<T>`
2. Сделай `fetchJson<T>(url, parse)`
3. Перепиши `fetchProducts` через него
4. Добавь `useArrayFilter<T>` и примени к `products`
5. Не переводи `ProductList` на generic, если нет второго entity — осознанно оставь конкретным

---

## 18. Мини-конспект

- generics = переиспользуемые типы-параметры
- сильны для API wrappers, fetch helpers, list utils
- `extends` задаёт минимальный контракт `T`
- конкретный `useProducts` часто лучше раннего generic everything
- generics не заменяют runtime validation
- усложняй типы только после повторения паттерна

---

## 19. Что делать дальше

Следующий теоретический блок Module 4:

- **[`работа с типами в store и router`](./07-types-in-store-and-router.md)**

Даже если Pinia/Router ещё не в центре практики, полезно понять, **как типизируются stores, routes и navigation** заранее — это мост к Module 5–6.
