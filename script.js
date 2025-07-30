// Atualizar valores dos sliders em tempo real
document.addEventListener('DOMContentLoaded', function() {
    // Configurar sliders de intensidade
    const sliders = document.querySelectorAll('input[type="range"]');
    sliders.forEach(slider => {
        const valueDisplay = slider.nextElementSibling;
        slider.addEventListener('input', function() {
            valueDisplay.textContent = this.value;
        });
    });

    // Carregar rascunho se existir
    carregarRascunho();

    // Auto-salvar a cada mudança
    const form = document.getElementById('cefaleiaForm');
    form.addEventListener('change', function() {
        salvarRascunho(true); // true = silencioso
    });

    // Configurar todas as validações
    configurarOpcoesMutuamenteExclusivas();
    configurarNumeroExatoExclusivo();
    configurarAuraSubPerguntas();
    configurarCalculoMIDAS();
    configurarCalculoGAD7();
    configurarPoscriseExclusivo();
});

// Configurar opções mutuamente exclusivas
function configurarOpcoesMutuamenteExclusivas() {
    // Nenhum sinal vs outros sinais de aviso
    const nenhumAviso = document.querySelector('input[name="aviso_nenhum"]');
    const outrosAvisos = document.querySelectorAll('input[name^="aviso_"]:not([name="aviso_nenhum"])');
    
    nenhumAviso?.addEventListener('change', function() {
        if (this.checked) {
            outrosAvisos.forEach(checkbox => {
                checkbox.checked = false;
                checkbox.disabled = true;
            });
        } else {
            outrosAvisos.forEach(checkbox => {
                checkbox.disabled = false;
            });
        }
    });

    outrosAvisos.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            if (Array.from(outrosAvisos).some(cb => cb.checked)) {
                nenhumAviso.checked = false;
                nenhumAviso.disabled = true;
            } else {
                nenhumAviso.disabled = false;
            }
        });
    });

    // Repetir para outras seções com opção "Nenhum"
    configurarExclusividade('aura_nenhum', 'aura_');
    configurarExclusividade('sintoma_nenhum', 'sintoma_');
    configurarExclusividade('gatilho_nenhum', 'gatilho_');
}

function configurarExclusividade(nomeNenhum, prefixo) {
    const nenhum = document.querySelector(`input[name="${nomeNenhum}"]`);
    const outros = document.querySelectorAll(`input[name^="${prefixo}"]:not([name="${nomeNenhum}"])`);
    
    nenhum?.addEventListener('change', function() {
        if (this.checked) {
            outros.forEach(checkbox => {
                checkbox.checked = false;
                checkbox.disabled = true;
            });
        } else {
            outros.forEach(checkbox => {
                checkbox.disabled = false;
            });
        }
    });

    outros.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            if (Array.from(outros).some(cb => cb.checked)) {
                nenhum.checked = false;
                nenhum.disabled = true;
            } else {
                nenhum.disabled = false;
            }
        });
    });
}

// Salvar rascunho no localStorage
function salvarRascunho(silencioso = false) {
    const formData = new FormData(document.getElementById('cefaleiaForm'));
    const data = {};
    
    // Coletar todos os dados do formulário
    for (let [key, value] of formData.entries()) {
        if (data[key]) {
            // Se já existe, converter para array
            if (!Array.isArray(data[key])) {
                data[key] = [data[key]];
            }
            data[key].push(value);
        } else {
            data[key] = value;
        }
    }
    
    // Salvar checkboxes não marcados
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        if (!checkbox.checked) {
            data[checkbox.name] = false;
        }
    });
    
    // Salvar valores dos inputs inline
    document.querySelectorAll('.inline-input').forEach(input => {
        if (input.value) {
            data[`inline_${input.placeholder}`] = input.value;
        }
    });
    
    localStorage.setItem('cefaleiaFormData', JSON.stringify(data));
    
    if (!silencioso) {
        mostrarNotificacao('Rascunho salvo com sucesso!', 'success');
    }
}

