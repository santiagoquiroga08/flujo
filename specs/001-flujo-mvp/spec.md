# Especificación Funcional: Flujo MVP (001-flujo-mvp)

## 1. Contexto y objetivo

### 1.1 Contexto

La gestión financiera personal suele verse entorpecida por herramientas complejas, hojas de cálculo dispersas o aplicaciones con sincronizaciones automáticas opacas que distancian al usuario de la conciencia real sobre su dinero. Flujo surge como una herramienta para devolver el control y la visibilidad al usuario mediante la planificación intencional y el registro manual mensual.

### 1.2 Objetivo

El objetivo del MVP es proveer un sistema simple, visual y confiable para:

1. Planificar mensualmente presupuestos límite por categorías de gasto y estimaciones de metas por categorías de ingreso.
2. Registrar manualmente ingresos y gastos clasificados por categoría, fecha y monto.
3. Comparar en tiempo real la ejecución financiera frente a lo planificado mediante balances consolidados, porcentajes de cumplimiento y detección visual de sobregiros.

---

## 2. Usuarios

### 2.1 Perfil de Usuario

- **Usuario Individual:** Persona que gestiona sus propias finanzas personales de manera reflexiva y manual. Requiere saber con exactitud cuánto dinero planea ingresar, cuánto ha presupuestado para gastar en cada rubro y qué desvíos o remanentes tiene en el mes actual, en meses anteriores o en meses futuros planificados.
- **Modo de Operación:** Monousuario local. No requiere perfiles compartidos, roles de acceso ni sincronización entre dispositivos en esta fase inicial.

---

## 3. Historias de usuario

- **US-1 (Planificación Mensual):** Como usuario, quiero definir metas estimadas de ingresos y topes de gasto para mis categorías en cualquier mes (actual o futuro permitido), para tener una guía clara de mi capacidad financiera durante ese período.
- **US-2 (Administración de Categorías):** Como usuario, quiero crear, renombrar y gestionar mis categorías clasificándolas como Ingreso o Gasto de forma controlada y con unicidad por tipo, para estructurar mis movimientos según mis necesidades particulares manteniendo la integridad referencial.
- **US-3 (Registro de Movimientos):** Como usuario, quiero registrar manualmente gastos e ingresos indicando monto, categoría, fecha y una nota opcional, para llevar un historial fidedigno de mis transacciones reales.
- **US-4 (Control de Ejecución y Alertas):** Como usuario, quiero ver en todo momento cuánto he gastado o ingresado frente a lo planificado por categoría y a nivel global, visualizando estados de sobregiro claros e inmediatos cuando supere los límites de gasto.
- **US-5 (Navegación Histórica y Planificación Futura):** Como usuario, quiero navegar libremente entre meses para auditar meses anteriores de forma aislada o para planificar con anticipación los presupuestos de meses futuros dentro del horizonte permitido.
- **US-6 (Mantenimiento de Transacciones):** Como usuario, quiero editar y eliminar transacciones existentes (incluyendo cambios de monto, nota, fecha entre meses o reasignación de categoría dentro del mismo tipo), recalculando de forma instantánea los balances de los períodos afectados.

---

## 4. Requisitos funcionales (RF) y Criterios de Aceptación (EARS)

### RF-1: Gestión, Catálogo y Ciclo de Vida de Categorías

El sistema debe gestionar un catálogo global de categorías diferenciadas por su naturaleza financiera.

- **CA-1.1 (Clasificación e inmutabilidad de tipo):** El sistema DEBE asegurar que toda categoría pertenezca estrictamente a uno de dos tipos de dominio: `income` (Ingreso) o `expense` (Gasto). El tipo asignado es inmutable y no podrá modificarse tras la creación de la categoría.
- **CA-1.2 (Catálogo inicial predeterminado):** CUANDO el sistema se inicializa por primera vez, el sistema DEBE crear automáticamente un catálogo base de categorías sugeridas:
  - Categorías de Gasto (`expense`): `Alimentación`, `Vivienda`, `Transporte`, `Servicios`, `Salud`, `Ocio`.
  - Categorías de Ingreso (`income`): `Salario`, `Otros`.
