# Module 9 · Теория: синхронная и асинхронная валидация

Этот материал закрывает шестой теоретический пункт `Module 9`: **sync vs async validation** — timing (blur/submit), async rules *(email unique)*, debounce, **server 422**, гонки запросов.

Связанные материалы:

- [Module 9 · Zod](./05-zod.md)
- [Module 9 · VeeValidate](./04-veevalidate.md)
- [Module 9 · controlled patterns](./03-controlled-patterns.md)

---

## 1. Два типа validation

| | Sync | Async |
|---|------|-------|
| Примеры | required, email format, min length | email already taken, username free |
| Где | Zod sync rules, instant | API call, debounced |
| UX | мгновенно | spinner / «Checking…» |
| Submit | блок до результата | ждёт pending async |

```text
Sync   → можно на blur / submit без сети
Async  → только когда нужен server; debounce + abort stale
```

Официально:

- [vee-validate · validation](https://vee-validate.logaretm.com/v4/guide/composition-api/validation)
- [Zod · refine](https://zod.dev/?id=refine)

---

## 2. Sync validation — что уже есть

Zod + VeeValidate — **синхронны по умолчанию**:

```ts
z.string().min(1).email()
z.coerce.number().min(0)
.refine((data) => data.password === data.confirmPassword, { path: ['confirmPassword'] })
```

```text
user blur → validate field → errors.email за ms
submit    → validate all fields sync → handleSubmit callback if valid
```

**Не** выноси format/required в async — лишняя latency.

---

## 3. Когда запускать sync validate

| Trigger | Плюсы | Минусы |
|---------|-------|--------|
| **submit only** | спокойный UX | ошибки поздно |
| **blur** | после законченного ввода | нужен touched |
| **change / modelUpdate** | быстрый feedback | шум на email/password |

### Рекомендуемый mix

```ts
import { configure } from 'vee-validate'

configure({
  validateOnBlur: true,
  validateOnChange: false,
  validateOnInput: false,
  validateOnModelUpdate: false,
})
```

```ts
const [email, emailAttrs, emailMeta] = defineField('email', {
  validateOnBlur: true,
  validateOnModelUpdate: false,
})
```

```vue
:error="emailMeta.touched ? errors.email : undefined"
```

Submit **всегда** валидирует всё — даже untouched fields.

---

## 4. Async validation — типичный кейс

Register: «Email already registered»

```ts
// api/auth.ts
export async function isEmailAvailable(email: string): Promise<boolean> {
  const { data } = await api.get('/auth/check-email', { params: { email } })
  return data.available === true
}
```

```text
user types email → debounce 400ms → GET check → set field error or clear
```

Async **после** sync pass — не дергай API на `a@` incomplete email.

---

## 5. Zod async `refine`

```ts
import { z } from 'zod'
import { isEmailAvailable } from '@/api/auth'

export const registerSchema = z
  .object({
    email: z.string().trim().min(1, 'Email is required').email(),
    password: z.string().min(8),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine(
    async (data) => isEmailAvailable(data.email),
    {
      message: 'This email is already registered',
      path: ['email'],
    },
  )
```

VeeValidate + `toTypedSchema(registerSchema)` — **await** async refine on validate.

**Submit** ждёт async refine — кнопка `isSubmitting` / validating state.

---

## 6. Async только на одно поле

Object-level async refine валидирует всю форму — для email check лучше field-level:

```ts
email: z
  .string()
  .trim()
  .min(1, 'Email is required')
  .email()
  .refine(async (email) => isEmailAvailable(email), {
    message: 'This email is already registered',
  }),
```

Или VeeValidate rule на `defineField`:

```ts
const { defineField } = useForm({
  validationSchema: toTypedSchema(registerSchemaWithoutEmailAsync),
})

const [email, emailAttrs] = defineField('email', {
  rules: async (value) => {
    if (!value || !String(value).includes('@')) return true // sync schema handles format
    const ok = await isEmailAvailable(String(value))
    return ok || 'This email is already registered'
  },
})
```

Один источник messages — не дублируй Zod + rules без нужды.

---

## 7. Debounce async checks

Без debounce — запрос на каждый keystroke после blur policy.

```ts
import { useDebounceFn } from '@vueuse/core'
// или свой debounce

const checkEmailDebounced = useDebounceFn(async (email: string) => {
  return isEmailAvailable(email)
}, 400)
```

VeeValidate **не** debounce из коробки — debounce **внутри** async rule:

```ts
rules: async (value) => {
  const email = String(value ?? '').trim()
  if (!email.includes('@')) return true

  await new Promise((r) => setTimeout(r, 400)) // простой debounce — или useDebounceFn
  const available = await isEmailAvailable(email)
  return available || 'Email already taken'
},
```

Лучше: validate async **on blur** email, не on each input — меньше запросов.

```ts
defineField('email', { validateOnBlur: true, validateOnModelUpdate: false })
```

---

## 8. Гонки async validation

```text
check("ann@") slow request
check("ann@v.com") fast request
slow returns last → wrong error on wrong email
```

### AbortController / request id

```ts
let emailCheckSeq = 0

async function validateEmailUnique(value: unknown) {
  const email = String(value ?? '').trim()
  if (!email.includes('@')) return true

  const seq = ++emailCheckSeq
  const available = await isEmailAvailable(email)

  if (seq !== emailCheckSeq) return true // stale — ignore
  return available || 'Email already taken'
}
```

Или abort axios:

```ts
const controller = new AbortController()
// cancel previous on new validate
await api.get('/check-email', { signal: controller.signal, params: { email } })
```

Module 7 abort patterns применимы к validation requests.

---

## 9. UX во время async validate

VeeValidate field meta:

```ts
const [email, emailAttrs, emailMeta] = defineField('email', { … })
// emailMeta.pending — validating in flight
// emailMeta.validated — at least once validated
```

```vue
<TextField
  v-model="email"
  v-bind="emailAttrs"
  :error="errors.email"
  :hint="emailMeta.pending ? 'Checking availability…' : undefined"
/>
```

Form-level:

```ts
const { isValidating } = useForm({ … })
```

```vue
<button type="submit" :disabled="isSubmitting || isValidating">
  {{ isValidating ? 'Validating…' : 'Register' }}
</button>
```

---

## 10. Server validation после submit

Client schema прошла — server может вернуть **422** с field errors:

```ts
// api error shape
type ValidationErrorResponse = {
  message: string
  fields?: Record<string, string[]>
}
```

```ts
const onSubmit = handleSubmit(async (values) => {
  try {
    await register(values)
  } catch (e) {
    const payload = toAppError(e)
    if (payload.status === 422 && payload.fields) {
      const flat: Record<string, string> = {}
      for (const [key, msgs] of Object.entries(payload.fields)) {
        flat[key] = msgs[0] ?? 'Invalid'
      }
      setErrors(flat)
      return
    }
    setFieldError('email', payload.message)
  }
})
```

```text
Client sync/async  → happy path fast feedback
Server 422         → source of truth для business rules
```

Не дублируй server-only rules на client *(coupon valid, stock)* — только после submit или отдельный async step.

---

## 11. Sync + async порядок на submit

```text
1. VeeValidate sync schema (Zod)
2. VeeValidate async rules / Zod async refine
3. if valid → POST register
4. if 422 → setErrors from server
5. if 401/500 → form-level alert
```

```ts
const onSubmit = handleSubmit(async (values) => {
  try {
    await registerApi(values)
  } catch (e) {
    mapServerErrors(e)
  }
})
```

`handleSubmit` **не** вызовет callback пока async validation pending.

---

## 12. Username / slug async pattern

```ts
slug: z
  .string()
  .min(3)
  .regex(/^[a-z0-9-]+$/)
  .refine(async (slug) => !(await isSlugTaken(slug)), {
    message: 'URL already taken',
  }),
```

Product admin form — async только после sync regex pass.

---

## 13. Что не делать async

| Rule | Sync |
|------|------|
| required | ✓ |
| email format | ✓ |
| min/max length | ✓ |
| password match | ✓ |
| credit card Luhn *(optional)* | sync lib |
| «email exists in DB» | async |
| «promo code valid» | async/submit |

---

## 14. Zod `.safeParse` вне формы

Manual step wizard — async между шагами:

```ts
const step1Result = step1Schema.safeParse(values)
if (!step1Result.success) { … return }

const emailOk = await isEmailAvailable(step1Result.data.email)
if (!emailOk) { errors.email = 'Taken'; return }

goToStep(2)
```

VeeValidate optional на wizard — см. [урок 07](./07-auth-profile-checkout-forms.md).

---

## 15. Частые ошибки

### Async на каждый input без debounce

DDoS свой API.

### Sync format в async rule only

User ждёт network для «required».

### Игнор stale async response

Wrong error на field.

### Client «email unique» hardcode list

Server 422 всё равно нужен.

### `isSubmitting` true, но async validate ещё идёт

Учитывай `isValidating`.

### Два async check одного поля

Zod refine + defineField rules duplicate.

### Server 422 не mapped

User видит generic «Error».

---

## 16. Что важно понять после этого блока

Проверь себя:

1. Sync vs async — примеры?
2. Когда blur, когда submit-only?
3. Зачем debounce/abort на email check?
4. Что такое `emailMeta.pending`?
5. Как map 422 в `setErrors`?
6. Какие rules всегда sync?

---

## 17. Что почитать

### Официальное

- [vee-validate · handling forms](https://vee-validate.logaretm.com/v4/guide/composition-api/handling-forms)
- [Zod · refine (async)](https://zod.dev/?id=refine)
- [vee-validate · configure](https://vee-validate.logaretm.com/v4/api/configuration)

### Связанные материалы этого плана

- [Module 7 · request cancellation](../module-7/07-request-cancellation.md)
- [Module 9 · Zod](./05-zod.md)

---

## 18. Практическое мини-задание

1. Register: sync Zod schema + async email unique *(mock api)*
2. Validate email on **blur**, не on each key
3. Debounce или seq guard против race
4. `:hint` «Checking…» while pending
5. Fake 422 on submit → `setErrors`

---

## 19. Мини-конспект

- sync = format/required/cross-field local
- async = server truth (unique, promo) — debounce + stale guard
- blur для async field; submit validates all
- 422 → setErrors; business rules с server
- isValidating / meta.pending для UX
- дальше — **формы auth, profile, checkout**

---

## 20. Что делать дальше

Следующий теоретический блок Module 9:

- [формы авторизации, профиля, checkout flow](./07-auth-profile-checkout-forms.md)
