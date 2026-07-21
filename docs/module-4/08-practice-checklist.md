# Module 4 · Практический checklist

Пошаговый чеклист для закрытия **практической части Module 4**: перевести один проект в **строгий TypeScript**, описать **модели данных**, типизировать **props/emits/composables/API** и убрать `any`.

Используй этот файл как рабочий документ: проходи шаги по порядку и отмечай выполненные пункты.

---

## Перед стартом

### Module 3 должен быть закрыт

- [ ] UI разбит на components с понятной ответственностью
- [ ] есть props/emits/slots в реальном UI
- [ ] catalog/cards/modal scenario существует *(или эквивалент)*
- [ ] пишешь код через `<script setup lang="ts">`

### Прочитай теорию Module 4

- [01 · typing props](01-typing-props.md)
- [02 · typing emits](02-typing-emits.md)
- [03 · typing composables](03-typing-composables.md)
- [04 · interfaces & type aliases](04-interfaces-and-type-aliases.md)
- [05 · typing API responses](05-typing-api-responses.md)
- [06 · generics](06-generics.md)
- [07 · types in store & router](07-types-in-store-and-router.md)

---

## Шаг 1. Выбрать проект для ужесточения types

| Вариант | Когда |
|---------|------|
| **Product Catalog из Module 2–3** | recommended |
| **Movie Search UI** | если это твой сквозной проект |
| **Notes / Todo** | только если catalog ещё нет, но есть models + async |

### Рекомендация

Не начинай новый app. Module 4 — про **укрепление types** в уже рабочей архитектуре.

### Checklist

- [ ] выбран один проект
- [ ] проект запускается
- [ ] понятно, какие entities будут типизированы

---

## Шаг 2. Зафиксировать MVP Module 4

### MVP

- `src/types` с domain models
- typed props для ключевых components
- typed emits для ключевых events
- typed composables (`UseXReturn` где нужно)
- API/service layer с `unknown` → parse
- `any` = 0 или осознанный минимум с комментарием
- typecheck проходит

### Не обязательно в MVP

- подключать Pinia в running app
- подключать Vue Router
- Zod как единственный parser
- generic `ProductList<T>`
- полные typed routes map

### Checklist

- [ ] MVP записан
- [ ] scope не уехал в Module 5–6 implementation

---

## Шаг 3. Включить / проверить строгий TypeScript

Проверь `tsconfig`:

- [ ] `strict` включён *(или близкий строгий режим)*
- [ ] Vue SFC открываются с `lang="ts"`
- [ ] есть script typecheck:

```bash
npm run typecheck
```

Если script нет — добавь через `vue-tsc --noEmit` *(если проект на Vite + vue-tsc)*.

### Checklist

- [ ] typecheck команда известна и запускается
- [ ] IDE показывает prop/emit errors

---

## Шаг 4. Создать `src/types`

Минимум для catalog:

```text
src/types/
  product.ts
  api.ts          # optional but recommended
```

### `product.ts` должен содержать

- [ ] `Product`
- [ ] `SortBy`
- [ ] `ProductCardProps`
- [ ] `ProductCardEmits`
- [ ] `ProductFiltersEmits`
- [ ] `ProductListProps` *(optional)*

### Стиль

- [ ] выбран единый подход: в основном `type` *(или осознанный mix)*
- [ ] unions вместо magic `string`
- [ ] нет duplicate Product shapes по файлам

### Checklist

- [ ] types вынесены отдельно от components
- [ ] импорты идут через `import type` где уместно

---

## Шаг 5. Типизировать props

Пройди components:

- [ ] `ProductCard`
- [ ] `ProductList`
- [ ] `ProductFilters`
- [ ] `BaseButton` / `BaseModal` *(хотя бы ключевые props)*

Требования:

- type-based `defineProps<...>()`
- `withDefaults` для optional UI props
- no `props: any` / `data: any`

### Самопроверка

Намеренно передай wrong type из parent и убедись, что TS ругается.

### Checklist

- [ ] ключевые props типизированы
- [ ] optional/nullable используются осознанно

---

## Шаг 6. Типизировать emits

Для тех же feature components:

- [ ] tuple syntax: `select: [id: number]`
- [ ] `update:query` / `update:sortBy` sync с prop types
- [ ] events without payload = `[]`
- [ ] parent handlers typed (`onSelect(id: number)`)

### Checklist

- [ ] ключевые emits типизированы
- [ ] нет `change: [payload: any]`

---

## Шаг 7. Типизировать composables

Для `useProducts` / `useProductFilters` *(или аналогов)*:

- [ ] `ref<Product[]>([])`
- [ ] `sortBy: Ref<SortBy>`
- [ ] filters принимают `Ref<Product[]>`
- [ ] explicit `UseProductsReturn` / `UseProductFiltersReturn` *(recommended)*
- [ ] async methods: `() => Promise<void>`

### Checklist

- [ ] composables без `any`
- [ ] destructure в page сохраняет правильные types

---

## Шаг 8. Вынести и типизировать API layer

Создай:

```text
src/services/productsApi.ts
```

