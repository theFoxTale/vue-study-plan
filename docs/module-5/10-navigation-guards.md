# Module 5 · Теория: navigation guards

Этот материал закрывает десятый теоретический пункт `Module 5`: понять, **как перехватывать navigation**, **как отменить или redirect'ить переход**, и **где использовать global / per-route / in-component guards**.

Связанные материалы:

- [Module 5 · redirects](./09-redirects.md)
- [Module 5 · useRouter](./05-use-router.md)
- [Module 5 · useRoute](./06-use-route.md)

---

## 1. Что такое navigation guards

**Guards** — хуки Vue Router вокруг смены route.

Ими можно:

- проверить доступ (auth, role)
- отменить переход (`return false`)
- отправить на другой URL (`return { name: 'login' }`)
- среагировать на уход со страницы (unsaved changes)
- сделать side effects после успешной навигации (title, analytics)

Официально:

- [Navigation Guards · Vue Router](https://router.vuejs.org/guide/advanced/navigation-guards.html)

---

## 2. Три уровня

| Уровень | API | Когда |
|---------|-----|--------|
| Global | `router.beforeEach` / `beforeResolve` / `afterEach` | почти каждая навигация |
| Per-route | `beforeEnter` в route record | вход на конкретный route |
| In-component | `onBeforeRouteLeave` / `onBeforeRouteUpdate` | логика конкретной page |

Для Module 5 practice достаточно понять все три; в коде чаще всего понадобятся `beforeEach` + `meta` и иногда leave-guard.

---

## 3. Global `beforeEach`

```ts
// src/router/index.ts
const router = createRouter({ /* ... */ })

router.beforeEach((to, from) => {
  // to   — куда идём
  // from — откуда

  // return false           → отменить
  // return { name: '...' } → redirect
  // return true / ничего   → продолжить
})
```

### Return values (Vue Router 4 style)

| Return | Эффект |
|--------|--------|
| ничего / `true` / `undefined` | разрешить |
| `false` | отменить |
| route location | новый navigation на эту цель |
| `Error` (throw) | отмена + `router.onError` |

Предпочитай **return**, а не старый `next()` — меньше ошибок «вызвал next дважды».

---

## 4. Auth-паттерн через `meta`

### В routes

```ts
{
  path: '/dashboard',
  name: 'dashboard',
  component: () => import('@/pages/DashboardPage.vue'),
  meta: { requiresAuth: true },
},
{
  path: '/login',
  name: 'login',
  component: () => import('@/pages/LoginPage.vue'),
},
```

### В guard

```ts
import { useAuthStore } from '@/stores/auth'

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return {
      name: 'login',
      query: { redirect: to.fullPath },
    }
  }

  // уже залогинен и идёт на login → домой
  if (to.name === 'login' && auth.isAuthenticated) {
    return { name: 'home' }
  }
})
```

Критично: **избегай infinite redirect** — не отправляй на `login`, если уже идёшь на `login`.

Для nested routes `meta` с parent **наследуется** в matched records — проверяй через:

```ts
to.matched.some((record) => record.meta.requiresAuth)
```

или читай `to.meta`, если meta merge настроен/ожидаем так в своей версии — надёжнее `matched.some`.

---

## 5. `beforeResolve` и `afterEach`

### `beforeResolve`

Вызывается **поздно**: после in-component guards и resolve async components, перед confirm.

```ts
router.beforeResolve(async (to) => {
  if (to.meta.requiresCamera) {
    // последний шанс отменить
  }
})
```

Удобно для «дорогих» проверок, когда уже ясно, что route доступен по остальным правилам.

### `afterEach`

Не может отменить navigation — только side effects:

```ts
router.afterEach((to) => {
  document.title = (to.meta.title as string) || 'Product Catalog'
})
```

Analytics, focus management, title — сюда.

---

## 6. Per-route `beforeEnter`

```ts
{
  path: '/products/:id',
  name: 'product-details',
  component: ProductDetailsPage,
  beforeEnter: (to) => {
    const id = to.params.id
    if (typeof id !== 'string' || !/^\d+$/.test(id)) {
      return { name: 'not-found' }
    }
  },
}
```

Особенности:

- срабатывает при **входе** на route с другого route
- **не** срабатывает при смене только params/query на том же record (`/products/1` → `/products/2`) — для этого `onBeforeRouteUpdate` / `watch`

Можно передать массив guard-функций для переиспользования.

---

## 7. In-component guards (Composition API)

### Уход со страницы

```ts
import { onBeforeRouteLeave } from 'vue-router'

const isDirty = ref(false)

onBeforeRouteLeave(() => {
  if (!isDirty.value) return true
  const ok = window.confirm('Discard unsaved changes?')
  return ok
})
```

`return false` — остаться на странице.

### Обновление того же component

```ts
import { onBeforeRouteUpdate } from 'vue-router'

onBeforeRouteUpdate(async (to) => {
  const id = to.params.id
  if (typeof id === 'string') {
    await loadProduct(id)
  }
})
```

Альтернатива — `watch(() => route.params.id)` из урока useRoute / dynamic routes.

`beforeRouteEnter` в Options API не имеет `this`; в `<script setup>` обычно хватает `onMounted` + watch.

---

## 8. Нужны ли guards для Module 5 catalog?

**Не обязательны** для минимальной практики (≥3 pages, dynamic, lazy).

Имеет смысл добавить, если:

- есть mock login / «admin only»
- хочешь validate `:id` до входа на page
- есть форма с unsaved changes
- ставишь `document.title` в `afterEach`

Понимать guards нужно даже без auth: это стандартный слой Vue Router.

---

## 9. Пример: optional «admin» для catalog

```ts
// router/index.ts
const routes = [
  // ...
  {
    path: '/admin/products',
    name: 'admin-products',
    component: () => import('@/pages/admin/AdminProductsPage.vue'),
    meta: { requiresAuth: true, roles: ['admin'] },
  },
]

router.beforeEach((to) => {
  const auth = useAuthStore()
  const needsAuth = to.matched.some((r) => r.meta.requiresAuth)

  if (needsAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  const roles = to.meta.roles as string[] | undefined
  if (roles && !roles.includes(auth.role)) {
    return { name: 'home' }
  }
})
```

Pinia store в guard: подключай router **после** `app.use(pinia)`, либо вызывай store внутри guard (когда pinia уже active).

---

## 10. Порядок resolution (упрощённо)

1. Navigation triggered  
2. `onBeforeRouteLeave` (уходящие components)  
3. Global `beforeEach`  
4. `onBeforeRouteUpdate` (reused components)  
5. `beforeEnter`  
6. Resolve async route components  
7. `beforeRouteEnter` (Options)  
8. Global `beforeResolve`  
9. Confirm  
10. `afterEach`  
11. DOM update  

Полный список — в официальных docs.

---

## 11. Частые ошибки

### Infinite redirect на login

Всегда исключай целевой login/public routes.

### Старый `next()` вызван дважды

В Router 4 пиши `return`.

### Auth-проверка только в page `onMounted`

URL уже сменился, возможен flash protected UI. Guard срабатывает **до** confirm.

### `beforeEnter` ждут на смену `:id`

Не сработает — нужен update-guard / watch.

### Тяжёлый fetch в каждом `beforeEach`

Держи guard тонким; data loading — в page / `beforeResolve` точечно.

### Путать `afterEach` с guard

`afterEach` не отменяет переход.

---

## 12. Что важно понять после этого блока

Проверь себя:

1. Чем `beforeEach` отличается от `beforeEnter`?
2. Какие return values бывают у guard?
3. Зачем `meta.requiresAuth`?
4. Как избежать redirect loop на login?
5. Когда брать `onBeforeRouteLeave`?
6. Обязательны ли guards для простого catalog?

---

## 13. Что почитать

### Официальное

- [Navigation Guards](https://router.vuejs.org/guide/advanced/navigation-guards.html)
- [Route Meta Fields](https://router.vuejs.org/guide/advanced/meta.html)

### Связанные материалы этого плана

- [Module 5 · redirects](./09-redirects.md)
- [Module 5 · динамические маршруты](./07-dynamic-routes.md)

---

## 14. Практическое мини-задание

Минимум (понимание):

1. Добавь `meta: { title: '...' }` на pages
2. В `afterEach` ставь `document.title`

Опционально (auth):

1. Mock `isAuthenticated` в store/composable
2. Защити один route через `meta.requiresAuth` + `beforeEach`
3. С login возвращайся на `query.redirect` или home
4. На форме добавь `onBeforeRouteLeave` с confirm

---

## 15. Мини-конспект

- guards перехватывают navigation: allow / cancel / redirect
- global + `meta` — основной паттерн доступа
- `beforeEnter` — точечно на route; не на каждую смену params
- leave/update — in-component composables
- для простого catalog guards optional, но концепция обязательна

---

## 16. Что делать дальше

Следующий (последний теоретический) блок Module 5:

- **lazy loading routes**

Разберём `() => import(...)`, code splitting pages и связку с performance SPA.
