const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('./'));

// Rota principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Rota do dashboard
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// API: Salvar resposta do formulário
app.post('/api/respostas', async (req, res) => {
    try {
        const dados = req.body;
        const dataAtual = new Date().toISOString();
        
        // Preparar dados para salvar
        const dadosJson = JSON.stringify(dados);
        
        // Inserir no banco
        const query = `
            INSERT INTO respostas (
                data_preenchimento,
                dados_completos,
                idade_inicio,
                crises_mes,
                dias_livre,
                intensidade_maxima
            ) VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        db.run(query, [
            dataAtual,
            dadosJson,
            dados.idadeInicio || 'Não informado',
            dados.crisesMesExato || '0',
            dados.diasLivreExato || '0',
            dados.intensidadeMaxima || '0'
        ], function(err) {
            if (err) {
                console.error('Erro ao salvar:', err);
                res.status(500).json({ erro: 'Erro ao salvar dados' });
                return;
            }
            
            res.json({ 
                sucesso: true, 
                id: this.lastID,
                mensagem: 'Dados salvos com sucesso!' 
            });
        });
    } catch (erro) {
        console.error('Erro:', erro);
        res.status(500).json({ erro: 'Erro ao processar dados' });
    }
});

// API: Buscar todas as respostas
app.get('/api/respostas', (req, res) => {
    const query = `
        SELECT id, data_preenchimento, idade_inicio, crises_mes, dias_livre, intensidade_maxima
        FROM respostas
        ORDER BY data_preenchimento DESC
    `;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Erro ao buscar:', err);
            res.status(500).json({ erro: 'Erro ao buscar dados' });
            return;
        }
        
        res.json(rows);
    });
});

// API: Buscar resposta específica
app.get('/api/respostas/:id', (req, res) => {
    const query = 'SELECT * FROM respostas WHERE id = ?';
    
    db.get(query, [req.params.id], (err, row) => {
        if (err) {
            console.error('Erro ao buscar:', err);
            res.status(500).json({ erro: 'Erro ao buscar dados' });
            return;
        }
        
        if (!row) {
            res.status(404).json({ erro: 'Resposta não encontrada' });
            return;
        }
        
        // Parsear dados JSON
        row.dados_completos = JSON.parse(row.dados_completos);
        res.json(row);
    });
});

// API: Estatísticas
app.get('/api/estatisticas', (req, res) => {
    const queries = {
        totalRespostas: 'SELECT COUNT(*) as total FROM respostas',
        mediaIdade: 'SELECT AVG(CAST(idade_inicio AS INTEGER)) as media FROM respostas WHERE idade_inicio NOT LIKE "%Não%"',
        mediaCrises: 'SELECT AVG(CAST(crises_mes AS REAL)) as media FROM respostas WHERE crises_mes != "0"',
        mediaDiasLivres: 'SELECT AVG(CAST(dias_livre AS REAL)) as media FROM respostas WHERE dias_livre != "0"',
        mediaIntensidade: 'SELECT AVG(CAST(intensidade_maxima AS REAL)) as media FROM respostas WHERE intensidade_maxima != "0"'
    };
    
    const estatisticas = {};
    let queriesCompletas = 0;
    
    Object.entries(queries).forEach(([key, query]) => {
        db.get(query, [], (err, row) => {
            if (!err && row) {
                estatisticas[key] = row.total || row.media || 0;
            } else {
                estatisticas[key] = 0;
            }
            
            queriesCompletas++;
            if (queriesCompletas === Object.keys(queries).length) {
                res.json(estatisticas);
            }
        });
    });
});

// API: Deletar resposta
app.delete('/api/respostas/:id', (req, res) => {
    const query = 'DELETE FROM respostas WHERE id = ?';
    
    db.run(query, [req.params.id], function(err) {
        if (err) {
            console.error('Erro ao deletar:', err);
            res.status(500).json({ erro: 'Erro ao deletar dados' });
            return;
        }
        
        if (this.changes === 0) {
            res.status(404).json({ erro: 'Resposta não encontrada' });
            return;
        }
        
        res.json({ sucesso: true, mensagem: 'Resposta deletada com sucesso' });
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`📊 Dashboard disponível em http://localhost:${PORT}/dashboard`);
}); 