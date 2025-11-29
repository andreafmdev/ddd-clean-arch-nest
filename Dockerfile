# ═══════════════════════════════════════════════════
# Multi-stage Dockerfile per NestJS
# Best practice: separa build da runtime per immagini più piccole e sicure
# ═══════════════════════════════════════════════════

# ═══════════════════════════════════════════════════
# Stage 1: Builder
# Utilizzato per compilare l'applicazione con tutte le dipendenze
# ═══════════════════════════════════════════════════
FROM node:24-alpine AS builder

# Imposta la directory di lavoro
# Best practice: usa path assoluti espliciti
WORKDIR /app

# Copia solo i file di dipendenze per sfruttare la cache di Docker
# Best practice: copia package.json prima del codice sorgente per cache layer
COPY package.json pnpm-lock.yaml* ./

# Abilita e prepara pnpm tramite corepack (incluso in Node.js 22+)
# Best practice: usa corepack invece di installare pnpm manualmente
RUN corepack enable && corepack prepare pnpm@latest --activate

# Installa tutte le dipendenze (dev + prod)
# --frozen-lockfile: garantisce che il lockfile sia rispettato
# --ignore-scripts: disabilita script npm/pnpm (evita lefthook install che richiede git)
# Best practice: in Docker non servono git hooks, quindi disabilitiamo gli script
RUN pnpm install --frozen-lockfile --ignore-scripts

# Copia il resto del codice sorgente
# Best practice: copia il codice dopo le dipendenze per ottimizzare la cache
COPY . .

# Compila l'applicazione TypeScript
# Best practice: il build avviene in un layer separato per facilitare il debug
RUN pnpm run build

# ═══════════════════════════════════════════════════
# Stage 2: Production
# Immagine finale ottimizzata con solo runtime necessario
# ═══════════════════════════════════════════════════
FROM node:24-alpine AS production

# Imposta la directory di lavoro
WORKDIR /app

# Abilita pnpm per l'installazione delle dipendenze di produzione
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copia i file di dipendenze
COPY package.json pnpm-lock.yaml* ./

# Installa SOLO le dipendenze di produzione
# --prod: installa solo dependencies, non devDependencies
# --frozen-lockfile: rispetta il lockfile
# --ignore-scripts: disabilita script (non servono in produzione)
# Best practice: questo riduce significativamente la dimensione dell'immagine finale
RUN pnpm install --prod --frozen-lockfile --ignore-scripts

# Copia i file compilati dallo stage builder
# Best practice: copia solo ciò che è necessario per il runtime
COPY --from=builder /app/dist ./dist

# Copia eventuali file generati da Prisma (se presenti)
# Il 2>/dev/null || true evita errori se la directory non esiste
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma 2>/dev/null || true

# Imposta variabili d'ambiente di produzione
# Best practice: usa ENV per variabili che non cambiano spesso
ENV NODE_ENV=production

# Espone la porta su cui l'applicazione ascolta
# Best practice: documenta sempre le porte esposte
EXPOSE 3000

# Comando di avvio dell'applicazione
# Esegue migrazioni e schema update prima di avviare l'app
# Best practice: usa array syntax per evitare problemi con shell
CMD ["sh", "-c", "pnpm run migrate:up && pnpm run start:prod"]