# Module 8 · Теория: invalidation

Этот материал закрывает пятый теоретический пункт `Module 8`: **синхронизация cache после mutations** — `invalidateQueries`, `setQueryData`, `removeQueries`, partial match по query keys.

Связанные материалы:

- [Module 8 · mutations](./04-mutations.md)
- [Module 8 · queries](./03-queries.md)
- [Module 8 · server state vs client state](./01-server-state-vs-client-state.md)

---

## 1. Зачем invalidation

После mutation server data изменился, но **cache queries ещё старый**.

```text
User: Create product → POST ok
Cache: ['products', 'list', { page: 1 }] → старый массив без нового item
UI:    list показывает устаревшие данные
```

**Invalidation** помечает queries **stale** и (обычно) **refetch** активных подписчиков.

```text
mutation success → invalidateQueries → stale → refetch active → fresh UI
```

Официально:

- [Invalidations from Mutations](https://tanstack.com/query/latest/docs/framework/vue/guides/invalidations-from-mutations)
- [Query Invalidation](https://tanstack.com/query/latest/docs/framework/vue/guides/query-invalidation)

---

## 2. `useQueryClient`

```ts
import { useQueryClient } from '@tanstack/vue-query'

const queryClient = useQueryClient()
```

`QueryClient` — единая точка доступа к cache: invalidate, set, remove, prefetch.

В `onSuccess` mutation или в composable:

```ts
useMutation({
  mutationFn: createProduct,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: productKeys.lists() })
  },
})
```

---

## 3. `invalidateQueries` — partial match

По умолчанию **prefix match**: все entries, чей key **начинается** с переданного.

```ts
// factory из 03-queries
productKeys.lists()           // ['products', 'list']
productKeys.list({ page: 1 }) // ['products', 'list', { page: 1 }]
productKeys.detail('42')      // ['products', 'detail', '42']
```

```ts
// все lists (любые filters/page)
queryClient.invalidateQueries({ queryKey: productKeys.lists() })

// ВСЕ product queries — list + detail + search
queryClient.invalidateQueries({ queryKey: productKeys.all })
```

| Вызов | Что затронет |
|-------|----------------|
| `productKeys.all` | всё под `['products', …]` |
| `productKeys.lists()` | все list-варианты |
| `productKeys.list(filters)` | один конкретный list |
| `productKeys.detail(id)` | одна деталка |

**Правило:** чем шире prefix — тем больше refetch. Для create/delete часто достаточно `lists()`. Для update одного product — `detail(id)` + иногда `lists()`.

---

## 4. `exact: true`

Только **точное** совпадение key, без дочерних:

```ts
queryClient.invalidateQueries({
  queryKey: productKeys.lists(),
  exact: true,
})
// ['products', 'list'] — да
// ['products', 'list', { page: 1 }] — нет
```

На практике редко нужен; factory обычно даёт нужный prefix.

---

## 5. Что происходит после invalidate

1. Matching queries → **stale**
2. **Active** queries (компонент mounted с `useQuery`) → **refetch**
3. **Inactive** — stale, refetch при следующем mount/focus *(зависит от options)*

```ts
queryClient.invalidateQueries({
  queryKey: productKeys.lists(),
  refetchType: 'active', // default — только активные
})
```

| `refetchType` | Поведение |
|---------------|-----------|
| `'active'` | refetch только mounted queries *(default)* |
| `'inactive'` | только неактивные |
| `'all'` | все matching |
| `'none'` | только mark stale, без refetch |

После delete на list page — `'active'` достаточно: catalog на экране обновится.

---

## 6. Паттерны после mutation

### Create product

```ts
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: productKeys.lists() })
}
```

Новый item появится после refetch list.

### Update product (detail form)

```ts
onSuccess: (updated, { id }) => {
  queryClient.invalidateQueries({ queryKey: productKeys.detail(id) })
  queryClient.invalidateQueries({ queryKey: productKeys.lists() })
}
```

List может показывать title/price в карточке — обнови и lists.

### Delete product

```ts
onSuccess: (_data, id) => {
  queryClient.removeQueries({ queryKey: productKeys.detail(id) })
  queryClient.invalidateQueries({ queryKey: productKeys.lists() })
}
```

`removeQueries` — убрать мёртвую detail entry из cache *(опционально, но чисто)*.

### Redirect после create

```ts
onSuccess: async (product) => {
  await queryClient.invalidateQueries({ queryKey: productKeys.lists() })
  await router.push({ name: 'product-details', params: { id: product.id } })
}
```

Detail query с `enabled: !!id` подтянет fresh data; list уже invalid.

---

## 7. `setQueryData` — patch cache без refetch

Когда **знаешь новые данные** из ответа mutation:

```ts
onSuccess: (updatedProduct) => {
  queryClient.setQueryData(
    productKeys.detail(updatedProduct.id),
    updatedProduct,
  )

  queryClient.setQueryData(
    productKeys.lists(),
    (old: Product[] | undefined) => {
      if (!old) return old
      return old.map((p) =>
        p.id === updatedProduct.id ? updatedProduct : p,
      )
    },
  )
}
```

| | `invalidateQueries` | `setQueryData` |
|---|---------------------|----------------|
| Сеть | refetch *(обычно)* | без запроса |
| Сложность | низкая | выше — merge logic |
| Риск | лишний GET | рассинхрон, если patch неверный |

**Старт:** invalidate. **Оптимизация:** setQueryData для detail + invalidate lists. **Optimistic** — следующий урок.

Updater function `(old) => new` безопаснее, чем перезапись всего list с угадыванием структуры paginated response:

```ts
// paginated list — лучше invalidate, не ручной patch всей страницы
queryClient.invalidateQueries({ queryKey: productKeys.lists() })
```

---

## 8. Paginated list после create

Структура cache:

```ts
// queryFn возвращает { items, total, page }
productKeys.list({ page: 1, category: 'phones' })
```

После create **invalidate `lists()`** проще, чем вставлять item на «правильную» страницу.

```ts
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: productKeys.lists() })
}
```

Если UX критичен — prefetch page 1 или redirect на detail нового product.

---

## 9. `removeQueries` и `resetQueries`

```ts
// logout / смена tenant — вычистить продукты
queryClient.removeQueries({ queryKey: productKeys.all })

// сброс error state + refetch
queryClient.resetQueries({ queryKey: productKeys.lists() })
```

| API | Эффект |
|-----|--------|
| `invalidateQueries` | stale + refetch |
| `removeQueries` | удалить из cache |
| `resetQueries` | как remount query *(state + refetch)* |

---

## 10. `prefetchQuery`

Подгрузить данные **до** navigation:

```ts
await queryClient.prefetchQuery({
  queryKey: productKeys.detail(id),
  queryFn: () => fetchProductById(id),
})
await router.push({ name: 'product-details', params: { id } })
```

Detail mount — cache уже warm или fetch in flight.

Связь с invalidation: после update можно prefetch detail перед redirect.

---

## 11. Invalidate в `onSettled` vs `onSuccess`

```ts
useMutation({
  mutationFn: updateProduct,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: productKeys.lists() })
  },
})
```

Invalidate только при **success** — иначе refetch после failed POST даст лишнюю нагрузку и путаницу.

`onSettled` + проверка `mutation.state.status === 'success'` — если нужен один exit path.

---

## 12. Связка с Devtools

Vue Query Devtools показывает:

- query keys и stale/fresh
- после invalidate — fetching → fresh

Проверь: create product → list key stale → refetch → новый item в UI.

---

## 13. Частые ошибки

### Invalidate слишком узко

```ts
// update title на card — invalidate только detail
queryClient.invalidateQueries({ queryKey: productKeys.detail(id) })
// list card всё ещё старый title → добавь lists()
```

### Invalidate `['products']` без factory discipline

Работает, но лишние refetch search/detail. Factory держит intent явным.

### `setQueryData` на paginated list как на flat array

TypeError или silent bug. Invalidate lists.

### Invalidate в `onError`

Refetch без изменений на server — шум.

### Забыть remove detail после delete

User может вернуться назад — stale detail в cache. `removeQueries(detail(id))`.

### Duplicate invalidate в component и global mutation

Один источник truth — mutation callbacks или wrapper composable `useCreateProductMutation()`.

---

## 14. Composable wrapper (рекомендуется)

```ts
// composables/useProductMutations.ts
export function useCreateProductMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
    },
  })
}
```

Catalog и admin form используют один composable — invalidate не дублируется.

---

## 15. Что важно понять после этого блока

Проверь себя:

1. Что делает `invalidateQueries`?
2. Почему `productKeys.lists()` invalidates все страницы/filters?
3. Когда `setQueryData`, когда invalidate?
4. Зачем `removeQueries` после delete?
5. Почему paginated list после create — invalidate, не ручной splice?
6. `refetchType: 'active'` — что refetch?

---

## 16. Что почитать

### Официальное

- [Query Invalidation](https://tanstack.com/query/latest/docs/framework/vue/guides/query-invalidation)
- [Invalidations from Mutations](https://tanstack.com/query/latest/docs/framework/vue/guides/invalidations-from-mutations)
- [QueryClient · invalidateQueries](https://tanstack.com/query/latest/docs/reference/QueryClient#queryclientinvalidatequeries)

### Связанные материалы этого плана

- [Module 8 · mutations](./04-mutations.md)
- [Module 8 · queries · factory keys](./03-queries.md)

---

## 17. Практическое мини-задание

1. После `createProduct` — `invalidateQueries(productKeys.lists())`
2. После `updateProduct` — detail + lists
3. После `deleteProduct` — `removeQueries(detail)` + invalidate lists
4. Открой Devtools: stale → fetching → fresh
5. Попробуй `setQueryData` только для detail после PATCH

---

## 18. Мини-конспект

- mutation меняет server; cache — invalidate / set / remove
- partial key match через factory prefixes
- default: invalidate lists после create/delete; detail + lists после update
- paginated lists — invalidate, не ручной patch
- дальше — **optimistic updates** (UX до ответа server)

---

## 19. Что делать дальше

Следующий теоретический блок Module 8:

- [optimistic updates](./06-optimistic-updates.md)
