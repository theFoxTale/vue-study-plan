# Module 3 · Теория: emits в компонентной архитектуре

Этот материал закрывает второй теоретический пункт `Module 3`: понять, **как проектировать events как output contract компонента**, **какие действия child должен сообщать parent** и **как не размазать side effects по всему дереву**.

> Механика `defineEmits`, payload, `v-model` и TypeScript уже разобраны в Module 2. Здесь фокус — **архитектура и проектирование events**.

Связанные материалы:

- [Module 3 · props](./01-props.md)
- [Module 2 · defineEmits](../module-2/08-defineEmits.md)
- [Module 2 · defineProps](../module-2/07-defineProps.md)

---

## 1. Зачем emits в Module 3

В Module 2 ты научился **объявлять** events.

В Module 3 важно научиться **проектировать** их:

```text
что child делает сам?
что child только сообщает parent?
какой payload нужен?
какое имя event лучше описывает intent?
```

Emits — это **output API** компонента.

```text
props  = input contract
emits  = output contract
```

---

## 2. Props down / events up как архитектурное правило

```text
Parent owns state
   ↓ props
Child renders UI
   ↑ emit event
Parent updates state
```

### Что это даёт

- один source of truth
- понятный data flow
- проще debug через DevTools
- child остаётся reusable

### Нарушение правила

```ts
// ❌ child мутирует shared object
props.product.price = 100

// ✅ child сообщает intent
emit('update:price', 100)
```

---

## 3. Emits как публичный contract

Как и props, events должны быть:

- явными
- typed
- минимальными
- понятными по имени

```ts
const emit = defineEmits<{
  select: [id: number]
  remove: [id: number]
}>()
```

Плохой contract:

```ts
defineEmits<{
  change: [payload: any]
  action: [data: unknown]
}>()
```

Имена `change` / `action` слишком общие для UI-kit и feature components.

---

## 4. Имена events: intent, не implementation

Хорошие имена описывают **что произошло**, а не как кликнули.

| Плохо | Лучше |
|------|-------|
| `click` | `select`, `open`, `submit` |
| `buttonClick` | `confirm` |
| `input` | `update:query` |
| `doSomething` | `remove`, `retry` |

### Примеры

```ts
emit('select', product.id)
emit('remove', product.id)
emit('submit', formValue)
emit('cancel')
emit('update:query', value)
```

Native DOM event names (`click`, `input`) оставляй для low-level UI primitives, если это действительно wrapper над native control.

---

## 5. Кто должен владеть side effect

Главный архитектурный вопрос:

```text
где должен жить side effect?
```

### Child presentational

- рисует UI
- emit'ит user intent
- не делает fetch / store mutation

### Parent / container

- слушает events
- обновляет state
- вызывает composables / API

```vue
<!-- ProductCard.vue — presentational -->
<script setup lang="ts">
defineProps<{ id: number; name: string }>()

const emit = defineEmits<{
  select: [id: number]
}>()
</script>

<template>
  <button @click="emit('select', id)">{{ name }}</button>
</template>
```

```vue
<!-- CatalogPage.vue — container -->
<script setup lang="ts">
const selectedId = ref<number | null>(null)

function onSelect(id: number) {
  selectedId.value = id
}
</script>

<template>
  <ProductCard
    v-for="product in products"
    :key="product.id"
    :id="product.id"
    :name="product.name"
    @select="onSelect"
  />
</template>
```

---

## 6. Типы events в UI architecture

| Тип event | Пример | Кто обрабатывает |
|-----------|--------|------------------|
| Selection | `select`, `open` | parent page |
| Mutation request | `remove`, `toggle` | parent / store |
| Form sync | `update:query` | parent controlled state |
| Dialog lifecycle | `close`, `confirm` | parent modal owner |
| Retry / reload | `retry` | container with fetch |

Не смешивай всё в один `change`.

---

## 7. Payload design

Payload должен быть **минимально достаточным**.

### Хорошо

```ts
emit('select', product.id)
emit('remove', product.id)
emit('update:query', query)
```

### Иногда object

```ts
emit('submit', {
  email,
  password,
})
```

### Плохо

```ts
emit('select', product, event, index, filters, catalog)
```

Слишком много context делает event хрупким и труднопереиспользуемым.

### Практическое правило

```text
передавай id / value / маленький typed payload
не передавай весь app state
```

---

## 8. Event bubbling через дерево

Component events **не bubble**.

```text
ProductCard emits select
   ↑
ProductList must re-emit или handle
   ↑
CatalogPage receives
```

### Вариант A — re-emit

```vue
<!-- ProductList.vue -->
<script setup lang="ts">
const emit = defineEmits<{
  select: [id: number]
}>()
</script>

<template>
  <ProductCard
    v-for="product in products"
    :key="product.id"
    v-bind="product"
    @select="emit('select', $event)"
  />
</template>
```

### Вариант B — handle на промежуточном уровне

Если `ProductList` сам знает, что делать с `select`, он может обработать event без проброса.

### Когда это становится проблемой

Если events прокидываются через 3–4 уровня — это сигнал:

- слишком глубокое дерево
- нужен composable / shared state
- container стоит поднять ближе к UI

---

## 9. Emits vs local state

Не каждый click должен уходить наверх.

### Оставь локально, если:

- UI-only state: open dropdown, hover, internal tab
- parent не заинтересован
- не влияет на shared data

```ts
const isOpen = ref(false)

function toggle() {
  isOpen.value = !isOpen.value
}
```

### Emit'ь наверх, если:

- меняется shared / domain state
- parent должен синхронизировать UI
- действие влияет на соседние components

```ts
emit('select', id)
emit('update:query', value)
```

