# Module 2 · Теория: отличие `Composition API` от `Options API`

Этот материал закрывает **финальный теоретический пункт `Module 2`**: понять **два стиля Vue API**, **чем они отличаются**, **когда какой использовать** и **почему в этом учебном плане основной путь — Composition API**.

Связанные материалы:

- [Module 2 · ref](./01-ref.md)
- [Module 2 · computed](./03-computed.md)
- [Module 2 · defineProps](./07-defineProps.md)
- [Module 2 · defineEmits](./08-defineEmits.md)

---

## 1. Два API-стиля Vue

Vue 3 поддерживает два способа описывать logic компонента:

| Стиль | Как выглядит |
|------|--------------|
| **Options API** | `data`, `methods`, `computed`, `watch`, `mounted` |
| **Composition API** | `ref`, `computed`, `watch`, `onMounted`, `<script setup>` |

Оба стиля работают **на одной и той же reactivity system**.

```text
Options API
   ↓
реализован поверх Composition API
   ↓
одни и те же core concepts
```

Официально:

- [Introduction · API Styles · Vue.js](https://vuejs.org/guide/introduction.html#api-styles)
- [Composition API FAQ · Vue.js](https://vuejs.org/guide/extras/composition-api-faq.html)

---

## 2. Один и тот же counter: два стиля

### Options API

```vue
<script>
export default {
  data() {
    return {
      count: 0,
    }
  },
  methods: {
    increment() {
      this.count++
    },
  },
  mounted() {
    console.log(`Initial count: ${this.count}`)
  },
}
</script>

<template>
  <button @click="increment">Count is: {{ count }}</button>
</template>
```

### Composition API

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'

const count = ref(0)

function increment() {
  count.value++
}

onMounted(() => {
  console.log(`Initial count: ${count.value}`)
})
</script>

<template>
  <button @click="increment">Count is: {{ count }}</button>
</template>
```

Template одинаковый. Меняется только способ организации script logic.

---

## 3. Главная разница в mental model

### Options API

Центр — **component instance** и `this`.

```text
data()
methods
computed
watch
mounted
   ↓
всё живёт в option groups
   ↓
this.count, this.increment()
```

Похоже на class-based thinking.

### Composition API

Центр — **functions + reactive state** в function scope.

```text
ref / reactive
computed
watch
onMounted
   ↓
logic grouped by feature, not by option type
   ↓
count.value, increment()
```

Похоже на functional composition.

---

## 4. Таблица соответствия API

| Задача | Options API | Composition API |
|--------|-------------|-----------------|
| State | `data()` | `ref`, `reactive` |
| Methods | `methods` | functions |
| Derived value | `computed` | `computed()` |
| Side effects | `watch` | `watch`, `watchEffect` |
| Mount | `mounted` | `onMounted` |
| Update | `updated` | `onUpdated` |
| Unmount | `unmounted` | `onUnmounted` |
| Props | `props: {}` | `defineProps()` |
| Events | `emits` + `this.$emit` | `defineEmits()` + `emit()` |
| Expose API | `expose: []` | `defineExpose()` |
| Template access | `this.xxx` | top-level bindings |

---

## 5. Как Options API группирует код

В Options API logic разбита **по типу option**:

```js
export default {
  data() {
    return { query: '', products: [] }
  },
  computed: {
    filteredProducts() {}
  },
  watch: {
    query() {}
  },
  methods: {
    loadProducts() {}
  },
  mounted() {}
}
```

Проблема в больших компонентах:

```text
query logic
   ↓
размазана между data / computed / watch / methods / mounted
```

Чтобы понять одну feature, нужно прыгать по файлу.

---

## 6. Как Composition API группирует код

В Composition API logic можно группировать **по feature**:

```ts
// filters
const query = ref('')
const sortBy = ref('name')

// products
const products = ref([])
const isLoading = ref(false)

const visibleProducts = computed(() => { /* ... */ })

watch(query, () => { /* ... */ })

async function loadProducts() { /* ... */ }

onMounted(loadProducts)
```

А ещё лучше — вынести в composable:

```ts
const { products, isLoading, error, loadProducts } = useProducts()
const { query, sortBy, visibleProducts } = useProductFilters(products)
```

Это одна из главных причин, почему Composition API удобнее для Module 2 practice.

---

## 7. Пример catalog feature в двух стилях

### Options API

```js
export default {
  props: {
    category: String,
  },
  emits: ['select'],
  data() {
    return {
      query: '',
      sortBy: 'name',
      products: [],
      isLoading: false,
      error: '',
    }
  },
  computed: {
    visibleProducts() {
      return this.products
        .filter((p) => p.name.includes(this.query))
        .sort((a, b) => a.name.localeCompare(b.name))
    },
  },
  watch: {
    category: {
      handler: 'loadProducts',
      immediate: true,
    },
  },
  methods: {
    async loadProducts() {
      this.isLoading = true
      this.error = ''
      try {
        const response = await fetch(`/api/products?category=${this.category}`)
        this.products = await response.json()
      } catch (err) {
        this.error = 'Failed to load'
      } finally {
        this.isLoading = false
      }
    },
    onSelect(id) {
      this.$emit('select', id)
    },
  },
}
```

### Composition API

```vue
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'

const props = defineProps<{ category: string }>()
const emit = defineEmits<{ select: [id: number] }>()

const query = ref('')
const sortBy = ref<'name' | 'price'>('name')
const products = ref([])
const isLoading = ref(false)
const error = ref('')

const visibleProducts = computed(() => {
  return products.value
    .filter((p) => p.name.includes(query.value))
    .sort((a, b) => a.name.localeCompare(b.name))
})

async function loadProducts() {
  isLoading.value = true
  error.value = ''

  try {
    const response = await fetch(`/api/products?category=${props.category}`)
    products.value = await response.json()
  } catch {
    error.value = 'Failed to load'
  } finally {
    isLoading.value = false
  }
}

watch(
  () => props.category,
  () => {
    loadProducts()
  },
  { immediate: true },
)

function onSelect(id: number) {
  emit('select', id)
}
</script>
```

Composition version:

- ближе к тому, что ты уже проходил в Module 2
- проще типизировать через TypeScript
- проще вынести `loadProducts` и filters в composables

---

## 8. Плюсы Options API

- проще стартовать новичку
- привычно, если пришёл из OOP/class-style frameworks
- option groups навязывают структуру
- reactivity частично «скрыта» за `this`

### Когда Options API всё ещё встречается

- legacy Vue 2 / ранний Vue 3 code
- простые компоненты без сложной logic
- progressive enhancement без build setup

---

## 9. Плюсы Composition API

- logic можно группировать по feature
- composables переиспользуют logic между компонентами
- лучше TypeScript inference
- `<script setup>` меньше boilerplate
- проще работать со сложными сценариями: fetch, filters, async, cleanup

### Почему это основной путь учебного плана

Из `README.md`:

```text
Основной путь этого плана - Composition API
Options API стоит знать на уровне чтения чужого и legacy-кода
```

То есть:

- **писать новый код** → Composition API
- **читать старый код** → понимать Options API

---

## 10. Что общего у обоих стилей

Независимо от API, concepts одни и те же:

- reactive state
- derived values
- watchers / side effects
- lifecycle
- props down / events up
- SFC: template + script + style

Если ты понял Module 2 через Composition API, Options API станет просто **другим синтаксисом** для тех же идей.

---

## 11. `<script setup>` — recommended Composition style

В этом плане используется именно `<script setup>`:

```vue
<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)
</script>
```

Плюсы:

- top-level bindings доступны в template
- `defineProps`, `defineEmits`, `defineExpose` без boilerplate
- лучше performance и TS support

Старый Composition style через `setup()`:

```js
export default {
  setup() {
    const count = ref(0)
    return { count }
  },
}
```

Он всё ещё valid, но для SFC-проектов `<script setup>` предпочтительнее.

---

## 12. Как читать legacy Options API code

Если видишь:

```js
this.products
this.loadProducts()
this.$emit('select', id)
mounted() {}
```

Переводи mentally так:

| Legacy | Composition equivalent |
|--------|------------------------|
| `this.products` | `products.value` or `state.products` |
| `this.loadProducts()` | `loadProducts()` |
| `this.$emit('select', id)` | `emit('select', id)` |
| `mounted()` | `onMounted()` |
| `props: { ... }` | `defineProps()` |

---

## 13. Можно ли смешивать API?

Технически — да, но **не рекомендуется** смешивать в одном компоненте без необходимости.

```text
новый код      → Composition API + <script setup>
legacy code    → Options API
migration      → постепенно, feature by feature
```

Для учебного проекта держись одного стиля.

---

## 14. Какой API выбрать

### Для обучения по этому плану

```text
Composition API + <script setup> + TypeScript
```

### Для production full apps

Vue officially recommends:

```text
Composition API + SFC
```

### Для чтения старого code

```text
Options API — know enough to navigate
```

---

## 15. Как Module 2 складывается в Composition API

В Module 2 ты прошёл building blocks Composition API:

| Topic | Role |
|-------|------|
| `ref` / `reactive` | state |
| `computed` | derived data |
| `watch` / `watchEffect` | side effects |
| lifecycle hooks | mount/update/unmount |
| `defineProps` / `defineEmits` | component communication |
| `defineExpose` | rare imperative API |

Options API — это другой синтаксис для тех же building blocks.

---

## 16. Что дальше по практике Module 2

Теория Module 2 завершена. Следующий шаг — **практика**:

1. catalog app с products list
2. search + sort через `computed`
3. fetch через `watch` / `onMounted`
4. вынести минимум 2 composables
5. разбить UI на child components с props/emits

Критерии завершения из `README.md`:

- понимать разницу `ref` и `reactive`
- хотя бы 2 composables
- `computed` и `watch` по назначению
- простой async с loading/error handling

---

## 17. Частые ошибки мышления

### «Options API устарел полностью»

Нет. Он поддерживается, но не является основным путём для новых full apps.

### «Composition API = сложнее»

На старте да, потому что видна reactivity (`ref`, `.value`). Но для real apps он обычно **проще поддерживать**.

### «Нужно выучить оба одинаково глубоко»

Для этого плана:

```text
Composition API — deeply
Options API — read-level
```

### «Composable = просто function»

Composable — это function, которая **использует Vue reactivity APIs** и может переиспользоваться между components.

---

## 18. Что важно понять после этого блока

Проверь себя:

1. Чем Options API отличается от Composition API?
2. Что общего у обоих стилей?
3. Как `data()` соотносится с `ref` / `reactive`?
4. Почему Composition API лучше для composables?
5. Какой стиль использовать в этом учебном плане?
6. Зачем всё равно уметь читать Options API?

---

## 19. Что почитать

### Официальное

- [Introduction · API Styles · Vue.js](https://vuejs.org/guide/introduction.html#api-styles)
- [Composition API FAQ · Vue.js](https://vuejs.org/guide/extras/composition-api-faq.html)
- [Composition API FAQ · Vue.js RU](https://ru.vuejs.org/guide/extras/composition-api-faq.html)

### Связанные материалы этого плана

- [Module 2 · ref](./01-ref.md)
- [Module 2 · watch](./04-watch.md)
- [Module 2 · defineProps](./07-defineProps.md)
- [README · оговорка про Options API](../../README.md)

---

## 20. Практическое мини-задание

1. Возьми counter component из этого урока
2. Напиши его в **Composition API**
3. Перепиши mentally в **Options API**, не обязательно кодом
4. Для catalog app набросай, какие composables ты бы вынес:
   - `useProducts`
   - `useProductFilters`
5. Проверь, какие topics Module 2 попадут в каждый composable

---

## 21. Мини-конспект

- Vue 3 имеет Options API и Composition API
- оба используют одну reactivity system
- Options API = option groups + `this`
- Composition API = functions + reactive state + composition
- для новых проектов и этого плана — **Composition API + `<script setup>`**
- Options API нужен для чтения legacy code
- Module 2 theory complete → time for catalog practice

---

## 22. Что делать дальше

**Теория Module 2 завершена.**

Следующий шаг:

- **практика Module 2** — catalog app, composables, fetch
- затем **Module 3 · Компонентная архитектура**

Если хочешь, могу следующим подготовить **practice checklist для Module 2**, как это было в Module 0 и Module 1.
