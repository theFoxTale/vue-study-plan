# Module 13 · Теория: слой stores

Этот материал закрывает седьмой теоретический пункт Module 13: **слой stores (Pinia)** — что класть в store, где жить файлам, god store vs slice-by-feature, связь с vue-query/composables и правила для Product Catalog.

Связанные материалы:

- [Module 13 · composables](./06-composables-layer.md)
- [Module 6 · Pinia](../module-6/04-pinia.md)
- [Module 8 · server vs client state](../module-8/01-server-state-vs-client-state.md)

---

## 1. Store в архитектуре Module 13

```text
Pinia store = shared client state + actions
              с чётким доменом (cart, auth, ui-session)
```

| В store | Не в store |
|---------|------------|
| cart lines, qty | products list с сервера → vue-query |
| auth token / user session | form draft login → local composable / v-model |
| UI prefs (theme) optional | one-off modal open на одной page |
| cross-route client data | derived только для одного ProductCard |

```text
Server state  → API + vue-query (Module 8)
Client state  → Pinia / local composable
```

Store — **не** «вторая база данных для всего API».

---

## 2. Где лежат store-файлы

Type-based (устаревает):

```text
src/stores/cart.ts
src/stores/auth.ts
```

Feature / entity-based (цель Module 13):

```text
features/cart/model/useCartStore.ts
features/auth/model/useAuthStore.ts
entities/cart/model/useCartStore.ts   # альтернатива, если cart = entity
```

```text
✅ store рядом с feature, которая им владеет
❌ shared/stores/cart.ts — cart не «shared без домена»
❌ один stores/index.ts god barrel на 20 stores без нужды
```

Public API:

```ts
// features/cart/index.ts
export { useCartStore } from './model/useCartStore'
```

---

## 3. Один домен — один store (обычно)

```ts
// features/cart/model/useCartStore.ts
export const useCartStore = defineStore('cart', () => {
  const items = ref<CartLine[]>([])

  const totalItems = computed(() =>
    items.value.reduce((n, i) => n + i.qty, 0),
  )

  function addItem(product: Product, qty = 1) { /* … */ }
  function removeItem(lineId: string) { /* … */ }
  function clear() { items.value = [] }

  return { items, totalItems, addItem, removeItem, clear }
})
```

```text
cart store  — только корзина
auth store  — только сессия
```

**Не:**

```ts
defineStore('app', () => {
  // cart + auth + products + filters + toasts + modals
})
```

God store = любой компонент подписан на «всё» → лишние rerenders (Module 12).

---

## 4. Setup store vs options store

Composition API style (`setup` store) — предпочтителен в этом плане:

```ts
defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const isLoggedIn = computed(() => !!token.value)
  function setSession(session: Session) { /* … */ }
  function logout() { /* … */ }
  return { user, token, isLoggedIn, setSession, logout }
})
```

Options API store — ок, если команда так договорилась; naming и границы те же.

---

## 5. Store vs composable vs query — матрица catalog

| Данные | Инструмент | Почему |
|--------|------------|--------|
| `products[]` | vue-query | server, cache, stale |
| `cart.items` | Pinia | client, cross-page |
| `auth.session` | Pinia (+ persist optional) | cross-page, guards |
| `catalog filters` | `useCatalogFilters` | local to feature/page |
| `toast queue` | shared composable / tiny store | UI infra |
| `modal open` | `useDisclosure` / `useModal` | ephemeral |

```text
Вопрос: «должно ли это пережить уход со страницы
и понадобиться в header / другой route?»
  Да → store (или query cache)
  Нет → composable / local ref
```

---

## 6. Кто вызывает store

```text
✅ features/cart/ui/CartBadge.vue → useCartStore()
✅ features/cart/useAddToCart.ts → useCartStore()
✅ navigation guard → useAuthStore()
❌ entities/product/ui/ProductCard.vue → useCartStore()
❌ shared/ui/BaseButton → любой store
```

**ProductCard** эмитит `add`; feature handler / parent вызывает store — изоляция rerenders (Module 12) + чистые слои (Module 13).

Pages могут читать store для layout (`CartBadge` в header), но толстую логику лучше в feature composable.

---

## 7. Actions: границы ответственности

```ts
// ✅ store action — меняет своё state
function addItem(product: Product) {
  const existing = items.value.find(i => i.productId === product.id)
  if (existing) existing.qty++
  else items.value.push({ id: crypto.randomUUID(), productId: product.id, … })
}

// ⚠️ action, который ещё и fetch + toast + router
async function checkout() {
  await placeOrder(…)
  toast.push(…)
  router.push('/thanks')
}
```

