# Module 2 · Практический checklist

Пошаговый чеклист для закрытия **практической части Module 2**: собрать приложение на **Composition API** с reactivity, `computed`, `watch`, composables и простым `fetch`.

Используй этот файл как рабочий документ: проходи шаги по порядку и отмечай выполненные пункты.

---

## Перед стартом

### Module 1 должен быть закрыт

- [ ] есть 1 законченное приложение на базовых директивах
- [ ] уверенно используешь `<script setup lang="ts">`
- [ ] понимаешь `v-if`, `v-for`, `v-model`, events

### Прочитай теорию Module 2

- [01 · ref](01-ref.md)
- [02 · reactive](02-reactive.md)
- [03 · computed](03-computed.md)
- [04 · watch](04-watch.md)
- [05 · watchEffect](05-watchEffect.md)
- [06 · lifecycle hooks](06-lifecycle-hooks.md)
- [07 · defineProps](07-defineProps.md)
- [08 · defineEmits](08-defineEmits.md)
- [09 · defineExpose](09-defineExpose.md) *(optional на первом проходе)*
- [10 · Composition vs Options API](10-composition-api-vs-options-api.md)

---

## Шаг 1. Выбрать pet-project

Для Module 2 выбери **один** проект с filter/sort/async logic:

| Проект | Сложность | Что тренирует |
|--------|-----------|---------------|
| **Product Catalog** | easy-medium | search, sort, list, fetch, composables |
| **Movie Search UI** | easy | search, loading/error/empty, fetch |
| **Recipe Book** | easy | category filter, list, details |
| **Продолжить Todo / Notes из Module 1** | easy | filters, computed, composables |

### Рекомендация

Если сомневаешься — начни с **Product Catalog**. Он лучше всего совпадает с практикой Module 2 из `README.md`.

### Checklist

- [ ] выбран один pet-project
- [ ] понятен MVP scope проекта

---

## Шаг 2. Определить MVP

Не делай ecommerce целиком. Для Module 2 достаточно:

### Product Catalog MVP

- загрузить список товаров
- показать cards/list
- search по названию
- sort by name / price
- states: `loading`, `error`, `empty`
- минимум 2 composables

### Movie Search UI MVP

- input search
- fetch results
- cards/list
- `loading / error / empty`
- debounced search *(optional)*

### Recipe Book MVP

- список рецептов
- filter by category
- card/details view
- local state + `computed`

### Checklist

- [ ] MVP записан в 5-7 пунктов
- [ ] нет router, Pinia, auth, checkout

---

## Шаг 3. Создать или переиспользовать проект

### Вариант A — новый проект

```bash
npm create vue@latest
```

Рекомендуемые опции:

- TypeScript → Yes
- Router → No
- Pinia → No
- ESLint → Yes
- Prettier → Yes

```bash
cd <project-name>
npm install
npm run dev
```

### Вариант B — продолжить проект из Module 1

Можно улучшить Todo / Notes / Habits, добавив filters, computed и composables.

### Checklist

- [ ] проект запускается через `npm run dev`
- [ ] Vue Devtools видит приложение

---

## Шаг 4. Подготовить структуру

Рекомендуемая структура для **Product Catalog**:

```text
src/
  components/
    AppHeader.vue
    ProductFilters.vue
    ProductList.vue
    ProductCard.vue
    LoadingState.vue
    ErrorState.vue
    EmptyState.vue
  composables/
    useProducts.ts
    useProductFilters.ts
  types/
    product.ts
  App.vue
  main.ts
```

### Checklist

- [ ] есть папка `components`
- [ ] есть папка `composables`
- [ ] типы вынесены в `types/` или рядом с composables

---

## Шаг 5. Описать типы данных

```ts
// src/types/product.ts
export type Product = {
  id: number
  name: string
  price: number
  category?: string
}
```

### Checklist

- [ ] есть TypeScript type для основной сущности
- [ ] props/composables используют этот type

---

## Шаг 6. Сделать composable `useProducts`

Минимум:

- `products`
- `isLoading`
- `error`
- `loadProducts()`

Пример:

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

      if (!response.ok) {
        throw new Error('Failed to load products')
      }

      products.value = await response.json()
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

### Если API ещё нет

Используй mock:

```ts
const mockProducts: Product[] = [
  { id: 1, name: 'Keyboard', price: 80, category: 'tech' },
  { id: 2, name: 'Mouse', price: 40, category: 'tech' },
  { id: 3, name: 'Monitor', price: 300, category: 'tech' },
]

await new Promise((resolve) => setTimeout(resolve, 500))
products.value = mockProducts
```

