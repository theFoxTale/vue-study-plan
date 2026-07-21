# Module 8 · Теория: mutations

Этот материал закрывает четвёртый теоретический пункт `Module 8`: понять **`useMutation`** — изменение данных на сервере (POST/PATCH/DELETE), статусы, **`mutate` / `mutateAsync`**, callbacks **`onSuccess`**.

Связанные материалы:

- [Module 8 · queries](./03-queries.md)
- [Module 7 · axios](../module-7/02-axios.md)
- [Module 6 · actions](../module-6/07-actions.md)

---

## 1. Query vs Mutation

| | `useQuery` | `useMutation` |
|---|------------|---------------|
| Задача | **прочитать** server data | **изменить** server data |
| HTTP | GET *(обычно)* | POST / PUT / PATCH / DELETE |
| Когда | mount, key change, refetch | по действию пользователя |
| Cache | queryKey + cache entry | не key-based read; side effect |

```text
useQuery   → «что на сервере?»
useMutation → «сделай на сервере X, потом обнови UI/cache»
```

Официально:

- [Mutations · TanStack Query](https://tanstack.com/query/latest/docs/framework/vue/guides/mutations)

---

## 2. Базовый `useMutation`

```ts
import { useMutation } from '@tanstack/vue-query'
import { createProduct } from '@/api/products'

const {
  mutate,
  mutateAsync,
  isPending,
  isError,
  error,
  isSuccess,
  data,
  reset,
} = useMutation({
  mutationFn: createProduct,
  onSuccess: (newProduct) => {
    console.log('Created', newProduct.id)
  },
  onError: (err) => {
    console.error(err)
  },
})
```

```vue
<button
  type="button"
  :disabled="isPending"
  @click="mutate({ title: 'Phone', price: 99 })"
>
  {{ isPending ? 'Saving…' : 'Create product' }}
</button>
```

`mutationFn` — async `(variables) => result`, обычно вызов api.

---

## 3. api layer для mutations

```ts
// api/products.ts
export type CreateProductInput = {
  title: string
  price: number
}

export async function createProduct(input: CreateProductInput): Promise<Product> {
  const { data } = await api.post('/products', input)
  return parseProduct(data as unknown)
}

export async function updateProduct(
  id: string,
  input: Partial<CreateProductInput>,
): Promise<Product> {
  const { data } = await api.patch(`/products/${id}`, input)
  return parseProduct(data as unknown)
}

export async function deleteProduct(id: string): Promise<void> {
  await api.delete(`/products/${id}`)
}
```

Parse и errors — как в Module 7; mutation только orchestrates.

---

## 4. `mutate` vs `mutateAsync`

```ts
// fire-and-forget + callbacks
mutate({ title: 'Phone', price: 99 })

// await в async handler (forms)
async function onSubmit() {
  try {
    const product = await mutateAsync(form.value)
    router.push({ name: 'product-details', params: { id: product.id } })
  } catch {
    // isError также true; можно показать form error
  }
}
```

| | `mutate` | `mutateAsync` |
|---|----------|---------------|
| Return | void | Promise |
| Callbacks | onSuccess/onError | + try/catch |
| Формы с redirect | ok | **удобнее** |

---

## 5. Статусы mutation

| Поле | Смысл |
|------|--------|
| `isPending` | mutation in flight |
| `isError` | последняя failed |
| `isSuccess` | последняя succeeded |
| `error` | ошибка |
| `data` | результат последней успешной |
| `reset()` | сброс status *(новая форма)* |

Mutation state **локален** экземпляру `useMutation` — не глобальный cache key как у query.

Несколько кнопок «Delete» на списке — часто **один** mutation + передача `id` в `mutate(id)` или mutation per row *(редко)*.

---

## 6. Variables и типизация

```ts
useMutation({
  mutationFn: (input: CreateProductInput) => createProduct(input),
})

mutate({ title: 'X', price: 1 })
```

Для update/delete:

```ts
useMutation({
  mutationFn: ({ id, input }: { id: string; input: Partial<CreateProductInput> }) =>
    updateProduct(id, input),
})

mutate({ id: '42', input: { price: 79 } })
```

---

## 7. Связка с формами

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMutation } from '@tanstack/vue-query'

const form = ref({ title: '', price: 0 })
const router = useRouter()

const { mutateAsync, isPending, isError, error } = useMutation({
  mutationFn: createProduct,
})

