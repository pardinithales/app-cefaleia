# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Interactive headache (cefaleia) questionnaire form for medical data collection, built with vanilla JavaScript, Express.js backend, and SQLite database. The application features automatic draft saving, report generation, and integrated medical scales (MIDAS and GAD-7).

**Production URL**: https://minhador.tpfbrain.com
**Repository**: https://github.com/pardinithales/app-cefaleia.git

## ⚠️ CRITICAL: VPS Environment

**This application runs on a VPS (Virtual Private Server), NOT a local development machine.**

- **NO LOCAL TESTING**: Do not assume `http://localhost:3000` is accessible. The server is production-only.
- **Testing happens in production**: After making changes, you MUST deploy to Docker to test.
- **Shared infrastructure**: This VPS also hosts the "Louis" application on the same Docker network.

## Development Workflow (VPS-specific)

```bash
# 1. Install dependencies (if needed)
npm install

# 2. Make code changes to files (index.html, script.js, etc.)

# 3. Test changes by deploying to Docker (see Deployment section below)
# DO NOT run `npm start` for testing - this is a production VPS
```

## Deployment (Production on VPS)

### 🚨 CRITICAL: Safe Deployment Process

**This application shares the Docker network `louis-final_louis_net` with the Louis application. Follow these steps carefully to avoid disrupting Louis:**

```bash
# SAFE deployment process (does NOT affect Louis):

# 1. Stop ONLY the cefaleia container
docker-compose down

# 2. Rebuild ONLY the cefaleia image
docker-compose build --no-cache

# 3. Start ONLY the cefaleia container
docker-compose up -d

# 4. Verify cefaleia is running
docker-compose ps

# 5. Check logs for errors
docker-compose logs -f app-cefaleia

# 6. Test the application at https://minhador.tpfbrain.com
```

### Alternative: Use deploy script
```bash
# The deploy.sh script automates the above process
./deploy.sh
```

### Docker Network Configuration

**CRITICAL**: The `docker-compose.yml` uses an **external network** `louis-final_louis_net`:
```yaml
networks:
  louis-final_louis_net:
    external: true  # This network is SHARED with Louis app
```

**What this means**:
- Running `docker-compose down` will ONLY stop the cefaleia container
- Running `docker-compose up -d` will ONLY start the cefaleia container
- The Louis application is on the same network but in a separate docker-compose project
- Traefik (reverse proxy) is also on this network and manages routing for BOTH apps

**DO NOT**:
- ❌ Run `docker network rm louis-final_louis_net` (this will break Louis)
- ❌ Modify the network configuration without checking Louis first
- ❌ Run Docker commands that affect all containers on the network

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

## Testing Changes (VPS Environment)

Since this is a VPS with no local testing environment, follow this workflow:

1. **Make code changes** to files (index.html, script.js, styles.css, etc.)
2. **Commit changes** to git (optional but recommended)
3. **Deploy to Docker** using the safe deployment process above
4. **Test in browser** at https://minhador.tpfbrain.com
5. **Check logs** if something goes wrong: `docker-compose logs -f app-cefaleia`
6. **Rollback if needed**: `git checkout HEAD~1 <file>` then redeploy

### Dashboard Access
- **URL**: https://minhador.tpfbrain.com/dashboard
- **Password**: `tpb801` (stored in dashboard.html:361 and script.js:366)

### Quick Verification Commands
```bash
# Check if container is running
docker-compose ps

# View live logs
docker-compose logs -f app-cefaleia

# Check database file exists
docker-compose exec app-cefaleia ls -lh /app/data/

# Restart without rebuilding (for server.js changes only)
docker-compose restart app-cefaleia
```

## Important Notes

- **VPS-ONLY**: No localhost testing available. All testing happens in production Docker.
- **Shared Network**: Louis app is on the same Docker network. Be careful with network changes.
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

---

## 📌 CHECKPOINT: Implementações - 01/Out/2025

### Problema 1: Tela em Branco após "Gerar Relatório" ❌ → ✅

**Sintoma**: Ao clicar em "Gerar Relatório", a página ficava completamente em branco.

**Causa Raiz**:
- O código estava escondendo `formElement.parentElement` (o `<div class="container">`)
- Este container contém TANTO o formulário quanto a área de relatório
- Resultado: tudo ficava invisível

**Solução Implementada** (script.js):
```javascript
// ANTES (errado):
formElement.parentElement.style.cssText = 'display: none !important;';

// DEPOIS (correto):
formElement.style.cssText = 'display: none !important;';
```

**Arquivos Modificados**:
- `script.js` - 3 funções corrigidas:
  - `verificarPaginaResultado()` linha 458
  - `voltarFormulario()` linha 501
  - `popstate` handler linha 42

**Commit**: `9518cf7` - "Corrige tela em branco após gerar relatório"

---

### Problema 2: Notificação por Email Ausente ❌ → ✅