// Carregar rascunho do localStorage
function carregarRascunho() {
    const savedData = localStorage.getItem('cefaleiaFormData');
    if (savedData) {
        const data = JSON.parse(savedData);
        
        // Restaurar valores
        Object.keys(data).forEach(key => {
            if (key.startsWith('inline_')) {
                // Restaurar inputs inline
                const input = document.querySelector(`.inline-input[placeholder="${key.replace('inline_', '')}"]`);
                if (input) input.value = data[key];
            } else {
                const elements = document.querySelectorAll(`[name="${key}"]`);
                elements.forEach(element => {
                    if (element.type === 'checkbox' || element.type === 'radio') {
                        if (Array.isArray(data[key])) {
                            element.checked = data[key].includes(element.value);
                        } else {
                            element.checked = (element.value === data[key]) || (data[key] === true);
                        }
                    } else {
                        element.value = data[key];
                    }
                });
            }
        });
        
        // Atualizar displays dos sliders
        document.querySelectorAll('input[type="range"]').forEach(slider => {
            const valueDisplay = slider.nextElementSibling;
            if (valueDisplay) valueDisplay.textContent = slider.value;
        });
        
        mostrarNotificacao('Rascunho carregado automaticamente', 'info');
    }
}

// Gerar relatório
async function gerarRelatorio() {
    const formData = coletarDadosFormulario();
    
    // Enviar dados para o servidor
    try {
        const response = await fetch('/api/respostas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            const resultado = await response.json();
            mostrarNotificacao('✅ Dados salvos no banco de dados!', 'success');
            
            // Adicionar botão para ver no dashboard
            const relatorio = gerarTextoRelatorio(formData);
            const dashboardLink = `
                <div style="text-align: center; margin: 20px 0; padding: 20px; background: #f0f9ff; border-radius: 10px;">
                    <p style="font-size: 18px; color: #065f46; margin-bottom: 15px;">
                        ✅ Resposta salva com sucesso! ID: #${resultado.id}
                    </p>
                    <a href="/dashboard" style="display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
                        📊 Ver no Dashboard
                    </a>
                </div>
            `;
            
            document.getElementById('relatorio-conteudo').innerHTML = dashboardLink + relatorio;
        } else {
            mostrarNotificacao('⚠️ Erro ao salvar no banco de dados', 'error');
            // Mostrar relatório mesmo com erro
            const relatorio = gerarTextoRelatorio(formData);
            document.getElementById('relatorio-conteudo').innerHTML = relatorio;
        }
    } catch (erro) {
        console.error('Erro ao enviar dados:', erro);
        mostrarNotificacao('⚠️ Erro de conexão com o servidor', 'error');
        // Mostrar relatório mesmo com erro
        const relatorio = gerarTextoRelatorio(formData);
        const avisoOffline = `
            <div style="text-align: center; margin: 20px 0; padding: 20px; background: #fef3c7; border-radius: 10px;">
                <p style="font-size: 16px; color: #92400e;">
                    ⚠️ Não foi possível salvar no banco de dados. 
                    Certifique-se de que o servidor está rodando.
                </p>
            </div>
        `;
        document.getElementById('relatorio-conteudo').innerHTML = avisoOffline + relatorio;
    }
    
    document.getElementById('cefaleiaForm').parentElement.style.display = 'none';
    document.getElementById('relatorio').style.display = 'block';
    
    // Scroll para o topo
    window.scrollTo(0, 0);
}

