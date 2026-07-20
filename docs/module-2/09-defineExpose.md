# Module 2 · Теория: `defineExpose`

Этот материал закрывает девятый теоретический пункт `Module 2`: понять, **зачем нужен `defineExpose`**, **как parent получает доступ к child через template ref** и **почему это используют редко**.

Связанные материалы:

- [Module 2 · defineProps](./07-defineProps.md)
- [Module 2 · defineEmits](./08-defineEmits.md)
- [Module 2 · lifecycle hooks](./06-lifecycle-hooks.md)

---

## 1. Что такое `defineExpose`

В `<script setup>` компонент **по умолчанию closed** — parent не видит его внутренние переменные и methods.

**`defineExpose`** явно открывает ограниченный public API для parent.

```ts
defineExpose({
  focus,
  reset,
})
```

Официально:

- [Template Refs · ref on component · Vue.js](https://vuejs.org/guide/essentials/template-refs.html#ref-on-components)
- [defineExpose() · API](https://vuejs.org/api/sfc-script-setup.html#defineexpose)

---

## 2. Зачем это нужно

Обычно parent и child общаются через:

```text
props down
events up
```

Но иногда parent должен **императивно** вызвать method child:

- `focus()` на input внутри child
- `reset()` формы
- `open()` / `close()` modal
- init third-party library через child API

Для этого parent использует **template ref** на component, а child — **`defineExpose`**.

---

## 3. Базовый пример

### Child: `SearchInput.vue`

```vue
<script setup lang="ts">
import { ref } from 'vue'

const inputRef = ref<HTMLInputElement | null>(null)
const query = ref('')

function focus() {
  inputRef.value?.focus()
}

function reset() {
  query.value = ''
}

defineExpose({
  focus,
  reset,
})
</script>

<template>
  <input ref="inputRef" v-model="query" placeholder="Search..." />
</template>
```

### Parent

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import SearchInput from './SearchInput.vue'

const searchRef = ref<InstanceType<typeof SearchInput> | null>(null)

onMounted(() => {
  searchRef.value?.focus()
})

function clearSearch() {
  searchRef.value?.reset()
}
</script>

<template>
  <section>
    <SearchInput ref="searchRef" />
    <button @click="clearSearch">Clear</button>
  </section>
</template>
```

---

## 4. Как это работает

```text
Parent puts ref on child component
   ↓
Child calls defineExpose({ ... })
   ↓
Parent gets exposed API via searchRef.value
   ↓
Parent can call searchRef.value.focus()
```

### Важно

- доступ есть **только после mount**
- до mount `searchRef.value === null`
- expose нужно вызывать **до первого `await`** в `<script setup>`

---

## 5. `<script setup>` closed by default

```vue
<script setup lang="ts">
const count = ref(0)

function increment() {
  count.value++
}
</script>
```

Parent **не может** сделать:

```ts
childRef.value.increment() // ❌ method не exposed
```

Нужно явно:

```ts
defineExpose({ increment })
```

---

## 6. Template ref на component

### В template

```vue
<SearchInput ref="searchRef" />
```

### В script

```ts
const searchRef = ref<InstanceType<typeof SearchInput> | null>(null)
```

### В `onMounted`

```ts
onMounted(() => {
  searchRef.value?.focus()
})
```

Template ref на component даёт **component instance**, но только с тем, что разрешил `defineExpose`.

---

## 7. Что можно expose

Обычно expose:

- methods
- иногда refs / reactive state

```ts
const query = ref('')
const isDirty = ref(false)

function submit() {
  // ...
}

defineExpose({
  query,
  isDirty,
  submit,
})
```

Refs в exposed object будут auto-unwrapped для parent так же, как на обычном instance.

### Лучше expose минимум

```ts
defineExpose({
  focus,
  reset,
})
```

А не весь internal state компонента.

---

## 8. `defineExpose` vs props / emits

| Подход | Стиль | Когда |
|--------|-------|-------|
| props / emits | declarative | почти всегда |
| `defineExpose` + ref | imperative | редкие случаи |

### Declarative — preferred

```vue
<ProductFilters
  v-model:query="query"
  @submit="applyFilters"
/>
```

### Imperative — exception

```ts
onMounted(() => {
  filtersRef.value?.focusQuery()
})
```

Если можно решить через props/events — **не используй expose**.

---

## 9. Пример для Module 2 practice

### `ProductFilters.vue`

```vue
<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  query: string
  sortBy: 'name' | 'price'
}>()

const emit = defineEmits<{
  'update:query': [value: string]
  'update:sortBy': [value: 'name' | 'price']
}>()

const queryInputRef = ref<HTMLInputElement | null>(null)

function focusQuery() {
  queryInputRef.value?.focus()
}

function resetFilters() {
  emit('update:query', '')
  emit('update:sortBy', 'name')
}

defineExpose({
  focusQuery,
  resetFilters,
})
</script>

<template>
  <section>
    <input
      ref="queryInputRef"
      :value="query"
      placeholder="Search products..."
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

### Parent page

```vue
<script setup lang="ts">
import { ref } from 'vue'
import ProductFilters from './ProductFilters.vue'

const query = ref('')
const sortBy = ref<'name' | 'price'>('name')
const filtersRef = ref<InstanceType<typeof ProductFilters> | null>(null)

function resetAll() {
  filtersRef.value?.resetFilters()
}
</script>

<template>
  <section>
    <ProductFilters
      ref="filtersRef"
      v-model:query="query"
      v-model:sort-by="sortBy"
    />

    <button @click="resetAll">Reset filters</button>
  </section>
</template>
```

Здесь reset можно было сделать и в parent напрямую, но expose полезен, если child инкапсулирует свою логику reset/focus.

---

## 10. TypeScript и template refs

### Тип ref на component

```ts
import ProductFilters from './ProductFilters.vue'

const filtersRef = ref<InstanceType<typeof ProductFilters> | null>(null)
```

TypeScript будет знать exposed methods, если они объявлены через `defineExpose`.

### Vue 3.5+: `useTemplateRef`

```ts
import { useTemplateRef, onMounted } from 'vue'

const filtersRef = useTemplateRef('filters')

onMounted(() => {
  filtersRef.value?.focusQuery()
})
```

```vue
<ProductFilters ref="filters" />
```

---

## 11. `defineExpose` vs Options API `expose`

| Composition API | Options API |
|-----------------|-------------|
| `defineExpose({ ... })` | `expose: ['methodName']` |

```js
export default {
  expose: ['publicMethod'],
  methods: {
    publicMethod() {},
    privateMethod() {},
  },
}
```

---

## 12. Когда НЕ нужен `defineExpose`

Не нужен, если:

- parent может передать prop
- child может emit event
- state можно поднять в parent
- нужен только declarative UI flow

```vue
<!-- ✅ лучше -->
<ProductFilters v-model:query="query" @reset="resetFilters" />
```

`defineExpose` — escape hatch, не основной паттерн.

---

## 13. Частые ошибки

### Обращение к ref до mount

```ts
filtersRef.value?.focusQuery() // ❌ в setup до mount может быть null

onMounted(() => {
  filtersRef.value?.focusQuery() // ✅
})
```

### Забыли `defineExpose`

```ts
function resetFilters() {}

// parent не увидит method
defineExpose({ resetFilters }) // ✅
```

### Expose после `await`

```vue
<script setup lang="ts">
await something()

defineExpose({ focus }) // ⚠️ может не сработать как ожидается
</script>
```

`defineExpose` нужно вызывать **до await**.

### Expose слишком много internal API

```ts
defineExpose({
  query,
  sortBy,
  loadProducts,
  internalCache,
  debugState,
}) // ❌ слишком много
```

Parent становится tightly coupled с implementation details child.

### Использовать expose вместо emit

```ts
// ❌ parent напрямую меняет child state
childRef.value.query = 'keyboard'

// ✅ child сообщает через emit / v-model
emit('update:query', 'keyboard')
```

---

## 14. Expose + lifecycle

Частый паттерн:

```ts
onMounted(() => {
  childRef.value?.focus()
})
```

И cleanup обычно остаётся внутри child:

```ts
onUnmounted(() => {
  controller?.abort()
})
```

Parent редко делает cleanup за child через expose.

---

## 15. Что важно понять после этого блока

Проверь себя:

1. Почему `<script setup>` closed by default?
2. Зачем нужен `defineExpose`?
3. Как parent получает доступ к child method?
4. Почему props/emits предпочтительнее expose?
5. Когда можно обращаться к component ref?
6. Что expose минимально, а не всё подряд?

---

## 16. Что почитать

### Официальное

- [Template Refs · Vue.js](https://vuejs.org/guide/essentials/template-refs.html)
- [Template Refs · ref on component · Vue.js](https://vuejs.org/guide/essentials/template-refs.html#ref-on-components)
- [defineExpose() · API](https://vuejs.org/api/sfc-script-setup.html#defineexpose)
- [Typing Component Template Refs · Vue.js](https://vuejs.org/guide/typescript/composition-api.html#typing-component-template-refs)

### Связанные материалы этого плана

- [Module 2 · defineProps](./07-defineProps.md)
- [Module 2 · defineEmits](./08-defineEmits.md)
- [Module 2 · lifecycle hooks](./06-lifecycle-hooks.md)

---

## 17. Практическое мини-задание

Доработай `ProductFilters.vue`:

1. Добавь `focusQuery()` и `resetFilters()`
2. Expose их через `defineExpose`
3. В parent создай template ref
4. Кнопка **Reset filters** должна вызывать exposed method
5. При mount вызывай `focusQuery()`

### Проверка понимания

Сначала попробуй решить reset **без expose**, только через parent state. Потом сравни с expose-подходом и реши, где он действительно оправдан.

---

## 18. Мини-конспект

- `<script setup>` по умолчанию не expose internal bindings
- `defineExpose` открывает ограниченный public API
- parent получает доступ через template ref на component
- ref доступен после mount
- props/emits — default, expose — exception
- expose только нужные methods, не весь state

---

## 19. Что делать дальше

Следующий теоретический блок Module 2:

- **[отличие `Composition API` от `Options API`](./10-composition-api-vs-options-api.md)**

Это финальный theory block Module 2: собрать воедино два стиля Vue и понять, какой использовать в учебном проекте.
