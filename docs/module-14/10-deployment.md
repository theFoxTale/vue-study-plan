# Module 14 · Теория: deployment basics

Этот материал закрывает десятый теоретический пункт Module 14: **deployment basics для Nuxt 3** — build output, static vs Node vs edge, Nitro presets, env/`runtimeConfig` на проде, preview локально, типовые платформы и чеклист «можно выкатывать».

Связанные материалы:

- [Module 14 · CSR/SSR/SSG](./01-csr-ssr-ssg-hybrid.md)
- [Module 14 · server routes](./08-server-routes.md)
- [Module 13 · env](../module-13/08-env.md)

---

## 1. Что деплоишь на самом деле

```text
npm run build
  → .output/          (Nitro build)
       public/        статика
       server/        Node/edge server entry (если не чистый static)
```

| Режим сайта | Что нужно хостить |
|-------------|-------------------|
| **SSG / prerender only** | static files (CDN) |
| **SSR / hybrid** | Node (или edge) + static assets |
| **SPA (`ssr: false` global)** | static + client router (как Vite SPA) |

```text
Nuxt ≠ всегда «нужен VPS».
Выбери hosting под rendering mode.
```

Официально:

- [Nuxt · Deployment](https://nuxt.com/docs/getting-started/deployment)
- [Nitro · Deploy](https://nitro.build/deploy)

---

## 2. Команды, которые нужны всегда

```bash
npm run dev          # локальная разработка
npm run build        # production build → .output
npm run preview      # локально прогнать .output (как прод)
```

```text
Перед деплоем:
  build без ошибок
  preview → кликни главные URL
  View Source на product (SSR/SSG HTML на месте)
```

`preview` ловит «у меня на dev работало, на prod нет» чаще, чем кажется.

---

## 3. Static generation / prerender

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    prerender: {
      routes: ['/', '/products'],
      crawlLinks: true,
    },
  },
})
```

Или:

```bash
nuxi generate   # legacy-ish / static generate workflow — см. актуальную доки
```

В Nuxt 3 часто: `nuxt build` + prerender routeRules / nitro prerender → static куски в `.output/public`.

```ts
routeRules: {
  '/': { prerender: true },
  '/blog/**': { prerender: true },
  '/products/**': { swr: 60 }, // hybrid
  '/account/**': { ssr: false },
}
```

```text
Prerender: HTML заранее → дешёвый CDN
SWR/ISR-like: кеш на edge/server с revalidate (зависит от preset)
```

---

## 4. Nitro presets — «куда собираем»

Nitro умеет таргетировать платформу:

| Preset (идея) | Куда |
|---------------|------|
| `node-server` | VPS, Docker, обычный Node |
| `static` | только статика |
| `vercel` | Vercel |
| `netlify` | Netlify |
| `cloudflare_pages` / workers | Cloudflare |
| … | см. Nitro deploy docs |

Часто preset **автодетектится** на CI платформы. Явно:

```ts
export default defineNuxtConfig({
  nitro: {
    preset: 'node-server',
  },
})
```

```text
Неправильный preset → build «успешен», runtime 502
```

---

## 5. Env на production

Nuxt:

```bash
NUXT_API_SECRET=…
NUXT_PUBLIC_SITE_URL=https://www.example.com
```

```ts
runtimeConfig: {
  apiSecret: '',
  public: {
    siteUrl: '',
  },
}
```

| Правило | |
|---------|---|
| Secrets | только server / CI secrets store |
| Public site URL | для canonical / og:image absolute |
| Rebuild | public env часто **build-time**; private может быть runtime — проверь docs/platform |

```text
После смены NUXT_PUBLIC_* на многих хостах → нужен rebuild
Не жди, что «поменял env в панели» всегда подхватится без redeploy
```

Локально с прод-подобным env:

```bash
NUXT_PUBLIC_SITE_URL=http://localhost:3000 npm run preview
```

---

## 6. Типичные платформы (обзор)

### Static / CDN (сильный SSG)

- Netlify, Cloudflare Pages, GitHub Pages *(ограничения для SSR)*
- Подходит: blog, docs, marketing, prerender catalog

### Node SSR

- Railway, Render, Fly.io, VPS + Docker, `node .output/server/index.mjs`
- Подходит: hybrid storefront, server/api

### Platform-as-a-service с Nuxt integration

- Vercel / Netlify SSR adapters
- Удобный git push → preview URLs

```text
Pet-project Module 14:
  один деплой static ИЛИ один Node preview —
  важнее пройти pipeline, чем все облака
