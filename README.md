# Snip — Acortador de URLs con Analytics

Servicio full-stack de acortamiento de URLs con analytics en tiempo real, generación de códigos QR y seguimiento por enlace. Proyecto personal para explorar backends async en Python y patrones modernos de React.

**[Demo en vivo →](https://snip-kohl.vercel.app)**

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React_19-61DAFB?style=flat&logo=react&logoColor=black)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-FF4438?style=flat&logo=redis&logoColor=white)

---

## Funcionalidades

- **Acortamiento de URLs** — slugs generados automáticamente o personalizados
- **Generación de QR** — código QR instantáneo para cada enlace
- **Expiración de enlaces** — TTL opcional de 1 hora hasta 30 días
- **Analytics por enlace** — clics en el tiempo, dispositivos, navegadores, países, referrers
- **Autenticación** — JWT con hashing de contraseñas via bcrypt
- **Rate limiting** — límites por endpoint para prevenir abuso
- **Caché con Redis** — redirects y datos de geolocalización cacheados para minimizar carga en la BD
- **Tema oscuro / claro** — detección del sistema con toggle manual

---

## Stack

| Capa          | Tecnología                                           |
| ------------- | ---------------------------------------------------- |
| Frontend      | React 19, TypeScript, Vite, Tailwind CSS 4, Recharts |
| Backend       | FastAPI, SQLAlchemy 2 (async), Alembic, Pydantic v2  |
| Base de datos | PostgreSQL 16                                        |
| Caché         | Redis 7                                              |
| Auth          | JWT (python-jose), bcrypt (passlib)                  |
| Despliegue    | Docker, Docker Compose                               |

---

## Cómo correrlo

### Requisitos

- [Docker](https://www.docker.com/) y Docker Compose

### Con Docker

```bash
git clone https://github.com/tu-usuario/snip.git
cd snip
cp backend/.env.example backend/.env  # completá los valores
docker compose up --build
```

- Frontend: `http://localhost:5173`
- API: `http://localhost:8000`
- Docs de la API: `http://localhost:8000/docs`

### Sin Docker

**Backend**

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

---

## Variables de entorno

Creá un archivo `backend/.env`:

```env
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/snip
REDIS_URL=redis://localhost:6379
SECRET_KEY=tu-clave-secreta
BASE_URL=http://localhost:8000
CORS_ORIGINS=http://localhost:5173
```

---

## Arquitectura

```
frontend/          React SPA (Vite)
backend/
  app/
    routers/       auth, urls, analytics
    services/      shortener, cache, geo, auth, limiter
    models/        User, URL, Visit
    config.py      Configuración con Pydantic Settings
    database.py    Motor async de SQLAlchemy
    main.py        App FastAPI + handler de redirects
  alembic/         Migraciones de BD
docker-compose.yml PostgreSQL + Redis + backend + frontend
```
