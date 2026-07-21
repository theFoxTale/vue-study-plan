# Module 12 · Теория: Vue Devtools

Этот материал закрывает последний теоретический пункт Module 12: **Vue Devtools** — inspect компонентов, Pinia, timeline, highlight updates и workflow диагностики perf в catalog app **до и после** оптимизаций.

Связанные материалы:

- [Module 12 · лишние перерендеры](./02-unnecessary-rerenders.md)
- [Module 12 · оптимизация загрузки](./09-page-load-optimization.md)

---

## 1. Зачем Devtools в Module 12

```text
Уроки 01–09  → что оптимизировать и как
Devtools     → доказать, что проблема есть / fix сработал
```

README Module 12: оптимизации **подтверждаются** через Devtools или profiling — не «кажется быстрее».

Devtools отвечает на:

- **кто** перерендерился?
- **какой state** trigger'нул update?
- **store/query** в каком состоянии?
- props/events корректны?

Официально:

- [Vue Devtools · Guide](https://devtools.vuejs.org/)
- [Vue Devtools · Getting Started](https://devtools.vuejs.org/guide/installation)

---

## 2. Установка

### Browser extension *(recommended)*

- [Chrome](https://chrome.google.com/webstore/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
- [Firefox](https://addons.mozilla.org/firefox/addon/vue-js-devtools/)

```text
Открывай app через http://localhost (не file://)
Vue 3 app → иконка Devtools активна
```

### Vite plugin *(optional standalone UI)*

```bash
npm install -D vite-plugin-vue-devtools
```

```ts
// vite.config.ts
import VueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig({
  plugins: [vue(), VueDevTools()],
})
```

Удобно если extension конфликтует или нужен embedded panel.

### Production build

Devtools **только dev** — в production используй Lighthouse, RUM, `console.count`, `onRenderTriggered`.

---

## 3. Панели Devtools (обзор)

| Panel | Module 12 use |
|-------|----------------|
| **Components** | tree, props, state, highlight updates |
| **Timeline** | component events, perf recording |
| **Pinia** | cart/auth state, time-travel *(if enabled)* |
| **Router** | current route, matched records |
| **Custom** | TanStack Query Devtools *(отдельный widget)* |

Catalog stack: Components + Pinia + Query devtools покрывают 90% диагностики.

---

## 4. Components: дерево и inspect

```text
App
  AppLayout
    CatalogPage
      ProductFilters
      ProductGrid
        ProductCard × N
      CartBadge
```

**Inspect** (`Ctrl+Shift+C` / pick element):

- `$props`, `$attrs`
- setup state (`ref` / `reactive` unwrap)
- registered components, hooks

**Поиск по имени:** `ProductCard` — сколько экземпляров?

### Практика perf

1. Select `ProductGrid`
2. Trigger action (add to cart, toggle filter)
3. Смотри, **подсвечиваются** ли все `ProductCard`

Если да — см. [урок 02 · лишние перерендеры](./02-unnecessary-rerenders.md).

---

## 5. Highlight updates

В Components panel:

```text
☑ Highlight updates   (или иконка «flash»)
```

Компоненты при rerender **мигают** цветной рамкой.

| Цвет flash | Интерпретация |
|------------|----------------|
| Много cards flash | mass child update |
| Только `CartBadge` | isolated — good |
| Whole `App` | hot root — investigate |

**Запиши baseline** до оптимизации → **compare** после isolate props / `v-memo`.

---

## 6. Timeline / Performance recording

```text
Timeline tab → Start recording
  → user action (filter, add to cart, open modal)
  → Stop
```

Events:

- component **render** / **patch**
- **event** handlers
- **route** navigation

```text
Ищи:
  - spike render count на одно действие
  - unexpected component в trace
  - long handler (> 16ms → janky frame)
```

Имена и детали зависят от версии Devtools — принцип: **correlate action → components work**.

---

## 7. Pinia tab

```text
Stores list → cart, auth, …
  state snapshot
  getters
  actions log (если включено)
```

**Perf сценарии:**

- add to cart → меняется только `cart`?
- `$subscribe` storm — repeated patches
- god store — huge state tree diff

Time-travel / export state — debug, не perf per se, но помогает воспроизвести rerender.

Cross-link: [Module 6 · Pinia](../module-6/04-pinia.md).

---

## 8. TanStack Query Devtools

```bash
# уже в проекте с vue-query
import { VueQueryDevtools } from '@tanstack/vue-query-devtools'
```

```vue
<VueQueryDevtools /> <!-- только dev -->
```

```text
Показывает:
  queries, keys, stale/fresh, fetching, cache
```

**Load + runtime:**

- лишний **refetch** on mount → perceived slowness ([урок 09](./09-page-load-optimization.md))
- duplicate keys
- invalidate cascade → grid rerender

Не путать с Vue component rerender — query update **может** trigger component через `data` ref.

---

## 9. Router tab

```text
Current route: /product/42?tab=reviews
Matched: ProductDetailsPage
Params / query / meta
```

Проверка:

- navigation guard не блокирует main thread долго
- lazy route chunk loaded (Network tab параллельно)

---

## 10. Code-level hooks *(dev only)*

Devtools дополняют, не заменяют код:

```ts
import { onRenderTriggered, onRenderTracked } from 'vue'

onRenderTriggered((e) => {
  console.log('[ProductCard] triggered', e.key, e.target)
})
```

```vue
<script setup lang="ts">
import { onBeforeUpdate } from 'vue'

onBeforeUpdate(() => {
  if (import.meta.env.DEV) console.count('ProductCard render')
})
</script>
```

```text
onRenderTriggered → КАКОЕ поле state вызвало update
console.count       → сколько renders на action
```

Убери или guard `import.meta.env.DEV` перед commit.

---

## 11. Chrome Performance *(complement)*

```text
Vue Devtools  → component-level semantics
Chrome Perf   → frames, JS flame chart, layout, paint
```

Workflow:

1. Devtools highlight — **кто** лишний
2. Chrome Performance record — **почему** frame long (heavy computed? layout thrash?)

Для **load** — Lighthouse + Network ([урок 09](./09-page-load-optimization.md)).

---

## 12. Catalog: diagnostic playbook

### Problem: «Add to cart тормозит»

```text
1. Highlight updates → all ProductCards?
2. Pinia → single cart patch or whole store replace?
3. ProductCard setup → useCartStore()?
4. Timeline → render count spike
5. Fix isolate → re-record → cards no flash
```

### Problem: «Filter typing laggy»

```text
1. Each keypress → query refetch? (Query Devtools)
2. Debounce missing?
3. Heavy filter in template not computed?
4. Performance flame → long task
```

### Problem: «Page feels slow first load»

```text
Devtools мало поможет — Network + Lighthouse
  → chunks, LCP image, API waterfall
```

### Problem: «After v-memo stale price»

```text
Components inspect props vs DOM
  → deps bug ([урок 05](./05-v-memo.md))
```

---

## 13. Документирование findings

Перед fix в pet-project — one note:

```markdown
## Perf issue: cart flash all cards
- Repro: add item from catalog
- Observed: 200 ProductCard highlight
- Cause: AppLayout useCartStore + prop unstable
- Fix: CartBadge only; stable props
- Verified: Devtools highlight 1 badge only
```

Module 12 **practice** потребует такой evidence.

---

## 14. Частые ошибки

### Devtools в production

Extension не видит или нет Vue — ok; не ship devtools plugin.

### Смотреть только Lighthouse

Miss runtime rerender issues.

### Highlight без concrete action

Record **one** user story at a time.

### Игнорировать Query Devtools

Refetch masquerades as «Vue slow».

### Оптимизация без re-measure

Always compare before/after highlight or count.

### HMR artifacts

Hot reload иногда extra renders — full page refresh для чистого test.

---

## 15. Что важно понять после этого блока

Проверь себя:

1. Какие 3 panel используешь для rerender vs load?
2. Что делает **Highlight updates**?
3. Как Pinia tab помогает при add to cart?
4. Query Devtools — что ищешь при filter typing?
5. `onRenderTriggered` vs Devtools highlight?
6. Когда нужен Chrome Performance, не Vue Devtools?

---

## 16. Что почитать

### Официальное

- [Vue Devtools Documentation](https://devtools.vuejs.org/)
- [TanStack Query Devtools](https://tanstack.com/query/latest/docs/framework/vue/devtools)

### Связанные материалы этого плана

- [Module 12 · лишние перерендеры](./02-unnecessary-rerenders.md)
- [Module 12 · v-memo](./05-v-memo.md)
- [Module 8 · vue-query](../module-8/02-vue-query.md)

---

## 17. Практическое мини-задание

1. Install / open Vue Devtools on catalog dev server.
2. Enable highlight → add to cart → screenshot mental map кто flash.
3. Timeline record one filter change → note render-heavy components.
4. Open Pinia + Query panels — one observation each.
5. Add `console.count` on suspected component — match Devtools?

---

## 18. Мини-конспект

- Devtools = **prove** perf problems and fixes
- Components + **highlight** → mass rerender
- Pinia / Query → state & fetch diagnosis
- Timeline / `onRenderTriggered` → trigger source
- Load issues → Lighthouse + Network
- **теория Module 12 завершена** → practice checklist

---

## 19. Что делать дальше

Теория Module 12 завершена. Переходи к практике:

- [Module 12 · practice checklist](./11-practice-checklist.md) — 1–2 fixes, Devtools evidence, tests green
