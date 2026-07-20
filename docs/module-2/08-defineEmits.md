# Module 2 · Теория: `defineEmits`

Этот материал закрывает восьмой теоретический пункт `Module 2`: понять, **как child сообщает parent о действиях**, **как объявлять events через `defineEmits`** и **как работает паттерн props down / events up**.

Связанные материалы:

- [Module 2 · defineProps](./07-defineProps.md)
- [Module 1 · events](../module-1/06-events.md)
- [Module 1 · v-model](../module-1/11-v-model.md)

---

## 1. Что такое component events

Если **props** передают data **вниз**, то **events** передают сигналы **вверх**.

```text
Parent
   ↓ props
Child
   ↑ emit event
Parent handles event
```

Child не меняет props напрямую, а **сообщает parent**, что нужно обновить state.

Официально:

- [Component Events · Vue.js](https://vuejs.org/guide/components/events.html)
- [defineEmits() · API](https://vuejs.org/api/sfc-script-setup.html#defineprops-defineemits)

---

## 2. Базовый пример

### Child

```vue
<script setup lang="ts">
const emit = defineEmits<{
  select: [id: number]
}>()

function handleClick() {
  emit('select', 1)
}
</script>

<template>
  <button @click="handleClick">Select product</button>
</template>
```

### Parent

```vue
<script setup lang="ts">
import ProductCard from './ProductCard.vue'

function onSelect(id: number) {
  console.log('selected id:', id)
}
</script>

<template>
  <ProductCard @select="onSelect" />
</template>
```

---

## 3. Что такое `defineEmits`

**`defineEmits`** — compiler macro для `<script setup>`, который объявляет events компонента.

```ts
const emit = defineEmits(['submit', 'cancel'])
```

или с TypeScript:

```ts
const emit = defineEmits<{
  submit: []
  cancel: []
}>()
```

`defineEmits` **не нужно импортировать**.

`emit()` возвращается из macro и используется в script:

```ts
emit('submit')
emit('select', productId)
```

---

## 4. Зачем явно объявлять emits

Явное объявление:

- документирует public API компонента
- даёт TypeScript types
- помогает Vue правильно обрабатывать fallthrough attributes
- позволяет делать validation payload

---

## 5. Emitting из template

Можно emit прямо в template:

```vue
<button @click="$emit('close')">Close</button>
```

Но в `<script setup>` чаще используют function + `emit()`:

```vue
<script setup lang="ts">
const emit = defineEmits<{ close: [] }>()

function closeModal() {
  emit('close')
}
</script>

<template>
  <button @click="closeModal">Close</button>
</template>
```

Так код проще тестировать и читать.

---

## 6. Event arguments

В `emit` можно передавать payload:

```ts
emit('update:query', 'keyboard')
emit('select', productId)
emit('submit', { email, password })
```

Parent получает arguments в handler:

```vue
<ProductFilters @update:query="query = $event" />

<ProductFilters @select="onSelect" />
```

```ts
function onSelect(id: number) {
  selectedId.value = id
}
```

---

## 7. kebab-case vs camelCase

В script можно emit camelCase:

```ts
emit('updateQuery', 'keyboard')
```

В parent template обычно слушают kebab-case:

```vue
<ProductFilters @update-query="onUpdateQuery" />
```

Vue автоматически сопоставляет naming styles.

---

## 8. Props down / events up

Главный паттерн Vue-компонентов:

```text
props down
events up
```

### Пример: filters panel

#### Parent

```vue
<script setup lang="ts">
import { ref } from 'vue'
import ProductFilters from './ProductFilters.vue'

const query = ref('')
const sortBy = ref<'name' | 'price'>('name')
</script>

<template>
  <ProductFilters
    :query="query"
    :sort-by="sortBy"
    @update:query="query = $event"
    @update:sort-by="sortBy = $event"
  />
</template>
```

#### Child

```vue
<script setup lang="ts">
const props = defineProps<{
  query: string
  sortBy: 'name' | 'price'
}>()

const emit = defineEmits<{
  'update:query': [value: string]
  'update:sortBy': [value: 'name' | 'price']
}>()
</script>

<template>
  <section>
    <input
      :value="query"
      @input="emit('update:query', ($event.target as HTMLInputElement).value)"
    />

    <select
      :value="sortBy"
      @change="emit('update:sortBy', ($event.target as HTMLSelectElement).value as 'name' | 'price')"
    >
      <option value="name">By name</option>
      <option value="price">By price</option>
    </select>
  </section>
</template>
```

Child **не меняет props**, а просит parent обновить state.

---

## 9. `v-model` на компоненте

`v-model` на custom component — это синтаксический sugar для prop + emit.

```vue
<ProductFilters v-model:query="query" />
```

Эквивалентно:

```vue
<ProductFilters
  :query="query"
  @update:query="query = $event"
/>
```

### Default `v-model`

```vue
<MyInput v-model="title" />
```

Эквивалентно:

```vue
<MyInput
  :model-value="title"
  @update:model-value="title = $event"
/>
```

В child:

```ts
defineProps<{ modelValue: string }>()
defineEmits<{ 'update:modelValue': [value: string] }>()
```

Подробнее с forms ты уже работал в Module 1; здесь важно понять **связь `v-model` ↔ `defineEmits`**.

---

## 10. Способы объявления emits

### Array syntax

```ts
const emit = defineEmits(['submit', 'cancel'])
```

### Object syntax with validation

```ts
const emit = defineEmits({
  submit(payload: { email: string; password: string }) {
    return Boolean(payload.email && payload.password)
  },
})
```

### TypeScript syntax

```ts
const emit = defineEmits<{
  submit: [payload: { email: string; password: string }]
  cancel: []
}>()
```

Для TS-проектов это preferred style.

---

## 11. Пример для Module 2 practice

### `ProductCard.vue` с select event

```vue
<script setup lang="ts">
const props = defineProps<{
  id: number
  name: string
  price: number
}>()

const emit = defineEmits<{
  select: [id: number]
}>()
</script>

<template>
  <article>
    <h3>{{ name }}</h3>
    <p>{{ price }}</p>
    <button @click="emit('select', id)">Select</button>
  </article>
</template>
```

### Parent catalog page

```vue
<script setup lang="ts">
import { ref } from 'vue'
import ProductList from './ProductList.vue'

const selectedId = ref<number | null>(null)

function onSelect(id: number) {
  selectedId.value = id
}
</script>

<template>
  <section>
    <p>Selected: {{ selectedId }}</p>
    <ProductList @select="onSelect" />
  </section>
</template>
```

---

## 12. Events не bubble

В отличие от native DOM events, **component events не всплывают**.

```text
GrandParent
   ↓
Parent
   ↓
Child emits event
```

GrandParent **не услышит** event напрямую, если он не слушает child.

Слушать можно только **direct child**.

---

## 13. Modifiers on component events

Можно использовать modifiers:

```vue
<MyComponent @save.once="save" />
```

`.once` сработает один раз.

Но это не DOM modifiers вроде `.prevent` — только те, что поддерживаются для component listeners.

---

## 14. `defineEmits` vs Options API `emits`

| Composition API | Options API |
|-----------------|-------------|
| `defineEmits()` | `emits: []` |
| `emit('event')` | `this.$emit('event')` |

```js
export default {
  emits: ['submit'],
  methods: {
    submit() {
      this.$emit('submit')
    },
  },
}
```

---

## 15. TypeScript tips

### Простые events

```ts
const emit = defineEmits<{
  close: []
  select: [id: number]
}>()
```

### Events с object payload

```ts
const emit = defineEmits<{
  submit: [payload: { email: string; password: string }]
}>()
```

### Typed handler в parent

```ts
function onSelect(id: number) {
  selectedId.value = id
}
```

---

## 16. Частые ошибки

### Менять prop вместо emit

```ts
props.query = 'new' // ❌
emit('update:query', 'new') // ✅
```

### Забыть объявить emit

TypeScript и Vue tooling могут не подсказать handler корректно.

### Неправильное имя для `v-model`

```ts
defineEmits<{ 'update:query': [value: string] }>()
```

```vue
<ProductFilters v-model="query" /> <!-- ❌ ждёт update:modelValue -->
<ProductFilters v-model:query="query" /> <!-- ✅ -->
```

### Emit из template без объявления

```vue
<button @click="$emit('save')">Save</button>
```

Лучше явно объявить `save` через `defineEmits`.

### Пытаться слушать event от nested child без проброса

```text
GrandParent wants event from DeepChild
   ↓
нужен emit chain или shared state
```

---

## 17. Когда emit, а когда shared state

### Используй emit, если:

- child сообщает parent о user action
- нужно обновить parent state
- один direct parent-child уровень

### Не emit, если:

- нужно derived value → `computed`
- нужен side effect on dependency change → `watch`
- очень глубокая communication → позже store/composables

---

## 18. Что важно понять после этого блока

Проверь себя:

1. Для чего нужен `defineEmits`?
2. Как parent слушает child event?
3. Что такое props down / events up?
4. Как связаны `v-model:query` и `update:query`?
5. Можно ли мутировать prop вместо emit?
6. Почему component events не bubble?

---

## 19. Что почитать

### Официальное

- [Component Events · Vue.js](https://vuejs.org/guide/components/events.html)
- [Component Events · Vue.js RU](https://ru.vuejs.org/guide/components/events.html)
- [Typing Component Emits · Vue.js](https://vuejs.org/guide/typescript/composition-api.html#typing-component-emits)
- [Component v-model · Vue.js](https://vuejs.org/guide/components/v-model.html)

### Связанные материалы этого плана

- [Module 2 · defineProps](./07-defineProps.md)
- [Module 1 · events](../module-1/06-events.md)
- [Module 1 · v-model](../module-1/11-v-model.md)

---

## 20. Практическое мини-задание

Доработай catalog app:

1. Создай `ProductFilters.vue`
2. Props: `query`, `sortBy`
3. Emits: `update:query`, `update:sortBy`
4. Подключи в parent через `v-model:query` и `v-model:sortBy`
5. Добавь `ProductCard` emit `select` и покажи selected product в parent

### Подсказка

```vue
<ProductFilters
  v-model:query="query"
  v-model:sort-by="sortBy"
/>
```

---

## 21. Мини-конспект

- `defineEmits` объявляет events компонента
- `emit('eventName', payload)` отправляет signal наверх
- parent слушает через `@event-name="handler"`
- props down / events up — базовый паттерн Vue
- `v-model` на component = prop + `update:*` emit
- component events не bubble

---

## 22. Что делать дальше

Следующий теоретический блок Module 2:

- **[`defineExpose`](./09-defineExpose.md)**

Иногда child должен открыть **ограниченный imperative API** для parent — например, метод `focus()` или `reset()`. Для этого используется `defineExpose`.