// Coletar dados do formulário de forma organizada
function coletarDadosFormulario() {
    const dados = {
        idadeInicio: obterValorRadio('idade_inicio'),
        idadeExata: document.querySelector('input[name="idade_exata"]')?.value,
        crisesMes: obterValorRadio('crises_mes'),
        crisesMesExato: document.querySelector('input[name="crises_mes_exato"]')?.value,
        diasLivre: obterValorRadio('dias_livre'),
        diasLivreExato: document.querySelector('input[name="dias_livre_exato"]')?.value,
        sinaisAviso: obterCheckboxesSelecionados('aviso'),
        aura: obterCheckboxesSelecionados('aura'),
        localInicio: obterValorRadio('local_inicio'),
        localExato: document.querySelector('input[name="local_exato"]')?.value,
        dorEspalha: obterValorRadio('dor_espalha'),
        qualidadeDor: obterCheckboxesSelecionados('qualidade'),
        intensidadeInicial: document.querySelector('input[name="intensidade_inicial"]')?.value,
        intensidadeMaxima: document.querySelector('input[name="intensidade_maxima"]')?.value,
        tempoMax: obterValorRadio('tempo_max'),
        tempoMaxExato: document.querySelector('input[name="tempo_max_exato"]')?.value,
        horarioCrise: obterValorRadio('horario_crise'),
        acordaSono: obterValorRadio('acorda_sono'),
        sintomas: obterCheckboxesSelecionados('sintoma'),
        peleSensivel: obterValorRadio('pele_sensivel'),
        comportamento: obterValorRadio('comportamento'),
        pioraAtividade: obterValorRadio('piora_atividade'),
        duracao: obterValorRadio('duracao'),
        duracaoHoras: document.querySelector('input[name="duracao_horas"]')?.value,
        duracaoMinutos: document.querySelector('input[name="duracao_minutos"]')?.value,
        posCrise: obterCheckboxesSelecionados('pos'),
        entreCrises: obterValorRadio('entre_crises'),
        gatilhos: obterCheckboxesSelecionados('gatilho'),
        impactoDias: obterValorRadio('impacto_dias'),
        impactoDiasExato: document.querySelector('input[name="impacto_dias_exato"]')?.value,
        impactoEntre: obterValorRadio('impacto_entre'),
        data: document.querySelector('input[name="data"]')?.value
    };
    
    // Adicionar valores dos inputs inline
    document.querySelectorAll('.inline-input').forEach(input => {
        if (input.value) {
            const checkbox = input.closest('.checkbox-label')?.querySelector('input[type="checkbox"], input[type="radio"]');
            if (checkbox && checkbox.name) {
                if (!dados.valoresInline) dados.valoresInline = {};
                dados.valoresInline[checkbox.name] = input.value;
            }
        }
    });
    
    return dados;
}

// Funções auxiliares
function obterValorRadio(nome) {
    const selected = document.querySelector(`input[name="${nome}"]:checked`);
    return selected ? selected.value : null;
}

function obterCheckboxesSelecionados(prefixo) {
    const checkboxes = document.querySelectorAll(`input[name^="${prefixo}_"]:checked`);
    return Array.from(checkboxes).map(cb => cb.name.replace(`${prefixo}_`, ''));
}

// Gerar texto do relatório
function gerarTextoRelatorio(dados) {
    let html = '<div class="relatorio-section">';
    html += '<h4>Dados do Paciente</h4>';
    html += `<p><strong>Data do preenchimento:</strong> ${dados.data || 'Não informada'}</p>`;
    html += '</div>';
    
    // Seção 1
    html += '<div class="relatorio-section">';
    html += '<h4>1. Idade de Início e Frequência</h4>';
    html += `<p><strong>Início das cefaleias:</strong> ${formatarIdadeInicio(dados.idadeInicio)}`;
    if (dados.idadeExata) html += ` (${dados.idadeExata} anos)`;
    html += '</p>';
    html += `<p><strong>Frequência:</strong> ${formatarFrequencia(dados.crisesMes)}`;
    if (dados.crisesMesExato) html += ` (${dados.crisesMesExato} por mês)`;
    html += '</p>';
    html += `<p><strong>Dias livres de dor:</strong> ${formatarDiasLivres(dados.diasLivre)}`;
    if (dados.diasLivreExato) html += ` (${dados.diasLivreExato} dias)`;
    html += '</p>';
    html += '</div>';
    
    // Seção 2
    if (dados.sinaisAviso.length > 0 || dados.aura.length > 0) {
        html += '<div class="relatorio-section">';
        html += '<h4>2. Sinais de Aviso e Aura</h4>';
        if (dados.sinaisAviso.length > 0) {
            html += '<p><strong>Sinais de aviso:</strong></p><ul>';
            dados.sinaisAviso.forEach(sinal => {
                html += `<li>${formatarSinalAviso(sinal)}`;
                if (dados.valoresInline && dados.valoresInline[`aviso_${sinal}`]) {
                    html += ` (${dados.valoresInline[`aviso_${sinal}`]})`;
                }
                html += '</li>';
            });
            html += '</ul>';
        }
        if (dados.aura.length > 0) {
            html += '<p><strong>Aura:</strong></p><ul>';
            dados.aura.forEach(aura => {
                html += `<li>${formatarAura(aura)}`;
                if (dados.valoresInline && dados.valoresInline[`aura_${aura}`]) {
                    html += ` (${dados.valoresInline[`aura_${aura}`]})`;
                }
                html += '</li>';
            });
            html += '</ul>';
        }
        html += '</div>';
    }
    
    // Continuar com outras seções...
    // (Adicionar mais seções conforme necessário)
    
    return html;
}

