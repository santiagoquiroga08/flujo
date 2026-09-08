# README - Flujo

## 1. Identidad del proyecto

Tipo de producto: aplicación de finanzas personales.

Contexto inicial: Colombia.

Moneda del MVP: peso colombiano (COP).

Usuario inicial: el propio desarrollador.

Evolución prevista: producto multiusuario y potencialmente comercial bajo un modelo gratuito con funcionalidades premium.

Modalidad de registro financiero: exclusivamente manual en el MVP.

## 2. Problema

Las personas tienen dificultad para mantener un registro constante de sus ingresos y gastos y relacionarlos con un presupuesto mensual, lo que les hace perder visibilidad sobre cuánto dinero pueden gastar y en qué se está utilizando.

El problema no consiste necesariamente en la ausencia de herramientas capaces de realizar cálculos financieros. El problema principal identificado es la fricción de uso y registro.

El modelo actual del usuario demuestra que una hoja de cálculo puede proporcionar el control financiero necesario, pero exige:

- recordar los movimientos;
- abrir el archivo;
- introducirlos manualmente;
- mantener una estructura organizada;
- consultar y actualizar diferentes partes de la hoja.

La aplicación busca mantener el modelo de control financiero que resulta útil en Excel, pero reducir la fricción de interacción.

## 3. Propósito

> Crear una herramienta que permita a una persona organizar y controlar sus finanzas personales mediante la proyección de ingresos, la planificación de egresos, el registro manual de movimientos reales y la visualización del estado financiero mensual.

El objetivo práctico es que el usuario pueda responder fácilmente preguntas como:

> ¿Cuánto dinero tengo disponible?  
> ¿Cuánto esperaba recibir este mes?  
> ¿Cuánto he recibido realmente?  
> ¿Cuánto había presupuestado gastar?  
> ¿Cuánto he gastado realmente?  
> ¿En qué estoy gastando mi dinero?  
> ¿Cuánto dinero estoy destinando a ahorro?  
> ¿Cuánto me queda de mis deudas?  
> ¿Cuánto dinero me quedó al terminar el mes?

## 4. Principio fundamental del producto

Hay una distinción que debe mantenerse durante todo el proyecto:

**Planificación ≠ Realidad.**

La aplicación debe permitir que el usuario planifique financieramente un mes sin modificar esos valores automáticamente cuando registre lo que realmente ocurrió.

Por tanto:

Ingresos:

- Proyección → lo que espera recibir.
- Real → lo que efectivamente recibió.

Egresos:

- Presupuesto → lo que planea gastar.
- Real → lo que efectivamente gastó.

Esto permite situaciones como:

> Ingresos proyectados: $2.000.000  
> Ingresos reales: $1.700.000

o:

> Egresos presupuestados: $1.500.000  
> Egresos reales: $1.650.000

La aplicación no debe ocultar estas situaciones ni ajustar artificialmente la planificación para hacer que los números “cuadren”.

## 5. Modelo financiero

El dominio inicial está compuesto por:

- Ingresos.
- Egresos.
- Presupuestos.
- Proyecciones de ingresos.
- Deudas.
- Ahorro.
- Saldo inicial.
- Saldo disponible.
- Saldo a favor.
- Períodos mensuales.

> La regla fundamental del saldo disponible es:

$$\text{Saldo disponible} = \text{saldo inicial} + \text{ingresos reales} - \text{egresos reales}$$

El ahorro y las deudas se modelan formalmente como categorías de egresos. Por consiguiente, los desembolsos reales destinados a ahorro o pago de deudas forman parte de `egresos reales` y restan directamente del saldo disponible.

## 6. Ingresos

Los ingresos tendrán categorías configurables.

Ejemplos:

- Nómina.
- Propinas.
- Regalos.
- Préstamos recuperados.

El usuario podrá crear, modificar y eliminar categorías.

Cada ingreso tendrá:

- categoría;
- descripción;
- valor;
- fecha.

Las categorías tendrán una proyección mensual y sus movimientos representarán el ingreso real.

Ejemplo:

> Propinas  
> Proyección: $500.000  
> Real: $430.000

A nivel global se mostrará principalmente:

> Ingresos proyectados: $2.500.000  
> Ingresos reales: $2.430.000

