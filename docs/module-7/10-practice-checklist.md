# Module 7 · Практический checklist

Пошаговый чеклист для закрытия **практической части Module 7**: подключить **реальный или mock API**, собрать **data layer**, показать **loading / error / empty / success**, catalog + detail + search — **без хаоса fetch в components**.

Используй этот файл как рабочий документ: проходи шаги по порядку и отмечай выполненные пункты.

---

## Перед стартом

### Module 5–6 должны быть закрыты

- [ ] SPA с Router: catalog + `/products/:id`
- [ ] lazy routes, `useRoute` / `useRouter`
- [ ] Pinia для **client state** (cart / favorites / auth) — не для всего подряд
- [ ] typed models + parse (Module 4)

### Прочитай теорию Module 7

- [01 · fetch](01-fetch.md)
- [02 · axios](02-axios.md) *(или осознанный выбор fetch-only)*
- [03 · обработка ошибок](03-error-handling.md)
- [04 · async UI states](04-async-ui-states.md)
- [05 · пагинация](05-pagination.md)
- [06 · query params](06-query-params.md)
- [07 · отмена запросов](07-request-cancellation.md)
- [08 · повторные запросы](08-retries.md)
- [09 · data layer](09-data-layer.md)

---

## Шаг 1. Выбрать проект и API

| Вариант | API | Когда |
|---------|-----|--------|
| **Product Catalog** | DummyJSON / Fake Store | recommended |
| **Users list** | JSONPlaceholder `/users` | если catalog уже исчерпан |
| **Blog posts** | JSONPlaceholder `/posts` | list + detail + search |

### Рекомендация

Продолжай **тот же catalog app**. Module 7 — заменить mock/static data на **HTTP + data layer**.

### Checklist

- [ ] выбран один внешний API (или свой mock server)
- [ ] CORS / Vite proxy решён *(если нужно)*
- [ ] `npm run dev` стартует

---

## Шаг 2. Зафиксировать MVP Module 7

### MVP (критерии README)

- `src/api/*` — все HTTP вынесены из components
- **Catalog list** с API (не hardcoded array в page)
- **Detail by id** (`/products/:id`) с API
- **Search** или фильтр через query + API *(хотя бы один)*
- состояния: **loading**, **error**, **empty**, **success**
- **Retry** на error (кнопка)
- **parse** ответа (`unknown` → domain type)
- **toAppError** / нормализация ошибок
- **products не в Pinia** — server data в composable/api
- cart/favorites остаются в Pinia *(client state)*

### Из README practice — покрытие

| Тема | MVP |
|------|-----|
| каталог товаров | обязательно |
| карточка по id | обязательно |
| поиск по API | обязательно *(или category filter через API)* |
| список пользователей | optional stretch |

### Не обязательно в MVP

- TanStack Vue Query *(Module 8)*
- auto-retry с backoff
- полная pagination UI *(можно limit без Prev/Next)*
- persist server cache в store
- GraphQL

### Checklist

- [ ] MVP записан
- [ ] scope не уехал в Module 8 (vue-query rewrite)

---

## Шаг 3. Data layer: структура файлов

```text
src/
  api/
    client.ts       # axios или fetch base
    errors.ts       # HttpError, toAppError, isRetryable
    products.ts     # fetchProducts, fetchProductById, search…
    catalogQuery.ts # parse route query → api params (optional)
  composables/
    useCatalogProducts.ts
    useProductDetails.ts
  types/
    product.ts
  pages/
    CatalogPage.vue
    ProductDetailsPage.vue
  stores/
    cart.ts         # без products[]
```

### Checklist

- [ ] папка `api/` создана
- [ ] один HTTP client (fetch wrapper **или** axios instance)
- [ ] нет `fetch`/`axios.get` внутри `ProductCard.vue`

---

## Шаг 4. HTTP client + errors

Выбери **один** стек:

- **fetch** + `httpJson` + `HttpError`
- **axios** + `api.create` + `axios.isAxiosError`

### Checklist

- [ ] проверка HTTP status (`ok` / reject)
- [ ] `toAppError(e)` возвращает `{ code, message, status? }`
- [ ] `aborted` не показывается как user error

---

## Шаг 5. API functions + parse

```ts
// products.ts — пример контракта
fetchProducts(params, { signal? })
fetchProductById(id, { signal? })
searchProducts(q, { signal? })
```

### Checklist

- [ ] ответы парсятся через `parseProduct` / `parseProducts`
- [ ] нет `as Product[]` без runtime check
- [ ] api-функции **без** `ref` / template logic

---

## Шаг 6. Catalog: async UI states

На `CatalogPage` или через `useCatalogProducts`:

```text
loading → error (+ Retry) → empty → ProductList
```

### Checklist