### Checklist

- [ ] создан `useProducts`
- [ ] есть async load
- [ ] есть `isLoading` и `error`
- [ ] composable возвращает reactive state + methods

---

## Шаг 7. Сделать composable `useProductFilters`

Минимум:

- `query`
- `sortBy`
- `visibleProducts` через `computed`

Пример:

```ts
import { ref, computed, type Ref } from 'vue'
import type { Product } from '@/types/product'

export function useProductFilters(products: Ref<Product[]>) {
  const query = ref('')
  const sortBy = ref<'name' | 'price'>('name')

  const visibleProducts = computed(() => {
    const normalizedQuery = query.value.trim().toLowerCase()

    const filtered = products.value.filter((product) => {
      if (!normalizedQuery) return true
      return product.name.toLowerCase().includes(normalizedQuery)
    })

    return [...filtered].sort((a, b) => {
      if (sortBy.value === 'price') {
        return a.price - b.price
      }

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

### Checklist

- [ ] создан второй composable
- [ ] filter реализован через `computed`
- [ ] sort реализован через `computed`
- [ ] исходный массив не мутируется напрямую в `sort`

---

## Шаг 8. Подключить lifecycle / watch для fetch

Выбери один понятный сценарий:

### Вариант A — initial load в `onMounted`

```ts
onMounted(() => {
  loadProducts()
})
```

### Вариант B — reload при смене category через `watch`

```ts
watch(category, () => {
  loadProducts()
}, { immediate: true })
```

### Вариант C — `watchEffect`

```ts
watchEffect(async (onCleanup) => {
  // load with cleanup
})
```

### Checklist

- [ ] fetch запускается осознанно, не «случайно»
- [ ] понимаю, почему выбрал `onMounted` / `watch` / `watchEffect`
- [ ] при unmount нет очевидных утечек *(optional: abort fetch)*

---

## Шаг 9. Разбить UI на components

Минимум:

- `ProductFilters`
- `ProductList`
- `ProductCard`

### `ProductFilters.vue`

```vue
<script setup lang="ts">
defineProps<{
  query: string
  sortBy: 'name' | 'price'
}>()

defineEmits<{
  'update:query': [value: string]
  'update:sortBy': [value: 'name' | 'price']
}>()
</script>
```

### `ProductCard.vue`

```vue
<script setup lang="ts">
defineProps<{
  id: number
  name: string
  price: number
}>()
</script>
```

### Checklist

- [ ] используется `defineProps`
- [ ] используется `defineEmits` там, где child сообщает parent
- [ ] `App.vue` не перегружен всей logic

---

## Шаг 10. Связать parent и child через props / v-model

```vue
<script setup lang="ts">
import { onMounted } from 'vue'
import { useProducts } from './composables/useProducts'
import { useProductFilters } from './composables/useProductFilters'
import ProductFilters from './components/ProductFilters.vue'
import ProductList from './components/ProductList.vue'

const { products, isLoading, error, loadProducts } = useProducts()
const { query, sortBy, visibleProducts } = useProductFilters(products)

onMounted(loadProducts)
</script>

<template>
  <main class="app">
    <ProductFilters
      v-model:query="query"
      v-model:sort-by="sortBy"
    />

    <p v-if="isLoading">Loading...</p>
    <p v-else-if="error">{{ error }}</p>
    <p v-else-if="visibleProducts.length === 0">No products found</p>

    <ProductList v-else :products="visibleProducts" />
  </main>
