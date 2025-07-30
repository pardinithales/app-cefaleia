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
    configurarSelectoresDuracao();
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
    const timestamp = new Date().toLocaleString('pt-BR');
    
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
            
            // Mostrar tela do paciente
            mostrarTelaPaciente(resultado.id, timestamp);
            
            // Salvar dados completos para o admin
            sessionStorage.setItem('relatorio_completo', JSON.stringify({
                id: resultado.id,
                timestamp: timestamp,
                dados: formData
            }));
        } else {
            mostrarNotificacao('⚠️ Erro ao salvar no banco de dados', 'error');
            mostrarTelaPacienteOffline(timestamp, formData);
        }
    } catch (erro) {
        console.error('Erro ao enviar dados:', erro);
        mostrarNotificacao('⚠️ Erro de conexão com o servidor', 'error');
        mostrarTelaPacienteOffline(timestamp, formData);
    }
    
    document.getElementById('cefaleiaForm').parentElement.style.display = 'none';
    document.getElementById('relatorio').style.display = 'block';
    
    // Scroll para o topo
    window.scrollTo(0, 0);
}

// Tela do paciente após envio
function mostrarTelaPaciente(id, timestamp) {
    const html = `
        <div style="text-align: center; padding: 40px;">
            <div style="background: #f0fdf4; border: 2px solid #86efac; border-radius: 15px; padding: 40px; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #166534; margin-bottom: 20px;">
                    ✅ Questionário Enviado com Sucesso!
                </h2>
                <p style="font-size: 18px; color: #15803d; margin-bottom: 10px;">
                    Seu questionário foi salvo com o ID: <strong>#${id}</strong>
                </p>
                <p style="font-size: 16px; color: #15803d; margin-bottom: 30px;">
                    Data e hora: ${timestamp}
                </p>
                <p style="font-size: 16px; color: #166534; margin-bottom: 30px;">
                    O Dr. Thales receberá sua resposta e analisará as informações durante sua consulta.
                </p>
                
                <div style="margin-top: 30px;">
                    <button onclick="baixarPDF()" class="btn btn-primary" style="margin-right: 10px;">
                        📄 Baixar PDF do Questionário
                    </button>
                    <button onclick="mostrarAreaAdmin()" class="btn btn-secondary">
                        🔐 Área do Médico
                    </button>
                </div>
            </div>
        </div>
        
        <div id="admin-login" style="display: none;">
            <div style="background: #f8f9fa; border-radius: 10px; padding: 30px; max-width: 400px; margin: 20px auto;">
                <h3 style="text-align: center; margin-bottom: 20px;">Área Restrita - Médico</h3>
                <div style="text-align: center;">
                    <input type="password" id="senha-admin" placeholder="Digite a senha" 
                           style="padding: 10px; border: 1px solid #ddd; border-radius: 5px; width: 200px;">
                    <button onclick="verificarSenha()" class="btn btn-primary" style="margin-left: 10px;">
                        Entrar
                    </button>
                </div>
                <p style="text-align: center; color: #dc3545; margin-top: 10px; display: none;" id="senha-erro">
                    Senha incorreta!
                </p>
            </div>
        </div>
        
        <div id="relatorio-completo" style="display: none;">
            <!-- Relatório completo será inserido aqui após senha correta -->
        </div>
    `;
    
    document.getElementById('relatorio-conteudo').innerHTML = html;
}

