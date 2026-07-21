# Module 9 · Теория: сложный `v-model`

Этот материал открывает **Module 9** и закрывает первый теоретический пункт: **`v-model` на компонентах**, несколько моделей, модификаторы, **`defineModel`**, объектные модели — фундамент для форм до VeeValidate.

Связанные материалы:

- [Module 8 · mutations](../module-8/04-mutations.md) *(form submit → mutation)*
- [Module 6 · local state](../module-6/01-local-vs-global-state.md)
- [Module 4 · typing props](../module-4/01-typing-props.md) · [typing emits](../module-4/02-typing-emits.md)

---

## 1. Зачем Module 9 после Module 8

```text
Module 7–8  → загрузить/изменить server data (fetch, vue-query)
Module 9    → собрать ввод пользователя: login, profile, checkout, create product form
```

Форма — это:

- **локальное состояние** полей *(draft)*
- **валидация** до/после submit
- **submit** → api или mutation
- UX: pending, disabled, errors, focus

`v-model` — базовый кирпич **связи поля ↔ state**.

Официально:

- [Component v-model](https://vuejs.org/guide/components/v-model.html)
- [Forms input bindings](https://vuejs.org/guide/essentials/forms.html)

---

## 2. Напоминание: `v-model` на native input

```vue
<script setup lang="ts">
import { ref } from 'vue'

const email = ref('')
</script>

<template>
  <input v-model="email" type="email" />
  <p>{{ email }}</p>
</template>
```

Синтаксический сахар:

```vue
<input
  :value="email"
  @input="email = ($event.target as HTMLInputElement).value"
/>
```

Для `<input>` Vue выбирает prop/event по типу (`checkbox` → `checked` / `change`).

---

## 3. `v-model` на компоненте — контракт

По умолчанию child должен:

```text
prop:   modelValue
emit:   update:modelValue
```

```vue
<!-- Parent -->
<BaseInput v-model="email" label="Email" />
```

```vue
<!-- BaseInput.vue -->
<script setup lang="ts">
const props = defineProps<{
  modelValue: string
  label?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

function onInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}
</script>

<template>
  <label>
    {{ label }}
    <input :value="modelValue" @input="onInput" />
  </label>
</template>
```

```text
Parent v-model="email"
  ⇄  :modelValue="email" + @update:modelValue="email = $event"
```

Это **controlled component**: источник правды — parent ref; child только отображает и сообщает изменения.

---

## 4. `defineModel` (Vue 3.4+)

Короче тот же контракт:

```vue
<script setup lang="ts">
const model = defineModel<string>({ required: true })

defineProps<{ label?: string }>()
</script>

<template>
  <label>
    {{ label }}
    <input v-model="model" />
  </label>
</template>
```

`defineModel` генерирует prop + emit; `model` — writable ref.

Для учебного проекта **рекомендуется** `defineModel` в custom inputs, если Vue ≥ 3.4.

---

## 5. Несколько `v-model` на одном компоненте

Именованные модели (Vue 3.3+):

```vue
<UserCredentials
  v-model:email="form.email"
  v-model:password="form.password"
/>
```

```vue
<!-- UserCredentials.vue -->
<script setup lang="ts">
const email = defineModel<string>('email', { required: true })
const password = defineModel<string>('password', { required: true })
</script>

<template>
  <input v-model="email" type="email" autocomplete="username" />
  <input v-model="password" type="password" autocomplete="current-password" />
</template>
```

Без `defineModel`:

```ts
defineProps<{ email: string; password: string }>()
defineEmits<{
  'update:email': [value: string]
  'update:password': [value: string]
}>()
```

| Подход | Когда |
|--------|--------|
| один `v-model` + object prop | маленькая форма в одном объекте |
| `v-model:field` × N | переиспользуемый блок полей |
| один object `v-model="form"` | address block, settings panel |

---

## 6. Объект как одна модель

```vue
<script setup lang="ts">
import { ref } from 'vue'

type LoginForm = {
  email: string
  password: string
}

const form = ref<LoginForm>({ email: '', password: '' })
</script>

<template>
  <LoginFormFields v-model="form" />
</template>
```

```vue
<!-- LoginFormFields.vue -->
<script setup lang="ts">
type LoginForm = { email: string; password: string }

const form = defineModel<LoginForm>({ required: true })
</script>

<template>
  <input v-model="form.email" type="email" />
  <input v-model="form.password" type="password" />
</template>
```

**Важно:** мутируешь **поля объекта** (`form.email = …`) — объект тот же ref, Vue 3 reactivity ok.

**Anti-pattern:** полностью заменять `form` в child без emit:

```ts
// плохо в child без v-model contract
form.value = { email: 'x', password: '' } // parent не узнает, если не emit
```

С `defineModel` присвоение `form.value = …` синхронизирует parent.

---

## 7. Модификаторы `v-model`

### Встроенные на native

```vue
<input v-model.trim="name" />
<input v-model.number="age" type="number" />
<input v-model.lazy="bio" />  <!-- sync on change, not input -->
```

### Кастомный модификатор на компоненте

Parent:

```vue
<BaseInput v-model.capitalize="title" />
```

Child с `defineModel`:

```vue
<script setup lang="ts">
const [model, modifiers] = defineModel<string>({
  set(value) {
    if (modifiers.capitalize && value) {
      return value.charAt(0).toUpperCase() + value.slice(1)
    }
    return value
  },
})
</script>
```

Или classic emits:

```ts
emit('update:modelValue', modifiers.capitalize ? capitalize(raw) : raw)
```

Module 9 practice: `.trim` на email — типичный UX.

---

## 8. Checkbox, radio, select

```vue
<script setup lang="ts">
import { ref } from 'vue'

const agreed = ref(false)
const plan = ref<'free' | 'pro'>('free')
const tags = ref<string[]>([])
</script>

<template>
  <input v-model="agreed" type="checkbox" />

  <input v-model="plan" type="radio" value="free" />
  <input v-model="plan" type="radio" value="pro" />

  <select v-model="tags" multiple>
    <option value="vue">Vue</option>
    <option value="ts">TypeScript</option>
  </select>
</template>
```

Custom `CheckboxField` — тот же контракт `modelValue: boolean`.

---

## 9. «Сложный» сценарий: nested object

```ts
type AddressForm = {
  street: string
  city: string
  zip: string
}

type CheckoutForm = {
  name: string
  address: AddressForm
}
```

```vue
<AddressFields v-model="form.address" />
```

```vue
<script setup lang="ts">
import type { AddressForm } from '@/types/forms'

const address = defineModel<AddressForm>({ required: true })
</script>

<template>
  <input v-model="address.street" placeholder="Street" />
  <input v-model="address.city" placeholder="City" />
  <input v-model="address.zip" placeholder="ZIP" />
</template>
```

Parent держит один `form` ref; секции — subcomponents с slice модели.

**Не** копируй `address` в local ref в child без sync — рассинхрон при submit.

---

## 10. Controlled vs uncontrolled (Vue-термины)

| | Controlled *(Vue default)* | Uncontrolled |
|---|---------------------------|--------------|
| State | parent `ref` / `reactive` | DOM сам |
| Связь | `v-model` | `ref` на input + read on submit |
| Формы | **recommended** | редко (file, legacy) |

```vue
<!-- controlled — Module 9 standard -->
<input v-model="email" />

<!-- uncontrolled — только если осознанно -->
<input ref="emailEl" />
<button @click="submit">Go</button>
```

```ts
function submit() {
  const email = emailEl.value?.value ?? ''
}
```

Для validation library и disabled/pending states нужен **controlled**.

Подробнее — [controlled patterns](./03-controlled-patterns.md).

---

## 11. Связь с submit и Module 8

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useMutation } from '@tanstack/vue-query'

const form = ref({ title: '', price: 0 })

const { mutateAsync, isPending } = useMutation({
  mutationFn: createProduct,
})

async function onSubmit() {
  await mutateAsync(form.value)
}
</script>

<template>
  <form @submit.prevent="onSubmit">
    <input v-model="form.title" :disabled="isPending" />
    <input v-model.number="form.price" type="number" :disabled="isPending" />
    <button type="submit" :disabled="isPending">Save</button>
  </form>
</template>
```

`v-model` ≠ validation — только binding. Validation — следующие уроки.

---

## 12. Частые ошибки

### Mutate prop напрямую в child

```ts
// props.modelValue = 'x'  // NO
emit('update:modelValue', 'x') // YES
// или defineModel
```

### Дублировать state: parent ref + child local copy

```ts
// child
const local = ref(props.modelValue) // desync!
```

Используй `defineModel` или `watch` sync *(хуже)*.

### `v-model` на object — replace whole object без реактивности

```ts
form.value = { ...form.value, email: 'a' } // ok
form.value.email = 'a' // ok для reactive/ref nested
```

### Забыть `.number` на price

`price` строка `"99"` → API validation fail.

### Custom input без `update:modelValue`

Parent не обновляется.

### Два источника правды: Pinia + v-model form

Draft формы — **local** до submit; не пиши каждый keystroke в store без причины.

---

## 13. Что важно понять после этого блока

Проверь себя:

1. Чем `v-model` на component отличается от native?
2. Что такое `modelValue` / `update:modelValue`?
3. Зачем `defineModel`?
4. Когда `v-model:email` vs один object `v-model`?
5. Что делает модификатор `.trim`?
6. Почему формы в Module 9 — controlled?

---

## 14. Что почитать

### Официальное

- [Component v-model](https://vuejs.org/guide/components/v-model.html)
- [defineModel](https://vuejs.org/api/sfc-script-setup.html#definemodel)
- [Form Input Bindings](https://vuejs.org/guide/essentials/forms.html)

### Связанные материалы этого плана

- [Module 8 · mutations](../module-8/04-mutations.md)

---

## 15. Практическое мини-задание

1. `BaseInput.vue` с `defineModel<string>`
2. Login page: `email` + `password` через `v-model` или named models
3. `ProductForm`: object `{ title, price }` + `v-model.number` на price
4. `.trim` на email field
5. Submit console.log form — без validation пока ok

---

## 16. Мини-конспект

- component `v-model` = `modelValue` + `update:modelValue`
- `defineModel` упрощает custom inputs
- named `v-model:field` для multi-field components
- object model — секции формы без desync
- modifiers: `.trim`, `.number`, custom
- дальше — **кастомные поля**

---

## 17. Что делать дальше

Следующий теоретический блок Module 9:

- [кастомные поля](./02-custom-fields.md)
