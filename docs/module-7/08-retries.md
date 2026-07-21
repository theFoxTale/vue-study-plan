# Module 7 · Теория: повторные запросы

Этот материал закрывает восьмой теоретический пункт `Module 7`: понять, **когда повторять запрос**, **чем Retry-кнопка отличается от auto-retry**, **что такое backoff**, и **почему retry ≠ abort**.

Связанные материалы:

- [Module 7 · обработка ошибок](./03-error-handling.md)
- [Module 7 · отмена запросов](./07-request-cancellation.md)
- [Module 7 · async UI states](./04-async-ui-states.md)

---

## 1. Два вида «повтора»

| | User Retry | Auto-retry |
|---|------------|------------|
| Кто инициирует | кнопка «Try again» | код после ошибки |
| Когда | всегда по желанию пользователя | policy (network, 5xx) |
| UX | прозрачно | может скрыть краткий сбой |
| Module 7 MVP | **обязательно** | optional |

```ts
// User Retry — уже есть с урока error handling
async function retry() {
  await load()
}
```

Auto-retry — для transient failures (сеть моргнула, 502).

---

## 2. Retry vs abort — разные задачи

| | Abort | Retry |
|---|-------|-------|
| Зачем | отменить **устаревший** intent | повторить **тот же** intent после сбоя |
| Триггер | новый page/filter, unmount | ошибка network / 5xx |
| UI | тихо | loading снова / «Retrying…» |

```text
page 1 → page 2     → abort запрос page 1
network fail       → retry тот же запрос
```

