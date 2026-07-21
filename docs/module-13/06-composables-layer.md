# Module 13 · Теория: слой composables

Этот материал закрывает шестой теоретический пункт Module 13: **слой composables** — где жить `use*`, чем composable отличается от store/api/component, правила размера и как не собрать god-composable в catalog app.

Связанные материалы:

- [Module 13 · слой API](./05-api-layer.md)
- [Module 10 · composables reuse](../module-10/05-composables-reuse-layer.md)
- [Module 4 · typing composables](../module-4/03-typing-composables.md)

---

## 1. Composable — что это в архитектуре

```text
Composable = функция useX(), которая инкапсулирует
  stateful logic + Vue primitives (ref/computed/watch)
  для переиспользования между компонентами
```

| Это composable | Это не composable |
|----------------|-------------------|
| `useDisclosure` | `formatPrice` (pure → `shared/lib`) |
| `useCatalogFilters` | `fetchProducts` (api → entity api) |
| `useProductQuery` | `ProductCard.vue` (UI) |
| `useAddToCart` | CSS utility |

```text
lib/utils     → чистые функции, без ref
api           → async I/O, без Vue
composables   → Vue reactivity + orchestration
stores        → shared client state across app (Pinia)
components    → template + тонкий glue
```

---

## 2. Куда класть composables (по слоям)

```text
shared/composables/     useDisclosure, useToast, useMediaQuery
entities/product/       useProductQuery, useProductDetailQuery
features/catalog/       useCatalogFilters, useProductSearch
features/cart/          useAddToCart
features/auth/          useRequireAuth
```

**Правило размещения = правило слоя** ([урок 03](./03-shared-ui-entities-features-pages.md)):

| Вопрос | Папка |
|--------|--------|
| Нет домена catalog? | `shared/composables` |
| Только Product server state? | `entities/product` |
| Сценарий фильтров/логина? | `features/...` |

```text
❌ src/composables/ со всем подряд на 40 файлов
   (снова type-based свалка)
```

Исключение: пока файлов < 5 — временная `shared/composables` ок; потом разнеси по feature/entity.

---

## 3. Типы composables в catalog

### A. UI primitives (shared)

```ts
// shared/composables/useDisclosure.ts
export function useDisclosure(initial = false) {
  const isOpen = ref(initial)
  const open = () => { isOpen.value = true }
  const close = () => { isOpen.value = false }
  const toggle = () => { isOpen.value = !isOpen.value }
  return { isOpen, open, close, toggle }
}
```

### B. Query wrappers (entity)

```ts
// entities/product/queries/useProductListQuery.ts
export function useProductListQuery(filters: MaybeRef<ProductFilters>) {
  return useQuery({
    queryKey: computed(() => productKeys.list(toValue(filters))),
    queryFn: ({ signal }) => fetchProducts(toValue(filters), signal),
  })
}
```

Тонкая обёртка над api + keys — не дублируй `useQuery` options в каждом page.

### C. Feature orchestration

```ts
// features/cart/add-to-cart/useAddToCart.ts
export function useAddToCart() {
  const cart = useCartStore()
  const toast = useToast()

  function add(product: Product) {
    cart.addItem(product)
    toast.push({ type: 'success', message: 'Added to cart' })
  }

  return { add }
}
```

Склеивает store + toast — **сценарий**, не «ещё один store».

### D. Local page/feature state

```ts
// features/catalog/product-filters/useCatalogFilters.ts
export function useCatalogFilters() {
  const category = ref('all')
  const sort = ref<'price' | 'name'>('price')
  const filters = computed(() => ({
    category: category.value,
    sort: sort.value,
  }))
  return { category, sort, filters }
}
```

Не обязательно Pinia, если state **не** нужен вне catalog feature.

---

## 4. Composable vs Pinia store

| | Composable | Pinia store |
|---|------------|-------------|
| Scope | вызов в компоненте / feature | app-wide singleton |
| Share state | каждый вызов — **новый** state* | один instance |
| Когда | local UI, query hooks, glue | cart, auth session |
| SSR/tests | easy withSetup | setActivePinia |

\*кроме pattern с module-level state (toast queue) — документируй явно.

```text
Cart items → Pinia (useCartStore)
Filter draft на /catalog → useCatalogFilters composable
Product list cache → vue-query (не Pinia)
```

Подробнее stores — [урок 07](./07-stores-layer.md).

---

## 5. Правила хорошего composable

```text
1. Имя use*
2. Возвращай объект API (не «массив из 12 refs» без имён)
3. Один composable — одна ответственность
4. Принимай MaybeRef / Ref где нужно реактивно следить
5. Не скрывай половину app (god composable)
6. Side effects — явны (или в watch с cleanup)
```

```ts
// ✅ ясный API
return { isOpen, open, close, toggle }

// ❌
return [isOpen, open, close, toggle, meta, flags, internal]
```

Typed return — Module 4.

---

## 6. God composable — антипаттерн

