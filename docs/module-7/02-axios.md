# Module 7 · Теория: `axios`

Этот материал закрывает второй теоретический пункт `Module 7`: понять, **что даёт axios**, **чем он отличается от `fetch`**, **как завести instance**, и **когда его выбирать**.

Связанные материалы:

- [Module 7 · fetch](./01-fetch.md)
- [Module 4 · typing API responses](../module-4/05-typing-api-responses.md)

---

## 1. Что такое axios

**axios** — популярная Promise-based HTTP-библиотека для браузера и Node.

```bash
npm install axios
```

```ts
import axios from 'axios'

const { data } = await axios.get('https://dummyjson.com/products')
```

Официально:

- [Axios · Getting Started](https://axios-http.com/docs/intro)
- [Axios API](https://axios-http.com/docs/api_intro)

В отличие от `fetch`, это **зависимость** в `package.json`, не встроенный API платформы.

---

## 2. `fetch` vs `axios` — главное

| | `fetch` | `axios` |
|---|---------|---------|
| Установка | встроена | `npm i axios` |
| JSON body | `JSON.stringify` + header вручную | объекты в `data` сериализует сам |
| Чтение JSON | `await response.json()` | `response.data` уже готово |
| HTTP 404/500 | Promise **resolve**, сам проверяй `ok` | Promise **reject** (по умолчанию) |
| Timeout | руками / AbortSignal | `timeout` в config |
| Upload progress | сложнее | удобные hooks |
| Interceptors | свои обёртки | встроенные |
| Размер бандла | 0 | +библиотека |

Оба нормальны. Module 7 учит **понимать оба**; в проекте обычно выбирают один default-клиент.

---

## 3. Базовые запросы

```ts
import axios from 'axios'

// GET
const productsRes = await axios.get('/api/products')
productsRes.data

// GET with query
await axios.get('/api/products', {
  params: { limit: 10, skip: 0 },
})

// POST
await axios.post('/api/products', {
  title: 'Phone',
  price: 100,
})

// PUT / PATCH / DELETE
await axios.put('/api/products/1', { title: 'New' })
await axios.patch('/api/products/1', { price: 90 })
await axios.delete('/api/products/1')
```

`params` → query string (`?limit=10&skip=0`) — удобнее, чем руками клеить URL (глубже в уроке query params).

---

## 4. Форма ответа

```ts
const response = await axios.get(url)

response.data      // тело (часто уже object)
response.status    // 200
response.statusText
response.headers
response.config
```

Для UI почти всегда нужен `response.data`.

```ts
const data: unknown = (await axios.get(url)).data
const products = parseProducts(data)
```

Типизация «вслепую» через `axios.get<Product[]>` **не проверяет** runtime shape — parse всё равно желателен (Module 4).

---

## 5. Ошибки: важное отличие от fetch

```ts
try {
  await axios.get('/api/missing')
} catch (e) {
  if (axios.isAxiosError(e)) {
    console.log(e.response?.status) // 404
    console.log(e.response?.data)
    console.log(e.message)
  }
}
```

По умолчанию статусы **вне** 2xx → rejected Promise.
Поэтому `try/catch` вокруг axios естественнее, чем забытый `response.ok` у fetch.

Настройку `validateStatus` можно менять — для старта оставь default.

Подробная стратегия ошибок — следующий урок; здесь зафиксируй разницу.

---

## 6. Instance — правильный default для app

Не разбрасывай `axios.get('https://…')` с полным URL везде.

```ts
// src/api/client.ts
import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  timeout: 10_000,
  headers: {
    Accept: 'application/json',
  },
})
```

```ts
// src/api/products.ts
import { api } from './client'
import { parseProducts, type Product } from '@/types/product'

export async function fetchProducts(): Promise<Product[]> {
  const { data } = await api.get('/products')
  return parseProducts(data as unknown)
}
```

Плюсы instance:

- один `baseURL`
- общий `timeout`
- общие default headers
- место для interceptors

---

## 7. Interceptors (идея)

```ts
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') // или auth store
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // централизованный лог / normalize error
    return Promise.reject(error)
  },
)
```

Request interceptor — подставить auth.
Response interceptor — единый разбор ошибок / refresh token (advanced).

Не обязательно на первом pet-project; важно знать, **зачем** instance существует.

---

## 8. Timeout и отмена (preview)

```ts
await api.get('/products', { timeout: 5000 })
```

Отмена:

```ts
const controller = new AbortController()
api.get('/products', { signal: controller.signal })
controller.abort()
```

axios также имеет свой `CancelToken` (legacy) — для нового кода предпочитай `AbortController` / `signal`.
Детали — урок **отмена запросов**.

---

## 9. Когда брать axios, когда fetch

### Достаточно `fetch`

- маленький app / мало запросов
- не хочешь зависимость
- уже есть тонкий `httpJson` wrapper
- учебный фокус на платформенном API

### Удобнее axios

- много endpoints, нужен `baseURL` + interceptors
- часто POST JSON / upload
- хочешь timeout из коробки
- команда уже на axios
- меньше шансов забыть проверку HTTP status

### Для Module 7 practice

Выбери **один** клиент и держи все запросы через `src/api/*`.
Переписывать весь catalog на оба — не цель; цель — понимать trade-offs.

---

## 10. Связка с Vue слоями

Тот же каркас, что у fetch:

```text
Page / composable
  → api/products.ts
      → api/client.ts (axios instance)
          → network
```

Не вызывай `axios.get` из десяти components с разными base URL.

Pinia action может вызывать `fetchProducts()` из api — не обязательно знать, fetch это или axios внутри.

---

## 11. Частые ошибки

### `axios.get` + ручной `JSON.stringify` как у fetch

Для обычного JSON object в `data` не нужен.

### Путать `response` и `response.data`

UI получит axios envelope вместо payload.

### `get<Product[]>()` без parse

Типы соврали — runtime другой.

### Много разных `axios.create` без нужды

Один app client + редкие exceptions.

### Тащить axios только «потому что все так делают»

Если wrapper на fetch уже закрывает needs — ок остаться на fetch.

---

## 12. Что важно понять после этого блока

Проверь себя:

1. Чем `response.data` axios отличается от `fetch` + `json()`?
2. Почему 404 у axios чаще в `catch`?
3. Зачем `axios.create`?
4. Что делают interceptors на уровне идеи?
5. Когда fetch предпочтительнее?
6. Где в проекте должен жить axios instance?

---

## 13. Что почитать

### Официальное

- [Intro](https://axios-http.com/docs/intro)
- [Axios Instance](https://axios-http.com/docs/instance)
- [Interceptors](https://axios-http.com/docs/interceptors)
- [Handling Errors](https://axios-http.com/docs/handling_errors)

### Связанные материалы этого плана

- [Module 7 · fetch](./01-fetch.md)

---

## 14. Практическое мини-задание

1. Установи axios, создай `src/api/client.ts` с `baseURL` + `timeout`
2. Перепиши `fetchProducts` на `api.get`
3. Обработай ошибку через `axios.isAxiosError`
4. Добавь `params: { limit: 10 }` и проверь query в Network
5. В заметке: 3 пункта «почему я остаюсь на axios / fetch в этом проекте»

---

## 15. Мини-конспект

- axios = HTTP-клиент с `data`, авто-JSON, reject на bad status
- `axios.create` → единый client app
- interceptors — auth и централизованные ошибки
- fetch не «хуже»; выбирай осознанно, держи api-слой стабильным
- дальше — **обработка ошибок** как отдельная дисциплина

---

## 16. Что делать дальше

Следующий теоретический блок Module 7:

- [обработка ошибок](./03-error-handling.md)
