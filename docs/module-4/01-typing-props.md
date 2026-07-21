# Module 4 · Теория: типизация props

Этот материал открывает **Module 4** и закрывает первый теоретический пункт: понять, **как строго типизировать props в Vue 3 + TypeScript**, **чем type-based declaration отличается от runtime**, и **как выносить Props types в модели**.

> Механика props и one-way flow уже разобраны в Module 2–3. Здесь фокус — **TypeScript contract**.

Связанные материалы:

- [Module 2 · defineProps](../module-2/07-defineProps.md)
- [Module 3 · props](../module-3/01-props.md)
- [Module 3 · practice checklist](../module-3/10-practice-checklist.md)

---

## 1. Зачем типизировать props

Без типов легко получить:

```vue
<ProductCard :price="'80'" />
```

TypeScript + typed props ловят это на этапе разработки:

```text
Type 'string' is not assignable to type 'number'
```

Типизация props даёт:

- autocomplete в parent template/script
- защиту от wrong value types
- living documentation component API
- меньше runtime surprises

Официально:

- [Typing Component Props · Vue.js](https://vuejs.org/guide/typescript/composition-api.html#typing-component-props)

---

## 2. Два способа объявить props types

В `<script setup lang="ts">` есть два подхода:

| Способ | Пример | Когда |
|--------|--------|------|
| **Type-based** | `defineProps<{ price: number }>()` | preferred в TS-проектах |
| **Runtime** | `defineProps({ price: Number })` | нужен runtime validation / Options-style |

**Нельзя смешивать оба сразу** в одном `defineProps()`.

---

## 3. Type-based declaration *(recommended)*

```vue
<script setup lang="ts">
const props = defineProps<{
  name: string
  price: number
  isSelected?: boolean
}>()
</script>
```

### Что получается

- `props.name` → `string`
- `props.price` → `number`
- `props.isSelected` → `boolean | undefined`

Optional prop = `?` в типе.

Vue compiler по возможности генерирует runtime props options из этих types.

---

## 4. Вынести Props в `interface` / `type`

```vue
<script setup lang="ts">
interface ProductCardProps {
  id: number
  name: string
  price: number
  isSelected?: boolean
}

const props = defineProps<ProductCardProps>()
</script>
```

Или импорт из types-файла:

```ts
// src/types/product.ts
export type Product = {
  id: number
  name: string
  price: number
  category?: string
}

export type ProductCardProps = {
  id: number
  name: string
  price: number
  isSelected?: boolean
}
```

```vue
<script setup lang="ts">
import type { ProductCardProps } from '@/types/product'

const props = defineProps<ProductCardProps>()
</script>
```

`import type` подчёркивает: это только типы, не runtime value.

---

## 5. Defaults: `withDefaults` и destructure

Type-based props сами по себе не описывают default values.

### `withDefaults`

```ts
interface Props {
  variant?: 'primary' | 'secondary'
  emptyText?: string
  tags?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  emptyText: 'Nothing found',
  tags: () => [],
})
```

Для arrays/objects default должен быть **factory function**:

```ts
tags: () => []
```

Иначе один и тот же array/object может шариться между instances.

### Reactive props destructure *(Vue 3.5+)*

```ts
const {
  variant = 'primary',
  emptyText = 'Nothing found',
} = defineProps<Props>()
```

Оба подхода валидны. В учебном плане достаточно уверенно владеть `withDefaults`.

---

## 6. Runtime declaration + inference

```vue
<script setup lang="ts">
const props = defineProps({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  isSelected: Boolean,
})

props.name // string
props.price // number
props.isSelected // boolean | undefined  (absent boolean → false at runtime casting, typing may still reflect optionality depending on setup)
</script>
```

Runtime полезен, если хочешь validator:

```ts
defineProps({
  status: {
    type: String,
    required: true,
    validator: (value: string) =>
      ['success', 'warning', 'danger'].includes(value),
  },
})
```

Но для строгих domain unions type-based обычно выразительнее:

```ts
defineProps<{
  status: 'success' | 'warning' | 'danger'
}>()
```

---

## 7. Complex types и `PropType`

### Type-based — просто

```ts
type Product = {
  id: number
  name: string
  price: number
}

defineProps<{
  product: Product
  products: Product[]
}>()
```

### Runtime — через `PropType`

```ts
import type { PropType } from 'vue'
import type { Product } from '@/types/product'

defineProps({
  product: {
    type: Object as PropType<Product>,
    required: true,
  },
  products: {
    type: Array as PropType<Product[]>,
    required: true,
  },
})
```

В TS-first проекте предпочитай type-based. `PropType` чаще нужен в runtime/Options API коде.

---

## 8. Unions, literals, nullable

```ts
defineProps<{
  sortBy: 'name' | 'price'
  selectedId: number | null
  title?: string
}>()
```

### Nullable vs optional

| Тип | Значение |
|-----|----------|
| `title?: string` | prop можно не передать → `undefined` |
| `title: string \| null` | prop обязателен, но может быть `null` |
| `title?: string \| null` | можно не передать, либо передать `null` |

Выбирай осознанно:

```ts
// selected product may be absent
selectedId: number | null

// optional UI flag
isSelected?: boolean
```

---

## 9. Boolean props casting

```ts
defineProps<{
  disabled?: boolean
}>()
```

```vue
<BaseButton disabled />
<BaseButton :disabled="false" />
```

Boolean props удобны для UI-kit, но в типах всё равно описывай их явно.

---

## 10. Object prop vs primitives — typing angle

### Object

```ts
defineProps<{
  product: Product
}>()
```

Плюс: один prop.
Минус: child зависит от всей shape.

### Primitives

```ts
defineProps<{
  id: number
  name: string
  price: number
}>()
```

Плюс: узкий API, проще reuse.
Минус: больше атрибутов в parent.

Для Module 4 зафиксируй types в `src/types/` и переиспользуй их в обоих вариантах.

---

## 11. Типизация props в catalog practice

### `ProductCard.vue`

```vue
<script setup lang="ts">
import type { ProductCardProps } from '@/types/product'

withDefaults(defineProps<ProductCardProps>(), {
  isSelected: false,
})
</script>
```

### `ProductList.vue`

```vue
<script setup lang="ts">
import type { Product } from '@/types/product'

defineProps<{
  products: Product[]
  isLoading: boolean
  error: string
}>()
</script>
```

### `ProductFilters.vue`

```vue
<script setup lang="ts">
defineProps<{
  query: string
  sortBy: 'name' | 'price'
}>()
</script>
```

Parent теперь не сможет случайно передать `sortBy="rating"`, если такого literal нет в union.

---

## 12. Readonly props и mutation

Typed props всё равно **нельзя мутировать** как source of truth:

```ts
const props = defineProps<{ query: string }>()

props.query = 'new' // runtime warning + плохая архитектура
```

Для local editable copy:

```ts
const localQuery = ref(props.query)
```

Для sync with parent — emit `update:query`, не mutation.

TypeScript здесь скорее помогает дизайну API, чем «разрешает» менять props.

---

## 13. Что не стоит типизировать как props

Избегай:

```ts
defineProps<{
  data: any
  payload: object
  flags: Record<string, boolean>
  everything: unknown
}>()
```

Это почти не даёт safety.

Лучше:

```ts
defineProps<{
  products: Product[]
  isLoading: boolean
  error: string
}>()
```

`any` в props — красный флаг для Module 4 criteria.

---

## 14. `vue-tsc` и IDE feedback

В хорошем Vue + TS setup:

- IDE подсказывает допустимые props в template
- `vue-tsc --noEmit` / `npm run typecheck` ловит ошибки
- wrong prop type подсвечивается в parent

Если types «не работают»:

1. проверь `lang="ts"` в `<script setup>`
2. проверь, что используешь type-based **или** runtime, не оба
3. проверь `tsconfig` / Volar (Vue - Official)
4. не прячь ошибки через `as any`

---

## 15. Частые ошибки

### Смешали type-based и runtime

```ts
defineProps<{ price: number }>({ price: Number }) // ❌
```

### Defaults для array/object без factory в `withDefaults`

```ts
withDefaults(defineProps<{ tags?: string[] }>(), {
  tags: [], // ❌ shared reference risk
})
```

### Optional забыли

```ts
defineProps<{ isSelected: boolean }>()
// parent обязан передать; если не всегда нужно — добавь ?
```

### `Product` как any-like object

```ts
product: Record<string, unknown> // слабо
product: Product // лучше
```

### Типы только в child, не в shared models

Дублирование `id/name/price` в 5 файлах → вынеси в `types/product.ts`.

---

## 16. Мини-набор правил Module 4 для props

```text
1. type-based defineProps по умолчанию
2. shared models в src/types
3. withDefaults для optional UI props
4. unions вместо свободных string
5. no any в public props API
6. object vs primitives — осознанный выбор
```

---

## 17. Что важно понять после этого блока

Проверь себя:

1. Чем type-based props отличаются от runtime declaration?
2. Зачем `withDefaults`?
3. Почему default для array пишут как `() => []`?
4. Когда использовать `PropType`?
5. Чем `title?: string` отличается от `title: string | null`?
6. Почему `defineProps<{ data: any }>()` почти бесполезен?

---

## 18. Что почитать

### Официальное

- [Typing Component Props · Vue.js](https://vuejs.org/guide/typescript/composition-api.html#typing-component-props)
- [Typing Component Props · Vue.js RU](https://ru.vuejs.org/guide/typescript/composition-api.html#typing-component-props)
- [Using Vue with TypeScript · Vue.js](https://vuejs.org/guide/typescript/overview.html)

### Связанные материалы этого плана

- [Module 2 · defineProps](../module-2/07-defineProps.md)
- [Module 3 · props](../module-3/01-props.md)

---

## 19. Практическое мини-задание

Возьми catalog из Module 2–3 и ужесточи props types:

1. Создай `src/types/product.ts` с `Product`, `ProductCardProps`, `SortBy`
2. Переведи `ProductCard`, `ProductList`, `ProductFilters` на type-based props
3. Добавь `withDefaults` для optional UI props
4. Намеренно передай wrong type из parent и убедись, что TS ругается
5. Убери любые `any` из props

### Подсказка

```ts
export type SortBy = 'name' | 'price'

export type Product = {
  id: number
  name: string
  price: number
  category?: string
}
```

---

## 20. Мини-конспект

- typed props = compile-time contract компонента
- в TS-проектах предпочитай `defineProps<{...}>()`
- shared interfaces/types выноси в `src/types`
- defaults — через `withDefaults` или destructure defaults
- unions/nullability описывай явно
- `any` в props нарушает цель Module 4

---

## 21. Что делать дальше

Следующий теоретический блок Module 4:

- **[`типизация emits`](./02-typing-emits.md)**

Props описывают input types. Emits описывают **output event payload types** — вторая половина строгого component API.
