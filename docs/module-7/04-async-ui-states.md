# Module 7 · Теория: состояния `loading / error / success / empty`

Этот материал закрывает четвёртый теоретический пункт `Module 7` и один из **критериев завершения** модуля: научиться стабильно моделировать UI вокруг асинхронной загрузки данных.

Связанные материалы:

- [Module 7 · обработка ошибок](./03-error-handling.md)
- [Module 7 · fetch](./01-fetch.md)
- [Module 2 · watch](../module-2/04-watch.md)

---

## 1. Зачем четыре состояния

Экран с серверными данными почти никогда не «просто показывает список».

```text
loading  — запрос в полёте, данных ещё нет (или обновляем)
error    — запрос провалился, показать сообщение + retry
empty    — запрос успешен, но данных нет ([] / null resource)
success  — запрос успешен, есть что показать
```

Без явной модели:

- мигает пустой список вместо spinner
- ошибка выглядит как «пусто»
- после retry старая ошибка остаётся на экране
- success перекрывает loading при refetch

Критерий Module 7: все четыре состояния **реализованы и различимы**.

---

## 2. Как отличить empty от error

| | Empty | Error |
|---|-------|-------|
| HTTP | обычно 200 | 4xx/5xx / network |
| Данные | `[]` или «нет сущности» осмысленно | нет валидного результата |
| UX | «Ничего не найдено» / CTA изменить фильтр | «Не удалось загрузить» + Retry |
| Виноват | часто пользовательский query / пустая БД | сеть, сервер, баг |

```ts
// success + empty
products.value = [] // ok response

// error
error.value = toAppError(e)
products.value = [] // очищать или нет — см. §7
```

Никогда не пиши:

```ts
if (!products.length) showError() // ❌ путает empty и error
```

---

## 3. Два способа моделировать status

### A) Несколько refs (просто и ясно)

```ts
const products = ref<Product[]>([])
const isLoading = ref(false)
const error = ref<AppError | null>(null)

const isEmpty = computed(
  () => !isLoading.value && !error.value && products.value.length === 0,
)
const isSuccess = computed(
  () => !isLoading.value && !error.value && products.value.length > 0,
)
```

### B) Единый `status` union (строже)

```ts
type AsyncStatus = 'idle' | 'loading' | 'success' | 'error'

const status = ref<AsyncStatus>('idle')
const products = ref<Product[]>([])
const error = ref<AppError | null>(null)

// empty — это success + нет данных
const isEmpty = computed(
  () => status.value === 'success' && products.value.length === 0,
)
```

`idle` полезен до первого запроса (экран ещё не грузил).

Оба подхода ок. Важно: **ветки UI взаимоисключающие**.

---

## 4. State machine экрана списка

```text
idle
  → loading
      → success (+ empty | with data)
      → error
error → loading (retry)
success → loading (refetch / смена query)
```

```ts
async function load() {
  isLoading.value = true
  error.value = null
  try {
    products.value = await fetchProducts()
  } catch (e) {
    const appError = toAppError(e)
    if (appError.code === 'aborted') return
    error.value = appError
  } finally {
    isLoading.value = false
  }
}
```

Всегда сбрасывай `error` в начале новой попытки.
`finally` гарантирует снятие loading даже при throw.

---

## 5. Template: одна правда на экране

```vue
<template>
  <p v-if="isLoading" aria-busy="true">Loading…</p>

  <div v-else-if="error" role="alert">
    <p>{{ error.message }}</p>
    <button type="button" @click="load">Retry</button>
  </div>

  <p v-else-if="isEmpty">No products found</p>

  <ProductList v-else :products="products" />
</template>
```

Порядок имеет значение:

```text
loading → error → empty → success UI
```

Иначе при `isLoading && products.length === 0` можно случайно показать empty.

---

## 6. Detail page: success vs not found

Для `/products/:id`:

| Исход | Состояние |
|-------|-----------|
| грузим | loading |
| 404 / null после ok-политики API | empty или dedicated not-found |
| 500 / network | error |
| product есть | success |

```vue
<p v-if="isLoading">Loading…</p>
<p v-else-if="error" role="alert">{{ error.message }}</p>
<p v-else-if="!product">Product not found</p>
<article v-else>{{ product.title }}</article>
```

«Not found» можно считать разновидностью empty для singular resource.

---

## 7. Refetch: показывать ли старые данные?

### Жёсткий режим (проще для MVP)

При новом load очищай список + полный spinner.

```ts
products.value = []
isLoading.value = true
```

