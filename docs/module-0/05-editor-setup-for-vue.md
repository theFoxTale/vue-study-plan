# Module 0 · Теория: базовая настройка редактора для работы с `.vue`

Этот материал закрывает последний теоретический пункт `Module 0`: настроить редактор так, чтобы `.vue`-файлы были удобны для чтения, автодополнения, TypeScript-проверки и форматирования.

---

## 1. Зачем отдельно настраивать редактор

Файл `.vue` — это не обычный JavaScript и не обычный HTML. В одном файле живут сразу три зоны:

- `<template>`
- `<script setup>`
- `<style>`

Без правильной настройки редактор:

- не понимает синтаксис `.vue`;
- не подсказывает props, refs, composables;
- не проверяет TypeScript внутри шаблона;
- не форматирует код аккуратно.

Хорошая настройка редактора экономит много времени уже на первых компонентах.

---

## 2. Какой редактор использовать

Для этого учебного плана рекомендуется:

- **VS Code** или **Cursor**

Оба основаны на одной экосистеме расширений, поэтому настройка почти одинаковая.

Официальная рекомендация Vue: **VS Code + Vue - Official extension**.

---

## 3. Главное расширение: Vue - Official

Это **официальное** расширение для Vue 3.

- Marketplace ID: `Vue.volar`
- Название: **Vue - Official**
- Раньше называлось **Volar**

Что даёт:

- подсветку синтаксиса в `.vue`;
- IntelliSense для template, script и style;
- TypeScript support внутри SFC;
- go to definition;
- автоимпорт;
- базовое форматирование `.vue`-файлов.

Установка:

1. Открой Extensions (`Ctrl + Shift + X`)
2. Найди `Vue - Official`
3. Установи расширение от **Vue**

Ссылка: [Vue - Official · VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=Vue.volar)

---

## 4. Что нужно отключить

### Vetur

Если у тебя когда-то был установлен **Vetur**, его нужно **отключить** для Vue 3 проектов.

Почему:

- Vetur был официальным extension для Vue 2;
- для Vue 3 он конфликтует с Vue - Official;
- может ломать подсветку, TS и автодополнение.

Правило:

- **Vue 3 → Vue - Official**
- **Vetur → off**

---

## 5. Какие расширения поставить для Vue-стека

### Обязательный минимум

| Расширение | Зачем |
|-----------|-------|
| **Vue - Official** | Поддержка `.vue`, TS, template IntelliSense |
| **ESLint** | Показывает lint-ошибки прямо в редакторе |

### Очень желательно

| Расширение | Зачем |
|-----------|-------|
| **Prettier** | Единый формат кода |
| **Error Lens** | Ошибки видны прямо в строке *(опционально)* |

### Не обязательно на старте

- GitLens
- Tailwind CSS IntelliSense
- i18n Ally
- Icon Themes

На первом этапе лучше не перегружать редактор.

---

## 6. Базовая настройка проекта через `.vscode`

Лучше хранить editor-настройки **в самом проекте**, а не только глобально.

Создай папку:

```text
.vscode/
  settings.json
  extensions.json
```

### `.vscode/settings.json`

Минимально полезный набор:

```json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[vue]": {
    "editor.defaultFormatter": "Vue.volar"
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact",
    "vue"
  ]
}
```

### Что здесь важно

- `typescript.tsdk` — редактор использует TypeScript из проекта, а не встроенный;
- `formatOnSave` — код автоматически форматируется при сохранении;
- `[vue]` — для `.vue` используется formatter от Vue - Official;
- `eslint.validate` — ESLint проверяет и `.vue`-файлы.

---

## 7. Рекомендуемые расширения для команды

Файл `.vscode/extensions.json` помогает быстро поставить нужные extensions:

```json
{
  "recommendations": [
    "Vue.volar",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode"
  ]
}
```

После этого VS Code / Cursor может предложить установить рекомендованные расширения автоматически.

---

## 8. Как должен выглядеть `.vue`-файл в редакторе

Пример:

```vue
<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)
</script>

<template>
  <button @click="count++">
    Count: {{ count }}
  </button>
</template>

<style scoped>
button {
  padding: 8px 12px;
}
</style>
```

Если редактор настроен правильно, ты получишь:

- подсветку `<template>`, `<script>`, `<style>`;
- автодополнение для `ref`, `computed`, props;
- hover-подсказки;
- переход к определению символов;
- форматирование при сохранении.

---

## 9. TypeScript в `.vue`

Для Vue 3 + TypeScript важно использовать:

```vue
<script setup lang="ts">
```

А не просто:

```vue
<script setup>
```

Почему:

- типы props и emits будут проверяться;
- composables станут типобезопаснее;
- editor сможет лучше помогать в шаблоне.

Дополнительно полезно знать про:

- `vue-tsc` — CLI-проверка типов для `.vue`
- workspace TypeScript из `node_modules/typescript`

Проверка типов из терминала:

```bash
npx vue-tsc --noEmit
```

---

## 10. ESLint и Prettier: как они связаны с редактором

В Module 0 мы подключаем их и в проект, и в editor.

### ESLint

Нужен, чтобы видеть проблемы прямо во время написания кода:

- неиспользуемые переменные;
- ошибки Vue-правил;
- проблемы TypeScript;
- плохие паттерны в `.vue`.

### Prettier

Нужен, чтобы код выглядел одинаково:

- отступы;
- кавычки;
- переносы строк;
- формат `<template>` и `<script>`.

Важно:

- **ESLint** отвечает за качество и правила;
- **Prettier** отвечает за форматирование;
- editor показывает результат обоих инструментов.

---

## 11. Полезные editor settings для Vue

Можно добавить позже, но полезно знать уже сейчас:

```json
{
  "files.associations": {
    "*.vue": "vue"
  },
  "emmet.includeLanguages": {
    "vue-html": "html"
  },
  "vue.inlayHints.missingProps": true,
  "vue.inlayHints.inlineHandlerLeading": true
}
```

### Что это даёт

- `.vue` всегда распознаётся как Vue-файл;
- Emmet работает в template;
- editor может подсказывать missing props и handlers.

---

## 12. Как проверить, что всё настроено правильно

### Checklist

1. Открыт `.vue`-файл
2. Есть подсветка синтаксиса
3. Работает автодополнение для `ref`, `computed`, `defineProps`
4. При наведении видны типы
5. ESLint показывает ошибки в `.vue`
6. При `Ctrl + S` код форматируется
7. Команда `npx vue-tsc --noEmit` проходит без type errors

### Быстрая проверка

1. Создай `.vue`-компонент с `<script setup lang="ts">`
2. Наведи курсор на `ref`
3. Попробуй `Ctrl + Space` для автодополнения
4. Сохрани файл и посмотри, изменилось ли форматирование
5. Запусти:

```bash
npm run lint
npx vue-tsc --noEmit
```

Если всё это работает — editor setup можно считать успешным.

---

## 13. Частые проблемы

### `.vue` открывается как Plain Text

Причины:

- не установлен Vue - Official;
- не перезагружен editor после установки;
- конфликтует Vetur.

Решение:

- установи `Vue - Official`;
- отключи `Vetur`;
- выполни `Developer: Reload Window`.

### TypeScript в template не работает

Проверь:

- используется ли `lang="ts"`;
- установлен ли TypeScript в проекте;
- настроен ли `typescript.tsdk`.

### Prettier и ESLint конфликтуют

Обычно помогает:

- `eslint-config-prettier`
- явный formatter в settings
- формат только через save, lint отдельно

### Автоимпорт не предлагается

Проверь:

- Vue - Official активен;
- проект открыт как root folder, а не отдельный файл;
- dependencies установлены через `npm install`.

---

## 14. Cursor vs VS Code

Ты можешь использовать **Cursor** — для Vue-планa это нормально.

Что важно:

- ставятся те же extensions;
- работает тот же `.vscode/settings.json`;
- Vue - Official, ESLint и Prettier настраиваются так же.

То есть этот блок одинаково подходит и для VS Code, и для Cursor.

---

## 15. Что важно понять после этого блока

Проверь себя:

1. Почему для Vue 3 нужен Vue - Official, а не Vetur?
2. Зачем нужен `typescript.tsdk` в settings?
3. Чем ESLint отличается от Prettier?
4. Почему в `<script setup>` лучше писать `lang="ts"`?
5. Как понять, что `.vue`-файл действительно поддерживается editor-ом?

---

## 16. Что почитать

### Официальное

- [Tooling · Vue.js Guide RU](https://ru.vuejs.org/guide/scaling-up/tooling.html)
- [TypeScript with Vue · Overview](https://vuejs.org/guide/typescript/overview.html)
- [Vue - Official · VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=Vue.volar)
- [Using Vue in Visual Studio Code](https://code.visualstudio.com/docs/nodejs/vuejs-tutorial)

### Полезный контекст

- [Vue Language Tools · GitHub](https://github.com/vuejs/language-tools)
- [Prettier · Vue support](https://prettier.io/docs/en/options.html)

---

## 17. Что посмотреть

### Рекомендуется

1. **Using Vue in Visual Studio Code**  
   [VS Code Docs](https://code.visualstudio.com/docs/nodejs/vuejs-tutorial)  
   Официальный гайд по работе с Vue в VS Code.

2. **Vue 3 фундаментальный курс · Ulbi TV**  
   [YouTube](https://www.youtube.com/watch?v=XzLuMtDelGk)  
   В начале курса хорошо видно, как удобно работать с `.vue`-файлами в editor-е.

### Дополнительно

3. **Vue - Official extension page**  
   [Marketplace](https://marketplace.visualstudio.com/items?itemName=Vue.volar)  
   Полезно прочитать описание возможностей и команд extension.

---

## 18. Практическое мини-задание

1. Установи **Vue - Official**
2. Отключи **Vetur**, если он есть
3. Создай `.vscode/settings.json`
4. Создай `.vscode/extensions.json`
5. Открой простой `.vue`-компонент
6. Проверь подсветку, автодополнение и format on save

Если editor помогает писать `.vue` так же удобно, как обычный `.ts`, шаг можно считать завершённым.

---

## 19. Мини-конспект

- Для Vue 3 нужен **Vue - Official**, а не Vetur.
- `.vue` требует специальной language support, потому что это multi-section file.
- TypeScript в SFC лучше включать через `lang="ts"`.
- ESLint и Prettier должны быть связаны и с проектом, и с editor-ом.
- Настройки лучше хранить в `.vscode/settings.json`, чтобы проект был переносимым.

---

## 20. Что делать дальше

Теория `Module 0` завершена. Следующий шаг — **практика**:

- установить окружение;
- создать тестовый проект;
- подключить `TypeScript`, `ESLint`, `Prettier`;
- настроить aliases, scripts и `.env`;
- собрать проект и проверить production preview.

После этого можно переходить к `Module 1`.
