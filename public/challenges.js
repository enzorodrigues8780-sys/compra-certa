const questions = [
  { channel: 'MENSAGEM FICTÍCIA', title: 'Um pedido urgente', message: '“Seu acesso será interrompido hoje. Confirme agora para evitar bloqueio.”', answers: ['O prazo curto e a pressão para agir', 'A mensagem usa poucas palavras', 'A mensagem chegou no celular'], correct: 0, explanation: 'Urgência pode ser usada para reduzir seu tempo de verificar. Abra o canal oficial por conta própria antes de agir.' },
  { channel: 'E-MAIL FICTÍCIO', title: 'Um código de confirmação', message: '“Para concluir a atualização, responda com o código que acabou de chegar por SMS.”', answers: ['O pedido de um código de confirmação', 'O e-mail tem uma saudação', 'A mensagem menciona atualização'], correct: 0, explanation: 'Códigos de confirmação podem autorizar acesso ou troca de senha. Eles não devem ser compartilhados.' },
  { channel: 'OFERTA FICTÍCIA', title: 'Preço muito baixo', message: '“Últimas unidades: pague por transferência em 5 minutos e garanta 90% de desconto.”', answers: ['A combinação de desconto extremo, prazo e pagamento pressionado', 'O produto parece popular', 'A frase tem letras maiúsculas'], correct: 0, explanation: 'Nenhum elemento prova fraude sozinho, mas preço extremo, urgência e pressão para pagar são sinais para parar e confirmar.' },
  { channel: 'LIGAÇÃO FICTÍCIA', title: 'A central “de segurança”', message: '“Sou do suporte. Instale este aplicativo para eu resolver o problema da sua conta.”', answers: ['O pedido para instalar aplicativo durante uma ligação inesperada', 'A pessoa se apresentou como suporte', 'A ligação foi rápida'], correct: 0, explanation: 'Desligue e procure a instituição por um número ou aplicativo oficial. Não instale apps a pedido de desconhecidos.' },
  { channel: 'REDE SOCIAL FICTÍCIA', title: 'Uma notícia alarmante', message: '“Compartilhe antes que apaguem! Esta informação é urgente e todos precisam saber.”', answers: ['O apelo emocional para compartilhar sem checar a fonte', 'A publicação usa ponto de exclamação', 'A postagem fala de um assunto importante'], correct: 0, explanation: 'Antes de compartilhar, procure fonte original, data, contexto e confirmação independente. Urgência não é evidência.' }
];

let currentQuestion = 0;
let score = 0;
let answered = false;
const card = document.querySelector('#challenge-card');

function renderQuestion() {
  const question = questions[currentQuestion];
  answered = false;
  document.querySelector('#scenario-channel').textContent = question.channel;
  document.querySelector('#scenario-title').textContent = question.title;
  document.querySelector('#scenario-message').textContent = question.message;
  document.querySelector('#progress-text').textContent = `Pergunta ${currentQuestion + 1} de ${questions.length}`;
  document.querySelector('#score-text').textContent = `${score} ${score === 1 ? 'ponto' : 'pontos'}`;
  document.querySelector('#progress-bar').style.width = `${((currentQuestion + 1) / questions.length) * 100}%`;
  const answers = document.querySelector('#answer-list');
  answers.innerHTML = '';
  question.answers.forEach((answer, index) => {
    const button = document.createElement('button');
    button.type = 'button'; button.textContent = answer;
    button.addEventListener('click', () => answerQuestion(index));
    answers.appendChild(button);
  });
  document.querySelector('#answer-feedback').hidden = true;
}

function answerQuestion(answerIndex) {
  if (answered) return;
  answered = true;
  const question = questions[currentQuestion];
  const buttons = document.querySelectorAll('#answer-list button');
  buttons.forEach((button, index) => {
    button.disabled = true;
    if (index === question.correct) {
      button.classList.add('correct');
      button.textContent = `✓ ${question.answers[index]}`;
    }
    if (index === answerIndex && index !== question.correct) {
      button.classList.add('incorrect');
      button.textContent = `✕ ${question.answers[index]}`;
    }
  });
  const correct = answerIndex === question.correct;
  if (correct) score += 1;
  document.querySelector('#score-text').textContent = `${score} ${score === 1 ? 'ponto' : 'pontos'}`;
  document.querySelector('#feedback-title').textContent = correct ? 'Boa observação.' : 'Vale revisar este sinal.';
  document.querySelector('#feedback-text').textContent = question.explanation;
  const next = document.querySelector('#next-button');
  next.textContent = currentQuestion === questions.length - 1 ? 'Ver resultado' : 'Próxima pergunta →';
  document.querySelector('#answer-feedback').hidden = false;
}

function goToNextQuestion() {
  if (currentQuestion < questions.length - 1) { currentQuestion += 1; renderQuestion(); return; }
  card.innerHTML = `<p class="fiction-tag">DESAFIO CONCLUÍDO</p><h3>Você marcou ${score} de ${questions.length}.</h3><p class="scenario-message">O objetivo não é acertar tudo de primeira: é criar o hábito de parar, confirmar a origem e não agir sob pressão.</p><a class="finish-link" href="aprenda.html">Revisar os guias →</a>`;
  document.querySelector('#restart-button').hidden = false;
}

document.querySelector('#next-button').addEventListener('click', goToNextQuestion);

document.querySelector('#restart-button').addEventListener('click', () => { currentQuestion = 0; score = 0; card.innerHTML = `<p class="fiction-tag">EXEMPLO FICTÍCIO</p><p class="scenario-channel" id="scenario-channel"></p><h3 id="scenario-title"></h3><div class="scenario-message" id="scenario-message"></div><p class="question">Qual é o principal sinal de alerta?</p><div class="answer-list" id="answer-list"></div><div class="answer-feedback" id="answer-feedback" hidden><strong id="feedback-title"></strong><p id="feedback-text"></p><button type="button" id="next-button">Próxima pergunta →</button></div>`; document.querySelector('#next-button').addEventListener('click', goToNextQuestion); document.querySelector('#restart-button').hidden = true; renderQuestion(); });

document.querySelectorAll('[data-decision]').forEach((button) => button.addEventListener('click', () => { document.querySelector('#decision-feedback').textContent = button.dataset.decision === 'pause' ? 'Isso mesmo. Pare e confirme no aplicativo, site ou telefone oficial. Não escaneie um QR Code inesperado.' : 'Cuidado: QR Codes podem levar a páginas de captura de dados. Quando a mensagem é inesperada, pare e confirme por outro canal.'; }));

renderQuestion();
