# Module 9 · Теория: Zod

Этот материал закрывает пятый теоретический пункт `Module 9`: **Zod schemas** — типы, validation, **`@vee-validate/zod`**, переиспользование schema в форме и api layer.

Связанные материалы:

- [Module 9 · VeeValidate](./04-veevalidate.md)
- [Module 4 · typing API](../module-4/05-typing-api-responses.md)
- [Module 7 · parse](../module-7/03-error-handling.md)

---

## 1. Зачем Zod после inline rules

```text
Inline validators  → дублирование, слабые типы, rules размазаны
String rules       → 'required|email' — не TypeScript-friendly
Zod schema         → один объект: validate + infer types + reuse
```

```ts
// одна schema — form + api + tests
export const loginSchema = z.object({ … })
type LoginForm = z.infer<typeof loginSchema>
```

```bash
npm install zod
npm install @vee-validate/zod
```

Официально:

- [Zod](https://zod.dev/)
- [vee-validate · Zod integration](https://vee-validate.logaretm.com/v4/guide/composition-api/validation#schema-validation-with-zod)

---

## 2. Базовая schema

```ts
import { z } from 'zod'

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Enter a valid email'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'At least 8 characters'),
})

export type LoginForm = z.infer<typeof loginSchema>
```

```ts
loginSchema.parse({ email: 'a@b.com', password: '12345678' }) // ok, typed
loginSchema.parse({ email: '', password: 'x' })                 // throws ZodError
```

---

## 3. `safeParse` — без throw

```ts
const result = loginSchema.safeParse(formValues)

if (!result.success) {
  console.log(result.error.flatten())
  // fieldErrors: { email: ['…'], password: ['…'] }
  return
}

const values = result.data // LoginForm — guaranteed
await loginApi(values)
```

| | `parse` | `safeParse` |
|---|---------|-------------|
| Invalid | throw | `{ success: false, error }` |
| Valid | data | `{ success: true, data }` |
| Forms | редко | manual flows, api boundary |

VeeValidate использует schema adapter — под капотом safe parse.

---

## 4. VeeValidate + `toTypedSchema`

```ts
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { loginSchema, type LoginForm } from '@/schemas/loginSchema'

const { defineField, handleSubmit, errors, isSubmitting } = useForm<LoginForm>({
  validationSchema: toTypedSchema(loginSchema),
  initialValues: {
    email: '',
    password: '',
  },
})

const [email, emailAttrs] = defineField('email')
const [password, passwordAttrs] = defineField('password')

const onSubmit = handleSubmit(async (values) => {
  // values: LoginForm — validated
  await login(values)
})
```

`toTypedSchema`:

- связывает Zod с VeeValidate
- **typed** `values` в `handleSubmit`
- field errors из Zod messages

---

## 5. Структура файлов schema

```text
src/schemas/
  loginSchema.ts
  registerSchema.ts
  productFormSchema.ts
  profileSchema.ts
```

```ts
// schemas/productFormSchema.ts
import { z } from 'zod'

export const productFormSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(120),
  price: z.coerce.number().min(0, 'Price must be positive'),
  category: z.string().min(1, 'Choose a category'),
  description: z.string().max(2000).optional().or(z.literal('')),
})

export type ProductForm = z.infer<typeof productFormSchema>
```

**Один файл — одна форма/domain.** Не копируй rules в component.

---

## 6. Частые Zod типы для форм

```ts
z.string()
z.string().email()
z.string().min(8).max(100)
z.string().regex(/^\+?[0-9\s-]+$/, 'Invalid phone')

z.coerce.number()        // "99" → 99 из input
z.number().int().positive()

z.boolean()              // checkbox agreed
z.literal(true, { errorMap: () => ({ message: 'You must agree' }) })

z.enum(['free', 'pro'], { message: 'Choose a plan' })

z.array(z.string()).min(1, 'Pick at least one tag')
```

### Optional vs required

```ts
bio: z.string().optional(),           // undefined ok
bio: z.string().max(500).optional(),    // empty string ≠ undefined — см. ниже
website: z.union([z.literal(''), z.string().url()]).optional(),
```

Пустой input часто `''` — используй `.trim()` + `.min(1)` или `.or(z.literal(''))`.

---

## 7. `refine` и `superRefine`

Cross-field validation:

```ts
export const registerSchema = z
  .object({
    password: z.string().min(8),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
```

```ts
export const checkoutSchema = z
  .object({
    plan: z.enum(['free', 'pro']),
    cardNumber: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.plan === 'pro' && !data.cardNumber?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Card required for Pro plan',
        path: ['cardNumber'],
      })
    }
  })
```

`path` → field error в VeeValidate.

---

## 8. Переиспользование: form + API parse

Module 4/7: parse `unknown` → domain type.

```ts
// api/products.ts
import { productFormSchema, type ProductForm } from '@/schemas/productFormSchema'

export async function createProduct(input: unknown): Promise<Product> {
  const parsed = productFormSchema.parse(input) // или safeParse + throw AppError
  const { data } = await api.post('/products', parsed)
  return parseProduct(data)
}
```

```ts
// form submit — уже validated VeeValidate
handleSubmit(async (values) => {
  await createProduct(values) // values: ProductForm
})
```

**Два входа, одна schema:**

| Вход | Как |
|------|-----|
| Form | VeeValidate + `toTypedSchema` |
| API response | `productSchema.parse(data)` *(отдельная read schema)* |

Read schema (API) и write schema (form) **могут отличаться** — не force one schema на всё.

---

## 9. Read vs write schema

```ts
// ответ API — больше полей
export const productApiSchema = z.object({
  id: z.string(),
  title: z.string(),
  price: z.number(),
  createdAt: z.string(),
})

// форма create — subset
export const productFormSchema = productApiSchema.pick({
  title: true,
  price: true,
})
```

Или `omit`, `partial` для PATCH profile.

---

## 10. `partial` для profile update

```ts
export const profileSchema = z.object({
  name: z.string().trim().min(1).max(80),
  bio: z.string().max(500).optional(),
  website: z.string().url().optional().or(z.literal('')),
})

export const profileUpdateSchema = profileSchema.partial()
```

Edit profile: только изменённые поля — optional в schema или full object с optional fields.

---

## 11. Login form — полный пример

```ts
// schemas/loginSchema.ts
import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email(),
  password: z.string().min(1, 'Password is required').min(8),
})

export type LoginForm = z.infer<typeof loginSchema>
```

```vue
<script setup lang="ts">
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { loginSchema, type LoginForm } from '@/schemas/loginSchema'
import TextField from '@/components/form/TextField.vue'
import { login } from '@/api/auth'

const { defineField, handleSubmit, errors, isSubmitting, setFieldError } =
  useForm<LoginForm>({
    validationSchema: toTypedSchema(loginSchema),
    initialValues: { email: '', password: '' },
  })

const [email, emailAttrs] = defineField('email')
const [password, passwordAttrs] = defineField('password')

const onSubmit = handleSubmit(async (values) => {
  try {
    await login(values)
  } catch {
    setFieldError('email', 'Invalid credentials')
  }
})
</script>

<template>
  <form @submit="onSubmit" novalidate>
    <TextField
      v-model="email"
      v-bind="emailAttrs"
      label="Email"
      type="email"
      :error="errors.email"
    />
    <TextField
      v-model="password"
      v-bind="passwordAttrs"
      label="Password"
      type="password"
      :error="errors.password"
    />
    <button type="submit" :disabled="isSubmitting">Sign in</button>
  </form>
</template>
```

---

## 12. Custom messages

```ts
z.string({ required_error: 'Name is required' })
z.number({ invalid_type_error: 'Enter a number' })
```

```ts
const schema = z.object({
  email: z.string().email({ message: 'That does not look like an email' }),
})
```

i18n: обёртка factory `t('errors.required')` в message strings.

---

## 13. `z.coerce` и number inputs

HTML input `type="number"` → string без coerce.

```ts
price: z.coerce.number({
  invalid_type_error: 'Enter a valid price',
}).min(0),
```

Или `v-model.number` + `z.number()` — **один** подход в проекте.

---

## 14. Частые ошибки

### Schema только в component

Дублирование на register/login. Вынеси в `schemas/`.

### `z.infer` и `initialValues` расходятся

TS error или runtime missing fields — держи sync.

### `parse` на api без try/catch

Unhandled ZodError. `safeParse` + `toAppError`.

### Одна mega-schema на API + form + list item

Split read/write schemas.

### `confirmPassword` в submit payload

```ts
.handleSubmit(async ({ password, confirmPassword, ...rest }) => {
  await register({ ...rest, password })
})
```

Или `omit` в transform перед api.

### Zod v4 vs v3

План на актуальный Zod 3.x API; при v4 проверь import paths в docs.

---

## 15. Что важно понять после этого блока

Проверь себя:

1. Чем `z.infer` помогает форме?
2. Зачем `toTypedSchema`?
3. `parse` vs `safeParse`?
4. Где хранить schema в проекте?
5. Read schema vs write schema?
6. Как `refine` задаёт error на поле?

---

## 16. Что почитать

### Официальное

- [Zod · Defining schemas](https://zod.dev/?id=defining-schemas)
- [Zod · infer](https://zod.dev/?id=type-inference)
- [vee-validate · Zod](https://vee-validate.logaretm.com/v4/guide/composition-api/validation#schema-validation-with-zod)

### Связанные материалы этого плана

- [Module 9 · VeeValidate](./04-veevalidate.md)
- [Module 4 · typing API responses](../module-4/05-typing-api-responses.md)

---

## 17. Практическое мини-задание

1. `schemas/loginSchema.ts` + `z.infer`
2. Login: `toTypedSchema(loginSchema)`
3. `productFormSchema` с `z.coerce.number()` для price
4. `registerSchema` + `refine` confirmPassword
5. `safeParse` в одной api function — demo

---

## 18. Мини-конспект

- Zod = schema + types + messages в одном месте
- `toTypedSchema` → VeeValidate typed forms
- `schemas/*` — не дублировать в components
- form schema vs api read schema
- `safeParse` на границах; `refine` для cross-field
- дальше — **sync/async validation**

---

## 19. Что делать дальше

Следующий теоретический блок Module 9:

- [синхронная и асинхронная валидация](./06-sync-async-validation.md)
