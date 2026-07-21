# Module 6 · Теория: setup stores

Этот материал закрывает восьмой теоретический пункт `Module 6`: понять, **как писать store в Composition-стиле**, **чем `ref` / `computed` / `function` соответствуют state / getters / actions**, и **когда выбирать Setup vs Options**.

Связанные материалы:

- [Module 6 · Pinia](./04-pinia.md)
- [Module 6 · state](./05-state.md)
- [Module 6 · getters](./06-getters.md)
- [Module 6 · actions](./07-actions.md)

---

## 1. Два синтаксиса `defineStore`

| | Option Store | Setup Store |
|---|--------------|-------------|
| Второй аргумент | объект `{ state, getters, actions }` | функция `() => { ... return {} }` |
| Ощущение | Options API component | `<script setup>` / composable |
| Гибкость | проще старт | выше (watchers, composables) |

Оба официальны и равноправны для Pinia.

Официально:

- [Defining a Store · Pinia](https://pinia.vuejs.org/core-concepts/)

---

## 2. Базовый Setup Store

```ts
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { CartItem } from '@/types/cart'

export const useCartStore = defineStore('cart', () => {
  // state
  const items = ref<CartItem[]>([])

  // getters
  const totalQty = computed(() =>
    items.value.reduce((sum, i) => sum + i.qty, 0),
  )
  const isEmpty = computed(() => items.value.length === 0)

  // actions
  function add(productId: string, qty = 1) {
    const line = items.value.find((i) => i.productId === productId)
    if (line) line.qty += qty
    else items.value.push({ productId, qty })
  }

  function remove(productId: string) {
    items.value = items.value.filter((i) => i.productId !== productId)
  }

  function clear() {
    items.value = []
  }

  return {
    items,
    totalQty,
    isEmpty,
    add,
    remove,
    clear,
  }
})
```

Соответствие:

```text
ref / reactive  → state
computed        → getters
function        → actions
```

В consumer API тот же:

```ts
const cart = useCartStore()
cart.add('42')
cart.totalQty // unwrap на store instance
```

---

## 3. Обязательно return всего state

Pinia должна «увидеть» state properties.

```ts
// ❌ «приватный» ref не в return — ломает DevTools / SSR / plugins
const items = ref<CartItem[]>([])
function add() { /* uses items */ }
return { add } // items потеряются для Pinia state tracking
```

```ts
// ✅
return { items, totalQty, add }
```

Не делай `readonly(items)` в return вместо самого state, если хочешь полноценный Pinia state — для инкапсуляции лучше не экспортировать сырой mutate API, а экспортировать actions (сам `items` всё равно обычно возвращают для чтения; мутации — через actions).

---

## 4. `$reset` в Setup Store

В Option Store `$reset()` встроен.
В Setup — пишешь сам:

```ts
export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])

  function $reset() {
    items.value = []
  }

  function clear() {
    $reset()
  }

  return { items, clear, $reset }
})
```

---

## 5. Side-by-side: Options vs Setup

### Options

```ts
defineStore('counter', {
  state: () => ({ count: 0 }),
  getters: {
    double: (state) => state.count * 2,
  },
  actions: {
    increment() {
      this.count++
    },
  },
})
```

### Setup

```ts
defineStore('counter', () => {
  const count = ref(0)
  const double = computed(() => count.value * 2)
  function increment() {
    count.value++
  }
  return { count, double, increment }
})
```

Смысл один — синтаксис разный.

---

## 6. Что Setup умеет удобнее

### Composables внутри store

```ts
defineStore('search', () => {
  const q = ref('')
  // например VueUse / свой composable
  // const debouncedQ = useDebounce(q, 300)

  return { q }
})
```

На SSR composables внутри store бывают сложнее — для учебного SPA обычно ок.

### `watch` внутри store

```ts
watch(
  items,
  (value) => {
    localStorage.setItem('cart', JSON.stringify(value))
  },
  { deep: true },
)
```

Альтернатива — `$subscribe` (Options/Setup instance API).

### `inject` / `useRoute` (осторожно)

Можно, но **не возвращай** `route` из store как state — это не данные store.
Часто route лучше читать в page, а в store класть уже нормализованные значения.

---

## 7. Использование в component — без изменений

```vue
<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useCartStore } from '@/stores/cart'

const cart = useCartStore()
const { items, totalQty } = storeToRefs(cart)
const { add } = cart
</script>
```

Тот же `storeToRefs`, те же actions.

---

## 8. Что выбрать в Module 6 practice

| Выбирай Options, если… | Выбирай Setup, если… |
|------------------------|----------------------|
| хочешь явные секции state/getters/actions | уже думаешь composable-style |
| команда/туториал на Options | нужны watchers/composables внутри |
| проще читать новичкам | переписываешь логику из composable в store |

Для плана достаточно **уверенно читать оба** и выбрать один стиль для своих stores (не мешай без нужды в одном файле).

Рекомендация для catalog practice: Setup, если комфортен Composition API; иначе Options — тоже отлично.

---

## 9. Миграция Option → Setup (чеклист)

1. `state: () => ({ x })` → `const x = ref(...)`
2. getters `(state) =>` → `computed(() => x.value ...)`
3. actions с `this.x` → functions с `x.value`
4. `return { ...всё state, getters, actions }`
5. добавить `$reset` при необходимости
6. прогнать UI / DevTools

---

## 10. Частые ошибки

### Не вернул state ref

Pinia не трекает свойство.

### Путаешь `.value` внутри store и снаружи

Внутри setup store — `.value` у refs.
На `cart.items` снаружи store instance — уже unwrapped (как reactive store).

### Return `route` / огромных non-state объектов

Загрязняет store state.

### Ждёшь встроенный `$reset`

В Setup его нет из коробки.

### Смешиваешь Options и Setup в одном `defineStore`

Второй аргумент — либо options object, либо setup function, не гибрид.

---

## 11. Что важно понять после этого блока

Проверь себя:

1. Чем Setup Store похож на composable?
2. Что становится state / getters / actions?
3. Почему нужно return всех state refs?
4. Как сделать `$reset` в Setup?
5. Когда Setup предпочтительнее Options?
6. Меняется ли API для component?

---

## 12. Что почитать

### Официальное

- [Defining a Store](https://pinia.vuejs.org/core-concepts/)
- [State](https://pinia.vuejs.org/core-concepts/state.html) *($reset в setup)*

### Связанные материалы этого плана

- [Module 6 · actions](./07-actions.md)
- [Module 6 · Pinia](./04-pinia.md)

---

## 13. Практическое мини-задание

1. Возьми свой `useCartStore` (Options) и перепиши в Setup **или** напиши Setup с нуля
2. Сохрани те же: `items`, `totalQty`, `add`, `remove`, `clear` / `$reset`
3. UI не должен измениться
4. Добавь `watch` или persist в localStorage *(optional)*
5. Сравни читаемость Options vs Setup для себя — зафиксируй выбор на practice

---

## 14. Мини-конспект

- Setup Store = `defineStore(id, () => { ... return {} })`
- `ref` → state, `computed` → getters, `function` → actions
- return всего state обязателен
- `$reset` пишешь сам
- API для UI тот же; дальше — **best practices** проектирования stores

---

## 15. Что делать дальше

Следующий (последний теоретический) блок Module 6:

- **best practices проектирования store**

Разберём границы доменов, naming, что не класть в store и как не вырастить god store.
