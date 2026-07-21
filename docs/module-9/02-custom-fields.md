# Module 9 · Теория: кастомные поля

Этот материал закрывает второй теоретический пункт `Module 9`: **переиспользуемые field-компоненты** — wrappers для input/select/textarea, label, hints, error slots, **a11y**, структура `components/form/*`.

Связанные материалы:

- [Module 9 · сложный v-model](./01-complex-v-model.md)
- [Module 4 · typing props](../module-4/01-typing-props.md)

---

## 1. Зачем не голый `<input>` на каждой page

```text
LoginPage      → label + input + error + autocomplete
RegisterPage   → то же, другие props
ProfilePage    → то же + hint text
ProductForm    → number field + currency hint
```

Без wrappers:

- дублируется разметка и CSS
- разный a11y *(label не связан, нет aria-invalid)*
- validation errors рисуются по-разному
- сложно подключить VeeValidate единообразно

**Custom fields** — тонкий UI-слой поверх `defineModel` / `v-model`.

---

## 2. Целевая структура

```text
src/components/form/
  FormField.vue      # label + control slot + hint + error
  BaseInput.vue
  BaseTextarea.vue
  BaseSelect.vue
  BaseCheckbox.vue
  types.ts           # shared props
```

```text
Page / Form
  └── FormField (label, error)
        └── BaseInput v-model
```

Validation logic — позже (VeeValidate). Сейчас — **контракт для error message**.

---

## 3. `FormField` — обёртка layout + a11y

```vue
<!-- FormField.vue -->
<script setup lang="ts">
import { computed, useId } from 'vue'

const props = defineProps<{
  label?: string
  hint?: string
  error?: string
  required?: boolean
  /** override auto id */
  id?: string
}>()

const autoId = useId()
const fieldId = computed(() => props.id ?? autoId.value)
const hintId = computed(() => `${fieldId.value}-hint`)
const errorId = computed(() => `${fieldId.value}-error`)

const describedBy = computed(() => {
  const ids: string[] = []
  if (props.hint) ids.push(hintId.value)
  if (props.error) ids.push(errorId.value)
  return ids.length ? ids.join(' ') : undefined
})
</script>

<template>
  <div class="form-field" :class="{ 'form-field--invalid': !!error }">
    <label v-if="label" :for="fieldId" class="form-field__label">
      {{ label }}
      <span v-if="required" aria-hidden="true">*</span>
    </label>

    <slot
      :id="fieldId"
      :described-by="describedBy"
      :invalid="!!error"
      :required="required"
    />

    <p v-if="hint && !error" :id="hintId" class="form-field__hint">
      {{ hint }}
    </p>
    <p v-if="error" :id="errorId" class="form-field__error" role="alert">
      {{ error }}
    </p>
  </div>
</template>
```

**Scoped slot** передаёт `id`, `described-by`, `invalid` в control — child не угадывает a11y.

---

## 4. `BaseInput` — минимальный контракт

```vue
<!-- BaseInput.vue -->
<script setup lang="ts">
const model = defineModel<string | number | null>({ required: true })

const props = withDefaults(
  defineProps<{
    id?: string
    name?: string
    type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url'
    placeholder?: string
    disabled?: boolean
    autocomplete?: string
    describedBy?: string
    invalid?: boolean
    required?: boolean
  }>(),
  {
    type: 'text',
    invalid: false,
    disabled: false,
  },
)
</script>

<template>
  <input
    :id="id"
    v-model="model"
    :name="name"
    :type="type"
    :placeholder="placeholder"
    :disabled="disabled"
    :autocomplete="autocomplete"
    :required="required"
    :aria-invalid="invalid || undefined"
    :aria-describedby="describedBy"
    class="base-input"
  />
</template>
```

### Использование

```vue
<FormField label="Email" :error="emailError" required hint="We never share your email">
  <template #default="{ id, describedBy, invalid, required }">
    <BaseInput
      :id="id"
      v-model="form.email"
      type="email"
      name="email"
      autocomplete="email"
      :described-by="describedBy"
      :invalid="invalid"
      :required="required"
    />
  </template>
</FormField>
```

---

## 5. Упростить API: field + input в одном

Для pet-project часто **склеивают** `FormField` + `BaseInput`:

```vue
<!-- TextField.vue -->
<script setup lang="ts">
const model = defineModel<string>({ required: true })

const props = defineProps<{
  label?: string
  hint?: string
  error?: string
  name?: string
  type?: 'text' | 'email' | 'password'
  autocomplete?: string
  disabled?: boolean
  required?: boolean
}>()
</script>

<template>
  <FormField
    :label="label"
    :hint="hint"
    :error="error"
    :required="required"
  >
    <template #default="{ id, describedBy, invalid, required: req }">
      <BaseInput
        :id="id"
        v-model="model"
        :name="name"
        :type="type"
        autocomplete="autocomplete"
        :described-by="describedBy"
        :invalid="invalid"
        :required="req"
        :disabled="disabled"
      />
    </template>
  </FormField>
</template>
```