// Funções de formatação
function formatarIdadeInicio(valor) {
    const mapa = {
        'antes_10': 'Antes dos 10 anos',
        '10_20': 'Entre 10-20 anos',
        '20_30': 'Entre 20-30 anos',
        '30_40': 'Entre 30-40 anos',
        'apos_40': 'Após 40 anos'
    };
    return mapa[valor] || 'Não informado';
}

function formatarFrequencia(valor) {
    const mapa = {
        'menos_1': 'Menos de 1 por mês',
        '1_4': '1-4 por mês',
        '5_14': '5-14 por mês',
        '15_mais': '15 ou mais por mês'
    };
    return mapa[valor] || 'Não informado';
}

function formatarDiasLivres(valor) {
    const mapa = {
        '0_5': '0-5 dias',
        '6_15': '6-15 dias',
        '16_25': '16-25 dias',
        '26_30': '26-30 dias'
    };
    return mapa[valor] || 'Não informado';
}

function formatarSinalAviso(sinal) {
    const mapa = {
        'bocejos': 'Bocejos incontroláveis',
        'humor': 'Mudança de humor',
        'cansaco': 'Cansaço extremo',
        'cognitiva': 'Dificuldade cognitiva',
        'comida': 'Desejo por comida',
        'sede': 'Sede ou micção excessiva',
        'pescoco': 'Dor no pescoço',
        'nenhum': 'Nenhum sinal'
    };
    return mapa[sinal] || sinal;
}

function formatarAura(aura) {
    const mapa = {
        'luzes': 'Luzes piscando ou ziguezague',
        'formigamento': 'Formigamento ou dormência',
        'falar': 'Dificuldade para falar',
        'nenhum': 'Nenhum'
    };
    return mapa[aura] || aura;
}

// Voltar ao formulário
function voltarFormulario() {
    document.getElementById('relatorio').style.display = 'none';
    document.getElementById('cefaleiaForm').parentElement.style.display = 'block';
    window.scrollTo(0, 0);
}

// Imprimir formulário
function imprimirFormulario() {
    window.print();
}

// Mostrar notificação
function mostrarNotificacao(mensagem, tipo = 'info') {
    const notificacao = document.createElement('div');
    notificacao.className = `notificacao ${tipo}`;
    notificacao.textContent = mensagem;
    notificacao.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${tipo === 'success' ? '#48bb78' : '#4299e1'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notificacao);
    
    setTimeout(() => {
        notificacao.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => notificacao.remove(), 300);
    }, 3000);
}

// Animações CSS para notificações
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Configurar exclusividade entre número exato e opções múltiplas
function configurarNumeroExatoExclusivo() {
    const numerosExatos = document.querySelectorAll('.numero-exato');
    
    numerosExatos.forEach(numeroExato => {
        const grupoRadio = numeroExato.closest('.question-group').querySelectorAll('input[type="radio"]');
        
        // Quando preenche número exato, desabilita rádios
        numeroExato.addEventListener('input', function() {
            if (this.value.trim() !== '') {
                grupoRadio.forEach(radio => {
                    radio.disabled = true;
                    radio.checked = false;
                });
                this.classList.add('numero-exato-ativo');
            } else {
                grupoRadio.forEach(radio => {
                    radio.disabled = false;
                });
                this.classList.remove('numero-exato-ativo');
            }
        });
        
        // Quando seleciona rádio, limpa número exato
        grupoRadio.forEach(radio => {
            radio.addEventListener('change', function() {
                if (this.checked) {
                    numeroExato.value = '';
                    numeroExato.classList.remove('numero-exato-ativo');
                }
            });
        });
    });
}