</template>
```

### Checklist

- [ ] props идут вниз
- [ ] изменения filters идут через `v-model` или emits
- [ ] list получает уже derived data (`visibleProducts`)

---

## Шаг 11. Проверить `ref` vs `reactive`

В проекте должно быть осознанное использование:

- `ref` для primitives и arrays
- `reactive` *(optional)* для grouped UI state

### Checklist

- [ ] могу показать, где используется `ref`
- [ ] могу объяснить, почему не смешал всё хаотично
- [ ] понимаю, где `.value` нужен, а где нет

---

## Шаг 12. Проверить `computed` vs `watch`

### `computed` используется для

- filtered list
- sorted list
- count / summary text

### `watch` используется для

- fetch reload
- localStorage sync
- debounced search *(optional)*

### Checklist

- [ ] нет `watch`, который просто дублирует `computed`
- [ ] нет side effects внутри `computed`
- [ ] `computed` и `watch` используются по назначению

---

## Шаг 13. Добавить UX states

Минимум 3 состояния:

```vue
<p v-if="isLoading">Loading...</p>
<p v-else-if="error">{{ error }}</p>
<p v-else-if="visibleProducts.length === 0">No products found</p>
<ProductList v-else :products="visibleProducts" />
```

### Checklist

- [ ] loading state есть
- [ ] error state есть
- [ ] empty state есть

---

## Шаг 14. Проверить поток данных в DevTools

Открой Vue DeTools и проверь:

1. где живут `products`, `query`, `sortBy`
2. как меняется `visibleProducts`
3. что происходит при fetch error
4. как rerender-ятся child components

### Checklist

- [ ] могу объяснить data flow whole app
- [ ] могу объяснить роль каждого composable
- [ ] могу объяснить props/emits chain

---

## Шаг 15. Привести UI в порядок

Минимальный UX:

- заголовок приложения
- понятные filters
- readable cards/list
- loading/error/empty states
- базовые отступы

### Checklist

- [ ] приложение выглядит аккуратно
- [ ] filters и list понятны без объяснений
- [ ] используется `<style scoped>`

---

## Шаг 16. Прогнать lint и build

```bash
npm run lint
npm run build
```

### Checklist

- [ ] lint проходит
- [ ] build проходит

---

## Шаг 17. Сделать финальную самопроверку

Ответь без подсказок:

1. Чем `ref` отличается от `reactive`?
2. Когда нужен `computed`, а когда `watch`?
3. Зачем composables?
4. Почему props readonly?
5. Как работает `v-model:query` на custom component?
6. Где в проекте async logic и как обрабатывается error?

### Checklist

- [ ] могу объяснить reactivity flow
- [ ] могу объяснить composables boundaries
- [ ] могу объяснить component communication

---

## Финальный checklist Module 2

Module 2 можно считать завершённым, если:

### Проект

- [ ] есть 1 законченное приложение
- [ ] проект запускается без ошибок
- [ ] есть search/filter/sort или эквивалентная logic
- [ ] есть async scenario с loading/error

### Технические требования

- [ ] компоненты написаны через `<script setup lang="ts">`
- [ ] используются `ref` и/или `reactive`
- [ ] используется `computed`
- [ ] используется `watch` или `watchEffect` по делу
- [ ] используется lifecycle hook (`onMounted` минимум)
- [ ] используются `defineProps` и `defineEmits`
- [ ] минимум **2 composables**

### Понимание

- [ ] понимаю разницу `ref` и `reactive`
- [ ] понимаю разницу `computed` и `watch`
- [ ] понимаю props down / events up
- [ ] могу объяснить, почему проект на Composition API, а не Options API

---

## Stretch goals *(optional)*

Если основной MVP уже готов:

- debounced search через `watch`
- save filters в `localStorage`
- category filter
- selected product panel
- `defineExpose` + focus on search input
- abort stale fetch через `onCleanup`
- вынести API layer в `services/products.ts`

Не обязательно для закрытия Module 2, но полезно для закрепления.

---

## Если что-то пошло не так

### UI не обновляется

- проверь `.value` в script
- проверь, что state reactive
- проверь, не мутируешь ли props

### Filter/sort не работает

- проверь, что list берётся из `computed`, а не из raw array
- в `sort` используй copy: `[...array].sort(...)`

### Fetch ломается из-за CORS

- используй mock data на этом этапе
- или public mock API вроде `jsonplaceholder` / local json file

### Слишком много logic в `App.vue`

- вынеси fetch в `useProducts`
- вынеси filters в `useProductFilters`
- UI разбей на components

### `watch` срабатывает слишком часто

- debounce search
- не дублируй то, что уже решает `computed`

---

## Что делать после Module 2

Переходи к **Module 3 · Компонентная архитектура**:

- slots
- декомпозиция UI
- container/presentational components
- базовая a11y

Если выбрал **Product Catalog** или **Movie Search** как сквозной проект — не выбрасывай его. В Module 3 можно улучшить cards, modal и reusable UI primitives.

---

## Мини-конспект

- Module 2 = reactivity + Composition API + composables + простой async
- цель — уверенно строить stateful Vue apps без router/store
- лучше один catalog/search MVP с 2 composables, чем сложный недоделанный проект
- props down, events up, derived data через `computed`, side effects через `watch`
