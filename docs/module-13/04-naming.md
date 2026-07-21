# Module 13 · Теория: подходы к naming

Этот материал закрывает четвёртый теоретический пункт Module 13: **naming** — файлы, папки, компоненты, composables, stores, query keys и API — единые правила, чтобы catalog оставался читаемым при росте.

Связанные материалы:

- [Module 13 · слои](./03-shared-ui-entities-features-pages.md)
- [Module 13 · feature-based](./02-feature-based.md)

---

## 1. Зачем naming — часть архитектуры

```text
Хорошая папка + плохое имя  → всё равно «где это?»
Плохая папка + хорошее имя → grep спасает, структура нет
Оба хорошие                → onboarding за минуты
```

Naming отвечает на:

1. **Что это?** (Button vs ProductCard)
2. **Где искать?** (соглашение = предсказуемый путь)
3. **Как импортировать?** (без угадывания `Cart` vs `useCart` vs `cartStore`)

Ориентиры:

- [Vue Style Guide · Component names](https://vuejs.org/style-guide/rules-essential.html#use-multi-word-component-names)
- [Vue Style Guide · Strongly recommended](https://vuejs.org/style-guide/rules-strongly-recommended.html)

---

## 2. Принципы (коротко)

| Принцип | Пример |
|---------|--------|
| **Полные слова** | `ProductCard`, не `PCard` / `ProdC` |
| **Доменный язык** | `CartLine`, не `Item2` |
| **Один стиль на тип** | все stores `useXStore` |
| **Имя = роль** | `LoginPage` ≠ `Login` |
| **Избегай generic** | не `Data`, `Helper`, `Manager`, `Utils` без уточнения |
| **EN для кода** | UI copy может быть RU; идентификаторы — EN |

```text
Плохо:  utils.ts, helpers.ts, common.ts, stuff.ts
Лучше:  formatPrice.ts, parseProduct.ts, debounce.ts
```

---

## 3. Vue-компоненты

### Multi-word (Vue essential)

```text
✅ ProductCard, BaseButton, CartBadge
❌ Card, Button, Badge   (конфликт с HTML / неясность)
```

Исключение: корневой `App.vue`.

### Префиксы по слою

| Слой | Префикс / суффикс | Пример |
|------|-------------------|--------|
| `shared/ui` | `Base*` или `Ui*` | `BaseModal`, `UiTextField` |
| Entity UI | Entity name | `ProductCard`, `ProductPrice` |
| Feature UI | Feature + роль | `AddToCartButton`, `CartDrawer` |
| Page | `*Page` | `CatalogPage`, `LoginPage` |
| Layout | `*Layout` / `App*` | `AppLayout`, `CatalogLayout` |

Выбери **один** префикс для shared (`Base` **или** `Ui`) — не мешай оба.

### Файл = компонент

```text
ProductCard.vue          → export ProductCard
AddToCartButton.vue      → AddToCartButton
CatalogPage.vue          → CatalogPage
```

PascalCase для `.vue` файлов — стандарт Vue/Vite.

---

## 4. Папки и features

```text
features/
  cart/
    add-to-cart/         # kebab-case папки сценариев
    cart-badge/
  catalog/
    product-filters/
```

```text
✅ kebab-case для папок: product-filters, add-to-cart
✅ PascalCase для .vue внутри
❌ ProductFilters/ рядом с product-filters/ (два стиля)
```

**Feature folder name** = домен или сценарий, не техника:

```text
✅ features/auth
❌ features/pinia-stores
❌ features/composables
```

---

## 5. Composables

```text
use + Thing + optional role
```

| Имя | Смысл |
|-----|--------|
| `useCartStore` | Pinia store (часто так именуют) |
| `useDisclosure` | shared UI open/close |
| `useProductQuery` | vue-query wrapper |
| `useAddToCart` | feature action |
| `useCatalogFilters` | local filter state |

```text
✅ useX — всегда функция, возвращает API
❌ cartComposable.ts
❌ getCart() как composable с refs внутри без use*
```

Файл:

```text
useDisclosure.ts
useProductQuery.ts
useCartStore.ts
```

---

## 6. Pinia stores

```ts
export const useCartStore = defineStore('cart', () => { … })
export const useAuthStore = defineStore('auth', () => { … })
```

| Правило | Пример |
|---------|--------|
| id store — короткий kebab/camel | `'cart'`, `'auth'` |
| composable name — `use*Store` | `useCartStore` |
| файл рядом с feature | `features/cart/model/useCartStore.ts` |
| не `StoreCart` / `cartStore` export | единообразие |

Getters/actions — глаголы / существительные ясно:

```ts
addItem, removeItem, clear, totalItems, isEmpty
// не: doStuff, handle, process
```

---

## 7. API, parse, query keys

```text
entities/product/api/
  fetchProducts.ts      # глагол + entity
  fetchProductById.ts
  parseProduct.ts       # parse + entity
```

```ts
// productKeys.ts
export const productKeys = {
  all: ['products'] as const,
  list: (filters: ProductFilters) => ['products', 'list', filters] as const,
  detail: (id: string) => ['products', 'detail', id] as const,
}
```

```text
✅ productKeys.list(filters)
❌ ['p', filters]
❌ queryKey1
```

HTTP client:

```text
shared/api/http.ts       # или createHttpClient.ts
shared/api/types.ts      # ApiError — ok если shared
```

---

## 8. Types и schemas

```ts
// types
Product, ProductId, CartLine, UserSession

// schemas (zod)
productSchema, loginSchema
// или ProductSchema — выбери один case для schema exports
```

```text
✅ type Product — noun
✅ ProductDto — если отдельно wire format
❌ IProduct, TProduct — венгерская нотация редко нужна в TS
❌ productType — путается с runtime
```

Файл:

```text
model/types.ts
model/schemas.ts
```

Не `interfaces.ts` vs `types.ts` без правила — достаточно `types.ts`.

---

## 9. Events, props, CSS

### Emits / props

```ts
defineEmits<{
  add: [product: Product]
  'update:modelValue': [value: string]
}>()
```

```text
✅ add, remove, submit, close
❌ handleClick, clickHandler (это имена методов, не событий)
```

Props: то же, что в template — `productId`, `isOpen`, `showBadge`.

### CSS / BEM (если используешь)

```text
.product-card { }
.product-card__title { }
.product-card--featured { }
```

Или scoped без BEM — но **класс ≈ компонент**, не `.box1`.

---

## 10. Tests и fixtures

```text
ProductCard.spec.ts      # рядом с компонентом
useCartStore.test.ts
product.fixture.ts       # или __fixtures__/product.ts
```

```ts
it('shows validation error when email is empty', …)
// не: it('works'), it('test1')
```

Имена тестов = **поведение** (Module 11).

---

## 11. Barrel `index.ts`

```ts
// features/cart/index.ts
export { CartBadge } from './ui/CartBadge.vue'
export { useCartStore } from './model/useCartStore'
```

```text
✅ короткий public surface
❌ export * from './ui'  — тянет internals и ломает tree-shake иногда
```

Имя папки feature = имя импорта:

```ts
import { CartBadge } from '@/features/cart'
```

---

## 12. Catalog: шпаргалка имён

| Артефакт | Имя |
|----------|-----|
| Page | `CatalogPage.vue` |
| Entity card | `ProductCard.vue` |
| Shared button | `BaseButton.vue` |
| Feature action UI | `AddToCartButton.vue` |
| Store | `useCartStore` / id `'cart'` |
| Query | `useProductQuery` + `productKeys` |
| Fetch | `fetchProducts` |
| Parse | `parseProduct` |
| Util | `formatPrice` |
| Schema | `loginSchema` |
| Feature folder | `features/cart/add-to-cart/` |

---

## 13. Анти-паттерны naming

| Плохо | Почему | Лучше |
|-------|--------|--------|
| `Component.vue` | ничего не говорит | роль + домен |
| `NewProductCard2.vue` | временное вечное | удали старый |
| `temp`, `fix`, `old` | | git history |
| `data.ts` | | `product.types.ts` / `types.ts` в entity |
| `helpers/cartHelpers.ts` | | `lib/cartTotals.ts` |
| смешение `Base` + `App` + `Ui` + `V` | хаос | один префикс shared |
| RU транслит `KorzinaBadge` | | `CartBadge` |

---

## 14. Документ правил (для практики Module 13)

Короткий `docs/ARCHITECTURE.md` или раздел:

```markdown
## Naming
- Pages: *Page.vue
- Shared UI: Base*
- Composables: use*
- Stores: use*Store, id short english
- Folders: kebab-case
- Vue files: PascalCase
```

Правила **короткие** > роман на 20 страниц.

---

## 15. Что важно понять после этого блока

Проверь себя:

1. Почему multi-word component names?
2. `BaseButton` vs `ProductCard` — разница префикса?
3. Как назвать composable для фильтров catalog?
4. Pinia: id vs export name?
5. Почему не `utils.ts`?
6. Что писать в `it('…')`?

---

## 16. Что почитать

### Официальное

- [Vue Style Guide](https://vuejs.org/style-guide/)
- [Component names](https://vuejs.org/style-guide/rules-essential.html#use-multi-word-component-names)

### Связанные материалы этого плана

- [Module 13 · слои](./03-shared-ui-entities-features-pages.md)
- [Module 11 · testing philosophy](../module-11/09-testing-philosophy.md)

---

## 17. Практическое мини-задание

1. Пройди `src/` — выпиши 5 плохих имён.
2. Переименуй shared buttons к одному префиксу (`Base*` или `Ui*`).
3. Stores → все `use*Store`; ids короткие.
4. Query keys объект `productKeys` с `list`/`detail`.
5. Черновик 8 строк Naming в `ARCHITECTURE.md`.

---

## 18. Мини-конспект

- naming = предсказуемость поиска
- **PascalCase** `.vue`, **kebab-case** папки, **`use*`** composables
- префиксы по слою: `Base*` / entity / `*Page`
- глаголы API, nouns types, behavior test names
- один стиль > идеальный стиль
- дальше — **слой API**

---

## 19. Что делать дальше

Следующий теоретический блок Module 13:

- [Слой API](./05-api-layer.md)
