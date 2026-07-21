# Module 7 · Теория: пагинация

Этот материал закрывает пятый теоретический пункт `Module 7`: понять, **как делить большой список на страницы**, **какие параметры отправлять в API**, и **как связать пагинацию с loading/error/empty**.

Связанные материалы:

- [Module 7 · async UI states](./04-async-ui-states.md)
- [Module 5 · useRoute](../module-5/06-use-route.md)
- [Module 7 · axios](./02-axios.md) *(params)*

---

## 1. Зачем пагинация

Без неё сервер отдаёт «всё сразу»:

```text
10 000 products → тяжёлый JSON, медленный UI, плохой UX
```

**Пагинация** — загрузка **части** данных за запрос:

```text
page 1 → 20 items
page 2 → следующие 20
…
```

Типичные сценарии Module 7 practice:

- catalog products
- users list
- search results

---

## 2. Три основных модели

| Модель | Параметры | Когда |
|--------|-----------|--------|
| **Page-based** | `page`, `limit` (или `perPage`) | REST API, учебные проекты |
| **Offset-based** | `offset`, `limit` | когда API считает с нуля |
| **Cursor-based** | `cursor`, `limit` | бесконечные ленты, большие БД |

Module 7 фокус: **page + limit**.
Cursor — краткий preview; глубже в Module 8 / infinite scroll.

---

## 3. Page-based API

### Запрос

```text
GET /api/products?page=2&limit=20
```

### Ответ (типичный shape)

```json
{
  "products": [ /* ... */ ],
  "total": 156,
  "page": 2,
  "limit": 20
}
```

Или:

```json
{
  "data": [ /* ... */ ],
  "meta": { "total": 156, "page": 2, "limit": 20 }
}
```

На практике **нормализуй** ответ в api-слое:

```ts
export type PaginatedProducts = {
  items: Product[]
  page: number
  limit: number
  total: number
  totalPages: number
}

export async function fetchProductsPage(
  page: number,
  limit = 20,
): Promise<PaginatedProducts> {
  const { data } = await api.get('/products', { params: { page, limit } })
  const raw = data as unknown
  // parse + compute totalPages
  const items = parseProducts(raw)
  const total = /* из meta или items.length для mock */
  return {
    items,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  }
}
```

---

## 4. Считать страницы

```ts
totalPages = Math.ceil(total / limit)
hasNext = page < totalPages
hasPrev = page > 1
```

Пример:

```text
total = 156, limit = 20
totalPages = 8
page 8 → items 141–156
```

Edge:

```text
total = 0 → totalPages = 1 (или 0), UI = empty, не error
limit = 0 → деление на ноль — не отправляй
```

---

## 5. Offset vs page

```text
page 1, limit 20  →  offset 0
page 2, limit 20  →  offset 20
page 3, limit 20  →  offset 40
```

Формула:

```text
offset = (page - 1) * limit
```

Если API ждёт `offset`/`limit` — держи **в UI page**, конвертируй в api:

```ts
await api.get('/products', {
  params: { offset: (page - 1) * limit, limit },
})
```

Пользователю показывай «Страница 2», не «offset 20».

---

## 6. UI: кнопки и номера

### Минимум (MVP)

```vue
<nav aria-label="Pagination">
  <button type="button" :disabled="page <= 1" @click="goToPage(page - 1)">
    Previous
  </button>
  <span>Page {{ page }} of {{ totalPages }}</span>
  <button
    type="button"
    :disabled="page >= totalPages"
    @click="goToPage(page + 1)"
  >
    Next
  </button>
</nav>
```

### С номерами страниц

```text
[ Prev ]  1  2  [3]  4  5  [ Next ]
```

Не рисуй 500 кнопок — показывай окно вокруг текущей (1 … 4 5 **6** 7 8 … 20).

### Load more (альтернатива)

Вместо page numbers — «Load more» **добавляет** items к массиву.
Это ближе к cursor/infinite scroll; для Module 7 достаточно prev/next.

---

## 7. State в component / composable

