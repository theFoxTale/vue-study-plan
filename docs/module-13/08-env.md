# Module 13 · Теория: работа с `env`

Этот материал закрывает восьмой теоретический пункт Module 13: **environment variables** в Vite/Vue — `import.meta.env`, префикс `VITE_`, typed env, секреты, режимы `development` / `production`, и куда класть конфиг в слоях catalog app.

Связанные материалы:

- [Module 13 · слой API](./05-api-layer.md)
- [Module 13 · структура папок](./01-folder-structure.md)

---

## 1. Зачем env в архитектуре

```text
Один код → разные окружения:
  local API    http://localhost:3001
  staging API  https://api.staging.example
  production   https://api.example.com
```

Без env:

```ts
const API = 'http://localhost:3001' // ❌ закоммитили и забыли
```

С env:

```ts
const API = import.meta.env.VITE_API_BASE_URL
```

**Архитектурно:** значения окружения читаются в **`shared/config`**, а не размазаны по pages/features.

Официально:

- [Vite · Env Variables and Modes](https://vitejs.dev/guide/env-and-mode.html)

---

## 2. Файлы env в Vite

```text
.env                 # все режимы, defaults
.env.local           # local overrides (gitignored)
.env.development     # npm run dev
.env.production      # npm run build
.env.staging         # optional custom mode
```

```bash
# .env.development
VITE_API_BASE_URL=http://localhost:3001
VITE_APP_TITLE=Catalog (dev)

# .env.production
VITE_API_BASE_URL=https://api.example.com
VITE_APP_TITLE=Product Catalog
```

```gitignore
.env.local
.env.*.local
```

```text
✅ .env.example в git (ключи без секретов)
❌ .env.local / production secrets в git
```

---

## 3. Префикс `VITE_` — обязательно

```ts
import.meta.env.VITE_API_BASE_URL  // ✅ попадёт в client bundle
import.meta.env.API_SECRET         // ❌ undefined на клиенте
```

Vite **намеренно** отдаёт в браузер только `VITE_*`.

```text
Всё, что с VITE_ — видно пользователю (DevTools, bundle).
Не клади туда: private API keys, DB passwords, JWT signing secrets.
```

Секреты — только на **server** (backend, Nuxt server routes, CI secrets). Frontend catalog: public base URL, feature flags, public analytics id — ок.

---

## 4. Встроенные флаги Vite

```ts
import.meta.env.MODE         // 'development' | 'production' | custom
import.meta.env.DEV          // boolean
import.meta.env.PROD         // boolean
import.meta.env.BASE_URL     // router base
import.meta.env.SSR          // boolean
```

```ts
if (import.meta.env.DEV) {
  console.count('ProductCard') // Module 12 debug
}
```

```vue
<VueQueryDevtools v-if="import.meta.env.DEV" />
```

---

## 5. Слой `shared/config` — единая точка

```ts
// shared/config/env.ts
function required(name: keyof ImportMetaEnv): string {
  const value = import.meta.env[name]
  if (!value) {
    throw new Error(`Missing env: ${name}`)
  }
  return value
}

export const env = {
  apiBaseUrl: required('VITE_API_BASE_URL'),
  appTitle: import.meta.env.VITE_APP_TITLE ?? 'Product Catalog',
  enableMockApi: import.meta.env.VITE_ENABLE_MOCK_API === 'true',
} as const
```

```ts
// shared/api/http.ts
import { env } from '@/shared/config/env'

fetch(`${env.apiBaseUrl}${path}`, …)
```

```text
✅ features/pages импортируют env из shared/config
❌ import.meta.env.VITE_* в 30 компонентах
```

Fail-fast при старте, если обязательный ключ пуст — лучше, чем cryptic network errors.

---

## 6. TypeScript: `ImportMetaEnv`

```ts
// env.d.ts (или src/vite-env.d.ts)
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_APP_TITLE?: string
  readonly VITE_ENABLE_MOCK_API?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

После добавления ключа — обнови `.env.example` + `ImportMetaEnv`.

---

## 7. Modes и scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "build:staging": "vite build --mode staging",
    "preview": "vite preview"
  }
}
```

```bash
# .env.staging
VITE_API_BASE_URL=https://api.staging.example.com
```

```text
vite build --mode staging
  → грузит .env + .env.staging
  → MODE === 'staging'
```

CI: передавай env через pipeline secrets → файлы или `VITE_*` в environment job.

---

## 8. Что можно / нельзя в client env

| Можно (`VITE_`) | Нельзя |
|-----------------|--------|
| API **public** base URL | DB password |
| Public CDN URL | Private Stripe secret |
| Feature flag `VITE_FF_CHECKOUT=true` | JWT signing key |
| Sentry **DSN** (public by design) | OAuth client **secret** |
| App title | SSH keys |

```text
«У нас API key в VITE_» —
если ключ даёт полный доступ к биллингу → нужен backend proxy
если ключ ограничен domain + read-only public → иногда ok
```

Catalog MVP: обычно достаточно `VITE_API_BASE_URL`.

---

## 9. Runtime config vs build-time

Vite подставляет env **на этапе build/dev**:

```text
Собрали production с URL A → в bundle зашит A
Сменить URL без rebuild → нельзя (чистый static SPA)
```

Если нужен runtime config (один артефакт → много стендов):

```text
public/config.json  → fetch при старте app
или
window.__ENV__ inject от nginx
```

Pet-project / типичный Vite SPA: **build-time env** достаточно.

Nuxt — другой runtime config model (Module 14).

---

## 10. Связь с API layer и app bootstrap

```text
app/main.ts
  → import './styles'
  → validate env early (import shared/config/env)
  → createApp + plugins

shared/config/env.ts
  → apiBaseUrl

shared/api/http.ts
  → uses env.apiBaseUrl

entities/*/api
  → uses http only (не читают env сами)
```

```text
entities не знают про VITE_* —
меньше связности, проще тесты (mock http)
```

---

## 11. Тесты и env

```ts
// vitest.setup.ts
vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:0')
```

Или в `vitest.config.ts`:

```ts
test: {
  env: {
    VITE_API_BASE_URL: 'http://test.local',
  },
}
```

Не полагайся на `.env.local` разработчика в CI — явные test env.

---

## 12. `.env.example` — контракт команды

```bash
# .env.example
VITE_API_BASE_URL=http://localhost:3001
VITE_APP_TITLE=Product Catalog
# VITE_ENABLE_MOCK_API=false
```

README:

```markdown
cp .env.example .env.development.local
```

Новый разработчик не гадает ключи.

---

## 13. Частые ошибки

### Секрет в `VITE_`

Попал в GitHub Pages bundle — считай скомпрометированным.

### Разный URL в 10 файлах

Забыли один — staging бьёт в prod API.

### `process.env` в Vite client

В браузерном коде Vite — **`import.meta.env`**, не `process.env` (кроме специальных плагинов).

### Закоммитили `.env.local` с токенами

Проверь `.gitignore` сразу.

### Optional key без default

`undefined` + string concat → `http://undefined/products`.

### Путать `DEV` и `MODE === 'development'`

Custom mode может быть не development, но `DEV` false на build.

---

## 14. Что важно понять после этого блока

Проверь себя:

1. Почему только `VITE_*` на клиенте?
2. Что нельзя класть в env frontend?
3. Зачем `shared/config/env.ts`?
4. Чем `.env.local` отличается от `.env.example`?
5. Build-time vs runtime config?
6. Как задать env в Vitest/CI?

---

## 15. Что почитать

### Официальное

- [Vite · Env Variables and Modes](https://vitejs.dev/guide/env-and-mode.html)
- [Vite · Env files priority](https://vitejs.dev/guide/env-and-mode.html#env-files)

### Связанные материалы этого плана

- [Module 13 · API layer](./05-api-layer.md)
- [Module 13 · naming](./04-naming.md)

---

## 16. Практическое мини-задание

1. Создай `.env.example` + `.env.development` с `VITE_API_BASE_URL`.
2. `shared/config/env.ts` + `required()` для API URL.
3. Убери хардкод URL из api/http.
4. Добавь `ImportMetaEnv` в `vite-env.d.ts`.
5. Убедись: `.env.local` в `.gitignore`; secrets не в `VITE_`.

---

## 17. Мини-конспект

- Vite client env = **`import.meta.env.VITE_*`**
- всё `VITE_` **публично** в bundle
- читай env через **`shared/config`**, не из UI
- `.env.example` в git; secrets — нет
- build-time подстановка; typed `ImportMetaEnv`
- дальше — **принципы масштабируемости**

---

## 18. Что делать дальше

Следующий теоретический блок Module 13:

- [Базовые принципы масштабируемости](./09-scalability.md)
