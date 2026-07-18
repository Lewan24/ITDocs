# Docker Compose

The easiest way to run ITDocs is using Docker Compose.

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
| `ITDOCS_API_BASE_URL` | URL of the backend API (for example `http://localhost:8081/api`) |

Example:

```yaml
environment:
  ITDOCS_API_BASE_URL: http://localhost:8081/api
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
Database=ITDocsApp;
Username=itdocs;
Password=itdocs;
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
| `AppSettings__ITDocsAdmin` | Initial administrator email |
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
| Database | `ITDocsApp` |
| Username | `itdocs` |
| Password | `itdocs` |
| Port | `5432` |

---

## Adminer (optional)

Adminer is available at:

```
http://localhost:8082
```

Login using:

- Server: `db`
- Username: `itdocs`
- Password: `itdocs`
- Database: `ITDocsApp`

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