- **CA-1.3 (Validación de nombre de categoría):** CUANDO el usuario introduce el nombre de una categoría, el sistema DEBE exigir una longitud de 1 a 50 caracteres, recortar automáticamente espacios en blanco en los extremos (_trim_), eliminar caracteres de control no imprimibles, y rechazar cadenas vacías o formadas exclusivamente por espacios.
- **CA-1.4 (Unicidad de nombres por tipo):** SI el usuario intenta crear o renombrar una categoría con un nombre que ya existe dentro del MISMO tipo (`income` o `expense`), evaluado de forma insensible a mayúsculas y minúsculas (_case-insensitive_) y recortando espacios, ENTONCES el sistema DEBE rechazar la operación y mostrar un mensaje de error indicando la duplicidad en ese tipo. Se permite la existencia del mismo nombre en naturalezas distintas (ej. `Otros` en Ingreso y `Otros` en Gasto). Al renombrar una categoría, el chequeo de unicidad DEBE excluir el identificador propio de la categoría editada para permitir cambios de capitalización (ej. de "comida" a "Comida").
- **CA-1.5 (Edición de nombre de categoría):** CUANDO el usuario modifica el nombre de una categoría respetando las reglas de validación y unicidad, el sistema DEBE actualizar dicho nombre en la entidad, manteniéndose visible de forma consistente en todos los presupuestos, transacciones y vistas históricas y activas mediante su clave primaria.
- **CA-1.6 (Bloqueo de eliminación por integridad referencial y auditoría):** SI el usuario solicita eliminar una categoría que posee al menos una transacción registrada (en cualquier mes) O que posee un presupuesto asignado explícito con monto estrictamente mayor a cero (`monto > $0.00`) en cualquier mes (pasado, presente o futuro), ENTONCES el sistema DEBE bloquear la eliminación y mostrar un mensaje de error explicativo indicando que la categoría contiene registros asociados y no puede eliminarse.
- **CA-1.7 (Eliminación de categoría vacía y categorías base no utilizadas):** CUANDO el usuario solicita eliminar una categoría que carece totalmente de transacciones y de asignaciones presupuestarias activas (`monto > $0.00`) en todos los períodos (incluyendo categorías predeterminadas del catálogo inicial que no hayan sido usadas), el sistema DEBE eliminarla de forma definitiva del catálogo.
- **CA-1.8 (Ordenamiento de catálogo de categorías):** El sistema DEBE presentar las categorías agrupadas por tipo (`Ingreso` y `Gasto`) y ordenadas alfabéticamente de forma ascendente por su nombre en todas las listas y selectores de la interfaz.

---

### RF-2: Planificación Presupuestaria Mensual

El sistema debe permitir definir presupuestos independientes para cada mes calendario, tanto para categorías de gasto como para categorías de ingreso.

- **CA-2.1 (Aislamiento de períodos):** El sistema DEBE organizar los presupuestos por períodos de mes calendario independientes (año y mes), sin trasladar saldos, excedentes o deudas de un mes a otro (_sin arrastre / carryover_).
- **CA-2.2 (Límites de gasto y metas de ingreso):** CUANDO el usuario asigna o edita un presupuesto mensual para una categoría, el sistema DEBE almacenar dicho valor para el período seleccionado, permitiendo montos entre `$0.00` y `$999,999,999.99` inclusive.
- **CA-2.3 (Validación estricta de formato de presupuesto):** SI el usuario ingresa un monto presupuestario menor a cero, superior a `$999,999,999.99`, con caracteres no numéricos o con más de dos decimales, ENTONCES el sistema DEBE rechazar la entrada con un mensaje de validación explícito (sin aplicar redondeos silenciosos en la entrada).
- **CA-2.4 (Categorías no presupuestadas y restablecimiento):** MIENTRAS una categoría no cuente con un presupuesto configurado explícitamente para un mes determinado (o si su monto se edita a `$0.00`), el sistema DEBE considerar su presupuesto asignado como `$0.00`. Asignar `$0.00` a una categoría equivale a dejarla sin presupuesto para ese período.
- **CA-2.5 (Reducción de presupuesto con gasto en curso):** CUANDO el usuario reduce el presupuesto de una categoría a un valor inferior al gasto acumulado existente en ese mes, el sistema DEBE aceptar y registrar el nuevo límite, actualizando de inmediato el estado semántico de la categoría a sobregiro.
- **CA-2.6 (Cálculo de totales planificados):** El sistema DEBE computar y presentar para cada mes:
  - `Total Ingresos Presupuestados`: Suma de las metas de todas las categorías de ingreso del mes.
  - `Total Gastos Presupuestados`: Suma de los límites de todas las categorías de gasto del mes.
  - `Balance Presupuestado Neto`: `Total Ingresos Presupuestados - Total Gastos Presupuestados`.
  - La suma agregada acumulada se soporta hasta `$999,999,999.99`.

