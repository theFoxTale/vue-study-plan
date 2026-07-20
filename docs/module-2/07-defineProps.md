# Module 2 · Теория: `defineProps`

Этот материал закрывает седьмой теоретический пункт `Module 2`: понять, **как родитель передаёт data в child component**, **как объявлять props через `defineProps`** и **как не нарушать one-way data flow**.

Связанные материалы:

- [Module 1 · Single File Components](../module-1/03-single-file-components.md)
- [Module 1 · v-bind](../module-1/07-v-bind.md)
- [Module 2 · ref](./01-ref.md)

---

## 1. Что такое props

**Props** — это входные параметры компонента.

```text
Parent component
   ↓ passes props
Child component
```

Child **получает** data от parent, но не должен напрямую менять props.

Официально:

- [Props · Vue.js](https://vuejs.org/guide/components/props.html)
- [defineProps() · API](https://vuejs.org/api/sfc-script-setup.html#defineprops-defineemits)

---

## 2. Базовый пример

### Parent

```vue
<script setup lang="ts">
import ProductCard from './ProductCard.vue'

const product = {
  id: 1,
  name: 'Keyboard',
  price: 80,
}
</script>

<template>
  <ProductCard
    :name="product.name"
    :price="product.price"
  />
</template>
```

### Child

```vue
<script setup lang="ts">
const props = defineProps<{
  name: string
  price: number
}>()
</script>

<template>
  <article>
    <h3>{{ props.name }}</h3>
    <p>{{ props.price }}</p>
  </article>
</template>
```

В template можно писать короче:

```vue
<h3>{{ name }}</h3>
<p>{{ price }}</p>
```

---

## 3. Что такое `defineProps`

**`defineProps`** — compiler macro для `<script setup>`, который объявляет props компонента.

```ts
const props = defineProps(['name', 'price'])
```

или

```ts
const props = defineProps({
  name: String,
  price: Number,
})
```

или с TypeScript:

```ts
const props = defineProps<{
  name: string
  price: number
}>()
```

`defineProps` **не нужно импортировать** — это macro.

---

## 4. Зачем явно объявлять props

Vue должен знать, какие attributes считаются props, а какие — обычными HTML attributes.

Явное объявление даёт:

- автодокументацию компонента
- TypeScript types
- runtime validation
- понятный public API компонента

---

## 5. Способы объявления props

### Array syntax

```ts
const props = defineProps(['title', 'likes'])
```

Минимальный вариант без validation.

### Object syntax

```ts
const props = defineProps({
  title: String,
  likes: Number,
})
```

Можно добавить defaults и validators.

### TypeScript syntax

```ts
const props = defineProps<{
  title: string
  likes?: number
}>()
```

Самый удобный вариант в TS-проектах.

---

## 6. Defaults и required props

### Runtime object syntax

```ts
const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  likes: {
    type: Number,
    default: 0,
  },
})
```

### TypeScript + destructuring defaults *(Vue 3.5+)*

```ts
const { title, likes = 0 } = defineProps<{
  title: string
  likes?: number
}>()
```

---

## 7. Static vs dynamic props

### Static

```vue
<ProductCard name="Keyboard" :price="80" />
```

### Dynamic

```vue
<ProductCard :name="product.name" :price="product.price" />
```

### Spread object

```vue
<ProductCard v-bind="product" />
```

Эквивалентно:

```vue
<ProductCard :id="product.id" :name="product.name" :price="product.price" />
```

---

## 8. Naming: camelCase vs kebab-case

В script объявляй props в **camelCase**:

```ts
defineProps<{
  greetingMessage: string
}>()
```

В template parent обычно пишут **kebab-case**:

```vue
<MyComponent greeting-message="hello" />
```

Vue понимает оба варианта.

---

## 9. One-way data flow

Props — это **one-way binding**:

```text
parent changes → child receives new value
child mutates prop → ❌
```

### Нельзя мутировать props

```ts
const props = defineProps<{ title: string }>()

props.title = 'New title' // ❌ warning, props are readonly
```

### Если prop — initial value

```ts
const props = defineProps<{ initialCount: number }>()

const count = ref(props.initialCount)
```

`count` — локальный state, disconnected from future prop updates.

### Если prop нужно transform

```ts
const props = defineProps<{ size: string }>()

const normalizedSize = computed(() => props.size.trim().toLowerCase())
```

---

## 10. Props vs local state

| | props | local state |
|---|------|-------------|
| Источник | parent | сам component |
| Можно менять в child | ❌ | ✅ |
| Для чего | input/config/data from outside | internal UI state |

Пример:

```vue
<script setup lang="ts">
const props = defineProps<{
  products: Product[]
}>()

const selectedId = ref<number | null>(null)
</script>
```

- `products` — props
- `selectedId` — local state

---

## 11. Object / array props

Props с object/array передаются **by reference**.

Child technically может менять nested fields:

```ts
props.products.push(newProduct) // ⚠️ технически возможно, но плохая практика
```

Лучше:

```text
child emits event → parent updates source data
```

Об этом подробнее в уроке про **`defineEmits`**.

---

## 12. Prop validation

### Runtime validation

```ts
const props = defineProps({
  status: {
    type: String,
    validator(value: string) {
      return ['success', 'warning', 'danger'].includes(value)
    },
  },
  price: {
    type: Number,
    required: true,
  },
})
```

### TypeScript validation

```ts
type Status = 'success' | 'warning' | 'danger'

const props = defineProps<{
  status: Status
  price: number
}>()
```

TS защищает на этапе разработки, runtime validation — в браузере.

---

## 13. Boolean props

```ts
defineProps<{ disabled?: boolean }>()
```

Использование:

```vue
<MyButton disabled />
<MyButton :disabled="false" />
```

Boolean props ведут себя похоже на native HTML boolean attributes.

---

## 14. Использование props в script

### Через `props.`

```ts
const props = defineProps<{ price: number }>()

const formattedPrice = computed(() => `$${props.price}`)
```

### Destructuring *(Vue 3.5+)*

```ts
const { price } = defineProps<{ price: number }>()
```

Compiler автоматически сохраняет reactivity при доступе к `price` в том же `<script setup>`.

### Важно для `watch`

```ts
const { price } = defineProps<{ price: number }>()

watch(() => price, (newPrice) => {
  console.log(newPrice)
})
```

Нельзя писать `watch(price, ...)` — нужен getter.

---

## 15. Пример для Module 2 practice

Разбей catalog app на parent/child.

### `ProductList.vue`

```vue
<script setup lang="ts">
import ProductCard from './ProductCard.vue'

type Product = {
  id: number
  name: string
  price: number
}

defineProps<{
  products: Product[]
  isLoading: boolean
  error: string
}>()
</script>

<template>
  <section>
    <p v-if="isLoading">Loading...</p>
    <p v-else-if="error">{{ error }}</p>

    <ul v-else>
      <li v-for="product in products" :key="product.id">
        <ProductCard :name="product.name" :price="product.price" />
      </li>
    </ul>
  </section>
</template>
```

### `ProductCard.vue`

```vue
<script setup lang="ts">
defineProps<{
  name: string
  price: number
}>()
</script>

<template>
  <article>
    <h3>{{ name }}</h3>
    <p>{{ price }}</p>
  </article>
</template>
```

---

## 16. `defineProps` vs Options API `props`

| Composition API | Options API |
|-----------------|-------------|
| `defineProps()` | `props: {}` |

```js
export default {
  props: {
    title: String,
  },
}
```

В `<script setup>` используй `defineProps`.

---

## 17. Частые ошибки

### Мутировать prop

```ts
props.title = 'New' // ❌
```

### Путать prop и v-model без emits

```vue
<!-- parent -->
<ProductFilters v-model:query="query" />
```

Если child не объявил соответствующий emit, это не заработает как ожидается.

### Не объявить prop

```vue
<template>
  <p>{{ title }}</p>
</template>
```

Без `defineProps` Vue не знает, что `title` — prop.

### Передавать number без `:`

```vue
<ProductCard price="80" /> <!-- string -->
<ProductCard :price="80" /> <!-- number ✅ -->
```

### Использовать prop как единственный source of truth и менять его локально

```ts
const props = defineProps<{ query: string }>()
props.query = 'new' // ❌
```

Нужен local copy или emit наверх.

---

## 18. Что важно понять после этого блока

Проверь себя:

1. Что такое props?
2. Зачем нужен `defineProps`?
3. Почему props readonly?
4. Когда prop → local `ref`, а когда → `computed`?
5. Чем `:price="80"` отличается от `price="80"`?
6. Как parent передаёт object через `v-bind`?

---

## 19. Что почитать

### Официальное

- [Props · Vue.js](https://vuejs.org/guide/components/props.html)
- [Props · Vue.js RU](https://ru.vuejs.org/guide/components/props.html)
- [Typing Component Props · Vue.js](https://vuejs.org/guide/typescript/composition-api.html#typing-component-props)

### Связанные материалы этого плана

- [Module 1 · v-bind](../module-1/07-v-bind.md)
- [Module 2 · lifecycle hooks](./06-lifecycle-hooks.md)

---

## 20. Практическое мини-задание

Создай два компонента:

1. `ProductCard.vue`
   - props: `name`, `price`
2. `ProductList.vue`
   - props: `products`, `isLoading`, `error`
   - рендерит список `ProductCard`

### Задачи

1. Передай array products из parent
2. Добавь TypeScript types для props
3. Попробуй **неправильно** изменить prop в child и посмотри warning
4. Добавь `computed` в `ProductCard`, который форматирует price как `$80`

---

## 21. Мини-конспект

- props — input data от parent к child
- `defineProps` объявляет public API компонента
- props readonly, one-way data flow
- для TS удобнее `defineProps<{ ... }>()`
- dynamic values передают через `:prop="value"`
- local changes делают через local state или emit, не через mutation props

---

## 22. Что делать дальше

Следующий теоретический блок Module 2:

- **`defineEmits`**

Если `defineProps` отвечает на вопрос «как data идёт вниз», то `defineEmits` — «как события и изменения идут вверх».
