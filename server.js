const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./database');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar transporte de email
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'drthalesneuro@gmail.com',
        pass: 'pqbl ucai gxdv cugk'
    }
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('./'));

// Função para formatar dados do formulário em HTML para email
function formatarDadosParaEmail(dados, id) {
    const formatarData = (data) => new Date(data).toLocaleString('pt-BR');

    let html = `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
            <h2 style="color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 10px;">
                🏥 Novo Questionário de Cefaleia Recebido
            </h2>

            <div style="background: #f0f4f8; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>ID do Questionário:</strong> #${id}</p>
                <p><strong>Data de Preenchimento:</strong> ${formatarData(new Date())}</p>
            </div>

            <h3 style="color: #667eea; margin-top: 30px;">📋 Dados Principais</h3>
            <ul>
                <li><strong>Idade de início:</strong> ${dados.idadeInicio || 'Não informado'}${dados.idadeExata ? ` (${dados.idadeExata} anos)` : ''}</li>
                <li><strong>Crises por mês:</strong> ${dados.crisesMesExato || dados.crisesMes || 'Não informado'}</li>
                <li><strong>Dias livres de dor:</strong> ${dados.diasLivreExato || dados.diasLivre || 'Não informado'}</li>
                <li><strong>Intensidade máxima:</strong> ${dados.intensidadeMaxima || 'Não informado'}/10</li>
            </ul>
    `;

    if (dados.sinaisAviso && dados.sinaisAviso.length > 0) {
        html += `
            <h3 style="color: #667eea; margin-top: 30px;">⚠️ Sinais de Aviso</h3>
            <ul>${dados.sinaisAviso.map(s => `<li>${s}</li>`).join('')}</ul>
        `;
    }

    if (dados.aura && dados.aura.length > 0) {
        html += `
            <h3 style="color: #667eea; margin-top: 30px;">🌟 Aura</h3>
            <ul>
                <li><strong>Tipos:</strong> ${dados.aura.join(', ')}</li>
                ${dados.auraPercentual ? `<li><strong>Percentual de crises com aura:</strong> ${dados.auraPercentual}%</li>` : ''}
                ${dados.auraTiming ? `<li><strong>Timing:</strong> ${dados.auraTiming}</li>` : ''}
                ${dados.auraDuracao ? `<li><strong>Duração:</strong> ${dados.auraDuracao} minutos</li>` : ''}
            </ul>
        `;
    }

    if (dados.localInicio || dados.mesmoLado) {
        html += `
            <h3 style="color: #667eea; margin-top: 30px;">📍 Localização</h3>
            <ul>
                ${dados.localInicio ? `<li><strong>Local de início:</strong> ${dados.localInicio}</li>` : ''}
                ${dados.localExato ? `<li><strong>Local exato:</strong> ${dados.localExato}</li>` : ''}
                ${dados.mesmoLado ? `<li><strong>Mesmo lado:</strong> ${dados.mesmoLado}</li>` : ''}
            </ul>
        `;
    }

    if (dados.qualidadeDor && dados.qualidadeDor.length > 0) {
        html += `
            <h3 style="color: #667eea; margin-top: 30px;">💢 Características da Dor</h3>
            <ul>
                <li><strong>Tipo:</strong> ${dados.qualidadeDor.join(', ')}</li>
                ${dados.intensidadeInicial ? `<li><strong>Intensidade inicial:</strong> ${dados.intensidadeInicial}/10</li>` : ''}
            </ul>
        `;
    }

    if (dados.gatilhos && dados.gatilhos.length > 0) {
        html += `
            <h3 style="color: #667eea; margin-top: 30px;">🎯 Gatilhos</h3>
            <ul>${dados.gatilhos.map(g => `<li>${g}</li>`).join('')}</ul>
        `;
    }

    if (dados.midasTotal) {
        html += `
            <h3 style="color: #667eea; margin-top: 30px;">📊 Escala MIDAS</h3>
            <p><strong>Pontuação total:</strong> ${dados.midasTotal} pontos</p>
            <p><strong>Interpretação:</strong> ${dados.midasInterpretacao || 'Não disponível'}</p>
        `;
    }

    if (dados.gad7Total) {
        html += `
            <h3 style="color: #667eea; margin-top: 30px;">🧠 Escala GAD-7 (Ansiedade)</h3>
            <p><strong>Pontuação total:</strong> ${dados.gad7Total} pontos</p>
            <p><strong>Nível:</strong> ${dados.gad7Nivel || 'Não disponível'}</p>
        `;
    }

    html += `
            <div style="background: #e0e7ff; padding: 15px; border-radius: 8px; margin-top: 30px;">
                <p style="margin: 0;"><strong>🔐 Acesse o dashboard completo em:</strong></p>
                <p style="margin: 5px 0 0 0;"><a href="https://minhador.tpfbrain.com/dashboard" style="color: #667eea;">https://minhador.tpfbrain.com/dashboard</a></p>
                <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;">Senha: tpb801</p>
            </div>
        </div>
    `;

    return html;
}

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

            const respostaId = this.lastID;

            // Enviar email com os dados do formulário
            const emailHtml = formatarDadosParaEmail(dados, respostaId);

            const mailOptions = {
                from: 'drthalesneuro@gmail.com',
                to: 'drthalesneuro@gmail.com',
                subject: `📋 Novo Questionário de Cefaleia #${respostaId}`,
                html: emailHtml
            };

            transporter.sendMail(mailOptions, (emailErr, info) => {
                if (emailErr) {
                    console.error('Erro ao enviar email:', emailErr);
                    // Não falhar a requisição por causa do email
                } else {
                    console.log('✉️ Email enviado:', info.messageId);
                }
            });

            res.json({
                sucesso: true,
                id: respostaId,
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