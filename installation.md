# Docker Compose

The easiest way to run **HexoraIT** is using Docker Compose.

The provided `docker-compose.yml` starts:

| Service | Description |
|---------|-------------|
| **frontend** | React web application served by Nginx |
| **api** | ASP.NET Core Web API |
| **db** | PostgreSQL database *(optional if you already have PostgreSQL)* |
| **adminer** | Web database manager *(optional)* |

---

## Running

Start everything:

```bash
docker compose up -d
```

Stop:

```bash
docker compose down
```

View logs:

```bash
docker compose logs -f
```

Rebuild images:

```bash
docker compose up --build
```

If you want to start PostgreSQL and Adminer as well:

```bash
docker compose --profile database up -d
```

---

# Services

## Frontend

Available at:

```
http://localhost
```

Environment variables:

| Variable | Description |
|----------|-------------|
| `HEXORAIT_API_BASE_URL` | URL of the backend API (for example `http://localhost:8081/api`) |

Example:

```yaml
environment:
  HEXORAIT_API_BASE_URL: http://localhost:8081/api
```

---

## API

Available at:

```
http://localhost:8081
```

### Database

| Variable | Description |
|----------|-------------|
| `ConnectionStrings__Default` | PostgreSQL connection string |

Example:

```text
Host=db;
Port=5432;
Database=HexoraITApp;
Username=HexoraIT;
Password=HexoraIT;
```

If you're using an external PostgreSQL server simply replace `Host=db` with your server address.

---

### JWT

| Variable | Description |
|----------|-------------|
| `Jwt__Issuer` | JWT issuer |
| `Jwt__Audience` | JWT audience |
| `Jwt__SigningKey` | Secret key used to sign JWT tokens |

> Use a random secret key with at least **32 characters** in production.

---

### File storage

| Variable | Description |
|----------|-------------|
| `FileStorage__RootPath` | Directory where uploaded files are stored |

Example:

```yaml
FileStorage__RootPath: /app/storage
```

You can mount this directory as a Docker volume to persist uploaded files.

---

### Application settings

| Variable | Description |
|----------|-------------|
| `AppSettings__HexoraITAdmin` | Initial administrator email |
| `AppSettings__AllowRegister` | Enable/disable public registration |
| `AppSettings__AllowOrigins__0` | Allowed frontend origin (CORS) |
| `AppSettings__AllowOrigins__1` | Additional allowed origin |

Example:

```yaml
AppSettings__AllowRegister: false
AppSettings__AllowOrigins__0: http://localhost
```

---

## PostgreSQL (optional)

If you already have PostgreSQL installed, you can remove the `db` service and update the API connection string accordingly.

Default credentials:

| Setting | Value |
|---------|-------|
| Database | `HexoraITApp` |
| Username | `HexoraIT` |
| Password | `HexoraIT` |
| Port | `5432` |

---

## Adminer (optional)

Adminer is available at:

```
http://localhost:8082
```

Login using:

- Server: `db`
- Username: `HexoraIT`
- Password: `HexoraIT`
- Database: `HexoraITApp`

---

# Production

Before deploying:

- Change `Jwt__SigningKey`
- Disable registration if required
- Configure correct CORS origins
- Use HTTPS
- Use strong PostgreSQL credentials
- Mount persistent Docker volumes for:
  - PostgreSQL data
  - uploaded files (`/app/storage`)
 
---

## HTTPS and Reverse Proxy (Recommended)
If you don't want only local access and hosting.

For production deployments it is recommended to expose ITDocs through a reverse proxy instead of publishing the containers directly.

A common setup is:

```
Internet
     │
     ▼
Nginx Proxy Manager
     │
     ├── Frontend → http://frontend:80
     └── API      → http://api:8080
```

I personally recommend **Nginx Proxy Manager** because it makes the setup very simple:

- Connect your own domain to the application.
- Automatically obtain and renew Let's Encrypt SSL certificates.
- Configure HTTPS without manually editing Nginx configuration.
- Easily manage multiple applications from a web interface.

When exposing **HexoraIT** to the Internet, it is also recommended to:

- Disable public user registration:
  ```yaml
  AppSettings__AllowRegister: false
  ```
- Set `AppSettings__AllowOrigins__*` to your actual frontend domain.
- Use a strong `Jwt__SigningKey`.
- Use strong PostgreSQL credentials.
- Persist both the PostgreSQL data volume and the file storage directory.

With this setup, Nginx Proxy Manager will handle SSL termination and forward traffic to the frontend and API containers over your internal Docker network.
