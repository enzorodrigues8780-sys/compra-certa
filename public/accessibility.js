(() => {
  'use strict';

  const storageKey = 'compra-certa-accessibility';
  const classes = ['a11y-high-contrast','a11y-max-contrast','a11y-low-vision','a11y-dyslexia','a11y-spaced','a11y-reading-width','a11y-paragraph-focus','a11y-reduce-motion','a11y-simple','a11y-large-targets','a11y-large-cursor','a11y-focus-strong','a11y-text-small','a11y-text-large','a11y-text-xlarge','a11y-interface-large','a11y-color-protanopia','a11y-color-protanomaly','a11y-color-deuteranopia','a11y-color-deuteranomaly','a11y-color-tritanopia','a11y-color-tritanomaly','a11y-color-achromatopsia'];
  const defaults = { textSize: 'normal', interfaceSize: false, highContrast: false, maxContrast: false, lowVision: false, dyslexia: false, spaced: false, readingWidth: false, paragraphFocus: false, reduceMotion: false, simple: false, largeTargets: false, largeCursor: false, focusStrong: false, elderly: 'normal', color: 'normal' };
  let settings = load();
  let lastFocus = null;
  let speech = null;

  function load() { try { const saved = { ...defaults, ...JSON.parse(localStorage.getItem(storageKey) || '{}') }; if (saved.color === 'mono') saved.color = 'achromatopsia'; return saved; } catch { return { ...defaults }; } }
  function save() { localStorage.setItem(storageKey, JSON.stringify(settings)); }
  function announce(message) { document.querySelector('#a11y-live').textContent = message; }
  function boolLabel(value) { return value ? 'ATIVADO' : 'DESATIVADO'; }
  function toggle(label, key, hint = '') { return `<div class="a11y-row"><label>${label}${hint ? `<small>${hint}</small>` : ''}</label><button type="button" class="a11y-toggle" data-toggle="${key}" aria-pressed="false">DESATIVADO</button></div>`; }

  function inject() {
    const main = document.querySelector('main');
    if (!main) return;
    main.id = main.id || 'conteudo-principal';
    document.body.insertAdjacentHTML('afterbegin', `<a class="skip-link" href="#${main.id}">Pular para o conteúdo principal</a><p class="a11y-live" id="a11y-live" aria-live="polite" aria-atomic="true"></p>`);
    document.body.insertAdjacentHTML('beforeend', `
      <button class="a11y-launcher" id="a11y-launcher" type="button" aria-expanded="false" aria-controls="a11y-panel" aria-label="Abrir opções de acessibilidade"><span class="a11y-launcher-icon" aria-hidden="true">♿</span><span class="a11y-launcher-text">Acessibilidade</span></button>
      <aside class="a11y-panel" id="a11y-panel" hidden aria-labelledby="a11y-title">
        <div class="a11y-panel-header"><div><h2 class="a11y-panel-title" id="a11y-title">Acessibilidade</h2><p class="a11y-panel-subtitle">Preferências salvas neste navegador</p></div><button class="a11y-close" id="a11y-close" type="button" aria-label="Fechar painel de acessibilidade">×</button></div>
        <div class="a11y-panel-content">
          <fieldset class="a11y-group"><legend>VISÃO</legend><div class="a11y-row"><label>Tamanho do texto<small>A−, normal ou A+</small></label><div class="a11y-stepper" role="group" aria-label="Tamanho do texto"><button type="button" data-text-size="small" aria-label="Texto menor">A−</button><button type="button" data-text-size="normal" aria-label="Texto normal">A</button><button type="button" data-text-size="large" aria-label="Texto maior">A+</button></div></div>${toggle('Interface maior','interfaceSize')}${toggle('Alto contraste','highContrast')}${toggle('Contraste máximo','maxContrast')}${toggle('Modo baixa visão','lowVision','Aumenta legibilidade e reduz decoração.')}<div class="a11y-row"><label for="a11y-color">Ajuste de cores<small>Visualização alternativa. Status sempre usam texto e ícone.</small></label><select id="a11y-color"><option value="normal">Padrão</option><option value="protanopia">Protanopia</option><option value="protanomaly">Protanomalia</option><option value="deuteranopia">Deuteranopia</option><option value="deuteranomaly">Deuteranomalia</option><option value="tritanopia">Tritanopia</option><option value="tritanomaly">Tritanomalia</option><option value="achromatopsia">Acromatopsia</option></select></div></fieldset>
          <fieldset class="a11y-group"><legend>LEITURA</legend>${toggle('Modo dislexia','dyslexia','Ajusta fonte e espaçamento.')}${toggle('Mais espaçamento','spaced')}${toggle('Largura confortável','readingWidth')}${toggle('Destacar parágrafos','paragraphFocus')}</fieldset>
          <fieldset class="a11y-group"><legend>NAVEGAÇÃO E MOVIMENTO</legend><div class="a11y-row"><label for="a11y-elderly">Modo idoso<small>Aumenta controles, contraste e legibilidade.</small></label><select id="a11y-elderly"><option value="normal">Normal</option><option value="large">Grande</option><option value="xlarge">Muito grande</option></select></div>${toggle('Reduzir animações','reduceMotion')}${toggle('Interface simplificada','simple')}${toggle('Áreas clicáveis maiores','largeTargets')}${toggle('Cursor maior','largeCursor')}${toggle('Destacar foco','focusStrong')}</fieldset>
          <fieldset class="a11y-group"><legend>LEITURA EM VOZ ALTA</legend><div class="a11y-row"><label>Ler esta página<small>Usa a voz disponível no navegador.</small></label><div class="a11y-stepper" role="group" aria-label="Controles de leitura em voz alta"><button type="button" id="a11y-read" aria-label="Iniciar ou continuar leitura">▶</button><button type="button" id="a11y-pause" aria-label="Pausar leitura">Ⅱ</button><button type="button" id="a11y-stop" aria-label="Parar leitura">■</button></div></div></fieldset>
          <div class="a11y-footer-actions"><button type="button" id="a11y-reset">Restaurar padrão</button><button type="button" id="a11y-save">Salvar preferências</button></div>
        </div>
      </aside>`);
  }

  function apply() {
    const html = document.documentElement;
    classes.forEach((name) => html.classList.remove(name));
    if (settings.textSize === 'small') html.classList.add('a11y-text-small');
    if (settings.textSize === 'large') html.classList.add('a11y-text-large');
    if (settings.textSize === 'xlarge') html.classList.add('a11y-text-xlarge');
    ['interfaceSize','highContrast','maxContrast','lowVision','dyslexia','spaced','readingWidth','paragraphFocus','reduceMotion','simple','largeTargets','largeCursor','focusStrong'].forEach((key) => {
      const className = key === 'interfaceSize' ? 'a11y-interface-large' : `a11y-${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`;
      if (settings[key]) html.classList.add(className);
    });
    if (settings.elderly === 'large') { html.classList.add('a11y-text-large','a11y-interface-large','a11y-high-contrast','a11y-large-targets'); }
    if (settings.elderly === 'xlarge') { html.classList.add('a11y-text-xlarge','a11y-interface-large','a11y-high-contrast','a11y-large-targets','a11y-low-vision'); }
    if (settings.color !== 'normal') html.classList.add(`a11y-color-${settings.color}`);
    document.querySelectorAll('[data-toggle]').forEach((button) => { const active = Boolean(settings[button.dataset.toggle]); button.setAttribute('aria-pressed', String(active)); button.textContent = boolLabel(active); });
    document.querySelectorAll('[data-text-size]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.textSize === settings.textSize)));
    document.querySelector('#a11y-color').value = settings.color;
    document.querySelector('#a11y-elderly').value = settings.elderly;
  }

  function closePanel() { const panel = document.querySelector('#a11y-panel'); panel.hidden = true; document.querySelector('#a11y-launcher').setAttribute('aria-expanded','false'); lastFocus?.focus(); }
  function openPanel() { lastFocus = document.activeElement; const panel = document.querySelector('#a11y-panel'); panel.hidden = false; document.querySelector('#a11y-launcher').setAttribute('aria-expanded','true'); panel.querySelector('#a11y-close').focus(); }
  function pageText() { return document.querySelector('main').innerText.replace(/\s+/g, ' ').trim().slice(0, 12000); }
  function readPage() { if (!('speechSynthesis' in window)) return announce('Leitura em voz alta não está disponível neste navegador.'); if (speech && speech.paused) { speechSynthesis.resume(); announce('Leitura retomada.'); return; } speechSynthesis.cancel(); speech = new SpeechSynthesisUtterance(pageText()); speech.lang = document.documentElement.lang || 'pt-BR'; speech.onend = () => announce('Leitura concluída.'); speech.onerror = () => announce('A leitura foi interrompida.'); speechSynthesis.speak(speech); announce('Leitura iniciada.'); }

  function bind() {
    document.querySelector('#a11y-launcher').addEventListener('click', openPanel);
    document.querySelector('#a11y-close').addEventListener('click', closePanel);
    document.querySelector('#a11y-panel').addEventListener('click', (event) => {
      const button = event.target.closest('[data-toggle]');
      if (button) {
        const key = button.dataset.toggle;
        settings[key] = !settings[key];
        // Os dois modos de contraste são alternativas; manter ambos ligados
        // deixava o estado do painel confuso para quem usa leitor de tela.
        if (key === 'highContrast' && settings[key]) settings.maxContrast = false;
        if (key === 'maxContrast' && settings[key]) settings.highContrast = false;
        apply(); save(); announce(`${button.previousElementSibling.firstChild.textContent}: ${boolLabel(settings[key])}.`);
      }
      const size = event.target.closest('[data-text-size]');
      if (size) { settings.textSize = size.dataset.textSize; apply(); save(); announce('Tamanho do texto atualizado.'); }
    });
    document.querySelector('#a11y-color').addEventListener('change', (event) => { settings.color = event.target.value; apply(); save(); announce('Ajuste de cores atualizado.'); });
    document.querySelector('#a11y-elderly').addEventListener('change', (event) => { settings.elderly = event.target.value; apply(); save(); announce('Modo idoso atualizado.'); });
    document.querySelector('#a11y-read').addEventListener('click', readPage);
    document.querySelector('#a11y-pause').addEventListener('click', () => { if ('speechSynthesis' in window) { speechSynthesis.pause(); announce('Leitura pausada.'); } });
    document.querySelector('#a11y-stop').addEventListener('click', () => { if ('speechSynthesis' in window) { speechSynthesis.cancel(); announce('Leitura parada.'); } });
    document.querySelector('#a11y-reset').addEventListener('click', () => { settings = { ...defaults }; apply(); save(); announce('Configurações restauradas ao padrão.'); });
    document.querySelector('#a11y-save').addEventListener('click', () => { save(); announce('Preferências salvas neste navegador.'); });
    document.addEventListener('keydown', (event) => { if (event.altKey && event.key.toLowerCase() === 'a') { event.preventDefault(); document.querySelector('#a11y-panel').hidden ? openPanel() : closePanel(); } if (event.key === 'Escape' && !document.querySelector('#a11y-panel').hidden) closePanel(); });
  }

  document.addEventListener('DOMContentLoaded', () => { inject(); apply(); bind(); });
})();
