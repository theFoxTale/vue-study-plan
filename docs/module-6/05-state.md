# Module 6 · Теория: state (Pinia)

Этот материал закрывает пятый теоретический пункт `Module 6`: понять, **как объявлять state**, **как его читать/менять**, **`$patch` / `$reset`**, и **как типизировать** начальное состояние.

Связанные материалы:

- [Module 6 · Pinia](./04-pinia.md)
- [Module 4 · interfaces & type aliases](../module-4/04-interfaces-and-type-aliases.md)
- [Module 2 · ref](../module-2/01-ref.md)

---

## 1. Что такое state в Pinia

**State** — центральные данные store: «что сейчас известно приложению» в этом домене.

В Option Store объявляется **функцией**, которая возвращает initial object:

```ts
export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [] as CartItem[],
  }),
})
```

Функция нужна, чтобы каждый раз получать **свежий** initial state (важно для SSR и `$reset`).

Аналогия с component: `state` ≈ `data()`.

Официально:

- [State · Pinia](https://pinia.vuejs.org/core-concepts/state.html)

---

## 2. Правила объявления

1. **Все поля сразу** — даже если значение `null` / `undefined`  
   Новое поле «на лету» (`store.foo = 1`, если `foo` не было в state) Vue/Pinia не сделают реактивным как надо.

2. **Arrow function** для state — лучше для TypeScript inference.

3. **Пустые массивы / null** — помогай типам через `as` или interface return type.

```ts
state: () => ({
  items: [] as CartItem[],
  user: null as User | null,
})
```

или:

```ts
interface CartState {
  items: CartItem[]
}

state: (): CartState => ({
  items: [],
})
```

---

## 3. Чтение и запись

```ts
const cart = useCartStore()

cart.items
cart.items.push({ productId: '1', qty: 1 }) // прямая мутация возможна
```

В template:

```vue
<p>{{ cart.items.length }}</p>
<input v-model.number="cart.someField" />
```

В Pinia **нет** обязательных Vuex-мутаций: писать в state можно напрямую.
На практике предпочтительнее менять state через **actions** (следующий урок после getters) — так логика в одном месте и лучше видна в DevTools.

---

## 4. `storeToRefs` снова

```ts
import { storeToRefs } from 'pinia'

const cart = useCartStore()
const { items } = storeToRefs(cart)

// ❌ ломает реактивность:
// const { items } = cart
```

Используй `storeToRefs`, когда деструктурируешь state/getters в `<script setup>`.

---

## 5. `$patch` — несколько изменений разом

### Object patch

```ts
cart.$patch({
  // только для полей, которые удобно заменить целиком
})
```

### Function patch (удобно для массивов)

```ts
cart.$patch((state) => {
  state.items.push({ productId: '42', qty: 1 })
})
```

Зачем `$patch`:

- сгруппировать изменения в **одну** запись DevTools
- удобно менять коллекции без копирования всего state вручную

Прямые мутации тоже трекаются; `$patch` — когда хочешь batch.

---

## 6. `$reset` — сброс к initial

В Option Stores:

```ts
cart.$reset()
// снова вызывает state() и подменяет текущее состояние
```

Типичные случаи:

- logout → сбросить user/cart
- «Clear cart»
- конец wizard

В Setup Stores встроенного `$reset` нет — пишешь свой (урок setup stores).

---

## 7. Пример: cart state

```ts
// src/types/cart.ts
export type CartItem = {
  productId: string
  qty: number
}
```

```ts
// src/stores/cart.ts
import { defineStore } from 'pinia'
import type { CartItem } from '@/types/cart'

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [] as CartItem[],
  }),
})
```

Пока без getters/actions — только данные.
Дальше добавишь `totalQty`, `add`, `remove`.

Плохой state:

```ts
state: () => ({
  items: [],
  // UI одной page:
  isCheckoutModalOpen: false,
  hoveredProductId: null,
})
```

UI-флаги одной page — local. В cart store держи **cart domain**.

---

## 8. Пример: auth state

```ts
state: () => ({
  user: null as { id: string; name: string } | null,
  token: null as string | null,
}),
```

```ts
const auth = useAuthStore()
const isAuthenticated = computed(() => auth.user !== null)
// лучше как getter — следующий урок
```

---

## 9. Подписка `$subscribe` (обзор)

```ts
cart.$subscribe((mutation, state) => {
  localStorage.setItem('cart', JSON.stringify(state.items))
})
```

Полезно для persist.
По умолчанию подписка из component отвяжется при unmount; `{ detached: true }` — оставить жить.

Для Module 6 practice persist — stretch; сначала стабильный in-memory state.

---

## 10. State vs URL vs local

| Данные | Куда |
|--------|------|
| `cart.items` | Pinia state |
| `?category=` | route query |
| `isModalOpen` | local ref |
| `products` с API | чаще page/composable (не обязан быть store state) |

Не складывай в state «все данные, которые когда-либо fetch'ил».

---

## 11. Частые ошибки

### Не объявил поле в initial state

Потом `store.newField = …` — сюрпризы с реактивностью.

### `items: []` без типа

Inference станет `never[]` / слишком узким — пиши `as CartItem[]`.

### Деструктуризация без `storeToRefs`

UI «застыл».

### State = весь app

Вернись к дроблению stores.

### Заменить state целиком неправильно

Не ломай реактивность самодельным `store.$state = newObj` без понимания; для сброса — `$reset` / `$patch`.

---

## 12. Что важно понять после этого блока

Проверь себя:

1. Почему `state` — функция, а не объект?
2. Что обязательно объявить заранее?
3. Зачем `$patch` с function?
4. Что делает `$reset`?
5. Как типизировать пустой массив в state?
6. Какие данные не стоит класть в cart state?

---

## 13. Что почитать

### Официальное

- [State · Pinia](https://pinia.vuejs.org/core-concepts/state.html)

### Связанные материалы этого плана

- [Module 6 · Pinia](./04-pinia.md)
- [Module 6 · когда store не нужен](./03-when-store-is-not-needed.md)

---

## 14. Практическое мини-задание

1. Опиши `CartItem` type
2. Сделай `useCartStore` только со `state.items`
3. Из details добавь item прямой мутацией **временно**
4. Добавь кнопку Clear → `cart.$reset()`
5. Перепиши добавление на `$patch((state) => …)` и сравни в DevTools

---

## 15. Мини-конспект

- `state: () => ({ ... })` — initial snapshot домена
- объявляй все поля сразу, типизируй empty/null
- читать/писать можно через `store.field`; для batch — `$patch`
- Option Store: `$reset()` возвращает initial
- дальше — **getters** (производные от state)

---

## 16. Что делать дальше

Следующий теоретический блок Module 6:

- [`getters`](./06-getters.md)
