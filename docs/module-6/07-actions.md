# Module 6 · Теория: actions (Pinia)

Этот материал закрывает седьмой теоретический пункт `Module 6`: понять, **зачем actions**, **как менять state через бизнес-логику**, **как писать async actions**, и **где граница store vs component**.

Связанные материалы:

- [Module 6 · state](./05-state.md)
- [Module 6 · getters](./06-getters.md)
- [Module 6 · Pinia](./04-pinia.md)

---

## 1. Что такое actions

**Actions** — методы store: бизнес-логика и любые операции, в том числе **async**.

Аналогия:

```text
state   ≈ data()
getters ≈ computed
actions ≈ methods
```

```ts
actions: {
  increment() {
    this.count++
  },
}
```

Официально:

- [Actions · Pinia](https://pinia.vuejs.org/core-concepts/actions.html)

В Pinia **нет** отдельных Vuex mutations: action может менять `this.*` state напрямую.

---

## 2. Базовый синтаксис

```ts
export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [] as CartItem[],
  }),
  getters: {
    totalQty: (state) => state.items.reduce((s, i) => s + i.qty, 0),
  },
  actions: {
    add(productId: string, qty = 1) {
      const line = this.items.find((i) => i.productId === productId)
      if (line) line.qty += qty
      else this.items.push({ productId, qty })
    },

    remove(productId: string) {
      this.items = this.items.filter((i) => i.productId !== productId)
    },

    clear() {
      this.$reset()
    },
  },
})
```

Важно:

- **не** arrow functions в Option Store actions — нужен `this`
- вызываешь как обычный method: `cart.add('42')`

---

## 3. Зачем не мутировать state из каждого component

Можно:

```ts
cart.items.push({ productId: '1', qty: 1 })
```

Но лучше:

```ts
cart.add('1')
```

Плюсы actions:

- правила домена в одном месте (merge qty, min/max, validation)
- проще тестировать
- DevTools показывают имена actions
- UI не знает внутреннюю структуру сверх необходимости

Правило Module 6:

```text
component → вызывает action
action    → меняет state
getter    → считает производное
```

---

## 4. Async actions

```ts
actions: {
  async login(email: string, password: string) {
    this.status = 'loading'
    this.error = null
    try {
      const user = await api.login({ email, password })
      this.user = user
      this.status = 'success'
    } catch (e) {
      this.status = 'error'
      this.error = e instanceof Error ? e.message : 'Login failed'
      throw e // опционально: пусть форма тоже узнает
    }
  },

  logout() {
    this.$reset()
  },
}
```

```ts
await auth.login(email, password)
```

Actions свободно:

- `await` fetch/api
- вызывать другие actions (`this.otherAction()`)
- возвращать значения / бросать ошибки

Тяжёлый HTTP-клиент лучше держать в `src/api/*`, а action — оркестратор (вызов api → запись state). Module 7 углубит data layer.

---

## 5. Другие stores внутри action

```ts
import { useAuthStore } from '@/stores/auth'

actions: {
  async checkout() {
    const auth = useAuthStore()
    if (!auth.isAuthenticated) {
      throw new Error('Login required')
    }
    // await api.checkout(this.items)
    this.clear()
  },
}
```

Вызывай `useXStore()` **внутри** action, не на top-level файла store (порядок инициализации / SSR).

---

## 6. Примеры practice Module 6

### Cart

```ts
actions: {
  add(productId: string, qty = 1) { /* ... */ },
  setQty(productId: string, qty: number) {
    if (qty <= 0) {
      this.remove(productId)
      return
    }
    const line = this.items.find((i) => i.productId === productId)
    if (line) line.qty = qty
    else this.items.push({ productId, qty })
  },
  remove(productId: string) { /* ... */ },
  clear() {
    this.$reset()
  },
}
```

### Favorites

```ts
actions: {
  toggle(id: string) {
    if (this.ids.includes(id)) {
      this.ids = this.ids.filter((x) => x !== id)
    } else {
      this.ids.push(id)
    }
  },
}
```

### Auth / session

```ts
actions: {
  async login(...) { /* ... */ },
  logout() {
    this.$reset()
  },
  hydrateFromStorage() {
    // optional persist
  },
}
```

### Wizard draft

```ts
actions: {
  setStep1(data: Step1) {
    this.step1 = data
  },
  next() {
    this.step = Math.min(this.step + 1, 3)
  },
  resetWizard() {
    this.$reset()
  },
}
```

---

## 7. В component / page

```vue
<script setup lang="ts">
import { useCartStore } from '@/stores/cart'

const cart = useCartStore()

function onAdd(id: string) {
  cart.add(id)
}
</script>

<template>
  <button type="button" @click="cart.add(product.id)">
    Add to cart
  </button>
</template>
```

Actions можно деструктурировать **без** `storeToRefs`:

```ts
const { add, remove } = useCartStore()
```

Они привязаны к store.

---

## 8. Actions vs getters vs api module

| Слой | Делает |
|------|--------|
| getter | чистый sync derive из state |
| action | меняет state, side effects, async |
| `api/cart.ts` | HTTP/details запроса |
| component | UI events → вызывает action; показывает state/getters |

Плохо: огромный action, который парсит HTML и рисует toast и ходит в 5 endpoints без структуры.
Хорошо: тонкий action + понятные helpers/api.

---

## 9. `$onAction` (обзор)

```ts
cart.$onAction(({ name, after, onError }) => {
  after(() => {
    console.log('done', name)
  })
  onError((e) => {
    console.warn(e)
  })
})
```

Для analytics / глобального error toast.
В Module 6 practice не обязательно.

---

## 10. Частые ошибки

### Arrow action в Option Store

```ts
actions: {
  add: () => { this.items... } // ❌ this не store
}
```

### Бизнес-правила размазаны по 10 components

Перенеси в `add` / `toggle` / `login`.

### Async прямо в getter

Только actions.

### Action = весь Module 7 data layer

Не раздувай store: api отдельно, action пишет результат.

### Молча глотать ошибки login

Либо пиши в `state.error`, либо `throw` — но UI должен узнать.

### Вызов store на top-level модуля

`useAuthStore()` внутри action/setup/guard, не при import времени без pinia.

---

## 11. Что важно понять после этого блока

Проверь себя:

1. Чем actions отличаются от getters?
2. Почему в Option Store actions не arrow functions?
3. Можно ли `await` внутри action?
4. Зачем `cart.add` вместо прямого `push` из UI?
5. Как вызвать другой store из action?
6. Что оставить в `api/*`, а что в action?

---

## 12. Что почитать

### Официальное

- [Actions · Pinia](https://pinia.vuejs.org/core-concepts/actions.html)

### Связанные материалы этого плана

- [Module 6 · getters](./06-getters.md)
- [Module 6 · state](./05-state.md)

---

## 13. Практическое мини-задание

1. Перенеси все мутации cart в actions: `add`, `remove`, `setQty`, `clear`
2. Favorites: `toggle(id)`
3. Auth mock: `login` / `logout` (можно fake `await delay`)
4. Из UI убери прямые записи в `items` / `ids`
5. В DevTools проверь, что клики видны как actions

---

## 14. Мини-конспект

- actions = methods store: sync/async бизнес-логика
- меняют state через `this`; группируют правила домена
- UI вызывает actions, не расползается по мутациям
- другие stores — `useXStore()` внутри action
- дальше — **setup stores** (тот же смысл, composable-синтаксис)

---

## 15. Что делать дальше

Следующий теоретический блок Module 6:

- **setup stores**

Разберём `defineStore(id, () => { ... })`, `ref`/`computed` вместо state/getters и как писать actions-функции.