### Мягкий режим (лучше UX)

Оставляй предыдущие `products`, ставь `isLoading` / `isRefreshing`, не мигай empty.

```ts
const isRefreshing = computed(() => isLoading.value && products.value.length > 0)
```

```vue
<p v-if="isLoading && !products.length">Loading…</p>
<p v-else-if="isRefreshing">Updating…</p>
```

Для Module 7 MVP достаточно жёсткого режима; мягкий — плюс.

При **error после refetch** часто оставляют старые данные + banner ошибки — осознанный выбор.

---

## 8. Composable `useAsyncData` (учебный каркас)

```ts
// src/composables/useAsyncData.ts
import { ref, computed, type Ref } from 'vue'
import { toAppError, type AppError } from '@/api/errors'

export function useAsyncData<T>(loader: () => Promise<T>, isEmptyFn: (data: T) => boolean) {
  const data = ref<T | null>(null) as Ref<T | null>
  const isLoading = ref(false)
  const error = ref<AppError | null>(null)

  const isEmpty = computed(
    () => !isLoading.value && !error.value && data.value !== null && isEmptyFn(data.value),
  )
  const isSuccess = computed(
    () => !isLoading.value && !error.value && data.value !== null && !isEmptyFn(data.value),
  )

  async function execute() {
    isLoading.value = true
    error.value = null
    try {
      data.value = await loader()
    } catch (e) {
      const appError = toAppError(e)
      if (appError.code === 'aborted') return
      error.value = appError
    } finally {
      isLoading.value = false
    }
  }

  return { data, isLoading, error, isEmpty, isSuccess, execute }
}
```

```ts
const { data: products, isLoading, error, isEmpty, execute } = useAsyncData(
  () => fetchProducts(),
  (list) => list.length === 0,
)
```

Не обязательно тащить библиотеку — паттерн важнее. Module 8 (Vue Query) позже даст готовый server-state toolkit.

---

## 9. A11y и UX мелочи

- `aria-busy="true"` на loading-регионе
- `role="alert"` на error
- не оставляй кнопку Retry без `type="button"`
- скелетон лучше, чем пустой белый экран — optional
- не блокируй весь app layout, если грузится только `<main>`

---

## 10. Связь с client state (Module 6)

| | Loading products | Cart items |
|---|------------------|------------|
| Пока грузится | async status | обычно уже в памяти |
| Empty | нет товаров на сервере | корзина пуста — тоже empty, но **client** |
| Source | API | Pinia |

Не клади `isLoading` продуктов в `useCartStore`.
Async status живёт рядом с **server data** (page/composable), не в произвольном client store.

---

## 11. Частые ошибки

### Только `v-if="items.length"` в template

Нет loading/error — ломает UX.

### Empty во время loading

Неверный порядок условий.

### Не сбрасывать error на retry

Старое красное сообщение поверх новых данных.

### Считать `null` и `[]` одинаково без политики

Для list `[]` = empty success; для detail `null` = not found / empty.

### Пять спиннеров на каждый чих refetch

Подумай про soft loading.

---

## 12. Что важно понять после этого блока

Проверь себя:

1. Чем empty отличается от error?
2. Какой порядок `v-if` в template?
3. Зачем сбрасывать error перед новым load?
4. Что такое soft vs hard loading?
5. Как смоделировать status union?
6. Почему async status не кладут в cart store?

---

## 13. Что почитать

### Связанные материалы этого плана

- [Module 7 · обработка ошибок](./03-error-handling.md)
- [Module 7 · fetch](./01-fetch.md)

### Дальше по экосистеме (preview Module 8)

- [TanStack Query · Status](https://tanstack.com/query/latest/docs/framework/vue/guides/queries) — готовые `isPending` / `isError` / `isSuccess`

---

## 14. Практическое мини-задание

1. На CatalogPage реализуй 4 ветки UI: loading / error / empty / list
2. Сделай кнопку Retry
3. На Details — loading / error / not found / article
4. Сымитируй empty (фильтр без результатов или mock `[]`)
5. Опционально: soft loading при смене category

---

## 15. Мини-конспект

- четыре состояния — критерий Module 7, не «украшение»
- empty ≠ error; loading не должен выглядеть как empty
- сбрасывай error, снимай loading в `finally`
- держи async status рядом с server data
- дальше — pagination и query params как источник повторных loads

---

## 16. Что делать дальше

Следующий теоретический блок Module 7:

- [пагинация](./05-pagination.md)
