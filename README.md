# Formulário de Cefaleia - Questionário Interativo

## 📋 Descrição
Formulário interativo e responsivo para coleta de dados sobre cefaleias (dores de cabeça), desenvolvido para facilitar o preenchimento e análise de informações médicas.

## ✨ Funcionalidades
- ✅ Formulário completo com 10 seções otimizadas
- 💾 Salvamento automático de rascunho
- 📊 Geração de relatório formatado
- 🖨️ Impressão otimizada
- 📧 Envio fácil por e-mail do relatório
- 📱 Design responsivo
- 🎨 Interface moderna e intuitiva
- 📈 Dashboard opcional com estatísticas
- 🧠 **NOVO:** Escalas MIDAS e GAD-7 integradas com cálculo automático
- ⚡ **NOVO:** Validações inteligentes e campos exclusivos
- 🔄 **NOVO:** Sub-perguntas dinâmicas baseadas nas respostas
- 📋 **NOVO:** Campos de texto explicativos e melhor UX

## 🚀 Deploy Rápido

### Opção 1: GitHub Pages (Mais Rápido - 2 minutos)

1. **Crie uma conta no GitHub** (se não tiver): https://github.com/signup

2. **Crie um novo repositório:**
   - Clique em "New" ou acesse: https://github.com/new
   - Nome do repositório: `formulario-cefaleia`
   - Marque como "Public"
   - NÃO adicione README, .gitignore ou license
   - Clique em "Create repository"

3. **Faça upload dos arquivos:**
   - Na página do repositório, clique em "uploading an existing file"
   - Arraste os 3 arquivos: `index.html`, `styles.css`, `script.js`
   - Escreva uma mensagem de commit (ex: "Initial commit")
   - Clique em "Commit changes"

4. **Ative o GitHub Pages:**
   - Vá em Settings (⚙️) > Pages
   - Source: Deploy from a branch
   - Branch: main
   - Folder: / (root)
   - Clique em "Save"

5. **Acesse seu site:**
   - Aguarde 1-2 minutos
   - Seu site estará em: `https://[seu-usuario].github.io/formulario-cefaleia`

### Opção 2: Netlify Drop (Ainda Mais Rápido - 30 segundos)

1. **Acesse:** https://app.netlify.com/drop

2. **Arraste a pasta do projeto** para a área indicada

3. **Pronto!** Seu site estará online instantaneamente com um URL temporário

4. **Para URL permanente** (opcional):
   - Crie uma conta gratuita no Netlify
   - Clique em "Claim your site"

### Opção 3: Vercel (1 minuto)

1. **Instale Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Na pasta do projeto, execute:**
   ```bash
   vercel
   ```

3. **Siga as instruções** (aceite os padrões com Enter)

4. **Pronto!** Seu site estará online


## 📁 Estrutura do Projeto

```
formulario-cefaleia/
├── index.html      # Formulário principal
├── dashboard.html  # Dashboard de visualização
├── styles.css      # Estilos do formulário
├── script.js       # Lógica do formulário
├── package.json    # Dependências Node.js
├── .gitignore      # Arquivos ignorados
└── README.md       # Este arquivo
```

## 💻 Uso Local

### Sem Banco de Dados (Apenas Formulário)
1. Baixe todos os arquivos
2. Abra `index.html` no navegador
3. Pronto para usar!
4. Após preencher, clique em **Baixar PDF** e depois em **Enviar por E-mail** para anexar o arquivo e enviá-lo ao médico.


## 🛠️ Personalização

### Cores
Edite em `styles.css`:
```css
header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

### Campos
Adicione novos campos em `index.html` seguindo o padrão existente.

## 📝 Recursos

- **Auto-save:** Salva automaticamente no navegador
- **Validação:** Campos mutuamente exclusivos
- **Relatório:** Gera resumo formatado dos dados
- **Impressão:** Layout otimizado para papel

## 🤝 Suporte

Para dúvidas ou problemas, abra uma issue no GitHub.

---

Desenvolvido com ❤️ para facilitar o atendimento médico 