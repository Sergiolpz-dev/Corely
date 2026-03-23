# Manual de Pruebas del Backend — Corely

Este documento describe cómo ejecutar las pruebas unitarias del backend de Corely, qué cubren y cómo interpretar los resultados.

---

## Requisitos previos

- Python 3.10 o superior instalado
- Dependencias del backend instaladas:

```bash
cd backend
pip install -r requirements.txt
```

- **No es necesario** tener MySQL/MariaDB activo. Las pruebas usan una base de datos SQLite en memoria que se crea y destruye automáticamente.

---

## Estructura de los ficheros de prueba

```
backend/
├── pytest.ini              # Configuración de pytest
└── tests/
    ├── conftest.py         # Fixtures compartidas (base de datos, cliente, usuarios)
    ├── test_auth.py        # Pruebas de autenticación
    ├── test_tasks.py       # Pruebas de tareas
    └── test_habits.py      # Pruebas de hábitos
```

---

## Ejecutar las pruebas

Desde el directorio `backend/`:

```bash
# Ejecutar todas las pruebas
pytest tests/ -v

# Ejecutar solo un fichero
pytest tests/test_auth.py -v
pytest tests/test_tasks.py -v
pytest tests/test_habits.py -v

# Ejecutar un test concreto
pytest tests/test_habits.py::test_toggle_grace_period -v

# Resumen compacto sin detalle de cada test
pytest tests/
```

---

## Descripción de las pruebas

### Autenticación — `test_auth.py` (10 pruebas)

| Prueba | Descripción |
|--------|-------------|
| `test_register_success` | Registrar un usuario nuevo devuelve 201 con su email y username |
| `test_register_duplicate_email` | Registrar un email ya existente devuelve 400 |
| `test_register_duplicate_username` | Registrar un username ya existente devuelve 400 |
| `test_login_success` | Login correcto devuelve 200 con `access_token` |
| `test_login_with_email` | El campo `username` del login también acepta el email |
| `test_login_wrong_password` | Contraseña incorrecta devuelve 401 |
| `test_login_nonexistent_user` | Usuario inexistente devuelve 401 |
| `test_me_authenticated` | `GET /auth/me` con token válido devuelve los datos del usuario |
| `test_me_unauthenticated` | `GET /auth/me` sin token devuelve 401 |
| `test_logout` | `POST /auth/logout` devuelve 200 |

---

### Tareas — `test_tasks.py` (7 pruebas)

| Prueba | Descripción |
|--------|-------------|
| `test_create_task` | Crear una tarea devuelve 201 con los campos correctos |
| `test_create_task_duplicate_name` | Dos tareas con el mismo nombre para el mismo usuario devuelve 400 |
| `test_get_tasks` | `GET /tasks` devuelve únicamente las tareas del usuario autenticado |
| `test_update_task` | `PUT /tasks/{id}` actualiza los campos correctamente |
| `test_update_task_not_owner` | Editar una tarea de otro usuario devuelve 404 |
| `test_delete_task` | `DELETE /tasks/{id}` elimina la tarea y devuelve 204 |
| `test_delete_task_not_owner` | Eliminar una tarea de otro usuario devuelve 404 |

---

### Hábitos — `test_habits.py` (9 pruebas)

| Prueba | Descripción |
|--------|-------------|
| `test_create_habit` | Crear un hábito devuelve 201 con `streak = 0` |
| `test_create_habit_duplicate_name` | Dos hábitos con el mismo nombre para el mismo usuario devuelve 400 |
| `test_get_habits` | `GET /habits` devuelve la lista de hábitos del usuario |
| `test_update_habit` | `PUT /habits/{id}` actualiza los campos del hábito |
| `test_delete_habit` | `DELETE /habits/{id}` elimina el hábito y devuelve 204 |
| `test_toggle_first_time` | El primer toggle establece `streak = 1` |
| `test_toggle_undo_today` | Marcar y desmarcar el mismo día reduce el streak |
| `test_toggle_grace_period` | Saltar un día no rompe la racha (período de gracia) |
| `test_toggle_broken_streak` | Superar el período de gracia reinicia el streak a 1 |

---

## Resultado esperado

Al ejecutar todas las pruebas correctamente se obtiene:

```
26 passed in X.XXs
```

---

## Interpretar los fallos

Si algún test falla, pytest muestra el motivo con detalle:

```
FAILED tests/test_auth.py::test_login_success
AssertionError: assert 401 == 200
```

Para ver más contexto del error:

```bash
pytest tests/ -v --tb=short
```

---

## Notas

- Las pruebas son **independientes entre sí**: cada una parte de una base de datos limpia.
- No modifican ni leen la base de datos de desarrollo o producción.
- Los *warnings* que aparecen al ejecutar las pruebas provienen del propio código del backend (uso de APIs deprecadas de SQLAlchemy y Pydantic) y no afectan al funcionamiento.