No se considera especialmente relevante mostrar la diferencia entre proyección y realidad para cada categoría individual.

## 7. Egresos

Las categorías de egresos normales serán configurables.

Ejemplos:

- Servicios.
- Pasajes.
- Gastos.
- Otras categorías creadas por el usuario.

Cada categoría tendrá un presupuesto mensual.

Dentro de cada categoría existirán movimientos.

Cada egreso tendrá:

- valor;
- descripción/concepto;
- categoría;
- fecha.

Ejemplo:

> Gastos  
> Presupuesto: $350.000
>
> - Salida a comer con amigos — $80.000
> - Merienda — $30.000
> - Cine — $40.000  
> Real: $150.000.

No habrá límite de movimientos por categoría.

## 8. Presupuesto general

El presupuesto general de egresos no será introducido directamente por el usuario.

Será calculado mediante la suma de los presupuestos de todas las categorías de egresos (incluyendo categorías normales, la categoría especial Ahorro y la categoría especial Deudas).

Por ejemplo:

> Servicios → $150.000  
> Pasajes → $140.000  
> Gastos → $350.000  
> Deudas → $500.000  
> Ahorro → $400.000  
> **Presupuesto general → $1.540.000**

Por tanto, si el usuario modifica un presupuesto individual, automáticamente cambia el presupuesto general.

## 9. Presupuesto mensual y ciclo de vida

El usuario no tendrá que reconstruir manualmente el presupuesto cada mes.

- **Creación bajo demanda:** Un mes no se crea automáticamente por calendario. Se inicializa únicamente cuando el usuario navega a ese período o registra un movimiento cuya fecha corresponda a dicho mes.
- **Copia de presupuestos:** Al inicializarse un mes bajo demanda, este clona los presupuestos del mes cronológico inmediatamente anterior.
- **Independencia:** Cada mes tiene su propia copia independiente. Una modificación posterior en el mes anterior no altera los meses ya creados.
- El usuario puede modificar los presupuestos durante el curso del mes.

Si un presupuesto se supera, la aplicación:

- permite registrar el movimiento;
- muestra visualmente que el presupuesto fue excedido;
- advierte al usuario de la situación sin bloquear la operación.

El presupuesto es una herramienta de planificación, no una restricción técnica que impida gastar.

## 10. Saldo inicial

El usuario podrá establecer un saldo inicial al comenzar a utilizar la aplicación por primera vez.

Este saldo representa dinero que ya posee y no constituye un ingreso devengado durante el período.

El saldo inicial es conceptualmente diferente del saldo a favor originado en meses anteriores.

## 11. Saldo a favor y tratamiento de déficit

Al finalizar un mes se determina el dinero remanente:

$$\text{Saldo final} = \text{saldo inicial} + \text{ingresos reales} - \text{egresos reales}$$

- **Remanente positivo (superávit):** Aparecerá automáticamente en el mes siguiente como un ingreso especial bajo la categoría `Saldo a favor del mes anterior`. El usuario puede consultarlo y modificar su valor si decide no computar la totalidad como disponible.
- **Remanente negativo (déficit):** Si el mes cierra con saldo negativo, este no se traslada al mes siguiente. En el período siguiente, la categoría `Saldo a favor del mes anterior` iniciará en $0. El déficit histórico permanece acotado al mes donde ocurrió.
- **Independencia histórica:** La modificación del ingreso del nuevo mes no altera las estadísticas históricas del mes previo.

## 12. Cierre mensual y aislamiento histórico

Cada mes podrá tener dos estados: abierto o cerrado.

Mientras está abierto:

- se pueden registrar, editar y eliminar movimientos;
- se pueden registrar transacciones con fechas retroactivas dentro del período.

Al cerrar el mes:

- se consolidan los balances;
- los movimientos quedan bloqueados contra escritura accidental.

**Reapertura y regla de aislamiento estricto:**

- Si el usuario detecta un error, puede reabrir el mes, corregir la información y volver a cerrarlo.
- Los cambios realizados en un mes reabierto **no** modifican en cascada los registros de meses posteriores. Si el saldo de cierre de un mes cambia tras una corrección retroactiva, el `Saldo a favor del mes anterior` ya registrado en períodos sucesivos permanece inalterado, preservando las decisiones tomadas en esos períodos.

