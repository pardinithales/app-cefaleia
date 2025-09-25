O usuário usa como padrão WINDOWS 11, portanto POWER SHELL.
O app está GITADO em https://github.com/pardinithales/app-cefaleia 

Assim, tudo o que você fizer você faz GIT AI!

O app é enviado para a minha VPS, que está detalhada neste arquivo ('informacoes_sobre_a_vps.md').



## Fluxo de Deploy via Git

1. **Máquina local (Windows 11 + PowerShell):** Trabalhe em branches dedicadas, teste com `npm start` ou `docker compose up`, e confirme o estado com `git status` antes de commitar.
2. **Envio para o GitHub:** Faça `git push` para `https://github.com/pardinithales/app-cefaleia` (branch main ou feature) e abra PRs quando necessário.
3. **Acesso à VPS:** Conecte via SSH ao host descrito abaixo e navegue até `/root/app-cefaleia`.
4. **Deploy:** Execute `git pull` para trazer as alterações e, em seguida, `docker compose up -d --build` para recriar a aplicação com as novas dependências/código.
5. **Validação:** Verifique logs com `docker logs -f app-cefaleia` e o estado geral com `docker ps` e `curl -I https://minhador.tpfbrain.com`.
6. **Rollback rápido:** Se necessário, faça `git reset --hard <commit-anterior>` seguido de `docker compose up -d --build` para retornar à versão estável.


⚠️ **Proteja o LouiS:** Não pare, remova ou recrie serviços em `/root/louis-final` nem o proxy `traefik-louis` sem alinhamento prévio; eles mantêm o aplicativo LouiS e demais domínios online.


## Estrutura Geral da VPS

A VPS roda Ubuntu 24.04.2 LTS (kernel 6.8.0-55-generic) em um servidor x86_64, hospedado na Hetzner (mirror.hetzner.com). O IP público é 138.199.224.191 (IPv4) e 2a01:4f8:c013:b2b7::1 (IPv6). O diretório raiz de trabalho é `/root/`, com 149.92 GB de disco (29.3% usado), 26% de memória em uso e swap 0%. O UFW está inativo, e o firewall é gerenciado pelo Docker (iptables com regras para portas 80/443/8080).

### Diretórios Principais no `/root/`
- **app-cefaleia**: App Node.js para questionário de cefaleia (porta interna 3000). Usa docker-compose.yml com build local, volume `cefaleia-data` para SQLite, rede externa `louis-final_louis_net`, labels Traefik para roteamento em `minhador.tpfbrain.com` (routers `app-cefaleia-http` e `app-cefaleia-secure`, service `app-cefaleia` na porta 3000, middleware `redirect-to-https` e `cefaleia-headers` para segurança).
- **gerador_provas**: App para geração de provas (frontend na porta 80, backend na 8000). Volumes e redes não detalhados na sessão, mas integra com Traefik via labels (domínio `geraprovas.tpfbrain.com`).
- **louis-final**: App principal LouiS (frontend Nginx na porta 80, backend Python/FastAPI na 8000). Usa docker-compose.yml com Traefik v2.10 embutido (container `traefik-louis`), volume `letsencrypt_data` para acme.json, rede `louis_net` (bridge, nome completo `louis-final_louis_net`), labels para `louis.tpfbrain.com` (frontend) e `app-louis.tpfbrain.com` (backend). Comando Traefik inclui ACME com email `pardinithales@gmail.com`, storage `/letsencrypt/acme.json`, TLS challenge, redirecionamento HTTP->HTTPS.
- **nginx**: Diretório vazio ou reserva para configs Nginx standalone (não usado atualmente).
- **traefik**: Traefik global separado (v3.0, container não ativo na sessão recente), docker-compose.yml com entrypoints web/websecure, ACME HTTP challenge, volume `traefik-letsencrypt`, rede `traefik-network` (não usada para Louis/cefaleia). Não integra com apps atuais.

Outros arquivos soltos:
- `acme.json.backup-2025-09-21-223654`: Backup do acme.json antigo (staging).
- Arquivos de script: `backup_certificados.sh`, `verificar_certificados.sh`, `deploy_optimizado.sh` em `/root/louis-final`.

### Arquivos do Banco de Dados

Os arquivos do banco de dados SQLite estão localizados exclusivamente no diretório do projeto principal, com volumes Docker para persistência e montagem no container backend. Exclui-se o `test_database.db` (arquivo de teste não utilizado em produção).

- **database.db**: Localizado em `/root/louis-final/database.db`. Este é o banco de dados principal do app LouiS, contendo tabelas como `validation_cases` (casos de validação), `validation_submissions` (submissões de respostas dos usuários), `sus_responses` (respostas SUS) e `user_submissions` (submissões gerais). Tamanho aproximado: 53 KB (após população). Montado como volume no container `louis-backend-prod` via `./database.db:/app/database.db` no `docker-compose.yml`, permitindo acesso direto no host para queries (ex: `sqlite3 /root/louis-final/database.db`).

Nenhum outro arquivo de banco de dados é utilizado em produção. Backups podem ser gerados manualmente (ex: `cp database.db database_backup_$(date +%Y-%m-%d).db`).

### Redes Docker
- `louis-final_louis_net` (bridge, ID 6145481ae72d): Rede principal para Traefik Louis e apps integradas (app-cefaleia conectada via external: true).
- `traefik-network` (bridge, ID c78bce6a2ac5): Rede para Traefik global (não usada).
- `web` (bridge, ID 35a357d35934): Rede genérica (não usada).
- Default: bridge, host, none.