---

### RF-3: Registro, Validación y Mantenimiento de Transacciones

El sistema debe permitir el registro manual y administración estricta de ingresos y gastos reales.

- **CA-3.1 (Atributos obligatorios, derivación de tipo y formato de nota):** CUANDO el usuario registra una transacción, el sistema DEBE requerir obligatoriamente: monto, categoría y fecha. El tipo de transacción (`income` o `expense`) se deriva de forma automática e intrínseca a partir de la categoría seleccionada. Opcionalmente, admite una nota de texto de hasta 250 caracteres; ante entradas con saltos de línea (`\n`, `\r`) o tabulaciones, el sistema DEBE normalizarlas automáticamente reemplazándolas por un único espacio en blanco y aplicando recorte de extremos (_trim_).
- **CA-3.2 (Validación de monto de transacción):** SI el usuario intenta registrar o editar una transacción con un monto menor o igual a cero (`monto <= 0`), con más de dos decimales o superior a `$999,999,999.99`, ENTONCES el sistema DEBE rechazar la operación con un mensaje de error de validación claro.
- **CA-3.3 (Formato temporal y validación de fecha de transacción):** El sistema DEBE gestionar las fechas de transacción exclusivamente como fecha de calendario en formato `YYYY-MM-DD` (sin componente de hora). SI la fecha ingresada es anterior a `2000-01-01`, posterior a la fecha del día actual del usuario (provista como fecha de referencia externa al core), o no corresponde a una fecha gregoriana válida (ej. `2026-02-29`), ENTONCES el sistema DEBE rechazar la transacción con un mensaje de error explicativo.
- **CA-3.4 (Consistencia de tipo entre transacción y categoría en el core):** En el núcleo del sistema, SI una transacción recibe un tipo que no coincide estrictamente con el tipo configurado en la categoría asociada (`income` con `income` o `expense` con `expense`), ENTONCES el núcleo DEBE rechazar la operación por inconsistencia de datos.
- **CA-3.5 (Asignación automática por mes calendario):** CUANDO se registra una transacción con fecha válida, el sistema DEBE asociarla y contabilizarla en el mes calendario correspondiente a dicha fecha (`YYYY-MM`), independientemente del mes que el usuario estuviera visualizando en la interfaz al abrir el formulario.
- **CA-3.6 (Alcance de edición de transacciones):** CUANDO el usuario edita una transacción existente, el sistema DEBE permitir modificar su monto, fecha, nota y reasignar su categoría ÚNICAMENTE hacia otra categoría del MISMO tipo (`income` a `income`, o `expense` a `expense`). Si el usuario necesita cambiar el tipo de una transacción (de ingreso a gasto o viceversa), DEBE eliminar la transacción y crear una nueva. Si se modifica la fecha trasladando la transacción a otro mes calendario, el sistema DEBE reubicar la transacción y recalcular reactivamente ambos meses afectados.
- **CA-3.7 (Eliminación de transacción):** CUANDO el usuario elimina una transacción existente, el sistema DEBE suprimir el registro y recalcular de inmediato los totales reales del mes afectado. Si el mes queda sin movimientos ni presupuestos, muestra el estado vacío del período.
- **CA-3.8 (Ordenamiento de transacciones):** El sistema DEBE presentar las transacciones del mes ordenadas por fecha en orden descendente (`YYYY-MM-DD`). A igualdad de fecha, el orden secundario DEBE ser por momento de inserción/identificador decreciente.

