# 🐳 Docker Configuration Guide

> **📚 Documentazione Completa**: Questa guida fa parte della documentazione completa del progetto. Per una panoramica generale, architettura, e altre funzionalità, consulta il [README principale](./README.md).

Questa guida completa spiega la configurazione Docker del progetto e come utilizzarla per gestire diversi ambienti (development, test, quality assurance, production).

**🔗 Link Utili:**
- [README Principale](./README.md) - Panoramica completa del progetto
- [Quick Start](./README.md#quick-start) - Guida rapida all'installazione
- [Authentication](./README.md#authentication) - Configurazione autenticazione multi-provider

---

## 📋 Indice

- [Architettura](#-architettura)
- [Configurazione](#️-configurazione)
- [Ambienti e Profili](#-ambienti-e-profili)
- [Utilizzo](#-utilizzo)
- [Best Practice Implementate](#-best-practice-implementate)
- [Troubleshooting](#-troubleshooting)
- [Variabili d'Ambiente](#-variabili-dambiente)
- [Workflow Consigliato](#-workflow-consigliato)

---

## 🏗️ Architettura

### Multi-Stage Build

Il progetto utilizza un **Dockerfile multi-stage** che separa la fase di build dalla fase di runtime, seguendo le best practice Docker per ottimizzare dimensioni e sicurezza.

```
┌─────────────────────────────────────┐
│  Stage 1: Builder                   │
│  - Base: node:22-alpine             │
│  - Installa tutte le dipendenze     │
│  - Compila TypeScript               │
│  - Genera file di produzione        │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  Stage 2: Production                 │
│  - Base: node:22-alpine             │
│  - Solo dipendenze di produzione   │
│  - File compilati                   │
│  - Immagine ottimizzata (~200MB)   │
└─────────────────────────────────────┘
```

**Vantaggi:**
- ✅ Immagine finale più piccola (solo runtime necessario)
- ✅ Maggiore sicurezza (nessuna dipendenza di sviluppo)
- ✅ Build più veloce (cache layer ottimizzati)
- ✅ Separazione delle responsabilità

### Struttura File

```
.
├── Dockerfile                 # Multi-stage build configuration
├── docker-compose.yml        # Configurazione principale con profili
├── docker-compose.dev.yml    # Override per sviluppo locale
└── .env                      # Variabili d'ambiente (non committato)
```

---

## ⚙️ Configurazione

### Dockerfile

Il `Dockerfile` è strutturato in due stage distinti:

#### Stage 1: Builder

**Configurazione:**
- **Base Image**: `node:22-alpine`
- **Scopo**: Compilare l'applicazione TypeScript
- **Include**: Tutte le dipendenze (dev + prod)
- **Output**: File compilati in `/app/dist`

**Processo:**
1. Copia `package.json` e `pnpm-lock.yaml`
2. Abilita pnpm tramite corepack
3. Installa tutte le dipendenze
4. Copia codice sorgente
5. Compila TypeScript

#### Stage 2: Production

**Configurazione:**
- **Base Image**: `node:22-alpine`
- **Scopo**: Eseguire l'applicazione compilata
- **Include**: Solo dipendenze di produzione
- **Dimensione**: ~200MB (vs ~800MB con dev dependencies)

**Processo:**
1. Abilita pnpm
2. Installa solo dipendenze di produzione
3. Copia file compilati dallo stage builder
4. Imposta variabili d'ambiente
5. Espone porta 3000

**Comando di avvio:**
```bash
pnpm run schema:update && pnpm run migrate:up && pnpm run start:prod
```

Esegue automaticamente:
1. ✅ Aggiornamento schema database
2. ✅ Esecuzione migrazioni
3. ✅ Avvio applicazione

### Docker Compose

Il file `docker-compose.yml` definisce l'infrastruttura completa:

#### Servizi Database

| Servizio | Porta | Ambiente | Volume |
|----------|-------|----------|--------|
| `postgresql-dev` | 15432 | Development | `postgresql_dev_data` |
| `postgresql-test` | 25432 | Test E2E | `postgresql_test_data` |
| `postgresql-qual` | 35432 | QA | `postgresql_qual_data` |

**Caratteristiche:**
- Immagine: `postgres:16-alpine`
- Healthcheck configurato
- Restart automatico
- Volumi persistenti isolati

#### Servizi Applicazione

| Servizio | Target Build | Profilo | Uso |
|----------|--------------|---------|-----|
| `app-dev` | `builder` | `dev` | Sviluppo con hot-reload |
| `app-prod` | `production` | `prod` | Produzione ottimizzata |

**Caratteristiche:**
- Build multi-stage
- Healthcheck per readiness
- Dipendenze ordinate (`depends_on` con condition)
- Rete isolata

#### Caratteristiche Avanzate

- **Profili**: Isolamento per ambiente tramite Docker Compose Profiles
- **Healthcheck**: Verifica readiness dei servizi prima di considerarli pronti
- **Named Volumes**: Persistenza dati isolata per ogni ambiente
- **Networks**: Comunicazione isolata tra servizi tramite rete dedicata
- **Override Files**: Personalizzazioni ambiente-specifiche

---

## 🌍 Ambienti e Profili

Il progetto supporta **4 ambienti** tramite **Docker Compose Profiles**:

| Ambiente | Profilo | Database Porta | Uso | Volumi |
|----------|---------|----------------|-----|--------|
| **Development** | `dev` | 15432 | Sviluppo locale | `postgresql_dev_data` |
| **Test** | `test` | 25432 | Test end-to-end | `postgresql_test_data` |
| **Quality Assurance** | `qual` | 35432 | Pre-produzione | `postgresql_qual_data` |
| **Production** | `prod` | Variabile | Produzione | Esterno |

### Profilo `all`

Il profilo `all` permette di avviare tutti i servizi contemporaneamente. **⚠️ Attenzione**: Utile solo per test, non per uso quotidiano.

**Utilizzo:**
```bash
docker-compose --profile all up -d
```

---

## 🚀 Utilizzo

### Prerequisiti

Prima di iniziare, assicurati di avere:

1. ✅ **Docker** installato (versione 20.10+)
2. ✅ **Docker Compose** installato (versione 2.0+)
3. ✅ File `.env` configurato nella root del progetto
4. ✅ Porte disponibili: `3000`, `15432`, `25432`, `35432`

**Verifica installazione:**
```bash
docker --version
docker-compose --version
```

### Sviluppo Locale

#### 1. Solo Database

Avvia solo il database PostgreSQL per sviluppo:

```bash
docker-compose --profile dev up -d postgresql-dev
```

**Verifica che sia attivo:**
```bash
docker ps | grep postgresql-dev
```

**Output atteso:**
```
CONTAINER ID   IMAGE                STATUS         PORTS                    NAMES
xxxxxxxxxxxx   postgres:16-alpine   Up 2 minutes   0.0.0.0:15432->5432/tcp  postgresql-dev
```

**Connessione al database:**
```bash
# Con psql (se installato)
psql -h 127.0.0.1 -p 15432 -U postgres -d db-dev

# Con Docker
docker exec -it postgresql-dev psql -U postgres -d db-dev
```

#### 2. Applicazione + Database

Avvia applicazione e database insieme:

```bash
docker-compose --profile dev up -d
```

**Con override per hot-reload:**
```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml --profile dev up -d
```

Questo comando:
- ✅ Monta il codice sorgente per hot-reload
- ✅ Usa `start:dev` invece di `start:prod`
- ✅ Abilita logging verboso

**Visualizza logs:**
```bash
# Logs in tempo reale
docker-compose --profile dev logs -f app-dev

# Logs solo database
docker-compose --profile dev logs -f postgresql-dev

# Logs ultime 50 righe
docker-compose --profile dev logs --tail=50
```

#### 3. Build e Avvio

**Build immagine:**
```bash
docker-compose --profile dev build
```

**Build senza cache (forza rebuild completo):**
```bash
docker-compose --profile dev build --no-cache
```

**Avvio servizi:**
```bash
docker-compose --profile dev up -d
```

**Riavvia dopo modifiche:**
```bash
# Riavvia solo applicazione
docker-compose --profile dev restart app-dev

# Riavvia tutto
docker-compose --profile dev restart
```

**Ricostruisci e avvia:**
```bash
docker-compose --profile dev up -d --build
```

### Test E2E

**Avvia database test:**
```bash
docker-compose --profile test up -d postgresql-test
```

**Verifica:**
```bash
docker ps | grep postgresql-test
```

**Esegui test:**
```bash
# Assicurati che DATABASE_PORT=25432 nel .env.test
pnpm run test:e2e
```

**Cleanup dopo test:**
```bash
docker-compose --profile test down -v
```

### Quality Assurance

**Avvia ambiente QA completo:**
```bash
docker-compose --profile qual up -d
```

**Logs:**
```bash
docker-compose --profile qual logs -f
```

**Verifica healthcheck:**
```bash
docker-compose --profile qual ps
```

### Produzione

**Build immagine produzione:**
```bash
docker-compose --profile prod build
```

**Avvio produzione:**
```bash
docker-compose --profile prod up -d
```

**Verifica healthcheck:**
```bash
docker-compose --profile prod ps
```

**Monitoraggio:**
```bash
# Logs produzione
docker-compose --profile prod logs -f app-prod

# Statistiche container
docker stats nestjs-app-prod
```

### Comandi Utili

#### Visualizzazione

```bash
# Lista servizi attivi per profilo
docker-compose --profile dev ps

# Configurazione validata (verifica sintassi)
docker-compose --profile dev config

# Servizi disponibili per profilo
docker-compose config --services --profiles dev

# Mostra configurazione finale (dopo merge override)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml config
```

#### Gestione

```bash
# Stop servizi (mantiene volumi)
docker-compose --profile dev down

# Stop e rimuovi volumi (⚠️ cancella dati)
docker-compose --profile dev down -v

# Stop e rimuovi anche immagini
docker-compose --profile dev down -v --rmi all

# Riavvia servizio specifico
docker-compose --profile dev restart app-dev

# Pausa servizi (non distrugge container)
docker-compose --profile dev pause

# Riprendi servizi
docker-compose --profile dev unpause
```

#### Logs e Debug

```bash
# Logs in tempo reale di tutti i servizi
docker-compose --profile dev logs -f

# Logs solo applicazione
docker-compose --profile dev logs -f app-dev

# Logs ultime 100 righe
docker-compose --profile dev logs --tail=100 app-dev

# Logs con timestamp
docker-compose --profile dev logs -f -t app-dev

# Entra nel container applicazione
docker exec -it nestjs-app-dev sh

# Entra nel container database
docker exec -it postgresql-dev psql -U postgres -d db-dev

# Esegui comando nel container
docker exec -it nestjs-app-dev pnpm run schema:update
```

#### Pulizia

```bash
# Rimuovi container fermati
docker-compose --profile dev down

# Rimuovi volumi non utilizzati
docker volume prune

# Rimuovi immagini non utilizzate
docker image prune

# Pulizia completa (⚠️ attenzione)
docker system prune -a --volumes
```

---

## ✅ Best Practice Implementate

### 1. Multi-Stage Build

- ✅ **Separazione build/runtime**: Immagine finale contiene solo runtime
- ✅ **Immagine ottimizzata**: Riduzione dimensioni del 60-70%
- ✅ **Cache layer efficienti**: Build più veloci grazie a layer caching
- ✅ **Sicurezza**: Nessuna dipendenza di sviluppo in produzione

### 2. Immagini Minimali

- ✅ **Base image `alpine`**: Riduce dimensione base da ~900MB a ~50MB
- ✅ **Solo dipendenze necessarie**: `--prod` installa solo `dependencies`
- ✅ **Rimozione strumenti build**: Nessun compilatore TypeScript in produzione
- ✅ **Layer ottimizzati**: Ordine COPY ottimizzato per cache

### 3. Sicurezza

- ✅ **Nessuna dipendenza dev in produzione**: Riduce superficie di attacco
- ✅ **Variabili d'ambiente**: Configurazioni sensibili non hardcoded
- ✅ **Healthcheck**: Verifica readiness prima di considerare servizio pronto
- ✅ **Non-root user**: Possibilità di configurare utente non privilegiato
- ✅ **Immagine base aggiornata**: Uso di tag specifici invece di `latest`

### 4. Isolamento

- ✅ **Profili**: Separazione completa tra ambienti
- ✅ **Volumi isolati**: Database separati per ogni ambiente
- ✅ **Reti dedicate**: Comunicazione isolata tra servizi
- ✅ **Container naming**: Nomi espliciti per identificazione

### 5. Manutenibilità

- ✅ **Commenti esplicativi**: Codice ben documentato
- ✅ **Configurazione centralizzata**: Un solo punto di configurazione
- ✅ **Override file**: Personalizzazioni senza modificare file principale
- ✅ **Versioning**: Uso di version specifiche per riproducibilità

### 6. Performance

- ✅ **Cache layer ottimizzati**: Ordine COPY per massimizzare cache hit
- ✅ **Named volumes**: Persistenza dati efficiente
- ✅ **Healthcheck**: Startup ordinato con `depends_on` condition
- ✅ **Restart policy**: `unless-stopped` per alta disponibilità

### 7. Monitoring

- ✅ **Healthcheck configurato**: Verifica automatica stato servizi
- ✅ **Logging strutturato**: Logs accessibili via Docker
- ✅ **Statistiche**: `docker stats` per monitoraggio risorse

---

## 🔧 Troubleshooting

### Problema: Porta già in uso

**Errore:**
```
Error: bind: address already in use
Error: port is already allocated
```

**Diagnosi:**
```bash
# Windows PowerShell
Get-NetTCPConnection -LocalPort 15432

# Linux/Mac
lsof -i :15432
netstat -tulpn | grep 15432
```

**Soluzione:**
```bash
# Ferma il servizio Docker
docker-compose --profile dev down

# Oppure cambia porta nel docker-compose.yml
ports:
  - "16432:5432"  # Cambia porta host
```

### Problema: Database non raggiungibile

**Errore:**
```
Error: connect ECONNREFUSED 127.0.0.1:15432
Error: getaddrinfo ENOTFOUND postgresql-dev
```

**Diagnosi:**
```bash
# Verifica che il container sia attivo
docker ps | grep postgresql-dev

# Verifica healthcheck
docker inspect postgresql-dev | grep -A 10 Health

# Verifica logs
docker-compose --profile dev logs postgresql-dev
```

**Soluzione:**
```bash
# Se non è attivo, avvialo
docker-compose --profile dev up -d postgresql-dev

# Attendi che sia healthy
docker-compose --profile dev ps

# Verifica connessione
docker exec -it postgresql-dev pg_isready -U postgres
```

### Problema: Immagine non si aggiorna

**Errore:** Modifiche al codice non si riflettono nel container

**Diagnosi:**
```bash
# Verifica che i volumi siano montati
docker inspect nestjs-app-dev | grep -A 20 Mounts
```

**Soluzione:**
```bash
# Ricostruisci senza cache
docker-compose --profile dev build --no-cache

# Riavvia con rebuild
docker-compose --profile dev up -d --build

# Se usi volumi, verifica che siano montati correttamente
docker-compose -f docker-compose.yml -f docker-compose.dev.yml --profile dev up -d
```

### Problema: Volumi non si montano

**Errore:** Hot-reload non funziona in sviluppo

**Diagnosi:**
```bash
# Verifica volumi montati
docker inspect nestjs-app-dev | grep -A 20 Mounts

# Verifica che docker-compose.dev.yml sia usato
docker-compose -f docker-compose.yml -f docker-compose.dev.yml config
```

**Soluzione:**
```bash
# Usa esplicitamente i file di override
docker-compose -f docker-compose.yml -f docker-compose.dev.yml --profile dev up -d

# Verifica permessi file (Linux/Mac)
ls -la src/

# Su Windows, verifica che Docker Desktop abbia accesso al drive
```

### Problema: Migrazioni non eseguite

**Errore:** Schema database non aggiornato o migrazioni mancanti

**Diagnosi:**
```bash
# Verifica logs container
docker-compose --profile prod logs app-prod | grep -i migration

# Controlla se migrazioni sono state eseguite
docker exec -it nestjs-app-prod sh
cd /app
pnpm run migrate:up
```

**Soluzione:**
```bash
# Esegui manualmente nel container
docker exec -it nestjs-app-prod sh
pnpm run schema:update
pnpm run migrate:up

# Oppure riavvia il container (esegue automaticamente)
docker-compose --profile prod restart app-prod
```

### Problema: Healthcheck fallisce

**Errore:**
```
Health check failed
Unhealthy container
```

**Diagnosi:**
```bash
# Verifica che l'applicazione risponda
curl http://localhost:3000/api/v1/health

# Controlla logs per errori
docker-compose --profile prod logs app-prod

# Verifica healthcheck configurato
docker inspect nestjs-app-prod | grep -A 15 Health
```

**Soluzione:**
```bash
# Aumenta start_period se l'app impiega più tempo
# Modifica docker-compose.yml:
healthcheck:
  start_period: 60s  # Aumenta da 40s

# Verifica che l'endpoint /health esista
docker exec -it nestjs-app-prod wget -O- http://localhost:3000/api/v1/health
```

### Problema: Out of Memory

**Errore:**
```
Container killed (out of memory)
```

**Soluzione:**
```bash
# Aumenta memoria Docker Desktop
# Settings > Resources > Memory > Aumenta a 4GB+

# Oppure limita memoria container
# Aggiungi in docker-compose.yml:
deploy:
  resources:
    limits:
      memory: 1G
```

### Problema: Build lento

**Diagnosi:**
```bash
# Verifica cache Docker
docker system df

# Verifica layer cache
docker history nestjs-app-dev
```

**Soluzione:**
```bash
# Pulisci cache vecchia
docker builder prune

# Usa BuildKit per build più veloci
DOCKER_BUILDKIT=1 docker-compose --profile dev build

# Verifica che .dockerignore escluda file non necessari
```

---

## 📝 Variabili d'Ambiente

### File `.env` Richiesto

Crea un file `.env` nella root del progetto con le seguenti variabili:

```env
# ═══════════════════════════════════════════════════
# DATABASE CONFIGURATION
# ═══════════════════════════════════════════════════
DATABASE_HOST=127.0.0.1
DATABASE_PORT=15432
DATABASE_NAME=db-dev
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres

# ═══════════════════════════════════════════════════
# AUTH PROVIDER
# ═══════════════════════════════════════════════════
AUTH_PROVIDER=keycloak

# ═══════════════════════════════════════════════════
# KEYCLOAK CONFIGURATION
# ═══════════════════════════════════════════════════
KEYCLOAK_AUTH_SERVER_URL=https://your-keycloak-instance.com
KEYCLOAK_REALM=your-realm
KEYCLOAK_CLIENT_ID=your-client-id
KEYCLOAK_CLIENT_SECRET=your-client-secret

# ═══════════════════════════════════════════════════
# SUPABASE CONFIGURATION (se AUTH_PROVIDER=supabase)
# ═══════════════════════════════════════════════════
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_JWT_SECRET=your-jwt-secret

# ═══════════════════════════════════════════════════
# APPLICATION
# ═══════════════════════════════════════════════════
PORT=3000
NODE_ENV=development
```

### Variabili per Ambiente

| Ambiente | DATABASE_PORT | DATABASE_NAME | DATABASE_HOST | NODE_ENV |
|----------|---------------|---------------|---------------|----------|
| **dev** | 15432 | db-dev | postgresql-dev | development |
| **test** | 25432 | db-test-e2e | postgresql-test | test |
| **qual** | 35432 | db-qual | postgresql-qual | production |
| **prod** | Variabile | Variabile | Variabile | production |

**Nota:** In produzione, usa variabili d'ambiente del sistema o un secret manager (es. AWS Secrets Manager, HashiCorp Vault).

### File `.env.example`

Crea un file `.env.example` nel repository come template:

```env
# Copia questo file come .env e compila i valori
DATABASE_HOST=127.0.0.1
DATABASE_PORT=15432
DATABASE_NAME=db-dev
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
AUTH_PROVIDER=keycloak
KEYCLOAK_AUTH_SERVER_URL=
KEYCLOAK_REALM=
KEYCLOAK_CLIENT_ID=
KEYCLOAK_CLIENT_SECRET=
PORT=3000
NODE_ENV=development
```

---

## 🔄 Workflow Consigliato

### Sviluppo Quotidiano

**Scenario:** Sviluppo locale con database containerizzato

```bash
# 1. Avvia solo database
docker-compose --profile dev up -d postgresql-dev

# 2. Sviluppa localmente (app fuori da Docker per hot-reload più veloce)
pnpm run start:dev

# 3. Test con database containerizzato
pnpm run test:e2e
```

**Vantaggi:**
- ✅ Hot-reload più veloce (no overhead Docker)
- ✅ Database isolato e pulito
- ✅ Facile reset database

### Test Completo

**Scenario:** Test end-to-end con tutto containerizzato

```bash
# 1. Build e avvio ambiente test
docker-compose --profile test build
docker-compose --profile test up -d

# 2. Attendi che servizi siano pronti
docker-compose --profile test ps

# 3. Esegui test
pnpm run test:e2e

# 4. Verifica risultati
docker-compose --profile test logs app-test

# 5. Cleanup
docker-compose --profile test down -v
```

### Quality Assurance

**Scenario:** Deploy in ambiente QA

```bash
# 1. Build immagine QA
docker-compose --profile qual build

# 2. Avvia ambiente QA
docker-compose --profile qual up -d

# 3. Verifica healthcheck
docker-compose --profile qual ps

# 4. Monitora logs
docker-compose --profile qual logs -f

# 5. Test manuali su http://localhost:3000
```

### Deploy Produzione

**Scenario:** Deploy in produzione

```bash
# 1. Build immagine produzione
docker-compose --profile prod build

# 2. Tag per registry
docker tag nestjs-app-prod:latest your-registry/nestjs-app:latest
docker tag nestjs-app-prod:latest your-registry/nestjs-app:v1.0.0

# 3. Push a registry
docker push your-registry/nestjs-app:latest
docker push your-registry/nestjs-app:v1.0.0

# 4. Deploy (esempio con docker-compose su server)
# Copia docker-compose.yml e .env.prod sul server
docker-compose --profile prod pull
docker-compose --profile prod up -d

# 5. Verifica deploy
docker-compose --profile prod ps
curl http://your-server:3000/api/v1/health
```

### CI/CD Integration

**Esempio GitHub Actions:**

```yaml
name: Build and Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build and test
        run: |
          docker-compose --profile test build
          docker-compose --profile test up -d
          pnpm run test:e2e
        env:
          DATABASE_PORT: 25432
      - name: Cleanup
        if: always()
        run: docker-compose --profile test down -v
```

---

## 📚 Risorse Aggiuntive

### Documentazione Ufficiale

- [Docker Best Practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
- [Docker Compose Profiles](https://docs.docker.com/compose/profiles/)
- [Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)
- [Healthcheck](https://docs.docker.com/compose/compose-file/compose-file-v3/#healthcheck)
- [Docker Compose Override](https://docs.docker.com/compose/extends/)

### Comandi Docker Utili

```bash
# Informazioni sistema
docker system df                    # Uso disco
docker system info                  # Info sistema
docker version                      # Versioni Docker

# Gestione immagini
docker images                       # Lista immagini
docker rmi <image>                  # Rimuovi immagine
docker image prune                  # Pulisci immagini non usate

# Gestione container
docker ps                           # Container attivi
docker ps -a                        # Tutti i container
docker rm <container>               # Rimuovi container

# Gestione volumi
docker volume ls                    # Lista volumi
docker volume inspect <volume>      # Info volume
docker volume rm <volume>           # Rimuovi volume
```

---

## 🆘 Supporto

Per problemi o domande:

1. ✅ Verifica la sezione [Troubleshooting](#-troubleshooting)
2. ✅ Controlla i logs: `docker-compose --profile dev logs`
3. ✅ Consulta la documentazione Docker ufficiale
4. ✅ Verifica che tutte le porte siano disponibili
5. ✅ Assicurati che il file `.env` sia configurato correttamente

---

## 🔗 Riferimenti

- [README Principale](./README.md) - Documentazione completa del progetto
- [Authentication Guide](./README.md#authentication) - Guida all'autenticazione multi-provider
- [Environment Variables](./README.md#environment-variables) - Configurazione variabili d'ambiente
- [Docker Best Practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/) - Documentazione ufficiale Docker

---

**Ultimo aggiornamento**: 2025-01-27  
**Versione Docker Compose**: 3.8  
**Versione Docker**: 20.10+  
**Progetto**: [DDD-Clean-Arch-Nest](https://github.com/andreafmdev/ddd-clean-arch-nest)