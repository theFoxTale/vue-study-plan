# Module 7 · Теория: `fetch`

Этот материал открывает **Module 7** и закрывает первый теоретический пункт: понять, **как делать HTTP-запросы через Fetch API**, **как читать Response**, и **куда класть fetch в Vue-проекте** (не в каждый template-handler хаотично).

Связанные материалы:

- [Module 6 · practice checklist](../module-6/10-practice-checklist.md)
- [Module 4 · typing API responses](../module-4/05-typing-api-responses.md)
- [Module 6 · actions](../module-6/07-actions.md)

---

## 1. Зачем Module 7 после Pinia

Module 6 закрыл **client state** (cart, auth session, UI shared facts).

Module 7 — про **данные с сервера**:

```text
список products / users
карточка по id
поиск
пагинация
ошибки сети и HTTP
```

Важно не смешать:

| | Client state | Server data |
|---|--------------|-------------|
| Источник правды | UI / сессия браузера | backend |
| Примеры | cart lines, `isModalOpen` | `Product[]` с API |
| Типичный дом | Pinia / local | fetch → page/composable/api module |

Pinia **может** держать результат запроса, но fetch ≠ «всё в store». Сначала освой сам запрос.

Официально (Fetch):

- [MDN · Using Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)
- [MDN · fetch()](https://developer.mozilla.org/en-US/docs/Web/API/fetch)

---

## 2. Что такое `fetch`

`fetch(url, options?)` — встроенный браузерный API. Возвращает **Promise\<Response\>**.

```ts
const response = await fetch('https://api.example.com/products')
const data = await response.json()
```

По умолчанию — `GET`.
Тело и заголовки — через второй аргумент.

`fetch` есть в современных браузерах и в Vite-dev без установки пакета.
(Node 18+ тоже имеет global `fetch`.)

---

## 3. Минимальный GET

```ts
async function loadProducts() {
  const response = await fetch('/api/products')

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  const data: unknown = await response.json()
  return data
}
```

Ключевые моменты:

1. `await fetch` — ещё не «данные», а **Response**
2. `response.ok` — статус 200–299; иначе сам `fetch` **не throw'ит** на 404/500
3. `response.json()` — ещё один async parse body
4. тип с сервера сначала `unknown` → потом parse (Module 4)

---

## 4. Объект `Response` (что читать)

| Поле / метод | Смысл |
|--------------|--------|
| `ok` | `true` при 200–299 |
| `status` | `200`, `404`, `500`, … |
| `statusText` | текстовая метка |
| `headers` | заголовки ответа |
| `json()` | parse JSON body |
| `text()` | raw text |
| `blob()` | файлы |

```ts
const response = await fetch(url)
console.log(response.status, response.ok)
const json = await response.json()
```

Нельзя вызвать `json()` дважды на одном body — stream читается один раз.

---

## 5. Options: method, headers, body

```ts
await fetch('/api/products', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  body: JSON.stringify({ title: 'Phone', price: 100 }),
})
```

| Option | Зачем |
|--------|------|
| `method` | `GET` / `POST` / `PUT` / `PATCH` / `DELETE` |
| `headers` | content-type, auth, accept |
| `body` | строка / FormData / Blob (не объект напрямую) |
| `signal` | AbortController — урок **отмена запросов** |
| `credentials` | cookies cross-origin при необходимости |

Для JSON всегда:

```ts
body: JSON.stringify(payload)
headers: { 'Content-Type': 'application/json' }
```

---

## 6. Типичный wrapper для catalog

```ts
// src/api/http.ts
export class HttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: unknown,
  ) {
    super(message)
    this.name = 'HttpError'
  }
}

export async function httpJson<T = unknown>(
  input: RequestInfo,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, init)

  const contentType = response.headers.get('content-type') ?? ''
  const isJson = contentType.includes('application/json')
  const body = isJson ? await response.json() : await response.text()

  if (!response.ok) {
    throw new HttpError(`HTTP ${response.status}`, response.status, body)
  }

  return body as T // ещё лучше: вернуть unknown и парсить снаружи
}
```

На старте Module 7 можно проще; идея — **один** способ ходить в сеть.

```ts
// src/api/products.ts
import { httpJson } from './http'
import { parseProducts, type Product } from '@/types/product'

export async function fetchProducts(): Promise<Product[]> {
  const data: unknown = await httpJson('/api/products')
  return parseProducts(data)
}

export async function fetchProductById(id: string): Promise<Product> {
  const data: unknown = await httpJson(`/api/products/${id}`)
  return parseProduct(data)
}
```

Page/composable вызывает `fetchProducts()`, а не сырой `fetch` в пяти местах.

---

## 7. Где вызывать в Vue

### ✅ Хорошие места

- `src/api/*` — сами запросы
- composable `useProducts()` — orchestration + loading state *(урок про состояния)*
- page `onMounted` / `watch(route.params)` — когда грузить
- Pinia action — если результат реально shared client cache *(осторожно)*

### ❌ Плохие места

- прямо в template `@click` с огромным fetch+parse
- copy-paste `fetch` в каждом component
- без проверки `response.ok`

```vue
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { fetchProducts } from '@/api/products'
import type { Product } from '@/types/product'

const products = ref<Product[]>([])
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    products.value = await fetchProducts()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load'
  }
})
</script>
```

Состояния loading/empty — следующий отдельный урок; здесь важен сам fetch + api module.

---

## 8. Учебные API для практики

Удобные публичные API (могут менять лимиты/CORS):

- [JSONPlaceholder](https://jsonplaceholder.typicode.com/) — users/posts
- [DummyJSON](https://dummyjson.com/) — products/search
- [Fake Store API](https://fakestoreapi.com/) — products

Пример:

```ts
const data = await fetch('https://dummyjson.com/products')
```

Для своего Vite app часто делают proxy в `vite.config` или mock в `/public` — не обязательно на первом шаге.

---

## 9. CORS и почему «в браузере не работает»

Если API не разрешил origin — браузер заблокирует ответ.

Симптомы: ошибка CORS в консоли, `fetch` reject.

Варианты:

- dev proxy Vite
- backend с правильными CORS headers
- свой BFF

Это не баг Vue — ограничение браузера.

---

## 10. `fetch` vs то, что будет дальше

| Тема | Этот урок | Дальше Module 7 |
|------|-----------|-----------------|
| Базовый GET/JSON | ✅ | |
| axios | | отдельный урок |
| единый error UX | кратко | **обработка ошибок** |
| loading/empty | намёк | **состояния** |
| `?page=` | | query params / pagination |
| abort | `signal` упомянут | **отмена** |
| retries | | **повторные запросы** |
| data layer граница | намёк | финальный урок модуля |

---

## 11. Частые ошибки

### Игнорировать `!response.ok`

404 вернёт «успешный» Promise — пока сам не проверишь.

### `as Product[]` без parse

Ложное спокойствие TypeScript (Module 4).

### Fetch в десяти components

Потом менять base URL/headers — боль. Вынеси в `api/`.

### Класть каждый response в Pinia автоматически

Сначала page/composable; store — если реально shared.

### Ждать, что `fetch` throw на HTTP error

Throw чаще на network fail / CORS; HTTP status — через `ok`.

---

## 12. Что важно понять после этого блока

Проверь себя:

1. Что возвращает `fetch` до `.json()`?
2. Почему нужна проверка `response.ok`?
3. Как передать JSON в POST?
4. Почему ответ парсить как `unknown`?
5. Куда класть fetch в структуре проекта?
6. Чем server data отличается от cart в Pinia?

---

## 13. Что почитать

### Официальное / MDN

- [Using Fetch · MDN](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)
- [Response · MDN](https://developer.mozilla.org/en-US/docs/Web/API/Response)

### Связанные материалы этого плана

- [Module 4 · typing API responses](../module-4/05-typing-api-responses.md)
- [Module 6 · practice checklist](../module-6/10-practice-checklist.md)

---

## 14. Практическое мини-задание

1. Создай `src/api/products.ts` с `fetchProducts()`
2. Проверяй `response.ok`, иначе `throw`
3. Парсь через существующий `parseProducts` (или минимальный guard)
4. В `CatalogPage` загрузи список в `onMounted`
5. Покажи ошибку текстом, если запрос упал

---

## 15. Мини-конспект

- `fetch` → `Response` → `ok`? → `json()` → `unknown` → parse
- HTTP ошибки сами по себе не reject'ят Promise
- выноси запросы в `src/api/*`
- Module 7 дальше: axios, ошибки, UI-состояния загрузки, pagination, abort, retries, data layer

---

## 16. Что делать дальше

Следующий теоретический блок Module 7:

- **`axios`**

Сравним с `fetch`: API instance, interceptors-идея, когда axios удобнее.