### Volumes Docker
- `louis-final_letsencrypt_data`: Para acme.json do Traefik Louis (localizado em `/var/lib/docker/volumes/louis-final_letsencrypt_data/_data`).
- `cefaleia-data`: Para dados SQLite da app-cefaleia.
- `traefik_traefik-letsencrypt`: Para Traefik global (não usado).

### Containers Ativos (docker ps)
| NAMES | IMAGE | STATUS | PORTS |
|-------|-------|--------|-------|
| app-cefaleia | app-cefaleia_app-cefaleia | Up (healthy) | 3000/tcp |
| louis-frontend-prod | louis-final_frontend | Up | 80/tcp |
| louis-backend-prod | louis-final_backend | Up | 8000/tcp |
| traefik-louis | traefik:v2.10 | Up | 0.0.0.0:80->80/tcp, :::80->80/tcp, 0.0.0.0:443->443/tcp, :::443->443/tcp, 0.0.0.0:8080->8080/tcp, :::8080->8080/tcp |
| gerador_provas_backend | gerador_provas-gerador_provas_backend | Up | 8000/tcp |
| gerador_provas_frontend | gerador_provas-gerador_provas_frontend | Up | 80/tcp |

### Portas Expostas (ss -tlpn)
- 80 (web): Docker proxy para Traefik Louis.
- 443 (websecure): Docker proxy para Traefik Louis.
- 8080 (dashboard Traefik): Docker proxy para Traefik Louis.

### Certificados Let's Encrypt
- Volume principal: `louis-final_letsencrypt_data` (acme.json ~33KB, chmod 600).
- Certs atuais (produção, issuer R12):
  - louis.tpfbrain.com: Válido até 20/dez/2025.
  - app-louis.tpfbrain.com: Válido até 20/dez/2025.
  - minhador.tpfbrain.com: Válido até 20/dez/2025 (renovado após remoção de staging).
  - geraprovas.tpfbrain.com: Staging antigo (renovar similar ao Louis).
- Resolver: `myresolver` (TLS challenge, email pardinithales@gmail.com, storage /letsencrypt/acme.json).

## Organização Atual

A organização é modular por app, com Traefik Louis como proxy central para HTTPS/reverse proxy. Apps usam Docker Compose independentes, mas compartilham a rede `louis-final_louis_net` para integração. Traefik global (em `/root/traefik`) é reserva para expansão. Volumes persistem dados (bancos, certs). Labels Traefik padronizados para roteamento (Host rule, entrypoints web/websecure, certresolver=myresolver). Builds locais para customização (Node.js/Python/Nginx). Rede bridge isolada, sem UFW ativo (Docker gerencia firewall).

Localização física: Hetzner Online GmbH (Alemanha, data center europeu), timezone UTC (Etc/UTC), NTP ativo, clock sincronizado.

## Cuidados ao Criar Novos Apps

1. **Docker Compose**: Use versão '3.8' ou remova o campo `version` (obsoleto, causa warn). Sempre valide yaml com `docker compose config`.
2. **Rede**: Declare rede externa `louis-final_louis_net: external: true` na seção global `networks` para integração com Traefik Louis. Evite redes isoladas para evitar "bad address".
3. **Labels Traefik**: 
   - `traefik.enable=true`.
   - Routers: `traefik.http.routers.[nome-app]-http.rule=Host(\`[dominio]\`)` para HTTP (entrypoint web, middleware redirect-to-https).
   - `traefik.http.routers.[nome-app]-secure.rule=Host(\`[dominio]\`)` para HTTPS (entrypoint websecure, tls=true, tls.certresolver=myresolver).
   - Service: `traefik.http.services.[nome-app].loadbalancer.server.port=[porta-interna]`.
   - Alinhe nomes: Use nome do container (ex: app-novo) em routers/services para evitar mismatch.
   - Middlewares opcionais: Redirect scheme=https permanent=true; headers para X-Frame-Options, XSS, nosniff.
4. **Volumes**: Crie volume nomeado (ex: novo-app-data: driver: local) para persistência (dados, acme se separado).
5. **ACME/Certs**: Use resolver `myresolver` para produção (omita caServer para default Let's Encrypt). Backup acme.json antes de mudanças. Force renew removendo acme.json + restart Traefik se staging persistir.
6. **Testes**: 
   - Interno: `docker exec traefik-louis wget -qO- http://[container]:[porta]/`.
   - Externo: `curl -v https://[dominio]/` (com/sem -k para cert).
   - Rede: `docker network inspect louis-final_louis_net | grep [container]`.
7. **Segurança**: Chmod 600 acme.json. Use restart: unless-stopped. Evite exposedByDefault=true no Traefik.
8. **Deploy**: 
   ```
   git fetch origin
   git reset --hard origin/validacao

   # 1. Navegue para o diretório do projeto
   cd /root/louis-final

   # 2. Derrube todos os serviços, volumes e imagens relacionadas ao projeto
   docker-compose down --volumes --rmi all

   # 3. Suba tudo novamente, forçando uma reconstrução do zero
   docker-compose up -d --build

   docker exec -it louis-backend-prod python /app/backend/scripts/populate_db.py
   ```
   Monitore logs: `docker logs -f traefik-louis | grep acme`.
9. **Evite**: Múltiplos Traefik (use o Louis como central). Colar comandos com # em buffer (causa yaml parse error). Deixar staging caServer.