Не путай: abort не «повторяет», retry не отменяет гонку *(если не abort'ишь retry loop при новом query)*.

---

## 3. Когда retry имеет смысл

### Обычно да

- network offline / timeout (временно)
- HTTP **502**, **503**, **504**
- иногда **429** Too Many Requests *(с backoff)*

### Обычно нет

- **400** Bad Request — баг клиента / validation
- **401** / **403** — auth, не «ещё раз»
- **404** — ресурса нет
- **parse / validation** — данные битые, повтор не поможет
- **abort** — не retry

```ts
function isRetryable(error: AppError): boolean {
  if (error.code === 'network') return true
  if (error.code === 'http' && error.status) {
    if (error.status >= 500) return true
    if (error.status === 429) return true
  }
  return false
}
```

---

## 4. Простой manual retry loop

```ts
async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  options?: { maxAttempts?: number; delayMs?: number; signal?: AbortSignal },
): Promise<T> {
  const maxAttempts = options?.maxAttempts ?? 3
  const delayMs = options?.delayMs ?? 500
  let lastError: unknown

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (options?.signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError')
    }
    try {
      return await fn()
    } catch (e) {
      lastError = e
      const appError = toAppError(e)
      if (appError.code === 'aborted') throw e
      if (!isRetryable(appError) || attempt === maxAttempts) throw e
      await sleep(delayMs * attempt) // linear backoff
    }
  }
  throw lastError
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
```

Использование:

```ts
const result = await fetchWithRetry(
  () => fetchProductsPage(params, { signal }),
  { maxAttempts: 3, signal },
)
```

---

## 5. Exponential backoff (идея)

```text
attempt 1 → wait 300ms
attempt 2 → wait 600ms
attempt 3 → wait 1200ms
```

```ts
const wait = baseDelay * 2 ** (attempt - 1)
await sleep(wait)
```

Зачем: не долбить упавший сервер и не получить 429.

Для pet-project достаточно 2–3 попыток с небольшой задержкой.
Module 8 (Vue Query) даст `retry` / `retryDelay` из коробки.

---

## 6. UI при auto-retry

Пользователь должен понимать, что происходит:

```vue
<p v-if="isLoading && retryAttempt > 1">
  Retrying… (attempt {{ retryAttempt }})
</p>
```

Или тихий retry 1–2 раза, потом error + кнопка Retry — компромисс для catalog.

Не делай бесконечный retry без feedback.

---

## 7. User Retry в error state

Из [async UI states](./04-async-ui-states.md):

```vue
<div v-else-if="error" role="alert">
  <p>{{ error.message }}</p>
  <button type="button" :disabled="isLoading" @click="load">
    {{ isLoading ? 'Loading…' : 'Retry' }}
  </button>
</div>
```

При Retry:

1. `error = null`
2. `isLoading = true`
3. тот же `load()` / те же params
4. abort предыдущий in-flight, если был

User Retry **не** обязан использовать auto-retry внутри — можно один чистый запрос.

---

## 8. POST / мутации — осторожно

GET list — idempotent, retry безопасен.

```text
POST /orders  — повтор может создать дубликат
```

Для Module 7 practice (read-heavy catalog) retry на GET ok.
Для create/update нужны idempotency keys / server dedup — позже.

---

## 9. axios interceptors retry (обзор)

Можно retry в response interceptor на 5xx — централизованно.

Минусы:

- сложнее учитывать abort
- retry на все GET подряд без policy

Для учебного проекта проще **явный** `fetchWithRetry` на нужных api-функциях или только кнопка Retry.

---

## 10. Связка: load + abort + retry

```ts
let controller: AbortController | null = null

async function load(filters: CatalogFilters) {
  controller?.abort()
  controller = new AbortController()
  const { signal } = controller

  isLoading.value = true
  error.value = null
  retryAttempt.value = 0

  try {
    const result = await fetchWithRetry(
      async () => {
        retryAttempt.value++
        return fetchProductsPage(toApiParams(filters), { signal })
      },
      { maxAttempts: 2, signal },
    )
    items.value = result.items
  } catch (e) {
    const appError = toAppError(e)
    if (appError.code === 'aborted') return
    error.value = appError
  } finally {
    if (!signal.aborted) isLoading.value = false
  }
}
```

Смена query abort'ит loop — retry не применит stale результат.

---

## 11. Частые ошибки

### Retry на 404 / validation

Бессмысленная нагрузка, пользователь ждёт зря.

### Retry без limit

Бесконечный spinner.

### Retry POST «на всякий случай»

Дубликаты на сервере.

### Auto-retry вместо кнопки Retry

Пользователь не контролирует ситуацию при долгом outage.

### Retry не сбрасывает error до loading

Мигает старый error text.

### Забыть abort при новом load во время retry delay

`sleep` между попытками — проверяй `signal.aborted` перед следующей.

---

## 12. Что важно понять после этого блока

Проверь себя:

1. Чем user Retry отличается от auto-retry?
2. Какие HTTP-коды обычно retryable?
3. Зачем backoff?
4. Почему retry не заменяет abort?
5. Безопасен ли retry для GET products?
6. Когда auto-retry лучше не делать?

---

## 13. Что почитать

### Связанные материалы этого плана

- [Module 7 · обработка ошибок](./03-error-handling.md)
- [Module 7 · отмена запросов](./07-request-cancellation.md)

### Preview Module 8

- [TanStack Query · Query Retries](https://tanstack.com/query/latest/docs/framework/vue/guides/query-retries)

---

## 14. Практическое мини-задание

1. Кнопка Retry на error state *(если ещё нет)*
2. Добавь `isRetryable` и 2 auto-retry только для network/5xx *(optional)*
3. Сымитируй offline → online: auto или manual retry работает
4. Убедись: 404 **не** auto-retries
5. При быстрой смене page abort прерывает retry loop

---

## 15. Мини-конспект

- user Retry — must-have; auto-retry — policy на transient errors
- retryable: network, 5xx, иногда 429; не retry: 4xx, parse, abort
- backoff снижает нагрузку; лимит попыток обязателен
- GET catalog — ok; POST — осторожно
- финал Module 7 theory — **data layer**: когда fetch хватает, когда нет

---

## 16. Что делать дальше

Следующий (последний теоретический) блок Module 7:

- **когда хватает обычного `fetch`, а когда нужен отдельный data layer**

Соберём границы api / composable / store / Vue Query preview.