---

### RF-4: Control de Ejecución, Métricas y Detección de Sobregasto

El sistema debe comparar el avance real frente a los límites y metas planificadas con precisión matemática definida.

- **CA-4.1 (Métricas por categoría de gasto):** El sistema DEBE computar para cada categoría de gasto (`expense`) en el mes consultado:
  - `Gasto Real`: Suma aritmética de las transacciones de gasto de la categoría en ese mes.
  - `Restante Disponible`: `Presupuesto Asignado - Gasto Real`.
  - `Porcentaje de Ejecución`:
    - SI `Presupuesto Asignado > 0`, ENTONCES el cálculo es `(Gasto Real / Presupuesto Asignado) * 100`, presentado con 2 decimales y redondeo estándar `HALF_UP` (ej. `33.33%`, pudiendo superar el `100.00%` en caso de sobregiro).
    - SI `Presupuesto Asignado == 0`, ENTONCES el porcentaje matemático no es aplicable y se define formalmente como `N/A`.
- **CA-4.2 (Métricas por categoría de ingreso):** El sistema DEBE computar para cada categoría de ingreso (`income`) en el mes consultado:
  - `Ingreso Real`: Suma aritmética de las transacciones de ingreso de la categoría en ese mes.
  - `Diferencia de Ingreso`: `Ingreso Real - Presupuesto Estimado`.
  - `Porcentaje de Cumplimiento`:
    - SI `Presupuesto Estimado > 0`, ENTONCES el cálculo es `(Ingreso Real / Presupuesto Estimado) * 100`, presentado con 2 decimales y redondeo estándar `HALF_UP` (ej. `100.00%`).
    - SI `Presupuesto Estimado == 0`, ENTONCES el porcentaje matemático no es aplicable y se define formalmente como `N/A`.
- **CA-4.3 (Flexibilidad operativa ante sobregasto):** CUANDO un gasto cause que el `Gasto Real` supere el `Presupuesto Asignado` (o cuando se registre un gasto con `Presupuesto Asignado == $0.00`), el sistema DEBE permitir y registrar la transacción con éxito sin bloquear al usuario.
- **CA-4.4 (Estados semánticos de dominio e indicadores visuales):**
  - **Sobregiro con presupuesto (`overbudget`):** Si `Presupuesto Asignado > 0` y `Restante Disponible < 0`, el sistema reporta estado de sobregiro y la interfaz destaca el saldo disponible negativo en advertencia.
  - **Gasto sin presupuesto (`unbudgeted_expense`):** Si `Presupuesto Asignado == 0` y `Gasto Real > 0`, el sistema reporta disponible negativo (`- Gasto Real`), porcentaje `N/A` y la etiqueta visual `Sin presupuesto / Sobregiro`.
  - **Gasto neutro sin presupuesto (`unbudgeted_idle`):** Si `Presupuesto Asignado == 0` y `Gasto Real == 0`, el sistema reporta disponible `$0.00`, porcentaje `N/A` y un estado neutro sin alertas de sobregiro.
  - **Ingreso no presupuestado (`unbudgeted_income`):** Si `Presupuesto Estimado == 0` e `Ingreso Real > 0`, el sistema reporta diferencia positiva (`+ Ingreso Real`), porcentaje `N/A` y la etiqueta visual `Ingreso no presupuestado`.
  - **Ingreso neutro sin presupuesto (`unbudgeted_idle`):** Si `Presupuesto Estimado == 0` e `Ingreso Real == 0`, el sistema reporta diferencia `$0.00`, porcentaje `N/A` y un estado neutro regular.

---

### RF-5: Resumen Financiero Consolidado y Navegación Temporal

El sistema debe proveer una vista unificada del desempeño del mes y permitir la navegación temporal.

- **CA-5.1 (Totales globales reales y comparativa):** El sistema DEBE calcular y presentar en el resumen del mes:
  - `Total Ingresos Reales`: Suma de todos los ingresos reales del mes.
  - `Total Gastos Reales`: Suma de todos los gastos reales del mes.
  - `Balance Real Neto`: `Total Ingresos Reales - Total Gastos Reales`.
  - `Desviación Neta del Período`: `Balance Real Neto - Balance Presupuestado Neto`.
    - Si `Desviación > 0`: Se presenta como resultado favorable (mayor ahorro o menor déficit que lo previsto).
    - Si `Desviación < 0`: Se presenta como resultado desfavorable (menor ahorro o mayor déficit que lo previsto).
    - Si `Desviación == 0`: Se presenta como resultado equilibrado/neutro (`$0.00`).
