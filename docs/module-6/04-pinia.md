# Module 6 · Теория: Pinia

Этот материал закрывает четвёртый теоретический пункт `Module 6`: понять, **что такое Pinia**, **как подключить**, **как объявить первый store**, и **чем это лучше самодельных global refs**.

Связанные материалы:

- [Module 6 · когда store не нужен](./03-when-store-is-not-needed.md)
- [Module 6 · локальное vs глобальное](./01-local-vs-global-state.md)
- [Module 4 · types in store & router](../module-4/07-types-in-store-and-router.md)

---

## 1. Что такое Pinia

**Pinia** — официальная библиотека store для Vue.

Store в Pinia:

- держит **global / shared state**
- не привязан к дереву components
- доступен из pages, layout, composables, router guards
- имеет три опоры: **state**, **getters**, **actions**  
  (как `data` / `computed` / `methods` у component)

Официально:

- [Pinia · Introduction](https://pinia.vuejs.org/introduction.html)
- [Getting Started](https://pinia.vuejs.org/getting-started.html)

---

## 2. Зачем Pinia, если можно `export const state = reactive({})`

В чистом SPA «самодельный global reactive» часто работает.
Pinia всё равно даёт:

| | DIY `reactive` module | Pinia |
|---|----------------------|-------|
| DevTools | слабо | stores, actions timeline |
| SSR / request isolation | легко протечь state между запросами | рассчитана на SSR |
| Conventions | свои | state / getters / actions |
| TypeScript DX | руками | хороший inference |
| HMR stores | руками | из коробки |
| Plugins | нет стандарта | есть |

Для учебного плана и реальных Vue app **Pinia — default**, когда app-wide store действительно нужен.

---

## 3. Установка и подключение

```bash
npm install pinia
```

```ts
// main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.mount('#app')
```

Порядок:

1. `createPinia()`
2. `app.use(pinia)` **до** использования stores
3. router после/рядом — если guards читают store, pinia должна быть active

`create-vue` с галочкой Pinia делает это за тебя.

---

## 4. Что такое store на практике

Аналогия:

```text
Component: локальный UI + local state
Store:     «всегда живой» кусок domain state + logic
```

Примеры доменов:

```text
useCartStore
useAuthStore
useFavoritesStore
```

Не:

```text
useAppStore  // products + cart + theme + modals + …
```

Один store ≈ один bounded context / фича.

---

## 5. Первый store (Options-style preview)

```ts
// src/stores/cart.ts
import { defineStore } from 'pinia'

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [] as { productId: string; qty: number }[],
  }),
  getters: {
    totalQty: (state) => state.items.reduce((sum, i) => sum + i.qty, 0),
  },
  actions: {
    add(productId: string, qty = 1) {
      const line = this.items.find((i) => i.productId === productId)
      if (line) line.qty += qty
      else this.items.push({ productId, qty })
    },
  },
})
```

Разбор по кускам — в следующих уроках (`state`, `getters`, `actions`).
Setup stores (`defineStore` + function как composable) — отдельный урок.

Пока важно:

- `defineStore(id, options)`
- `id` уникален (`'cart'`)
- export `useXxxStore` — naming convention

---

## 6. Использование в component

```vue
<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useCartStore } from '@/stores/cart'

const cart = useCartStore()
const { totalQty, items } = storeToRefs(cart)
// actions можно деструктурить напрямую:
const { add } = cart
</script>

<template>
  <p>In cart: {{ totalQty }}</p>
  <button type="button" @click="add('42')">Add</button>
</template>
```

### `storeToRefs`

При деструктуризации `state` / `getters` реактивность **ломается**, если взять поля просто так.
`storeToRefs(cart)` сохраняет refs.

Actions — обычные функции, их можно доставать без `storeToRefs`.

---

## 7. Файловая структура

```text
src/
  stores/
    cart.ts
    auth.ts
    favorites.ts
  pages/
  components/
```

Правила:

- один store — один файл
- имя файла ≈ id / domain
- не складируй все stores в один `stores.ts`

---

## 8. Pinia и Router

Типичный связный сценарий:

```ts
// router/index.ts
router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login' }
  }
})
```

Store вызывается **внутри** guard (когда pinia уже `app.use`'нута), не на top-level модуля до создания app.

Cart badge в `App.vue` header + `CartPage` + Add на details — классика shared Pinia state после Module 5 routing.

---

## 9. Option store vs Setup store (карта Module 6)

| Стиль | Как выглядит | Дальше в плане |
|-------|--------------|----------------|
| Options | `state` / `getters` / `actions` objects | уроки state → getters → actions |
| Setup | `defineStore(id, () => { ... return {} })` | урок **setup stores** |

Оба официальны. Для старта Options проще читать «как component options».
Setup гибче (composable-style). Выберешь удобный после обоих уроков.

---

## 10. Что Pinia не заменяет

| Задача | Не Pinia first |
|--------|----------------|
| Local UI flag | `ref` в component |
| Filters в shareable URL | `route.query` |
| Feature logic без global state | composable |
| Subtree DI | provide/inject |
| HTTP details | api module / Module 7 |

Pinia = слой **shared client state + domain actions**, не «весь backend в store».

---

## 11. Частые ошибки старта

### `useCartStore()` до `app.use(pinia)`

Ошибка контекста. Подключай plugin раньше.

### Один mega-store

Снова god store — дроби по доменам.

### Деструктуризация state без `storeToRefs`

UI не обновляется — «Pinia сломалась».

### Импорт store как singleton данных

Паттерн — `useXxxStore()` внутри setup/guard/action, не «голые» мутации модуля в обход store API.

### Завести Pinia «на всё» после установки

Вернись к [когда store не нужен](./03-when-store-is-not-needed.md).

---

## 12. Что важно понять после этого блока

Проверь себя:

1. Что такое Pinia store одной фразой?
2. Зачем `createPinia` + `app.use`?
3. Почему DIY `reactive` export хуже как default?
4. Зачем `storeToRefs`?
5. Как назвать и разложить файлы stores?
6. Связка Router + Pinia: где вызывать `useAuthStore`?

---

## 13. Что почитать

### Официальное

- [Getting Started](https://pinia.vuejs.org/getting-started.html)
- [Core Concepts](https://pinia.vuejs.org/core-concepts/)
- [Introduction](https://pinia.vuejs.org/introduction.html)

### Связанные материалы этого плана

- [Module 6 · когда store не нужен](./03-when-store-is-not-needed.md)
- [Module 5 · navigation guards](../module-5/10-navigation-guards.md)

---

## 14. Видео для этого блока

Официальный Pinia Guide — must. Видео помогают увидеть anti-patterns и DevTools.

### Рекомендуется

1. **Eduardo San Martin Morote — Pinia Disasterclass (Vue.js Nation 2024)**  
   [YouTube](https://www.youtube.com/watch?v=D61hGeliypY)  
   Автор Pinia: типичные провалы (god store, wrong usage) и правильные паттерны — прямо про Module 6/13.

2. **Eduardo — State, Routing, and the Future of Vue**  
   [YouTube](https://www.youtube.com/watch?v=ng7JSla1Vaw)  
   Как state и routing живут рядом в Vue-экосистеме.

### Дополнительно

3. **DejaVue #E030 — Pinia and Data Loaders (с Eduardo)**  
   [YouTube](https://www.youtube.com/watch?v=dUztjolNZig)  
   Подкаст: зачем Pinia, куда смотрит data-loading (полезно рядом с Module 8).

### Короткий маршрут

| Время | Что |
|------|-----|
| ~30–45 мин | Pinia Disasterclass |
| + docs | [Pinia Getting Started](https://pinia.vuejs.org/getting-started.html) |
| практика | `useCartStore` + DevTools Pinia tab |

---

## 15. Практическое мини-задание

1. Установи `pinia`, подключи в `main.ts`
2. Создай `src/stores/cart.ts` с пустым `items` и action `add`
3. В header покажи `totalQty`, на details — кнопку Add
4. Убедись, что переход Catalog → Details → назад **сохраняет** cart
5. Открой Vue DevTools → Pinia и найди store `cart`

---

## 16. Мини-конспект

- Pinia — официальный store для Vue (state / getters / actions)
- `createPinia` → `app.use(pinia)` → `defineStore` → `useXxxStore()`
- один domain — один store-файл
- `storeToRefs` для reactive деструктуризации state/getters
- дальше Module 6 углубляет state, getters, actions, setup stores, design practices

---

## 17. Что делать дальше

Следующий теоретический блок Module 6:

- [`state`](./05-state.md)