// Configurar sub-perguntas da aura
function configurarAuraSubPerguntas() {
    const aurasCheckboxes = document.querySelectorAll('input[name^="aura_"]:not([name="aura_nenhum"])');
    const auraNenhum = document.querySelector('input[name="aura_nenhum"]');
    const auraDetails = document.getElementById('aura-details');
    
    function verificarAura() {
        const algumaSelecionada = Array.from(aurasCheckboxes).some(cb => cb.checked);
        if (algumaSelecionada && !auraNenhum.checked) {
            auraDetails.style.display = 'block';
        } else {
            auraDetails.style.display = 'none';
        }
    }
    
    aurasCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', verificarAura);
    });
    
    auraNenhum.addEventListener('change', verificarAura);
}

// Configurar exclusividade no pós-crise
function configurarPoscriseExclusivo() {
    const posNormal = document.querySelector('input[name="pos_normal"]');
    const outrosPos = document.querySelectorAll('input[name^="pos_"]:not([name="pos_normal"]):not([name="pos_observacoes"])');
    
    posNormal?.addEventListener('change', function() {
        if (this.checked) {
            outrosPos.forEach(checkbox => {
                checkbox.checked = false;
                checkbox.disabled = true;
            });
        } else {
            outrosPos.forEach(checkbox => {
                checkbox.disabled = false;
            });
        }
    });
    
    outrosPos.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            if (Array.from(outrosPos).some(cb => cb.checked)) {
                posNormal.checked = false;
                posNormal.disabled = true;
            } else {
                posNormal.disabled = false;
            }
        });
    });
}

// Calcular pontuação MIDAS
function configurarCalculoMIDAS() {
    const midasInputs = document.querySelectorAll('input[name^="midas_"]');
    const midasScore = document.getElementById('midas-score');
    const midasInterpretation = document.getElementById('midas-interpretation');
    
    function calcularMIDAS() {
        let total = 0;
        midasInputs.forEach(input => {
            total += parseInt(input.value) || 0;
        });
        
        midasScore.textContent = total;
        
        let interpretacao = '';
        if (total <= 5) {
            interpretacao = 'Grau I - Incapacidade mínima ou infrequente';
        } else if (total <= 10) {
            interpretacao = 'Grau II - Incapacidade leve ou pouco frequente';
        } else if (total <= 20) {
            interpretacao = 'Grau III - Incapacidade moderada';
        } else {
            interpretacao = 'Grau IV - Incapacidade grave';
        }
        
        midasInterpretation.textContent = interpretacao;
    }
    
    midasInputs.forEach(input => {
        input.addEventListener('input', calcularMIDAS);
    });
}

// Calcular pontuação GAD-7
function configurarCalculoGAD7() {
    const gad7Inputs = document.querySelectorAll('input[name^="gad7_"]');
    const gad7Score = document.getElementById('gad7-score');
    const gad7Interpretation = document.getElementById('gad7-interpretation');
    
    function calcularGAD7() {
        let total = 0;
        for (let i = 1; i <= 7; i++) {
            const selected = document.querySelector(`input[name="gad7_${i}"]:checked`);
            if (selected) {
                total += parseInt(selected.value);
            }
        }
        
        gad7Score.textContent = total;
        
        let interpretacao = '';
        if (total <= 4) {
            interpretacao = 'Ansiedade mínima';
        } else if (total <= 9) {
            interpretacao = 'Ansiedade leve';
        } else if (total <= 14) {
            interpretacao = 'Ansiedade moderada';
        } else {
            interpretacao = 'Ansiedade grave';
        }
        
        gad7Interpretation.textContent = interpretacao;
    }
    
    gad7Inputs.forEach(input => {
        input.addEventListener('change', calcularGAD7);
    });
} 