                    ┌──────────────┐
                    │  React 19    │
                    │    Vite      │
                    └──────┬───────┘
                           │
                         HTTPS
                           │
                    ┌──────▼───────┐
                    │   Fastify    │
                    │      API     │
                    └──────┬───────┘
                           │
             ┌─────────────┼─────────────┐
             │             │             │
        PostgreSQL       Storage        Auth
             │             │             │
             └──────── Supabase ─────────┘


-------------------------------------------------------

client/                            apps/web/
server/	                     apps/api/
WhatsApp y trabajos asíncronos	apps/worker/
Modelos compartidos	              packages/database/
Validación	                     packages/schemas/
Contratos API	                     packages/contracts/

-------------------------------------------------------

Ahora mismo no consideraría la aplicación preparada para producción bajo RGPD. Maneja datos de menores y las intolerancias pueden revelar datos de salud, una categoría especialmente protegida. Debes demostrar el cumplimiento con documentación, controles técnicos y procedimientos; no existe un botón que “certifique RGPD”.
Cómo verificarlo
1. Identifica los roles legales
Define por contrato quién es:
- Responsable del tratamiento: probablemente la empresa de extraescolares o el colegio, dependiendo de quién determine finalidad y medios.
- Encargado del tratamiento: posiblemente tu plataforma cuando trata datos por cuenta del responsable.
- Subencargados: MongoDB Atlas, hosting, correo, WhatsApp, almacenamiento, analítica, copias de seguridad, etc.
- Delegado de Protección de Datos. Los centros docentes están obligados a designarlo en los supuestos establecidos por la LOPDGDD. AEPD: DPD en centros docentes
2. Crea un Registro de Actividades de Tratamiento
Documenta separadamente:
- Gestión de alumnos y familias.
- Profesores y personal.
- Intolerancias y necesidades médicas.
- Becas e información económica.
- Asistencia y actividades.
- Comunicaciones por email o WhatsApp.
- Facturación.
- Fotografías y autorizaciones, si se incorporan.
- Registros de acceso y seguridad.
Para cada tratamiento indica finalidad, base jurídica, datos tratados, destinatarios, conservación, transferencias internacionales y medidas de seguridad.
La herramienta apropiada sería Gestiona RGPD de la AEPD, no únicamente Facilita RGPD: Facilita está orientada a tratamientos de bajo riesgo y la propia AEPD excluye datos de salud o tratamientos de alto riesgo. Limitaciones de Facilita RGPD
3. Realiza un análisis de riesgos y valora una EIPD
Por combinar menores, salud, actividad educativa, comunicaciones y posiblemente tratamiento a escala, debes analizar formalmente si necesitas una Evaluación de Impacto de Protección de Datos.
No significa que sea automáticamente obligatoria en todos los escenarios, pero sí que debes documentar la decisión. Puedes usar Evalúa-Riesgo RGPD y Gestiona RGPD de la AEPD. El artículo 35 regula esta evaluación para tratamientos de alto riesgo. Texto oficial del RGPD
4. Determina una base jurídica por finalidad
No uses “consentimiento” como solución universal.
Debes establecer una base jurídica concreta para:
- Gestión contractual de la actividad.
- Obligaciones legales o educativas.
- Facturación.
- Seguridad y atención ante intolerancias.
- Comunicaciones comerciales.
- Fotografías.
- WhatsApp.
- Cesiones a colegios, profesores o servicios sanitarios.
Para datos de salud necesitas, además, una excepción válida del artículo 9 RGPD. Debe validarlo el DPD o un profesional especializado.
5. Verifica los derechos de las familias
La aplicación debería permitir gestionar y acreditar:
- Acceso.
- Rectificación.
- Supresión.
- Limitación.
- Oposición.
- Portabilidad cuando proceda.
- Retirada del consentimiento.
- Exportación legible de todos los datos asociados.
- Respuesta dentro del plazo aplicable.
La exportación CSV actual es útil, pero no constituye por sí sola un procedimiento completo de derechos RGPD.
Carencias técnicas actuales importantes
Por lo que hemos desarrollado hasta ahora, antes de producción faltan al menos:
- Autenticación real.
- Autorización por roles y organización.
- Impedir que un profesor consulte alumnos ajenos.
- Sesiones seguras y recuperación de contraseñas.
- Registro de accesos y cambios sobre datos sensibles.
- Cifrado o protección adicional de intolerancias.
- Política automática de conservación y eliminación.
- Gestión de solicitudes de derechos.
- Registro y gestión de consentimientos/autorizaciones.
- Copias de seguridad y restauración probadas.
- Procedimiento de incidentes.
- Limitación de intentos y protección de endpoints.
- Revisión de exportaciones para evitar fugas masivas.
- Separación estricta entre organizaciones.
- Contratos de encargado y subencargado.
- Verificación de la región de MongoDB Atlas y posibles transferencias internacionales.
En especial, la API actual no debería exponerse a Internet sin autenticación y autorización: conocer un identificador de organización no puede ser suficiente para acceder a alumnos, intolerancias o becas.
6. Comprueba privacidad desde el diseño
La lista oficial de cumplimiento de la AEPD sirve como auditoría inicial. Conserva las respuestas y evidencias:
- Capturas de configuración.
- Matriz de permisos.
- Pruebas de aislamiento entre organizaciones.
- Contratos.
- Registro de tratamientos.
- Análisis de riesgos/EIPD.
- Pruebas de restauración.
- Registro de formación.
- Revisiones periódicas.
La AEPD advierte que completar una herramienta o plantilla no garantiza automáticamente el cumplimiento.
7. Prepara las brechas de seguridad
Debes tener un procedimiento que permita:
- Detectar y registrar incidentes.
- Identificar afectados y datos expuestos.
- Avisar inmediatamente al responsable si actúas como encargado.
- Evaluar el riesgo.
- Notificar a la autoridad cuando corresponda.
- Informar a los afectados cuando exista alto riesgo.
La notificación a la autoridad debe hacerse, cuando proceda, dentro de las 72 horas desde que se tiene constancia; incluso las brechas no notificadas deben documentarse.