// Tela do paciente offline
function mostrarTelaPacienteOffline(timestamp, formData) {
    const html = `
        <div style="text-align: center; padding: 40px;">
            <div style="background: #fef3c7; border: 2px solid #fbbf24; border-radius: 15px; padding: 40px; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #92400e; margin-bottom: 20px;">
                    ⚠️ Questionário Preenchido (Modo Offline)
                </h2>
                <p style="font-size: 16px; color: #92400e; margin-bottom: 30px;">
                    Não foi possível salvar no banco de dados, mas você pode baixar o PDF com suas respostas.
                </p>
                <p style="font-size: 16px; color: #92400e; margin-bottom: 30px;">
                    Data e hora: ${timestamp}
                </p>
                
                <div style="margin-top: 30px;">
                    <button onclick="baixarPDF()" class="btn btn-primary">
                        📄 Baixar PDF do Questionário
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('relatorio-conteudo').innerHTML = html;
    
    // Salvar dados para PDF mesmo offline
    sessionStorage.setItem('relatorio_completo', JSON.stringify({
        id: 'OFFLINE',
        timestamp: timestamp,
        dados: formData
    }));
}

// Mostrar área do admin
function mostrarAreaAdmin() {
    document.getElementById('admin-login').style.display = 'block';
    document.getElementById('senha-admin').focus();
}

// Verificar senha
function verificarSenha() {
    const senha = document.getElementById('senha-admin').value;
    
    if (senha === 'tpb801') {
        // Senha correta - mostrar relatório completo
        const dadosSalvos = JSON.parse(sessionStorage.getItem('relatorio_completo'));
        
        if (dadosSalvos) {
            const relatorioCompleto = gerarTextoRelatorio(dadosSalvos.dados);
            
            document.getElementById('admin-login').style.display = 'none';
            document.getElementById('relatorio-completo').innerHTML = `
                <h3 style="text-align: center; margin: 20px 0;">Relatório Completo - Área Médica</h3>
                ${relatorioCompleto}
                <div style="text-align: center; margin-top: 30px;">
                    <a href="/dashboard" class="btn btn-primary">
                        📊 Acessar Dashboard Completo
                    </a>
                </div>
            `;
            document.getElementById('relatorio-completo').style.display = 'block';
        }
    } else {
        // Senha incorreta
        document.getElementById('senha-erro').style.display = 'block';
        document.getElementById('senha-admin').value = '';
    }
}

// Enter para submeter senha
document.addEventListener('DOMContentLoaded', function() {
    const senhaInput = document.getElementById('senha-admin');
    if (senhaInput) {
        senhaInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                verificarSenha();
            }
        });
    }
});

// Coletar dados do formulário de forma organizada
function coletarDadosFormulario() {
    const dados = {
        // Seção 1
        idadeInicio: obterValorRadio('idade_inicio'),
        idadeExata: document.querySelector('input[name="idade_exata"]')?.value,
        crisesMes: obterValorRadio('crises_mes'),
        crisesMesExato: document.querySelector('input[name="crises_mes_exato"]')?.value,
        diasLivre: obterValorRadio('dias_livre'),
        diasLivreExato: document.querySelector('input[name="dias_livre_exato"]')?.value,
        
        // Seção 2
        sinaisAviso: obterCheckboxesSelecionados('aviso'),
        aura: obterCheckboxesSelecionados('aura'),
        auraPercentual: document.querySelector('input[name="aura_percentual"]')?.value,
        auraTiming: obterValorRadio('aura_timing'),
        auraDuracao: document.querySelector('input[name="aura_duracao"]')?.value,
        
        // Seção 3
        localInicio: obterValorRadio('local_inicio'),
        localExato: document.querySelector('input[name="local_exato"]')?.value,
        mesmoLado: obterValorRadio('mesmo_lado'),
        duracaoSemMedicacao: obterValorRadio('duracao_sem_medicacao'),
        duracaoSemMedUnidade: document.querySelector('select[name="duracao_unidade"]')?.value,
        duracaoSemMedValor: document.querySelector('input[name="duracao_valor_sem_med"]')?.value,
        criseLonga: document.querySelector('input[name="crise_longa"]')?.checked,
        criseMuitoLonga: document.querySelector('input[name="crise_muito_longa"]')?.checked,
        
        // Seção 4
        qualidadeDor: obterCheckboxesSelecionados('qualidade'),
        qualidadeOutra: document.querySelector('input[name="qualidade_outra"]')?.value,
        intensidadeInicial: document.querySelector('input[name="intensidade_inicial"]')?.value,
        intensidadeMaxima: document.querySelector('input[name="intensidade_maxima"]')?.value,
        tempoMax: obterValorRadio('tempo_max'),
        tempoMaxExato: document.querySelector('input[name="tempo_max_exato"]')?.value,
        
        // Seção 5
        horarioCrise: obterValorRadio('horario_crise'),
        acordaSono: obterValorRadio('acorda_sono'),
        
        // Seção 6
        sintomas: obterCheckboxesSelecionados('sintoma'),
        peleSensivel: obterValorRadio('pele_sensivel'),
        
        // Seção 7
        comportamento: obterValorRadio('comportamento'),
        
        // Seção 8
        duracao: obterValorRadio('duracao'),
        duracaoIntensaUnidade: document.querySelector('select[name="duracao_intensa_unidade"]')?.value,
        duracaoIntensaValor: document.querySelector('input[name="duracao_intensa_valor"]')?.value,
        posCrise: obterCheckboxesSelecionados('pos'),
        posObservacoes: document.querySelector('textarea[name="pos_observacoes"]')?.value,
        entreCrises: obterValorRadio('entre_crises'),
        
        // Seção 9
        gatilhos: obterCheckboxesSelecionados('gatilho'),
        gatilhosOutros: document.querySelector('textarea[name="gatilhos_outros"]')?.value,
        
        // Seção 10
        impactoDias: obterValorRadio('impacto_dias'),
        impactoDiasExato: document.querySelector('input[name="impacto_dias_exato"]')?.value,
        impactoEntre: obterValorRadio('impacto_entre'),
        
        // MIDAS
        midas: {
            q1: document.querySelector('input[name="midas_1"]')?.value || 0,
            q2: document.querySelector('input[name="midas_2"]')?.value || 0,
            q3: document.querySelector('input[name="midas_3"]')?.value || 0,
            q4: document.querySelector('input[name="midas_4"]')?.value || 0,
            q5: document.querySelector('input[name="midas_5"]')?.value || 0,
            total: parseInt(document.getElementById('midas-score')?.textContent) || 0,
            interpretacao: document.getElementById('midas-interpretation')?.textContent
        },
        
        // GAD-7
        gad7: {
            respostas: {},
            total: parseInt(document.getElementById('gad7-score')?.textContent) || 0,
            interpretacao: document.getElementById('gad7-interpretation')?.textContent
        },
        
        // Data
        data: document.querySelector('input[name="data"]')?.value
    };
    
    // Coletar respostas GAD-7
    for (let i = 1; i <= 7; i++) {
        const selected = document.querySelector(`input[name="gad7_${i}"]:checked`);
        if (selected) {
            dados.gad7.respostas[`q${i}`] = selected.value;
        }
    }
    
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
    if (dados.idadeExata) {
        html += `<p><strong>Início das cefaleias:</strong> ${dados.idadeExata} anos</p>`;
    } else if (dados.idadeInicio) {
        html += `<p><strong>Início das cefaleias:</strong> ${formatarIdadeInicio(dados.idadeInicio)}</p>`;
    }
    
    if (dados.crisesMesExato) {
        html += `<p><strong>Frequência:</strong> ${dados.crisesMesExato} crises por mês</p>`;
    } else if (dados.crisesMes) {
        html += `<p><strong>Frequência:</strong> ${formatarFrequencia(dados.crisesMes)}</p>`;
    }
    
    if (dados.diasLivreExato) {
        html += `<p><strong>Dias livres de dor:</strong> ${dados.diasLivreExato} dias por mês</p>`;
    } else if (dados.diasLivre) {
        html += `<p><strong>Dias livres de dor:</strong> ${formatarDiasLivres(dados.diasLivre)}</p>`;
    }
    html += '</div>';
    
    // Seção 2
    if (dados.sinaisAviso.length > 0 || dados.aura.length > 0) {
        html += '<div class="relatorio-section">';
        html += '<h4>2. Sinais de Aviso e Aura</h4>';
        
        if (dados.sinaisAviso.length > 0 && !dados.sinaisAviso.includes('nenhum')) {
            html += '<p><strong>Sinais de aviso:</strong></p><ul>';
            dados.sinaisAviso.forEach(sinal => {
                html += `<li>${formatarSinalAviso(sinal)}</li>`;
            });
            html += '</ul>';
        }
        
        if (dados.aura.length > 0 && !dados.aura.includes('nenhum')) {
            html += '<p><strong>Aura:</strong></p><ul>';
            dados.aura.forEach(aura => {
                html += `<li>${formatarAura(aura)}</li>`;
            });
            html += '</ul>';
            
            if (dados.auraPercentual) {
                html += `<p><strong>Frequência da aura:</strong> ${dados.auraPercentual}% das crises</p>`;
            }
            if (dados.auraTiming) {
                html += `<p><strong>Timing da aura:</strong> ${dados.auraTiming === 'junto' ? 'Junto com a dor' : 'Até 1 hora antes da dor'}</p>`;
            }
            if (dados.auraDuracao) {
                html += `<p><strong>Duração da aura:</strong> ${dados.auraDuracao} minutos</p>`;
            }
        }
        html += '</div>';
    }
    
    // Seção 3
    html += '<div class="relatorio-section">';
    html += '<h4>3. Localização e Duração</h4>';
    
    if (dados.localExato) {
        html += `<p><strong>Localização:</strong> ${dados.localExato}</p>`;
    } else if (dados.localInicio) {
        html += `<p><strong>Localização:</strong> ${formatarLocalInicio(dados.localInicio)}</p>`;
    }
    
    if (dados.mesmoLado && dados.mesmoLado !== 'na') {
        html += `<p><strong>Sempre o mesmo lado:</strong> ${dados.mesmoLado === 'sim' ? 'Sim' : 'Não'}</p>`;
    }
    
    if (dados.duracaoSemMedValor && dados.duracaoSemMedUnidade) {
        html += `<p><strong>Duração sem medicação:</strong> ${dados.duracaoSemMedValor} ${dados.duracaoSemMedUnidade}</p>`;
    } else if (dados.duracaoSemMedicacao) {
        html += `<p><strong>Duração sem medicação:</strong> ${formatarDuracaoSemMed(dados.duracaoSemMedicacao)}</p>`;
    }
    
    if (dados.criseLonga || dados.criseMuitoLonga) {
        html += '<p><strong>Crises com duração extrema:</strong></p><ul>';
        if (dados.criseLonga) html += '<li>Já teve crises durando mais de 3 horas</li>';
        if (dados.criseMuitoLonga) html += '<li>Já teve crises durando mais de 3 dias</li>';
        html += '</ul>';
    }
    html += '</div>';
    
    // Seção 4
    html += '<div class="relatorio-section">';
    html += '<h4>4. Qualidade e Intensidade da Dor</h4>';
    
    if (dados.qualidadeDor.length > 0) {
        html += '<p><strong>Tipo de dor:</strong> ' + dados.qualidadeDor.map(q => formatarQualidadeDor(q)).join(', ') + '</p>';
    }
    if (dados.qualidadeOutra) {
        html += `<p><strong>Outro tipo:</strong> ${dados.qualidadeOutra}</p>`;
    }
    
    html += `<p><strong>Intensidade inicial:</strong> ${dados.intensidadeInicial || 0}/10</p>`;
    html += `<p><strong>Intensidade máxima:</strong> ${dados.intensidadeMaxima || 0}/10</p>`;
    
    if (dados.tempoMaxExato) {
        html += `<p><strong>Tempo para intensidade máxima:</strong> ${dados.tempoMaxExato} minutos</p>`;
    } else if (dados.tempoMax) {
        html += `<p><strong>Tempo para intensidade máxima:</strong> ${formatarTempoMax(dados.tempoMax)}</p>`;
    }
    html += '</div>';
    
    // Seção 5
    html += '<div class="relatorio-section">';
    html += '<h4>5. Horário e Despertar</h4>';
    if (dados.horarioCrise) {
        html += `<p><strong>Horário típico:</strong> ${formatarHorario(dados.horarioCrise)}</p>`;
    }
    if (dados.acordaSono) {
        html += `<p><strong>Acorda do sono:</strong> ${formatarAcordaSono(dados.acordaSono)}</p>`;
    }
    html += '</div>';
    
    // Seção 6
    if (dados.sintomas.length > 0 || dados.peleSensivel) {
        html += '<div class="relatorio-section">';
        html += '<h4>6. Sintomas Associados</h4>';
        
        if (dados.sintomas.length > 0 && !dados.sintomas.includes('nenhum')) {
            html += '<p><strong>Sintomas durante a crise:</strong></p><ul>';
            dados.sintomas.forEach(sintoma => {
                html += `<li>${formatarSintoma(sintoma)}</li>`;
            });
            html += '</ul>';
        }
        
        if (dados.peleSensivel && dados.peleSensivel !== 'nao') {
            html += `<p><strong>Pele sensível:</strong> ${formatarPeleSensivel(dados.peleSensivel)}</p>`;
        }
        html += '</div>';
    }
    
    // Seção 7
    if (dados.comportamento) {
        html += '<div class="relatorio-section">';
        html += '<h4>7. Comportamento Durante a Crise</h4>';
        html += `<p><strong>Preferência:</strong> ${formatarComportamento(dados.comportamento)}</p>`;
        html += '</div>';
    }
    
    // Seção 8
    html += '<div class="relatorio-section">';
    html += '<h4>8. Duração e Pós-Crise</h4>';
    
    if (dados.duracaoIntensaValor && dados.duracaoIntensaUnidade) {
        html += `<p><strong>Duração da dor intensa:</strong> ${dados.duracaoIntensaValor} ${dados.duracaoIntensaUnidade}</p>`;
    } else if (dados.duracao) {
        html += `<p><strong>Duração da dor intensa:</strong> ${formatarDuracao(dados.duracao)}</p>`;
    }
    
    if (dados.posCrise.length > 0 && !dados.posCrise.includes('normal')) {
        html += '<p><strong>Após a crise:</strong></p><ul>';
        dados.posCrise.forEach(pos => {
            html += `<li>${formatarPosCrise(pos)}</li>`;
        });
        html += '</ul>';
    } else if (dados.posCrise.includes('normal')) {
        html += '<p><strong>Após a crise:</strong> Volta ao normal imediatamente</p>';
    }
    
    if (dados.posObservacoes) {
        html += `<p><strong>Observações pós-crise:</strong> ${dados.posObservacoes}</p>`;
    }
    
    if (dados.entreCrises) {
        html += `<p><strong>Sintomas entre crises:</strong> ${formatarEntreCrises(dados.entreCrises)}</p>`;
    }
    html += '</div>';
    
    // Seção 9
    if (dados.gatilhos.length > 0 || dados.gatilhosOutros) {
        html += '<div class="relatorio-section">';
        html += '<h4>9. Gatilhos Identificados</h4>';
        
        if (dados.gatilhos.length > 0 && !dados.gatilhos.includes('nenhum')) {
            html += '<p><strong>Gatilhos:</strong></p><ul>';
            dados.gatilhos.forEach(gatilho => {
                html += `<li>${formatarGatilho(gatilho)}</li>`;
            });
            html += '</ul>';
        }
        
        if (dados.gatilhosOutros) {
            html += `<p><strong>Outros gatilhos:</strong> ${dados.gatilhosOutros}</p>`;
        }
        html += '</div>';
    }
    
    // Seção 10
    html += '<div class="relatorio-section">';
    html += '<h4>10. Impacto na Vida</h4>';
    
    if (dados.impactoDiasExato) {
        html += `<p><strong>Dias de impacto por mês:</strong> ${dados.impactoDiasExato} dias</p>`;
    } else if (dados.impactoDias) {
        html += `<p><strong>Dias de impacto por mês:</strong> ${formatarImpactoDias(dados.impactoDias)}</p>`;
    }
    
    if (dados.impactoEntre) {
        html += `<p><strong>Impacto entre crises:</strong> ${formatarImpactoEntre(dados.impactoEntre)}</p>`;
    }
    html += '</div>';
    
    // MIDAS
    if (dados.midas && dados.midas.total > 0) {
        html += '<div class="relatorio-section">';
        html += '<h4>Escala MIDAS</h4>';
        html += `<p><strong>Pontuação total:</strong> ${dados.midas.total}</p>`;
        html += `<p><strong>Interpretação:</strong> ${dados.midas.interpretacao}</p>`;
        html += '<p><strong>Detalhamento:</strong></p><ul>';
        html += `<li>Dias perdidos de trabalho/escola: ${dados.midas.q1}</li>`;
        html += `<li>Produtividade reduzida no trabalho: ${dados.midas.q2} dias</li>`;
        html += `<li>Tarefas domésticas impedidas: ${dados.midas.q3} dias</li>`;
        html += `<li>Tarefas domésticas reduzidas: ${dados.midas.q4} dias</li>`;
        html += `<li>Atividades sociais/lazer perdidas: ${dados.midas.q5} dias</li>`;
        html += '</ul></div>';
    }
    
    // GAD-7
    if (dados.gad7 && dados.gad7.total > 0) {
        html += '<div class="relatorio-section">';
        html += '<h4>Escala GAD-7 (Ansiedade)</h4>';
        html += `<p><strong>Pontuação total:</strong> ${dados.gad7.total}</p>`;
        html += `<p><strong>Interpretação:</strong> ${dados.gad7.interpretacao}</p>`;
        html += '</div>';
    }
    
    return html;
}

// Funções adicionais de formatação
function formatarComportamento(comp) {
    const mapa = {
        'deitar': 'Deitar imóvel no escuro e em silêncio',
        'sentar': 'Sentar quieto, evitando movimento',
        'andar': 'Andar, balançar ou se mexer',
        'nenhum': 'Tanto faz, a posição não influencia'
    };
    return mapa[comp] || comp;
}

function formatarDuracao(duracao) {
    const mapa = {
        '15_180': '15-180 minutos (15min a 3 horas)',
        '4_72': '4-72 horas (4h a 3 dias)',
        'mais_72': 'Mais de 72 horas (mais de 3 dias)'
    };
    return mapa[duracao] || duracao;
}

function formatarPosCrise(pos) {
    const mapa = {
        'fadiga': 'Fadiga, cansaço ou sensação de "ressaca"',
        'confusao': 'Confusão mental ou lentidão de raciocínio',
        'fome': 'Fome excessiva ou alterações intestinais',
        'normal': 'Volta ao normal imediatamente'
    };
    return mapa[pos] || pos;
}

function formatarImpactoDias(impacto) {
    const mapa = {
        '0_3': '0-3 dias',
        '4_9': '4-9 dias',
        '10_mais': '10 ou mais dias'
    };
    return mapa[impacto] || impacto;
}

function formatarImpactoEntre(impacto) {
    const mapa = {
        'sim': 'Sim, me preocupo e altero planos com frequência',
        'pouco': 'Às vezes me preocupo, mas não altera muito minha vida',
        'nao': 'Não me preocupo entre as crises'
    };
    return mapa[impacto] || impacto;
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
        'visual': 'Aura visual',
        'sensitiva': 'Aura sensitiva',
        'fala': 'Aura de fala',
        'motora': 'Aura motora',
        'nenhum': 'Nenhum'
    };
    return mapa[aura] || aura;
}

function formatarLocalInicio(local) {
    const mapa = {
        'pescoco': 'Pescoço',
        'olho_temporal': 'Ao redor de um olho ou região temporal',
        'um_lado': 'Um lado da cabeça',
        'ambos': 'Ambos os lados',
        'toda': 'Toda a cabeça'
    };
    return mapa[local] || local;
}

function formatarQualidadeDor(qualidade) {
    const mapa = {
        'pulsatil': 'Pulsátil ou latejante',
        'pressao': 'Pressão ou aperto',
        'perfuracao': 'Perfuração ou facada',
        'queimacao': 'Queimação ou dor aguda'
    };
    return mapa[qualidade] || qualidade;
}

function formatarTempoMax(tempo) {
    const mapa = {
        'menos_5': 'Menos de 5 minutos',
        '5_30': '5-30 minutos',
        '30_120': '30 minutos a 2 horas',
        'mais_120': 'Mais de 2 horas'
    };
    return mapa[tempo] || tempo;
}

function formatarHorario(horario) {
    const mapa = {
        'manha': 'Ao acordar pela manhã',
        'dia': 'Durante o dia',
        'noite': 'Noite ou madrugada',
        'sem_padrao': 'Sem padrão definido'
    };
    return mapa[horario] || horario;
}

function formatarAcordaSono(acorda) {
    const mapa = {
        'toda_semana': 'Sim, toda semana',
        'frequentemente': 'Sim, frequentemente (2-3 vezes por mês)',
        'raramente': 'Sim, mas raramente (menos de 1 vez por mês)',
        'nao': 'Não, nunca acorda do sono'
    };
    return mapa[acorda] || acorda;
}

function formatarSintoma(sintoma) {
    const mapa = {
        'fotofobia': 'Fotofobia',
        'fonofobia': 'Fonofobia',
        'osmofobia': 'Osmofobia',
        'nausea': 'Náusea',
        'vomito': 'Vômito',
        'olho_vermelho': 'Olho vermelho e lacrimejando',
        'nariz_entupido': 'Nariz entupido ou escorrendo',
        'palpebra_caida': 'Pálpebra caída ou pupila menor',
        'nenhum': 'Nenhum'
    };
    return mapa[sintoma] || sintoma;
}

function formatarPeleSensivel(pele) {
    const mapa = {
        'sim': 'Couro cabeludo dolorido ao toque',
        'rosto': 'Rosto sensível ao toque',
        'nao': 'Não'
    };
    return mapa[pele] || pele;
}

function formatarDuracaoSemMed(duracao) {
    const mapa = {
        'menos_4h': 'Menos de 4 horas',
        '4_72h': 'Entre 4 e 72 horas',
        'mais_72h': 'Mais de 72 horas'
    };
    return mapa[duracao] || duracao;
}

function formatarEntreCrises(entre) {
    const mapa = {
        'frequentemente': 'Frequentemente (mais da metade dos dias)',
        'metade': 'Metade dos dias',
        'raramente': 'Raramente (menos de 2 dias por semana)',
        'nao': 'Não'
    };
    return mapa[entre] || entre;
}

function formatarGatilho(gatilho) {
    const mapa = {
        'estresse': 'Estresse emocional ou físico',
        'sono': 'Mudanças no sono',
        'refeicao': 'Pular refeições ou jejum',
        'alcool': 'Consumo de álcool',
        'odor': 'Odores fortes',
        'tempo': 'Mudanças climáticas',
        'hormonal': 'Mudanças hormonais',
        'alimentos': 'Alimentos específicos',
        'luz': 'Luzes fortes ou piscantes',
        'nenhum': 'Não consigo identificar'
    };
    return mapa[gatilho] || gatilho;
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

// Função para baixar PDF
function baixarPDF() {
    const dadosSalvos = JSON.parse(sessionStorage.getItem('relatorio_completo'));
    if (!dadosSalvos) {
        alert('Erro ao gerar PDF. Dados não encontrados.');
        return;
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    let yPosition = 20;
    const lineHeight = 7;
    const pageHeight = doc.internal.pageSize.height;
    
    // Título
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('Questionário de Cefaleia - Relatório', 105, yPosition, { align: 'center' });
    yPosition += lineHeight * 2;
    
    // Informações básicas
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(`ID: #${dadosSalvos.id}`, 20, yPosition);
    yPosition += lineHeight;
    doc.text(`Data e Hora: ${dadosSalvos.timestamp}`, 20, yPosition);
    yPosition += lineHeight * 2;
    
    // Dados do formulário
    const dados = dadosSalvos.dados;
    
    // Função auxiliar para adicionar seção
    function adicionarSecao(titulo, conteudo) {
        // Verificar se precisa nova página
        if (yPosition + (conteudo.length * lineHeight) + 20 > pageHeight - 20) {
            doc.addPage();
            yPosition = 20;
        }
        
        doc.setFont(undefined, 'bold');
        doc.text(titulo, 20, yPosition);
        yPosition += lineHeight;
        
        doc.setFont(undefined, 'normal');
        conteudo.forEach(linha => {
            if (yPosition > pageHeight - 20) {
                doc.addPage();
                yPosition = 20;
            }
            
            // Quebrar linhas longas
            const linhas = doc.splitTextToSize(linha, 170);
            linhas.forEach(l => {
                doc.text(l, 25, yPosition);
                yPosition += lineHeight;
            });
        });
        
        yPosition += lineHeight;
    }
    
    // Seção 1
    const secao1 = [];
    if (dados.idadeExata) {
        secao1.push(`Idade de início: ${dados.idadeExata} anos`);
    } else if (dados.idadeInicio) {
        secao1.push(`Idade de início: ${formatarIdadeInicio(dados.idadeInicio)}`);
    }
    
    if (dados.crisesMesExato) {
        secao1.push(`Frequência: ${dados.crisesMesExato} crises por mês`);
    } else if (dados.crisesMes) {
        secao1.push(`Frequência: ${formatarFrequencia(dados.crisesMes)}`);
    }
    
    if (dados.diasLivreExato) {
        secao1.push(`Dias livres de dor: ${dados.diasLivreExato} dias por mês`);
    } else if (dados.diasLivre) {
        secao1.push(`Dias livres de dor: ${formatarDiasLivres(dados.diasLivre)}`);
    }
    
    if (secao1.length > 0) {
        adicionarSecao('1. Idade de Início e Frequência', secao1);
    }
    
    // Seção 2
    const secao2 = [];
    if (dados.sinaisAviso.length > 0 && !dados.sinaisAviso.includes('nenhum')) {
        secao2.push('Sinais de aviso: ' + dados.sinaisAviso.map(s => formatarSinalAviso(s)).join(', '));
    }
    
    if (dados.aura.length > 0 && !dados.aura.includes('nenhum')) {
        secao2.push('Aura: ' + dados.aura.map(a => formatarAura(a)).join(', '));
        if (dados.auraPercentual) secao2.push(`Frequência da aura: ${dados.auraPercentual}% das crises`);
        if (dados.auraTiming) secao2.push(`Timing: ${dados.auraTiming === 'junto' ? 'Junto com a dor' : 'Até 1h antes da dor'}`);
        if (dados.auraDuracao) secao2.push(`Duração da aura: ${dados.auraDuracao} minutos`);
    }
    
    if (secao2.length > 0) {
        adicionarSecao('2. Sinais de Aviso e Aura', secao2);
    }
    
    // Seção 3
    const secao3 = [];
    if (dados.localExato) {
        secao3.push(`Localização: ${dados.localExato}`);
    } else if (dados.localInicio) {
        secao3.push(`Localização: ${formatarLocalInicio(dados.localInicio)}`);
    }
    
    if (dados.mesmoLado && dados.mesmoLado !== 'na') {
        secao3.push(`Sempre o mesmo lado: ${dados.mesmoLado === 'sim' ? 'Sim' : 'Não'}`);
    }
    
    if (dados.duracaoSemMedValor && dados.duracaoSemMedUnidade) {
        secao3.push(`Duração sem medicação: ${dados.duracaoSemMedValor} ${dados.duracaoSemMedUnidade}`);
    } else if (dados.duracaoSemMedicacao) {
        secao3.push(`Duração sem medicação: ${formatarDuracaoSemMed(dados.duracaoSemMedicacao)}`);
    }
    
    if (dados.criseLonga) secao3.push('Já teve crises durando mais de 3 horas');
    if (dados.criseMuitoLonga) secao3.push('Já teve crises durando mais de 3 dias');
    
    if (secao3.length > 0) {
        adicionarSecao('3. Localização e Duração', secao3);
    }
    
    // Seção 4
    const secao4 = [];
    if (dados.qualidadeDor.length > 0) {
        secao4.push('Tipo de dor: ' + dados.qualidadeDor.map(q => formatarQualidadeDor(q)).join(', '));
    }
    if (dados.qualidadeOutra) secao4.push(`Outro tipo: ${dados.qualidadeOutra}`);
    if (dados.intensidadeInicial) secao4.push(`Intensidade inicial: ${dados.intensidadeInicial}/10`);
    if (dados.intensidadeMaxima) secao4.push(`Intensidade máxima: ${dados.intensidadeMaxima}/10`);
    
    if (dados.tempoMaxExato) {
        secao4.push(`Tempo para intensidade máxima: ${dados.tempoMaxExato} minutos`);
    } else if (dados.tempoMax) {
        secao4.push(`Tempo para intensidade máxima: ${formatarTempoMax(dados.tempoMax)}`);
    }
    
    if (secao4.length > 0) {
        adicionarSecao('4. Qualidade e Intensidade', secao4);
    }
    
    // Seção 5
    const secao5 = [];
    if (dados.horarioCrise) secao5.push(`Horário típico: ${formatarHorario(dados.horarioCrise)}`);
    if (dados.acordaSono) secao5.push(`Acorda do sono: ${formatarAcordaSono(dados.acordaSono)}`);
    
    if (secao5.length > 0) {
        adicionarSecao('5. Horário e Despertar', secao5);
    }
    
    // Seção 6
    const secao6 = [];
    if (dados.sintomas.length > 0 && !dados.sintomas.includes('nenhum')) {
        secao6.push('Sintomas associados: ' + dados.sintomas.map(s => formatarSintoma(s)).join(', '));
    }
    if (dados.peleSensivel && dados.peleSensivel !== 'nao') {
        secao6.push(`Pele sensível: ${formatarPeleSensivel(dados.peleSensivel)}`);
    }
    
    if (secao6.length > 0) {
        adicionarSecao('6. Sintomas Associados', secao6);
    }
    
    // Seções 7-10 e escalas...
    // (código similar para outras seções)
    
    // MIDAS
    if (dados.midas && dados.midas.total > 0) {
        adicionarSecao('Escala MIDAS', [
            `Pontuação total: ${dados.midas.total}`,
            `Interpretação: ${dados.midas.interpretacao}`
        ]);
    }
    
    // GAD-7
    if (dados.gad7 && dados.gad7.total > 0) {
        adicionarSecao('Escala GAD-7', [
            `Pontuação total: ${dados.gad7.total}`,
            `Interpretação: ${dados.gad7.interpretacao}`
        ]);
    }
    
    // Salvar PDF
    const nomeArquivo = `questionario_cefaleia_${dadosSalvos.id}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(nomeArquivo);
}

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

// Configurar seletores de duração (horas ou minutos)
function configurarSelectoresDuracao() {
    const duracaoSelectors = document.querySelectorAll('.duracao-selector');
    
    duracaoSelectors.forEach(selector => {
        const input = selector.parentElement.querySelector('.duracao-input');
        const label = selector.parentElement.querySelector('.duracao-label');
        
        selector.addEventListener('change', function() {
            if (this.value) {
                input.style.display = 'inline-block';
                label.style.display = 'inline';
                label.textContent = this.value;
                input.placeholder = this.value === 'horas' ? 'Ex: 4' : 'Ex: 30';
                
                // Se tem número exato, desabilita as opções de múltipla escolha
                if (input.classList.contains('numero-exato')) {
                    const grupoRadio = input.closest('.question-group').querySelectorAll('input[type="radio"]');
                    input.addEventListener('input', function() {
                        if (this.value.trim() !== '') {
                            grupoRadio.forEach(radio => {
                                radio.disabled = true;
                                radio.checked = false;
                            });
                        } else {
                            grupoRadio.forEach(radio => {
                                radio.disabled = false;
                            });
                        }
                    });
                    
                    grupoRadio.forEach(radio => {
                        radio.addEventListener('change', function() {
                            if (this.checked) {
                                input.value = '';
                                selector.value = '';
                                input.style.display = 'none';
                                label.style.display = 'none';
                            }
                        });
                    });
                }
            } else {
                input.style.display = 'none';
                label.style.display = 'none';
                input.value = '';
            }
        });
    });
} 