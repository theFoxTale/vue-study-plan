# Module 14 · Теория: server routes

Этот материал закрывает восьмой теоретический пункт Module 14: **server routes (Nitro)** — `server/api`, `server/routes`, HTTP handlers, BFF-паттерн, секреты, типы, связь с `useFetch`, и чем server layer не заменяет полноценный backend.

Связанные материалы:

- [Module 14 · useFetch](./06-use-fetch.md)
- [Module 14 · зачем Nuxt](./02-why-nuxt.md)
- [Module 13 · API layer](../module-13/05-api-layer.md)

---

## 1. Зачем server routes в Nuxt-проекте

```text
Browser  →  useFetch('/api/products')  →  server/api/products.get.ts  →  DB / upstream API
```

| Задача | Зачем server |
|--------|----------------|
| Скрыть API keys | ключ только на server |
| BFF | собрать/обрезать DTO под UI |
| Нет CORS боли в dev | same-origin `/api` |
| Webhooks | POST от Stripe/GitHub |
| SSR data | server рядом с render |
| Простой backend для MVP | один деплой |

Движок — **Nitro** (часть Nuxt 3).

Официально:

- [Nuxt · server/](https://nuxt.com/docs/guide/directory-structure/server)
- [Nitro · Server Routes](https://nitro.build/guide/routing)

---

## 2. `server/api` vs `server/routes`

```text
server/api/products.get.ts     →  GET /api/products
server/api/products/[id].get.ts →  GET /api/products/:id
server/api/cart.post.ts        →  POST /api/cart

server/routes/sitemap.xml.ts   →  GET /sitemap.xml  (без /api префикса)
server/routes/health.ts        →  GET /health
```

```text
api/     — JSON API для приложения (обычно)
routes/  — произвольные пути (rss, sitemap, webhooks path)
```

Имя файла задаёт **path + method**:

| Файл | Method + path |
|------|----------------|
| `products.get.ts` | `GET /api/products` |
| `products.post.ts` | `POST /api/products` |
| `products/[id].put.ts` | `PUT /api/products/:id` |
| `hello.ts` | все методы `/api/hello` (или default) |

Точные conventions — [Nitro routing](https://nitro.build/guide/routing); при сомнении смотри Nuxt DevTools → Server Routes.

---

## 3. Минимальный handler

```ts
// server/api/products.get.ts
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const category = query.category as string | undefined

  const products = await listProducts({ category })
  return products
})
```

```ts
// server/api/products/[id].get.ts
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const product = await findProduct(id!)

  if (!product) {
    throw createError({ statusCode: 404, statusMessage: 'Product not found' })
  }

  return product
})
```

```ts
// server/api/cart.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  // validate body (zod)
  return addToCart(body)
})
```

Частые helpers: `getQuery`, `getRouterParam`, `readBody`, `setCookie`, `getCookie`, `getHeader`, `createError`.

---

## 4. Связь с `useFetch`

```ts
// pages/products/index.vue
const { data } = await useFetch('/api/products', {
  query: { category: 'phones' },
})
```

```text
Same origin → Nitro handler
SSR: server вызывает /api (часто эффективно / напрямую)
Client: browser → /api
```

Не обязательно публиковать upstream URL в браузер — page знает только `/api/...`.

---

## 5. Runtime config и секреты

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    // только server
    apiSecret: '',
    databaseUrl: '',
    public: {
      // доступно и на client
      appName: 'Product Catalog',
      apiBase: '/api',
    },
  },
})
```

```bash
# .env
NUXT_API_SECRET=super-secret
NUXT_PUBLIC_APP_NAME=Catalog
```

```ts
// server/api/… 
const config = useRuntimeConfig()
// config.apiSecret — ok на server
```

```text
❌ VITE_/public secret
✅ NUXT_ private keys → runtimeConfig (non-public)
```

Аналог идей Module 13 env, но в Nuxt — **`runtimeConfig`** (+ override через env).

---

## 6. Организация кода server/

```text
server/
  api/
    products.get.ts
    products/
      [id].get.ts
    auth/
      login.post.ts
  utils/
    db.ts
    products.ts      # listProducts, findProduct
  middleware/
    auth.ts          # server middleware
```

```ts
// server/utils/products.ts — auto-import in server context (Nuxt convention)
export async function listProducts(filters: { category?: string }) {
  // prisma / fetch upstream / mock
}
```

```text
Не клади UI Vue components в server/
Не импортируй server/utils в client components напрямую
```

Shared types: `shared/types` или `#shared` — чтобы Product type видели оба мира без тяги server code в client bundle.

---

## 7. Validation на границе

```ts
import { z } from 'zod'

const Body = z.object({
  productId: z.string(),
  qty: z.number().int().positive(),
})

export default defineEventHandler(async (event) => {
  const parsed = Body.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid body' })
  }
  return addToCart(parsed.data)
})
```

