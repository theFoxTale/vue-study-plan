# Module 8 · Теория: отличие server state от client state

Этот материал открывает **Module 8** и закрывает первый теоретический пункт: чётко разделить **server state** и **client state**, понять **почему Pinia + fetch не закрывают server data**, и **когда нужен TanStack Query**.

Связанные материалы:

- [Module 7 · data layer](../module-7/09-data-layer.md)
- [Module 6 · локальное vs глобальное](../module-6/01-local-vs-global-state.md)
- [Module 7 · practice checklist](../module-7/10-practice-checklist.md)

---

## 1. Два мира состояния

В SPA после Module 6–7 у тебя уже два типа данных:

```text
Client state   — cart, auth session, UI flags, wizard draft
Server state   — products[], product by id, users from API
```

**Client state** — то, что приложение **владеет** в браузере.
**Server state** — **копия** данных backend'а, которая может устареть в любой момент.

```text
Server — source of truth
App    — cache + presentation
```

Module 8 учит управлять **вторым** типом профессионально.

---

## 2. Client state — напоминание

| Примеры | Где |
|---------|-----|
| cart line items | Pinia |
| favorite ids (session) | Pinia |
| `isModalOpen` | local `ref` |
| filters в URL | `route.query` |

Признаки client state:

- источник правды — **действия пользователя** в app
- не «синхронизируется с сервером» автоматически *(кроме явного save)*
- переживает navigation в рамках SPA session

Module 6 закрыл этот слой.

---

## 3. Server state — что это

| Примеры | Откуда |
|---------|--------|
| список products | `GET /products` |
| product `:id` | `GET /products/42` |
| search results | `GET /products/search?q=` |
| user profile (read) | `GET /users/me` |

Признаки server state:

- источник правды — **backend**
- может быть **stale** (устарела) сразу после fetch
- один и тот же resource запрашивают **несколько экранов**
- нужны loading/error/refetch/cache политики

Module 7 научил **ручному** flow: api + composable + loading/error.

---

## 4. Почему server state «особенный»

### Async по природе

Client: `cart.add()` — синхронно в памяти.
Server: fetch → wait → parse → maybe error.

### Shared + dedupe

```text
CatalogPage грузит products
ProductDetails тоже может нуждаться в том же product
Back на catalog — снова products?
```

Без стратегии — duplicate requests или устаревший UI.

### Stale while revalidate

Пользователь видит **кеш**, пока идёт фоновый refetch — UX паттерн, редкий в чистом Pinia.

### Invalidation

После `POST /products` список на catalog **устарел** — нужно invalidate/refetch, не ручной `products.value = await fetch...` в пяти местах.

---

## 5. Таблица сравнения

| | Client state | Server state |
|---|--------------|--------------|
| Source of truth | app / user | backend |
| Sync | мгновенно | async |
| Stale? | нет *(в рамках session)* | да, всегда потенциально |
| Типичный инструмент Module 6 | Pinia / local | api + composable |
| Типичный инструмент Module 8 | Pinia *(как было)* | **TanStack Query** |
| Пример | cart qty | product price from API |

---

## 6. Почему не класть server data в Pinia «навсегда»

Работает на маленьком demo, ломается при росте:

```ts
// useCatalogStore
products: []
isLoading: false
error: null
async fetchProducts() { /* ... */ }
```

Проблемы:

- дублирование loading/error для каждого resource
- нет стандартных query keys / cache TTL
- refetch/invalidate вручную везде
- store раздувается: products + users + orders + …
- смешение cart (client) и products (server) в одном store

Pinia **может** держать server cache, но ты **сам** пишешь то, что Vue Query даёт из коробки.

Критерий Module 8 README:

> можно объяснить, зачем vue-query, а не просто fetch + store

---

## 7. Что Module 7 уже дал (ручной server state)

```text
api/products.ts
useCatalogProducts() → isLoading, error, items, load(), abort
```

Это **правильная база**. Vue Query **не заменяет** api/parse — он заменяет **orchestration**:

```text
Module 7: ты сам пишешь watch, loading, abort, retry
Module 8: QueryClient управляет cache + status + refetch
```

Если Module 7 не закрыт — вернись к [practice checklist](../module-7/10-practice-checklist.md).

---

## 8. Что добавляет TanStack Vue Query (preview)

| Задача | Module 7 вручную | Vue Query |
|--------|------------------|-----------|
| Cache по key | сам | queryKey |
| Dedupe in-flight | abort/id | автоматически |
| loading/error | refs | `isPending`, `isError` |
| Refetch on focus | сам | опции |
| Invalidate after mutation | ручной load() | `invalidateQueries` |
| Retry | fetchWithRetry | `retry` option |

Module 8 пройдёт queries → mutations → invalidation → optimistic → cache lifecycle.

Официально:

- [TanStack Query · Vue Overview](https://tanstack.com/query/latest/docs/framework/vue/overview)

---

## 9. Границы после Module 8

Даже с Vue Query:

```text
Client state  → Pinia / local / URL
Server state  → useQuery / useMutation + api/*
```

```text
❌ cart в useQuery
❌ products list в Pinia без Query
✅ useProductsQuery() + useCartStore()
```

Auth **token** — client (Pinia).
User **profile from API** — server (Query).

---

## 10. Catalog: разложение по типам

| Данные | Тип | Module 8 home |
|--------|-----|---------------|
| products list | server | `useQuery(['products', filters])` |
| product by id | server | `useQuery(['product', id])` |
| cart items | client | `useCartStore` |
| search draft | client | local ref до Apply |
| `?page=&q=` | URL | queryKey input |

После mutation «Add product» (stretch):

```ts
queryClient.invalidateQueries({ queryKey: ['products'] })
```

---

## 11. Когда Vue Query не нужен

- один fetch на весь app, без shared cache
- статический JSON в `/public`
- server data уже полностью на SSR с другим toolkit (Nuxt useFetch) — другой модуль

Для catalog SPA с list + detail + search Module 8 **оправдан**.

---

## 12. Частые ошибки

### «Всё в Query»

Cart, modal open — не query.

### «Всё остаётся в Pinia»

Module 8 не случился — нет выигрыша от cache.

### Query без api layer

Parse/error в component — дублирование Module 7 ошибок.

### Один queryKey на всё

`['data']` — invalidate ломает лишнее.

### Игнорировать stale

Думать, что cache = вечная правда.

---

## 13. Что важно понять после этого блока

Проверь себя:

1. Чем server state отличается от client state?
2. Почему server data может быть stale?
3. Зачем invalidate после mutation?
4. Почему products не в cart store?
5. Что Module 7 оставляет, что Module 8 добавляет?
6. Когда Vue Query избыточен?

---

## 14. Что почитать

### Официальное

- [TanStack Query · Vue](https://tanstack.com/query/latest/docs/framework/vue/overview)
- [Important Defaults](https://tanstack.com/query/latest/docs/framework/vue/guides/important-defaults)

### Связанные материалы этого плана

- [Module 7 · data layer](../module-7/09-data-layer.md)
- [Module 6 · когда store не нужен](../module-6/03-when-store-is-not-needed.md)

---

## 15. Практическое мини-задание

1. Таблица: 10 полей твоего app → client / server / URL
2. Одним абзацем: «почему products — server state»
3. Отметь, какие экраны Module 7 перепишешь на vue-query first
4. Что **останется** в Pinia после Module 8

---

## 16. Мини-конспект

- server state = async cache backend data; client state = app-owned facts
- Pinia + fetch для server data — crutch на масштабе
- Module 7 manual flow → Module 8 Query toolkit
- cart/auth local; products/users — queries
- следующий урок: **`@tanstack/vue-query`** setup

---

## 17. Что делать дальше

Следующий теоретический блок Module 8:

- **`@tanstack/vue-query`**

Установка, `QueryClient`, `VueQueryPlugin`, первый `useQuery`.