Тяжёлый **сценарий checkout** лучше:

```text
features/checkout/usePlaceOrder.ts
  → api placeOrder
  → cart.clear()
  → toast
  → router
```

Store остаётся **владельцем cart state**, не владельцем всего UX.

```text
Store actions: sync domain mutations (+ optional persist)
Feature composable: orchestration side effects
```

---

## 8. Persist и hydration

```ts
// optional pinia-plugin-persistedstate
persist: { key: 'catalog-cart', paths: ['items'] }
```

```text
Persist: cart, theme, auth token (осторожно XSS)
Не persist: ephemeral UI, server mirrors
```

При старте app: pinia → потом router guards, читающие auth.

---

## 9. Stores и тесты

```ts
beforeEach(() => {
  setActivePinia(createPinia())
})

const cart = useCartStore()
cart.addItem(fixtureProduct)
expect(cart.totalItems).toBe(1)
```

Module 11 · store testing. Fresh pinia каждый тест — обязательно.

---

## 10. Catalog: целевая карта stores

```text
features/cart/model/useCartStore.ts     id: 'cart'
features/auth/model/useAuthStore.ts     id: 'auth'

optional:
features/ui/model/useUiStore.ts         sidebar open — или composable
```

Минимум для MVP архитектуры: **cart + auth** (auth optional если нет login).

Products — **не** store, если уже vue-query.

---

## 11. Импорты и циклы

```text
useCartStore → type Product from entities/product     ✅
useCartStore → useAuthStore внутри каждого action     ⚠️ coupling
useAuthStore → useCartStore.clear на logout           ✅ осознанно в auth feature composable logout()
```

Лучше logout orchestration:

```ts
// features/auth/useLogout.ts
export function useLogout() {
  const auth = useAuthStore()
  const cart = useCartStore()
  function logout() {
    auth.clearSession()
    cart.clear()
  }
  return { logout }
}
```

Store↔store напрямую — только простые случаи; иначе feature composable.

---

## 12. Частые ошибки

### God `useAppStore`

Всё приложение в одном defineStore.

### Products в Pinia «на всякий случай»

Дублирует vue-query; invalidate становится ручным адом.

### Store в `shared/`

Доменный state не shared infrastructure.

### Читать весь store в template

```vue
{{ cart }}  <!-- подписка шире нужного -->
```

Лучше `storeToRefs` / конкретные поля.

### Мутировать `items` из компонента в обход actions

Ломает инварианты и тесты; только actions.

### Store вызывает `fetch` без api layer

Обойди api → дублирование и сложные моки.

---

## 13. Что важно понять после этого блока

Проверь себя:

1. Server vs client — что в Pinia для catalog?
2. Где файл `useCartStore` в feature-based структуре?
3. Почему не god store?
4. ProductCard и store — кто вызывает `addItem`?
5. Checkout side effects — store или composable?
6. Когда filters в store, когда в `useCatalogFilters`?

---

## 14. Что почитать

### Официальное

- [Pinia · Defining a Store](https://pinia.vuejs.org/core-concepts/)
- [Pinia · Composing Stores](https://pinia.vuejs.org/cookbook/composing-stores.html)

### Связанные материалы этого плана

- [Module 6 · Pinia](../module-6/04-pinia.md)
- [Module 11 · store testing](../module-11/06-store-testing.md)
- [Module 12 · лишние rerenders](../module-12/02-unnecessary-rerenders.md)
- [Module 13 · composables](./06-composables-layer.md)

---

## 15. Практическое мини-задание

1. Инвентарь state: query / pinia / local — таблица на 10 пунктов.
2. Перенеси `useCartStore` в `features/cart/model/` + export из index.
3. Убери store из `ProductCard`; оставь emit + `useAddToCart`.
4. Разрежь god store, если есть (cart vs auth).
5. Store test: add / remove / clear — green.

---

## 16. Мини-конспект

- Pinia = **client** cross-route state; server → vue-query
- store живёт в **feature/entity**, не в свалке без правил
- один домен — один store; no god store
- actions меняют state; orchestration UX — composable
- entity UI без store subscription
- дальше — **работа с env**

---

## 17. Что делать дальше

Следующий теоретический блок Module 13:

- [Работа с `env`](./08-env.md)
