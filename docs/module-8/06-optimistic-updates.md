# Module 8 · Теория: optimistic updates

Этот материал закрывает шестой теоретический пункт `Module 8`: **optimistic updates** — мгновенный UI до ответа API, **`onMutate`**, rollback в **`onError`**, **`cancelQueries`**.

Связанные материалы:

- [Module 8 · invalidation](./05-invalidation.md)
- [Module 8 · mutations](./04-mutations.md)
- [Module 8 · queries](./03-queries.md)

---

## 1. Проблема UX без optimistic UI

```text
User: нажал «Delete» / «Save title»
UI:   isPending… 300–800 ms
      потом invalidate → refetch → обновление
```

Для частых действий (toggle, rename, remove row) задержка заметна.

**Optimistic update:** сразу обновить cache/UI, **как будто** server уже ok; при ошибке — **откат**.

```text
click → onMutate (patch cache) → UI instant
     → mutationFn (network)
     → success: onSettled + invalidate (reconcile)
     → error:   rollback snapshot
```

Официально:

- [Optimistic Updates](https://tanstack.com/query/latest/docs/framework/vue/guides/optimistic-updates)

---

## 2. Когда уместно / когда нет

| Уместно | Осторожно / не надо |
|---------|---------------------|
| Toggle favorite | Create order / payment |
| Rename title в admin | POST с side effects (email, invoice) |
| Remove row из list (mock) | Сложный merge paginated list |
| Inline edit одного поля | Optimistic без rollback plan |

**Правило:** optimistic только если rollback понятен и ошибка редка/обрабатываема.

Module 8 practice: один optimistic сценарий *(например toggle или delete row)* — достаточно.

---

## 3. Каркас mutation с optimistic flow

```ts
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { productKeys } from '@/queries/productKeys'
import type { Product } from '@/types/product'

type UpdateTitleVars = { id: string; title: string }

export function useUpdateProductTitleMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, title }: UpdateTitleVars) =>
      updateProduct(id, { title }),

    onMutate: async (variables) => {
      const detailKey = productKeys.detail(variables.id)

      // 1. отменить in-flight refetch — не перезаписать optimistic patch
      await queryClient.cancelQueries({ queryKey: detailKey })

      // 2. snapshot для rollback
      const previousDetail = queryClient.getQueryData<Product>(detailKey)

      // 3. optimistic patch
      if (previousDetail) {
        queryClient.setQueryData<Product>(detailKey, {
          ...previousDetail,
          title: variables.title,
        })
      }

      // 4. context → onError / onSettled
      return { previousDetail, detailKey }
    },

    onError: (_err, _variables, context) => {
      if (context?.previousDetail !== undefined) {
        queryClient.setQueryData(context.detailKey, context.previousDetail)
      }
    },

    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(variables.id),
      })
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
    },
  })
}
```

Порядок callbacks: **`onMutate` → mutationFn → `onSuccess`/`onError` → `onSettled`**.

---

## 4. Зачем `cancelQueries`

Параллельный refetch list/detail может **перезаписать** optimistic data старым ответом.

```ts
await queryClient.cancelQueries({ queryKey: productKeys.detail(id) })
await queryClient.cancelQueries({ queryKey: productKeys.lists() })
```

Cancel — «заморозить» outgoing queries для этих keys на время mutation.

---

## 5. Snapshot и rollback

```ts
const previousDetail = queryClient.getQueryData<Product>(detailKey)

return { previousDetail, detailKey }
```

```ts
onError: (_err, _vars, context) => {
  if (context?.previousDetail !== undefined) {
    queryClient.setQueryData(context.detailKey, context.previousDetail)
  }
}
```

- `undefined` в cache до первого fetch — snapshot `undefined`, rollback skip ok
- Храни **минимум** в context: keys + previous values

Toast в `onError`: «Не удалось сохранить, откатили изменения».

---

## 6. `onSettled` + invalidate — reconcile с server

Даже при success optimistic data может **не совпадать** с server (server добавил `updatedAt`, normalized title).

```ts
onSettled: (_data, _error, variables) => {
  queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.id) })
}
```

**Паттерн:** optimistic для UX → **invalidate/settled** для truth.

Можно `onSuccess` + `setQueryData` ответом API вместо invalidate detail — меньше GET.

---

## 7. Optimistic delete row

```ts
onMutate: async (id: string) => {
  await queryClient.cancelQueries({ queryKey: productKeys.lists() })

  const listKey = productKeys.list(currentFilters.value)
  const previousList = queryClient.getQueryData<PaginatedProducts>(listKey)

  queryClient.setQueryData<PaginatedProducts>(listKey, (old) => {
    if (!old) return old
    return {
      ...old,
      items: old.items.filter((p) => p.id !== id),
      total: old.total - 1,
    }
  })

  return { previousList, listKey }
},
```

Rollback в `onError`; `onSettled` → invalidate `lists()` на всякий случай.

**Paginated list:** optimistic delete **одной** страницы ok, если знаешь shape `{ items, total }`. Иначе — только invalidate без optimistic.

---

## 8. Optimistic toggle (favorite)

```ts
onMutate: async ({ id, isFavorite }: { id: string; isFavorite: boolean }) => {
  const detailKey = productKeys.detail(id)
  await queryClient.cancelQueries({ queryKey: detailKey })

  const previous = queryClient.getQueryData<Product>(detailKey)

  queryClient.setQueryData<Product>(detailKey, (old) =>
    old ? { ...old, isFavorite } : old,
  )

  return { previous, detailKey }
},
```

UI: heart icon меняется сразу; error → revert + message.

Cart **не** optimistic server mutation в demo — cart local в Pinia.

---

## 9. UI во время optimistic + pending

```vue
<button
  type="button"
  :disabled="isPending"
  @click="mutate({ id, title: draftTitle })"
>
  Save
</button>
```

Optimistic UI уже показывает новый title; `isPending` — subtle indicator *(opacity, spinner)*, не блокировка всего экрана.

Double-click: `isPending` или debounce на mutate.

---

## 10. Optimistic vs только `setQueryData` в onSuccess

| Подход | Когда |
|--------|--------|
| **onSuccess + setQueryData** | форма submit, redirect ok ждать |
| **invalidate only** | простой CRUD, задержка терпима |
| **optimistic onMutate** | inline edit, toggle, delete row |

Optimistic сложнее — не default для всего проекта.

---

## 11. Race: быстрые последовательные edits

User меняет title дважды подряд:

1. Mutation A optimistic «Foo»
2. Mutation B optimistic «Bar»
3. A fails, B succeeds — rollback A не должен затереть B

**Mitigation:**

- disable save while `isPending`
- или versioning в context *(advanced)*
- для учебного проекта — disable достаточно

---

## 12. `mutate` vs variables в updater

```ts
queryClient.setQueryData(key, (old) => {
  if (!old) return old
  return { ...old, title: variables.title }
})
```

Updater получает **текущий** cache; variables — из closure `onMutate`.

---

## 13. Частые ошибки

### Optimistic без rollback

Failed request — UI врёт до hard refresh.

### Забыть `cancelQueries`

Flicker: optimistic → stale refetch → снова optimistic.

### Optimistic create с fake id

Server генерирует id — temp id усложняет list merge. Create → **invalidate**, не optimistic.

### Patch list без знания pagination shape

Runtime error. Invalidate lists.

### Только onSuccess invalidate, без onSettled после error

После error rollback ok, но иногда нужен refetch для sync — `onSettled` invalidate optional.

### Optimistic для POST checkout

Деньги/заказы — дождись server.

---

## 14. Что важно понять после этого блока

Проверь себя:

1. В каком callback patch cache до network?
2. Зачем snapshot в `onMutate`?
3. Зачем `cancelQueries`?
4. Почему после success всё равно invalidate?
5. Почему create product редко делают optimistic?
6. Что показать user в `onError`?

---

## 15. Что почитать

### Официальное

- [Optimistic Updates](https://tanstack.com/query/latest/docs/framework/vue/guides/optimistic-updates)
- [useMutation · lifecycle](https://tanstack.com/query/latest/docs/framework/vue/reference/useMutation)

### Связанные материалы этого плана

- [Module 8 · invalidation](./05-invalidation.md)
- [Module 8 · mutations](./04-mutations.md)

---

## 16. Практическое мини-задание

1. Выбери одно действие: toggle favorite **или** optimistic delete row
2. Реализуй `onMutate` + snapshot + `cancelQueries`
3. `onError` — rollback + alert/toast
4. `onSettled` — invalidate reconcile
5. В Devtools: cache меняется до network; симулируй 500 → rollback

---

## 17. Мини-конспект

- optimistic = patch cache в `onMutate` до ответа API
- snapshot + rollback в `onError`; `cancelQueries` против race
- `onSettled` / invalidate — сверка с server truth
- create/checkout — не optimistic; toggle/delete/update field — ok
- дальше — **retries** (query vs mutation)

---

## 18. Что делать дальше

Следующий теоретический блок Module 8:

- [retries](./07-retries.md)

Разберём `retry`, `retryDelay`, отличие query retries от mutation, связь с Module 7.
