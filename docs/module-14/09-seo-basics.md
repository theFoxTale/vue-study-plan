# Module 14 · Теория: SEO basics

Этот материал закрывает девятый теоретический пункт Module 14: **SEO basics в Nuxt** — зачем SSR/SSG для поисковиков, `useHead` / `useSeoMeta`, title template, Open Graph, canonical, sitemap/robots, и минимальный чеклист storefront — без мифа «включили SSR = SEO готов».

Связанные материалы:

- [Module 14 · CSR/SSR/SSG](./01-csr-ssr-ssg-hybrid.md)
- [Module 14 · pages](./05-pages.md)
- [Module 12 · page load](../module-12/09-page-load-optimization.md)

---

## 1. SEO ≠ только meta tags

```text
Поисковик / соцсеть хочет:
  1. HTML с осмысленным контентом (title, text, links)
  2. Стабильный URL
  3. Нормальная скорость и mobile UX
  4. Корректные meta / OG для превью
```

| Без SSR/SSG (чистый CSR) | С SSR/SSG |
|--------------------------|-----------|
| View Source ≈ пустой `#app` | title, H1, product text в HTML |
| боты могут «увидеть» после JS (хуже/нестабильно) | контент сразу в ответе |

```text
SSR даёт техническую возможность SEO.
Контент, структура, скорость — всё ещё на тебе.
```

Официально:

