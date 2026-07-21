# Module 5 · Теория: useRouter

Этот материал закрывает пятый теоретический пункт `Module 5`: понять, **как получать router в Composition API**, **когда нужен programmatic navigation**, и **как пользоваться `push` / `replace` / `back`**.

Связанные материалы:

- [Module 5 · RouterLink](./03-router-link.md)
- [Module 5 · RouterView](./04-router-view.md)
- [Module 5 · создание router instance](./02-creating-router-instance.md)

---

## 1. Что такое `useRouter`

`useRouter()` — composable Vue Router. Возвращает **router instance** внутри `setup` / `<script setup>`.

```ts
import { useRouter } from 'vue-router'

const router = useRouter()
```

Через него:

- `router.push(...)`
- `router.replace(...)`
- `router.back()` / `forward()` / `go(n)`
- доступ к текущему resolved state (реже нужен напрямую)

В Options API это был `this.$router`.
В Composition API — `useRouter()`.

Официально:

- [Vue Router + Composition API](https://router.vuejs.org/guide/advanced/composition-api.html)
- [Programmatic Navigation](https://router.vuejs.org/guide/essentials/navigation.html)

---

## 2. Когда `useRouter`, а когда `RouterLink`

| Ситуация | Инструмент |
|----------|------------|
| Пункт меню / текстовая ссылка | `RouterLink` |
| Карточка товара как ссылка | `RouterLink` |
| После успешного submit формы | `router.push` |
| После delete → назад к списку | `router.push` / `replace` |
| Кнопка «Назад» с логикой | `router.back()` или `push` |
| Redirect по условию в коде | `router.replace` |

Правило:

```text
если пользователь кликает «как по ссылке» → RouterLink
если navigation — следствие действия в коде → useRouter()
```

`RouterLink` внутри вызывает тот же `router.push`.

---

## 3. Базовый пример

```vue
<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function goToCatalog() {
  router.push({ name: 'catalog' })
}

async function onCreateProduct() {
  // await api.create(...)
  await router.push({ name: 'catalog' })
}
</script>

<template>
  <button type="button" @click="goToCatalog">
    Open catalog
  </button>
</template>
```

---

## 4. `router.push` — основная навигация

Добавляет новую запись в history (кнопка Back вернёт назад).

### Формы location (те же, что у `RouterLink` `to`)

```ts
// string path
router.push('/catalog')

// path object
router.push({ path: '/catalog' })

// named route
router.push({ name: 'catalog' })

// params
router.push({ name: 'product-details', params: { id: product.id } })

// query
router.push({ name: 'catalog', query: { category: 'phones' } })

// hash
router.push({ path: '/about', hash: '#team' })
```

Важно:

```ts
// ❌ params игнорируются при path
router.push({ path: '/products', params: { id: 42 } })

// ✅
router.push({ name: 'product-details', params: { id: 42 } })
router.push(`/products/${id}`)
```

---

## 5. `router.replace`

Как `push`, но **заменяет** текущую history entry.

```ts
router.replace({ name: 'home' })

// эквивалент
router.push({ name: 'home', replace: true })
```

Типичные случаи:

- после login не возвращать на `/login` по Back
- «исправить» URL (redirect-like)
- стартовый fallback, если page не нужна в истории

---

## 6. History traversal

```ts
router.back()    // = go(-1)
router.forward() // = go(1)
router.go(-2)    // на 2 записи назад
```

```vue
<button type="button" @click="router.back()">
  Back
</button>
```

Осторожно: если history пустая (прямой заход на detail), `back()` может увести с сайта.
Надёжнее:

```ts
function goBackToCatalog() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push({ name: 'catalog' })
  }
}
```

Или всегда явно:

```ts
router.push({ name: 'catalog' })
```

---

## 7. `push` / `replace` возвращают Promise

```ts
try {
  await router.push({ name: 'product-details', params: { id } })
  // navigation завершилась успешно
} catch {
  // navigation aborted / failed (duplicate, guard cancel, …)
}
```

Полезно после async flow:

```ts
async function saveAndOpen(productId: string) {
  await api.save()
  await router.push({
    name: 'product-details',
    params: { id: productId },
  })
}
```

Повторный `push` на тот же URL может дать ошибку duplication — это нормально; часто её игнорируют или обрабатывают явно.

---

## 8. Примеры для catalog app

### После выбора фильтров (кнопка Apply)

```ts
function applyFilters(category: string) {
  router.push({
    name: 'catalog',
    query: { category },
  })
}
```

### Из list → details по кнопке (если не link)

```ts
function openProduct(id: number) {
  router.push({ name: 'product-details', params: { id } })
}
```

Предпочтительнее всё же `RouterLink` на карточке — лучше a11y и «open in new tab».

### Not found → home

```ts
function goHome() {
  router.replace({ name: 'home' })
}
```

---

## 9. Где вызывать `useRouter`

Только внутри:

- `<script setup>`
- `setup()`
- composable, вызванного из setup

```ts
// ✅ composable
export function useProductNavigation() {
  const router = useRouter()

  function openProduct(id: number | string) {
    return router.push({
      name: 'product-details',
      params: { id: String(id) },
    })
  }

  return { openProduct }
}
```

```ts
// ❌ вне setup / вне Vue context
const router = useRouter() // в обычном .ts модуле на top-level — ошибка
```

Router должен быть подключён через `app.use(router)` до использования.

---

## 10. Template: `$router` без import

В template по-прежнему можно:

```vue
<button type="button" @click="$router.push('/catalog')">
  Catalog
</button>
```

В `<script setup>` для логики лучше явный `useRouter()` — проще тестировать и типизировать.

---

## 11. Связка с `useRoute` (preview)

Часто вместе:

```ts
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

function nextPage() {
  const page = Number(route.query.page ?? 1)
  router.push({
    name: 'catalog',
    query: { ...route.query, page: page + 1 },
  })
}
```

- `useRouter` — **команды** navigation
- `useRoute` — **чтение** текущего URL / params / query

`useRoute` — следующий урок.

---

## 12. Частые ошибки

### Кнопка вместо `RouterLink` без причины

Теряешь middle-click / open in new tab.

### `params` + `path`

Params молча игнорируются.

### `useRouter()` вне component context

Нужен вызов из setup / composable из setup.

### Слепой `router.back()`

Прямой заход на `/products/42` → Back уводит со сайта.

### Путать `push` и `replace`

`replace` не даёт вернуться на предыдущий экран этой же сессии navigation.

---

## 13. Что важно понять после этого блока

Проверь себя:

1. Что возвращает `useRouter()`?
2. Когда брать `RouterLink`, а когда `push`?
3. Чем `push` отличается от `replace`?
4. Какие формы location принимает `push`?
5. Почему `back()` бывает небезопасен?
6. Можно ли вызывать `useRouter` в обычном util без setup?

---

## 14. Что почитать

### Официальное

- [Programmatic Navigation](https://router.vuejs.org/guide/essentials/navigation.html)
- [Composition API](https://router.vuejs.org/guide/advanced/composition-api.html)

### Связанные материалы этого плана

- [Module 5 · RouterLink](./03-router-link.md)
- [Module 5 · RouterView](./04-router-view.md)

---

## 15. Практическое мини-задание

1. Добавь кнопку «To catalog» через `router.push({ name: 'catalog' })`
2. После «фейкового» create product сделай `await router.push` на details
3. На details добавь «Back to catalog» через `push`, не через слепой `back`
4. Один сценарий сделай через `replace` (например, с not-found на home)
5. Сравни UX с тем же переходом через `RouterLink`

---

## 16. Мини-конспект

- `useRouter()` даёт router instance в Composition API
- `push` = новая history entry, `replace` = замена текущей
- location API совпадает с `RouterLink` `to`
- ссылки в UI → `RouterLink`, действия в коде → `useRouter`
- `back`/`go` есть, но явный `push` на named route часто надёжнее

---

## 17. Что делать дальше

Следующий теоретический блок Module 5:

- **`useRoute`**

Разберём чтение `params`, `query`, `path`, `name` и реакцию на смену route.