- [ ] spinner / skeleton при первой загрузке
- [ ] error message + кнопка Retry
- [ ] empty: «No products» *(не путать с error)*
- [ ] success: список карточек

---

## Шаг 7. Detail page by id

- [ ] `watch(() => route.params.id)` + load *(reuse component!)*
- [ ] loading / error / not found / success article
- [ ] прямой заход на `/products/:id` работает
- [ ] Add to cart → **Pinia**, не refetch всего catalog ради этого

---

## Шаг 8. Search или filters + query

Минимум один сценарий:

**A) Search**

```text
/catalog?q=phone  →  API search  →  list
```

**B) Category filter**

```text
/catalog?category=phones  →  API params
```

### Checklist

- [ ] `parseCatalogQuery(route.query)` *(или аналог)*
- [ ] `watch` query → load
- [ ] смена filter/search сбрасывает `page` на 1 *(если есть page)*

---

## Шаг 9. Pagination *(recommended, можно упростить)*

- [ ] `page` + `limit` в API params
- [ ] Prev / Next **или** только `?page=` в URL
- [ ] `totalPages` / disabled buttons

Если API без total — зафиксируй упрощение: «load more» или фиксированный limit без total.

---

## Шаг 10. Abort при смене query

- [ ] `AbortController` (или signal) в load
- [ ] abort предыдущего запроса при новом load
- [ ] abort в `onBeforeUnmount`
- [ ] быстрый клик page 1→2→3 показывает **последний** результат

---

## Шаг 11. Client vs server — явная граница

Заполни таблицу:

| Данные | Где живут | Почему |
|--------|-----------|--------|
| products list | | api + composable |
| product detail | | |
| cart items | | Pinia |
| search draft input | | local до Apply |
| category in URL | | route.query |

### Checklist

- [ ] таблица заполнена
- [ ] можешь объяснить одним абзацем «products не в store»

---

## Шаг 12. Users list *(optional stretch)*

Если делаешь второй resource:

- [ ] `src/api/users.ts` + `UsersPage.vue`
- [ ] те же 4 async states
- [ ] отдельный composable, не смешивать с products store

---

## Шаг 13. Ручной QA

1. Catalog load success  
2. Offline / bad URL → error → Retry  
3. Empty search result → empty UI  
4. Detail id valid / invalid  
5. Fast filter change → нет «отката» старых данных  
6. Cart badge после add — без перезагрузки products из API  
7. DevTools: запросы идут через api, не из random components  

### Checklist

- [ ] все пункты пройдены

---

## Шаг 14. Финальная самопроверка

1. Где в проекте data layer?
2. Чем server data отличается от cart в Pinia?
3. Чем empty отличается от error?
4. Зачем abort?
5. Почему parse не в template?
6. Когда бы ты перешёл на Vue Query (Module 8)?

### Checklist

- [ ] ответы своими словами

---

## Финальный checklist Module 7

Module 7 можно считать завершённым, если:

### Проект

- [ ] catalog (или эквивалент) грузится с API
- [ ] detail by id с API
- [ ] search/filter через API
- [ ] app собирается и работает

### Критерии README

- [ ] `loading`, `error`, `empty`, `success` реализованы
- [ ] запросы не размазаны по components
- [ ] типизация + parse + обработка ошибок
- [ ] понятна разница client state vs server data

### Архитектура

- [ ] `src/api/*` + composables
- [ ] Pinia не хранит products list «по умолчанию»
- [ ] Retry на error; abort на смене query *(recommended)*

---

## Stretch goals *(optional)*

- auto-retry на network/5xx (2 попытки)
- полная pagination + total
- `UsersPage` второй resource
- Vite proxy config в репо
- soft loading при refetch
- интеграционный тест parse функций

---

## Если что-то пошло не так

### CORS error

- Vite `server.proxy` или другой public API
- не «чинить» отключением browser security

### Всегда empty, но Network 200

- проверь parse / shape ответа API
- DummyJSON: `products` внутри объекта, не массив root

### Detail показывает старый product

- `watch` на `params.id` + abort

### Error при быстрой навигации

- abort → `code: 'aborted'` → не показывать в UI

### Всё в Pinia store

- вынеси products в composable; store оставь cart/auth

### Дублирование fetch в page и composable

- один путь load

---

## Что делать после Module 7

Переходи к **Module 8 · Server State и кеширование**:

- отличие server state от client state
- `@tanstack/vue-query`
- queries, mutations, invalidation

Module 8 перепишет **ту же** catalog-часть с cache toolkit — Module 7 manual flow должен быть понятен до этого.

---

## Мини-конспект

- Module 7 = api layer + composables + 4 UI states
- server data ≠ Pinia; cart ≠ products API
- parse + errors централизованы
- abort + Retry — часть зрелого data flow
- Module 8 = vue-query upgrade, не замена понимания fetch