- **CA-5.2 (Navegación temporal histórica y horizonte futuro):** CUANDO el usuario navega entre períodos mensuales:
  - **Límite inferior:** No se permite navegar ni consultar períodos anteriores a enero del año 2000 (`2000-01`).
  - **Límite superior:** Se permite navegar y presupuestar hacia el futuro hasta diciembre del año calendario actual + 1 año (ej. si el año actual es 2026, el límite máximo navegable es `2027-12`).
  - **Meses pasados y mes actual:** Permite consultar y modificar presupuestos y registrar/editar transacciones (según CA-3.3).
  - **Meses futuros:** Permite consultar y configurar presupuestos planificados por adelantado; bloquea el registro de transacciones reales (conforme a CA-3.3).

---

## 5. Requisitos no funcionales

- **RNF-1 (Precisión financiera exacta y redondeo):** Toda operación de cálculo financiero (sumas, restas y multiplicaciones monetarias) debe realizarse con aritmética de precisión decimal fija de 2 decimales (o representación entera en centavos monetarios), previniendo desvíos por punto flotante binario. Las divisiones para porcentajes deben redondearse al formato visual de 2 decimales mediante el algoritmo matemático estándar `HALF_UP`.
- **RNF-2 (Formato monetario estándar):** Los montos monetarios deben formatearse en pantalla con el símbolo fijo `$` seguido del valor con separadores legibles y exactamente 2 decimales (ej. `$1,250.00` o `-$350.50`).
- **RNF-3 (Idioma, esquemas e identificadores):** En estricto cumplimiento con el Principio 6 de `docs/constitution.md`, todos los identificadores de código, esquemas de base de datos, tipos de dominio y modelos (`income`, `expense`, `Category`, `Transaction`, `Budget`) deben estar estrictamente en idioma inglés. La totalidad de la interfaz de usuario, etiquetas, mensajes de error, reportes y documentación deben estar redactados en español claro y empático.
- **RNF-4 (Rendimiento instantáneo):** La respuesta tras registrar, modificar o borrar transacciones, así como el recálculo íntegro del panel mensual, debe completarse en menos de 200 ms en el entorno local.
- **RNF-5 (Persistencia y auditoría local-first):** La persistencia de datos debe ser confiable, atómica y estructurada localmente (SQLite con Drizzle ORM), asegurando que ante cierres abruptos de la sesión no se genere corrupción ni pérdida de datos confirmados.
- **RNF-6 (Desacoplamiento del núcleo financiero y determinismo):** Las reglas de cálculo financiero, validación de consistencia de tipos y cómputos de balance deben residir en módulos puros e independientes de la interfaz de usuario (`src/core/`). Las funciones del core que validen límites temporales deben recibir la fecha de referencia del sistema como parámetro inyectado (`referenceDate: string`), garantizando determinismo total en pruebas unitarias automatizadas.

---

## 6. Casos límite

