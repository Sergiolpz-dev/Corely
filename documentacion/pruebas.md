# Pruebas de la Aplicación Corely

Este documento recoge las pruebas realizadas sobre los distintos módulos de la aplicación a lo largo del desarrollo. Por cada módulo se muestra el resultado de la ejecución, incluyendo los fallos detectados y su posterior corrección.

---

## Backend

Las pruebas del backend se han implementado con **pytest 9.0.2** y cubren los módulos de autenticación, tareas y hábitos. Se utilizó SQLite en memoria como base de datos de prueba, lo que permite ejecutarlas sin necesidad de tener el servidor de base de datos activo.

### Primera ejecución — fallo detectado

| Campo | Valor |
|-------|-------|
| **Fecha** | 23 de marzo de 2026 |
| **Resultado** | ❌ 1 fallo — 25 pasadas, 1 fallida |
| **Duración** | 5,12 segundos |

Durante la primera ejecución se detectó un fallo en la prueba `test_me_unauthenticated`. El test comprobaba que al acceder a `GET /auth/me` sin token se devolvía un código **403 Forbidden**, pero la versión instalada de Starlette devuelve **401 Unauthorized** cuando el esquema `HTTPBearer` no recibe credenciales.

```
FAILED tests/test_auth.py::test_me_unauthenticated
AssertionError: assert 401 == 403
```

![Primera ejecución del backend con fallo](imagenes/pruebas_backend_fallo_2026-03-23.png)

**Corrección aplicada:** se actualizó el test para esperar el código 401, que es el comportamiento real y correcto del endpoint.

---

### Segunda ejecución — resultado final

| Campo | Valor |
|-------|-------|
| **Fecha** | 23 de marzo de 2026 |
| **Resultado** | ✅ Éxito — 26 pasadas, 0 fallos |
| **Duración** | 4,85 segundos |

Tras aplicar la corrección, todas las pruebas pasan satisfactoriamente.

![Segunda ejecución del backend sin fallos](imagenes/pruebas_backend_ok_2026-03-23.png)

---

### Desglose de pruebas

#### Autenticación (10 pruebas)

| Prueba | Descripción | Estado |
|--------|-------------|--------|
| `test_register_success` | Registro exitoso devuelve 201 con email y username | ✅ PASSED |
| `test_register_duplicate_email` | Email ya registrado devuelve 400 | ✅ PASSED |
| `test_register_duplicate_username` | Username ya registrado devuelve 400 | ✅ PASSED |
| `test_login_success` | Login correcto devuelve token JWT | ✅ PASSED |
| `test_login_with_email` | El campo username acepta también el email | ✅ PASSED |
| `test_login_wrong_password` | Contraseña incorrecta devuelve 401 | ✅ PASSED |
| `test_login_nonexistent_user` | Usuario inexistente devuelve 401 | ✅ PASSED |
| `test_me_authenticated` | `/auth/me` con token válido devuelve datos del usuario | ✅ PASSED |
| `test_me_unauthenticated` | `/auth/me` sin token devuelve 401 | ✅ PASSED |
| `test_logout` | Logout devuelve 200 | ✅ PASSED |

#### Tareas (7 pruebas)

| Prueba | Descripción | Estado |
|--------|-------------|--------|
| `test_create_task` | Crear tarea devuelve 201 con los campos correctos | ✅ PASSED |
| `test_create_task_duplicate_name` | Nombre duplicado por usuario devuelve 400 | ✅ PASSED |
| `test_get_tasks` | Listar tareas devuelve solo las del usuario autenticado | ✅ PASSED |
| `test_update_task` | Actualizar tarea modifica los campos correctamente | ✅ PASSED |
| `test_update_task_not_owner` | Editar tarea ajena devuelve 404 | ✅ PASSED |
| `test_delete_task` | Eliminar tarea devuelve 204 | ✅ PASSED |
| `test_delete_task_not_owner` | Eliminar tarea ajena devuelve 404 | ✅ PASSED |

#### Hábitos (9 pruebas)

| Prueba | Descripción | Estado |
|--------|-------------|--------|
| `test_create_habit` | Crear hábito devuelve 201 con streak inicial = 0 | ✅ PASSED |
| `test_create_habit_duplicate_name` | Nombre duplicado por usuario devuelve 400 | ✅ PASSED |
| `test_get_habits` | Listar hábitos devuelve la lista del usuario | ✅ PASSED |
| `test_update_habit` | Actualizar hábito modifica los campos correctamente | ✅ PASSED |
| `test_delete_habit` | Eliminar hábito devuelve 204 | ✅ PASSED |
| `test_toggle_first_time` | Primer toggle establece streak = 1 | ✅ PASSED |
| `test_toggle_undo_today` | Desmarcar el mismo día reduce el streak | ✅ PASSED |
| `test_toggle_grace_period` | Saltar un día no rompe la racha (período de gracia) | ✅ PASSED |
| `test_toggle_broken_streak` | Superar el período de gracia reinicia el streak a 1 | ✅ PASSED |

### Advertencias del sistema (*warnings*)

Durante la ejecución de las pruebas aparecen una serie de *warnings* que no provocan ningún fallo pero que conviene mencionar. Son avisos de deprecación generados por las propias dependencias del proyecto:

- **SQLAlchemy** informa de que `declarative_base()` ha sido movido a `sqlalchemy.orm` en la versión 2.0, y de que `datetime.utcnow()` quedará obsoleto en favor de objetos con zona horaria explícita.
- **Pydantic** informa de que la sintaxis `class Config` para configurar modelos ha sido reemplazada por `model_config = ConfigDict(...)` en la versión 2.0.

Estos avisos no afectan al funcionamiento de la aplicación ni al resultado de las pruebas. Corresponden a patrones de código válidos en las versiones anteriores de las librerías que siguen siendo compatibles en las versiones actuales, y su corrección queda fuera del alcance de este proyecto.

---

## Frontend

> _Pendiente de implementar._

---

## Resumen global

| Módulo | Pruebas | Pasadas | Fallidas |
|--------|---------|---------|----------|
| Backend | 26 | 26 | 0 |
| Frontend | — | — | — |
| **Total** | **26** | **26** | **0** |
