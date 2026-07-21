# Module 5 · Теория: lazy loading routes

Этот материал закрывает последний теоретический пункт `Module 5`: понять, **зачем lazy routes**, **как писать `() => import(...)`**, и **как проверить code splitting** в Vite-сборке.

Связанные материалы:

- [Module 5 · создание router instance](./02-creating-router-instance.md)
- [Module 5 · динамические маршруты](./07-dynamic-routes.md)
- [Module 5 · navigation guards](./10-navigation-guards.md)

---

## 1. Проблема eager imports

```ts
import HomePage from '@/pages/HomePage.vue'
import CatalogPage from '@/pages/CatalogPage.vue'
import ProductDetailsPage from '@/pages/ProductDetailsPage.vue'
import AboutPage from '@/pages/AboutPage.vue'
import NotFoundPage from '@/pages/NotFoundPage.vue'
```

Все pages попадают в **начальный JS bundle**.

Следствие:

- первый load тяжелее
- пользователь скачивает код pages, на которые может не зайти

Официально:

- [Lazy Loading Routes · Vue Router](https://router.vuejs.org/guide/advanced/lazy-loading.html)

---

## 2. Решение: dynamic import

```ts
{
  path: '/catalog',
  name: 'catalog',
  component: () => import('@/pages/CatalogPage.vue'),
}
```

`component` принимает **функцию**, которая возвращает `Promise` component.

Vue Router:

1. при первом заходе на route вызывает эту функцию
2. ждёт загрузки chunk
3. кеширует результат — повторный визит без повторной загрузки модуля

Vite/webpack автоматически делают **code splitting**: отдельный `.js` chunk на page (или группу).

---

## 3. Eager vs lazy

| | Eager `import X from ...` | Lazy `() => import(...)` |
|---|---------------------------|---------------------------|
| Когда грузится | при старте app | при первом заходе на route |
| Bundle | в main chunk | отдельный chunk |
| Первый paint app | тяжелее | легче |
| Первый заход на page | быстрее (уже в памяти) | небольшая задержка на fetch chunk |

Рекомендация Vue Router: **для route components обычно всегда lazy**.

Исключение: совсем крошечный app / критичный first screen, который хочешь в main bundle — осознанный trade-off.

---

## 4. Полный пример router

```ts
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/pages/HomePage.vue'),
    },
    {
      path: '/catalog',
      name: 'catalog',
      component: () => import('@/pages/CatalogPage.vue'),
    },
    {
      path: '/products/:id',
      name: 'product-details',
      props: true,
      component: () => import('@/pages/ProductDetailsPage.vue'),
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('@/pages/AboutPage.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/pages/NotFoundPage.vue'),
    },
  ],
})

export default router
```

В `router/index.ts` **нет** static imports pages — только dynamic.

---

## 5. Nested lazy layouts

```ts
{
  path: '/dashboard',
  component: () => import('@/layouts/DashboardLayout.vue'),
  children: [
    {
      path: '',
      name: 'dashboard',
      component: () => import('@/pages/dashboard/OverviewPage.vue'),
    },
    {
      path: 'settings',
      name: 'dashboard-settings',
      component: () => import('@/pages/dashboard/SettingsPage.vue'),
    },
  ],
}
```

Parent и children могут грузиться отдельными chunks.
При первом заходе на `/dashboard/settings` подтянутся нужные async components по цепочке resolve.

---

## 6. Не путать с Vue async components

| | Vue async component | Lazy route component |
|---|---------------------|----------------------|
| API | `defineAsyncComponent(() => import(...))` | `() => import(...)` в `route.component` |
| Где | внутри page/UI | в router config |

**Не оборачивай** route component в `defineAsyncComponent` — Vue Router уже умеет Promise-функции.

`defineAsyncComponent` можно использовать **внутри** page для тяжёлого виджета, но сам route — просто `() => import('...Page.vue')`.

---

## 7. Loading / error UX (практично)

Пока chunk грузится, outlet может кратко быть пустым.

Варианты:

### A) Ничего специального

Для локальной сети / маленьких pages часто ок.

### B) Global pending indicator

```ts
router.beforeEach(() => {
  // NProgress.start()
})

router.afterEach(() => {
  // NProgress.done()
})
```

### C) Suspense (если page — async setup)

Отдельная тема Vue; для Module 5 достаточно понимать, что lazy route = network wait на chunk.

---

## 8. Как проверить, что splitting работает

### DevTools → Network

1. `npm run dev`
2. Открой Home
3. Кликни Catalog
4. В Network появится запрос chunk page (в dev вид может отличаться)

### Production build

```bash
npm run build
```

В `dist/assets/` увидишь несколько JS-файлов — pages разъедутся по chunks.

```bash
npm run preview
```

Проверь, что navigation всё ещё работает.

---

## 9. Grouping chunks (обзор)

Иногда несколько pages одной секции хочется грузить одним chunk.

### Vite

`build.rollupOptions.output.manualChunks` — см. [официальный guide](https://router.vuejs.org/guide/advanced/lazy-loading.html).

### Webpack

`import(/* webpackChunkName: "group-user" */ './User.vue')`

Для Module 5 practice **не обязательно**: дефолтного splitting по `import()` достаточно.

---

## 10. Prefetch (опционально)

Vite/плагины могут prefetch chunk'и ссылок.
Идея: пока пользователь на Home, браузер заранее тянет Catalog chunk.

Это optimization поверх lazy loading — не путай с самой записью `() => import()`.

---

## 11. Связь с критериями Module 5

Из README:

- минимум 3 pages
- динамические маршруты
- **lazy loading**
- `useRouter` / `useRoute`
- понимание guards

Lazy — обязательный критерий завершения: route components через dynamic import.

---

## 12. Частые ошибки

### Static import «для удобства» + lazy в routes

Если page всё равно `import`'ится сверху файла — она уже в main bundle. Lazy бесполезен.

```ts
// ❌
import CatalogPage from '@/pages/CatalogPage.vue'
component: () => import('@/pages/CatalogPage.vue') // Vite может сдедупить, но static import тянет модуль рано
```

Убери static import pages из router-файла.

### `defineAsyncComponent` как route.component

Лишнее и может путать. Для routes — голый `() => import()`.

### Lazy только NotFound, остальное eager

Выигрыш маленький. Лени всё, что не обязательно на first paint.

### Думать, что lazy заменяет data fetching

Chunk ≠ product API. Data по-прежнему грузишь в page/composable.

---

## 13. Что важно понять после этого блока

Проверь себя:

1. Чем lazy route отличается от eager import?
2. Какой синтаксис `component` для lazy?
3. Когда Vue Router загружает chunk?
4. Почему static import сверху отменяет выгоду?
5. Как проверить splitting в build?
6. Нужен ли `defineAsyncComponent` для route?

---

## 14. Что почитать

### Официальное

- [Lazy Loading Routes](https://router.vuejs.org/guide/advanced/lazy-loading.html)
- [Vite · Code Splitting](https://vitejs.dev/guide/features.html#code-splitting) *(общая идея bundler)*

### Связанные материалы этого плана

- [Module 5 · создание router instance](./02-creating-router-instance.md)
- [Module 5 · navigation guards](./10-navigation-guards.md)

---

## 15. Практическое мини-задание

1. Переведи все route `component` на `() => import(...)`
2. Убери static imports pages из `router/index.ts`
3. Сделай `npm run build` и посмотри chunks в `dist/assets`
4. В Network проверь подгрузку при первом заходе на details
5. Оставь lazy на nested layout + children, если они есть

---

## 16. Мини-конспект

- lazy routes = `component: () => import('...vue')`
- pages грузятся по требованию → меньше initial bundle
- не смешивай с `defineAsyncComponent` на уровне route
- Vite сам делает code splitting
- для Module 5 lazy — обязательный критерий

---

## 17. Что делать дальше

Теория Module 5 закрыта.

Следующий шаг:

- [практический checklist Module 5](./12-practice-checklist.md)