1. **Gasto en categoría con presupuesto cero ($0.00):** Se registra el gasto de forma exitosa. El `Restante Disponible` pasa a `- Gasto Real`, el `Porcentaje de Ejecución` se fija en `N/A`, y la categoría adopta el estado visual `Sin presupuesto / Sobregiro`.
2. **Gasto en categoría con presupuesto cero y gasto cero ($0.00 / $0.00):** El `Restante Disponible` es `$0.00`, el porcentaje es `N/A`, y se presenta en estado neutro inactivo sin marcarse como sobregiro ni emitir alertas.
3. **Gasto exacto igual al presupuesto ($100.00 de $100.00):** El `Restante Disponible` es `$0.00`, el `Porcentaje de Ejecución` es `100.00%`, y el estado se muestra como límite alcanzado sin marcarse como sobregiro negativo.
4. **Reducción de presupuesto mensual por debajo de lo gastado:** Si se modifica el presupuesto a un valor inferior al gasto acumulado, el sistema actualiza de inmediato el disponible a negativo y activa el estado de sobregiro sin bloquear al usuario.
5. **Intento de eliminación de categoría con transacciones o presupuesto activo:** Si una categoría tiene al menos una transacción registrada o un presupuesto asignado `> $0.00` en cualquier período, el sistema rechaza la eliminación protegiendo la auditoría histórica.
6. **Eliminación de categorías base recién inicializadas:** Si el usuario no ha registrado transacciones ni presupuestos `> $0.00` en una categoría predeterminada (ej. `Ocio`), el sistema permite su eliminación definitiva del catálogo bajo CA-1.7.
7. **Renombrado con cambio exclusivo de mayúsculas/minúsculas:** Si el usuario renombra "comida" a "Comida", la validación excluye el ID de la propia categoría permitiendo actualizar la capitalización sin arrojar error de duplicidad.
8. **Fechas límites en fronteras de mes y año:** Una transacción registrada con fecha `2026-03-31` pertenece estrictamente a marzo de 2026 y no afecta ni computa en abril de 2026.
9. **Fechas gregorianas inválidas:** Entradas como `2026-02-29` (año no bisiesto) o `2025-04-31` son rechazadas en el core como fechas no existentes.
10. **Límites numéricos de entrada:** Cualquier entrada monetaria con más de 2 cifras decimales (ej. `25.555`) o con montos superiores a `999,999,999.99` es rechazada inmediatamente con mensaje de error explicativo.
11. **Mes sin movimientos ni presupuestos configurados:** Al ingresar a un mes vacío, todos los balances inician en `$0.00` y la interfaz ofrece un estado vacío orientativo para comenzar la planificación o registro.
12. **Traslado de la única transacción de un mes a otro:** Al editar la fecha de la única transacción de un mes hacia otro período, el mes origen recalcula sus balances a `$0.00` y pasa de inmediato al estado vacío orientativo.

---

## 7. Fuera de alcance

1. **Integraciones bancarias y automatizaciones:** No se contemplan llamadas a APIs bancarias, sincronizaciones automáticas de cuentas ni importación mediante web scraping.
2. **Cuentas financieras y medios de pago:** No existe el concepto de cuentas bancarias, billeteras, tarjetas de crédito ni transferencias de fondos entre cuentas.
3. **Arrastre de saldos (Carryover):** No se realiza transferencia automática de sobrantes o déficits entre meses consecutivos.
4. **Transacciones recurrentes o automáticas:** No hay automatización para sueldos o suscripciones periódicas fijas.
5. **Transacciones con fecha futura:** Queda estrictamente prohibido registrar transacciones reales con fecha posterior a la fecha actual del sistema.
6. **Soporte multimoneda:** Toda la aplicación opera bajo el símbolo fijo `$`; no se contemplan cotizaciones ni conversiones de divisas.
7. **Autenticación y multiusuario:** No se contemplan pantallas de login, registro de usuarios ni esquemas multi-inquilino.
8. **Subcategorías y etiquetas múltiples:** Cada transacción se asocia a una única categoría principal.
9. **Importación y exportación de archivos:** No se incluye exportación ni importación masiva de archivos (CSV, Excel o PDF) en el MVP.

---

## 8. Criterios de finalización

1. La especificación cubre el ciclo completo de planificación presupuestaria mensual y registro de transacciones sin vacíos de comportamiento ni ambigüedades.
2. Todas las reglas matemáticas de balances, porcentajes, disponibles y comparativas están formalmente expresadas y resueltas frente a indeterminaciones (división por cero y redondeo HALF_UP).
3. Todos los requisitos funcionales cuentan con criterios de aceptación verificables bajo sintaxis EARS en español.
4. Se garantiza la integridad referencial y auditabilidad histórica del modelo de datos sin comprometer la extensibilidad ni la consistencia de tipos.
5. Se eliminan todas las dudas abiertas y ambigüedades, quedando la especificación 100% cerrada y lista para la elaboración del plan técnico de implementación, en estricto cumplimiento con `docs/constitution.md`.
