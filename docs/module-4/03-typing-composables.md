# Module 4 · Теория: типизация composables

Этот материал закрывает третий теоретический пункт `Module 4`: понять, **как типизировать вход и выход composable**, **как работать с `Ref` / `ComputedRef`**, и **как сделать `useProducts` / `useProductFilters` строго typed**.

Связанные материалы:

- [Module 4 · typing props](./01-typing-props.md)
- [Module 4 · typing emits](./02-typing-emits.md)
- [Module 2 · practice checklist](../module-2/11-practice-checklist.md)

---

## 1. Зачем типизировать composables

Composable — это обычная TS-функция с Vue reactivity inside.

Без типов легко получить:

```ts
const { products } = useProducts()
products.value.push({ title: 'x' }) // неверная shape
```

С типами:

```ts
products // Ref<Product[]>
```

IDE и `vue-tsc` подскажут поля `Product` и запретят wrong assignments.

Официально по composables:

- [Composables · Vue.js](https://vuejs.org/guide/reusability/composables.html)
- [Typing ref / computed · Vue.js](https://vuejs.org/guide/typescript/composition-api.html#typing-ref)

---

## 2. Что типизировать в composable

У composable обычно 3 зоны types:

```text
1. input args
2. internal state
3. return value
```

```ts
export function useProductFilters(
  products: Ref<Product[]>, // input
) {
  const query = ref('') // internal
  const visibleProducts = computed(() => ...) // internal/derived

  return {
    query,
    visibleProducts,
  } // return contract
}
```

---

## 3. Базовый паттерн: inference часто достаточно

```ts
import { ref } from 'vue'
import type { Product } from '@/types/product'

export function useProducts() {
  const products = ref<Product[]>([])
  const isLoading = ref(false)
  const error = ref('')

  async function loadProducts() {
    isLoading.value = true
    error.value = ''
    try {
      const response = await fetch('/api/products')
      if (!response.ok) throw new Error('Failed to load products')
      products.value = (await response.json()) as Product[]
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      products.value = []
    } finally {
      isLoading.value = false
    }
  }

  return {
    products,
    isLoading,
    error,
    loadProducts,
  }
}
```

Здесь:

- `ref<Product[]>([])` задаёт тип state
- return type часто **выводится сам**
- consumer получает правильные types при destructure

---

## 4. Явный return type

Когда API composable важный/публичный — опиши return явно:

```ts
import { ref, type Ref } from 'vue'
import type { Product } from '@/types/product'

type UseProductsReturn = {
  products: Ref<Product[]>
  isLoading: Ref<boolean>
  error: Ref<string>
  loadProducts: () => Promise<void>
}

export function useProducts(): UseProductsReturn {
  const products = ref<Product[]>([])
  const isLoading = ref(false)
  const error = ref('')

  async function loadProducts() {
    // ...
  }

  return {
    products,
    isLoading,
    error,
    loadProducts,
  }
}
```

Плюсы:

- contract зафиксирован
- случайно не вернёшь лишнее/другое
- удобно читать как documentation

---

## 5. `Ref` vs raw value в аргументах

### Если composable должен реагировать на внешний state

Передавай `Ref`:

```ts
import { computed, type Ref } from 'vue'
import type { Product, SortBy } from '@/types/product'

export function useProductFilters(products: Ref<Product[]>) {
  const query = ref('')
  const sortBy = ref<SortBy>('name')

  const visibleProducts = computed(() => {
    const normalized = query.value.trim().toLowerCase()

    const filtered = products.value.filter((product) => {
      if (!normalized) return true
      return product.name.toLowerCase().includes(normalized)
    })

    return [...filtered].sort((a, b) => {
      if (sortBy.value === 'price') return a.price - b.price
      return a.name.localeCompare(b.name)
    })
  })

  return {
    query,
    sortBy,
    visibleProducts,
  }
}
```

Почему `Ref<Product[]>`:

- filters видят актуальный список после fetch
- destructure `products` из `useProducts()` остаётся reactive

### Если нужен только snapshot

Можно принять plain value:

```ts
function formatPrice(price: number) {
  return `$${price}`
}
```

Это уже скорее util, не stateful composable.

---

## 6. `MaybeRef` / `MaybeRefOrGetter` *(полезно знать)*

Гибкие composables часто принимают:

- plain value
- `ref`
- getter

В VueUse / современном Vue стиле это описывают так:

```ts
import { toValue, type MaybeRefOrGetter } from 'vue'

export function useTitle(title: MaybeRefOrGetter<string>) {
  watchEffect(() => {
    document.title = toValue(title)
  })
}
```

`toValue()` нормализует:

```text
ref → .value
getter → call()
plain → as is
```

Для Module 4 catalog достаточно уверенно типизировать `Ref<T>`.
`MaybeRefOrGetter` пригодится, когда начнёшь писать более универсальные helpers.

---

## 7. Typing `computed`

```ts
import { computed, type ComputedRef, type Ref } from 'vue'
import type { Product } from '@/types/product'

function useCount(products: Ref<Product[]>): {
  totalCount: ComputedRef<number>
} {
  const totalCount = computed(() => products.value.length)
  return { totalCount }
}
```

Или явный generic:

```ts
const cheapest = computed<Product | null>(() => {
  if (products.value.length === 0) return null
  return [...products.value].sort((a, b) => a.price - b.price)[0]
})
```

---

## 8. Рекомендуемый return shape

Convention Vue:

```text
return plain object of refs
```

```ts
return {
  products,   // Ref<Product[]>
  isLoading,  // Ref<boolean>
  error,      // Ref<string>
  loadProducts,
}
```

Так destructure сохраняет reactivity:

```ts
const { products, isLoading } = useProducts()
```

Не возвращай один большой `reactive(...)` как единственный стиль по умолчанию — при destructure легко потерять связь.

---

## 9. Полный typed example: filters return type

```ts
import { computed, ref, type ComputedRef, type Ref } from 'vue'
import type { Product, SortBy } from '@/types/product'

export type UseProductFiltersReturn = {
  query: Ref<string>
  sortBy: Ref<SortBy>
  visibleProducts: ComputedRef<Product[]>
  resetFilters: () => void
}

export function useProductFilters(
  products: Ref<Product[]>,
): UseProductFiltersReturn {
  const query = ref('')
  const sortBy = ref<SortBy>('name')

  const visibleProducts = computed(() => {
    // ...
    return [] as Product[]
  })

  function resetFilters() {
    query.value = ''
    sortBy.value = 'name'
  }

  return {
    query,
    sortBy,
    visibleProducts,
    resetFilters,
  }
}
```

Consumer:

```ts
const { products } = useProducts()
const { query, sortBy, visibleProducts, resetFilters } = useProductFilters(products)
```

Все types стыкуются без `any`.

---

## 10. Async composables и error typing

```ts
const error = ref<string>('')
```

или богаче:

```ts
type LoadError = {
  message: string
  statusCode?: number
}

const error = ref<LoadError | null>(null)
```

Для Module 4 MVP `string` часто достаточно.
Главное — не `ref<any>(null)`.

Cast API JSON осознанно:

```ts
products.value = (await response.json()) as Product[]
```

Позже в уроке про API-ответы сделаем это безопаснее (type guards / schema). Пока важно хотя бы объявить целевой тип.

---

## 11. Options object как input

Когда аргументов много:

```ts
type UseProductsOptions = {
  immediate?: boolean
  endpoint?: string
}

export function useProducts(options: UseProductsOptions = {}) {
  const endpoint = options.endpoint ?? '/api/products'
  // ...
}
```

Это читаемее, чем 4 positional args.

---

## 12. Generics preview для composables

Иногда composable универсален:

```ts
export function useArrayFilter<T>(
  items: Ref<T[]>,
  predicate: (item: T) => boolean,
) {
  return computed(() => items.value.filter(predicate))
}
```

```ts
const visible = useArrayFilter(products, (p) => p.price < 100)
// ComputedRef<Product[]>
```

Подробнее generics будут в отдельном блоке Module 4.
Сейчас достаточно понять: composable может быть generic function.

---

## 13. Где жить types для composables

Практичная схема:

```text
src/types/product.ts
  Product, SortBy, ProductCardProps, ...

src/composables/useProducts.ts
  UseProductsReturn (можно тут или в types)

src/composables/useProductFilters.ts
  UseProductFiltersReturn
```

Правило:

- domain entities → `src/types`
- composable-specific return contracts → рядом с composable или в types, если переиспользуются

---

## 14. Частые ошибки

### Приняли `Product[]` вместо `Ref<Product[]>`

```ts
useProductFilters(products.value) // ❌ потеряли reactivity на вход
useProductFilters(products)       // ✅
```

### Вернули reactive object и деструктурировали

```ts
const state = reactive({ query: '' })
return state

const { query } = useFilters() // ❌ query больше не reactive
```

Лучше возвращать refs.

### `ref([])` без generic

```ts
const products = ref([]) // Ref<never[]> в строгом режиме / слабый inference
const products = ref<Product[]>([])
```

### `any` в return

```ts
products: Ref<any[]> // ❌
products: Ref<Product[]> // ✅
```

### Забыли Promise в async method type

```ts
loadProducts: () => void          // слабо
loadProducts: () => Promise<void> // лучше
```

---

## 15. Мини-набор правил Module 4 для composables

```text
1. явно типизируй ref state: ref<Product[]>([])
2. входные reactive dependencies — Ref<T> / MaybeRefOrGetter<T>
3. return plain object of refs + functions
4. для публичного API добавь UseXReturn
5. no any
6. domain types бери из src/types
```

---

## 16. Что важно понять после этого блока

Проверь себя:

1. Почему `useProductFilters` принимает `Ref<Product[]>`, а не `Product[]`?
2. Что такое `UseProductsReturn` и зачем он нужен?
3. Почему composable лучше возвращает object of refs?
4. Чем `ComputedRef<T>` отличается от `Ref<T>` на уровне смысла?
5. Зачем `ref<Product[]>([])`, а не `ref([])`?
6. Когда хватит inference, а когда нужен explicit return type?

---

## 17. Что почитать

### Официальное

- [Composables · Vue.js](https://vuejs.org/guide/reusability/composables.html)
- [Composables · Vue.js RU](https://ru.vuejs.org/guide/reusability/composables.html)
- [Typing ref() · Vue.js](https://vuejs.org/guide/typescript/composition-api.html#typing-ref)
- [Typing computed() · Vue.js](https://vuejs.org/guide/typescript/composition-api.html#typing-computed)

### Связанные материалы этого плана

- [Module 4 · typing props](./01-typing-props.md)
- [Module 2 · practice checklist](../module-2/11-practice-checklist.md)

---

## 18. Практическое мини-задание

Ужесточи composables catalog app:

1. В `useProducts`:
   - `ref<Product[]>([])`
   - explicit `UseProductsReturn`
2. В `useProductFilters`:
   - arg `products: Ref<Product[]>`
   - `sortBy: Ref<SortBy>`
   - `visibleProducts: ComputedRef<Product[]>`
3. Убери `any`
4. Проверь, что page destructure сохраняет types
5. Намеренно верни wrong type из composable и поймай ошибку через explicit return type

---

## 19. Мини-конспект

- composable = typed function + Vue reactivity
- типизируй args, state и return contract
- для списков/filters на входе обычно `Ref<T>`
- return object of refs, не потеряй reactivity на destructure
- `UseXReturn` фиксирует public API
- `any` в composables ломает всю цепочку types до components

---

## 20. Что делать дальше

Следующий теоретический блок Module 4:

- **интерфейсы и type aliases**

Нужно уверенно выбирать `interface` vs `type`, строить union/intersection models и не плодить дубли в `src/types`.
