# Module 2 · Теория: `watch`

Этот материал закрывает четвёртый теоретический пункт `Module 2`: понять, **что такое `watch`**, **когда нужны side effects**, **как следить за `ref` и reactive state** и **чем `watch` отличается от `computed`**.

Связанные материалы:

- [Module 2 · ref](./01-ref.md)
- [Module 2 · reactive](./02-reactive.md)
- [Module 2 · computed](./03-computed.md)

---

## 1. Что такое `watch`

**`watch`** позволяет **реагировать на изменения reactive state** и выполнять **side effects**.

Side effect — это действие, которое не просто возвращает новое значение, а что-то делает:

- `fetch`
- запись в `localStorage`
- смена другого state
- логирование
- debounce-поиск

```ts
import { ref, watch } from 'vue'

const query = ref('')

watch(query, (newValue, oldValue) => {
  console.log('query changed:', oldValue, '→', newValue)
})
```

Официально:

- [Watchers · Vue.js](https://vuejs.org/guide/essentials/watchers.html)
- [watch() · API](https://vuejs.org/api/reactivity-core.html#watch)

---

## 2. `computed` vs `watch`

| | `computed` | `watch` |
|---|-----------|---------|
| Задача | получить derived value | выполнить reaction |
| Возвращает значение | ✅ | ❌ |
| Side effects | ❌ не нужны | ✅ основной кейс |
| Когда запускается | при чтении dependencies | когда source изменился |
| Для template | ✅ | обычно нет |

### Простое правило

```text
нужно вычислить значение → computed
нужно что-то сделать при изменении → watch
```

### Пример

```ts
// ✅ derived value
const filteredProducts = computed(() => {
  return products.value.filter((p) => p.name.includes(query.value))
})

// ✅ side effect
watch(query, (newQuery) => {
  localStorage.setItem('lastQuery', newQuery)
})
```

---

## 3. Базовый пример с `ref`

```vue
<script setup lang="ts">
import { ref, watch } from 'vue'

const count = ref(0)

watch(count, (newCount, oldCount) => {
  console.log(`${oldCount} → ${newCount}`)
})

function increment() {
  count.value++
}
</script>

<template>
  <p>Count: {{ count }}</p>
  <button @click="increment">+1</button>
</template>
```

### Что здесь важно

- первый аргумент — source
- второй — callback
- callback получает `newValue` и `oldValue`

---

## 4. Какие source types поддерживает `watch`

### 1. `ref`

```ts
watch(count, (newCount) => {
  console.log(newCount)
})
```

### 2. getter function

```ts
watch(
  () => state.query,
  (newQuery) => {
    console.log(newQuery)
  },
)
```

### 3. несколько sources

```ts
watch([query, sortBy], ([newQuery, newSortBy]) => {
  console.log(newQuery, newSortBy)
})
```

### 4. `computed ref`

```ts
const hasResults = computed(() => filteredProducts.value.length > 0)

watch(hasResults, (value) => {
  console.log('has results:', value)
})
```

---

## 5. Как watch-ить property у `reactive`

Нельзя так:

```ts
const state = reactive({ count: 0 })

watch(state.count, () => {}) // ❌
```

`state.count` — это number, а не reactive source.

Нужен getter:

```ts
watch(
  () => state.count,
  (newCount) => {
    console.log(newCount)
  },
)
```

Или watch-ить весь reactive object:

```ts
watch(state, (newState) => {
  console.log(newState)
})
```

---

## 6. Deep watch

По умолчанию `watch`:

- для `ref` с object следит за заменой `.value`
- для getter — за изменением возвращаемого значения

### Watch reactive object целиком

```ts
const state = reactive({
  filters: {
    query: '',
    sortBy: 'name',
  },
})

watch(state, (newState) => {
  console.log('state changed', newState)
})
```

Такой watch будет **deep** автоматически.

### Явный deep option

```ts
watch(
  () => state.filters,
  (filters) => {
    console.log(filters)
  },
  { deep: true },
)
```

### Важно

При nested mutations `newValue` и `oldValue` часто будут **одним и тем же object reference**.

```ts
state.filters.query = 'keyboard'
// oldValue === newValue // true
```

Это нормальное поведение Vue.

---

## 7. `immediate: true`

По умолчанию `watch` **lazy**: callback не вызывается сразу, только после первого изменения.

Иногда нужно выполнить logic сразу при setup:

```ts
watch(
  query,
  (newQuery) => {
    console.log('search:', newQuery)
  },
  { immediate: true },
)
```

Это полезно для:

- initial fetch
- sync с URL query params
- загрузки сохранённых фильтров

---

## 8. Типичный кейс Module 2: async fetch

Один из пунктов практики Module 2 — **простая загрузка данных через `fetch`**.

```vue
<script setup lang="ts">
import { ref, watch } from 'vue'

type Product = {
  id: number
  name: string
  price: number
}

const category = ref('phones')
const products = ref<Product[]>([])
const isLoading = ref(false)
const error = ref('')

async function loadProducts(categoryId: string) {
  isLoading.value = true
  error.value = ''

  try {
    const response = await fetch(`/api/products?category=${categoryId}`)

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

watch(
  category,
  (newCategory) => {
    loadProducts(newCategory)
  },
  { immediate: true },
)
</script>

<template>
  <section>
    <select v-model="category">
      <option value="phones">Phones</option>
      <option value="laptops">Laptops</option>
    </select>

    <p v-if="isLoading">Loading...</p>
    <p v-else-if="error">{{ error }}</p>

    <ul v-else>
      <li v-for="product in products" :key="product.id">
        {{ product.name }} — {{ product.price }}
      </li>
    </ul>
  </section>
</template>
```

Здесь:

- `category` — source state
- `watch` запускает side effect
- `products` — результат fetch
- `computed` здесь не подходит, потому что нужен async side effect

---

## 9. Debounced search через `watch`

Иногда не нужно реагировать на каждый keystroke.

```ts
import { ref, watch } from 'vue'

const query = ref('')
let timeoutId: number | undefined

watch(query, (newQuery) => {
  window.clearTimeout(timeoutId)

  timeoutId = window.setTimeout(() => {
    console.log('search request:', newQuery)
  }, 300)
})
```

Позже такую логику можно вынести в composable.

---

## 10. Сохранение фильтров в `localStorage`

```ts
const query = ref(localStorage.getItem('catalog-query') ?? '')

watch(query, (newQuery) => {
  localStorage.setItem('catalog-query', newQuery)
})
```

Это хороший пример side effect, который **не должен** жить в `computed`.

---

## 11. Когда `watch` нужен, а когда нет

### Нужен `watch`, если:

- async request
- sync с API / storage / URL
- logging / analytics
- manual DOM work *(редко в Vue apps)*
- reaction на изменение одного state для обновления другого, если это не derived value

### Не нужен `watch`, если:

- значение можно вывести из другого state

```ts
// ❌ лишний watch
const fullName = ref('')

watch([firstName, lastName], () => {
  fullName.value = `${firstName.value} ${lastName.value}`
})

// ✅ computed
const fullName = computed(() => `${firstName.value} ${lastName.value}`)
```

---

## 12. Cleanup для stale async requests

Если source меняется быстрее, чем завершается `fetch`, старый request может перезаписать новые data.

```ts
watch(category, async (newCategory, _oldCategory, onCleanup) => {
  let cancelled = false

  onCleanup(() => {
    cancelled = true
  })

  const response = await fetch(`/api/products?category=${newCategory}`)
  const data = await response.json()

  if (!cancelled) {
    products.value = data
  }
})
```

Или через `AbortController`:

```ts
watch(category, async (newCategory, _oldCategory, onCleanup) => {
  const controller = new AbortController()

  onCleanup(() => {
    controller.abort()
  })

  const response = await fetch(`/api/products?category=${newCategory}`, {
    signal: controller.signal,
  })

  products.value = await response.json()
})
```

Это важно для реальных async-сценариев Module 2.

---

## 13. Остановка watcher

`watch()` возвращает stop handle:

```ts
const stop = watch(query, (value) => {
  console.log(value)
})

stop()
```

Обычно в компонентах это не нужно вручную: watcher, созданный синхронно в `<script setup>`, автоматически останавливается при unmount.

### Важно

Watcher, созданный внутри `setTimeout` или другого async callback, **не привяжется** к компоненту автоматически.

```ts
// ❌ плохо
setTimeout(() => {
  watch(query, () => {})
}, 100)

// ✅ лучше
watch(query, () => {})
```

---

## 14. `watch` vs `watchEffect` — короткий preview

В Module 2 следующий блок — отдельный урок про **`watchEffect`**.

Кратко:

| | `watch` | `watchEffect` |
|---|--------|---------------|
| Source | указываешь явно | dependencies собираются автоматически |
| Контроль | точнее | удобнее |
| Lazy by default | ✅ | ❌, запускается сразу |

Пример, который позже упростится через `watchEffect`:

```ts
watch(
  category,
  async () => {
    products.value = await fetchProducts(category.value)
  },
  { immediate: true },
)
```

---

## 15. TypeScript и `watch`

### С `ref`

```ts
const query = ref('')

watch(query, (newQuery, oldQuery) => {
  // newQuery: string
  // oldQuery: string | undefined on first run without immediate
})
```

### С getter

```ts
watch(
  () => state.sortBy,
  (sortBy: 'name' | 'price') => {
    console.log(sortBy)
  },
)
```

---

## 16. Частые ошибки

### Использовали `watch` вместо `computed`

```ts
watch(query, () => {
  filtered.value = products.value.filter(...)
}) // ❌ если можно computed
```

### Watch property reactive object напрямую

```ts
watch(state.query, () => {}) // ❌
watch(() => state.query, () => {}) // ✅
```

### Забыли `immediate: true` для initial fetch

```ts
watch(category, loadProducts) // ❌ не загрузит сразу
watch(category, loadProducts, { immediate: true }) // ✅
```

### Не обработали race condition в async watch

```ts
watch(id, async (newId) => {
  products.value = await fetchProducts(newId) // ⚠️ stale response possible
})
```

### Side effects в `computed`

```ts
const data = computed(async () => {
  return fetch('/api') // ❌
})
```

---

## 17. Что важно понять после этого блока

Проверь себя:

1. Для чего нужен `watch`?
2. Чем `watch` отличается от `computed`?
3. Как watch-ить property у `reactive` object?
4. Зачем нужен `{ immediate: true }`?
5. Почему async fetch — типичный кейс для `watch`?
6. Зачем нужен cleanup в async watcher?

---

## 18. Что почитать

### Официальное

- [Watchers · Vue.js](https://vuejs.org/guide/essentials/watchers.html)
- [Watchers · Vue.js RU](https://ru.vuejs.org/guide/essentials/watchers.html)
- [watch() · API](https://vuejs.org/api/reactivity-core.html#watch)

### Связанные материалы этого плана

- [Module 2 · computed](./03-computed.md)
- [Module 2 · reactive](./02-reactive.md)

---

## 19. Практическое мини-задание

Доработай catalog app:

1. Добавь `watch` на `catalog.query`
2. При изменении query сохраняй значение в `localStorage`
3. При первом mount восстанови query из `localStorage`
4. Добавь `watch` на `catalog.sortBy` и логируй новое значение в console

### Подсказка

```ts
watch(
  () => catalog.query,
  (newQuery) => {
    localStorage.setItem('catalog-query', newQuery)
  },
)
```

Если хочешь усложнить:

- добавь mock fetch по category/filter
- добавь `isLoading` и `error`
- отменяй stale request через `onCleanup`

---

## 20. Мини-конспект

- `watch` реагирует на изменения reactive source
- используется для side effects, не для derived values
- source может быть `ref`, getter или array of sources
- property reactive object watch-ят через getter
- `{ immediate: true }` запускает callback сразу
- async fetch, storage sync и debounce — типичные кейсы
- для auto-tracked effects есть `watchEffect`

---

## 21. Что делать дальше

Следующий теоретический блок Module 2:

- **[`watchEffect`](./05-watchEffect.md)**

Если `watch` требует явно указать source, то `watchEffect` автоматически собирает dependencies внутри callback.
