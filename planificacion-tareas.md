# Planificación y División de Tareas — Corely TFG

**Proyecto:** Corely — Aplicación de productividad personal (hábitos y tareas)
**Equipo:** Jorge · Sergio López
**Stack:** FastAPI (Python) + React + PostgreSQL + Docker

---

## División de responsabilidades

| Área                              | Jorge | Sergio |
| --------------------------------- | ----- | ------ |
| Backend (FastAPI, modelos, rutas) | ✓     | ✓      |
| Base de datos y Docker            | ✓     | ✓      |
| CI/CD (GitHub Actions)            | ✓     |        |
| Frontend base y routing           |       | ✓      |
| Autenticación JWT                 |       | ✓      |
| Auth Google OAuth                 | ✓     |        |
| Lógica de Hábitos (front)         | ✓     |        |
| Lógica de Tareas (front)          | ✓     | ✓      |

---

## Registro de tareas por fecha

### Enero 2026 — Inicio del proyecto

| Fecha      | Autor  | Tarea                                                                                    |
| ---------- | ------ | ---------------------------------------------------------------------------------------- |
| 17/01/2026 | Sergio | Inicialización del frontend con React y Tailwind                                         |
| 17/01/2026 | Jorge  | Inicialización del backend con Python FastAPI                                            |
| 17/01/2026 | Sergio | Test de conexión front–back–base de datos dockerizado                                    |
| 18/01/2026 | Jorge  | Fix: sincronización tras iniciar la base de datos                                        |
| 20/01/2026 | Sergio | Creación del dashboard principal, páginas de autenticación y navegación con React Router |
| 21/01/2026 | Sergio | Implementación del sistema completo de autenticación con JWT                             |

### Febrero 2026 — Infraestructura y mejoras de auth

| Fecha      | Autor | Tarea                                                                           |
| ---------- | ----- | ------------------------------------------------------------------------------- |
| 03/02/2026 | Jorge | Fix: ajuste de configuración general                                            |
| 14/02/2026 | Jorge | Implementación de CI/CD con GitHub Actions y versionado automático en DockerHub |
| 14/02/2026 | Jorge | Fix: permisos de escritura y optimización de versionado                         |
| 14/02/2026 | Jorge | Subida de imagen a DockerHub                                                    |
| 17/02/2026 | Jorge | Implementación de Google OAuth (×2)                                             |
| 17/02/2026 | Jorge | Implementación de datos de usuario en login                                     |
| 18/02/2026 | Jorge | Feat: mostrar/ocultar contraseña en login                                       |
| 18/02/2026 | Jorge | Fix: límite de tamaño de avatar en base de datos                                |
| 18/02/2026 | Jorge | Subida de imagen actualizada a DockerHub                                        |

### Marzo 2026 — Funcionalidades principales

| Fecha      | Autor  | Tarea                                                         |
| ---------- | ------ | ------------------------------------------------------------- |
| 03/03/2026 | Sergio | Implementación de la lógica de la página de Tareas (TaskPage) |
| 04/03/2026 | Sergio | Implementación del icono de editar tarea                      |
| 05/03/2026 | Jorge  | Implementación de la lógica de HabitsPage                     |
| 05/03/2026 | Jorge  | Implementación de colores y racha en HabitsPage               |
| 05/03/2026 | Jorge  | Implementación de la lógica de horas en TaskPage              |
| 23/03/2026 | Jorge  | Implementación de pruebas unitarias del backend con pytest                         |
| 23/03/2026 | Jorge  | Documentación de pruebas para la memoria del TFG                                   |
| 23/03/2026 | Sergio | Implementación de pruebas de componentes del frontend con Vitest y Testing Library |
| 23/03/2026 | Sergio | Documentación de pruebas del frontend para la memoria del TFG                     |
| 25/03/2026 | Sergio | Implementación de la lógica de la página de Calendar (CalendarPage) |