```

---

## 7. Docker (идея для Node)

```dockerfile
# упрощённо
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/.output ./.output
ENV HOST=0.0.0.0
ENV PORT=3000
CMD ["node", ".output/server/index.mjs"]
```

Проброс `NUXT_*` через orchestration secrets.

---

## 8. Что проверить после деплоя

```text
1. / открывается, HTTPS ok
2. /products/[id] — View Source содержит title/H1
3. /api/products отвечает (если используешь)
4. /cart или account — не утекают secrets в HTML
5. robots.txt / sitemap доступны (если делал)
6. OG image абсолютный URL открывается
7. 404 page для unknown URL
8. env: нет localhost в canonical на проде
```

Lighthouse mobile — optional sanity (Module 12).

---

## 9. CI минимум

```yaml
# идея GitHub Actions
- npm ci
- npm run build
# optional: npm run test:run
# deploy step зависит от хоста
```

```text
Build в CI = тот же build, что локально
Не деплой с ноутбука «как получится» без артефакта
```

Preview deployments (Vercel/Netlify) — удобны для PR review SEO/HTML.

---

## 10. SPA fallback vs SSR hosting

Ошибка: залить только `dist/` от старого Vite mental model, забыв `.output/server`.

```text
SSR app на чистом GitHub Pages без server → сломается
либо prerender/static preset, либо другой хост
```

Наоборот: крутить Node для полностью prerendered blog — можно, но дороже без нужды.

---

## 11. Storefront: рекомендуемые стартовые варианты

| Цель practice | Deploy |
|---------------|--------|
| Docs/blog Nuxt | static/prerender → Pages/Netlify |
| Mini storefront + `/api` | Node preset → Railway/Render/Fly |
| Hybrid | platform с Nitro support + routeRules |

Зафиксируй в README проекта: **почему этот хост** (связь с [уроком 11](./11-nuxt-vs-vue-vite.md)).

---

## 12. Откат и наблюдаемость (кратко)

```text
- сохрани предыдущий successful deploy
- логи Nitro/host (5xx на /api)
- не игнорь hydration warnings в прод-сборке
```

Полноценный APM — вне MVP Module 14.

---

## 13. Частые ошибки

### Деплой без `npm run preview`

«Работает на dev» ≠ production build.

### `localhost` в `siteUrl` / OG на проде

Сломанные превью и canonical.

### Secrets в репозитории

Только CI secrets / host env.

### Неверный preset

Static hosting для SSR entry.

### Забыли `HOST=0.0.0.0` в Docker

Слушает только localhost контейнера.

### Гигантский prerender 50k products в CI

Timeout; нужен SSR/SWR/partition.

---

## 14. Что важно понять после этого блока

Проверь себя:

1. Что лежит в `.output` после build?
2. Когда достаточно static CDN?
3. Зачем `npm run preview`?
4. Как `routeRules` влияют на деплой?
5. Чем `NUXT_` env отличается от привычного Vite `VITE_`?
6. Почему GitHub Pages плох для полноценного SSR API?

---

## 15. Что почитать

### Официальное

- [Nuxt · Deployment](https://nuxt.com/docs/getting-started/deployment)
- [Nitro · Deploy presets](https://nitro.build/deploy)
- [runtimeConfig](https://nuxt.com/docs/guide/going-further/runtime-config)

### Связанные материалы этого плана

- [Module 14 · SEO](./09-seo-basics.md)
- [Module 14 · server routes](./08-server-routes.md)
- [Module 12 · load optimization](../module-12/09-page-load-optimization.md)

---

## 16. Практическое мини-задание

1. `npm run build` + `npm run preview` локально.
2. Выбери target: static **или** node — запиши почему.
3. Выставь `NUXT_PUBLIC_SITE_URL` для preview.
4. Проверь View Source product на preview.
5. Optional: задеплой на Netlify/Vercel/Railway и проверь `/api` + HTTPS.

---

## 17. Мини-конспект

- build → **`.output`**; всегда гоняй **`preview`**
- static vs Node vs edge — по rendering mode
- Nitro **presets** + `routeRules` / prerender
- prod env через **`NUXT_*` / runtimeConfig**
- checklist: HTML, API, secrets, canonical, 404
- дальше — **когда Nuxt, а когда Vue + Vite**

---

## 18. Что делать дальше

Следующий теоретический блок Module 14:

- [Когда Nuxt нужен, а когда Vue + Vite](./11-nuxt-vs-vue-vite.md)