- [Nuxt · SEO and Meta](https://nuxt.com/docs/getting-started/seo-meta)
- [useSeoMeta](https://nuxt.com/docs/api/composables/use-seo-meta)
- [useHead](https://nuxt.com/docs/api/composables/use-head)

---

## 2. Title и description на page

```ts
// pages/products/[id].vue
const { data: product } = await useFetch(() => `/api/products/${id}`)

useSeoMeta({
  title: () => product.value?.title ?? 'Product',
  description: () =>
    product.value?.description?.slice(0, 160) ?? 'Product details',
})
```

```ts
useHead({
  title: 'Cart',
  meta: [
    { name: 'description', content: 'Your shopping cart' },
  ],
})
```

```text
useSeoMeta — удобные поля (title, og*, twitter*)
useHead     — полный контроль head (link, script, raw meta)
```

Реактивные getter'ы `() => …` обновляют head при появлении `product`.

---

## 3. Title template

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  app: {
    head: {
      titleTemplate: '%s · Product Catalog',
      htmlAttrs: { lang: 'en' }, // или 'ru'
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
    },
  },
})
```

```text
Page title: "Wireless Keyboard"
→ вкладка: "Wireless Keyboard · Product Catalog"
```

`htmlAttrs.lang` — базовый a11y/SEO сигнал языка.

---

## 4. Open Graph и Twitter cards

Чтобы ссылка в мессенджере/соцсети показала превью:

```ts
useSeoMeta({
  title: () => product.value?.title,
  description: () => product.value?.description?.slice(0, 160),
  ogTitle: () => product.value?.title,
  ogDescription: () => product.value?.description?.slice(0, 160),
  ogImage: () => product.value?.imageUrl,
  ogType: 'website',
  twitterCard: 'summary_large_image',
})
```

```text
og:image — абсолютный URL предпочтителен
(относительный часто ломает превью)
```

```ts
const requestUrl = useRequestURL()
const canonical = computed(
  () => `${requestUrl.origin}/products/${id.value}`,
)

useHead({
  link: [{ rel: 'canonical', href: canonical }],
})
```

Проверка: [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/), аналог для других платформ — после деплоя.

---

## 5. Canonical и дубли

Проблема catalog:

```text
/products/42
/products/42?ref=ads
/products/42?color=black
```

Один товар — много URL → **canonical** на основной.

```ts
useHead({
  link: [{ rel: 'canonical', href: `https://example.com/products/${id}` }],
})
```

Фильтры catalog: решай, индексировать ли `/products?category=phones` или canonical на `/products`.

---

## 6. Индексация: robots

```ts
// страница thank-you / account — не для поиска
useSeoMeta({
  robots: 'noindex, nofollow',
})
```

```ts
// nuxt.config defaults — осторожно
```

Файл `public/robots.txt` или server route:

```text
User-agent: *
Allow: /
Disallow: /account
Disallow: /cart
Sitemap: https://example.com/sitemap.xml
```

```text
cart, checkout, login, account → обычно noindex
product, blog, landing → index
```

---

## 7. Sitemap

Список публичных URL для краулера.

Варианты:

- модуль `@nuxtjs/sitemap` / `nuxt-simple-sitemap`
- `server/routes/sitemap.xml.ts` — generate XML из списка products

```text
MVP: sitemap с /, /products, /products/:id (топ N)
Не обещай 100k URL без стратегии
```

После деплоя укажи sitemap в robots и Search Console (когда будет прод-домен).

---

## 8. Контент и HTML-структура

Meta без контента не спасает:

```vue
<template>
  <article>
    <h1>{{ product.title }}</h1>
    <p>{{ product.description }}</p>
    <img :src="product.imageUrl" :alt="product.title" width="640" height="640">
  </article>
</template>
```

| Практика | Зачем |
|----------|--------|
| Один ясный **H1** | тема страницы |
| Реальный текст в SSR HTML | краулер читает |
| `alt` у изображений | a11y + контекст |
| Внутренние ссылки `NuxtLink` | discoverability |
| Не прятать весь текст только в canvas/JS | |

Module 12: размеры картинок → меньше CLS, лучше UX-сигналы.

---

## 9. Rendering mode и SEO

| Режим | SEO |
|-------|-----|
| SSR | ✅ свежий HTML на request |
| SSG / prerender | ✅ отличный HTML; следи за устареванием |
| `ssr: false` | ❌ как CSR для этой page — не для публичного product |
| Hybrid | публичные routes SSR/SSG; `/account` CSR ok |

```ts
definePageMeta({ ssr: false }) // не на /products/[id]
```

---

## 10. JSON-LD (structured data) — optional stretch

```ts
useHead({
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.value?.title,
        image: product.value?.imageUrl,
        offers: {
          '@type': 'Offer',
          price: product.value?.price,
          priceCurrency: 'USD',
        },
      }),
    },
  ],
})
```

Помогает rich results; не замена нормального HTML. Валидируй через Google Rich Results Test.

---

## 11. Storefront SEO checklist (MVP)

### На каждой публичной page

- [ ] уникальный `title` + `description`
- [ ] `titleTemplate` в config
- [ ] `lang` на `<html>`
- [ ] контент в SSR HTML (View Source)

### Product detail

- [ ] H1 = название товара
- [ ] `og:title` / `og:image` (absolute)
- [ ] canonical
- [ ] 404 для missing id (`createError`)

### Не индексировать

- [ ] `/cart`, `/checkout`, `/account/**`, `/login` → `noindex` или Disallow

### Техника

- [ ] `robots.txt` + sitemap (хотя бы простой)
- [ ] public products **не** `ssr: false`
- [ ] LCP/image basics (Module 12)

---

## 12. Что SEO **не** требует от pet-project

```text
Не обязательно на Module 14 practice:
  - биржа ссылок / guest posts
  - 100% Lighthouse SEO score как религия
  - полный Schema на каждый тип страницы
  - мультиязычный hreflang (пока нет i18n)
```

Достаточно: **видимый HTML + meta + noindex приватных зон + sitemap идея**.

---

## 13. Частые ошибки

### Один title на весь сайт

«Welcome» на 50 URL.

### CSR product page + красивые meta в JS only

Часть ботов/превью не исполнят JS так, как ты ждёшь.

### `og:image` относительный путь

Превью пустое.

### Индексация корзины и thank-you

Мусор в выдаче.

### Keyword stuffing в title

Плохо для людей и часто для ранжирования.

### Забыть 404

Soft-200 «Product not found» в HTML 200 — плохой сигнал.

---

## 14. Что важно понять после этого блока

Проверь себя:

1. Почему SSR/SSG помогают SEO сильнее CSR?
2. `useSeoMeta` vs `useHead`?
3. Зачем canonical в catalog?
4. Какие URL storefront обычно `noindex`?
5. Почему `ssr: false` на product — плохо для SEO?
6. Минимум для OG-превью?

---

## 15. Что почитать

### Официальное

- [SEO and Meta](https://nuxt.com/docs/getting-started/seo-meta)
- [useSeoMeta](https://nuxt.com/docs/api/composables/use-seo-meta)
- [useHead](https://nuxt.com/docs/api/composables/use-head)

### Связанные материалы этого плана

- [Module 14 · rendering modes](./01-csr-ssr-ssg-hybrid.md)
- [Module 14 · pages](./05-pages.md)
- [Module 9 · a11y basics](../module-3/09-accessibility-basics.md) *(lang, alt)*

---

## 16. Практическое мини-задание

1. Product page: `useSeoMeta` title/description/ogImage из data.
2. View Source — title и H1 на месте?
3. `robots: noindex` на `/cart` и `/login`.
4. Canonical на product detail.
5. Optional: простой `sitemap.xml` route или модуль.

---

## 17. Мини-конспект

- SEO = **HTML-контент** + meta + URL hygiene + скорость
- `useSeoMeta` / `useHead` на **каждой** публичной page
- OG + canonical; noindex для private flows
- SSR/SSG для витрины; не `ssr: false` на product
- sitemap/robots — базовый must для прод-сайта
- дальше — **deployment basics**

---

## 18. Что делать дальше

Следующий теоретический блок Module 14:

- [Deployment basics](./10-deployment.md)