### Abril 2026 — Funcionalidades principales
| 02/04/2026 | Sergio | Implementación de la pruebas de la página de Calendar (CalendarPage) |
| 02/04/2026 | Jorge  | Implementación de la lógica de la página de noticias (NewsPage) |

---

## Flujo de ramas y trabajo en paralelo

El desarrollo se organizó mediante ramas de feature que luego se integraron en `main`, lo que permite verificar el trabajo simultáneo de ambos miembros:

| Rama                             | Autor  | Propósito                                 | Integrada en main |
| -------------------------------- | ------ | ----------------------------------------- | ----------------- |
| `feat/front-navegacion_paginas`  | Sergio | Dashboard y routing con React Router      | ✓                 |
| `feat/backend-autenticacion-jwt` | Sergio | Sistema de autenticación JWT              | ✓                 |
| `OAuth-login`                    | Jorge  | Autenticación con Google OAuth            | ✓                 |
| `github-actions`                 | Jorge  | Pipeline CI/CD y publicación en DockerHub | ✓                 |
| `feat/habitsPage`                | Jorge  | Lógica e interfaz de hábitos              | ✓                 |
| `feat/taksPage`                  | Sergio | Lógica e interfaz de tareas               | ✓                 |
| `feat/planificacion-tareas`      | Ambos  | Documento de planificación y división     | ✓                 |

Las ramas `feat/habitsPage` (Jorge) y `feat/taksPage` (Sergio) coexistieron activamente en el mismo periodo (marzo 2026), evidenciando desarrollo en paralelo antes de su integración en `main`.

---

## Integración entre partes

La integración entre frontend y backend quedó verificada desde el commit del **17/01/2026** (test de conexión front–back–bbdd), siendo este el punto de partida del desarrollo conjunto. A partir de ahí, ambos miembros trabajaron en paralelo sobre sus áreas, coordinando:

- **Contratos de API:** las rutas del backend (FastAPI) fueron diseñadas en paralelo con el consumo desde el frontend (React).
- **Autenticación:** Sergio implementó el flujo JWT en frontend y backend; Jorge añadió la capa de Google OAuth sobre esa base.
- **Docker Compose:** permite levantar el stack completo (frontend, backend, PostgreSQL) con un solo comando, garantizando que ambas partes funcionen integradas en el mismo entorno.
- **CI/CD:** el pipeline de GitHub Actions (Jorge) automatiza la construcción y publicación de la imagen Docker, asegurando que el entorno integrado sea siempre reproducible.

---

## Planificación de tareas futuras

Las siguientes secciones están pendientes de implementación. La distribución propuesta sigue la lógica de las competencias ya demostradas por cada miembro:

### Sergio López

| Sección        | Descripción                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------- |
| **Calendario** | Vista mensual/semanal que integra tareas y hábitos. Reutiliza los modelos de `TaskPage`.          |
| **Finanzas**   | Seguimiento de ingresos y gastos (categorías, importes, historial). Patrón CRUD análogo a tareas. |
| **Ajustes**    | Gestión del perfil de usuario, cambio de contraseña y preferencias. Conecta con el sistema JWT.   |

### Jorge Carrillo

| Sección      | Descripción                                                                                                   |
| ------------ | ------------------------------------------------------------------------------------------------------------- |
| **Inicio**   | Dashboard con estadísticas globales que agrega datos de tareas, hábitos y otros módulos.                      |
| **Fitness**  | Seguimiento de entrenamientos (sesiones, objetivos, progreso, rachas). Lógica directamente análoga a hábitos. |
| **Noticias** | Agregación y lectura de noticias (feed, categorías, fuentes configurables).                                   |

### Resumen

| Sección    | Estado   | Responsable |
| ---------- | -------- | ----------- |
| Inicio     | Previsto | Jorge       |
| Calendario | Previsto | Sergio      |
| Fitness    | Previsto | Jorge       |
| Finanzas   | Previsto | Sergio      |
| Noticias   | Previsto | Jorge       |
| Ajustes    | Previsto | Sergio      |
