# Module 9 · Теория: VeeValidate

Этот материал закрывает четвёртый теоретический пункт `Module 9`: **`vee-validate` v4** — `useForm`, `defineField`, `handleSubmit`, правила, интеграция с **custom `TextField`**.

Связанные материалы:

- [Module 9 · controlled patterns](./03-controlled-patterns.md)
- [Module 9 · кастомные поля](./02-custom-fields.md)
- [Module 9 · Zod](./05-zod.md) *(следующий — schema)*

---

## 1. Зачем VeeValidate

Manual flow из [урока 03](./03-controlled-patterns.md):

```text
values + errors + touched + validateAll + handleSubmit — много boilerplate
```

**VeeValidate 4** — composition-first библиотека для Vue 3:

- controlled values + meta *(touched, dirty, valid)*
- field-level и form-level validation
- `handleSubmit` с `isSubmitting`
- schema adapters (Zod — следующий урок)

```bash
npm install vee-validate
```

Официально:

- [vee-validate v4 · Guide](https://vee-validate.logaretm.com/v4/)
- [Composition API · useForm](https://vee-validate.logaretm.com/v4/guide/composition-api/getting-started)

---

## 2. Минимальный `useForm`

```vue
<script setup lang="ts">
import { useForm } from 'vee-validate'

const { handleSubmit, isSubmitting, defineField, errors } = useForm({
  initialValues: {
    email: '',
    password: '',
  },
  validationSchema: {
    email: (value: unknown) => {
      if (!value || typeof value !== 'string') return 'Email is required'
      if (!value.includes('@')) return 'Enter a valid email'
      return true
    },
    password: (value: unknown) => {
      if (!value || typeof value !== 'string') return 'Password is required'
      if (value.length < 8) return 'At least 8 characters'
      return true
    },
  },
})

const [email, emailAttrs] = defineField('email')
const [password, passwordAttrs] = defineField('password')

const onSubmit = handleSubmit(async (values) => {
  console.log(values)
  await loginApi(values)
})
</script>

<template>
  <form @submit="onSubmit">
    <input v-model="email" v-bind="emailAttrs" type="email" />
    <p v-if="errors.email">{{ errors.email }}</p>

    <input v-model="password" v-bind="passwordAttrs" type="password" />
    <p v-if="errors.password">{{ errors.password }}</p>

    <button type="submit" :disabled="isSubmitting">
      {{ isSubmitting ? 'Signing in…' : 'Sign in' }}
    </button>
  </form>
</template>
```

```text
defineField  → ref value + attrs (name, onBlur, onInput, …)
handleSubmit → validate all → callback только if valid
errors       → reactive map field → message
```

---

## 3. `defineField` и custom components

`defineField` возвращает `[value, attrs]` для binding:

```vue
<TextField
  v-model="email"
  v-bind="emailAttrs"
  label="Email"
  type="email"
  :error="errors.email"
/>
```

`emailAttrs` включает:

- `name`
- `onBlur` / `onInput` — для touched и validation triggers
- `value` *(если без v-model — но с custom v-model лучше v-model + attrs без value conflict)*

**Pattern Module 9:** `v-model` на value + `v-bind="fieldAttrs"` для events/name.

```ts
const [email, emailAttrs] = defineField('email', {
  validateOnBlur: true,
  validateOnModelUpdate: false,
})
```

Triggers настраиваются per-field или globally.

---

## 4. `handleSubmit`

```ts
const onSubmit = handleSubmit(
  async (values) => {
    // values typed from initialValues / schema
    await mutateAsync(values)
  },
  ({ errors: validationErrors, values }) => {
    // optional invalid callback
    console.log('Invalid', validationErrors)
  },
)
```

```vue
<form @submit="onSubmit">
```

`handleSubmit` **сам** вызывает `preventDefault` на event.

| | Manual | VeeValidate |
|---|--------|-------------|
| preventDefault | `@submit.prevent` | внутри `handleSubmit` |
| validate | `runValidation()` | автоматически |
| invalid path | if (!valid) return | второй callback optional |

---

## 5. Form-level state из `useForm`

```ts
const {
  errors,           // Record<string, string>
  errorBag,         // all errors per field (arrays)
  values,           // current form values
  meta,             // form meta: valid, dirty, touched, pending
  isSubmitting,
  submitCount,
  resetForm,
  setFieldError,
  setErrors,
} = useForm({ … })
```

```vue
<p v-if="!meta.valid && meta.touched">Fix errors below</p>
<p v-if="formError" role="alert">{{ formError }}</p>
```

Server error после failed login:

```ts
const onSubmit = handleSubmit(async (values) => {
  try {
    await loginApi(values)
  } catch {
    setFieldError('email', 'Invalid email or password')
    // или setErrors({ email: '…', password: '…' })
  }
})
```

---

## 6. `useField` — одно поле без `useForm`

Для isolated field или gradual adoption:

```ts
import { useField } from 'vee-validate'

const { value, errorMessage, handleBlur, handleChange, meta } = useField('email', {
  validate: (v) => (!v ? 'Required' : true),
})
```

Обычно **весь form** через один `useForm` + несколько `defineField` — проще sync.

---

## 7. Компонент `<Form>` и `<Field>` *(declarative)*

```vue
<script setup lang="ts">
import { Form, Field, ErrorMessage } from 'vee-validate'

async function onSubmit(values: Record<string, unknown>) {
  await loginApi(values as LoginForm)
}
</script>

<template>
  <Form @submit="onSubmit" v-slot="{ isSubmitting, errors }">
    <Field name="email" type="email" />
    <ErrorMessage name="email" />

    <Field name="password" type="password" />
    <ErrorMessage name="password" />

    <button type="submit" :disabled="isSubmitting">Sign in</button>
  </Form>
</template>
```

| API | Когда |
|-----|--------|
| `useForm` + `defineField` | custom `TextField`, composition API **recommended** |
| `<Form>` + `<Field>` | быстрый прототип, native inputs |

Module 9 practice — **useForm + TextField**.

---

## 8. Правила без Zod (временно)

### Inline functions *(урок выше)*

```ts
validationSchema: {
  title: (v) => (v ? true : 'Title is required'),
}
```

### `@vee-validate/rules`

```bash
npm install @vee-validate/rules
```

```ts
import { defineRule, configure } from 'vee-validate'
import { required, email, min } from '@vee-validate/rules'

defineRule('required', required)
defineRule('email', email)
defineRule('min', min)

configure({
  generateMessage: (ctx) => {
    // i18n hook
    return `Field ${ctx.field} is invalid`
  },
})
```

```ts
validationSchema: {
  email: 'required|email',
  password: 'required|min:8',
}
```

**Следующий урок** — Zod schema вместо строк rules: [05-zod.md](./05-zod.md).

---

## 9. Validation triggers

```ts
import { configure } from 'vee-validate'

configure({
  validateOnBlur: true,
  validateOnChange: true,
  validateOnInput: false,
  validateOnModelUpdate: true,
})
```

Per field:

```ts
defineField('email', { validateOnBlur: true, validateOnModelUpdate: false })
```

Согласуй с UX из [controlled patterns](./03-controlled-patterns.md) — не агрессивный onInput для email.

---

## 10. Полный Login с `TextField`

```vue
<script setup lang="ts">
import { useForm } from 'vee-validate'
import TextField from '@/components/form/TextField.vue'
import { login } from '@/api/auth'

type LoginForm = { email: string; password: string }

const { defineField, handleSubmit, errors, isSubmitting, setFieldError } =
  useForm<LoginForm>({
    initialValues: { email: '', password: '' },
    validationSchema: {
      email: (v) => {
        if (!String(v ?? '').trim()) return 'Email is required'
        if (!String(v).includes('@')) return 'Enter a valid email'
        return true
      },
      password: (v) => {
        if (!String(v ?? '')) return 'Password is required'
        if (String(v).length < 8) return 'At least 8 characters'
        return true
      },
    },
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
      name="email"
      autocomplete="username"
      :error="errors.email"
      required
    />
    <TextField
      v-model="password"
      v-bind="passwordAttrs"
      label="Password"
      type="password"
      name="password"
      autocomplete="current-password"
      :error="errors.password"
      required
    />
    <button type="submit" :disabled="isSubmitting">
      {{ isSubmitting ? 'Signing in…' : 'Sign in' }}
    </button>
  </form>
</template>
```

---

## 11. VeeValidate + vue-query mutation

```ts
import { useMutation } from '@tanstack/vue-query'
import { useForm } from 'vee-validate'

const { mutateAsync } = useMutation({ mutationFn: createProduct })

const { defineField, handleSubmit, errors, isSubmitting } = useForm({
  initialValues: { title: '', price: 0 },
  validationSchema: { /* … */ },
})

const [title, titleAttrs] = defineField('title')
const [price, priceAttrs] = defineField('price')

const onSubmit = handleSubmit((values) => mutateAsync(values))
```

`isSubmitting` из VeeValidate **или** `isPending` из mutation — выбери один для button, или `isSubmitting || isPending`.

```vue
<button :disabled="isSubmitting || isPending">Save</button>
```

---

## 12. `resetForm` после success

```ts
const { resetForm } = useForm({ … })

const onSubmit = handleSubmit(async (values) => {
  await createProduct(values)
  resetForm()
})
```

`resetForm({ values: { … } })` — новые initial values после save.

Profile edit: reset к сохранённым server values.

---

## 13. Typed values

```ts
useForm<LoginForm>({
  initialValues: { email: '', password: '' },
  …
})

handleSubmit(async (values) => {
  values.email // string
})
```

Типы из generic + `initialValues`. С Zod — inferred type из schema.

---

## 14. Частые ошибки

### `v-model` без `defineField` attrs

Touched/blur validation не работает.

### Два `useForm` на одну форму

Разные errors/values. Один `useForm` на form.

### `validationSchema` и ручной `errors` ref

Один источник — VeeValidate `errors` / `setFieldError`.

### `@submit.prevent` + `handleSubmit`

`handleSubmit` уже preventDefault — `@submit="onSubmit"` достаточно.

### `<Field>` внутри `TextField` без интеграции

Double binding. Либо Field as child, либо defineField + TextField.

### Rules string без `defineRule`

`required|email` не работает пока rules не зарегистрированы.

### Показывать `errors.email` до touch

Настрой triggers; или `errors.email && meta.touched` per field meta from defineField.

`defineField` third return — field meta:

```ts
const [email, emailAttrs, emailMeta] = defineField('email')
// emailMeta.touched, emailMeta.valid
```

```vue
:error="emailMeta.touched ? errors.email : undefined"
```

---

## 15. Что важно понять после этого блока

Проверь себя:

1. Что возвращает `defineField`?
2. Чем `handleSubmit` лучше manual validate + submit?
3. Как передать errors в `TextField`?
4. Как установить server error?
5. `useForm` vs `<Form>` — когда что?
6. Зачем Zod на следующем уроке?

---

## 16. Что почитать

### Официальное

- [Composition API · useForm](https://vee-validate.logaretm.com/v4/guide/composition-api/getting-started)
- [defineField](https://vee-validate.logaretm.com/v4/api/use-form#definefieldfieldname-string-opts-fieldoptions)
- [Custom inputs](https://vee-validate.logaretm.com/v4/guide/composition-api/custom-inputs)

### Связанные материалы этого плана

- [Module 9 · controlled patterns](./03-controlled-patterns.md)
- [Module 9 · кастомные поля](./02-custom-fields.md)

---

## 17. Практическое мини-задание

1. `npm install vee-validate`
2. Login page: `useForm` + `defineField` + `TextField`
3. Inline validators для email/password
4. `setFieldError` на fake 401
5. `isSubmitting` на button

---

## 18. Мини-конспект

- VeeValidate = controlled form state + validation + submit
- `defineField` + custom `TextField` — основной pattern
- `handleSubmit` validates then runs callback
- server errors → `setFieldError` / `setErrors`
- string rules ok; **Zod** — следующий шаг для schema
- дальше — **Zod**

---

## 19. Что делать дальше

Следующий теоретический блок Module 9:

- [Zod](./05-zod.md)
