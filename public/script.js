const form = document.querySelector('#url-form');
const input = document.querySelector('#url-input');
const button = document.querySelector('#verify-button');
const feedback = document.querySelector('#form-feedback');
const resultSection = document.querySelector('#result-section');
const resultCard = document.querySelector('#result-card');
const scrollBehavior = () => document.documentElement.classList.contains('a11y-reduce-motion') ? 'auto' : 'smooth';

// Ao abrir a página inicial sem um link interno (#...), comece no topo.
if (!window.location.hash) {
  history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);
}

const resultContent = {
  SAFE: {
    icon: '✓',
    label: 'CONFIÁVEL',
    title: 'Nenhuma ameaça conhecida',
    defaultMessage: 'Não foram encontradas ameaças conhecidas associadas a esta URL.',
    className: 'status-safe'
  },
  DANGER: {
    icon: '!',
    label: 'ALTO RISCO',
    title: 'Possível ameaça identificada',
    defaultMessage: 'Esta URL foi identificada como potencialmente perigosa.',
    className: 'status-danger'
  },
  UNKNOWN: {
    icon: '?',
    label: 'ATENÇÃO',
    title: 'Não foi possível determinar',
    defaultMessage: 'Não foi possível determinar o risco desta URL neste momento.',
    className: 'status-unknown'
  }
};

function normalizeUrlOnClient(value) {
  const cleanValue = value.trim();
  if (!cleanValue) return null;

  const valueWithProtocol = /^https?:\/\//i.test(cleanValue)
    ? cleanValue
    : `https://${cleanValue}`;

  try {
    const parsedUrl = new URL(valueWithProtocol);
    return (
      ['http:', 'https:'].includes(parsedUrl.protocol) &&
      parsedUrl.hostname &&
      !parsedUrl.username &&
      !parsedUrl.password
    )
      ? valueWithProtocol
      : null;
  } catch {
    return null;
  }
}

function showFeedback(message = '') {
  feedback.textContent = message;
  input.setAttribute('aria-invalid', String(Boolean(message)));
}

function setLoading(isLoading) {
  button.disabled = isLoading;
  button.classList.toggle('is-loading', isLoading);
  button.querySelector('.button-label').textContent = isLoading
    ? 'Verificando...'
    : 'Analisar link';
}

function showResult(data) {
  const content = resultContent[data.status] || resultContent.UNKNOWN;
  const threatDetail = document.querySelector('#threat-detail');
  const threatTypes = document.querySelector('#threat-types');
  const vtDetail = document.querySelector('#vt-detail');
  const vtText = document.querySelector('#vt-text');

  resultCard.className = `result-card ${content.className}`;
  document.querySelector('#result-icon').textContent = content.icon;
  document.querySelector('#result-status').textContent = content.label;
  document.querySelector('#result-title').textContent = content.title;
  document.querySelector('#result-message').textContent = data.message || content.defaultMessage;
  document.querySelector('#result-url').textContent = data.url;

  if (data.status === 'DANGER' && Array.isArray(data.threatTypes) && data.threatTypes.length) {
    threatTypes.textContent = data.threatTypes.join(', ');
    threatDetail.hidden = false;
  } else {
    threatDetail.hidden = true;
  }

  if (data.virusTotal?.available) {
    const { malicious = 0, suspicious = 0, harmless = 0, undetected = 0 } = data.virusTotal;
    vtText.textContent = `${malicious} detecção(ões) maliciosa(s), ${suspicious} suspeita(s), ${harmless} inofensiva(s) e ${undetected} sem detecção informadas pelo VirusTotal.`;
    vtDetail.hidden = false;
  } else {
    vtDetail.hidden = true;
  }

  resultSection.hidden = false;
  resultSection.scrollIntoView({ behavior: scrollBehavior(), block: 'center' });
}