```ts
// ❌ useCatalogPage.ts
export function useCatalogPage() {
  // filters + query + cart + auth + seo + analytics + modal
}
```

```text
Симптомы:
- 300+ строк
- импортирует 5 stores
- нельзя переиспользовать кусок
- тесты — боль
```

**Режь:**

```text
useCatalogFilters
useProductListQuery
useAddToCart
→ page/feature склеивает вызовы
```

```vue
<script setup lang="ts">
const { filters, category, sort } = useCatalogFilters()
const { data: products, isPending } = useProductListQuery(filters)
const { add } = useAddToCart()
</script>
```

Composable **не заменяет** тонкий page — page остаётся местом композиции.

---

## 7. Зависимости composable

```text
shared composable     → только shared (lib, ui types)
entity composable     → entity api, shared
feature composable    → entities, shared, own store
```

```ts
// ❌ shared/composables/useAuthRedirect.ts
import { useAuthStore } from '@/features/auth' // shared → feature
```

Тогда это **`features/auth/useRequireAuth`**, не shared.

---

## 8. Cleanup и lifecycle

```ts
export function useProductSearch(query: Ref<string>) {
  const debounced = ref(query.value)
  let timer: ReturnType<typeof setTimeout> | undefined

  watch(query, (q) => {
    clearTimeout(timer)
    timer = setTimeout(() => { debounced.value = q }, 300)
  })

  onScopeDispose(() => clearTimeout(timer))

  return { debounced }
}
```

```text
watch / event listeners / intervals → dispose
иначе утечки при смене route
```

`effectScope` — advanced; обычно хватает `onScopeDispose` внутри composable, вызванного в `setup`.

---

## 9. Public API feature и composables

```ts
// features/catalog/index.ts
export { useCatalogFilters } from './product-filters/useCatalogFilters'
export { ProductFilters } from './product-filters/ProductFilters.vue'
```

Снаружи:

```ts
import { useCatalogFilters, ProductFilters } from '@/features/catalog'
```

Не экспортируй internal helpers (`useInternalFlag`).

---

## 10. Тестирование

Module 11:

```ts
// withSetup(useDisclosure) → open/close
// useCartStore → Pinia tests
// useProductListQuery → mock fetchProducts
```

Composable с только pure computed + refs — unit без mount.  
С компонентной связкой — component test.

---

## 11. Catalog: карта composables

```text
shared/composables/
  useDisclosure.ts
  useToast.ts

entities/product/
  useProductListQuery.ts
  useProductDetailQuery.ts

features/catalog/
  useCatalogFilters.ts

features/cart/
  useAddToCart.ts

features/auth/
  useRequireAuth.ts
```

Pages **вызывают** эти `use*`, не определяют локально 200 строк logic (кроме совсем одноразового glue).

---

## 12. Частые ошибки

### `composables/` свалка type-based

Снова Module 01 проблема.

### Composable = весь page

God object.

### Pure util под видом `useFormatPrice`

Нет reactivity → `formatPrice` в lib.

### Composable создаёт store на каждый вызов неправильно

`defineStore` снаружи; внутри только `useCartStore()`.

### Скрытый import route/router везде

```ts
useRoute() внутри shared useX — привязка к Vue Router
```

Ок в feature; передавай `productId` аргументом, если можно.

### Mutable module state без документирования

Toast queue — ok, но `beforeEach` reset в тестах.

---

## 13. Что важно понять после этого блока

Проверь себя:

1. Чем composable отличается от `shared/lib`?
2. Куда: `useToast` vs `useAddToCart` vs `useProductQuery`?
3. Когда Pinia вместо composable state?
4. Признаки god composable?
5. Почему shared не импортирует feature store?
6. Зачем `onScopeDispose`?

---

## 14. Что почитать

### Официальное

- [Composables · Vue Guide](https://vuejs.org/guide/reusability/composables.html)

### Связанные материалы этого плана

- [Module 10 · composables reuse](../module-10/05-composables-reuse-layer.md)
- [Module 11 · composables testing](../module-11/05-composables-testing.md)
- [Module 13 · API layer](./05-api-layer.md)

---

## 15. Практическое мини-задание

1. Инвентарь всех `use*` — разложи по shared/entity/feature.
2. Вынеси filters из CatalogPage в `useCatalogFilters`.
3. Разрежь один god composable (если есть) на 2–3.
4. `useAddToCart`: store + toast, button только вызывает `add`.
5. Добавь dispose для debounce/search, если его не было.

---

## 16. Мини-конспект

- composable = **Vue stateful logic** с `use*` API
- клади по **слоям**, не в одну папку навсегда
- query wrappers / feature glue / shared UI — разные дома
- не god-composable; page композирует несколько `use*`
- cleanup side effects; тесты Module 11
- дальше — **слой stores**

---

## 17. Что делать дальше

Следующий теоретический блок Module 13:

- [Слой stores](./07-stores-layer.md)
