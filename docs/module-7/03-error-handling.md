# Module 7 · Теория: обработка ошибок

Этот материал закрывает третий теоретический пункт `Module 7`: понять, **какие бывают ошибки при работе с API**, **как их нормализовать**, и **как показывать пользователю** без хаоса в components.

Связанные материалы:

- [Module 7 · fetch](./01-fetch.md)
- [Module 7 · axios](./02-axios.md)
- [Module 4 · typing API responses](../module-4/05-typing-api-responses.md)

---

## 1. Зачем отдельный урок про ошибки

Запрос может «сломаться» на разных этапах:

```text
сеть / CORS / offline
   ↓
HTTP 4xx / 5xx
   ↓
тело не JSON
   ↓
JSON есть, но shape не тот (parse)
   ↓
бизнес-ошибка в 200 OK ({ success: false })
```

Если везде голый `catch (e) { alert(e) }` — UX и отладка страдают.

Цель:

```text
различать типы ошибок → единый формат → понятный UI / логи
```

---

## 2. Карта типов ошибок

| Тип | Пример | Как узнать |
|-----|--------|------------|
| **Network** | offline, DNS, CORS blocked | `fetch` reject; axios без `response` |
| **HTTP** | 401, 404, 500 | `!response.ok` / `error.response.status` |
| **Parse / protocol** | HTML вместо JSON | `response.json()` throw |
| **Validation** | поле `price` не number | твой `parseProduct` throw |
| **Business** | `{ error: 'Out of stock' }` при 200 | договор API |
| **Abort** | пользователь ушёл со страницы | `error.name === 'AbortError'` / `axios.isCancel` |

Abort часто **не показывают** как ошибку UI — это отмена, не failure (урок про отмену).

---

## 3. Нормализация: один тип для UI

Заведи свой error shape — UI не обязан знать fetch vs axios.

```ts
// src/api/errors.ts
export type AppErrorCode =
  | 'network'
  | 'http'
  | 'parse'
  | 'validation'
  | 'business'
  | 'aborted'
  | 'unknown'

export type AppError = {
  code: AppErrorCode
  message: string
  status?: number
  details?: unknown
  cause?: unknown
}

export function toAppError(e: unknown): AppError {
  if (isAppError(e)) return e

  if (e instanceof DOMException && e.name === 'AbortError') {
    return { code: 'aborted', message: 'Request aborted', cause: e }
  }

  // axios
  if (isAxiosErrorLike(e)) {
    if (!e.response) {
      return {
        code: 'network',
        message: 'Network error. Check your connection.',
        cause: e,
      }
    }
    return {
      code: 'http',
      status: e.response.status,
      message: messageFromHttp(e.response.status, e.response.data),
      details: e.response.data,
      cause: e,
    }
  }

  // fetch HttpError из твоего wrapper
  if (e instanceof HttpError) {
    return {
      code: 'http',
      status: e.status,
      message: messageFromHttp(e.status, e.body),
      details: e.body,
      cause: e,
    }
  }

  if (e instanceof SyntaxError) {
    return { code: 'parse', message: 'Invalid JSON from server', cause: e }
  }

  if (e instanceof Error) {
    return { code: 'unknown', message: e.message, cause: e }
  }

  return { code: 'unknown', message: 'Something went wrong', cause: e }
}

function messageFromHttp(status: number, body: unknown): string {
  if (status === 401) return 'Please sign in'
  if (status === 403) return 'Access denied'
  if (status === 404) return 'Not found'
  if (status >= 500) return 'Server error. Try again later'
  if (typeof body === 'object' && body && 'message' in body) {
    const m = (body as { message: unknown }).message
    if (typeof m === 'string') return m
  }
  return `Request failed (${status})`
}
```

Не копируй этот файл слепо — важна **идея**: UI получает `AppError`, а не сырой axios.

---

## 4. fetch: не забыть HTTP слой

```ts
const response = await fetch(url)
if (!response.ok) {
  let body: unknown
  try {
    body = await response.json()
  } catch {
    body = undefined
  }
  throw new HttpError(`HTTP ${response.status}`, response.status, body)
}
```

Без этого 404 «успешно» дойдёт до parse и даст странные ошибки validation.

---

## 5. axios: `isAxiosError`

```ts
import axios from 'axios'

try {
  await api.get('/products')
} catch (e) {
  const appError = toAppError(e)
  errorMessage.value = appError.message
  if (appError.code === 'aborted') return
}
```

```ts
if (axios.isAxiosError(e)) {
  // e.response, e.request, e.config
}
```