**Requisito**: Receber email automático ao receber novo questionário preenchido.

**Implementação**:

1. **Instalação do Nodemailer**:
   ```bash
   npm install nodemailer
   ```

2. **Configuração SMTP Gmail** (server.js:11-23):
   ```javascript
   const transporter = nodemailer.createTransport({
       host: 'smtp.gmail.com',
       port: 587,
       secure: false,
       auth: {
           user: 'drthalesneuro@gmail.com',
           pass: 'pqblucaigxdvcugk'  // App password (16 chars, sem espaços)
       },
       tls: {
           rejectUnauthorized: false
       }
   });
   ```

3. **Função de Formatação** (server.js:26-123):
   - `formatarDadosParaEmail(dados, id)`: Gera HTML formatado
   - Inclui: dados principais, aura, localização, MIDAS, GAD-7
   - Link direto para dashboard com senha

4. **Envio Automático** (server.js:172-193):
   - Email enviado após salvar no banco (callback do `db.run`)
   - Não bloqueia a resposta ao usuário se email falhar
   - Logs detalhados de sucesso/erro

**Formato do Email**:
- Assunto: `📋 Novo Questionário de Cefaleia #[ID]`
- Destinatário: `drthalesneuro@gmail.com`
- Conteúdo HTML com seções organizadas e styled
- Footer com link para dashboard e senha

**Commits**:
- `99c11ed` - "Implementa notificação por email"
- `90cfe7b` - "Corrige senha de app Gmail (remove espaços)"
- `e28af58` - "Adiciona logs detalhados de erro e sucesso"
- `dc1374e` - "Configura SMTP direto ao invés de service gmail"

**Nota Importante - Configuração SMTP**:
- ❌ `service: 'gmail'` → NÃO funciona no Docker/VPS
- ✅ Configuração direta com `host`, `port`, `tls` → FUNCIONA

---

### Testes Realizados

**Teste #10** (dados mínimos):
- ✅ Salvou no banco
- ✅ Email enviado com sucesso
- ✅ Message ID: `c3ac59db-1f7a-5492-af88-b30876a057db@gmail.com`

**Teste #11** (dados completos):
- ✅ Todos os campos preenchidos (aura, MIDAS, GAD-7, gatilhos)
- ✅ Email formatado com todas as seções
- ✅ Recebido em `drthalesneuro@gmail.com`

---

### Deploy Seguro Realizado

**Processo seguido** (sem afetar Louis):
```bash
# 1. Stop APENAS app-cefaleia
docker-compose down
# Output: "Network louis-final_louis_net is external, skipping" ✅

# 2. Rebuild
docker-compose build --no-cache

# 3. Start
docker-compose up -d

# 4. Verificar
docker-compose ps  # app-cefaleia: Up (healthy)
docker ps | grep louis  # Louis containers: Up 9 days ✅
```

**Verificações Pós-Deploy**:
- ✅ App Cefaleia: Funcionando (HTTP/2 200)
- ✅ Louis Frontend: Running (Up 9 days)
- ✅ Louis Backend: Running (Up 9 days)
- ✅ Traefik: Running (Up 9 days)
- ✅ Certificados SSL: Válidos

---

### Configuração de Email - Referência Rápida

**Credenciais Gmail**:
- Email: `drthalesneuro@gmail.com`
- App Password: `pqbl ucai gxdv cugk` (com espaços para leitura)
- App Password (código): `pqblucaigxdvcugk` (16 chars sem espaços - usar no código)

**Como gerar nova app password** (se necessário):
1. Google Account → Security → 2-Step Verification
2. App passwords → Select app: Mail → Select device: Other
3. Nome: "App Cefaleia VPS" → Generate
4. Copiar senha de 16 caracteres (remover espaços no código)

**Testar envio de email**:
```bash
# Via curl (do host VPS):
curl -X POST https://minhador.tpfbrain.com/api/respostas \
  -H "Content-Type: application/json" \
  -d '{"idadeInicio":"20_30","crisesMesExato":"5","intensidadeMaxima":"7"}'

# Verificar logs:
docker logs app-cefaleia --tail=30 | grep -E "Email|enviado|erro"
```

---

### Próximas Manutenções

**Se email parar de funcionar**:
1. Verificar se app password ainda é válido (Google pode revogar)
2. Verificar logs: `docker logs app-cefaleia | grep -i email`
3. Testar conexão SMTP: `docker exec app-cefaleia nc -zv smtp.gmail.com 587`
4. Regenerar app password se necessário

**Se precisar mudar email destino**:
- Modificar `server.js` linha 177: `to: 'novo@email.com'`
- Rebuild e redeploy

**Backup da configuração atual** (01/Out/2025):
- Email funciona com SMTP direto (host/port/tls)
- App password: válido e testado
- Todos os testes (#10, #11) bem-sucedidos
