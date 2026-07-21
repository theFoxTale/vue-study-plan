# Module 5 · Теория: RouterLink

Этот материал закрывает третий теоретический пункт `Module 5`: понять, **зачем `RouterLink`**, **чем он лучше обычного `<a>`**, **как писать `to`**, и **как стилизовать active-состояние**.

Связанные материалы:

- [Module 5 · Vue Router 4](./01-vue-router-4.md)
- [Module 5 · создание router instance](./02-creating-router-instance.md)
- [Module 3 · accessibility basics](../module-3/09-accessibility-basics.md)

---

## 1. Что такое `RouterLink`

`RouterLink` — declarative navigation component Vue Router.

Он рендерит ссылку, которая:

- меняет URL через router
- **не делает full page reload**
- умеет подсвечивать active route
- принимает тот же location object, что и `router.push`

```vue
<RouterLink to="/catalog">Catalog</RouterLink>
```

Официально:

- [Named Routes / Navigation · Vue Router](https://router.vuejs.org/guide/essentials/named-routes.html)
- [RouterLink API](https://router.vuejs.org/api/interfaces/RouterLinkProps.html)

---

## 2. Почему не обычный `<a href>`

```vue
<!-- ❌ для внутренних SPA-страниц -->
<a href="/catalog">Catalog</a>

<!-- ✅ -->
<RouterLink to="/catalog">Catalog</RouterLink>
```

| | `<a href>` | `RouterLink` |
|---|------------|--------------|
| Reload | обычно полный | нет |
| Active class | сам | да |
| Named routes / params | руками | да |
| History через router | нет | да |

`<a href="https://...">` для **внешних** ссылок — нормально.
Для внутренних pages приложения — `RouterLink`.

---

## 3. Базовый `to`

### Строка path

```vue
<RouterLink to="/">Home</RouterLink>
<RouterLink to="/catalog">Catalog</RouterLink>
<RouterLink to="/about">About</RouterLink>
```

### Object location

```vue
<RouterLink :to="{ path: '/catalog' }">Catalog</RouterLink>
```

### Named route

```vue
<RouterLink :to="{ name: 'catalog' }">Catalog</RouterLink>
```

Named route предпочтительнее, если path может меняться:

```ts
// router
{ path: '/catalog', name: 'catalog', component: CatalogPage }
```

```vue
<!-- path сменился — ссылки по name продолжают работать -->
<RouterLink :to="{ name: 'catalog' }">Catalog</RouterLink>
```

---

## 4. `to` с params и query

### Dynamic params

```vue
<RouterLink
  :to="{ name: 'product-details', params: { id: product.id } }"
>
  {{ product.title }}
</RouterLink>
```

При route:

```ts
{ path: '/products/:id', name: 'product-details', component: ProductDetailsPage }
```

получится URL вида `/products/42`.

Важно:

```vue
<!-- ❌ params игнорируются, если указан path -->
<RouterLink
  :to="{ path: '/products', params: { id: 42 } }"
/>

<!-- ✅ -->
<RouterLink
  :to="{ name: 'product-details', params: { id: 42 } }"
/>

<!-- ✅ или полный path -->
<RouterLink :to="`/products/${product.id}`" />
```

### Query

```vue
<RouterLink
  :to="{ name: 'catalog', query: { category: 'phones', page: 2 } }"
>
  Phones
</RouterLink>
```

URL:

```text
/catalog?category=phones&page=2
```

### Hash

```vue
<RouterLink :to="{ path: '/about', hash: '#team' }">
  Team
</RouterLink>
```

---

## 5. Active classes

По умолчанию Vue Router добавляет:

- `router-link-active` — route совпадает частично/активен
- `router-link-exact-active` — точное совпадение

Пример:

```text
текущий URL: /products/42

RouterLink to="/products/42"  → active + exact-active
RouterLink to="/"             → может быть active (если "/" считается предком)
```

Стили:

```css
.router-link-active {
  color: #0b5fff;
}

.router-link-exact-active {
  font-weight: 700;
}
```

Кастомные class names:

```vue
<RouterLink
  to="/catalog"
  active-class="nav__link--active"
  exact-active-class="nav__link--exact"
>
  Catalog
</RouterLink>
```

Или глобально в `createRouter`:

```ts
createRouter({
  history: createWebHistory(),
  routes,
  linkActiveClass: 'nav__link--active',
  linkExactActiveClass: 'nav__link--exact',
})
```

---

## 6. `replace`

Обычный click = `router.push` (новая history entry).

```vue
<RouterLink to="/login" replace>
  Login
</RouterLink>
```

Это `router.replace`: текущая запись history заменяется.
Полезно для redirect-like UI (login → home), где «назад» не должен возвращать на промежуточный экран.

---

## 7. Accessibility

`RouterLink` рендерит настоящий `<a href="...">`, поэтому:

- работает keyboard navigation
- можно открыть в новой вкладке
- screen readers понимают ссылку

Для nav:

```vue
<nav aria-label="Main">
  <RouterLink to="/">Home</RouterLink>
  <RouterLink to="/catalog">Catalog</RouterLink>
  <RouterLink to="/about">About</RouterLink>
</nav>
```

`aria-current="page"` ставится на exact-active link по умолчанию.

---

## 8. Nav для catalog app

```vue
<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <header class="app__header">
    <strong>Product Catalog</strong>

    <nav aria-label="Main" class="nav">
      <RouterLink class="nav__link" :to="{ name: 'home' }">
        Home
      </RouterLink>
      <RouterLink class="nav__link" :to="{ name: 'catalog' }">
        Catalog
      </RouterLink>
      <RouterLink class="nav__link" :to="{ name: 'about' }">
        About
      </RouterLink>
    </nav>
  </header>
</template>

<style scoped>
.nav {
  display: flex;
  gap: 1rem;
}

.nav__link {
  text-decoration: none;
  color: inherit;
}

.nav__link.router-link-exact-active {
  font-weight: 700;
  text-decoration: underline;
}
</style>
```

---

## 9. Ссылки внутри списка товаров

```vue
<script setup lang="ts">
import type { Product } from '@/types/product'

defineProps<{
  products: Product[]
}>()
</script>

<template>
  <ul>
    <li v-for="product in products" :key="product.id">
      <RouterLink
        :to="{ name: 'product-details', params: { id: product.id } }"
      >
        {{ product.title }}
      </RouterLink>
    </li>
  </ul>
</template>
```

Так detail page получает shareable URL.

---

## 10. `custom` + `v-slot` (кратко)

Иногда нужен не `<a>`, а `<button>` / custom markup:

```vue
<RouterLink
  v-slot="{ href, navigate, isActive }"
  :to="{ name: 'catalog' }"
  custom
>
  <button
    type="button"
    :class="{ 'is-active': isActive }"
    @click="navigate"
  >
    Catalog ({{ href }})
  </button>
</RouterLink>
```

Для Module 5 practice обычного `RouterLink` достаточно.
`custom` пригодится, когда design system требует button-like nav.

---

## 11. `RouterLink` vs `useRouter().push`

| Когда | Что брать |
|-------|-----------|
| Кликабельная ссылка в UI | `RouterLink` |
| После submit / async success | `router.push` |
| Условная логика navigation | `router.push` / `replace` |

Правило:

```text
если это ссылка — RouterLink
если это действие в коде — useRouter()
```

`useRouter` будет отдельным уроком.

---

## 12. Частые ошибки

### Внутренние pages через `<a href>`

Полный reload, теряется SPA-поведение.

### `params` вместе с `path`

Params игнорируются — используй `name` или полный path string.

### Hardcoded path везде

Лучше `name`, особенно для dynamic routes.

### Путать active и exact-active

Для top-level nav часто удобнее стилизовать `exact-active`.

### Делать button без `RouterLink`/`navigate`

Теряешь «open in new tab», правильный `href`, a11y ссылки.

---

## 13. Что важно понять после этого блока

Проверь себя:

1. Чем `RouterLink` лучше `<a href>` для SPA?
2. Какие формы `to` бывают?
3. Почему `name` + `params` лучше `path` + `params`?
4. Что дают `router-link-active` и `exact-active`?
5. Когда брать `replace`?
6. Когда `RouterLink`, а когда `router.push`?

---

## 14. Что почитать

### Официальное

- [Programmatic Navigation](https://router.vuejs.org/guide/essentials/navigation.html) *(сравнение с `RouterLink`)*
- [Named Routes](https://router.vuejs.org/guide/essentials/named-routes.html)
- [RouterLinkProps](https://router.vuejs.org/api/interfaces/RouterLinkProps.html)

### Связанные материалы этого плана

- [Module 5 · создание router instance](./02-creating-router-instance.md)
- [Module 3 · accessibility basics](../module-3/09-accessibility-basics.md)

---

## 15. Практическое мини-задание

1. Замени внутренние `<a>` на `RouterLink`
2. Сделай nav: Home / Catalog / About через named routes
3. Добавь стиль для `.router-link-exact-active`
4. В списке товаров сделай ссылку на `product-details` с `params.id`
5. Одну внешнюю ссылку оставь обычным `<a href="https://...">`

---

## 16. Мини-конспект

- `RouterLink` = declarative SPA navigation без reload
- `to` принимает string или location object
- предпочитай `name` (+ `params` / `query`)
- active classes помогают подсветить текущую страницу
- внутренние ссылки — `RouterLink`, внешние — `<a>`
- действия в коде — позже через `useRouter`

---

## 17. Что делать дальше

Следующий теоретический блок Module 5:

- [`RouterView`](./04-router-view.md)