async function submit() {
  const product = await mutateAsync(form.value)
  await router.push({ name: 'product-details', params: { id: product.id } })
}
</script>

<template>
  <form @submit.prevent="submit">
    <input v-model="form.title" />
    <input v-model.number="form.price" type="number" />
    <p v-if="isError" role="alert">{{ error?.message }}</p>
    <button type="submit" :disabled="isPending">Save</button>
  </form>
</template>
```

Form state — **local** `ref` (Module 6).
Server write — **mutation**.

---

## 8. После mutation: cache list/detail

После успешного create/update/delete **queries устарели**.

Варианты:

1. **`invalidateQueries`** — следующий урок *(recommended)*
2. **`setQueryData`** — вручную patch cache
3. **`refetch`** конкретного query

Preview в `onSuccess`:

```ts
import { useQueryClient } from '@tanstack/vue-query'
import { productKeys } from '@/queries/productKeys'

const queryClient = useQueryClient()

useMutation({
  mutationFn: createProduct,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: productKeys.lists() })
  },
})
```

Полный разбор — [invalidation](./05-invalidation.md).

---

## 9. Mutation vs Pinia (cart)

| Действие | Инструмент |
|----------|------------|
| Add to cart (client-only demo) | Pinia `cart.add` |
| POST order checkout to API | `useMutation` |
| Toggle favorite **на сервере** | `useMutation` |
| Toggle favorite **только local** | Pinia |

Module 8 practice README: **list + detail + update data** — нужна хотя бы одна mutation (create/update/delete mock).

Cart без backend — остаётся Pinia.

---

## 10. `onSettled` и side effects

```ts
useMutation({
  mutationFn: deleteProduct,
  onSuccess: () => {
    toast.success('Deleted')
  },
  onError: (err) => {
    toast.error(err.message)
  },
  onSettled: () => {
    // always — убрать modal loading и т.д.
  },
})
```

Toast/modal — в callbacks или в component после `mutateAsync`.

---

## 11. Retry mutations

Default: mutations **не** retry как queries (опасно для POST).

```ts
retry: 0, // default / explicit
```

Idempotent PUT — retry осторожно, осознанно.
Module 7 rule: POST duplicate risk.

---

## 12. Пример: delete на catalog admin row

```ts
const { mutate: remove, isPending: isDeleting } = useMutation({
  mutationFn: deleteProduct,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: productKeys.lists() })
  },
})
```

```vue
<button
  type="button"
  :disabled="isDeleting"
  @click="remove(product.id)"
>
  Delete
</button>
```

---

## 13. Частые ошибки

### Mutation для GET

Используй `useQuery`.

### Create product через Pinia store action + fetch без invalidate

List не обновится.

### Забыть `isPending` на submit

Double submit.

### `mutate` + redirect в onSuccess без проверки

ok; с `mutateAsync` проще linear flow.

### Optimistic update до урока

Не усложняй раньше [optimistic updates](./06-optimistic-updates.md).

---

## 14. Что важно понять после этого блока

Проверь себя:

1. Чем mutation отличается от query?
2. Когда `mutateAsync` лучше `mutate`?
3. Где живёт `mutationFn`?
4. Почему после create нужен invalidate/refetch?
5. Почему cart.add не mutation?
6. Retry POST по умолчанию опасен?

---

## 15. Что почитать

### Официальное

- [Mutations](https://tanstack.com/query/latest/docs/framework/vue/guides/mutations)
- [useMutation](https://tanstack.com/query/latest/docs/framework/vue/reference/useMutation)

### Связанные материалы этого плана

- [Module 8 · queries](./03-queries.md)
- [Module 7 · api layer](../module-7/09-data-layer.md)

---

## 16. Практическое мини-задание

1. Добавь `createProduct` / `deleteProduct` в api *(mock ok)*
2. Форма или кнопка «Create» с `useMutation`
3. `isPending` + error message
4. `onSuccess` → `invalidateQueries` lists *(preview)*
5. Cart по-прежнему через Pinia

---

## 17. Мини-конспект

- `useMutation` = server writes по действию пользователя
- `mutationFn` в api; form state local
- `mutate` / `mutateAsync`; `isPending` блокирует double submit
- после success — invalidate/setQueryData queries
- дальше — **invalidation** (системно)

---

## 18. Что делать дальше

Следующий теоретический блок Module 8:

- [invalidation](./05-invalidation.md)