Page:

```vue
<TextField
  v-model="form.email"
  label="Email"
  type="email"
  name="email"
  autocomplete="email"
  :error="errors.email"
  required
/>
```

| Подход | Когда |
|--------|--------|
| `FormField` + slot | max flexibility |
| `TextField` all-in-one | быстрее на pages |
| оба в проекте | ok — TextField внутри uses FormField |

---

## 6. `BaseTextarea`

```vue
<script setup lang="ts">
const model = defineModel<string>({ required: true })

defineProps<{
  id?: string
  name?: string
  rows?: number
  placeholder?: string
  disabled?: boolean
  describedBy?: string
  invalid?: boolean
  required?: boolean
}>()
</script>

<template>
  <textarea
    :id="id"
    v-model="model"
    :name="name"
    :rows="rows ?? 4"
    :placeholder="placeholder"
    :disabled="disabled"
    :required="required"
    :aria-invalid="invalid || undefined"
    :aria-describedby="describedBy"
    class="base-textarea"
  />
</template>
```

Product description, bio profile — типичный use case.

---

## 7. `BaseSelect`

```vue
<script setup lang="ts">
export type SelectOption<T extends string | number = string> = {
  label: string
  value: T
  disabled?: boolean
}

const model = defineModel<string | number | null>({ required: true })

defineProps<{
  id?: string
  name?: string
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  describedBy?: string
  invalid?: boolean
  required?: boolean
}>()
</script>

<template>
  <select
    :id="id"
    v-model="model"
    :name="name"
    :disabled="disabled"
    :required="required"
    :aria-invalid="invalid || undefined"
    :aria-describedby="describedBy"
    class="base-select"
  >
    <option v-if="placeholder" disabled value="">
      {{ placeholder }}
    </option>
    <option
      v-for="opt in options"
      :key="String(opt.value)"
      :value="opt.value"
      :disabled="opt.disabled"
    >
      {{ opt.label }}
    </option>
  </select>
</template>
```

Category filter в форме create product:

```vue
<SelectField
  v-model="form.category"
  label="Category"
  :options="categoryOptions"
  placeholder="Choose category"
  :error="errors.category"
/>
```

---

## 8. `BaseCheckbox` / toggle

```vue
<script setup lang="ts">
const model = defineModel<boolean>({ required: true })

defineProps<{
  id?: string
  name?: string
  disabled?: boolean
  describedBy?: string
  invalid?: boolean
}>()
</script>

<template>
  <input
    :id="id"
    v-model="model"
    type="checkbox"
    :name="name"
    :disabled="disabled"
    :aria-invalid="invalid || undefined"
    :aria-describedby="describedBy"
    class="base-checkbox"
  />
</template>
```

Register: «I agree to terms» — checkbox + link в hint slot.

```vue
<FormField :error="errors.agreed">
  <template #default="{ id, describedBy, invalid }">
    <div class="checkbox-row">
      <BaseCheckbox
        :id="id"
        v-model="form.agreed"
        name="agreed"
        :described-by="describedBy"
        :invalid="invalid"
      />
      <label :for="id">I agree to the terms</label>
    </div>
  </template>
</FormField>
```

---

## 9. Shared props type

```ts
// components/form/types.ts
export type FieldA11yProps = {
  id?: string
  name?: string
  describedBy?: string
  invalid?: boolean
  required?: boolean
  disabled?: boolean
}

export type FieldChromeProps = {
  label?: string
  hint?: string
  error?: string
}
```

DRY для TypeScript без runtime overhead.

---

## 10. Error display — hook для validation

Сейчас error — **prop string** с parent:

```vue
<TextField v-model="form.email" :error="errors.email" />
```

После VeeValidate — тот же prop из `errorMessage` field meta:

```vue
<TextField v-model="email" :error="errors.email" />
<!-- errors.email из useForm / Field -->
```

**Правило:** field component **не** решает «valid or not» — только **показывает** message.

| Ответственность | Кто |
|-----------------|-----|
| value binding | `v-model` |
| validate rules | form lib / Zod *(уроки 4–6)* |
| render error | `FormField` / `TextField` |
| aria-invalid | control получает `invalid` от wrapper |

---

## 11. Disabled и pending submit