```ts
const page = ref(1)
const limit = ref(20)
const items = ref<Product[]>([])
const total = ref(0)
const totalPages = ref(1)
const isLoading = ref(false)
const error = ref<AppError | null>(null)

async function loadPage(nextPage: number) {
  if (nextPage < 1) return
  isLoading.value = true
  error.value = null
  try {
    const result = await fetchProductsPage(nextPage, limit.value)
    items.value = result.items
    page.value = result.page
    total.value = result.total
    totalPages.value = result.totalPages
  } catch (e) {
    error.value = toAppError(e)
  } finally {
    isLoading.value = false
  }
}

function goToPage(n: number) {
  if (n === page.value) return
  loadPage(n)
}
```

При смене page:

- **hard loading** — очистить `items`, показать spinner *(проще)*
- **soft loading** — оставить старые items, banner «Updating…» *(лучше UX)*

См. [async UI states](./04-async-ui-states.md).

---

## 8. Пустая страница vs empty catalog

| Ситуация | Что показать |
|----------|--------------|
| `total === 0` на page 1 | empty: «No products» |
| page 5, но total изменился и page > totalPages | перейти на последнюю valid page или page 1 |
| page 2 вернула `[]` при total > 0 | возможно баг API — error или retry |

После delete на сервере total может уменьшиться — пересчитай `totalPages` и clamp page.

---

## 9. Связь с URL *(preview)*

Page в query — shareable и Back-friendly:

```text
/catalog?page=2&limit=20
```

```ts
const route = useRoute()
const router = useRouter()

const page = computed(() => {
  const raw = route.query.page
  const n = typeof raw === 'string' ? Number(raw) : 1
  return Number.isFinite(n) && n > 0 ? n : 1
})

watch(page, (p) => loadPage(p), { immediate: true })

function goToPage(n: number) {
  router.push({ name: 'catalog', query: { ...route.query, page: String(n) } })
}
```

Полный разбор query — следующий урок **query params**.
Здесь важно: **смена page = новый load** с теми же async states.

---

## 10. Cursor-based (кратко)

```text
GET /posts?cursor=abc123&limit=20
→ { items, nextCursor }
```

```ts
await fetchPosts({ cursor: nextCursor.value, limit: 20 })
items.value.push(...result.items) // append, не replace
```

Плюсы: стабильность при частых insert/delete.
Минусы: нельзя «прыгнуть на страницу 7» без цепочки.

Для catalog с numbered pages — page/limit достаточно.

---

## 11. DummyJSON / Fake Store примеры

**DummyJSON:**

```text
GET https://dummyjson.com/products?limit=10&skip=20
```

`skip` = offset, `limit` = page size.

**Fake Store API** — часто без meta total; для учебы total можно mock'нуть или считать длину при малом dataset.

---

## 12. Частые ошибки

### Page в Pinia «на всякий случай»

Page — часть **запроса/URL**, не client domain как cart.
Держи рядом с catalog load logic.

### Не disabled Prev на page 1

Двойной запрос или page 0.

### Забыть loading при goToPage

Старый список + новый — путаница без soft/hard policy.

### `limit` не передаётся в API

Всегда 20 items с сервера, UI думает иначе.

### Infinite scroll без стратегии append

Page-based replace и load-more append — разные модели; не смешивай.

---

## 13. Что важно понять после этого блока

Проверь себя:

1. Чем `page` отличается от `offset`?
2. Как посчитать `totalPages`?
3. Какие async states при `goToPage`?
4. Чем page-based отличается от cursor?
5. Где нормализовать `{ items, total, page }`?
6. Почему page часто живёт в URL?

---

## 14. Что почитать

### Связанные материалы этого плана

- [Module 7 · async UI states](./04-async-ui-states.md)
- [Module 5 · useRoute](../module-5/06-use-route.md)

---

## 15. Практическое мини-задание

1. Добавь `fetchProductsPage(page, limit)` в api
2. Catalog: Prev / Next + «Page X of Y»
3. При loading/error/empty сохрани поведение из урока 04
4. Опционально: `?page=` в URL
5. Проверь: page 1 disabled Prev, last page disabled Next

---

## 16. Мини-конспект

- пагинация = части данных; обычно `page` + `limit`
- ответ: items + total → `totalPages`, hasPrev/hasNext
- смена page = новый load + loading/error/empty
- URL query для page — хорошая практика (следующий урок)
- cursor/load-more — отдельная модель

---

## 17. Что делать дальше

Следующий теоретический блок Module 7:

- **query params**

Разберём фильтры, sort, search и sync с `route.query` / axios `params`.
