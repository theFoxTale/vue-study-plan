# Module 13 · Практический checklist

Пошаговый чеклист для закрытия **практической части Module 13**: **переразложить** Product Catalog в зрелую структуру (`pages` / `features` / `entities` / `shared` или упрощённый аналог) и зафиксировать короткий **`ARCHITECTURE.md`**.

Используй этот файл как рабочий документ: проходи шаги по порядку и отмечай выполненные пункты.

---

## Перед стартом

### Module 5–12 должны быть на месте

- [ ] catalog app работает (`npm run dev`)
- [ ] router, Pinia, api/query, UI kit — есть что раскладывать
- [ ] `npm run test:run` green *(если тесты есть — Module 11)*
- [ ] perf-фиксы Module 12 не обязательны, но app не должен быть broken

### Прочитай теорию Module 13

- [01 · структура папок](01-folder-structure.md)
- [02 · feature-based](02-feature-based.md)
- [03 · слои](03-shared-ui-entities-features-pages.md)
- [04 · naming](04-naming.md)
- [05 · API layer](05-api-layer.md)
- [06 · composables](06-composables-layer.md)
- [07 · stores](07-stores-layer.md)
- [08 · env](08-env.md)
- [09 · scalability](09-scalability.md)

---

## Шаг 1. Выбрать проект

| Вариант | Когда |
|---------|--------|
| **Product Catalog Module 5–12** | recommended |
| **Другой Vue 3 + Vite app** | если catalog исчерпан |

### Рекомендация

Module 13 — **реорганизация существующего кода**, не новый empty scaffold.

### Checklist

- [ ] выбран проект
- [ ] git branch `refactor/architecture` *(или аналог)* — удобно откатывать

---

## Шаг 2. Зафиксировать MVP Module 13

### MVP (критерии README)

- проект **переразложен** в зрелую структуру
- выделены слои **`ui` / `features` / `entities` / `pages`** *или упрощённый аналог*
- есть короткий документ **архитектурных правил**
- структура **помогает искать код**, а не мешает
- `npm run build` + app flows работают
- tests green *(если были)*

### Упрощённый аналог (допустим)

```text
src/
  app/
  pages/
  features/      # cart, auth, catalog
  components/    # shared ui + entity ui на старте
  shared/        # api, config, lib, composables
```

Потом выдели `entities/product`, когда типы/api начнут дублироваться.

### Полный целевой каркас

```text
src/
  app/
  pages/
  features/
  entities/
  shared/ui|api|config|lib|composables
```

### Не обязательно в MVP

- полный FSD (`widgets`, `processes`)
- microfrontends
- Nx / monorepo
- переписать весь UI kit
- идеальные имена всех 100 файлов за один день

### Checklist

- [ ] выбран полный стек **или** упрощённый аналог
- [ ] список доменов для переноса: cart, catalog, auth, product…

---

## Шаг 3. Снимок «до»

Нарисуй / запиши текущий `src/` (5–10 мин):

```markdown
## Before
- components/: …
- stores/: …
- pages/: …
- Pain: …
```

### Checklist

- [ ] before-снимок сохранён (в ARCHITECTURE.md или PR description)

---

## Шаг 4. Написать `ARCHITECTURE.md` **сначала** (черновик)

Создай `docs/ARCHITECTURE.md` или `ARCHITECTURE.md` в корне — **коротко** (1–2 экрана):

```markdown
# Architecture

## Layers
pages → features → entities → shared
(или твой упрощённый вариант)

## Import rules
- shared не импортирует features/pages
- снаружи feature/entity — только index.ts

## Naming
- Pages: *Page.vue
- Shared UI: Base*
- Composables: use*
- Stores: use*Store

## Where things live
- HTTP: shared/api + entities/*/api
- Cart state: features/cart
- Env: shared/config/env.ts

## How to add a feature
1. Create features/<name>/
2. Public index.ts
3. Wire in page
4. Add tests for store/api if needed
```

### Checklist

- [ ] черновик правил существует **до** большого move
- [ ] правила согласованы с выбранным каркасом

---

## Шаг 5. Каркас папок + alias

- [ ] создай пустые `app/`, `pages/`, `features/`, `shared/` *(+ `entities/` если полный стек)*
- [ ] `@/` указывает на `src/`
- [ ] router lazy imports готовы обновлять пути

Пока **не** переноси всё скопом.

---

## Шаг 6. `shared` — фундамент

Перенеси в порядке:

1. [ ] `shared/config/env.ts` + `.env.example` ([08](08-env.md))
2. [ ] `shared/api/http.ts` + errors
3. [ ] `shared/lib/*` (`formatPrice`, debounce…)
4. [ ] `shared/ui/*` (`BaseButton`, `BaseModal`, `TextField`…)
5. [ ] `shared/composables/*` (`useDisclosure`, `useToast`…)

### Checklist

- [ ] нет `import` из features/pages внутри shared
- [ ] app стартует после переноса shared

---

## Шаг 7. `entities/product` *(или types+api в shared на упрощённом пути)*

- [ ] `Product` type в одном месте
- [ ] `fetchProducts` / `parseProduct` в entity api *(или `shared/api/products` временно)*
- [ ] `productKeys` рядом
- [ ] `ProductCard` presentational: props + emit, **без** `useCartStore`

### Checklist

- [ ] один источник правды для `Product`
- [ ] pages больше не содержат raw `fetch('/products')`

---

## Шаг 8. Feature `cart`