document.querySelector('#new-check-button').addEventListener('click', () => {
  resultSection.hidden = true;
  form.reset();
  showFeedback();
  input.focus();
  document.querySelector('#inicio').scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  showFeedback();

  const url = normalizeUrlOnClient(input.value);
  if (!input.value.trim()) {
    showFeedback('Digite uma URL para verificar.');
    input.focus();
    return;
  }

  if (!url) {
    showFeedback('Digite uma URL válida.');
    input.focus();
    return;
  }

  setLoading(true);
  input.setAttribute('aria-invalid', 'false');

  try {
    const response = await fetch('/api/check-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    const data = await response.json();

    if (data.status) {
      showResult(data);
      if (data.error) showFeedback(data.error);
    } else {
      showFeedback(data.error || 'Algo deu errado. Tente novamente.');
    }
  } catch {
    showResult({
      status: 'UNKNOWN',
      url,
      message: 'Não foi possível determinar o risco desta URL neste momento.'
    });
    showFeedback('Não foi possível realizar a verificação agora.');
  } finally {
    setLoading(false);
  }
});

// Menu simples para telas pequenas.
const menuButton = document.querySelector('.menu-button');
const mainMenu = document.querySelector('#main-menu');

menuButton.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!isOpen));
  mainMenu.classList.toggle('open', !isOpen);
});

mainMenu.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    menuButton.setAttribute('aria-expanded', 'false');
    mainMenu.classList.remove('open');
  });
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
    menuButton.setAttribute('aria-expanded', 'false');
    mainMenu.classList.remove('open');
    menuButton.focus();
  }
});

// Orientações curtas para situações de fraude. Não coleta nem salva dados.
const incidents = {
  senha: {
    title: 'Você informou uma senha?',
    actions: ['Altere a senha imediatamente pelo canal oficial.', 'Encerre sessões desconhecidas e ative a autenticação em duas etapas.', 'Se a senha era de banco, entre em contato com a instituição usando o aplicativo ou número oficial.'],
    source: 'https://cartilha.cert.br/'
  },
  pix: {
    title: 'Você fez um Pix para um possível golpista?',
    actions: ['Entre em contato com seu banco imediatamente pelo aplicativo ou canal oficial.', 'Peça orientação sobre a contestação e o Mecanismo Especial de Devolução (MED).', 'Guarde comprovantes e mensagens. Registrar um boletim de ocorrência também pode ajudar.'],
    source: 'https://www.bcb.gov.br/estabilidadefinanceira/pix-seguranca'
  },
  conta: {
    title: 'Você perdeu o acesso a uma conta?',
    actions: ['Use somente a recuperação oficial da plataforma.', 'Troque a senha do e-mail associado, pois ele pode permitir recuperar outras contas.', 'Avise contatos próximos caso o golpista possa se passar por você.'],
    source: 'https://cartilha.cert.br/'
  },
  link: {
    title: 'Você clicou em um link suspeito?',
    actions: ['Feche a página e não informe dados, senhas ou códigos.', 'Se você informou algum dado, escolha a opção correspondente acima e aja imediatamente.', 'Atualize o navegador e o sistema; se houver sinais de comprometimento, procure suporte confiável.'],
    source: 'https://www.gov.br/anatel/pt-br/assuntos/dicas-contra-fraudes/dicas-de-seguranca-contra-fraudes'
  }
};

const incidentResult = document.querySelector('#incident-result');
document.querySelectorAll('[data-incident]').forEach((button) => {
  button.addEventListener('click', () => {
    const incident = incidents[button.dataset.incident];
    document.querySelectorAll('[data-incident]').forEach((item) => item.setAttribute('aria-pressed', 'false'));
    button.setAttribute('aria-pressed', 'true');
    document.querySelector('#incident-title').textContent = incident.title;
    document.querySelector('#incident-actions').innerHTML = `<ul>${incident.actions.map((action) => `<li>${action}</li>`).join('')}</ul>`;
    document.querySelector('#incident-source').href = incident.source;
    incidentResult.hidden = false;
  });
});