```vue
<TextField v-model="form.title" :disabled="isPending" />
<button type="submit" :disabled="isPending">Save</button>
```

Проп `disabled` пробрасывай до native control — browser блокирует input, screen reader ok.

Не только `pointer-events: none` на wrapper.

---

## 12. Slots для кастомизации

```vue
<!-- FormField.vue — optional slots -->
<slot name="label" :label="label">{{ label }}</slot>
<slot />
<slot name="hint" :hint="hint">{{ hint }}</slot>
<slot name="error" :error="error">{{ error }}</slot>
```

Password field с toggle visibility:

```vue
<FormField label="Password" :error="errors.password">
  <template #default="{ id, describedBy, invalid }">
    <div class="input-with-action">
      <BaseInput
        :id="id"
        v-model="password"
        :type="showPassword ? 'text' : 'password'"
        :described-by="describedBy"
        :invalid="invalid"
      />
      <button type="button" @click="showPassword = !showPassword">
        {{ showPassword ? 'Hide' : 'Show' }}
      </button>
    </div>
  </template>
</FormField>
```

---

## 13. `name` и native submit

Для `@submit.prevent` + JS submit `name` optional.

Для progressive enhancement / FormData:

```html
<form action="/api/login" method="post">
  <BaseInput name="email" … />
</form>
```

Module 9 practice — **prevent default** + api; `name` всё равно полезен для autofill и tests.

---

## 14. Стили: invalid state

```css
.form-field--invalid .base-input {
  border-color: var(--color-danger);
}

.form-field__error {
  color: var(--color-danger);
  font-size: 0.875rem;
}
```

Class на wrapper + `:aria-invalid` на input — и визуал, и a11y.

---

## 15. Пример: Login form из полей

```vue
<script setup lang="ts">
import { ref } from 'vue'
import TextField from '@/components/form/TextField.vue'

const form = ref({ email: '', password: '' })
const errors = ref<{ email?: string; password?: string }>({})

async function onSubmit() {
  errors.value = {}
  // validation позже
  console.log(form.value)
}
</script>

<template>
  <form @submit.prevent="onSubmit">
    <TextField
      v-model="form.email"
      label="Email"
      type="email"
      name="email"
      autocomplete="username"
      :error="errors.email"
      required
    />
    <TextField
      v-model="form.password"
      label="Password"
      type="password"
      name="password"
      autocomplete="current-password"
      :error="errors.password"
      required
    />
    <button type="submit">Sign in</button>
  </form>
</template>
```

---

## 16. Частые ошибки

### Label без `for` / input без `id`

Screen reader не связывает поле. `useId()` + slot props.

### Error только цветом border

Нужен текст + `role="alert"` + `aria-describedby`.

### Validation logic внутри `BaseInput`

Field не знает про Zod. Parent / VeeValidate передаёт `error`.

### Копировать `modelValue` в local state

Desync — см. [урок 01](./01-complex-v-model.md).

### `FormField` без slot props

Child hardcode id — конфликты при нескольких полях.

### Checkbox label только снаружи без `:for`

Два label или ни одного — выбери один pattern.

---

## 17. Что важно понять после этого блока

Проверь себя:

1. Зачем `FormField` отдельно от `BaseInput`?
2. Что передаёт scoped slot в control?
3. Кто отвечает за текст ошибки vs `aria-invalid`?
4. Зачем `autocomplete` на login?
5. Когда `TextField` all-in-one vs slot composition?
6. Почему `disabled` на native, не только CSS?

---

## 18. Что почитать

### Официальное

- [Form Input Bindings](https://vuejs.org/guide/essentials/forms.html)
- [useId](https://vuejs.org/api/composition-api-helpers.html#useid)
- [WAI-ARIA · form practices](https://www.w3.org/WAI/tutorials/forms/)

### Связанные материалы этого плана

- [Module 9 · сложный v-model](./01-complex-v-model.md)

---

## 19. Практическое мини-задание

1. Создай `components/form/`: `FormField`, `BaseInput`, `TextField`
2. Login page только через `TextField`
3. Добавь `hint` на email, fake `error` prop для demo
4. Проверь в DevTools: `id`, `aria-describedby`, `aria-invalid`
5. `SelectField` для category в product form *(optional)*

---

## 20. Мини-конспект

- custom fields = DRY + consistent a11y + error chrome
- `FormField` + scoped slot → id/describedBy/invalid
- `defineModel` в Base*; validation снаружи
- `TextField` склеивает wrapper + input для pages
- готовность к VeeValidate: prop `error`
- дальше — **controlled patterns**

---

## 21. Что делать дальше

Следующий теоретический блок Module 9:

- [controlled patterns](./03-controlled-patterns.md)
