# Repository Guidelines

## Project Structure & Module Organization
- `index.html`, `styles.css` e `script.js` sustentam o formulário; ids/classes usados em `script.js` funcionam como API pública.
- `dashboard.html` consome os endpoints REST expostos em `server.js`; mantenha o formato das respostas ao ajustar o dashboard.
- `server.js` orquestra rotas Express com `database.js`, que alterna o caminho do SQLite entre execuções locais e Docker.
- As configs de deploy assumem Traefik em `minhador.tpfbrain.com`; mantenha labels e redes alinhadas com a infraestrutura vigente.
- Não versione dados reais de pacientes — remova ou recrie `cefaleia.db` antes de qualquer commit.

## Local Environment & Git Workflow
- Ambiente padrão: Windows 11 + PowerShell; execute comandos como escritos e invoque scripts com `./script.ps1`.
- Sincronize com `https://github.com/pardinithales/app-cefaleia`; crie branches (`git checkout -b feat/nova-validacao`) e rebase antes dos PRs.
- Consulte `git status` antes de cada commit para evitar artefatos; versione apenas código-fonte e configs essenciais.

## Build, Test, and Development Commands
- `npm install` garante Express, sqlite3, cors e body-parser.
- `npm start` serve API + assets em `http://localhost:3000`, criando `cefaleia.db` se necessário.
- `npm run dev` inicia nodemon; reinicie após ajustes de schema ou env.
- `docker compose up --build` replica o stack da VPS; finalize com `docker compose down`.

## Coding Style & Naming Conventions
- Indente com 4 espaços, use `const`/`let`, ponto e vírgula e retornos antecipados; mantenha logs acionáveis.
- Helpers do front seguem camelCase em português; classes CSS permanecem em kebab-case.
- Agrupe lógica DOM em funções focadas e mantenha utilitários do backend junto às rotas.

## Testing Guidelines
- Ainda não há suíte automatizada; ao inserir lógica crítica, adicione testes Jest + Supertest em `tests/` usando `NODE_ENV=test`.
- Relate verificações manuais de envio, auto-save e dashboard nos PRs enquanto a automação não chega.

## Commit & Pull Request Guidelines
- Espelhe o histórico: mensagens curtas, imperativas e em português (`Atualiza dominio...`), uma mudança por commit.
- PRs devem explicar motivação, sinalizar alterações em banco/variáveis, listar checagens executadas e anexar evidências visuais quando houver impacto em UI.
- Referencie issues disponíveis e registre tarefas de follow-up para facilitar continuidade por outros agentes.

## Deployment & VPS Notes
- Deploys vão para a VPS Ubuntu 24.04 descrita em `informacoes_sobre_a_VPS.md`; nunca altere o stack LouiS nem o proxy `traefik-louis` sem autorização explícita.
- Na VPS, mantenha o fluxo Git (`git pull`, `docker compose up -d --build`) garantindo certificados Traefik e redes compartilhadas intactas.
