# Module 7 · Теория: query params

Этот материал закрывает шестой теоретический пункт `Module 7`: понять, **query в URL браузера** vs **query в HTTP-запросе**, как **синхронизировать фильтры/catalog с `route.query`**, и как **собирать params для API**.

Связанные материалы:

- [Module 5 · useRoute](../module-5/06-use-route.md)
- [Module 7 · пагинация](./05-pagination.md)
- [Module 7 · axios](./02-axios.md)

---

## 1. Два «query» — не путать

| | URL query (Vue Router) | HTTP query (API) |
|---|------------------------|------------------|
| Где | `/catalog?category=phones&page=2` | `GET /api/products?category=phones&page=2` |
| Читаем | `route.query` | axios `params` / `URLSearchParams` |
| Зачем | share link, Back/Forward, bookmark | что просим у сервера |

Часто **одни и те же ключи** (`page`, `category`, `q`), но это **разные слои**:

```text
User меняет фильтр
  → router.push({ query: { category: 'phones', page: '1' } })
  → watch route.query
  → api.get('/products', { params: buildApiParams(route.query) })
```

---

## 2. URL query в Vue Router

```text
/catalog?category=phones&page=2&sort=price-asc
```

```ts
const route = useRoute()

route.query.category // 'phones' (string!)
route.query.page     // '2'
route.query.sort     // 'price-asc'
```

Правила (из Module 5):

- значения **strings** (или `string[]` для повторяющихся ключей)
- парси числа: `Number(route.query.page)`
- проверяй `NaN` и defaults

```ts
function parsePageQuery(raw: unknown): number {
  const n = typeof raw === 'string' ? Number(raw) : 1
  return Number.isFinite(n) && n > 0 ? n : 1
}
```

---

## 3. HTTP query для API

### axios

```ts
await api.get('/products', {
  params: {
    category: 'phones',
    page: 2,
    limit: 20,
    sort: 'price',
  },
})
// → /products?category=phones&page=2&limit=20&sort=price
```

`undefined` / `null` axios обычно **не** сериализует — удобно для optional filters.

### fetch

```ts
const url = new URL('/api/products', window.location.origin)
url.searchParams.set('category', 'phones')
url.searchParams.set('page', '2')
await fetch(url)
```

Или helper `buildSearchParams(obj)`.

---

## 4. Единый builder: URL → API

```ts
// src/api/catalogQuery.ts
export type CatalogFilters = {
  category: string | null
  q: string | null
  page: number
  limit: number
  sort: 'price-asc' | 'price-desc' | 'title-asc'
}

export function parseCatalogQuery(query: Record<string, unknown>): CatalogFilters {
  const category =
    typeof query.category === 'string' && query.category ? query.category : null
  const q = typeof query.q === 'string' ? query.q.trim() : null
  const pageRaw = typeof query.page === 'string' ? Number(query.page) : 1
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1
  const sort =
    query.sort === 'price-desc' || query.sort === 'title-asc'
      ? query.sort
      : 'price-asc'

  return { category, q, page, limit: 20, sort }
}

export function toApiParams(filters: CatalogFilters) {
  return {
    ...(filters.category ? { category: filters.category } : {}),
    ...(filters.q ? { q: filters.q } : {}),
    page: filters.page,
    limit: filters.limit,
    sort: filters.sort,
  }
}
```

Один parse для `route.query`, один объект для axios — **не дублируй** ключи в десяти местах.

---

## 5. Load при смене query

```ts
const route = useRoute()
const filters = computed(() => parseCatalogQuery(route.query))

watch(
  filters,
  async (f) => {
    isLoading.value = true
    error.value = null
    try {
      const result = await fetchProductsPage(toApiParams(f))
      items.value = result.items
      totalPages.value = result.totalPages
    } catch (e) {
      error.value = toAppError(e)
    } finally {
      isLoading.value = false
    }
  },
  { immediate: true, deep: true },
)
```

`immediate: true` — загрузка при первом заходе на `/catalog`.

---

## 6. Обновление query из UI

### Фильтр category

