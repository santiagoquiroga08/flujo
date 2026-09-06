# Constitución — Flujo

Principios innegociables. Toda spec, plan y tarea debe cumplirlos.
1. Simplicidad del stack: arquitectura monolítica ligera; cero dependencias innecesarias o servicios distribuidos en el MVP.
2. La spec manda: ningún comportamiento se implementa si no está en la spec activa. Prohibido asumir vacíos; se pregunta.
3. Separación estricta de lógica e interfaz: reglas de cálculo y validaciones financieras residen en el core, aisladas e independientes de la UI.
4. Tests como puerta de control: todo cálculo financiero crítico exige tests automatizados en verde antes de dar por cerrada una tarea.
5. Persistencia confiable y local first: modelo de datos relacional simple, estructurado y auditable, sin integraciones bancarias externas.
6. Idioma: código, esquemas e identificadores estrictamente en inglés; interfaz, mensajes al usuario y documentación en español.