---

## 6. Parse / validation errors

```ts
export function parseProduct(data: unknown): Product {
  if (!data || typeof data !== 'object') {
    throw Object.assign(new Error('Invalid product'), {
      code: 'validation' as const,
    })
  }
  // ...
}
```

В `toAppError` распознай свой validation marker → `code: 'validation'`.

Пользователю: «Данные с сервера повреждены» / «Не удалось обработать ответ».
В dev — `console.error(details)`.

---

## 7. Что показывать в UI

| Ситуация | UI |
|----------|-----|
| Network | «Нет сети. Проверьте подключение.» + Retry |
| 404 list | empty/error: «Ничего не найдено» / «Список недоступен» |
| 404 detail | Not found page / сообщение + ссылка назад |
| 401 | «Войдите» + redirect login |
| 500 | «Сервер недоступен» + Retry |
| validation/parse | нейтральное сообщение; детали в console |
| aborted | ничего / тихо |

Не показывай сырой `JSON.stringify(error)` пользователю.

```vue
<p v-if="error" class="error" role="alert">
  {{ error.message }}
</p>
<button v-if="error && error.code !== 'aborted'" type="button" @click="reload">
  Retry
</button>
```

Полный набор loading/empty/success — следующий урок; error — одна из веток.

---

## 8. Где ловить ошибки

```text
api/products.ts
  throw HttpError / rethrow axios / throw validation

composable / page
  try/catch → toAppError → error ref

optional: axios response interceptor
  normalize → Promise.reject(appError)
```

Правило:

- **api** бросает/прокидывает техническое
- **UI-слой** решает, что показать
- не `alert` внутри `api/products.ts`

---

## 9. Логирование

```ts
function reportError(error: AppError) {
  if (import.meta.env.DEV) {
    console.error('[api]', error.code, error.message, error.cause)
  }
  // later: Sentry.captureException(error.cause)
}
```

В production пользователю — коротко; в telemetry — `cause` + status + url.

---

## 10. Частые ошибки

### Один `catch` на всё с `String(e)`

Потеряли статус и тип.

### Показывать Abort как failure

Мигающий red banner при быстром переключении страниц.

### Глотать ошибку пустым `catch {}`

Потом «просто пустой список» без причины.

### Дублировать разные тексты в каждом component

Вынеси `messageFromHttp` / `toAppError`.

### Путать empty и error

Пустой массив `[]` при 200 — это **empty**, не error.
`null` после 500 — error.
(Детали в уроке про состояния.)

---

## 11. Мини-паттерн для page

```ts
const products = ref<Product[]>([])
const error = ref<AppError | null>(null)

async function load() {
  error.value = null
  try {
    products.value = await fetchProducts()
  } catch (e) {
    const appError = toAppError(e)
    if (appError.code === 'aborted') return
    error.value = appError
    reportError(appError)
  }
}
```

---

## 12. Что важно понять после этого блока

Проверь себя:

1. Какие типы ошибок бывают при API-запросе?
2. Почему 404 у fetch легко пропустить?
3. Зачем `toAppError`?
4. Когда ошибку не показывают в UI?
5. Чем validation error отличается от network?
6. Где должен жить user-facing message — в api или в page?

---

## 13. Что почитать

### Официальное

- [MDN · fetch — Checking that the fetch was successful](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#checking_that_the_fetch_was_successful)
- [Axios · Handling Errors](https://axios-http.com/docs/handling_errors)

### Связанные материалы этого плана

- [Module 7 · fetch](./01-fetch.md)
- [Module 7 · axios](./02-axios.md)

---

## 14. Практическое мини-задание

1. Добавь `HttpError` или пользуйся axios errors + `toAppError`
2. Намеренно запроси несуществующий URL / id — покажи дружелюбный message
3. Отключи сеть (DevTools Offline) — отдельный текст для network
4. Сломай parse (подставь `{}` в parseProduct) — отдельный validation path
5. Кнопка Retry вызывает `load()` снова

---

## 15. Мини-конспект

- ошибки бывают network / HTTP / parse / validation / business / abort
- нормализуй в `AppError` для UI
- fetch: сам проверяй `ok`; axios: чаще `catch` + `isAxiosError`
- пользователю — коротко; abort — тихо; retry — почти всегда полезен
- дальше — полноценные UI-состояния загрузки

---

## 16. Что делать дальше

Следующий теоретический блок Module 7:

- **состояния `loading / error / success / empty`**

Соберём полный state machine экрана данных.