- [ ] `features/cart/model/useCartStore.ts`
- [ ] `features/cart/ui` или scenarios: badge, drawer, add-to-cart
- [ ] `useAddToCart` glue (store + toast)
- [ ] `features/cart/index.ts` public API
- [ ] снаружи только `@/features/cart`

### Checklist

- [ ] ProductCard не подписан на cart store
- [ ] store test всё ещё green *(обнови imports)*

---

## Шаг 9. Feature `catalog` + `auth` *(auth optional)*

- [ ] `useCatalogFilters` + filters UI → `features/catalog`
- [ ] product grid feature склеивает entity card + add-to-cart
- [ ] auth: login form + `useAuthStore` → `features/auth` *(если есть)*
- [ ] public `index.ts` на каждый feature

### Checklist

- [ ] нет циклов feature ↔ feature deep imports

---

## Шаг 10. `pages/` — тонкие экраны

- [ ] `CatalogPage`, `ProductDetailsPage`, `CartPage`, `LoginPage` → `pages/...`
- [ ] page ≈ композиция features (< ~50–80 строк ideal)
- [ ] router paths обновлены на новые locations
- [ ] `app/main.ts`, `App.vue`, router instance → `app/`

### Checklist

- [ ] URL flows: catalog → detail → cart → login работают

---

## Шаг 11. Naming pass

- [ ] shared UI: один префикс (`Base*` или `Ui*`)
- [ ] pages: `*Page.vue`
- [ ] composables: `use*`
- [ ] stores: `use*Store`, короткие ids
- [ ] нет `utils.ts` god-file — дроби `shared/lib`

Обнови секцию Naming в `ARCHITECTURE.md` под факт.

### Checklist

- [ ] naming согласован с документом

---

## Шаг 12. Env + API hygiene

- [ ] нет захардкоженного API URL в components
- [ ] только `VITE_*` для client; `.env.example` в repo
- [ ] `.env.local` в `.gitignore`
- [ ] `ImportMetaEnv` typed

### Checklist

- [ ] `npm run build` с production env ok

---

## Шаг 13. Tests + QA

```bash
npm run test:run
npm run build
npm run dev
```

Manual:

1. Catalog list + filters  
2. Product detail  
3. Add to cart / cart page  
4. Login *(если есть)*  
5. Modal/toast *(если есть)*  

### Checklist

- [ ] tests green (или созданы минимальные на parse/store после переноса)
- [ ] manual QA ok
- [ ] нет broken imports / circular dependency warnings

---

## Шаг 14. Финализировать `ARCHITECTURE.md`

Допиши:

- [ ] before → after (кратко)
- [ ] актуальная диаграмма слоёв
- [ ] «How to add a feature» — 4–6 шагов
- [ ] список «ещё рано» (widgets, microfrontends…)

### Checklist

- [ ] документ ≤ ~2 экрана, но **enforceable**
- [ ] новый человек найдёт ProductCard / cart store по документу

---

## Шаг 15. Финальная самопроверка

1. Слои: где `BaseModal`, `ProductCard`, `useCartStore`, `CatalogPage`?
2. Направление импортов — есть ли нарушения?
3. Упростил ли поиск кода vs «до»?
4. Что сознательно оставил в упрощённом аналоге?
5. Как добавить wishlist без правки login?
6. Какие 3 правила из ARCHITECTURE не нарушишь в следующем PR?

### Checklist

- [ ] ответы своими словами

---

## Финальный checklist Module 13

Module 13 можно считать завершённым, если:

### README criteria

- [ ] проект переразложен в более зрелую структуру
- [ ] есть `ui` + `features` + `entities` + `pages` **или** упрощённый аналог
- [ ] короткий документ архитектурных правил
- [ ] структура помогает искать код

### Quality bar

- [ ] import rules соблюдены (особенно shared)
- [ ] public API на features *(и entities, если есть)*
- [ ] API/env не размазаны по UI
- [ ] build + critical flows работают
- [ ] tests green *(если были)*

---

## Stretch goals *(optional)*

- ESLint boundary rules (`eslint-plugin-boundaries` / import restrictions)
- `entities/user` + auth api fully
- barrel-only exports + forbid deep import lint
- ADR one-pager: «почему не полный FSD»
- migrate remaining type-based leftovers

---

## Если что-то пошло не так

### Circular dependency

- feature A deep-imports B → только public API или page композирует оба

### App не стартует после move

- проверь alias `@/`, router lazy paths, `main.ts` entry

### Tests красные только из-за путей

- обнови imports; не удаляй тесты

### Слишком большой PR

- ship shared → entity product → cart feature отдельными коммитами/PR

### Структура мешает

- упрости до аналога; удали пустые FSD-слои
- правила важнее числа папок

### God page осталась

- вынеси filters/grid в features; page только composition

---

## Что делать после Module 13

Переходи к **Module 14 · SSR, SSG и Nuxt 3**:

- CSR vs SSR vs SSG
- когда Nuxt нужен, а когда Vue + Vite достаточно
- file routing, layouts, `useFetch` / `useAsyncData`

Архитектура Module 13 **переносится** в Nuxt слоями (`pages/`, `components/`, `composables/`, server) — границы важнее названий папок.

- [Module 14 в README](../../README.md#module-14-ssr-ssg-и-nuxt-3)

---

## Мини-конспект

- Module 13 practice = **restructure + ARCHITECTURE.md**
- incremental: shared → entities → features → thin pages
- public API + import direction
- упрощённый аналог допустим
- tests/QA после каждого крупного move
- Module 14 = rendering modes + Nuxt
