# Module 8 · Теория: cache lifecycle

Этот материал закрывает последний теоретический пункт `Module 8`: **жизненный цикл cache** — stale/fresh, `staleTime`, `gcTime`, observers, refetch triggers, garbage collection и связь с invalidation.

Связанные материалы:

- [Module 8 · queries](./03-queries.md)
- [Module 8 · invalidation](./05-invalidation.md)
- [Module 8 · vue-query setup](./02-vue-query.md)

---

## 1. Cache entry — что хранится

Каждый **queryKey** → одна **cache entry**:

```text
queryKey: ['products', 'list', { page: 1 }]
  ├── data          ← последний успешный результат queryFn
  ├── status        ← pending / error / success
  ├── dataUpdatedAt ← timestamp успешного fetch
  ├── isStale       ← fresh или stale
  └── observers     ← сколько useQuery подписано сейчас
```

```text
useQuery  →  подписка (observer)
unmount   →  observer −1
observers = 0  →  entry inactive, но ещё в памяти (gcTime)
```

Официально:

- [Important Defaults](https://tanstack.com/query/latest/docs/framework/vue/guides/important-defaults)
- [Caching Examples](https://tanstack.com/query/latest/docs/framework/vue/guides/caching)

---

## 2. Fresh vs stale

| | **Fresh** | **Stale** |
|---|-----------|-----------|
| Данные | считаются актуальными | «устарели», но **ещё показываются** |
| Refetch на mount | **нет** *(пока fresh)* | **да** *(default behavior)* |
| UI | cached data сразу | cached data + optional background refetch |

```text
fetch success → fresh (staleTime window)
              → потом автоматически stale
invalidate    → сразу stale
mutation      → через invalidateQueries
```

**Stale ≠ empty.** User видит старые данные, пока идёт refetch — это feature, не bug.

---

## 3. `staleTime`

Сколько ms после успешного fetch data остаётся **fresh**.

```ts
useQuery({
  queryKey: productKeys.list(filters.value),
  queryFn: () => fetchProductsPage(filters.value),
  staleTime: 60_000, // 1 min
})
```

| `staleTime` | Поведение |
|-------------|-----------|
| `0` *(default)* | сразу stale после fetch |
| `60_000` | 1 min fresh — remount без refetch |
| `Infinity` | never stale автоматически *(invalidate вручную)* |

### Global default

```ts
new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
    },
  },
})
```

### Когда что ставить (catalog)

| Query | Рекомендация |
|-------|--------------|
| Product list | 30–60s — pagination/filter cache |
| Product detail | 60s или больше |
| Search | 0 или короткий — актуальность важнее |
| Static reference data | `Infinity` + редкий invalidate |

**Кеш решает реальную проблему:** user catalog → detail → back **без** лишнего GET list — это и есть ценность `staleTime`.

---

## 4. `gcTime` *(ранее `cacheTime`)*

Сколько ms **inactive** entry *(observers = 0)* держится в памяти **до удаления**.

```ts
gcTime: 5 * 60_000, // default ~5 min
```

```text
Catalog mount  → observer +1, fetch
Navigate away  → observer −1, inactive
5 min later    → garbage collected (default gcTime)
Return         → cold start, isPending true, новый fetch
```

| | `staleTime` | `gcTime` |
|---|-------------|----------|
| Вопрос | «Когда refetch?» | «Когда забыть data?» |
| Active query | влияет | не удаляет пока mounted |
| Inactive | — | timer → remove from cache |

```ts
gcTime: 0 // unmount → сразу удалить *(редко)*
gcTime: Infinity // держать в памяти всегда *(осторожно)*
```

На старте **не трогай** `gcTime` — default ok. Настраивай, когда понимаешь UX *(back navigation)*.

---

## 5. Lifecycle timeline (пример)

```text
t=0    mount list page → fetch → success → fresh (staleTime 60s)
t=10s  navigate to detail → list inactive, data в cache
t=20s  back to list → remount → fresh cache → UI instant, NO refetch
t=70s  back again → stale → show cache + background refetch
t=80s  unmount → inactive
t=5m   gcTime elapsed → entry removed
t=6m   mount → isPending, full loading
```

Проверь в Devtools: fresh → stale → inactive → removed.

---

## 6. Refetch triggers (default)

Query refetch когда **stale** + trigger:

| Trigger | Default | Описание |
|---------|---------|----------|
| **Mount** | on | remount stale query |
| **Window focus** | on | вернулся на вкладку |
| **Reconnect** | on | сеть восстановилась |
| **Interval** | off | `refetchInterval` |
| **invalidateQueries** | on | после mutation |
| **refetch()** | manual | user Retry |

```ts
useQuery({
  queryKey: productKeys.list(filters.value),
  queryFn: fetchProductsPage,
  refetchOnWindowFocus: false, // demo / admin panels
  refetchOnReconnect: true,
  refetchOnMount: true, // or 'always'
})
```

### `refetchOnMount`

| Value | Поведение |
|-------|-----------|
| `true` *(default)* | refetch если stale |
| `false` | не refetch на mount |
| `'always'` | refetch даже fresh |

Detail после edit: invalidate → mount → refetch — ok.

---

## 7. Active vs inactive queries

```text
Active:   ≥1 component с useQuery(key)
Inactive: 0 observers, data может оставаться в cache
```

- **Active + stale + trigger** → refetch
- **Inactive** → не refetch *(кроме prefetch / invalidate пометил stale — refetch при следующем mount)*

Prefetch warming:

```ts
queryClient.prefetchQuery({
  queryKey: productKeys.detail(id),
  queryFn: () => fetchProductById(id),
})
```

Entry inactive, но data в cache — detail mount быстрее.

---

## 8. Invalidation и lifecycle

```ts
queryClient.invalidateQueries({ queryKey: productKeys.lists() })
```

1. Matching entries → **isStale = true**
2. Active → refetch now
3. Inactive → stale until next mount

Не удаляет data сразу — только помечает stale. UI не мигает в empty.

`removeQueries` — **удалить** entry *(после delete product)*.

См. [invalidation](./05-invalidation.md).

---

## 9. `initialData` vs `placeholderData`

### `placeholderData`

Показать **временные** data, пока первый fetch:

```ts
placeholderData: (previousData) => previousData,
```

При смене page pagination — **старый list** как placeholder → меньше flicker.

Не считается «настоящим» server truth; после fetch заменяется.

### `initialData`

Seed cache **как будто** уже fetch'или:

```ts
initialData: () => [],
initialDataUpdatedAt: () => Date.now() - 60_000, // уже stale
```

Редко на старте; полезно при SSR/hydration *(позже)*.

---

## 10. Dedupe in-flight

Два компонента с **одним queryKey** → **один** network request.

```text
HeaderSearch useQuery(['products', 'search', { q: 'phone' }])
Catalog      useQuery(['products', 'search', { q: 'phone' }])
             → shared cache + single fetch
```

Lifecycle: первый observer запускает fetch; второй подписывается на тот же promise.

---

## 11. Structural sharing

TanStack Query сравнивает новый и старый result — если equal по reference-safe check, **не** триггерит лишний rerender.

Для тебя: не мутируй `data` in-place из компонента. Patch через `setQueryData` с **новым** объектом.

---

## 12. Pinia vs Query cache (граница)

| | Pinia | Query cache |
|---|-------|-------------|
| Данные | client state | server state copy |
| TTL | нет | staleTime / gcTime |
| Persist | localStorage ok | in-memory *(plugins позже)* |
| Products list | **не здесь** | **здесь** |

Cart survives navigation — Pinia.
Products list survives catalog ↔ detail — Query `staleTime` + `gcTime`.

---

## 13. Практические рецепты для Product Catalog

### Back navigation без spinner

```ts
// QueryClient defaults
staleTime: 60_000,
gcTime: 5 * 60_000,
```

List → detail → back: instant list из cache.

### Pagination UX

```ts
useQuery({
  queryKey: productKeys.list({ page, category }),
  queryFn: () => fetchProductsPage({ page, category }),
  placeholderData: (prev) => prev,
  staleTime: 30_000,
})
```

### Admin edit → fresh list

Mutation `onSuccess` → `invalidateQueries(lists())` — stale + refetch active catalog.

### Demo без лишних refetch

```ts
refetchOnWindowFocus: false,
```

Объясни на review: «в prod включил бы focus refetch для catalog».

---

## 14. Частые ошибки

### `staleTime: Infinity` везде «чтобы не refetch»

Data никогда не обновится без invalidate. Забыл invalidate после mutation — баг.

### Путать staleTime и gcTime

Короткий gcTime + длинный staleTime — back navigation cold load.

### Ждать empty UI при stale refetch

Показывай cached `data` + `isFetching` indicator.

### Products в Pinia «для cache»

Дублируешь server state без invalidation/retry/refetch tooling.

### `gcTime: 0` для «экономии памяти»

Каждый back navigation — full loading. Default 5 min разумен.

### Invalidate = удаление cache

Нет — только stale mark. Для удаления — `removeQueries`.

---

## 15. Что важно понять после этого блока

Проверь себя:

1. Fresh vs stale — в чём разница для UI?
2. `staleTime` vs `gcTime` — разные вопросы?
3. Почему list → detail → back может быть instant?
4. Когда entry удаляется из памяти?
5. Что делает invalidate со stale/active?
6. Зачем `placeholderData` на pagination?

---

## 16. Что почитать

### Официальное

- [Important Defaults](https://tanstack.com/query/latest/docs/framework/vue/guides/important-defaults)
- [Caching](https://tanstack.com/query/latest/docs/framework/vue/guides/caching)
- [Query Options · staleTime / gcTime](https://tanstack.com/query/latest/docs/framework/vue/guides/queries)

### Связанные материалы этого плана

- [Module 8 · invalidation](./05-invalidation.md)
- [Module 8 · server vs client state](./01-server-state-vs-client-state.md)

---

## 17. Практическое мини-задание

1. QueryClient: `staleTime: 60_000`
2. Catalog → detail → back: list без loading *(в пределах staleTime)*
3. Подожди > staleTime, вернись — background refetch
4. Devtools: observer count, stale badge
5. Pagination: `placeholderData: (prev) => prev`

---

## 18. Мини-конспект

- cache entry = data + stale flag + observers
- `staleTime` — fresh window; `gcTime` — сколько inactive держать в памяти
- stale data показывается; refetch — background
- invalidate → stale; removeQueries → delete
- catalog back-nav — главный UX-win Module 8
- дальше — **практический checklist**

---

## 19. Что делать дальше

Теория Module 8 завершена. Переходи к практике:

- [Module 8 · practice checklist](./09-practice-checklist.md) — list + detail + mutation + invalidation + cache с реальной пользой
