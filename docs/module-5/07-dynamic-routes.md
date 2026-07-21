# Module 5 · Теория: динамические маршруты

Этот материал закрывает седьмой теоретический пункт `Module 5`: понять, **как описывать `:param` в path**, **как строить list → detail**, **что делать с 404 / catch-all**, и **почему component переиспользуется при смене params**.

Связанные материалы:

- [Module 5 · useRoute](./06-use-route.md)
- [Module 5 · useRouter](./05-use-router.md)
- [Module 5 · RouterLink](./03-router-link.md)

---

## 1. Зачем динамические маршруты

Один и тот же page component должен обслуживать много URL:

```text
/products/1
/products/42
/products/abc
```

Вместо тысяч routes:

```ts
{ path: '/products/:id', name: 'product-details', component: ProductDetailsPage }
```

`:id` — **dynamic segment** (param).

Официально:

- [Dynamic Route Matching](https://router.vuejs.org/guide/essentials/dynamic-matching.html)
- [Passing Props to Route Components](https://router.vuejs.org/guide/essentials/passing-props.html)

---

## 2. Синтаксис `:param`

```ts
{ path: '/users/:username', component: UserPage }
{ path: '/users/:username/posts/:postId', component: UserPostPage }
```

| Pattern | URL | `route.params` |
|---------|-----|----------------|
| `/products/:id` | `/products/42` | `{ id: '42' }` |
| `/users/:username/posts/:postId` | `/users/ann/posts/7` | `{ username: 'ann', postId: '7' }` |

Правила:

- segment начинается с `:`
- значение попадает в `route.params` под тем же именем
- обычно это **string**

---

## 3. Catalog: list + detail

### Routes

```ts
const routes = [
  {
    path: '/catalog',
    name: 'catalog',
    component: () => import('@/pages/CatalogPage.vue'),
  },
  {
    path: '/products/:id',
    name: 'product-details',
    component: () => import('@/pages/ProductDetailsPage.vue'),
  },
]
```

### Ссылка из списка

```vue
<RouterLink
  :to="{ name: 'product-details', params: { id: product.id } }"
>
  {{ product.title }}
</RouterLink>
```

### Чтение на details

```ts
const route = useRoute()
const productId = computed(() => {
  const id = route.params.id
  return typeof id === 'string' ? id : ''
})
```

Это ядро Module 5 practice для Product Catalog.

---

## 4. Переиспользование component при смене params

Переход:

```text
/products/1  →  /products/2
```

Vue Router **переиспользует** тот же instance `ProductDetailsPage` (эффективнее, чем destroy/create).

Следствие:

- `onMounted` **не** вызовется снова
- старые data в `ref` останутся, пока сам не обновишь

Решения:

### A) `watch` на param

```ts
watch(
  () => route.params.id,
  async (id) => {
    if (typeof id !== 'string') return
    product.value = await fetchProductById(id)
  },
  { immediate: true },
)
```

### B) `onBeforeRouteUpdate`

```ts
import { onBeforeRouteUpdate } from 'vue-router'

onBeforeRouteUpdate(async (to) => {
  const id = to.params.id
  if (typeof id === 'string') {
    product.value = await fetchProductById(id)
  }
})
```

Для Module 5 чаще хватает `watch` + `immediate: true`.

### C) `:key` на `RouterView` (грубый вариант)

```vue
<RouterView :key="$route.fullPath" />
```

Принудительный remount каждой смены URL. Работает, но тяжелее — используй осознанно.

---

## 5. `props: true` — params как props page

```ts
{
  path: '/products/:id',
  name: 'product-details',
  component: ProductDetailsPage,
  props: true,
}
```

```vue
<!-- ProductDetailsPage.vue -->
<script setup lang="ts">
const props = defineProps<{ id: string }>()
</script>
```

Router передаст `params.id` как prop `id`.

Плюсы:

- page меньше зависит от `useRoute`
- проще тестировать

Минусы:

- всё равно нужен watch/update при смене params, если component reused
- для query удобнее custom function:

```ts
props: (route) => ({
  id: route.params.id,
  tab: route.query.tab,
})
```

---

## 6. Optional params и regexp (обзор)

Advanced patterns (подробности в docs):

```ts
// optional param
{ path: '/users/:id?' }

// custom regexp: только digits
{ path: '/products/:id(\\d+)' }
```

Для учебного catalog обычно достаточно:

```ts
path: '/products/:id'
```

+ валидация id в page / при fetch.

---

## 7. Catch-all / 404

Неизвестный URL должен показать Not Found, а не «пустой экран».

```ts
{
  path: '/:pathMatch(.*)*',
  name: 'not-found',
  component: () => import('@/pages/NotFoundPage.vue'),
}
```

Ставь **в конце** `routes` — иначе перехватит всё слишком рано.

```vue
<!-- NotFoundPage.vue -->
<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <section>
    <h1>404</h1>
    <p>Page not found</p>
    <RouterLink :to="{ name: 'home' }">Go home</RouterLink>
  </section>
</template>
```

Помни: при `createWebHistory` server тоже должен отдавать `index.html` на unknown paths — иначе 404 будет от server, не от Vue.

---

## 8. Порядок routes имеет значение

```ts
routes: [
  { path: '/products/new', name: 'product-create', component: ProductCreatePage },
  { path: '/products/:id', name: 'product-details', component: ProductDetailsPage },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundPage },
]
```

Если `:id` объявить раньше `/products/new`, то `new` станет `id = 'new'`.

Правило:

```text
сначала конкретные path
потом dynamic
в самом конце catch-all
```

---

## 9. Params vs query: ещё раз на практике

| Задача | URL | Почему |
|--------|-----|--------|
| Конкретный товар | `/products/42` | стабильный identity, SEO, share |
| Фильтр списка | `/catalog?category=phones` | опции одного и того же list screen |
| Вкладка на details | `/products/42?tab=reviews` | тот же resource, другой view mode |

Не делай `/catalog?id=42` вместо `/products/42` для entity page.

---

## 10. Полный фрагмент router для catalog

```ts
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: () => import('@/pages/HomePage.vue') },
    { path: '/catalog', name: 'catalog', component: () => import('@/pages/CatalogPage.vue') },
    {
      path: '/products/:id',
      name: 'product-details',
      component: () => import('@/pages/ProductDetailsPage.vue'),
      props: true,
    },
    { path: '/about', name: 'about', component: () => import('@/pages/AboutPage.vue') },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/pages/NotFoundPage.vue'),
    },
  ],
})

export default router
```

---

## 11. Частые ошибки

### Забыли watch при смене `:id`

UI показывает данные предыдущего товара.

### Catch-all не в конце

Ломает все остальные routes.

### `/products/new` после `/products/:id`

`new` воспринимается как id.

### `params` + `path` в `push`

```ts
// ❌
router.push({ path: '/products', params: { id: 1 } })

// ✅
router.push({ name: 'product-details', params: { id: 1 } })
```

### Не проверить тип param

`string | string[]` — всегда сужай тип.

### 404 только на server, не в SPA

Нужен и catch-all route в Vue Router.

---

## 12. Что важно понять после этого блока

Проверь себя:

1. Что означает `:id` в path?
2. Куда попадает значение param?
3. Почему `/products/1` → `/products/2` не вызывает новый `onMounted`?
4. Зачем catch-all и куда его ставить?
5. Почему статичный `/products/new` объявляют до `/products/:id`?
6. Когда `props: true` удобен?

---

## 13. Что почитать

### Официальное

- [Dynamic Route Matching](https://router.vuejs.org/guide/essentials/dynamic-matching.html)
- [Route Matching Syntax](https://router.vuejs.org/guide/essentials/route-matching-syntax.html)
- [Passing Props](https://router.vuejs.org/guide/essentials/passing-props.html)

### Связанные материалы этого плана

- [Module 5 · useRoute](./06-use-route.md)
- [Module 5 · RouterLink](./03-router-link.md)

---

## 14. Практическое мини-задание

1. Добавь route `/products/:id` + `ProductDetailsPage`
2. Из catalog сделай `RouterLink` с `params.id`
3. Загружай product по id через `watch(..., { immediate: true })`
4. Добавь `NotFoundPage` и catch-all в конец
5. Проверь руками: `/products/1`, смена на `/products/2`, несуществующий `/nope`

---

## 15. Мини-конспект

- `:param` в path → `route.params.param`
- list/detail — главный учебный scenario
- при смене params component часто reused → `watch` / `onBeforeRouteUpdate`
- конкретные path раньше dynamic, catch-all в конце
- `props: true` может пробросить params в page props

---

## 16. Что делать дальше

Следующий теоретический блок Module 5:

- [nested routes](./08-nested-routes.md)
