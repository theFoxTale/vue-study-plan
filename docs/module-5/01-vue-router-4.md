# Module 5 · Теория: Vue Router 4

Этот материал открывает **Module 5** и закрывает первый теоретический пункт: понять, **что такое Vue Router 4**, **зачем он нужен в SPA**, и **как routing связан с pages/layouts** в учебном проекте.

Связанные материалы:

- [Module 4 · types in store & router](../module-4/07-types-in-store-and-router.md)
- [Module 4 · practice checklist](../module-4/08-practice-checklist.md)
- [Module 3 · UI decomposition](../module-3/08-ui-decomposition.md)

---

## 1. Что такое Vue Router

**Vue Router** — официальная библиотека client-side routing для Vue.

В SPA:

```text
URL меняется
   ↓
Vue Router выбирает page component
   ↓
контент обновляется
   ↓
полная перезагрузка страницы с сервера не нужна
```

Без router у тебя один экран в `App.vue`.
С router появляется навигация между страницами:

```text
/                → Home / Catalog
/products/:id    → Product details
/about           → About
```

Официально:

- [Vue Router · Getting Started](https://router.vuejs.org/guide/)

---

## 2. Зачем routing в учебном плане

К Module 5 у тебя уже есть:

- components
- composables
- typed models
- catalog UI

Теперь нужно научиться:

- разделять app на **pages**
- синхронизировать UI с **URL**
- делать shareable links (`/products/42`)
- готовить основу для layouts, guards, lazy loading

Для catalog practice это особенно важно: список + detail page — классический router scenario.

---

## 3. SPA vs multi-page website

| | Classic multi-page | SPA + Vue Router |
|---|--------------------|------------------|
| Переход | новый HTML с сервера | client navigation |
| URL | да | да |
| Reload | обычно полный | нет (обычно) |
| State | часто теряется | можно сохранить в memory/store |
| SEO/SSR | проще из коробки | позже через Nuxt/SSR |

Module 5 фокусируется на **SPA routing**.
SSR/Nuxt будут позже.

---

## 4. Главные части Vue Router

| Часть | Роль |
|------|------|
| `createRouter()` | создаёт router instance |
| `routes` | map path → component |
| `history` | как URL выглядит в браузере |
| `RouterLink` | навигационные ссылки |
| `RouterView` | outlet для текущей page |
| `useRouter()` | programmatic navigation |
| `useRoute()` | текущий route (params/query) |

В следующих уроках каждый пункт разберём отдельно.
Сейчас нужна big picture.

---

## 5. Минимальная картина приложения

```text
main.ts
  createApp(App).use(router).mount('#app')

router/index.ts
  createRouter({ history, routes })

App.vue
  <RouterLink /> + <RouterView />

pages/
  HomePage.vue
  CatalogPage.vue
  ProductDetailsPage.vue
  AboutPage.vue
```

`App.vue` становится shell/layout.
Контент страниц рендерится через `RouterView`.

---

## 6. History modes *(коротко)*

При создании router выбирают history:

### `createWebHistory()`

```text
/about
/products/42
```

Современный default для Vite SPA.
Нужна server fallback на `index.html` при deploy.

### `createWebHashHistory()`

```text
/#/about
/#/products/42
```

Проще для статичного hosting без rewrite rules.
URL менее «красивый».

### `createMemoryHistory()`

Для тестов / playground, не для обычного browser app.

Для Module 5 practice обычно:

```ts
createWebHistory()
```

---

## 7. Routes как карта приложения

```ts
const routes = [
  { path: '/', name: 'home', component: HomePage },
  { path: '/catalog', name: 'catalog', component: CatalogPage },
  { path: '/products/:id', name: 'product-details', component: ProductDetailsPage },
  { path: '/about', name: 'about', component: AboutPage },
]
```

Каждый route отвечает на вопрос:

```text
какой URL → какой page component показать
```

Позже добавятся:

- nested routes
- redirects
- guards
- lazy `() => import(...)`

---

## 8. Pages vs components

Важное архитектурное различие:

| | Page | Component |
|---|------|-----------|
| Привязка к URL | да | обычно нет |
| Роль | экран / entry feature | reusable UI / feature part |
| Пример | `CatalogPage` | `ProductCard` |
| Где лежит | `src/pages` или `src/views` | `src/components` |

```text
CatalogPage (route)
  ├─ ProductFilters
  ├─ ProductList
  └─ ProductCard
```

Router почти никогда не должен напрямую монтировать мелкий `ProductCard` как page.
Page = контейнер экрана.

---

## 9. Как Vue Router связан с уже изученным

### С Module 3

- pages = containers
- reusable UI остаётся presentational

### С Module 4

- `route.params.id` нужно парсить в `number`
- `query.sortBy` сужать к `SortBy`
- domain types переиспользуются на detail page

### С Module 2

- fetch может зависеть от `route.params`
- `watch(() => route.params.id, ...)` — частый паттерн

---

## 10. Установка в учебном проекте

Если проект создавался через `create-vue` с Router → уже есть.

Если нет:

```bash
npm install vue-router@4
```

Затем:

1. создать `src/router/index.ts`
2. подключить `app.use(router)` в `main.ts`
3. добавить `RouterView` в `App.vue`

Подробный setup — в следующем уроке про **создание router instance**.

---

## 11. Что изменится в catalog app

Было (Module 2–4):

```text
один экран
list + modal details
```

Станет (Module 5):

```text
/catalog              → список
/products/:id         → detail page
/about                → статичная page
```

Modal можно оставить как доп. UX, но detail page через URL — важнее для router skills.

---

## 12. Критерии Module 5 (на горизонте)

Из `README.md` тебе нужно будет:

- минимум 3 pages
- dynamic routes
- lazy loading
- `useRouter` / `useRoute` в реальном сценарии
- понимание guards

Этот первый урок — фундамент. Дальше идём step by step.

---

## 13. Частые начальные заблуждения

### «Router = просто ссылки»

Нет. Router управляет mapping URL ↔ UI и navigation lifecycle.

### «Все components — pages»

Нет. Pages немного, components много.

### «Modal заменяет detail route»

Иногда удобно, но shareable URL и browser history лучше через route.

### «Можно hardcode `<a href>` везде»

Обычный `<a>` делает full reload, если не обработан carefully.
В Vue SPA для internal navigation используют `RouterLink` / `router.push`.

---

## 14. Что важно понять после этого блока

Проверь себя:

1. Зачем Vue Router в SPA?
2. Чем SPA navigation отличается от full page reload?
3. Что делают `RouterLink` и `RouterView` на высоком уровне?
4. Чем page отличается от ordinary component?
5. Какой history mode обычно брать для Vite app?
6. Как catalog app может использовать routing?

---

## 15. Что почитать

### Официальное

- [Getting Started · Vue Router](https://router.vuejs.org/guide/)
- [Introduction · Vue Router](https://router.vuejs.org/introduction.html)
- [History Modes](https://router.vuejs.org/guide/essentials/history-mode.html)

### Связанные материалы этого плана

- [Module 4 · types in store & router](../module-4/07-types-in-store-and-router.md)
- [Module 3 · container / presentational](../module-3/07-container-presentational.md)

---

## 16. Видео для этого блока

Сначала официальный гайд Router. Видео — поддержка, не замена практики.

### Рекомендуется

1. **Eduardo San Martin Morote — From terrible to terrific frontend routers (dotJS 2025)**  
   [YouTube](https://www.youtube.com/watch?v=E18HxqAvP7o)  
   Автор Vue Router / Pinia: зачем роутер в SPA, эволюция подходов, навигация как UX. Хороший «почему», не только API.

2. **Eduardo — State, Routing, and the Future of Vue**  
   [YouTube](https://www.youtube.com/watch?v=ng7JSla1Vaw)  
   Связка routing + state в экосистеме Vue — полезный контекст перед Pinia (Module 6).

### Дополнительно (RU)

3. **Ulbi TV · Vue 3 курс — блок про Vue Router**  
   [YouTube · старт курса](https://www.youtube.com/watch?v=XzLuMtDelGk)  
   Найди в таймкодах / оглавлении раздел Router; достаточно одного прохода + свой catalog routes.

### Короткий маршрут

| Время | Что |
|------|-----|
| ~30–40 мин | talk Eduardo (dotJS) |
| + docs | [Getting Started · Vue Router](https://router.vuejs.org/guide/) |
| практика | мини-задание ниже → `RouterLink` / `RouterView` в проекте |

---

## 17. Практическое мини-задание

На бумаге / в заметках спроектируй Module 5 routes для своего проекта:

```text
/                → ?
/catalog         → ?
/products/:id    → ?
/about           → ?
```

Для каждой page напиши:

1. URL
2. page component name
3. какие data нужны
4. какие child components переиспользуются

---

## 18. Мини-конспект

- Vue Router связывает URL и page components в SPA
- без full reload между экранами
- `routes` + `history` + `RouterView`/`RouterLink` = основа
- pages ≠ reusable UI components
- catalog list/detail — идеальный первый router scenario
- Module 5 дальше углубит setup, links, params, guards, lazy loading

---

## 19. Что делать дальше

Следующий теоретический блок Module 5:

- [создание router instance](./02-creating-router-instance.md)
