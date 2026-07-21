# Module 6 · Теория: getters (Pinia)

Этот материал закрывает шестой теоретический пункт `Module 6`: понять, **зачем getters**, **чем они отличаются от state**, **как писать производные значения** и **как переиспользовать getters / другие stores**.

Связанные материалы:

- [Module 6 · state](./05-state.md)
- [Module 6 · Pinia](./04-pinia.md)
- [Module 2 · computed](../module-2/03-computed.md)

---

## 1. Что такое getters

**Getters** — производные (computed) значения store на основе `state` (и других getters).

Аналогия:

```text
state   ≈ data()
getters ≈ computed
actions ≈ methods
```

```ts
export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [] as CartItem[],
  }),
  getters: {
    totalQty: (state) => state.items.reduce((sum, i) => sum + i.qty, 0),
  },
})
```

```ts
const cart = useCartStore()
cart.totalQty // число, кешируется пока items не менялись
```

Официально:

- [Getters · Pinia](https://pinia.vuejs.org/core-concepts/getters.html)

---

## 2. Зачем не считать в component каждый раз

Плохо дублировать:

```ts
// Header.vue
const total = computed(() => cart.items.reduce(...))

// CartPage.vue
const total = computed(() => cart.items.reduce(...))
```

Один getter `totalQty` — один source of derived truth.
Любой consumer читает `cart.totalQty`.

Правило:

```text
сырые данные → state
формулы / агрегаты / флаги из данных → getters
```

---

## 3. Синтаксис: `state` argument

Самый простой и удобный для TS:

```ts
getters: {
  isEmpty: (state) => state.items.length === 0,
  totalQty: (state) => state.items.reduce((sum, i) => sum + i.qty, 0),
}
```

Первый аргумент — reactive `state` store.

---

## 4. Доступ к другим getters: `this`

Если getter использует другой getter, нужен обычный function + `this`:

```ts
getters: {
  totalQty: (state) => state.items.reduce((sum, i) => sum + i.qty, 0),

  label(): string {
    // this.totalQty — другой getter
    return this.isEmpty ? 'Cart is empty' : `${this.totalQty} items`
  },

  isEmpty: (state) => state.items.length === 0,
}
```

С arrow function `this` не привяжется к store — для cross-getter бери method syntax.

Для возврата типа при `this` иногда явно аннотируют return type (`label(): string`).

---

## 5. Getters, которые принимают аргумент

Getter не принимает параметры как обычная computed «с аргументом».
Паттерн: **вернуть функцию**:

```ts
getters: {
  qtyByProductId: (state) => {
    return (productId: string) =>
      state.items.find((i) => i.productId === productId)?.qty ?? 0
  },
}
```

```ts
cart.qtyByProductId('42')
```

Минус: такая функция **не кешируется** Pinia по аргументу как отдельный computed на каждый id — это обычный вызов. Для тяжёлых расчётов подумай дважды.

Альтернатива: getter `itemsById` как `Record` / `Map`, если набор стабилен.

---

## 6. Использование другого store

```ts
import { useProductsStore } from '@/stores/products'

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [] as CartItem[],
  }),
  getters: {
    // Option Store: вызывай useXStore() внутри getter
    subtotal(): number {
      const products = useProductsStore()
      return this.items.reduce((sum, line) => {
        const product = products.byId(line.productId)
        return sum + (product?.price ?? 0) * line.qty
      }, 0)
    },
  },
})
```

Осторожно с циклическими зависимостями stores — проектируй однонаправленно (products ← cart, не оба друг в друга без нужды).

---

## 7. Примеры для practice Module 6

### Cart

```ts
getters: {
  totalQty: (state) => state.items.reduce((s, i) => s + i.qty, 0),
  isEmpty: (state) => state.items.length === 0,
  uniqueProducts: (state) => state.items.length,
}
```

### Favorites

```ts
state: () => ({
  ids: [] as string[],
}),
getters: {
  count: (state) => state.ids.length,
  has: (state) => (id: string) => state.ids.includes(id),
}
```

### Auth

```ts
state: () => ({
  user: null as User | null,
}),
getters: {
  isAuthenticated: (state) => state.user !== null,
  displayName: (state) => state.user?.name ?? 'Guest',
}
```

---

## 8. В component

```vue
<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useCartStore } from '@/stores/cart'

const cart = useCartStore()
const { totalQty, isEmpty } = storeToRefs(cart)
</script>

<template>
  <span v-if="!isEmpty">{{ totalQty }}</span>
</template>
```

Getters попадают в `storeToRefs` так же, как state.

Не делай:

```ts
cart.totalQty = 5 // ❌ getter read-only
```

---

## 9. Getter vs локальный `computed`

| | Store getter | `computed` в component |
|---|--------------|------------------------|
| Нужен в нескольких places | ✅ | дублирование |
| Зависит только от UI одной page | обычно нет | ✅ |
| Часть domain модели (totals, auth flags) | ✅ | можно, но хуже share |
| Зависит от props component | ❌ | ✅ |

```text
domain derived → getter
view-only derived → computed в component
```

---

## 10. Частые ошибки

### Дублировать state и getter

```ts
state: () => ({ totalQty: 0, items: [] })
// и руками синхронизировать totalQty
```

Храни `items`, считай `totalQty` getter'ом.

### Arrow function + `this.otherGetter`

`this` будет не тот — method syntax.

### Тяжёлый getter с аргументом-функцией на каждый render без нужды

Профилируй; иногда лучше предварительный index в state/getter без params.

### Пихать async в getters

Getters синхронные и чистые. Async — **actions**.

### God getters на весь app

Как и state: getter должен жить в своём domain store.

---

## 11. Что важно понять после этого блока

Проверь себя:

1. Чем getters отличаются от state?
2. Когда писать `(state) => ...`, а когда `method()` + `this`?
3. Как сделать getter «с параметром»?
4. Можно ли читать другой store из getter?
5. Почему `totalQty` не дублируют в state?
6. Когда оставить `computed` в component?

---

## 12. Что почитать

### Официальное

- [Getters · Pinia](https://pinia.vuejs.org/core-concepts/getters.html)

### Связанные материалы этого плана

- [Module 6 · state](./05-state.md)
- [Module 2 · computed](../module-2/03-computed.md)

---

## 13. Практическое мини-задание

1. Добавь в cart: `totalQty`, `isEmpty`
2. Покажи `totalQty` в header и на `/cart`
3. Добавь `qtyByProductId` и подпись на кнопке Add («In cart: N»)
4. Для favorites — `has(id)` как getter-функция
5. Убедись, что нигде не хранишь `totalQty` отдельным полем state

---

## 14. Мини-конспект

- getters = computed store: производные от state
- простые — `(state) => ...`; с другими getters — `this`
- «параметры» = getter, возвращающий функцию
- не дублируй агрегаты в state
- async и мутации — не сюда (actions)

---

## 15. Что делать дальше

Следующий теоретический блок Module 6:

- [`actions`](./07-actions.md)
