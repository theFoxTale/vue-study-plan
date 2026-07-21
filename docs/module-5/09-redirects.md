# Module 5 · Теория: redirects

Этот материал закрывает девятый теоретический пункт `Module 5`: понять, **что такое `redirect` и `alias`**, **когда URL должен меняться**, и **как переносить старые пути на новые** без битых ссылок.

Связанные материалы:

- [Module 5 · nested routes](./08-nested-routes.md)
- [Module 5 · динамические маршруты](./07-dynamic-routes.md)
- [Module 5 · useRouter](./05-use-router.md)

---

## 1. Redirect vs alias

| | Redirect | Alias |
|---|----------|-------|
| Заход на `/home` | URL **меняется** на `/` | URL **остаётся** `/home` |
| Что matched | целевой route | как будто открыли канонический path |
| Типичный смысл | «старый адрес → новый» | «два адреса, один UI» |

```ts
// redirect: /home → в адресной строке станет /
{ path: '/home', redirect: '/' }

// alias: /home показывает тот же UI, что /, но URL остаётся /home
{ path: '/', component: HomePage, alias: '/home' }
```

Официально:

- [Redirect and Alias · Vue Router](https://router.vuejs.org/guide/essentials/redirect-and-alias.html)

Для учебных и production app чаще нужен **redirect** (канонический URL один).

---

## 2. Простой redirect

### На path string

```ts
{ path: '/home', redirect: '/' }
```

### На named route

```ts
{ path: '/home', redirect: { name: 'home' } }
```

Named надёжнее, если канонический path позже изменится.

### Без `component`

У чистого redirect-record `component` не нужен — этот route сам не рендерится.

Исключение: nested route с `children` + `redirect` — тогда `component` у parent всё же нужен (layout).

---

## 3. Function redirect

Когда цель зависит от params/query:

```ts
{
  path: '/search/:searchText',
  redirect: (to) => ({
    path: '/search',
    query: { q: String(to.params.searchText) },
  }),
}
```

```text
/search/phones  →  /search?q=phones
```

Ещё пример — старый detail path:

```ts
{
  path: '/product/:id',
  redirect: (to) => ({
    name: 'product-details',
    params: { id: to.params.id },
  }),
}
```

```text
/product/42  →  /products/42
```

---

## 4. Типичные сценарии для catalog

### Корень ведёт в catalog

```ts
{ path: '/', redirect: { name: 'catalog' } }
```

Или наоборот: `/` = marketing home, `/catalog` = list — тогда redirect не нужен.

### Старый plural/singular

```ts
{ path: '/products', redirect: { name: 'catalog' } }
```

### Default child через redirect

Вместо пустого nested content:

```ts
{
  path: '/dashboard',
  component: DashboardLayout,
  redirect: { name: 'dashboard-overview' },
  children: [
    {
      path: 'overview',
      name: 'dashboard-overview',
      component: OverviewPage,
    },
    {
      path: 'settings',
      name: 'dashboard-settings',
      component: SettingsPage,
    },
  ],
}
```

```text
/dashboard  →  /dashboard/overview
```

Альтернатива — child с `path: ''` (см. nested routes). Оба подхода ок; redirect делает URL явнее.

---

## 5. Alias: когда уместен

```ts
{
  path: '/catalog',
  name: 'catalog',
  component: CatalogPage,
  alias: ['/products', '/shop'],
}
```

Все три URL показывают catalog, но в адресной строке остаётся тот, по которому зашли.

Минусы:

- несколько «правдивых» URL одной страницы
- для SEO нужен canonical
- сложнее рассуждать о «единственном» path

Правило Module 5:

```text
нужен один канонический URL → redirect
нужно временно поддержать старый bookmark без смены URL → alias
```

Предпочитай redirect.

---

## 6. Programmatic redirect в коде

Конфиг `redirect` — declarative.
В runtime — `router.replace` (обычно лучше `push`, чтобы не копить «лишнюю» history entry):

```ts
const route = useRoute()
const router = useRouter()

if (!product.value) {
  await router.replace({ name: 'not-found' })
}
```

Или после login:

```ts
await router.replace({ name: 'home' })
```

Разница:

| | Config `redirect` | `router.replace` |
|---|-------------------|------------------|
| Когда | всегда при match path | по условию в коде |
| Где | `routes` | page / guard / composable |

Guards (следующий урок) часто делают conditional redirect.

---

## 7. Важно про navigation guards

На route, который **только** redirect'ит, `beforeEnter` **не сработает** — guards применяются к **цели** redirect.

```ts
// beforeEnter здесь бесполезен
{ path: '/home', redirect: '/', beforeEnter: ... }
```

Условную логику вешай на target route или global/guard — разберём в **navigation guards**.

---

## 8. Порядок и конфликты

Redirect — обычный route record. Порядок всё ещё важен рядом с dynamic/catch-all:

```ts
routes: [
  { path: '/products', redirect: { name: 'catalog' } },
  { path: '/products/:id', name: 'product-details', component: ProductDetailsPage },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundPage },
]
```

Не ставь широкий redirect так, чтобы он перехватывал нужные dynamic paths.

---

## 9. Пример фрагмента router

```ts
const routes = [
  { path: '/', name: 'home', component: () => import('@/pages/HomePage.vue') },

  // legacy
  { path: '/home', redirect: { name: 'home' } },
  { path: '/products', redirect: { name: 'catalog' } },
  {
    path: '/product/:id',
    redirect: (to) => ({
      name: 'product-details',
      params: { id: to.params.id },
    }),
  },

  {
    path: '/catalog',
    name: 'catalog',
    component: () => import('@/pages/CatalogPage.vue'),
  },
  {
    path: '/products/:id',
    name: 'product-details',
    component: () => import('@/pages/ProductDetailsPage.vue'),
    props: true,
  },

  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/pages/NotFoundPage.vue'),
  },
]
```

---

## 10. Частые ошибки

### Alias вместо redirect «по привычке»

Получаешь дубли URL без нужды.

### Redirect loop

`A → B → A` — проверяй цели.

### `push` вместо `replace` для «исправления» URL

Лишняя history entry: Back возвращает на «плохой» промежуточный URL.

### Ждать `component` на чистом redirect

Не нужен (кроме nested parent с children).

### Класть conditional auth redirect только в routes config

Для «если не залогинен» нужны **guards**, не статичный `redirect`.

---

## 11. Что важно понять после этого блока

Проверь себя:

1. Чем redirect отличается от alias?
2. Какие формы принимает `redirect`?
3. Зачем function redirect?
4. Когда брать `router.replace` в коде?
5. Почему `beforeEnter` на redirect-route бесполезен?
6. Как перенести `/product/:id` на `/products/:id`?

---

## 12. Что почитать

### Официальное

- [Redirect and Alias](https://router.vuejs.org/guide/essentials/redirect-and-alias.html)

### Связанные материалы этого плана

- [Module 5 · nested routes](./08-nested-routes.md)
- [Module 5 · useRouter](./05-use-router.md)

---

## 13. Практическое мини-задание

1. Добавь `{ path: '/home', redirect: { name: 'home' } }`
2. Добавь legacy `/product/:id` → `product-details`
3. Реши для своего app: `/` = home или redirect на catalog — зафиксируй выбор
4. На not-found кнопкой «Home» сделай `router.replace({ name: 'home' })`
5. Один раз попробуй `alias` и сравни URL с redirect в DevTools

---

## 14. Мини-конспект

- redirect меняет URL на канонический; alias сохраняет URL
- `redirect` бывает string / named location / function
- legacy paths и default section URL — главные use cases
- в коде условный уход — обычно `replace`
- auth/role условия → navigation guards (далее)

---

## 15. Что делать дальше

Следующий теоретический блок Module 5:

- **navigation guards**

Разберём `beforeEach`, `beforeEnter`, per-route meta и отмену/redirect навигации.
