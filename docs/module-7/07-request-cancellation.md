# Module 7 · Теория: отмена запросов

Этот материал закрывает седьмой теоретический пункт `Module 7`: понять, **зачем отменять HTTP-запросы**, **как использовать `AbortController`**, и **как не показывать abort как ошибку пользователю**.

Связанные материалы:

- [Module 7 · query params](./06-query-params.md)
- [Module 7 · обработка ошибок](./03-error-handling.md)
- [Module 5 · useRoute](../module-5/06-use-route.md)

---

## 1. Проблема: гонки запросов

Пользователь быстро меняет фильтры или страницы:

```text
запрос A: category=phones   (медленный)
запрос B: category=laptops  (быстрый)
  → B приходит первым ✓
  → A приходит вторым ✗ — UI показывает phones вместо laptops
```

Это **race condition**: побеждает не последний intent, а последний **ответ**.

Типичные триггеры:

- смена `route.query` (page, category, `q`)
- уход со страницы до завершения fetch
- повторный Retry до конца предыдущего load
- debounced search с overlapping requests

**Отмена** — отменить устаревший запрос или игнорировать его результат.

---

## 2. Два подхода

| Подход | Суть |
|--------|------|
| **Abort** | прервать запрос на уровне сети (`AbortController`) |
| **Ignore stale** | запрос идёт, но результат старого id не применяем |

Abort предпочтительнее: меньше лишней работы, проще mental model.
Ignore иногда проще для legacy API без signal — оба знай.

---

## 3. `AbortController` + fetch

```ts
const controller = new AbortController()

await fetch('/api/products', {
  signal: controller.signal,
})

controller.abort() // отмена
```

После `abort()` Promise reject с `DOMException` / `AbortError`:

```ts
try {
  await fetch(url, { signal })
} catch (e) {
  if (e instanceof DOMException && e.name === 'AbortError') {
    return // тихо — не error UI
  }
  throw e
}
```

В [обработке ошибок](./03-error-handling.md) это `code: 'aborted'`.

---

## 4. axios + `signal`

```ts
const controller = new AbortController()

await api.get('/products', {
  params: { category: 'phones' },
  signal: controller.signal,
})

controller.abort()
```

Axios 0.22+ поддерживает `AbortController` (как fetch).
Старый `CancelToken` — legacy; для нового кода — **signal**.

```ts
axios.isCancel(error) // legacy cancel token
// для AbortError — проверяй name / toAppError
```

---

## 5. Паттерн: один controller на «текущий» load

```ts
let abortController: AbortController | null = null

async function loadProducts(params: CatalogFilters) {
  abortController?.abort()
  abortController = new AbortController()
  const signal = abortController.signal

  isLoading.value = true
  error.value = null

  try {
    const result = await fetchProductsPage(toApiParams(params), { signal })
    if (signal.aborted) return
    items.value = result.items
  } catch (e) {
    const appError = toAppError(e)
    if (appError.code === 'aborted') return
    error.value = appError
  } finally {
    if (!signal.aborted) {
      isLoading.value = false
    }
  }
}
```

Каждый новый load **убивает** предыдущий.

Передай `signal` в api:

```ts
export async function fetchProductsPage(
  params: Record<string, unknown>,
  options?: { signal?: AbortSignal },
) {
  const { data } = await api.get('/products', {
    params,
    signal: options?.signal,
  })
  return normalizePaginated(data)
}
```

---

## 6. Связка с `watch(route.query)`

```ts
watch(
  () => parseCatalogQuery(route.query),
  (filters) => {
    loadProducts(filters)
  },
  { immediate: true },
)
```

Без abort быстрый клик по page 1 → 2 → 3 может оставить данные page 1.

С abort остаётся только ответ **последнего** вызова `loadProducts`.

---

## 7. Ignore stale (request id)

Если abort недоступен:

```ts
let requestId = 0

async function load() {
  const id = ++requestId
  const data = await fetchProducts()
  if (id !== requestId) return // устарело
  products.value = data
}
```

