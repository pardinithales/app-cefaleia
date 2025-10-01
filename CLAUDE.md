# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Interactive headache (cefaleia) questionnaire form for medical data collection, built with vanilla JavaScript, Express.js backend, and SQLite database. The application features automatic draft saving, report generation, and integrated medical scales (MIDAS and GAD-7).

**Production URL**: https://minhador.tpfbrain.com
**Repository**: https://github.com/pardinithales/app-cefaleia.git

## Development Commands

```bash
# Install dependencies
npm install

# Start server (development)
npm start
# Server runs on http://localhost:3000
# Dashboard available at http://localhost:3000/dashboard

# Start with auto-reload (if using nodemon)
npm run dev
```

## Deployment

### Docker Deployment (Production)
The application is deployed using Docker with Traefik reverse proxy:

```bash
# Deploy to production server
./deploy.sh

# Manual Docker commands
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# View logs
docker-compose logs -f

# Check container status
docker-compose ps
```

**Important**: The application connects to an external Docker network `louis-final_louis_net` with Traefik handling SSL certificates and routing.

## Architecture

### File Structure
- **index.html**: Main interactive form with 10 medical sections
- **dashboard.html**: Admin dashboard for viewing submitted responses and statistics
- **script.js**: Frontend logic with dynamic validations and medical scale calculations
- **styles.css**: Responsive styling for form, dashboard, and medical scales
- **server.js**: Express REST API server
- **database.js**: SQLite database configuration and schema
- **cefaleia.db**: SQLite database file (auto-created, stored in `/app/data` in Docker)

### Backend Architecture

**Database Schema** (database.js:20-29):
```sql
CREATE TABLE respostas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data_preenchimento DATETIME DEFAULT CURRENT_TIMESTAMP,
    dados_completos TEXT NOT NULL,  -- Full JSON of form data
    idade_inicio TEXT,
    crises_mes TEXT,
    dias_livre TEXT,
    intensidade_maxima TEXT
)
```

**API Endpoints** (server.js):
- `GET /` - Main form page
- `GET /dashboard` - Admin dashboard
- `POST /api/respostas` - Save form submission
- `GET /api/respostas` - List all responses
- `GET /api/respostas/:id` - Get specific response with full JSON data
- `DELETE /api/respostas/:id` - Delete response
- `GET /api/estatisticas` - Calculate aggregate statistics

### Frontend Architecture

**Form Sections** (10 sections in index.html):
1. Basic patient information and crisis frequency
2. Warning signs and aura symptoms (with dynamic sub-questions)
3. Pain location and duration without medication
4. Headache characteristics
5. Onset patterns
6. Associated symptoms (photophobia, nausea, etc.)
7. Behavior during crisis
8. Post-crisis symptoms
9. Trigger factors
10. Life impact assessment with MIDAS and GAD-7 scales

**Key JavaScript Features** (script.js):
- `configurarNumeroExatoExclusivo()`: Mutual exclusivity between exact numbers and checkbox options
- `configurarAuraSubPerguntas()`: Dynamic sub-questions that appear when aura is selected
- `configurarPoscriseExclusivo()`: Exclusive handling of post-crisis symptoms
- `configurarCalculoMIDAS()`: Automatic MIDAS scale calculation (Grades I-IV)
- `configurarCalculoGAD7()`: Automatic GAD-7 anxiety scale calculation
- `salvarRascunho()` / `carregarRascunho()`: Auto-save draft to localStorage
- `gerarRelatorio()`: Generate formatted report from form data

### Critical Validation Logic

The form implements several intelligent validation patterns:
- **Exact number vs. checkboxes**: When user enters an exact number, related checkboxes are disabled automatically
- **Mutually exclusive options**: "None" options disable other symptoms in the same section
- **Conditional fields**: Aura sub-questions only appear when aura is selected
- **Medical scale auto-calculation**: MIDAS and GAD-7 scores calculated in real-time with clinical interpretation

### Docker Configuration

**Environment Variables**:
- `NODE_ENV=production` - Switches database path to `/app/data/cefaleia.db`
- `PORT=3000` - Server port

**Volumes**:
- `cefaleia-data:/app/data` - Persistent storage for SQLite database

**Traefik Labels**: Configured for automatic HTTPS with Let's Encrypt on domain `minhador.tpfbrain.com`

## Important Notes

- The form uses **localStorage** for draft auto-save on the client side
- Full form data is stored as JSON in the `dados_completos` column
- Some fields are extracted for quick querying (idade_inicio, crises_mes, etc.)
- The production database path changes based on `NODE_ENV` environment variable (database.js:5-7)
- CSS includes special styling for medical scales (MIDAS grid, GAD-7 grid) with mobile responsiveness
- The application expects to run behind Traefik proxy in production with external network `louis-final_louis_net`

## Medical Scales

**MIDAS (Migraine Disability Assessment)**:
- 5 questions about impact over last 3 months
- Automatic scoring with Grade I-IV interpretation
- Score ranges: Grade I (0-5), II (6-10), III (11-20), IV (21+)

**GAD-7 (Generalized Anxiety Disorder)**:
- 7 questions about anxiety over last 2 weeks
- 4-point scale (0-3) with automatic calculation
- Levels: minimal (0-4), mild (5-9), moderate (10-14), severe (15-21)
