# Module 12 · Практический checklist

Пошаговый чеклист для закрытия **практической части Module 12**: найти **1–2 узких места** в catalog app, исправить **осмысленно**, подтвердить через **Vue Devtools** или profiling — без premature `v-memo` everywhere.

Используй этот файл как рабочий документ: проходи шаги по порядку и отмечай выполненные пункты.

---

## Перед стартом

### Module 5–11 должны быть на месте

- [ ] catalog app: router, Pinia, vue-query, forms/UI kit
- [ ] tests green (`npm run test:run`) — оптимизации не ломают safety net
- [ ] `npm run dev` и `npm run build` работают

### Прочитай теорию Module 12

- [01 · реактивность](01-reactivity-internals.md)
- [02 · лишние rerenders](02-unnecessary-rerenders.md)
- [03 · key](03-key.md)
- [04 · v-once](04-v-once.md)
- [05 · v-memo](05-v-memo.md)
- [06 · shallowRef](06-shallow-ref.md)
- [07 · code splitting](07-code-splitting.md)
- [08 · lazy components](08-lazy-components.md)
- [09 · load optimization](09-page-load-optimization.md)
- [10 · Vue Devtools](10-vue-devtools.md)

### Инструменты

- [ ] Vue Devtools extension (или vite-plugin-vue-devtools)
- [ ] Chrome DevTools → Network (Slow 4G), Lighthouse *(optional)*
- [ ] `@tanstack/vue-query-devtools` в dev *(если vue-query)*

---

## Шаг 1. Выбрать проект

| Вариант | Когда |
|---------|--------|
| **Product Catalog Module 5–11** | recommended |
| **Другой Vue 3 + Vite app** | если catalog исчерпан |

### Рекомендация

Module 12 — **perf audit существующего app**, не новый benchmark repo.

### Checklist

- [ ] выбран проект
- [ ] есть list page + cart или filter flow для repro

---

## Шаг 2. Зафиксировать MVP Module 12

### MVP (критерии README)

- **baseline** зафиксирован *(DevTools highlight / count / Lighthouse / build size — хотя бы один)*
- **1–2 узких места** найдены и **описаны** (repro + cause)
- **fixes** применены — architecture first, micro-opts second
- **after** измерение — улучшение **видно** в Devtools/profiling
- **tests** still green после изменений
- **нет** оптимизаций «на будущее» без measured problem

### Два типа issues *(pick ≥1 each category or 2 in one)*

| Тип | Пример | Verify |
|-----|--------|--------|
| **Runtime** | add to cart flash all cards | Highlight updates |
| **Runtime** | filter lag / heavy computed | Timeline / count |
| **Load** | fat main chunk | `npm run build` |
| **Load** | LCP image / API waterfall | Lighthouse / Network |

### Из README practice

| Требование | MVP |
|------------|-----|
| найти узкие места | ≥1 documented issue |
| большие списки / repeated compute | ≥1 fix in list or computed |
| навык диагностики | written before/after note |
| Devtools или profiling | evidence attached |
| осмысленные opts | no blind v-memo on everything |

### Не обязательно в MVP

- 100 Lighthouse score
- SSR / Nuxt migration
- virtual scroll library
- full bundle visualizer CI
- optimize every route
- production RUM

### Checklist

- [ ] MVP scope записан (какие 1–2 issues)
- [ ] приоритет: **measure → fix → verify**

---

## Шаг 3. Baseline — runtime

### Highlight updates

1. Open catalog list page
2. Devtools → **Highlight updates**
3. Actions: add to cart, toggle filter, open toast

Запиши:

```markdown
## Baseline runtime
- Action: add to cart
- Flashed: App / ProductGrid / all ProductCards / CartBadge only
- Suspected cause: …
```

### Optional: console.count

```vue
<!-- временно в ProductCard -->
onBeforeUpdate(() => {
  if (import.meta.env.DEV) console.count('ProductCard')
})
```

### Checklist

- [ ] ≥1 user action записана с who-flashed
- [ ] baseline **до** правок сохранён

---

## Шаг 4. Baseline — load *(optional but recommended)*

```bash
npm run build
```

Запиши main + catalog page chunk gzip.

```text
Optional: Lighthouse mobile → LCP element, LCP time
Optional: Network Slow 4G → first catalog interactive
```

### Checklist

- [ ] build sizes записаны **или** Lighthouse LCP noted

---

## Шаг 5. Issue #1 — diagnose

Pick **runtime** issue from baseline.

### Playbook

| Symptom | Check |
|---------|--------|
| All cards flash | parent store subscription, unstable props ([02](02-unnecessary-rerenders.md)) |
| Wrong input state on delete | index key ([03](03-key.md)) |
| Filter every keystroke refetch | query key / debounce ([09](09-page-load-optimization.md)) |
| Heavy tab always loaded | lazy component ([08](08-lazy-components.md)) |

### Document

```markdown
## Issue #1
- Repro steps:
- Root cause:
- Planned fix (architecture / API):
```

### Checklist

- [ ] root cause своими словами
- [ ] fix type chosen (not random v-memo)

---

## Шаг 6. Issue #1 — fix

### Allowed fix menu *(pick what matches issue)*

- [ ] remove `useCartStore()` from `ProductCard` → emit + badge only
- [ ] stable props (no inline objects in template)
- [ ] `computed` instead of `filter()` in template
- [ ] debounced search query key
- [ ] vue-query `staleTime` / `placeholderData`
- [ ] `:key="product.id"` fix
- [ ] `v-memo` on grid row **with correct deps** ([05](05-v-memo.md))
- [ ] lazy route / lazy reviews tab ([07](07-code-splitting.md), [08](08-lazy-components.md))
- [ ] image `width/height`, lazy below fold ([09](09-page-load-optimization.md))

