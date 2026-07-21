# Module 8 · Теория: retries

Этот материал закрывает седьмой теоретический пункт `Module 8`: **retry в TanStack Query** — defaults, `retry` / `retryDelay`, query vs mutation, связь с [Module 7 · retries](../module-7/08-retries.md) и UI.

Связанные материалы:

- [Module 8 · queries](./03-queries.md)
- [Module 8 · mutations](./04-mutations.md)
- [Module 7 · повторные запросы](../module-7/08-retries.md)

---

## 1. Module 7 → Module 8

| | Module 7 | Module 8 (Vue Query) |
|---|----------|----------------------|
| Retry logic | `fetchWithRetry`, кнопка Retry | `retry`, `retryDelay` на query/mutation |
| Policy | `isRetryable()` вручную | функция `(failureCount, error) => boolean` |
| Backoff | `sleep(base * 2 ** attempt)` | `retryDelay(attemptIndex, error)` |
| User Retry | `refetch()` / `load()` | `refetch()` из `useQuery` |

```text
Module 7: ты пишешь loop + policy
Module 8: QueryClient применяет policy к queryFn автоматически
```

Официально:

- [Query Retries](https://tanstack.com/query/latest/docs/framework/vue/guides/query-retries)

---

## 2. Defaults для queries

TanStack Query v5 *(типичные defaults)*:

| Option | Default | Смысл |
|--------|---------|--------|
| `retry` | `3` | до 3 **повторов** после первой неудачи |
| `retryDelay` | exponential cap ~30s | пауза между попытками |

```text
attempt 1 fail → wait → attempt 2 fail → wait → … → final error
```

**Итого:** 1 initial + до 3 retry = до 4 вызовов `queryFn`.

На pet-project часто сужают:

```ts
// main.ts — QueryClient defaults
new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8_000),
    },
  },
})
```

Согласовано с [Module 8 · vue-query setup](./02-vue-query.md).

---

## 3. `retry` — number или function

### Число

```ts
useQuery({
  queryKey: productKeys.list(filters.value),
  queryFn: () => fetchProductsPage(filters.value),
  retry: 2,
})
```

### Функция — policy как в Module 7

```ts
retry: (failureCount, error) => {
  // axios error shape — адаптируй под свой api layer
  const status = (error as { response?: { status?: number } }).response?.status

  if (status === 404 || status === 401 || status === 403) return false
  if (status && status >= 400 && status < 500) return false
  if (status === 429) return failureCount < 2

  return failureCount < 3
},
```

| HTTP / error | Retry? |
|--------------|--------|
| network / timeout | да |
| 5xx | да |
| 429 | да, с backoff |
| 400, 404, 401, 403 | нет |
| parse / validation в queryFn | нет *(throw до retry policy — см. queryFn)* |

`failureCount` — сколько **уже было** неудачных попыток *(0 после первого fail)*.

### `retry: false` / `retry: 0`

Отключить auto-retry для конкретного query.

---

## 4. `retryDelay`

```ts
retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
```

`attemptIndex` начинается с **0** после первой ошибки.

```text
attemptIndex 0 → 1000ms
attemptIndex 1 → 2000ms
attemptIndex 2 → 4000ms
… cap 30s
```

Кастом для 429:

```ts
retryDelay: (attemptIndex, error) => {
  const retryAfter = (error as { response?: { headers?: Record<string, string> } })
    .response?.headers?.['retry-after']
  if (retryAfter) return Number(retryAfter) * 1000
  return Math.min(1000 * 2 ** attemptIndex, 10_000)
},
```

---

## 5. Mutations — другие defaults

```ts
useMutation({
  mutationFn: createProduct,
  retry: 0, // default для mutations — 0
})
```

| | Query (GET) | Mutation (POST) |
|---|-------------|-----------------|
| Idempotent | обычно да | часто **нет** |
| Default retry | 3 | **0** |
| Duplicate risk | низкий | POST order ×2 |

Из [Module 8 · mutations](./04-mutations.md): POST duplicate — не retry без idempotency key.

Исключение: **идempotent PUT/PATCH** — можно `retry: 1` осознанно, если server safe.

---

## 6. UI: loading vs retrying

При retry query остаётся **active fetch**:

```ts
const { isPending, isFetching, isError, error, refetch, failureCount } = useQuery({ ... })
```

| v5 field | Во время первого fetch | Во время retry после error |
|----------|------------------------|----------------------------|
| `isPending` | true | false *(есть stale/error data)* |
| `isFetching` | true | true |
| `isError` | false → true после всех retry | true до успешного retry |

**Практика для catalog:**

```vue
<div v-if="isPending">Loading catalog…</div>

<div v-else-if="isError" role="alert">
  <p>{{ error?.message }}</p>
  <button type="button" :disabled="isFetching" @click="() => refetch()">
    {{ isFetching ? 'Retrying…' : 'Try again' }}
  </button>
</div>

<div v-else-if="isFetching && failureCount > 0">
  <p class="text-muted">Connection issue, retrying…</p>
</div>
```

`failureCount` — из `useQuery` result *(сколько failed attempts в текущем цикле)*.

Компромисс Module 7: 1–2 auto-retry тихо, потом error + **User Retry** через `refetch()`.

---

## 7. User Retry = `refetch()`

```ts
const { refetch, isFetching } = useQuery({ ... })
```

```vue
<button :disabled="isFetching" @click="() => refetch()">
  Retry
</button>
```

`refetch()`:

- новый fetch **вне** stale policy
- **сбрасывает** retry counter для этого query
- не требует manual `error = null` — Query управляет state

Тот же intent, те же params — key не меняется.

---

## 8. Retry vs refetch vs invalidate

| Действие | Когда |
|----------|--------|
| **auto retry** | transient error на fetch |
| **refetch()** | user нажал Retry; или `refetchOnWindowFocus` |
| **invalidateQueries** | data изменилась на server (mutation) |

Retry не заменяет invalidation после create/update.

---

## 9. Retry vs abort (Module 7)

Query **отменяет** in-flight fetch при:

- смене `queryKey` (page 2 вместо page 1)
- unmount observer
- `cancelQueries`

```text
page 1 fail mid-retry → user page 2 → key change → abort page 1 retries
```

Не нужен ручной `AbortController` в queryFn для типичного catalog — Query передаёт `signal` в `queryFn` context:

```ts
queryFn: ({ signal }) => fetchProductsPage(params, { signal }),
```

Retry loop **прерывается** при abort — как в Module 7.

---

## 10. Global vs per-query

```ts
// global — все queries
new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      retryDelay: (i) => 500 * (i + 1),
    },
    mutations: {
      retry: 0,
    },
  },
})

// override — один query
useQuery({
  queryKey: productKeys.detail(id),
  queryFn: () => fetchProductById(id),
  retry: false, // detail 404 — не долбить
})
```

Detail 404: `retry: false` — сразу error state.

Search debounced: retry ok на list, не на каждый keystroke *(key меняется — старый abort)*.

---

## 11. Убрать `fetchWithRetry` из api?

После перехода на vue-query для **reads**:

```ts
// было Module 7
return fetchWithRetry(() => fetchProductsPage(params, { signal }))

// стало Module 8 — retry на уровне useQuery
queryFn: ({ signal }) => fetchProductsPage(params, { signal })
```

`fetchWithRetry` **внутри** queryFn + Query `retry` = **double retry** — избегай.

Оставь `fetchWithRetry` только если:

- endpoint вне vue-query
- особая policy, не покрытая Query options

---

## 12. Devtools

Vue Query Devtools при retry:

- query status **fetching**
- несколько быстрых failure → success или error

Симуляция: mock api random 503 на первые 2 calls.

---

## 13. Частые ошибки

### `retry: 3` на detail + 404

Три лишних запроса. `retry: false` или policy без 404.

### Double retry (fetchWithRetry + Query)

6+ attempts, долгий spinner.

### Mutation retry на POST

Дубликаты. Default `0`.

### `isPending` для «Retrying…»

После первого fail `isPending` false — используй `isFetching` + `failureCount`.

### Retry на validation error в queryFn

```ts
queryFn: async () => {
  const data = await fetch(...)
  const parsed = parseProduct(data) // throw ValidationError
  return parsed
}
```

Policy должна вернуть `false` для non-retryable — или не throw retryable type.

### Бесконечный retry

`retry: true` *(always)* без cap — опасно. Используй number или function с limit.

---

## 14. Что важно понять после этого блока

Проверь себя:

1. Default retry для query vs mutation?
2. Чем `refetch()` отличается от auto-retry?
3. Когда `retry: false` на detail?
4. Почему не `fetchWithRetry` + Query retry?
5. Какой flag UI для «Retrying…» после error?
6. POST и retry — риск?

---

## 15. Что почитать

### Официальное

- [Query Retries](https://tanstack.com/query/latest/docs/framework/vue/guides/query-retries)
- [useQuery · retry](https://tanstack.com/query/latest/docs/framework/vue/reference/useQuery)
- [QueryClient · defaultOptions](https://tanstack.com/query/latest/docs/reference/QueryClient)

### Связанные материалы этого плана

- [Module 7 · retries](../module-7/08-retries.md)
- [Module 8 · queries · options](./03-queries.md)

---

## 16. Практическое мини-задание

1. Global `retry: 1` в QueryClient
2. Detail query: `retry: false`
3. Policy function: no retry on 404/401
4. Error UI: `refetch()` + `isFetching`
5. Mock: 2× 503 then 200 — проверь Devtools

---

## 17. Мини-конспект

- Query retry из коробки; mutations default `retry: 0`
- policy через `retry(failureCount, error)`; backoff через `retryDelay`
- User Retry = `refetch()`; auto retry UI = `isFetching` + `failureCount`
- не дублируй Module 7 `fetchWithRetry` внутри queryFn
- дальше — **cache lifecycle** (`staleTime`, `gcTime`, garbage collection)

---

## 18. Что делать дальше

Следующий теоретический блок Module 8:

- [cache lifecycle](./08-cache-lifecycle.md)
