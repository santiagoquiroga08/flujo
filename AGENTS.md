# AGENTS.md — Flujo

## Proyecto

Aplicación web de finanzas personales para registro y control presupuestario manual mensual.
Arquitectura monolítica modular basada en Next.js (App Router), TypeScript, Tailwind CSS y persistencia local mediante SQLite con Drizzle ORM.

## Comandos

- Ejecutar: `npm run dev`
- Tests: `npm run test`
- Lint/formato: `npm run lint` && `npx prettier --check .`

## Estilo y convenciones

- Entorno: Node.js LTS (v20+), TypeScript en modo estricto (`strict: true`).
- Nombres: `camelCase` para variables y funciones, `PascalCase` para componentes y tipos, `kebab-case` para archivos y directorios.
- Idioma: Código, esquemas de base de datos, commits e identificadores estrictamente en inglés; interfaz gráfica, mensajes de error al usuario y documentación en español.
- Arquitectura limpia: La lógica de negocio y cálculos financieros residen en módulos puros e independientes de la UI (`src/core/`), testeables sin React ni base de datos.

## Reglas

- Lee `docs/constitution.md` y la spec activa antes de tocar o generar código.
- No asumas comportamientos ni reglas de cálculo que no estén explícitamente detallados en la spec. Si falta una definición, detén la generación y pregunta.
- Prohibido agregar dependencias externas (npm) no aprobadas previamente.
- No implementar llamadas a APIs externas, scraping ni sincronizaciones bancarias automáticas.

## Al terminar cualquier tarea

- Ejecutar obligatoriamente `npm run lint` y `npm run test`.
- No dar por completada una tarea si existen pruebas unitarias en rojo o errores de tipos/linter pendientes.
