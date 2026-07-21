# Module 4 · Теория: типизация emits

Этот материал закрывает второй теоретический пункт `Module 4`: понять, **как строго типизировать component events**, **как описывать payload**, и **как сделать output API таким же безопасным, как typed props**.

> Механика emits и props down / events up уже разобраны в Module 2–3. Здесь фокус — **TypeScript contract для events**.

Связанные материалы:

- [Module 4 · typing props](./01-typing-props.md)
- [Module 2 · defineEmits](../module-2/08-defineEmits.md)
- [Module 3 · emits](../module-3/02-emits.md)

---

## 1. Зачем типизировать emits

Без типов легко ошибиться:

```ts
emit('select', '42')      // ждали number
emit('selec', product.id) // typo в имени event
emit('update:query')      // забыли payload
```

Typed emits ловят это в IDE / `vue-tsc`:

```text
Argument of type 'string' is not assignable to parameter of type 'number'
```

Типизация emits даёт:

- autocomplete имён events
- проверку payload
- documentation output API
- безопасные handlers в parent

Официально:

- [Typing Component Emits · Vue.js](https://vuejs.org/guide/typescript/composition-api.html#typing-component-emits)

---

## 2. Три способа объявить emits

| Способ | Пример | Когда |
|--------|--------|------|
| **Type-based (tuple)** | `defineEmits<{ select: [id: number] }>()` | preferred |
| **Type-based (call signatures)** | `defineEmits<{ (e: 'select', id: number): void }>()` | тоже ок, более verbose |
| **Runtime** | `defineEmits(['select'])` / object validators | нужен runtime check |

Как и с props: **type-based OR runtime**, не оба сразу.

---

## 3. Preferred syntax: named tuple

```vue
<script setup lang="ts">
const emit = defineEmits<{
  select: [id: number]
  remove: [id: number]
  cancel: []
}>()

emit('select', 1)   // ✅
emit('cancel')      // ✅
emit('select', '1') // ❌ type error
</script>
```

### Как читать

```ts
select: [id: number]
```

значит:

```text
emit('select', id)
payload = number
```

```ts
cancel: []
```

значит:

```text
emit('cancel')
payload нет
```

Это самый удобный синтаксис с Vue 3.3+.

---

## 4. Call signature syntax

Старый/альтернативный type-based вариант:

```ts
const emit = defineEmits<{
  (e: 'select', id: number): void
  (e: 'update', value: string): void
}>()
```

Работает так же, но обычно длиннее.
В новом коде предпочитай tuple syntax.

---

## 5. Runtime declaration

### Только имена

```ts
const emit = defineEmits(['select', 'cancel'])
```

Слабая типизация payload.

### С validation

```ts
const emit = defineEmits({
  submit(payload: { email: string; password: string }) {
    return Boolean(payload.email && payload.password)
  },
})
```

Полезно для runtime guards, но в TS-first app type-based обычно выразительнее.

---

## 6. Payload design с типами

### Примитив

```ts
defineEmits<{
  select: [id: number]
  'update:query': [value: string]
}>()
```

### Object payload

```ts
type SubmitPayload = {
  email: string
  password: string
}

const emit = defineEmits<{
  submit: [payload: SubmitPayload]
}>()

emit('submit', {
  email: 'a@b.c',
  password: 'secret',
})
```

### Несколько аргументов

```ts
defineEmits<{
  move: [id: number, toIndex: number]
}>()

emit('move', 5, 2)
```

На практике чаще удобнее один object payload, чем много positional args.

---

## 7. `v-model` events typing

Default `v-model`:

```ts
defineProps<{ modelValue: string }>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
```

Named `v-model`:

```ts
defineProps<{
  query: string
  sortBy: 'name' | 'price'
}>()

defineEmits<{
  'update:query': [value: string]
  'update:sortBy': [value: 'name' | 'price']
}>()
```

Имена event и типы payload должны совпадать с props.

Ошибка:

```ts
'update:sortBy': [value: string] // слишком широко
```

Лучше тот же union, что у prop:

```ts
'update:sortBy': [value: 'name' | 'price']
```

---

## 8. Shared emit types

Как и props, emits можно выносить в types:

```ts
// src/types/product.ts
export type SortBy = 'name' | 'price'

export type ProductFiltersEmits = {
  'update:query': [value: string]
  'update:sortBy': [value: SortBy]
  reset: []
}

export type ProductCardEmits = {
  select: [id: number]
  addToCart: [id: number]
}
```

```vue
<script setup lang="ts">
import type { ProductCardEmits } from '@/types/product'

const emit = defineEmits<ProductCardEmits>()
</script>
```

Это особенно полезно, если один и тот же event contract повторяется или документируется отдельно.

---

## 9. Typed handlers в parent

Child:

```ts
const emit = defineEmits<{
  select: [id: number]
}>()
```

Parent:

```ts
function onSelect(id: number) {
  selectedId.value = id
}
```

```vue
<ProductCard @select="onSelect" />
```

Если handler typed правильно, IDE подскажет signature.
Если написать:

```ts
function onSelect(id: string) {}
```

получишь type mismatch на listener.

Inline тоже ок:

```vue
<ProductCard @select="(id) => (selectedId = id)" />
```

при хорошем Vue TS tooling `id` выводится как `number`.

---

## 10. Events без payload

Не бойся пустого tuple:

```ts
defineEmits<{
  close: []
  reset: []
  cancel: []
}>()
```

Это лучше, чем «свободный» untyped emit:

```ts
defineEmits(['close'])
```

Потому что имена всё равно проверяются:

```ts
emit('clsoe') // ❌
```

---

## 11. Catalog examples

### `ProductCard.vue`

```vue
<script setup lang="ts">
import type { ProductCardProps, ProductCardEmits } from '@/types/product'

defineProps<ProductCardProps>()
const emit = defineEmits<ProductCardEmits>()
</script>

<template>
  <article>
    <h3>{{ name }}</h3>
    <button type="button" @click="emit('select', id)">Select</button>
    <button type="button" @click="emit('addToCart', id)">Add to cart</button>
  </article>
</template>
```

### `ProductFilters.vue`

```vue
<script setup lang="ts">
import type { SortBy } from '@/types/product'

defineProps<{
  query: string
  sortBy: SortBy
}>()

const emit = defineEmits<{
  'update:query': [value: string]
  'update:sortBy': [value: SortBy]
  reset: []
}>()
</script>
```

### `BaseModal.vue`

```vue
<script setup lang="ts">
defineProps<{ open: boolean }>()

const emit = defineEmits<{
  close: []
}>()
</script>
```

Полный typed contract компонента = **typed props + typed emits**.

---

## 12. Сопоставление props ↔ emits

Хороший checklist:

| Prop | Related emit | Payload sync? |
|------|--------------|---------------|
| `query: string` | `update:query` | `string` |
| `sortBy: SortBy` | `update:sortBy` | `SortBy` |
| `open: boolean` | `close` | no payload / or `update:open` |
| — | `select` | `id: number` |

Если prop union узкий, emit payload не должен быть шире.

---

## 13. `any` и слабые payloads

Плохо:

```ts
defineEmits<{
  change: [payload: any]
  action: [data: unknown]
}>()
```

Лучше:

```ts
defineEmits<{
  select: [id: number]
  submit: [payload: LoginForm]
}>()
```

Если кажется, что нужен `unknown`, обычно не хватает domain type.

---

## 14. Runtime validation vs TypeScript

| | TypeScript | Runtime validator |
|---|------------|-------------------|
| Когда ловит | compile / IDE | browser runtime |
| Typo в event name | ✅ | частично |
| Wrong payload shape | ✅ в TS code | ✅ если validator написан |
| Защита от внешнего JS | ❌ | ✅ |

В учебном Vue + TS проекте type-based emits — основной слой.
Runtime validators — опциональны для особенно критичных forms/events.

---

## 15. Частые ошибки

### Забыли payload в типе

```ts
defineEmits<{ select: [] }>()
emit('select', id) // ❌
```

### Слишком широкий update event

```ts
'update:sortBy': [value: string] // ❌
'update:sortBy': [value: SortBy] // ✅
```

### Emit object целиком «на всякий случай»

```ts
emit('select', product) // если нужен только id — усложняет contract
emit('select', product.id) // обычно лучше
```

### Untyped parent handler

```ts
function onSelect(id) {
  // implicit any в strict mode
}
```

Добавь тип:

```ts
function onSelect(id: number) {}
```

### Путают call signature и tuple syntax

Выбери один стиль в проекте — лучше tuple.

---

## 16. Мини-набор правил Module 4 для emits

```text
1. type-based defineEmits по умолчанию
2. tuple syntax: event: [payload]
3. empty tuple для events без payload
4. sync payload types с props для v-model
5. shared emit types при повторении contract
6. no any / unknown в public emits
```

---

## 17. Что важно понять после этого блока

Проверь себя:

1. Как читается `select: [id: number]`?
2. Чем tuple syntax удобнее call signatures?
3. Как типизировать `update:query` для `v-model:query`?
4. Зачем выносить emit types в `src/types`?
5. Почему `change: [payload: any]` плох?
6. Что должно совпадать между prop `sortBy` и emit `update:sortBy`?

---

## 18. Что почитать

### Официальное

- [Typing Component Emits · Vue.js](https://vuejs.org/guide/typescript/composition-api.html#typing-component-emits)
- [Typing Component Emits · Vue.js RU](https://ru.vuejs.org/guide/typescript/composition-api.html#typing-component-emits)
- [Component Events · Vue.js](https://vuejs.org/guide/components/events.html)

### Связанные материалы этого плана

- [Module 4 · typing props](./01-typing-props.md)
- [Module 2 · defineEmits](../module-2/08-defineEmits.md)
- [Module 3 · emits](../module-3/02-emits.md)

---

## 19. Практическое мини-задание

Доработай catalog types:

1. Добавь в `src/types/product.ts`:
   - `ProductCardEmits`
   - `ProductFiltersEmits`
   - `ProductListEmits` *(если нужен re-emit select)*
2. Переведи components на `defineEmits<...>()`
3. Типизируй parent handlers (`onSelect`, `onReset`)
4. Намеренно передай wrong payload и поймай TS error
5. Проверь, что `update:sortBy` использует `SortBy`, а не `string`

### Подсказка

```ts
export type ProductCardEmits = {
  select: [id: number]
  addToCart: [id: number]
}

export type ProductFiltersEmits = {
  'update:query': [value: string]
  'update:sortBy': [value: SortBy]
  reset: []
}
```

---

## 20. Мини-конспект

- typed emits = compile-time output contract
- предпочитай `defineEmits<{ event: [payload] }>()`
- `[]` = event без payload
- для `v-model` синхронизируй prop type и `update:*` payload
- shared emit types помогают документировать API
- `any` в emits нарушает цель Module 4

---

## 21. Что делать дальше

Следующий теоретический блок Module 4:

- **типизация composables**

После typed components логично типизировать reusable logic: что composable принимает и что возвращает.
