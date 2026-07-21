# Module 9 · Теория: controlled patterns во Vue-терминах

Этот материал закрывает третий теоретический пункт `Module 9`: **controlled forms** в Vue — single source of truth, слои state формы, **touched/dirty**, когда показывать ошибки, **submit flow** до VeeValidate.

Связанные материалы:

- [Module 9 · сложный v-model](./01-complex-v-model.md)
- [Module 9 · кастомные поля](./02-custom-fields.md)
- [Module 8 · mutations](../module-8/04-mutations.md)

---

## 1. Controlled form — определение

**Controlled form** (Vue-терминология, по аналогии с React docs):

```text
Значение каждого поля живёт в reactive state (ref/reactive)
UI = f(state)
Изменение UI → обновление state → UI перерисовывается
```

```vue
<input v-model="form.email" />
<!-- state.email — единственный source of truth для email -->
```

**Uncontrolled:** DOM хранит value; читаешь при submit через ref — редко в Module 9.

Официально Vue не использует слово «controlled» в guide, но паттерн — **Form Input Bindings** + `v-model`.

---

## 2. Слои state формы

Полная форма — не только `values`:

```text
values     — что user ввёл (email, password, …)
errors     — сообщения validation по полям
touched    — user покидал поле (blur) / пытался submit
dirty      — value отличается от initial
isSubmitting / isPending — запрос на server
submitCount — сколько раз жали submit
```

```ts
type FormState<T> = {
  values: T
  initialValues: T
  errors: Partial<Record<keyof T, string>>
  touched: Partial<Record<keyof T, boolean>>
  isSubmitting: boolean
}
```

| Meta | Зачем UX |
|------|----------|
| `values` | binding + submit payload |
| `errors` | показ под полем |
| `touched` | не показывать error до blur *(optional)* |
| `dirty` | «Есть несохранённые изменения?» |
| `isSubmitting` | disable fields + button |

VeeValidate / Form libraries дают это из коробки — сначала пойми **вручную**.

---

## 3. Single source of truth

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const form = reactive({
  email: '',
  password: '',
})

// ONE place — не дублируй:
// ❌ const email = ref('') + form.email
// ❌ Pinia store для draft login
</script>
```

| Данные | Где |
|--------|-----|
| draft формы | local `ref` / `reactive` на page |
| cart | Pinia |
| server profile (read) | vue-query |
| server profile (edit draft) | local form, **hydrate** из query on success |

```ts
// Profile edit — hydrate once
const { data: profile } = useQuery({ … })

const form = reactive({ name: '', bio: '' })

watch(profile, (p) => {
  if (p) {
    form.name = p.name
    form.bio = p.bio
  }
}, { immediate: true })
```

Не `v-model` напрямую в query `data` — мутируешь cache.

---

## 4. Controlled field chain

```text
Page state (form.email)
    ↕ v-model
TextField (defineModel)
    ↕ v-model
BaseInput (native input)
```

Каждый уровень **прокидывает** value вверх через `v-model`, не хранит shadow copy.

Child только **transformation** *(trim, format)* — через emit/setter, не silent local state.

---

## 5. Когда показывать ошибки

Три распространённых policy:

| Policy | Показ error |
|--------|-------------|
| **onSubmit** | после первого submit attempt |
| **onBlur** | после blur поля, если invalid |
| **onChange** | после каждого input *(строго, редко)* |

### Рекомендация Module 9

```text
validate on submit + on blur после первого submit
или
validate on blur всегда для «важных» полей (email)
```

```ts
const showError = (field: keyof typeof form) =>
  (submitAttempted.value || touched[field]) && !!errors[field]
```

```vue
<TextField
  v-model="form.email"
  :error="showError('email') ? errors.email : undefined"
  @blur="touched.email = true"
/>
```

**Не** показывай «Email required» до первого blur/submit — раздражает.

---

## 6. Manual validation flow (до Zod/VeeValidate)

```ts
type LoginForm = { email: string; password: string }

function validateLogin(values: LoginForm): Partial<Record<keyof LoginForm, string>> {
  const errors: Partial<Record<keyof LoginForm, string>> = {}

  if (!values.email.trim()) {
    errors.email = 'Email is required'
  } else if (!values.email.includes('@')) {
    errors.email = 'Enter a valid email'
  }

  if (!values.password) {
    errors.password = 'Password is required'
  } else if (values.password.length < 8) {
    errors.password = 'At least 8 characters'
  }

  return errors
}
```

```vue
<script setup lang="ts">
import { reactive, ref } from 'vue'

const form = reactive<LoginForm>({ email: '', password: '' })
const errors = reactive<Partial<Record<keyof LoginForm, string>>>({})
const touched = reactive<Partial<Record<keyof LoginForm, boolean>>>({})
const submitAttempted = ref(false)
const isSubmitting = ref(false)

function runValidation() {
  const next = validateLogin(form)
  Object.keys(errors).forEach((k) => delete errors[k as keyof LoginForm])
  Object.assign(errors, next)
  return Object.keys(next).length === 0
}

async function onSubmit() {
  submitAttempted.value = true
  if (!runValidation()) return

  isSubmitting.value = true
  try {
    await loginApi(form)
  } catch (e) {
    errors.email = 'Invalid credentials' // server error → field or form
  } finally {
    isSubmitting.value = false
  }
}
</script>
```

Validation **pure function** `values → errors` — позже заменишь на Zod `.safeParse`.

---

## 7. Submit flow — пошагово

```text
1. user submit
2. @submit.prevent
3. submitAttempted = true
4. validate all fields → errors
5. if invalid → stop, focus first error
6. isSubmitting = true; disable inputs
7. api / useMutation
8. success → redirect / toast / reset
9. error → map to field or form-level alert
10. isSubmitting = false
```

```vue
<form @submit.prevent="onSubmit" novalidate>
```

`novalidate` — отключить browser popup validation, если показываешь свои errors *(optional, осознанно)*.

### Focus first error

```ts
function focusFirstError() {
  const first = Object.keys(errors)[0]
  if (first) {
    document.getElementById(first)?.focus()
  }
}
```

Передай `id` на field = field name.

---

## 8. Dirty и reset

```ts
const initialValues = { email: '', password: '' }
const form = reactive({ ...initialValues })

