# Module 0 · Теория: установка и использование `Vue Devtools`

Этот материал закрывает четвёртый теоретический пункт `Module 0`: понять, **что такое Vue Devtools**, **как его установить**, **как проверить, что он работает**, и **зачем он нужен уже на раннем этапе обучения**.

---

## 1. Что такое Vue Devtools

**Vue Devtools** — официальный инструмент для отладки Vue-приложений.

Если обычные browser DevTools показывают HTML, CSS, network и console, то Vue Devtools показывает **Vue-уровень приложения**:

- дерево компонентов;
- props, data, refs, computed;
- события компонентов;
- состояние `Pinia`;
- маршруты `Vue Router`;
- производительность и timeline.

Проще говоря: это «рентген» для Vue-приложения.

Официальная документация: [devtools.vuejs.org](https://devtools.vuejs.org/)

---

## 2. Зачем Vue Devtools нужен уже на старте

Многие новички откладывают DevTools «на потом», но для Vue это плохая идея.

С DevTools ты быстрее понимаешь:

- **откуда берутся данные** в компоненте;
- **почему UI не обновился** после изменения state;
- **как связаны родитель и ребёнок** через props/emits;
- **что лежит в store**;
- **какой route сейчас активен**.

Без DevTools Vue часто кажется «магией». С DevTools реактивность и component tree становятся наблюдаемыми.

---

## 3. Какие бывают варианты установки

Для этого учебного плана важны три способа.

| Способ | Когда использовать |
|--------|-------------------|
| **Browser extension** | Основной и самый простой вариант для локальной разработки |
| **Vite plugin** | Рекомендуется для проектов на `Vite` |
| **Standalone app** | Для Electron, нестандартных браузеров и особых окружений |

Для обычного Vue 3 + Vite проекта обычно достаточно:

1. установить browser extension;
2. при необходимости добавить `vite-plugin-vue-devtools`.

---

## 4. Важная оговорка про версии

- **Vue Devtools v7+** работает только с **Vue 3**.
- Для **Vue 2** нужна старая версия DevTools.
- В этом плане мы используем **Vue 3**, поэтому ставим актуальную версию.

Если DevTools не видит приложение, одна из частых причин — проект всё ещё на Vue 2 или используется production-сборка без dev-mode.

---

## 5. Установка через browser extension

Это самый удобный способ для начала.

### Chrome / Edge / Brave / Arc и другие Chromium-браузеры

1. Открой [Vue.js devtools в Chrome Web Store](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
2. Нажми **Add to Chrome** / **Установить**
3. Закрепи иконку расширения на панели браузера, если нужно

Официальная инструкция: [Browser Extension · Vue DevTools](https://devtools.vuejs.org/guide/browser-extension)

### Firefox

1. Открой страницу расширения в Firefox Add-ons
2. Установи **Vue.js devtools**
3. Перезапусти вкладку с приложением

---

## 6. Установка через Vite plugin

Для Vue-проектов на Vite официально рекомендуется plugin:

```bash
npm install -D vite-plugin-vue-devtools
```

Пример `vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
})
```

Зачем он нужен, если уже есть browser extension:

- более глубокая интеграция с Vite;
- component inspector;
- удобнее работать в dev-окружении;
- это рекомендуемый путь для современных Vue 3 проектов.

Документация: [Vite Plugin · Vue DevTools](https://devtools.vuejs.org/guide/vite-plugin)

Примечание: некоторые проекты, созданные через `create-vue`, уже могут включать этот plugin — проверь `vite.config.ts` и `package.json`.

---

## 7. Standalone-версия

Standalone нужна реже, но полезно знать, что она существует.

```bash
npm install -g @vue/devtools
vue-devtools
```

Используется, если:

- браузер не поддерживает extension;
- приложение работает в Electron;
- нужно подключаться к нестандартному окружению.

Документация: [Standalone App · Vue DevTools](https://devtools.vuejs.org/guide/standalone)

Для обычного учебного Vue-проекта **standalone не обязателен**.

---

## 8. Как проверить, что DevTools работает

### Шаг 1. Запусти Vue-проект в dev-режиме

```bash
npm install
npm run dev
```

### Шаг 2. Открой приложение в браузере

Обычно это что-то вроде:

```text
http://localhost:5173
```

### Шаг 3. Открой browser DevTools

- `F12`
- или `Ctrl + Shift + I` в Windows

### Шаг 4. Найди вкладку `Vue`

Если всё установлено правильно, среди вкладок DevTools появится **Vue**.

### Шаг 5. Проверь дерево компонентов

Ты должен увидеть:

- корневой компонент приложения;
- дочерние компоненты;
- props/state выбранного компонента.

Если вкладка `Vue` есть и дерево компонентов видно — DevTools установлен и работает.

---

## 9. Что умеет Vue Devtools

### Components

Самая важная вкладка на старте.

Позволяет:

- смотреть дерево компонентов;
- inspect props, refs, reactive state, computed;
- редактировать значения и сразу видеть результат в UI.

Это особенно полезно при изучении реактивности.

### Pinia

Когда подключишь store, DevTools покажет:

- stores;
- state;
- getters;
- actions/events.

### Router

Показывает:

- текущий route;
- список маршрутов;
- параметры и query.

### Timeline / Performance

Позже пригодится для:

- отслеживания событий;
- поиска лишних обновлений;
- анализа производительности.

На раннем этапе достаточно освоить вкладку **Components**.

---

## 10. Как пользоваться DevTools в учебном процессе

Хорошая привычка с первых дней:

1. Запустил компонент → открой Vue Devtools.
2. Изменил data/ref → посмотри, обновился ли UI.
3. Передал props → проверь их в дереве компонентов.
4. Подключил store → проверь state в Pinia tab.
5. Что-то «не работает» → сначала inspect, потом console.log.

DevTools должен заменить хаотичные `console.log` почти везде, где речь о состоянии компонентов.

---

## 11. Частые проблемы и решения

### Вкладки `Vue` нет

Проверь:

- приложение запущено через `npm run dev`, а не через production build;
- используется **Vue 3**;
- расширение установлено и включено;
- страница перезагружена после установки extension;
- открыта именно страница с Vue-приложением, а не пустая HTML-страница.

### DevTools видит страницу, но не видит Vue-приложение

Проверь:

- проект действительно на Vue;
- dev-server запущен без ошибок;
- нет нескольких конфликтующих Vue DevTools extensions;
- если используешь Vite plugin — он подключён в `vite.config.ts`.

### Иконка Vue серая / inactive

Обычно это значит, что на текущей вкладке нет активного Vue-приложения.

### DevTools не работает в production

Это нормально. Vue DevTools предназначен для **development**, а не для production debugging.

---

## 12. DevTools и Nuxt

Если позже ты перейдёшь на `Nuxt`, там есть отдельный инструмент — **Nuxt DevTools**.

Для обычного Vue + Vite проекта используй **Vue DevTools**.  
Для Nuxt-проекта позже имеет смысл подключать [Nuxt DevTools](https://devtools.nuxt.com/).

---

## 13. Что важно понять после этого блока

Проверь себя:

1. Зачем нужен Vue Devtools, если уже есть browser DevTools?
2. Какой способ установки лучше для обычного Vue 3 + Vite проекта?
3. Почему DevTools может не работать в production?
4. Как понять, что DevTools установлен правильно?
5. Какая вкладка самая полезная на раннем этапе обучения?

---

## 14. Что почитать

### Официальное

- [Vue DevTools · Introduction](https://devtools.vuejs.org/getting-started/introduction)
- [Vue DevTools · Installation](https://devtools.vuejs.org/getting-started/installation)
- [Browser Extension Guide](https://devtools.vuejs.org/guide/browser-extension)
- [Vite Plugin Guide](https://devtools.vuejs.org/guide/vite-plugin)
- [Tooling · Vue.js Guide RU](https://ru.vuejs.org/guide/scaling-up/tooling.html)

### Полезный контекст

- [PurpleSchool · Vue Devtools](https://purpleschool.ru/knowledge-base/vue/tools-n-ecosystem/devtools) — понятное русскоязычное объяснение установки и использования

---

## 15. Что посмотреть

### Рекомендуется в первую очередь

1. **Installing Vue DevTools**  
   [YouTube](https://www.youtube.com/watch?v=iKck6xEnIhc)  
   Короткое видео про установку расширения в Chrome.

2. **Официальная документация Vue Devtools**  
   [devtools.vuejs.org](https://devtools.vuejs.org/)  
   Лучше всего использовать как основной reference после первой установки.

### Дополнительно

3. **Vue 3 фундаментальный курс · Ulbi TV**  
   [YouTube](https://www.youtube.com/watch?v=XzLuMtDelGk)  
   В процессе курса DevTools естественно используется при разборе компонентов и реактивности.

4. **Tooling · Vue.js Guide RU**  
   [ru.vuejs.org/guide/scaling-up/tooling](https://ru.vuejs.org/guide/scaling-up/tooling.html)  
   Короткий официальный блок про browser DevTools в экосистеме Vue.

### Короткий маршрут (~20–30 минут)

| Время | Что делать |
|------|-----------|
| ~5 мин | Прочитать этот файл |
| ~5 мин | Установить browser extension |
| ~10 мин | Запустить Vue-проект и найти вкладку `Vue` |
| ~5 мин | Покликать дерево компонентов и изменить одно значение в inspect panel |

---

## 16. Практическое мини-задание

После установки DevTools сделай маленькую проверку:

1. Создай или открой простой Vue-проект.
2. Запусти `npm run dev`.
3. Открой вкладку `Vue` в browser DevTools.
4. Выбери компонент в дереве.
5. Измени одно reactive-значение прямо в DevTools.
6. Убедись, что UI обновился.

Если это получилось — шаг можно считать закрытым.

---

## 17. Мини-конспект

- Vue Devtools — официальный инструмент отладки Vue-приложений.
- Для старта обычно достаточно browser extension.
- Для Vite-проектов дополнительно полезен `vite-plugin-vue-devtools`.
- DevTools работает в development и помогает видеть component tree, state, store и routes.
- Это один из самых полезных инструментов для понимания Vue, особенно реактивности.

---

## 18. Что делать дальше

После этого материала переходи к следующему пункту `Module 0`:

- базовая настройка редактора для работы с `.vue`.

Практически имеет смысл сразу установить DevTools до первого полноценного pet-project — так ты будешь видеть, как Vue реально работает под капотом UI.