## 13. Categorías

Existirán dos tipos conceptuales de categorías:

### Categorías normales

El usuario puede crear, modificar y eliminar.

- Los cambios de nombre aplican retrospectivamente a todos los movimientos históricos asociados.
- Si se elimina una categoría que contiene transacciones, sus movimientos pasan automáticamente a la categoría `Sin categoría`. Ninguna información financiera se elimina.

### Categorías especiales

Existirán de forma predeterminada:

- `Ahorro`.
- `Deudas`.
- `Sin categoría` (disponible tanto para ingresos como para egresos).

No podrán ser eliminadas ni renombradas por el usuario en el MVP.

## 14. Deudas

Las deudas constituyen una categoría especial con lógica propia.

Cada deuda tendrá, como mínimo:

- nombre o descripción;
- valor total inicial;
- valor pagado acumulado;
- valor pendiente;
- fecha de pago programada;
- fecha prevista de finalización;
- cuotas;
- estado de cada cuota.

Reglas operativas de deuda:

- El sistema generará las cuotas mensuales pendientes (las cuales pueden ser de importes dispares).
- **Doble impacto automático:** Registrar un abono o cuota en el módulo de deudas actualiza la deuda y genera en simultáneo un egreso real dentro de la categoría especial `Deudas`, descontándolo del saldo disponible del período.
- Se admiten pagos extraordinarios por montos arbitrarios sin desglosarse forzosamente en múltiples cuotas.
- Cuando el saldo pendiente llega a $0, la deuda pasa al estado de saldada.
- La fecha de finalización real se registrará cuando ocurra el último abono, independientemente de la fecha proyectada original.
- El presupuesto asignado a la categoría `Deudas` en el mes es independiente de la suma de las cuotas programadas.

## 15. Ahorro

El ahorro es una categoría especial de egreso:

- No incluye metas de ahorro en el MVP.
- Funciona como una asignación presupuestaria y posterior movimiento de egreso real (dinero apartado físicamente o transferido fuera del flujo operativo corriente).
- Cuenta con presupuesto mensual y registro de egreso real.
- El saldo a favor de un mes cerrado no se transfiere automáticamente a ahorro.

## 16. Registro manual

El MVP se concibe exclusivamente para registro manual.

El usuario introduce de forma directa:

- ingresos;
- egresos;
- abonos a deudas;
- apartados de ahorro.

Queda excluido en esta etapa cualquier tipo de:

- sincronización con banca en línea;
- importación de extractos bancarios (CSV, OFX, PDF);
- automatizaciones de scraping o lectura de notificaciones transaccionales.

## 17. Fuera de alcance inicial

Quedan formalmente excluidos del MVP:

- inversiones y rendimientos;
- seguimiento de patrimonio neto;
- gestión granular de cuentas bancarias y conciliación;
- metas de ahorro programadas;
- analítica predictiva o modelos financieros avanzados.

## 18. Usuario y evolución

- **Etapa 1:** MVP mono-usuario enfocado en resolver el flujo diario del desarrollador.
- **Etapa 2:** Validación y ajuste en uso real.
- **Etapa 3:** Extensión multiusuario y comercialización bajo esquema Freemium.

El diseño del MVP debe centrarse en la resolución del problema y la eliminación de fricción operativa antes de concebir esquemas de monetización.

## 19. Restricciones del proyecto

- Desarrollo individual.
- Disponibilidad de dedicación: aprox. 10 horas semanales.
- Costo de infraestructura durante desarrollo: preferentemente $0 (free-tier).
- Enfoque tecnológico: herramientas alineadas con demanda laboral en la industria.
- Contexto y moneda: Colombia (COP).
- Metodología: Spec-Driven Development asistido por IA.

## 20. Criterio de éxito del MVP

El criterio de éxito no se mide por volumen de funcionalidades, sino por retención operativa:

> Que el usuario utilice la aplicación de forma constante en su día a día y prefiera su uso por encima de la hoja de cálculo de Excel previamente utilizada.

## 21. Decisiones técnicas diferidas

Permanecen fuera de discusión en esta etapa:

- frontend y backend;
- motor de base de datos;
- arquitectura de despliegue;
- librerías de componentes UI;
- esquema de autenticación y sesiones;
- proveedor cloud o hosting.