Тот же принцип Module 9/13: **не доверяй input**.

---

## 8. Server middleware

```ts
// server/middleware/log.ts
export default defineEventHandler((event) => {
  console.log(event.path)
})
```

```ts
// server/middleware/auth.ts — защита /api/admin/**
export default defineEventHandler((event) => {
  if (!event.path.startsWith('/api/admin')) return
  const token = getHeader(event, 'authorization')
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
})
```

Не путать с **route middleware** Vue (`middleware/auth.ts` в корне) — то client/SSR navigation; это **HTTP server** middleware.

---

## 9. BFF-паттерн для storefront

```text
Upstream commerce API (сложный, много полей)
        ↑
server/api/products.get.ts  — trim, rename, cache
        ↑
useFetch('/api/products')   — UI получает Product DTO
```

Плюсы:

- меньше данных в payload
- стабильный контракт UI при смене upstream
- секреты/rate limit на server

Минусы:

- ещё один слой; дублирование моделей, если неаккуратно

Для MVP catalog — mock в `server/utils` часто достаточно без внешнего API.

---

## 10. Что server routes **не** заменяют

| Нужно | Решение |
|-------|---------|
| Сложная доменная логика / много сервисов | отдельный backend |
| Долгие background jobs | queue/worker |
| Тонны SQL/admin | часто отдельный service |
| Mobile apps + web | общий API service |

```text
Nuxt server = отличный BFF + лёгкий backend.
Не обязан быть единственной системой компании.
```

---

## 11. Cookies / session (идея)

```ts
setCookie(event, 'session', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  path: '/',
})
```

```ts
const session = getCookie(event, 'session')
```

Auth MVP: httpOnly cookie + server `/api/me` — безопаснее, чем JWT в `localStorage` (XSS). Детали auth — отдельная большая тема; здесь только точка расширения.

---

## 12. Catalog: минимальный набор routes

```text
GET  /api/products
GET  /api/products/:id
POST /api/cart          (optional MVP)
POST /api/auth/login    (optional)
GET  /sitemap.xml       (SEO later)
```

Pages:

```ts
useFetch('/api/products')
useFetch(() => `/api/products/${id}`)
```

---

## 13. Отладка

```text
Nuxt DevTools → Server
curl http://localhost:3000/api/products
логи в терминале Nitro
```

Ошибка handler → JSON error / status code; page ловит через `error` у `useFetch`.

---

## 14. Частые ошибки

### Секрет в `public` runtimeConfig

Утечка в bundle/HTML.

### Импорт `fs` / DB клиента в Vue component

Server-only код должен жить в `server/`.

### Путать route middleware и server middleware

Разные слои, разные файлы.

### Открытый CORS на всё + секрет в browser

BFF теряет смысл.

### God `server/api/index.ts`

Дроби по ресурсам как entity api.

### Возвращать огромный upstream JSON as-is

Payload SSR раздувается — `pick` / map DTO.

---

## 15. Что важно понять после этого блока

Проверь себя:

1. Чем `server/api` отличается от `server/routes`?
2. Как файл превращается в `GET /api/products/:id`?
3. Почему `useFetch('/api/…')` удобен с Nitro?
4. Где хранить API secret в Nuxt?
5. Зачем BFF для storefront?
6. Чем server middleware ≠ `middleware/auth.ts`?

---

## 16. Что почитать

### Официальное

- [server directory](https://nuxt.com/docs/guide/directory-structure/server)
- [Nitro routing](https://nitro.build/guide/routing)
- [runtimeConfig](https://nuxt.com/docs/guide/going-further/runtime-config)
- [createError](https://nuxt.com/docs/api/utils/create-error)

### Связанные материалы этого плана

- [Module 14 · useFetch](./06-use-fetch.md)
- [Module 13 · env](../module-13/08-env.md)
- [Module 13 · API layer](../module-13/05-api-layer.md)

---

## 17. Практическое мини-задание

1. `server/api/products.get.ts` + mock list.
2. `products/[id].get.ts` + 404 через `createError`.
3. Page: `useFetch('/api/products')` — View Source с данными (SSR).
4. `runtimeConfig` secret — используй только в server handler.
5. Optional: `POST /api/cart` + zod body validation.

---

## 18. Мини-конспект

- Nitro **`server/api`** = same-origin backend рядом с UI
- filename = method + path; helpers `readBody` / `getQuery` / `createError`
- секреты в **private** `runtimeConfig`
- BFF: trim DTO, hide upstream
- не путать с Vue route middleware; не тащить server в client
- дальше — **SEO basics**

---

## 19. Что делать дальше

Следующий теоретический блок Module 14:

- [SEO basics](./09-seo-basics.md)