### Forbidden as first fix

- `shallowRef` everywhere
- `v-once` on live data
- disable reactivity «for perf»
- remove tests to green

### Checklist

- [ ] fix implemented
- [ ] `npm run test:run` green

---

## Шаг 7. Issue #1 — verify

### Devtools after

- [ ] Highlight updates — **меньше** components flash *(or specific improvement)*
- [ ] или `console.count` lower per action
- [ ] или Timeline shorter render spike

### Written evidence

```markdown
## Issue #1 — verified
- Before: all 200 ProductCards flash
- After: CartBadge + one card (or 0 cards)
- Tool: Vue Devtools highlight
```

### Checklist

- [ ] before/after documented
- [ ] UX still correct (no stale price/cart)

---

## Шаг 8. Issue #2 — diagnose, fix, verify

Repeat steps 5–7 for **second** issue.

**Suggested pairings:**

| #1 Runtime | #2 Load |
|------------|---------|
| cart flash all cards | lazy admin route |
| heavy filter computed | LCP image + dimensions |
| mass rerender | parallel useQuery |

Or two runtime issues if load already ok.

### Checklist

- [ ] issue #2 documented + verified
- [ ] different technique than #1 *(preferred)*

---

## Шаг 9. List / compute optimization *(README requirement)*

At least one explicit list or repeated computation fix:

- [ ] `computed` for filtered/sorted products
- [ ] or isolate list from hot parent
- [ ] or `v-memo` + stable deps on row
- [ ] or `shallowRef` + immutable sort ([06](06-shallow-ref.md)) *(if large local list)*

### Synthetic stress *(optional)*

Temporarily duplicate products to 100–200 items in dev fixture — confirm fix scales.

### Checklist

- [ ] list/compute path explicitly optimized
- [ ] verified under stress or real data

---

## Шаг 10. Code split sanity *(if load issue)*

- [ ] all routes `() => import(...)` or justify eager
- [ ] one heavy feature lazy (admin, reviews, chart)
- [ ] `npm run build` — chunk split visible

---

## Шаг 11. Regression QA

Manual flows after all opts:

1. Catalog browse + filter
2. Product detail
3. Add to cart / cart page
4. Login or form *(if exists)*
5. Toast/modal *(Module 10)*

### Checklist

- [ ] no stale UI (price, qty, locale)
- [ ] tests green
- [ ] remove temporary `console.count` / debug hooks

---

## Шаг 12. Perf note в repo *(recommended)*

Create `docs/PERF.md` or section in README:

```markdown
# Performance notes

## Fixed issues
1. Cart flash — isolated store from ProductCard
2. …

## Measurements
- Devtools highlight: before/after
- Build: main gzip X → Y

## Guidelines
- Measure before v-memo
- ProductCard: emit only, no cart store
```

### Checklist

- [ ] short doc or PR description with evidence

---

## Шаг 13. Финальная самопроверка

1. Runtime vs load — какой issue был которого типа?
2. Почему выбранный fix лучше «просто v-memo»?
3. Как Devtools доказал улучшение?
4. Что **не** оптимизировал и почему ok?
5. Как tests защитили от regression?
6. Следующий perf debt если бы было время?

### Checklist

- [ ] ответы своими словами

---

## Финальный checklist Module 12

Module 12 можно считать завершённым, если:

### Diagnosis (README)

- [ ] **1–2** узких места найдены с repro
- [ ] навык диагностики — written playbook used

### Fixes (README)

- [ ] list **или** repeated computation optimized
- [ ] fixes **осмысленные**, не premature complexity

### Verification (README)

- [ ] **Vue Devtools** highlight/timeline **или** profiling/Lighthouse/build
- [ ] before/after evidence exists

### Quality

- [ ] `npm run test:run` green
- [ ] manual QA critical flows ok
- [ ] debug hooks removed

---

## Stretch goals *(optional)*

- rollup-plugin-visualizer treemap
- virtual list (`@tanstack/vue-virtual`) for 1000+ items
- prefetch catalog chunk on home hover
- Chrome Performance flame for long task
- compare Lighthouse score before/after load fixes
- `requestIdleCallback` defer analytics

---

## Если что-то пошло не так

### Highlight shows everything always

- hot root `App.vue` — too many stores; split layout

### Fix applied but no improvement

- wrong root cause; re-profile
- HMR artifact — hard refresh

### v-memo stale data

- missing dep — [05](05-v-memo.md)

### Tests fail after perf refactor

- behavior unchanged? fix tests if emit path changed
- don't delete tests to pass

### Build bigger after split

- more chunks ok; main should shrink
- check accidental duplicate imports

### Lighthouse worse after lazy

- loading skeleton CLS — reserve space

---

## Что делать после Module 12

Переходи к **Module 13 · Архитектура проекта**:

- [структура папок](../module-13/01-folder-structure.md)
- feature-based, `shared/ui/entities/features/pages`
- API / composables / stores layers, env

Perf fixes без структуры **расползаются** — Module 13 закрепляет **где** живёт код catalog.

---

## Мини-конспект

- Module 12 practice = **measure → 1–2 fixes → verify**
- Devtools highlight = главное доказательство runtime
- architecture before v-memo/shallow
- list/compute + load optional second issue
- tests stay green
- Module 13 = sustainable structure
