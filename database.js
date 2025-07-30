const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Definir caminho do banco de dados (usa /app/data no Docker)
const dbPath = process.env.NODE_ENV === 'production' 
    ? path.join('/app/data', 'cefaleia.db')
    : path.join(__dirname, 'cefaleia.db');

// Criar/conectar ao banco de dados
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
    } else {
        console.log('✅ Conectado ao banco de dados SQLite');
    }
});

// Criar tabela se não existir
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS respostas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            data_preenchimento DATETIME DEFAULT CURRENT_TIMESTAMP,
            dados_completos TEXT NOT NULL,
            idade_inicio TEXT,
            crises_mes TEXT,
            dias_livre TEXT,
            intensidade_maxima TEXT
        )
    `, (err) => {
        if (err) {
            console.error('Erro ao criar tabela:', err);
        } else {
            console.log('✅ Tabela de respostas criada/verificada');
        }
    });
});

module.exports = db; 