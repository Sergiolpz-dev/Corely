# Corely - Sistema de Gestión Integral

> Trabajo de Fin de Grado - Desarrollo de Aplicación Web Full Stack

[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/) [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/) [![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/) [![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/) [![MariaDB](https://img.shields.io/badge/MariaDB-003545?style=flat&logo=mariadb&logoColor=white)](https://mariadb.org/) [![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)

---

## 🎯 Sobre el Proyecto

**Corely** es un sistema web integral que centraliza la gestión de la vida digital del usuario en una única interfaz. La plataforma actúa como un hub personal donde convergen diferentes aspectos de la productividad, salud, finanzas y entretenimiento, permitiendo al usuario tener un control total sobre su información desde un solo punto de acceso.

**¿Qué problema resuelve?**  
La fragmentación digital. Actualmente, la información de una persona está dispersa en múltiples aplicaciones. El proyecto elimina la fatiga de saltar entre pestañas al centralizar todo en una única interfaz inteligente y personalizada.

**¿Qué nos motiva?**  
La utilidad real. Nos motiva construir una herramienta que nosotros mismos usaremos a diario para organizar nuestra vida académica y personal. Se enfoca en:

- **Seguridad**: Implementación de autenticación JWT robusta
- **Experiencia de Usuario**: Interfaz moderna y responsive con diseño profesional
- **Escalabilidad**: Arquitectura preparada para crecer con el negocio
- **Buenas Prácticas**: Código limpio, modular y bien documentado

---

### Estado del Proyecto 🚀

| Implementado ✅ | Descripción Técnica |
| :--- | :--- |
| **Auth System** | JWT, Registro/Login, Persistencia y Seguridad (bcrypt). |
| **Inicio** | Dashboard principal con resumen de actividad y accesos directos. |
| **Tareas** | CRUD completo de tareas con estados y prioridades. |
| **Hábitos** | Seguimiento de hábitos con rachas y periodo de gracia. |
| **Finanzas** | Gestión de ingresos, gastos y resumen mensual. |
| **Calendario** | Vista de eventos y planificación temporal. |
| **Noticias** | Feed de noticias integrado con fuentes externas. |
| **Ajustes** | Configuración de perfil y preferencias de la cuenta. |
| **IA Fitness** | Asistente de fitness impulsado por IA (Gemini) con rutinas personalizadas. |
| **Testing** | Suite de pruebas backend (pytest) y frontend (Vitest). |
| **UX/UI Modern** | Dashboard responsive, Sidebar y componentes Shadcn/ui. |
| **Backend Architecture** | FastAPI + SQLAlchemy (MariaDB) + Pydantic. |
| **DevOps Ready** | Dockerizado, Swagger Docs y gestión de entornos. |

---

## 🛠️ Tecnologías

### Frontend

| Tecnología | Propósito |
|------------|-----------|
| ![React](https://img.shields.io/badge/-React-61dafb?logo=react&logoColor=white) | Librería UI principal |
| ![TypeScript](https://img.shields.io/badge/-TypeScript-3178c6?logo=typescript&logoColor=white) | Tipado estático |
| ![Vite](https://img.shields.io/badge/-Vite-646cff?logo=vite&logoColor=white) | Build tool y dev server |
| ![Tailwind CSS](https://img.shields.io/badge/-Tailwind-06b6d4?logo=tailwindcss&logoColor=white) | Framework CSS utility-first |
| ![React Router](https://img.shields.io/badge/-React_Router-ca4245?logo=reactrouter&logoColor=white) | Enrutamiento SPA |
| ![shadcn/ui](https://img.shields.io/badge/-shadcn/ui-000000?logo=shadcnui&logoColor=white) | Componentes UI |
| ![Lucide](https://img.shields.io/badge/-Lucide-f56565?logo=lucide&logoColor=white) | Iconos modernos |
| ![Vitest](https://img.shields.io/badge/-Vitest-6e9f18?logo=vitest&logoColor=white) | Testing de componentes |

### Backend

| Tecnología | Propósito |
|------------|-----------|
| ![FastAPI](https://img.shields.io/badge/-FastAPI-009688?logo=fastapi&logoColor=white) | Framework web moderno |
| ![Python](https://img.shields.io/badge/-Python_3.13-3776ab?logo=python&logoColor=white) | Lenguaje backend |
| ![SQLAlchemy](https://img.shields.io/badge/-SQLAlchemy-d71f00?logo=sqlalchemy&logoColor=white) | ORM para bases de datos |
| ![Pydantic](https://img.shields.io/badge/-Pydantic-e92063?logo=pydantic&logoColor=white) | Validación de datos |
| ![JWT](https://img.shields.io/badge/-JWT-000000?logo=jsonwebtokens&logoColor=white) | Autenticación stateless |
| ![bcrypt](https://img.shields.io/badge/-bcrypt-338000?logo=letsencrypt&logoColor=white) | Hash de contraseñas |
| ![Pytest](https://img.shields.io/badge/-Pytest-0a9edc?logo=pytest&logoColor=white) | Testing de endpoints |
| ![Gemini](https://img.shields.io/badge/-Gemini_AI-4285F4?logo=google&logoColor=white) | IA para módulo fitness |

### Base de Datos & DevOps

| Tecnología | Propósito |
|------------|-----------|
| ![MariaDB](https://img.shields.io/badge/-MariaDB-003545?logo=mariadb&logoColor=white) | Base de datos relacional |
| ![Docker](https://img.shields.io/badge/-Docker-2496ed?logo=docker&logoColor=white) | Contenedorización |
| ![Git](https://img.shields.io/badge/-Git-f05032?logo=git&logoColor=white) | Control de versiones |

---

## 🧪 Testing

El proyecto cuenta con una suite de pruebas tanto en backend como en frontend.

### Backend — Pytest

Las pruebas del backend usan **SQLite en memoria**, por lo que no es necesario tener la base de datos levantada.

```
backend/
├── pytest.ini
└── tests/
    ├── conftest.py       # Fixtures compartidas (BD, cliente, usuarios)
    ├── test_auth.py      # Autenticación: registro, login, tokens
    ├── test_tasks.py     # CRUD de tareas
    ├── test_habits.py    # Hábitos y periodo de gracia
    └── test_events.py    # Eventos de calendario
```

```bash
# Desde /backend
pytest tests/ -v

# Un módulo concreto
pytest tests/test_auth.py -v
```

### Frontend — Vitest

Las pruebas del frontend validan el renderizado y comportamiento de las páginas principales.

```
frontend/src/tests/
├── LoginPage.test.tsx
├── SignupPage.test.tsx
├── HabitsPage.test.tsx
├── TaskPage.test.tsx
├── CalendarPage.test.tsx
├── NewsPage.test.tsx
└── SettingsPage.test.tsx
```

```bash
# Desde /frontend
npm test          # Ejecución única
npm run test:watch  # Modo observación
```

---

## 🤝 Contribuir

Este es un proyecto de TFG, pero las sugerencias y feedback son bienvenidos.

### Reportar Bugs

Si encuentras un bug, por favor abre un issue con:
- Descripción del problema
- Pasos para reproducirlo
- Comportamiento esperado vs actual
- Screenshots si aplica

### Sugerir Features

Las sugerencias de nuevas funcionalidades son bienvenidas. Abre un issue describiendo:
- El problema que resuelve
- Cómo lo implementarías
- Ejemplos de uso

---

## 👨‍💻 Contacto

**Autor:** Sergio Lopez y Jorge Carrillo  
**Proyecto:** Trabajo de Fin de Grado  
**Año:** 2025-2026  

**GitHub:** [Github-Sergio](https://github.com/Sergiolpz-dev)  
**GitHub:** [Github-Jorge](https://github.com/JcDevProject24/)

---
**Última actualización:** Abril 2026  
**Estado:** 🚧 En desarrollo activo  
**Versión:** 0.8.0

---

<div align="center">

**⭐ Si te gusta este proyecto, considera darle una estrella en GitHub ⭐**

</div>
