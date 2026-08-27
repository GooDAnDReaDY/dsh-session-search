# @goodandready-private/dsh-session-search

Плагин DeepSeek Harness с инструментом session_search. Ищет по истории
сессий через встроенный sessionQuery и не загружает весь архив в память.

## Установка

Пакет публикуется в приватный GitHub Packages registry:

```sh
pnpm add @goodandready-private/dsh-session-search
```

Плагин host-only: клиентского loader-файла нет. Bundle patch регистрирует
host id dsh-session-search с private package name.

Настройка лимита результатов выполняется через maxResults.