```ts
const router = useRouter()
const route = useRoute()

function setCategory(category: string | null) {
  router.push({
    name: 'catalog',
    query: {
      ...route.query,
      category: category ?? undefined,
      page: '1', // сброс страницы при смене фильтра!
    },
  })
}
```

### Поиск

Два подхода:

| | Apply button | Live search |
|---|--------------|---------------|
| Draft | local `ref` | debounce + push query |
| URL | только после Apply | `q` в query сразу |

Для учебного catalog **Apply** проще: local draft → `router.push({ query: { ... , q, page: '1' } })`.

### Pagination

```ts
function goToPage(page: number) {
  router.push({
    name: 'catalog',
    query: { ...route.query, page: String(page) },
  })
}
```

---

## 7. Сброс `page` при смене фильтров

Классический баг:

```text
page=5 + category=phones
меняем category → phones → laptops
остаётся page=5 → пустая страница
```

Правило:

```text
любое изменение filter/sort/q → page = 1
```

Исключение: только `page` меняется — остальные query сохраняй через spread `route.query`.

---

## 8. Shareable catalog URL

```text
/catalog?category=phones&q=iphone&sort=price-asc&page=2
```

Пользователь может:

- скопировать ссылку
- обновить страницу — те же фильтры
- Back вернёт предыдущий query

Это главный аргумент **query в URL** вместо только Pinia для filters.

---

## 9. params vs query в REST (path identity)

| | Path param | Query param |
|---|------------|-------------|
| Пример | `/products/42` | `/products?category=phones` |
| Смысл | **какой** ресурс | **как показать** список |
| Module 5 | `:id` detail | filters на list |

Detail: `/products/:id` — не смешивай с list filters в path без нужды.

---

## 10. Массивы и повторяющиеся ключи

```text
?tag=phone&tag=sale
```

```ts
route.query.tag // string | string[]
```

axios:

```ts
params: { tag: ['phone', 'sale'] }
// или paramsSerializer для формата API
```

На старте Module 7 достаточно scalar params (`category`, `page`, `q`).

---

## 11. Поиск по API (Module 7 practice)

```ts
export async function searchProducts(params: ReturnType<typeof toApiParams>) {
  const { data } = await api.get('/products/search', { params })
  return parseProducts(data as unknown)
}
```

DummyJSON:

```text
GET https://dummyjson.com/products/search?q=phone
```

Query `q` в URL app и `q` в API могут совпадать — parse один раз, переиспользуй.

---

## 12. Частые ошибки

### Дублировать filters в Pinia и URL

Два source of truth → рассинхрон после Back.

### Забыть stringify page в router query

```ts
page: 2 // может стать ok, но явно String(page) безопаснее
```

### Не сбрасывать page при filter change

Пустые «страницы» и ложный empty.

### Читать query только в `onMounted`

Смена `?page=` без remount — нужен `watch`.

### Отправлять пустые строки в API

`category: ''` — лучше omit через spread / undefined.

### Путать `route.params` и `route.query`

Params — identity; query — options list screen.

---

## 13. Что важно понять после этого блока

Проверь себя:

1. Чем URL query отличается от HTTP query?
2. Почему значения `route.query` — strings?
3. Зачем `page: '1'` при смене category?
4. Где держать parse logic?
5. Почему filters в URL лучше только в store?
6. Как axios `params` связан с `route.query`?

---

## 14. Что почитать

### Связанные материалы этого плана

- [Module 5 · useRoute](../module-5/06-use-route.md)
- [Module 7 · пагинация](./05-pagination.md)
- [MDN · URLSearchParams](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams)

---

## 15. Практическое мини-задание

1. Сделай `parseCatalogQuery` + `toApiParams`
2. Catalog: category + page в `route.query`
3. Apply search: local draft → push `q` + reset page
4. `watch` filters → load с async states
5. Скопируй URL с фильтрами — refresh должен восстановить list

---

## 16. Мини-конспект

- URL query = shareable UI state; HTTP query = request к API
- parse `route.query` → typed filters → axios `params`
- filter/sort/q change → reset page to 1
- watch query, не только onMounted
- дальше — **отмена запросов** при быстрой смене query

---

## 17. Что делать дальше

Следующий теоретический блок Module 7:

- [отмена запросов](./07-request-cancellation.md)
