# Plan de Arquitectura e Implementación: Flujo MVP (001-flujo-mvp)

Este documento define la arquitectura técnica, modelo de datos relacional, contratos de API/Server Actions, algoritmos del núcleo financiero, estrategia de pruebas y desglose de tareas para la construcción del MVP de **Flujo**.

El diseño respeta estrictamente los principios innegociables de [constitution.md](file:///d:/antigravity/Flujo/docs/constitution.md), las directrices de desarrollo de [AGENTS.md](file:///d:/antigravity/Flujo/AGENTS.md) y los criterios funcionales de [spec.md](file:///d:/antigravity/Flujo/specs/001-flujo-mvp/spec.md).

---

## 1. Estructura Modular del Proyecto en Next.js

Para garantizar la **separación estricta de lógica e interfaz** (Principio 3 de la Constitución y RNF-6), la aplicación se organiza como un monolito modular con capas unidireccionales desacopladas.

```
flujo/
├── docs/
│   └── constitution.md             # Principios innegociables del proyecto
├── specs/
│   └── 001-flujo-mvp/
│       ├── spec.md                 # Especificación funcional aprobada
│       └── plan.md                 # Plan de arquitectura e implementación (este archivo)
├── src/
│   ├── core/                       # [Capa 1: Núcleo Financiero Puro]
│   │   │                           # Prohibido importar React, Next.js o librerías de BD aquí
│   │   ├── types.ts                # Tipos de dominio puros (TransactionType, Category, etc.)
│   │   ├── money.ts                # Aritmética de precisión fija en centavos (RNF-1)
│   │   ├── dates.ts                # Validación de calendario gregoriano y límites temporales (RF-3, RF-5)
│   │   ├── metrics.ts              # Fórmulas de disponible, porcentajes y balances (RF-4, RF-5)
│   │   └── validators.ts           # Reglas de validación pura de inputs (categorías, montos, notas)
│   │
│   ├── db/                         # [Capa 2: Persistencia Local Drizzle/SQLite]
│   │   ├── index.ts                # Conexión singleton better-sqlite3 y cliente Drizzle (RNF-5)
│   │   ├── schema.ts               # Definición de tablas relacionales, índices y restricciones
│   │   ├── seed.ts                 # Población inicial de categorías base sugeridas (CA-1.2)
│   │   └── migrations/             # Migraciones SQL versionadas
│   │
│   ├── actions/                    # [Capa 3: Orquestación / Server Actions]
│   │   │                           # Puente entre UI, Core y Persistencia con tipado estricto
│   │   ├── categories.ts           # Acciones para catálogo de categorías (RF-1)
│   │   ├── budgets.ts              # Acciones para planificación presupuestaria (RF-2)
│   │   ├── transactions.ts         # Acciones para registro y mantenimiento de movimientos (RF-3)
│   │   └── summary.ts              # Consulta consolidada de dashboard mensual (RF-4, RF-5)
│   │
│   ├── components/                 # [Capa 4: Presentación e Interfaz de Usuario]
│   │   ├── ui/                     # Componentes base reutilizables (Botón, Modal, Input, Badge)
│   │   ├── categories/             # Formularios y listados de categorías (RF-1)
│   │   ├── budgets/                # Tablas de asignación presupuestaria por categoría (RF-2)
│   │   ├── transactions/           # Modal de registro, edición y tabla de transacciones (RF-3)
│   │   ├── summary/                # Tarjetas de balances, desviaciones y barras de progreso (RF-4, RF-5)
│   │   └── navigation/             # Selector y navegación temporal de meses (RF-5)
│   │
│   └── app/                        # [Capa 5: Enrutamiento Next.js App Router]
│       ├── layout.tsx              # Shell principal, tipografía e internacionalización visual
│       ├── page.tsx                # Redirección reactiva al mes actual (ej. /2026-03)
│       └── [yearMonth]/            # Vista mensual dinámica (/YYYY-MM) (RF-5)
│           └── page.tsx            # Server Component de carga paralela de datos del período
│
└── tests/                          # [Batería de Pruebas Automatizadas]
    ├── unit/
    │   ├── money.test.ts           # Pruebas de aritmética de centavos y redondeo HALF_UP
    │   ├── dates.test.ts           # Pruebas de fronteras temporales y fechas inválidas
    │   └── metrics.test.ts         # Pruebas de balances, sobregiros y división por cero
    └── integration/
        ├── categories.test.ts      # Integración DB: unicidad, borrado bloqueado y seed
        ├── budgets.test.ts         # Integración DB: aislamiento mensual y resets a $0.00
        └── transactions.test.ts    # Integración DB: recálculo reactivo y consistencia de tipos
```

### Reglas de Dependencia entre Capas

1. `src/core/` tiene **cero dependencias externas**. Solo utiliza funciones puras de TypeScript. No conoce a Next.js, no importa React ni accede a base de datos.
2. `src/db/` encapsula el acceso a datos y las entidades de persistencia.
3. `src/actions/` actúa como controlador orquestador: recibe inputs desde la UI, invoca validaciones del `core`, persiste en `db` mediante transacciones atómicas y retorna resultados tipados `Result<T, E>`.
4. `src/components/` y `src/app/` solo consumen datos estructurados y ejecutan Server Actions; ninguna regla de cálculo financiero reside en componentes.

_(Cubre: RNF-3, RNF-5, RNF-6, Principio 1, Principio 3 y Principio 6 de la Constitución)_

---

## 2. Modelo de Datos Relacional (Drizzle ORM + SQLite)

En cumplimiento con el Principio 6 de [constitution.md](file:///d:/antigravity/Flujo/docs/constitution.md), todas las tablas, columnas, restricciones e identificadores están estrictamente en idioma inglés.

### 2.1 Esquema Drizzle (`src/db/schema.ts`)

```typescript
import { sqliteTable, text, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core';

// Tipos de dominio según RF-1 (CA-1.1)
export const transactionTypes = ['income', 'expense'] as const;
export type TransactionType = (typeof transactionTypes)[number];

/**
 * Tabla de Categorías (RF-1: CA-1.1, CA-1.3, CA-1.4, CA-1.6, CA-1.7)
 * Representa el catálogo global de naturalezas financieras.
 */
export const categories = sqliteTable(
  'categories',
  {
    id: text('id').primaryKey(), // UUID v4 o CUID2 generado en aplicación
    name: text('name').notNull(), // Longitud 1 a 50 caracteres (CA-1.3)
    type: text('type', { enum: transactionTypes }).notNull(), // 'income' | 'expense' inmutable (CA-1.1)
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => ({
    // Unicidad de nombre por tipo (CA-1.4)
    nameTypeIdx: uniqueIndex('categories_name_type_unique_idx').on(table.name, table.type),
    typeIdx: index('categories_type_idx').on(table.type),
  })
);

/**
 * Tabla de Presupuestos Mensuales (RF-2: CA-2.1, CA-2.2, CA-2.4)
 * Aislamiento estricto por período (año-mes) y categoría.
 */
export const monthlyBudgets = sqliteTable(
  'monthly_budgets',
  {
    id: text('id').primaryKey(),
    categoryId: text('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'restrict' }), // Integridad referencial
    yearMonth: text('year_month').notNull(), // Formato estricto 'YYYY-MM' (ej. '2026-03')
    amountCents: integer('amount_cents').notNull().default(0), // Representación entera de centavos (0 a 99999999999)
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => ({
    // Un único presupuesto por categoría y mes calendario
    categoryYearMonthIdx: uniqueIndex('monthly_budgets_category_period_unique_idx').on(
      table.categoryId,
      table.yearMonth
    ),
    yearMonthIdx: index('monthly_budgets_year_month_idx').on(table.yearMonth),
  })
);

/**
 * Tabla de Transacciones Reales (RF-3: CA-3.1, CA-3.2, CA-3.3, CA-3.5, CA-3.6, CA-3.7)
 * Registro de movimientos efectivos.
 */
export const transactions = sqliteTable(
  'transactions',
  {
    id: text('id').primaryKey(),
    categoryId: text('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'restrict' }),
    type: text('type', { enum: transactionTypes }).notNull(), // Redundancia de seguridad validada en Core (CA-3.4)
    amountCents: integer('amount_cents').notNull(), // Monto > 0 en centavos enteros (1 a 99999999999)
    date: text('date').notNull(), // Formato estricto 'YYYY-MM-DD' (CA-3.3)
    yearMonth: text('year_month').notNull(), // 'YYYY-MM' derivado e indexado para búsquedas rápidas (CA-3.5)
    note: text('note'), // Texto plano normalizado hasta 250 caracteres (CA-3.1)
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => ({
    yearMonthIdx: index('transactions_year_month_idx').on(table.yearMonth),
    dateIdx: index('transactions_date_idx').on(table.date),
    categoryIdx: index('transactions_category_idx').on(table.categoryId),
  })
);
```

### 2.2 Payload / Ejemplos JSON de las Estructuras de Datos

#### Categoría (`Category`)

```json
{
  "id": "cat_7f8a9b0c-1234-4567-89ab-cdef01234567",
  "name": "Alimentación",
  "type": "expense",
  "createdAt": 1772928000000,
  "updatedAt": 1772928000000
}
```

#### Presupuesto Mensual (`MonthlyBudget`)

```json
{
  "id": "bdg_1a2b3c4d-5678-90ab-cdef-1234567890ab",
  "categoryId": "cat_7f8a9b0c-1234-4567-89ab-cdef01234567",
  "yearMonth": "2026-03",
  "amountCents": 4500000,
  "formattedAmount": "$450.00",
  "createdAt": 1772928000000,
  "updatedAt": 1772928000000
}
```

#### Transacción Real (`Transaction`)

```json
{
  "id": "tx_9z8y7x6w-5432-10fe-dcba-0987654321fe",
  "categoryId": "cat_7f8a9b0c-1234-4567-89ab-cdef01234567",
  "type": "expense",
  "amountCents": 12550,
  "formattedAmount": "$125.50",
  "date": "2026-03-08",
  "yearMonth": "2026-03",
  "note": "Supermercado compra semanal",
  "createdAt": 1772949600000,
  "updatedAt": 1772949600000
}
```

_(Cubre: RF-1, RF-2, RF-3, RNF-1, RNF-5, Principio 5 y Principio 6 de la Constitución)_

---

## 3. Algoritmos en Pseudocódigo del Núcleo Financiero (`src/core/`)

Para asegurar **precisión financiera exacta** (RNF-1), toda la matemática se implementa sobre enteros que representan centavos (`cents = Math.round(monto * 100)`). El redondeo de división para porcentajes utiliza el algoritmo estándar `HALF_UP`.

### 3.1 Algoritmo: Redondeo Matemático `HALF_UP` y Formateo Monetario

```typescript
ALGORITMO roundHalfUp(valorDecimal, decimalesDeseados):
  factor = 10 ^ decimalesDeseados
  signo = valorDecimal >= 0 ? 1 : -1
  valorAbsoluto = |valorDecimal|
  // Desplazar coma, sumar 0.5 para punto medio y truncar entero
  redondeado = truncar(valorAbsoluto * factor + 0.5) / factor
  RETORNAR signo * redondeado

ALGORITMO centsToCurrencyString(centavos):
  esNegativo = centavos < 0
  absolutoCentavos = |centavos|
  parteEntera = truncar(absolutoCentavos / 100)
  parteDecimal = absolutoCentavos MOD 100
  cadenaDecimal = parteDecimal < 10 ? ("0" + parteDecimal) : parteDecimal
  cadenaEntera = formatearConSeparadoresDeMiles(parteEntera)

  SI esNegativo ENTONCES:
    RETORNAR "-$" + cadenaEntera + "." + cadenaDecimal
  SINO:
    RETORNAR "$" + cadenaEntera + "." + cadenaDecimal
```

### 3.2 Algoritmo: Cálculo de Métricas por Categoría (`calculateCategoryMetrics`)

Cubre: RF-4 (CA-4.1, CA-4.2, CA-4.3, CA-4.4).

```typescript
TIPO CategoryStatus =
  | 'normal'              // Gasto <= Presupuesto o Ingreso con progreso
  | 'overbudget'          // Gasto > Presupuesto (con Presupuesto > 0)
  | 'unbudgeted_expense'  // Gasto > 0 con Presupuesto == 0
  | 'unbudgeted_income'   // Ingreso > 0 con Presupuesto == 0
  | 'unbudgeted_idle'     // Monto real == 0 con Presupuesto == 0

ALGORITMO calculateCategoryMetrics(categoryType, budgetCents, actualCents):
  // Asegurar valores válidos no negativos en entrada
  budgetCents = max(0, budgetCents)
  actualCents = max(0, actualCents)

  SI categoryType == 'expense' ENTONCES:
    remainingCents = budgetCents - actualCents

    SI budgetCents > 0 ENTONCES:
      rawPercentage = (actualCents / budgetCents) * 100
      executionPercentage = roundHalfUp(rawPercentage, 2)

      SI remainingCents < 0 ENTONCES:
        status = 'overbudget'
      SINO:
        status = 'normal'
    SINO:
      // Presupuesto cero
      executionPercentage = NULL // Formalmente N/A
      SI actualCents > 0 ENTONCES:
        status = 'unbudgeted_expense'
      SINO:
        status = 'unbudgeted_idle'

    RETORNAR {
      budgetCents,
      actualCents,
      remainingCents,
      percentage: executionPercentage,
      status: status
    }

  SINO: // categoryType == 'income'
    differenceCents = actualCents - budgetCents

    SI budgetCents > 0 ENTONCES:
      rawPercentage = (actualCents / budgetCents) * 100
      fulfillmentPercentage = roundHalfUp(rawPercentage, 2)
      status = 'normal'
    SINO:
      fulfillmentPercentage = NULL // Formalmente N/A
      SI actualCents > 0 ENTONCES:
        status = 'unbudgeted_income'
      SINO:
        status = 'unbudgeted_idle'

    RETORNAR {
      budgetCents,
      actualCents,
      differenceCents,
      percentage: fulfillmentPercentage,
      status: status
    }
```

### 3.3 Algoritmo: Resumen Mensual Consolidado y Desviación Neta (`calculateMonthlySummary`)

Cubre: RF-2 (CA-2.6), RF-5 (CA-5.1).

```typescript
ALGORITMO calculateMonthlySummary(categoryMetricsList):
  totalPlannedIncome = 0
  totalPlannedExpense = 0
  totalActualIncome = 0
  totalActualExpense = 0

  PARA CADA item EN categoryMetricsList:
    SI item.type == 'income' ENTONCES:
      totalPlannedIncome = totalPlannedIncome + item.budgetCents
      totalActualIncome = totalActualIncome + item.actualCents
    SINO: // 'expense'
      totalPlannedExpense = totalPlannedExpense + item.budgetCents
      totalActualExpense = totalActualExpense + item.actualCents

  netPlannedBalance = totalPlannedIncome - totalPlannedExpense
  netActualBalance = totalActualIncome - totalActualExpense
  netDeviation = netActualBalance - netPlannedBalance

  SI netDeviation > 0 ENTONCES:
    deviationType = 'favorable'     // Mayor ahorro o menor déficit
  SINO SI netDeviation < 0 ENTONCES:
    deviationType = 'unfavorable'   // Menor ahorro o mayor déficit
  SINO:
    deviationType = 'neutral'       // Desviación exactamente cero ($0.00)

  RETORNAR {
    totalPlannedIncome,
    totalPlannedExpense,
    netPlannedBalance,
    totalActualIncome,
    totalActualExpense,
    netActualBalance,
    netDeviation,
    deviationType
  }
```

### 3.4 Algoritmo: Lógica de Aislamiento Mensual y Fronteras Temporales (`validateNavigationAndDates`)

Cubre: RF-2 (CA-2.1), RF-3 (CA-3.3), RF-5 (CA-5.2), RNF-6.

```typescript
ALGORITMO validatePeriodNavigation(targetYearMonth, referenceDateString):
  // referenceDateString = 'YYYY-MM-DD' inyectado como parámetro puro (RNF-6)
  currentYear = extraerAño(referenceDateString)
  minAllowedYearMonth = "2000-01"
  maxAllowedYearMonth = (currentYear + 1) + "-12" // Diciembre del año actual + 1

  SI targetYearMonth < minAllowedYearMonth ENTONCES:
    RETORNAR ERROR("No se permite consultar períodos anteriores a enero del año 2000.")

  SI targetYearMonth > maxAllowedYearMonth ENTONCES:
    RETORNAR ERROR("El horizonte de planificación futura no puede exceder diciembre del año siguiente.")

  currentYearMonth = extraerAñoMes(referenceDateString)
  esFuturo = targetYearMonth > currentYearMonth

  RETORNAR OK({
    yearMonth: targetYearMonth,
    isFuture: esFuturo,
    allowsTransactions: !esFuturo, // Bloquea registro de transacciones en meses futuros (CA-3.3, CA-5.2)
    allowsBudgeting: VERDADERO     // Presupuestación permitida en pasado, presente y futuro
  })

ALGORITMO validateTransactionDate(transactionDateString, referenceDateString):
  // 1. Validar formato 'YYYY-MM-DD'
  SI NO coincideConPatron(transactionDateString, "^\d{4}-\d{2}-\d{2}$") ENTONCES:
    RETORNAR ERROR("Formato de fecha inválido. Se exige YYYY-MM-DD.")

  // 2. Validar existencia real en calendario gregoriano (ej. año bisiesto)
  SI NO esFechaGregorianaValida(transactionDateString) ENTONCES:
    RETORNAR ERROR("La fecha especificada no existe en el calendario.")

  // 3. Validar límite mínimo (2000-01-01)
  SI transactionDateString < "2000-01-01" ENTONCES:
    RETORNAR ERROR("No se admiten transacciones con fecha anterior al 01/01/2000.")

  // 4. Validar fecha futura frente al parámetro inyectado
  SI transactionDateString > referenceDateString ENTONCES:
    RETORNAR ERROR("Queda estrictamente prohibido registrar transacciones con fecha futura.")

  RETORNAR OK(transactionDateString)
```

### 3.5 Algoritmo: Integridad Referencial para Eliminación de Categorías (`canDeleteCategory`)

Cubre: RF-1 (CA-1.6, CA-1.7).

```typescript
ALGORITMO canDeleteCategory(hasAnyTransaction, maxBudgetCentsRegistered):
  SI hasAnyTransaction == VERDADERO ENTONCES:
    RETORNAR {
      canDelete: FALSO,
      reason: "La categoría posee transacciones registradas y no puede borrarse por integridad y auditoría."
    }

  SI maxBudgetCentsRegistered > 0 ENTONCES:
    RETORNAR {
      canDelete: FALSO,
      reason: "La categoría posee asignaciones presupuestarias activas (> $0.00) en al menos un período."
    }

  // Si no tiene transacciones y ningún presupuesto supera $0.00 (incluso categorías base sin uso)
  RETORNAR {
    canDelete: VERDADERO,
    reason: NULL
  }
```

### 3.6 Algoritmo: Normalización de Nota de Transacción (`normalizeNote`)

Cubre: RF-3 (CA-3.1).

```typescript
ALGORITMO normalizeNote(inputNote):
  SI inputNote ES NULO O inputNote ES INDEFINIDO ENTONCES:
    RETORNAR NULL

  // Reemplazar saltos de línea (\n, \r) y tabulaciones (\t) por un espacio simple
  textoSinSaltos = reemplazar(inputNote, /[\r\n\t]+/g, " ")

  // Eliminar espacios múltiples consecutivos
  textoNormalizado = reemplazar(textoSinSaltos, /\s+/g, " ")

  // Recortar extremos
  resultadoFinal = trim(textoNormalizado)

  SI longitud(resultadoFinal) == 0 ENTONCES:
    RETORNAR NULL

  SI longitud(resultadoFinal) > 250 ENTONCES:
    RETORNAR ERROR("La nota no puede exceder los 250 caracteres.")

  RETORNAR OK(resultadoFinal)
```

_(Cubre: RF-1, RF-2, RF-3, RF-4, RF-5, RNF-1, RNF-6, Principio 3 y Principio 4 de la Constitución)_

---

## 4. Definición de Server Actions / API Tipada (`src/actions/`)

Todas las Server Actions operan en el servidor de Next.js, reciben entradas validadas con esquemas estrictos de Zod y devuelven un objeto de resultado discriminado estándar `ActionResult<T>`:

```typescript
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };
```

### 4.1 Módulo de Categorías (`src/actions/categories.ts`)

Cubre: RF-1 (CA-1.1 a CA-1.8).

1. `getCategoriesAction()`
   - **Entrada:** `void`.
   - **Lógica:** Consulta todas las categorías, agrupadas por `type` y ordenadas alfabéticamente por `name` ascendente (CA-1.8).
   - **Respuesta:** `ActionResult<{ income: CategoryDto[]; expense: CategoryDto[] }>`.

2. `createCategoryAction(input: CreateCategoryInput)`
   - **Entrada tipada:**
     ```typescript
     type CreateCategoryInput = {
       name: string; // 1-50 caracteres, trim (CA-1.3)
       type: 'income' | 'expense'; // (CA-1.1)
     };
     ```
   - **Validaciones:** Validación de longitud, caracteres imprimibles. Verificación de unicidad insensible a mayúsculas/minúsculas dentro del mismo tipo (CA-1.4).
   - **Respuesta exitosa:** `ActionResult<CategoryDto>`.
   - **Errores esperados:**
     - `"Ya existe una categoría de [ingreso/gasto] con el nombre ingresado."`
     - `"El nombre debe tener entre 1 y 50 caracteres."`

3. `updateCategoryAction(input: UpdateCategoryInput)`
   - **Entrada tipada:**
     ```typescript
     type UpdateCategoryInput = {
       id: string;
       name: string; // Nuevo nombre
     };
     ```
   - **Validaciones:** Unicidad por tipo excluyendo el ID propio de la categoría (permite cambios de capitalización) (CA-1.4).
   - **Respuesta exitosa:** `ActionResult<CategoryDto>`.

4. `deleteCategoryAction(categoryId: string)`
   - **Validaciones:** Invoca `canDeleteCategory`. Consulta si existen transacciones asociadas o presupuestos asignados con `amountCents > 0` (CA-1.6, CA-1.7).
   - **Respuesta exitosa:** `ActionResult<{ deletedId: string }>`.
   - **Errores esperados:**
     - `"No es posible eliminar la categoría porque posee transacciones o presupuestos históricos asociados."`

---

### 4.2 Módulo de Presupuestos Mensuales (`src/actions/budgets.ts`)

Cubre: RF-2 (CA-2.1 a CA-2.6).

1. `setMonthlyBudgetAction(input: SetMonthlyBudgetInput)`
   - **Entrada tipada:**
     ```typescript
     type SetMonthlyBudgetInput = {
       categoryId: string;
       yearMonth: string; // 'YYYY-MM'
       amountCents: number; // 0 a 99999999999 (CA-2.2, CA-2.3)
     };
     ```
   - **Validaciones:** Rango monetario de 0 a $999,999,999.99 (sin decimales excedentes en la entrada). Verifica que la categoría exista.
   - **Lógica:** Inserta o actualiza (_upsert_) el registro en `monthly_budgets`. Si `amountCents == 0`, guarda 0 (equivalente a sin presupuesto asignado, CA-2.4).
   - **Respuesta exitosa:** `ActionResult<MonthlyBudgetDto>`.

---

### 4.3 Módulo de Transacciones (`src/actions/transactions.ts`)

Cubre: RF-3 (CA-3.1 a CA-3.8).

1. `createTransactionAction(input: CreateTransactionInput)`
   - **Entrada tipada:**
     ```typescript
     type CreateTransactionInput = {
       categoryId: string;
       amountCents: number; // Monto > 0 (CA-3.2)
       date: string; // 'YYYY-MM-DD' (CA-3.3)
       note?: string; // Opcional, hasta 250 caracteres (CA-3.1)
       clientToday: string; // 'YYYY-MM-DD' inyectado para validar fecha futura (RNF-6)
     };
     ```
   - **Validaciones en Core:**
     - Monto mayor a 0 y hasta $999,999,999.99 con exactitud de 2 decimales.
     - Fecha gregoriana válida entre `2000-01-01` y `clientToday`.
     - Normalización de nota (sustitución de `\n`, `\r`, `\t` por espacio simple y trim).
     - Derivación intrínseca de `type` desde la categoría asociada (`category.type`) (CA-3.1).
   - **Lógica:** Inserta transacción y asocia automáticamente `yearMonth = date.substring(0, 7)` (CA-3.5).
   - **Respuesta exitosa:** `ActionResult<TransactionDto>`.

2. `updateTransactionAction(input: UpdateTransactionInput)`
   - **Entrada tipada:**
     ```typescript
     type UpdateTransactionInput = {
       id: string;
       categoryId: string; // Debe coincidir con el tipo original de la transacción (CA-3.6)
       amountCents: number;
       date: string;
       note?: string;
       clientToday: string;
     };
     ```
   - **Validaciones:** Exige que la nueva categoría pertenezca estrictamente al MISMO tipo que la transacción existente (CA-3.6). Si el tipo no coincide, rechaza con: `"No se permite cambiar la naturaleza de la transacción. Para alternar entre ingreso y gasto, elimine la transacción y regístrela nuevamente."`
   - **Lógica:** Actualiza campos. Si cambia la fecha a otro mes, reubica `yearMonth` automáticamente.
   - **Respuesta exitosa:** `ActionResult<TransactionDto>`.

3. `deleteTransactionAction(transactionId: string)`
   - **Lógica:** Elimina el registro por ID (CA-3.7).
   - **Respuesta exitosa:** `ActionResult<{ deletedId: string; affectedYearMonth: string }>`.

---

### 4.4 Módulo de Resumen y Navegación (`src/actions/summary.ts`)

Cubre: RF-4, RF-5.

1. `getMonthDashboardAction(yearMonth: string, clientToday: string)`
   - **Validaciones:** Valida límites de navegación (`2000-01` hasta diciembre de `currentYear + 1`) mediante `validatePeriodNavigation`.
   - **Lógica:** En una única consulta agregada o transacción de lectura:
     - Obtiene todas las categorías activas.
     - Obtiene los presupuestos configurados para `yearMonth`.
     - Obtiene la sumatoria de gastos e ingresos reales agrupados por categoría para `yearMonth`.
     - Obtiene la lista completa de transacciones del mes ordenadas por `date DESC`, `createdAt DESC` (CA-3.8).
     - Ejecuta las funciones puras `calculateCategoryMetrics` y `calculateMonthlySummary`.
   - **Respuesta exitosa:**
     ```typescript
     ActionResult<{
       yearMonth: string;
       periodStatus: { isFuture: boolean; allowsTransactions: boolean };
       summary: MonthlySummaryDto;
       categories: {
         income: CategoryReportDto[];
         expense: CategoryReportDto[];
       };
       transactions: TransactionDto[];
     }>;
     ```

_(Cubre: RF-1, RF-2, RF-3, RF-4, RF-5, RNF-3, RNF-4)_

---

## 5. Desglose Secuencial de Tareas de Implementación

Conforme a las directrices de [AGENTS.md](file:///d:/antigravity/Flujo/AGENTS.md), el desglose utiliza obligatoriamente los prefijos:

- `[H]` para **Acciones Humanas** (aprobaciones, verificaciones y despliegue).
- `[I]` para **Tareas del Agente de Inteligencia Artificial** (desarrollo, scaffolding, tests y configuración).

### Fase 1: Inicialización del Entorno y Scaffolding Base

- [ ] **T01 [H]:** Aprobación formal de este plan de arquitectura ([plan.md](file:///d:/antigravity/Flujo/specs/001-flujo-mvp/plan.md)) antes de escribir código. _(Cubre: Principio 2)_
- [ ] **T02 [I]:** Inicializar el proyecto Next.js en el directorio raíz mediante `npx create-next-app@latest` con TypeScript en modo estricto (`strict: true`), Tailwind CSS, ESLint y App Router. _(Cubre: Simplicidad del stack, AGENTS.md)_
- [ ] **T03 [I]:** Configurar Prettier y scripts de verificación en `package.json` (`npm run test`, `npm run lint`, `npx prettier --check .`). _(Cubre: AGENTS.md)_
- [ ] **T04 [I]:** Instalar y configurar Vitest (`vitest`) para pruebas unitarias e integración en TypeScript puro, sin dependencias innecesarias de testing pesado. _(Cubre: Principio 4 de la Constitución)_
- [ ] **T05 [I]:** Instalar y configurar Drizzle ORM (`drizzle-orm`, `drizzle-kit`, `better-sqlite3` y `@types/better-sqlite3`). _(Cubre: RNF-5, Principio 1)_

---

### Fase 2: Núcleo Financiero Puro (`src/core/`) [TDD - Tests Primero]

- [ ] **T06 [I]:** Crear `src/core/types.ts` definiendo tipos semánticos en inglés (`TransactionType`, `Category`, `MonthlyBudget`, `Transaction`, `CategoryStatus`, `SummaryDeviation`). _(Cubre: CA-1.1, RNF-3, Principio 6)_
- [ ] **T07 [I]:** Implementar pruebas unitarias en `tests/unit/money.test.ts` para conversión de centavos, formato monetario (`$1,250.00`, `-$350.50`) y redondeo `HALF_UP`. _(Cubre: RNF-1, RNF-2, Principio 4)_
- [ ] **T08 [I]:** Implementar `src/core/money.ts` haciendo pasar todas las pruebas de aritmética en verde. _(Cubre: RNF-1, RNF-2)_
- [ ] **T09 [I]:** Implementar pruebas unitarias en `tests/unit/dates.test.ts` para validar formato `YYYY-MM-DD`, años bisiestos/días no válidos gregorianos, horizonte temporal (`2000-01` a año actual + 1) y detección de fecha futura con referencia inyectada. _(Cubre: CA-3.3, CA-5.2, RNF-6)_
- [ ] **T10 [I]:** Implementar `src/core/dates.ts` resolviendo la validación de calendario gregoriano y fronteras temporales. _(Cubre: CA-3.3, CA-5.2, RNF-6)_
- [ ] **T11 [I]:** Implementar pruebas unitarias en `tests/unit/metrics.test.ts` cubriendo fórmulas de disponible, porcentajes con `HALF_UP`, casos con presupuesto `$0.00` (`N/A`), estados semánticos (`overbudget`, `unbudgeted_expense`, `unbudgeted_idle`, `unbudgeted_income`), balance consolidado y cálculo de desviación neta. _(Cubre: RF-4, RF-5, Casos límite 1 a 4)_
- [ ] **T12 [I]:** Implementar `src/core/metrics.ts` haciendo pasar todas las pruebas de cálculo financiero en verde. _(Cubre: RF-4, RF-5)_
- [ ] **T13 [I]:** Implementar pruebas y funciones puras de validación en `src/core/validators.ts` (normalización de notas con sustitución de `\n`, validación de 1 a 50 caracteres para nombres de categorías y reglas de borrado con `canDeleteCategory`). _(Cubre: CA-1.3, CA-1.6, CA-1.7, CA-3.1)_

---

### Fase 3: Capa de Persistencia y Migraciones (`src/db/`)

- [ ] **T14 [I]:** Definir esquema relacional en `src/db/schema.ts` (`categories`, `monthly_budgets`, `transactions`) con restricciones de unicidad e índices. _(Cubre: RF-1, RF-2, RF-3, RNF-5)_
- [ ] **T15 [I]:** Configurar cliente SQLite local en `src/db/index.ts` y script de generación de migraciones con `drizzle-kit`. _(Cubre: RNF-5)_
- [ ] **T16 [I]:** Implementar script de semilla `src/db/seed.ts` para poblar automáticamente el catálogo sugerido inicial (`Alimentación`, `Vivienda`, `Transporte`, `Servicios`, `Salud`, `Ocio`, `Salario`, `Otros`) en la primera ejecución. _(Cubre: CA-1.2)_
- [ ] **T17 [I]:** Implementar pruebas de integración de base de datos en `tests/integration/` verificando unicidad insensible a mayúsculas/minúsculas por tipo, autoexclusión en renombrado e integridad referencial en cascada/bloqueo. _(Cubre: CA-1.4, CA-1.6, CA-1.7)_

---

### Fase 4: Server Actions y Orquestación (`src/actions/`)

- [ ] **T18 [I]:** Implementar `src/actions/categories.ts` (`getCategoriesAction`, `createCategoryAction`, `updateCategoryAction`, `deleteCategoryAction`) integrando validaciones del core y manejo de errores en español. _(Cubre: RF-1)_
- [ ] **T19 [I]:** Implementar `src/actions/budgets.ts` (`setMonthlyBudgetAction`) para asignación y restablecimiento de límites mensuales. _(Cubre: RF-2)_
- [ ] **T20 [I]:** Implementar `src/actions/transactions.ts` (`createTransactionAction`, `updateTransactionAction`, `deleteTransactionAction`) asegurando derivación automática del tipo, validación de fecha contra el cliente, y restricción de cambio de tipo en edición. _(Cubre: RF-3)_
- [ ] **T21 [I]:** Implementar `src/actions/summary.ts` (`getMonthDashboardAction`) reuniendo presupuestos, gastos reales y métricas consolidadas en una consulta atómica eficiente (< 200 ms). _(Cubre: RF-4, RF-5, RNF-4)_

---

### Fase 5: Interfaz de Usuario y Vistas (`src/components/`, `src/app/`)

- [ ] **T22 [I]:** Construir el layout global y shell de la aplicación en `src/app/layout.tsx` con soporte de tema limpio, paleta de colores armónica, tipografía moderna (Inter) y estructura semántica. _(Cubre: RNF-3)_
- [ ] **T23 [I]:** Implementar barra de navegación temporal y selector de mes en `src/components/navigation/MonthNavigator.tsx` con control de límites (`2000-01` a año actual + 1) y detección de período futuro. _(Cubre: CA-5.2)_
- [ ] **T24 [I]:** Construir panel de resumen financiero consolidado en `src/components/summary/MonthlySummaryCard.tsx` (Ingresos Reales, Gastos Reales, Balance Neto y tarjeta de Desviación con indicador favorable/desfavorable/neutro). _(Cubre: RF-5, CA-5.1)_
- [ ] **T25 [I]:** Construir la vista de categorías y presupuestos en `src/components/budgets/BudgetCategoryList.tsx` mostrando gasto real, presupuesto, barra de progreso con porcentaje redondeado `HALF_UP` o `N/A`, disponible y badges de estado (`overbudget`, `unbudgeted_expense`, etc.). _(Cubre: RF-2, RF-4)_
- [ ] **T26 [I]:** Implementar modal de edición/asignación rápida de presupuestos por categoría. _(Cubre: RF-2)_
- [ ] **T27 [I]:** Implementar tabla y listado cronológico de transacciones en `src/components/transactions/TransactionList.tsx` con ordenamiento descendente por fecha y botón de borrado/edición. _(Cubre: RF-3, CA-3.8)_
- [ ] **T28 [I]:** Construir modal/formulario de registro y edición de transacciones en `src/components/transactions/TransactionModal.tsx` (monto, categoría con tipo derivado implícito, fecha calendario y nota normalizada). En meses futuros, el botón de registrar debe mostrarse deshabilitado con tooltip explicativo. _(Cubre: CA-3.1, CA-3.3, CA-3.6, CA-5.2)_
- [ ] **T29 [I]:** Construir modal de gestión del catálogo de categorías en `src/components/categories/CategoryManagerModal.tsx` para crear, renombrar y eliminar categorías respetando bloqueos de histórico. _(Cubre: RF-1)_
- [ ] **T30 [I]:** Integrar todos los componentes en la página mensual `src/app/[yearMonth]/page.tsx` garantizando carga reactiva de datos y estados vacíos cuando el mes carezca de movimientos. _(Cubre: Caso límite 11, RNF-4)_

---

### Fase 6: Control de Calidad, Auditoría y Cierre

- [ ] **T31 [I]:** Ejecutar suite completa de pruebas unitarias e integración (`npm run test`) validando 100% de tests en verde. _(Cubre: Principio 4 de la Constitución, AGENTS.md)_
- [ ] **T32 [I]:** Ejecutar análisis estático y formateo (`npm run lint && npx prettier --check .`) resolviendo cualquier advertencia de linter o tipado. _(Cubre: AGENTS.md)_
- [ ] **T33 [H]:** Verificación manual en navegador por parte del usuario de los flujos de planificación mensual, registro de gastos, sobregiro visual y navegación histórica. _(Cubre: Criterios de finalización)_

_(Cubre: Todas las historias de usuario US-1 a US-6 y RF-1 a RF-5)_

---

## 6. Decisiones Técnicas Justificadas

### 6.1 Representación Monetaria: Enteros en Centavos vs Números en Punto Flotante (`Float`)

- **Decisión adoptada:** Almacenar y operar todos los montos en **centavos enteros** (`amountCents: integer` en SQLite y `number` entero en TypeScript), formateando a decimal (`$X.XX`) únicamente en la capa de presentación.
- **Alternativa descartada:** Uso de números flotantes tradicionales de JavaScript (`number` con decimales como `12.55`).
- **Justificación:** Los números flotantes IEEE 754 sufren de imprecisiones binarias acumulativas (ej. `0.1 + 0.2 = 0.30000000000000004`), lo cual es inaceptable en un sistema contable. El uso de enteros elimina cualquier error de redondeo acumulado, cumple estrictamente con el **RNF-1** y no requiere dependencias pesadas de terceros (Principio 1).

### 6.2 Motor de Persistencia: SQLite Local (`better-sqlite3`) con Drizzle ORM

- **Decisión adoptada:** Base de datos relacional SQLite embebida en archivo local gestionada mediante Drizzle ORM.
- **Alternativa descartada:** PostgreSQL / MySQL en contenedor Docker o servicios de bases de datos en la nube (Supabase, PlanetScale).
- **Justificación:** Cumple el principio de **local-first y simplicidad del stack** (Principio 1 y 5 de la Constitución y RNF-5). No añade latencia de red (< 200 ms exigidos en RNF-4), no requiere configuración de infraestructura externa para el usuario y mantiene la integridad referencial relacional estricta (claves foráneas e índices de unicidad). Drizzle ORM provee seguridad de tipos en tiempo de compilación con cero sobrecarga en tiempo de ejecución.

### 6.3 Comunicación Cliente-Servidor: Server Actions de Next.js

- **Decisión adoptada:** Utilizar Server Actions nativas de Next.js (`'use server'`) con respuestas tipadas `ActionResult<T>`.
- **Alternativa descartada:** Creación de una API REST tradicional con endpoints manuales (`/api/transactions`, `/api/categories`) y consumo mediante `fetch`/Axios.
- **Justificación:** Reduce el código repetitivo (_boilerplate_), provee revalidación automática de rutas (`revalidatePath`), elimina serializaciones manuales y mantiene la arquitectura como un **monolito ligero** sin servicios desacoplados artificiales (Principio 1).

### 6.4 Inyección de Fecha del Sistema en el Núcleo

- **Decisión adoptada:** Las funciones puras de `src/core/` que evalúan fechas futuras reciben la fecha de referencia del usuario como parámetro explícito (`referenceDate: string`).
- **Alternativa descartada:** Invocar `new Date()` directamente dentro de los métodos del core financiero.
- **Justificación:** Garantiza el **determinismo total en pruebas unitarias** (Principio 4 y RNF-6). Permite testear sin _mocks_ complejos cómo se comportaría el sistema en cualquier fecha del año 2000, 2026 o en fronteras de fin de año y meses bisiestos.

### 6.5 Unicidad de Nombres de Categoría por Tipo

- **Decisión adoptada:** La unicidad del nombre se restringe al mismo tipo (`income` o `expense`), permitiendo repetir un nombre si pertenecen a tipos opuestos (ej. `Otros`).
- **Alternativa descartada:** Unicidad global estricta en todo el catálogo sin importar el tipo.
- **Justificación:** Resuelve la contradicción detectada en QA respecto al catálogo inicial (`Otros` en ingresos impedía crear `Otros` en gastos). Refleja fielmente la práctica habitual de finanzas personales donde rubros misceláneos coexisten en ambas naturalezas.

_(Cubre: Principio 1, Principio 2, Principio 3, Principio 5 y RNF-1 a RNF-6)_

---

## 7. Estrategia de Tests

En cumplimiento con el **Principio 4 de la Constitución** (_"todo cálculo financiero crítico exige tests automatizados en verde antes de dar por cerrada una tarea"_), la estrategia contempla pruebas unitarias exhaustivas y pruebas de integración focalizadas.

### 7.1 Pruebas Unitarias del Núcleo Financiero (`tests/unit/`)

Se ejecutan mediante Vitest a nivel de función pura, sin inicializar servidor ni base de datos, con tiempo de ejecución < 500 ms.

| Módulo               | Casos de Prueba Críticos                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Requisito / Caso Límite             |
| :------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------- |
| `money.test.ts`      | - Conversión bidireccional monto decimal a centavos enteros.<br>- Formato monetario con separador de miles y centavos (`$0.00`, `$1,250.00`, `-$350.50`).<br>- Algoritmo `HALF_UP` en divisiones periódicas (ej. tercio resulta en `33.33%`, `16.666%` en `16.67%`).                                                                                                                                                                                                                                                          | RNF-1, RNF-2                        |
| `dates.test.ts`      | - Rechazo de fechas anteriores a `2000-01-01`.<br>- Rechazo de fechas futuras frente a la fecha inyectada.<br>- Validación gregoriana: rechazo de `2026-02-29` (año común) y aceptación de `2024-02-29` (bisiesto).<br>- Horizonte de navegación: navegación permitida hasta diciembre de año+1 y bloqueo más allá.                                                                                                                                                                                                           | CA-3.3, CA-5.2, Casos límite 8 y 9  |
| `metrics.test.ts`    | - Categoría de gasto: disponible positivo, límite alcanzado ($100 de $100 = 100.00%) y sobregiro negativo con `overbudget`.<br>- Categoría con presupuesto cero y gasto > 0: retorna `N/A`, disponible negativo y estado `unbudgeted_expense`.<br>- Categoría con presupuesto cero y gasto cero: retorna `N/A`, disponible `$0.00` y estado `unbudgeted_idle`.<br>- Totales mensuales: suma de metas, suma de gastos, balance neto.<br>- Desviación neta: cálculo con superávit, déficit y caso de desviación exacta `$0.00`. | RF-4, RF-5, Casos límite 1, 2, 3, 4 |
| `validators.test.ts` | - Sanitización de notas: conversión de `\n`, `\r`, `\t` a espacios simples y trim.<br>- Rechazo de notas de más de 250 caracteres.<br>- Validación de nombre de categoría (1 a 50 caracteres, no vacío).<br>- Lógica `canDeleteCategory`: bloqueo si tiene transacciones o presupuesto > 0; aprobación si ambos son 0.                                                                                                                                                                                                        | CA-1.3, CA-1.6, CA-1.7, CA-3.1      |

### 7.2 Pruebas de Integración con Persistencia (`tests/integration/`)

Utilizan una base de datos SQLite en memoria (`:memory:`) levantada por Vitest con el esquema de Drizzle aplicado.

1. **Catálogo de Categorías (`categories.test.ts`):**
   - Creación de semilla inicial (`seed.ts`) y verificación de las 8 categorías predeterminadas.
   - Intento de crear categoría con nombre duplicado en el mismo tipo (espera error de unicidad).
   - Creación exitosa de categoría con el mismo nombre pero diferente tipo (ej. `Otros` en ingreso y en gasto).
   - Edición de nombre con cambio de mayúsculas ("comida" a "Comida") sin error de duplicidad propia.
   - Eliminación exitosa de categoría base no usada (ej. `Ocio` sin transacciones).
   - Rechazo de eliminación de categoría si se registra al menos un presupuesto > 0 o una transacción.

2. **Presupuestos y Aislamiento (`budgets.test.ts`):**
   - Configuración de presupuesto en `2026-03` y verificación de que `2026-04` permanece en `$0.00` (_sin arrastre_).
   - Actualización de presupuesto a `$0.00` y verificación de restablecimiento del estado.

3. **Transacciones y Recálculos (`transactions.test.ts`):**
   - Inserción de transacción con derivación automática de tipo según la categoría.
   - Intento de editar transacción asignándole una categoría de tipo opuesto (espera rechazo por inconsistencia).
   - Edición de fecha de transacción de marzo a abril: verifica recálculo reactivo automático en los totales de ambos meses.
   - Eliminación de la última transacción de un mes: verifica que el mes pasa al estado vacío orientativo con balances en `$0.00`.

_(Cubre: Principio 4 de la Constitución y AGENTS.md)_