Проще внедрить, но запросы всё равно бегут по сети.

---

## 8. Уход со страницы

```vue
<script setup lang="ts">
import { onBeforeUnmount } from 'vue'

let controller: AbortController | null = null

async function load() {
  controller?.abort()
  controller = new AbortController()
  // ...
}

onBeforeUnmount(() => {
  controller?.abort()
})
</script>
```

Или в composable:

```ts
export function useCatalogProducts() {
  let controller: AbortController | null = null

  onBeforeUnmount(() => controller?.abort())

  async function load(/* ... */) { /* ... */ }

  return { load, /* ... */ }
}
```

`onBeforeRouteLeave` — если нужно abort до navigation guard side effects.

Не обновляй state unmounted component — abort + проверка `signal.aborted` помогают.

---

## 9. Abort ≠ error для пользователя

```text
abort → не показывать красный banner
abort → не increment error analytics как failure
abort → не ставить error ref
```

В `toAppError`:

```ts
if (e instanceof DOMException && e.name === 'AbortError') {
  return { code: 'aborted', message: 'Request aborted', cause: e }
}
```

В load:

```ts
if (appError.code === 'aborted') return
```

Loading: в `finally` снимай spinner только если **этот** request не aborted **или** уже стартовал новый (осторожно с flicker — часто проще всегда `isLoading = false` в finally текущего call, а новый load сразу ставит true).

Практичный вариант:

```ts
finally {
  if (!signal.aborted) {
    isLoading.value = false
  }
}
```

Новый load уже выставил `isLoading = true` в начале.

---

## 10. Retry и abort

При Retry abort предыдущий in-flight load:

```ts
function retry() {
  loadProducts(parseCatalogQuery(route.query))
}
```

Два быстрых Retry — один controller pattern достаточен.

---

## 11. Debounced search + abort

```ts
const draftQ = ref('')
let searchTimer: ReturnType<typeof setTimeout> | null = null

function onDraftInput() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    router.push({ query: { ...route.query, q: draftQ.value || undefined, page: '1' } })
  }, 300)
}
```

Watch на query вызовет `load` с abort предыдущего — debounce + abort вместе снижают гонки.

---

## 12. Частые ошибки

### Показывать AbortError как «Network failed»

Пользователь видит ложную ошибку при быстрой навигации.

### Не abort при unmount

Warning в console / setState on unmounted.

### Несколько независимых loaders без координации

Detail page + list — отдельные controllers на каждый composable.

### Abort и кеш

Если позже кешируешь ответ — aborted request не должен портить кеш.

### Забыть передать signal в api wrapper

Controller создали, но axios/fetch его не получил.

---

## 13. Что важно понять после этого блока

Проверь себя:

1. Что такое race condition при API?
2. Как работает `AbortController`?
3. Как передать signal в axios?
4. Почему abort не показывают в UI?
5. Когда нужен abort при `watch(route.query)`?
6. Чем abort лучше только request id?

---

## 14. Что почитать

### Официальное

- [MDN · AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
- [Axios · Cancellation](https://axios-http.com/docs/cancellation)

### Связанные материалы этого плана

- [Module 7 · query params](./06-query-params.md)
- [Module 7 · обработка ошибок](./03-error-handling.md)

---

## 15. Практическое мини-задание

1. Добавь `signal` в `fetchProductsPage`
2. При каждом load abort предыдущий controller
3. Быстро переключи page 1→2→3 — UI должен показать page 3
4. Уйди со страницы во время loading — без error banner
5. В DevTools Network увидь cancelled requests *(optional)*

---

## 16. Мини-конспект

- быстрая смена query → гонки; abort решает
- один controller на текущий load; abort старый перед новым
- fetch/axios: `signal: controller.signal`
- `aborted` — не user error
- дальше — **повторные запросы** (retry policy)

---

## 17. Что делать дальше

Следующий теоретический блок Module 7:

- [повторные запросы](./08-retries.md)