const isDirty = computed(() =>
  form.email !== initialValues.email ||
  form.password !== initialValues.password,
)

function resetForm() {
  Object.assign(form, initialValues)
  Object.keys(errors).forEach((k) => delete errors[k as keyof LoginForm])
  submitAttempted.value = false
}
```

Profile edit: `initialValues` обнови после successful save.

Wizard «Cancel» → reset или confirm if dirty.

---

## 9. Form-level vs field-level errors

| Тип | Пример | UI |
|-----|--------|-----|
| Field | invalid email | под `TextField` |
| Form | «Wrong password» | alert над формой |
| Form | network 500 | `role="alert"` banner |

```ts
const formError = ref<string | null>(null)

async function onSubmit() {
  formError.value = null
  // ...
  catch {
    formError.value = 'Something went wrong. Try again.'
  }
}
```

Server 422 с `{ field: message }` → map в `errors`.

---

## 10. Controlled + pending (Module 8)

```vue
<script setup lang="ts">
import { useMutation } from '@tanstack/vue-query'

const { mutateAsync, isPending } = useMutation({ mutationFn: updateProfile })

async function onSubmit() {
  if (!runValidation()) return
  await mutateAsync(form)
}
</script>

<template>
  <TextField v-model="form.name" :disabled="isPending" />
  <button type="submit" :disabled="isPending">
    {{ isPending ? 'Saving…' : 'Save' }}
  </button>
</template>
```

**Controlled** = disable не ломает state; value сохраняется.

---

## 11. Не смешивать «display» и «storage» formats

```ts
// storage in form (number)
form.price = 99

// display only — computed или formatter в input
// ❌ хранить "$99.00" string в form.price для API
```

Date: ISO string в form или Date object — **один** формат до submit mapper.

---

## 12. Composable `useForm` (lightweight)

```ts
// composables/useForm.ts
export function useForm<T extends Record<string, unknown>>(
  initialValues: T,
  validate: (values: T) => Partial<Record<keyof T, string>>,
) {
  const values = reactive({ ...initialValues }) as T
  const errors = reactive({}) as Partial<Record<keyof T, string>>
  const touched = reactive({}) as Partial<Record<keyof T, boolean>>
  const submitAttempted = ref(false)
  const isSubmitting = ref(false)

  function validateAll() {
    const next = validate(values)
    Object.keys(errors).forEach((k) => delete errors[k as keyof T])
    Object.assign(errors, next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(submitter: (values: T) => Promise<void>) {
    submitAttempted.value = true
    if (!validateAll()) return false

    isSubmitting.value = true
    try {
      await submitter(values)
      return true
    } finally {
      isSubmitting.value = false
    }
  }

  return { values, errors, touched, submitAttempted, isSubmitting, handleSubmit }
}
```

Не обязателен в MVP — но показывает границу перед VeeValidate.

---

## 13. Сравнение с VeeValidate *(preview)*

| Manual controlled | VeeValidate |
|-------------------|-------------|
| свой `errors` ref | `errors` из `useForm` |
| свой `touched` | `meta.touched` |
| `validateLogin()` | schema + `handleSubmit` |
| `isSubmitting` | `isSubmitting` built-in |

Кастомные `TextField` **остаются** — меняется только источник `:error`.

Следующий урок: [VeeValidate](./04-veevalidate.md).

---

## 14. Частые ошибки

### Validate на каждый `@input` с агрессивным UI

User видит errors до конца ввода email.

### Два source of truth: `form` + query data bind

Редактируешь cache product напрямую.

### Submit без `preventDefault`

Full page reload.

### `isSubmitting` false в catch до показа error

Ok; но не забыть `finally`.

### Reset только values, не errors/touched

Старые красные поля после reset.

### Server error только `console.log`

User не понимает, что failed.

### Child field хранит local copy

Desync — см. [урок 01](./01-complex-v-model.md).

---

## 15. Что важно понять после этого блока

Проверь себя:

1. Что такое controlled form в Vue?
2. Какие слои state кроме `values`?
3. Когда показывать field error?
4. Порядок шагов submit flow?
5. Где draft формы vs Pinia vs vue-query?
6. Зачем pure `validate(values)` function?

---

## 16. Что почитать

### Официальное

- [Form Input Bindings](https://vuejs.org/guide/essentials/forms.html)
- [Reactivity Fundamentals](https://vuejs.org/guide/essentials/reactivity-fundamentals.html) *(mental model)*

### Связанные материалы этого плана

- [Module 9 · кастомные поля](./02-custom-fields.md)
- [Module 8 · mutations](../module-8/04-mutations.md)

---

## 17. Практическое мини-задание

1. Login form: `values`, `errors`, `touched`, `submitAttempted`
2. `validateLogin()` pure function
3. Errors только после submit или blur post-submit
4. `isSubmitting` + disabled fields на fake delay
5. Form-level alert на «network error»

---

## 18. Мини-конспект

- controlled = state drives UI через `v-model`
- values + errors + touched + submitting — отдельные слои
- validate on submit; blur policy — осознанно
- submit: prevent → validate → pending → api → errors
- draft local; не мутируй query cache
- дальше — **VeeValidate**

---

## 19. Что делать дальше

Следующий теоретический блок Module 9:

- [VeeValidate](./04-veevalidate.md)