---

## 10. Controlled UI через emits

Filters и inputs обычно controlled:

```vue
<ProductFilters
  :query="query"
  @update:query="query = $event"
/>
```

или:

```vue
<ProductFilters v-model:query="query" />
```

### Contract child

```ts
defineProps<{ query: string }>()

defineEmits<{
  'update:query': [value: string]
}>()
```

Child не пишет в props — он просит обновить значение.

---

## 11. Emits в reusable UI-kit

Для UI primitives events часто ближе к native behavior:

```vue
<!-- BaseButton.vue -->
<script setup lang="ts">
defineProps<{ disabled?: boolean }>()

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()
</script>

<template>
  <button :disabled="disabled" @click="emit('click', $event)">
    <slot />
  </button>
</template>
```

Для feature components лучше semantic names:

```ts
emit('add-to-cart', productId)
emit('open-details', productId)
```

```text
UI-kit → generic events (click, input)
feature → domain events (select, remove, submit)
```

---

## 12. Пример хорошего emits design для catalog

### `ProductCard.vue`

```ts
defineEmits<{
  select: [id: number]
  addToCart: [id: number]
}>()
```

### `ProductFilters.vue`

```ts
defineEmits<{
  'update:query': [value: string]
  'update:sortBy': [value: 'name' | 'price']
  reset: []
}>()
```

### `ProductList.vue`

```ts
defineEmits<{
  select: [id: number]
}>()
```

### `BaseModal.vue`

```ts
defineEmits<{
  close: []
  confirm: []
}>()
```

Каждый event отвечает на вопрос: **что произошло с точки зрения пользователя / domain**.

---

## 13. Где не нужен emit

Не emit'ь, если:

| Ситуация | Лучше |
|----------|-------|
| derived value | `computed` |
| reaction на prop change | `watch` |
| parent уже знает value | не дублировать |
| нужен imperative API | иногда `defineExpose` |
| deep nested communication | composable / provide-inject / store *(позже)* |

```ts
// ❌ лишний emit только чтобы parent пересчитал total
emit('itemsChanged', items)

// ✅ parent уже владеет items → computed сам
const total = computed(() => items.value.length)
```

---

## 14. Связка props + emits = полный contract

Хороший component API читается как таблица:

| Component | Props (in) | Emits (out) |
|-----------|------------|-------------|
| `ProductCard` | `id`, `name`, `price`, `isSelected` | `select`, `addToCart` |
| `ProductFilters` | `query`, `sortBy` | `update:query`, `update:sortBy`, `reset` |
| `BaseModal` | `open`, `title` | `close`, `confirm` |
| `BaseInput` | `modelValue`, `label` | `update:modelValue` |

Если не можешь быстро заполнить эту таблицу — API компонента ещё неясен.

---

## 15. Частые архитектурные ошибки

### Emit вместо локального state

```ts
emit('toggleDropdown') // ❌ если dropdown только внутри child
```

### Mutation prop + emit одновременно

```ts
props.query = value
emit('update:query', value) // ❌ достаточно emit
```

### Слишком общие events

```ts
emit('change', { type: 'select', id }) // ❌ лучше emit('select', id)
```

### Side effects внутри presentational child

```ts
async function onClick() {
  await fetch('/api/cart') // ❌ лучше emit + parent/composable
}
```

### Event spaghetti через 4 уровня

```text
Card → List → Section → Page → App
```

Обычно нужно поднять container ближе или вынести shared logic.

---

## 16. TypeScript и emits design

Typed emits = documented architecture:

```ts
const emit = defineEmits<{
  select: [id: number]
  remove: [id: number]
  'update:query': [value: string]
}>()
```

Это помогает:

- не забыть payload
- не перепутать event names
- держать contract стабильным при refactor

---

## 17. Что важно понять после этого блока

Проверь себя:

1. Чем emits в Module 3 отличаются от `defineEmits` в Module 2?
2. Что значит props down / events up?
3. Когда event должен быть semantic (`select`), а когда generic (`click`)?
4. Какой payload считать достаточным?
5. Когда event нужно re-emit через промежуточный component?
6. Что лучше оставить локальным state, а что emit'ить наверх?

---

## 18. Что почитать

### Официальное

- [Component Events · Vue.js](https://vuejs.org/guide/components/events.html)
- [Component v-model · Vue.js](https://vuejs.org/guide/components/v-model.html)
- [Typing Component Emits · Vue.js](https://vuejs.org/guide/typescript/composition-api.html#typing-component-emits)

### Связанные материалы этого плана

- [Module 3 · props](./01-props.md)
- [Module 2 · defineEmits](../module-2/08-defineEmits.md)

---

## 19. Практическое мини-задание

Возьми component tree из прошлого урока и допиши emits:

```text
CatalogPage
  ProductFilters(query, sortBy) → update:query, update:sortBy, reset
  ProductList(products, isLoading, error) → select
    ProductCard(id, name, price, isSelected) → select, addToCart
  ProductModal(open, product) → close, confirm
```

### Задачи

1. Для каждого component выпиши emits
2. Убери лишние / слишком общие events
3. Проверь, где side effect должен жить в parent
4. Найди места, где local state лучше emit

---

## 20. Мини-конспект

- emits = output contract компонента
- props down / events up — базовое правило архитектуры
- имена events описывают intent, не DOM detail
- payload держи минимальным и typed
- presentational child emit'ит, container обрабатывает
- не каждый click должен идти наверх

---

## 21. Что делать дальше

Следующий теоретический блок Module 3:

- **`slots`**

Props и emits описывают data/events. Slots описывают **как parent вставляет custom content** внутрь child — следующий уровень переиспользования UI.
