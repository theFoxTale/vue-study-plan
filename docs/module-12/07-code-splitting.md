# Module 12 · Теория: code splitting

Этот материал закрывает седьмой теоретический пункт Module 12: **code splitting** — разбиение bundle на chunks, `import()`, стратегии для catalog app и как **измерить** начальную загрузку, не гадая.

Связанные материалы:

- [Module 5 · lazy loading routes](../module-5/11-lazy-loading-routes.md)
- [Module 12 · shallowRef](./06-shallow-ref.md)

---

## 1. Проблема: один fat bundle

```text
npm run build
  → dist/assets/index-abc123.js  (800 KB gzip)
  → пользователь на /catalog скачивает код /admin, /checkout, chart.js…
```

**Time to Interactive (TTI)** растёт: parse + compile + execute JS до того, как app usable.

**Code splitting** — доставлять **только нужный код сейчас**, остальное — **on demand** отдельными файлами (chunks).

Официально:

- [Dynamic Import · MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import)
- [Vite · Build · Rollup](https://vitejs.dev/guide/build.html)
- [Vue Router · Lazy Loading](https://router.vuejs.org/guide/advanced/lazy-loading.html)

---

## 2. Как это работает в Vite + Vue

```ts
const module = await import('./HeavyPanel.vue')
```

```text
Static import (top-level)     → bundler включает в тот же chunk
Dynamic import()            → отдельный async chunk
Browser navigates / opens   → fetch chunk-xyz.js → execute → render
```

Vite (Rollup) при build:

1. строит **dependency graph**
2. `import()` создаёт **split point**
3. генерирует `CatalogPage-xxxxx.js`, `vendor-yyyyy.js`, …

Dev mode: dynamic import тоже работает, но анализ chunks — после **`npm run build`**.

---

## 3. Уровни splitting в catalog app

| Уровень | Механизм | Когда |
|---------|----------|--------|
| **Routes** | `() => import('@/pages/...')` | каждая page — отдельный chunk |
| **Features** | dynamic import admin panel | редкий flow |
| **Libraries** | `import('chart.js')` | тяжёla lib только на stats page |
| **Components** | `defineAsyncComponent` | см. [урок 08](./08-lazy-components.md) |
| **Vendor** | `manualChunks` in vite | vue/router/pinia в stable vendor chunk |

Module 5 уже закрыл **route lazy** — здесь **общая картина** + feature/vendor split.

---

## 4. Route-level splitting *(recap + perf lens)*

```ts
{
  path: '/catalog',
  name: 'catalog',
  component: () => import('@/pages/CatalogPage.vue'),
},
{
  path: '/admin',
  name: 'admin',
  component: () => import('@/pages/admin/AdminDashboard.vue'),
  meta: { requiresAuth: true },
},
```

```text
Покупатель никогда не заходит /admin → admin chunk не грузится
```

**Проверка:**

```bash
npm run build
```

Смотри `dist/assets/` — отдельные файлы на pages. Имена с hash для cache.

Подробнее — [Module 5 · lazy routes](../module-5/11-lazy-loading-routes.md).

---

## 5. Feature-level dynamic import

Тяжёлый модуль **внутри** page, не route:

```ts
// ProductAnalyticsTab.vue — только при открытии tab
async function openAnalytics() {
  const { renderChart } = await import('@/features/analytics/chart')
  renderChart(el.value, props.productId)
}
```

```vue
<script setup lang="ts">
const showImport = ref(false)
const ImportWizard = shallowRef<Component | null>(null)

async function loadWizard() {
  const mod = await import('@/features/import/ImportWizard.vue')
  ImportWizard.value = mod.default
  showImport.value = true
}
</script>
```

Catalog: **bulk CSV import** для admin — 0 KB для обычного user до клика.

---

## 6. Library splitting

```ts
// ❌ main bundle тянет chart на каждой page
import { Chart } from 'chart.js'

// ✅ только StatsPage chunk
async function mountChart(canvas: HTMLCanvasElement, data: number[]) {
  const { Chart, registerables } = await import('chart.js')
  Chart.register(...registerables)
  return new Chart(canvas, { /* … */ })
}
```

То же для: `date-fns` locale packs, markdown editor, map SDK, PDF generator.

**Rule:** import lib **рядом с split point** (route/tab/modal open), не в `main.ts`.

---

## 7. Vendor chunks (`manualChunks`)

```ts
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('vue') || id.includes('vue-router') || id.includes('pinia')) {
              return 'vue-vendor'
            }
            if (id.includes('@tanstack/vue-query')) {
              return 'query-vendor'
            }
          }
        },
      },
    },
  },
})
```

```text
Плюсы:
  - vendor hash меняется реже → browser cache для app code
Минусы:
  - больше HTTP requests (HTTP/2 mitigates)
  - over-tuning без measure — premature
```

Для pet-project достаточно **route split**; `manualChunks` — когда build report показывает giant vendor в main.

---

## 8. Magic comments *(webpack legacy; Vite partial)*

```ts
import(/* webpackChunkName: "admin" */ '@/pages/admin/Admin.vue')
```

Vite/Rollup используют **имена из path** + hash. Группировка — через `manualChunks`, не magic comments.

---

## 9. Prefetch и preload

### Router + Vite

При hover `RouterLink` или **after idle** можно prefetch chunk *(advanced)*:

```ts
// vue-router 4: некоторые setups + vite-plugin prefetch
// простой manual:
function prefetchCatalog() {
  import('@/pages/CatalogPage.vue')
}
```

```vue
<RouterLink to="/catalog" @mouseenter="prefetchCatalog">
  Catalog
</RouterLink>
```

```text
Trade-off: тратим bandwidth заранее ради мгновенного перехода
```

### `<link rel="modulepreload">`

Build tools могут inject для critical chunks — обычно автоматически для entry.

---

## 10. Что не split'ить

| Не split | Почему |
|----------|--------|
| `createApp`, router setup, pinia | нужны сразу |
| Critical CSS | blocking ok |
| Tiny utils (< 1 KB) | overhead fetch > win |
| Shared by every page | останется в main anyway |

**First screen** (home или catalog landing) — сознательно в **main** или **одном** быстром chunk.

---

## 11. Catalog: рекомендуемая карта chunks

```text
main.ts + App.vue + core plugins     → index.js
vue-vendor (optional)                → vue-vendor.js
/catalog, /product/:id, /cart        → page chunks (lazy routes)
/login, /checkout                    → page chunks
/admin/*                             → admin chunk(s) — only staff
ProductReviews (heavy markdown)      → async component или dynamic import
Chart on analytics tab               → dynamic import('chart.js')
```

Пользователь catalog MVP: **main + catalog chunk + product chunk** — не весь monolith.

---

## 12. Измерение и анализ

### Build output

```bash
npm run build
```

Rollup print:

```text
dist/assets/index-xxx.js          120 kB │ gzip: 45 kB
dist/assets/CatalogPage-yyy.js     18 kB │ gzip:  7 kB
dist/assets/AdminDashboard-zzz.js  95 kB │ gzip: 32 kB
```

### Visualizer *(optional)*

```bash
npm install -D rollup-plugin-visualizer
```

```ts
import { visualizer } from 'rollup-plugin-visualizer'

plugins: [
  vue(),
  visualizer({ open: true, filename: 'stats.html' }),
]
```

Treemap: кто раздул bundle — `lodash` entire import? duplicate deps?

### Network tab

Throttle **Fast 3G** → first load → сколько JS до interactive catalog?

---

## 13. Связь с lazy components

```text
Code splitting     = bundler режет файлы (import())
Lazy component     = Vue ждёт chunk перед render (defineAsyncComponent)
Route lazy         = Router вызывает import() при navigation
```

Три слоя одной идеи — [урок 08 · lazy components](./08-lazy-components.md).

---

## 14. Частые ошибки

### Eager import тяжёлой page в router index

```ts
import AdminPage from '@/pages/admin/AdminPage.vue' // в main
```

### Barrel file re-export всего

```ts
// features/index.ts export * from everything
import { Something } from '@/features' // tree-shake fail → fat chunk
```

Prefer direct paths для heavy features.

### Dynamic import в sync loop

1000× `import()` — bad. One split module per feature.

### Split без loading UX

Chunk fetch 2s — blank screen. Suspense / skeleton / `defineAsyncComponent` loading.

### Over-splitting tiny components

10 chunks по 2 KB — latency hell.

---

## 15. Что важно понять после этого блока

Проверь себя:

1. Чем static `import` отличается от `import()` для bundler?
2. Главный split point в catalog router?
3. Когда split **library**, не page?
4. Как проверить chunks после `npm run build`?
5. Зачем `manualChunks` и риск over-tuning?
6. Prefetch — trade-off?

---

## 16. Что почитать

### Официальное

- [Vite · Building for Production](https://vitejs.dev/guide/build.html)
- [Vue Router · Lazy Loading](https://router.vuejs.org/guide/advanced/lazy-loading.html)
- [MDN · import()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import)

### Связанные материалы этого плана

- [Module 5 · lazy loading routes](../module-5/11-lazy-loading-routes.md)
- [Module 12 · lazy components](./08-lazy-components.md)

---

## 17. Практическое мини-задание

1. `npm run build` — список chunks и размеры gzip.
2. Все routes lazy? Если нет — переведи одну heavy page.
3. Найди eager import тяжёлой lib — перенеси в dynamic import.
4. Network 3G: time to catalog interactive — до/после.
5. Optional: visualizer — top 3 модуля в main chunk.

---

## 18. Мини-конспект

- **code splitting** = async chunks via **`import()`**
- routes lazy — baseline для catalog
- features/libs — dynamic import at use point
- measure **`build`** + Network, не faith
- vendor `manualChunks` — optional tuning
- дальше — **lazy components** (Vue layer)

---

## 19. Что делать дальше

Следующий теоретический блок Module 12:

- [Lazy components](./08-lazy-components.md)
