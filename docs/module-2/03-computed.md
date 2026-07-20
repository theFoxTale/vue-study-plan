# Module 2 · Теория: `computed`

Этот материал закрывает третий теоретический пункт `Module 2`: понять, **что такое `computed`**, **когда использовать derived state**, **чем computed отличается от methods** и **как применять его для фильтрации и сортировки**.

Связанные материалы:

- [Module 2 · ref](./01-ref.md)
- [Module 2 · reactive](./02-reactive.md)
- [Module 1 · v-for](../module-1/10-v-for.md)

---

## 1. Что такое `computed`

**`computed`** — это **вычисляемое reactive значение**, которое автоматически пересчитывается, когда меняются его зависимости.

```ts
import { ref, computed } from 'vue'

const count = ref(0)

const doubled = computed(() => count.value * 2)
```

`computed()` принимает getter-функцию и возвращает **computed ref**.

```ts
doubled.value // 0
count.value = 3
doubled.value // 6
```

Официально:

- [Computed Properties · Vue.js](https://vuejs.org/guide/essentials/computed.html)
- [computed() · API](https://vuejs.org/api/reactivity-core.html#computed)

---

## 2. Зачем нужен `computed`

Иногда в template можно написать выражение:

```vue
<p>{{ todos.length > 0 ? 'Has todos' : 'Empty' }}</p>
```

Но если логика усложняется, template становится трудно читать и поддерживать.

### Плохо: слишком много логики в template

```vue
<ul>
  <li
    v-for="product in products.filter(p => p.name.includes(query)).sort((a, b) => a.name.localeCompare(b.name))"
    :key="product.id"
  >
    {{ product.name }}
  </li>
</ul>
```

### Лучше: вынести в `computed`

```ts
const visibleProducts = computed(() => {
  return products.value
    .filter((product) => product.name.includes(query.value))
    .sort((a, b) => a.name.localeCompare(b.name))
})
```

```vue
<ul>
  <li v-for="product in visibleProducts" :key="product.id">
    {{ product.name }}
  </li>
</ul>
```

### Главная идея

```text
source state → computed → derived value for UI
```

---

## 3. Базовый пример

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

const firstName = ref('Ann')
const lastName = ref('Smith')

const fullName = computed(() => {
  return `${firstName.value} ${lastName.value}`
})
</script>

<template>
  <p>{{ fullName }}</p>
</template>
```

### Что здесь важно

- `computed` возвращает ref-like значение
- в script: `fullName.value`
- в template: просто `fullName`
- при изменении `firstName` или `lastName` `fullName` обновится автоматически

---

## 4. Как работает `computed` упрощённо

```text
computed getter runs
   ↓
Vue tracks reactive dependencies used inside
   ↓
dependencies change
   ↓
computed recalculates
   ↓
template updates
```

### Пример зависимостей

```ts
const query = ref('')
const products = ref([...])

const filteredProducts = computed(() => {
  return products.value.filter((product) =>
    product.name.toLowerCase().includes(query.value.toLowerCase()),
  )
})
```

`filteredProducts` зависит от:

- `products`
- `query`

Если изменится только `query`, Vue пересчитает только этот computed.

---

## 5. `computed` vs method

На первый взгляд method может делать то же самое:

```vue
<p>{{ getFullName() }}</p>
```

```ts
function getFullName() {
  return `${firstName.value} ${lastName.value}`
}
```

### Разница

| | `computed` | method |
|---|-----------|--------|
| Когда пересчитывается | только когда изменились dependencies | при каждом rerender |
| Кэширование | ✅ есть | ❌ нет |
| Для derived state | ✅ идеально | ⚠️ обычно хуже |
| Для actions/events | ❌ | ✅ |

### Когда method лучше

```vue
<button @click="submitForm">Save</button>
```

Submit — это **действие**, а не derived value. Для такого нужен method, не computed.

---

## 6. Кэширование — ключевая фича

```ts
const expensiveList = computed(() => {
  console.log('recalculate')
  return bigArray.value.filter(/* heavy logic */)
})
```

Если dependencies не менялись:

```ts
expensiveList.value
expensiveList.value
expensiveList.value
```

getter выполнится **один раз**, а не три.

### Важный нюанс

```ts
const now = computed(() => Date.now())
```

`Date.now()` **не reactive dependency**, поэтому такой computed не будет обновляться сам по себе при rerender.

---

## 7. Типичные кейсы для `computed`

### Derived text

```ts
const statusText = computed(() => {
  return isLoading.value ? 'Loading...' : 'Ready'
})
```

### Filter

```ts
const filteredTodos = computed(() => {
  return todos.value.filter((todo) =>
    todo.text.toLowerCase().includes(query.value.toLowerCase()),
  )
})
```

### Sort

```ts
const sortedProducts = computed(() => {
  return [...products.value].sort((a, b) => a.name.localeCompare(b.name))
})
```

### Count / summary

```ts
const completedCount = computed(() => {
  return todos.value.filter((todo) => todo.done).length
})
```

### Boolean flags

```ts
const hasResults = computed(() => filteredProducts.value.length > 0)
const isFormValid = computed(() => email.value.includes('@') && password.value.length >= 8)
```

---

## 8. Пример для Module 2 practice: каталог товаров

Это прямое продолжение [reactive](./02-reactive.md)-урока.

```vue
<script setup lang="ts">
import { reactive, computed } from 'vue'

type Product = {
  id: number
  name: string
  price: number
}

const catalog = reactive({
  query: '',
  sortBy: 'name' as 'name' | 'price',
  products: [
    { id: 1, name: 'Keyboard', price: 80 },
    { id: 2, name: 'Mouse', price: 40 },
    { id: 3, name: 'Monitor', price: 300 },
  ] as Product[],
})

const visibleProducts = computed(() => {
  const normalizedQuery = catalog.query.trim().toLowerCase()

  const filtered = catalog.products.filter((product) => {
    if (!normalizedQuery) return true
    return product.name.toLowerCase().includes(normalizedQuery)
  })

  return [...filtered].sort((a, b) => {
    if (catalog.sortBy === 'price') {
      return a.price - b.price
    }

    return a.name.localeCompare(b.name)
  })
})

const totalCount = computed(() => visibleProducts.value.length)
</script>

<template>
  <section>
    <input v-model="catalog.query" placeholder="Search products..." />

    <select v-model="catalog.sortBy">
      <option value="name">By name</option>
      <option value="price">By price</option>
    </select>

    <p>Found: {{ totalCount }}</p>

    <ul>
      <li v-for="product in visibleProducts" :key="product.id">
        {{ product.name }} — {{ product.price }}
      </li>
    </ul>
  </section>
</template>
```

Здесь:

- `catalog` хранит source state
- `visibleProducts` — derived list
- `totalCount` — derived summary

---

## 9. `computed` с `ref` и `reactive`

### С `ref`

```ts
const todos = ref<Todo[]>([])
const query = ref('')

const filteredTodos = computed(() => {
  return todos.value.filter((todo) => todo.text.includes(query.value))
})
```

### С `reactive`

```ts
const state = reactive({
  query: '',
  todos: [] as Todo[],
})

const filteredTodos = computed(() => {
  return state.todos.filter((todo) => todo.text.includes(state.query))
})
```

Оба варианта нормальны. Главное — не смешивать стили хаотично в одном компоненте.

---

## 10. Writable computed

По умолчанию computed — **read-only**.

Но иногда нужен getter + setter:

```ts
const firstName = ref('Ann')
const lastName = ref('Smith')

const fullName = computed({
  get() {
    return `${firstName.value} ${lastName.value}`
  },
  set(value: string) {
    const [first, last] = value.split(' ')
    firstName.value = first
    lastName.value = last ?? ''
  },
})
```

```ts
fullName.value = 'John Doe'
```

На старте writable computed нужен редко. Обычно достаточно обычного read-only computed.

---

## 11. Best practices

### 1. Computed должен быть pure

Внутри getter не должно быть:

- API calls
- `fetch`
- изменения другого state
- работы с DOM

```ts
// ❌ плохо
const users = computed(async () => {
  const response = await fetch('/api/users')
  return response.json()
})
```

Для side effects есть `watch` / `watchEffect`.

### 2. Не мутируй computed value

```ts
const sorted = computed(() => [...items.value].sort(...))

sorted.value.push(newItem) // ❌
items.value.push(newItem) // ✅
```

Computed — это **snapshot derived state**, а не место для записи.

### 3. Не дублируй source state

```ts
// ❌ плохо
const filteredProducts = ref<Product[]>([])

watch(query, () => {
  filteredProducts.value = products.value.filter(...)
})

// ✅ лучше
const filteredProducts = computed(() => {
  return products.value.filter(...)
})
```

Если значение можно **вывести** из другого state — используй `computed`.

---

## 12. `computed` vs логика прямо в template

### Используй template expression, если:

- одна простая операция
- нет повторного использования
- код остаётся читаемым

```vue
<p>{{ todos.length }}</p>
```

### Используй `computed`, если:

- есть filter/sort/map/reduce
- логика повторяется
- нужно имя для derived value
- template становится шумным

---

## 13. TypeScript и `computed`

### Автовывод типа

```ts
const count = ref(0)

const doubled = computed(() => count.value * 2)
// ComputedRef<number>
```

### Явная типизация

```ts
type Product = {
  id: number
  name: string
  price: number
}

const products = ref<Product[]>([])

const cheapestProduct = computed<Product | null>(() => {
  if (products.value.length === 0) return null
  return [...products.value].sort((a, b) => a.price - b.price)[0]
})
```

---

## 14. Частые ошибки

### Забыли `.value` в script

```ts
const fullName = computed(() => `${firstName} ${lastName}`) // ❌
const fullName = computed(() => `${firstName.value} ${lastName.value}`) // ✅
```

### Использовали computed для side effect

```ts
const saveData = computed(() => {
  localStorage.setItem('query', query.value) // ❌
  return query.value
})
```

### Мутировали исходный массив в sort

```ts
const sorted = computed(() => {
  return products.value.sort(...) // ❌ мутирует source array
})

const sorted = computed(() => {
  return [...products.value].sort(...) // ✅
})
```

### Вызывали computed как function

```vue
<p>{{ fullName() }}</p> <!-- ❌ -->
<p>{{ fullName }}</p> <!-- ✅ -->
```

---

## 15. Когда НЕ нужен `computed`

Не нужен, если:

- значение не derived, а source state
- нужно выполнить action по событию
- нужен side effect
- логика тривиальна и используется один раз

```ts
// source state
const query = ref('')

// action
function submitSearch() {
  console.log('search:', query.value)
}
```

---

## 16. Что важно понять после этого блока

Проверь себя:

1. Что возвращает `computed()`?
2. Чем `computed` отличается от method?
3. Почему у computed есть caching?
4. Можно ли делать `fetch` внутри computed?
5. Зачем `[...array].sort()` вместо `array.sort()`?
6. Когда derived list лучше вынести в computed?

---

## 17. Что почитать

### Официальное

- [Computed Properties · Vue.js](https://vuejs.org/guide/essentials/computed.html)
- [Computed Properties · Vue.js RU](https://ru.vuejs.org/guide/essentials/computed.html)
- [computed() · API](https://vuejs.org/api/reactivity-core.html#computed)

### Связанные материалы этого плана

- [Module 2 · ref](./01-ref.md)
- [Module 2 · reactive](./02-reactive.md)
- [Module 1 · v-for](../module-1/10-v-for.md)

---

## 18. Практическое мини-задание

Доработай `ProductFilters.vue` из урока про `reactive`:

1. Добавь `visibleProducts` через `computed`
2. Реализуй filter по `query`
3. Реализуй sort по `sortBy`
4. Добавь `totalCount` computed
5. Выведи `Found: {{ totalCount }}`

### Подсказка

```ts
const visibleProducts = computed(() => {
  const normalizedQuery = state.query.trim().toLowerCase()

  const filtered = state.products.filter((product) => {
    if (!normalizedQuery) return true
    return product.name.toLowerCase().includes(normalizedQuery)
  })

  return [...filtered].sort((a, b) => {
    if (state.sortBy === 'price') {
      return a.price - b.price
    }

    return a.name.localeCompare(b.name)
  })
})
```

---

## 19. Мини-конспект

- `computed()` создаёт derived reactive value
- пересчитывается только при изменении dependencies
- кэширует результат
- идеален для filter, sort, count, formatted text
- getter должен быть pure, без side effects
- для actions используй methods, для reactions — `watch`

---

## 20. Что делать дальше

Следующий теоретический блок Module 2:

- **[`watch`](./04-watch.md)**

Если `computed` отвечает на вопрос «какое значение получить из state», то `watch` — на вопрос «что сделать, когда state изменился».