Требования:

- [ ] `fetchProducts(): Promise<Product[]>`
- [ ] `const data: unknown = await response.json()`
- [ ] `parseProducts(data: unknown): Product[]`
- [ ] errors через `unknown` → message helper
- [ ] mock тоже возвращает `Promise<Product[]>`

Optional:

- [ ] `ProductDto` + mapper, если raw shape отличается
- [ ] `fetchJson<T>(url, parse)` generic helper

### Checklist

- [ ] composable больше не парсит JSON «как any»
- [ ] invalid mock/data даёт error state

---

## Шаг 9. Добавить 1–2 generic helpers *(практично, не overkill)*

Выбери минимум одно:

- [ ] `Maybe<T> = T | null`
- [ ] `fetchJson<T>(url, parse)`
- [ ] `useArrayFilter<T>(...)`

Не делай generic всё подряд.

### Checklist

- [ ] есть хотя бы один осмысленный generic
- [ ] можешь объяснить, зачем он нужен

---

## Шаг 10. Bridge к store/router types

Даже без подключения Pinia/Router в UI:

- [ ] sketch `src/stores/catalog.ts` с typed state
- [ ] helper `parseRouteParamId(...)`
- [ ] helper/parser `parseSortBy(raw: unknown): SortBy`

### Checklist

- [ ] domain types готовы к Module 5–6
- [ ] нет `params.id as number` без parse

---

## Шаг 11. Охота на `any`

Поиск по проекту:

```text
any
as any
Record<string, any>
```

Для каждого случая:

1. заменить на конкретный type, **или**
2. оставить с комментарием почему это temporary/boundary exception

### Checklist

- [ ] `any` = 0 или осознанный минимум
- [ ] нет `any` в public props/emits/composable returns

---

## Шаг 12. Прогнать quality gates

```bash
npm run typecheck
npm run lint
npm run build
```

### Checklist

- [ ] typecheck проходит
- [ ] lint проходит
- [ ] build проходит
- [ ] app всё ещё работает в runtime

---

## Шаг 13. Документировать type decisions

В коротком `TYPES.md` или комментарии в `src/types/product.ts` ответь:

1. Где использован `type`, где `interface` и почему
2. Где нужен generic
3. Как парсятся API responses
4. Какие types переедут в router/store later

Не нужен длинный essay — 8–15 строк достаточно.

### Checklist

- [ ] можешь объяснить свои type decisions без подсказок

---

## Шаг 14. Финальная самопроверка

Ответь устно/письменно:

1. Чем type-based props лучше untyped props?
2. Как читается `select: [id: number]`?
3. Почему filters принимают `Ref<Product[]>`?
4. Почему `as Product[]` недостаточно для API?
5. Когда generics полезны, а когда рано?
6. Как типизировать `route.params.id` правильно?

### Checklist

- [ ] ответы даются без страха и без `any`-оправданий

---

## Финальный checklist Module 4

Module 4 можно считать завершённым, если:

### Проект

- [ ] один существующий проект переведён в строгий TS-режим usage
- [ ] модели данных описаны отдельно
- [ ] app собирается и работает

### Технические требования

- [ ] ключевые props типизированы
- [ ] ключевые emits типизированы
- [ ] composables типизированы
- [ ] API-ответы/сущности вынесены и парсятся отдельно
- [ ] `any` сведён к нулю или осознанному минимуму
- [ ] есть хотя бы один понятный generic use-case **или** осознанный отказ с объяснением

### Понимание

- [ ] можешь объяснить `type` vs `interface` на своих examples
- [ ] понимаешь role generics
- [ ] понимаешь bridge types для store/router

---

## Stretch goals *(optional)*

- Zod schema вместо manual parse
- `ProductDto` + mapper на «грязном» mock API
- generic `useFetch<T>`
- подключить `vue-tsc` в CI mindset script
- typed Pinia store уже использовать в page
- набросать router pages types для `/products/:id`

---

## Если что-то пошло не так

### Types есть, но template не ругается

- проверь Vue - Official / Volar
- проверь `lang="ts"`
- запусти `vue-tsc`

### Слишком много type errors сразу

- иди слоями: types → props → emits → composables → API
- не чини всё хаотично

### Parse кажется слишком длинным

- начни с одного `parseProducts`
- не пиши universal validation framework

### Хочется всё сделать generic

- остановись
- сначала конкретный `Product`
- generic только после повторения паттерна

---

## Что делать после Module 4

Переходи к **Module 5 · Маршрутизация**:

- [Vue Router 4](../module-5/01-vue-router-4.md)
- [практический checklist Module 5](../module-5/12-practice-checklist.md) *(после теории)*
- pages / dynamic routes
- `useRoute` / `useRouter`
- lazy loading

Твои `Product`, `SortBy`, `parseRouteParamId` пригодятся сразу.

---

## Мини-конспект

- Module 4 = strict TypeScript для реального Vue app
- цель — types as design tool, не декорация
- props + emits + models + API parse = minimum bar
- `any` почти всегда сигнал незаконченной модели
- store/router types можно подготовить заранее
