# Compra Certa

O Compra Certa verifica uma URL contra as listas de ameaças conhecidas do Google Safe Browsing. Ele não abre o link informado, não faz scraping e não analisa o conteúdo de páginas, produtos ou vendedores.

> Importante: uma resposta sem ameaças conhecidas não é uma garantia de que um site seja legítimo ou totalmente seguro. A API também é destinada a uso não comercial. Consulte os termos do Google antes de publicar ou monetizar o projeto.

## O que você precisa instalar

1. **Node.js 18 ou superior**. Baixe a versão LTS em [nodejs.org](https://nodejs.org/).
2. **Visual Studio Code**. Baixe em [code.visualstudio.com](https://code.visualstudio.com/).
3. Uma chave da Google Safe Browsing API.

## Como conseguir a chave da API

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/).
2. Crie ou selecione um projeto.
3. Vá em **APIs e serviços > Biblioteca** e habilite a **Safe Browsing API**.
4. Vá em **APIs e serviços > Credenciais**.
5. Clique em **Criar credenciais > Chave de API**.
6. Copie a chave. Para uso real, restrinja essa chave no Google Cloud Console.

Documentação oficial usada pelo projeto: [Safe Browsing `urls.search` (v5)](https://developers.google.com/safe-browsing/reference/rest/v5/urls/search).

## Como executar no Windows com o VS Code

1. Abra o VS Code.
2. Clique em **Arquivo > Abrir Pasta** e selecione a pasta `compra-certa`.
3. No menu superior, clique em **Terminal > Novo Terminal**.
4. No terminal, execute:

   ```powershell
   npm install
   ```

   Esse comando baixa apenas o Express e o dotenv, que são necessários para o servidor.

5. Na raiz da pasta `compra-certa`, abra o arquivo chamado `.env`.
6. Substitua `sua_chave_aqui` pela chave criada no Google Cloud. O arquivo deve ficar assim:

   ```env
   GOOGLE_SAFE_BROWSING_API_KEY=sua_chave_da_google_aqui
   ```

   Não coloque aspas e não compartilhe essa chave. O arquivo `.env` já está no `.gitignore`, portanto não deve ser enviado para o Git.

7. Ainda no terminal, inicie o projeto:

   ```powershell
   node server.js
   ```

8. Abra o navegador em [http://localhost:3000](http://localhost:3000).
9. Cole uma URL, como `https://example.com`, e clique em **Verificar link**.

## Como parar e reiniciar

- Para parar o servidor, clique no terminal do VS Code e pressione `Ctrl + C`.
- Para iniciar novamente, execute `node server.js` outra vez.
- Depois de editar `server.js`, pare o servidor com `Ctrl + C` e inicie-o de novo.
- Alterações em `public/index.html`, `public/style.css` ou `public/script.js` aparecem ao atualizar a página do navegador.

## Estrutura dos arquivos

```text
compra-certa/
├── server.js
├── .env
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── public/
    ├── index.html
    ├── style.css
    └── script.js
```

## O que cada arquivo faz

- `server.js`: é o backend. Inicia o Express, entrega o site, recebe a URL, valida a entrada e consulta a API do Google sem expor a chave.
- `.env`: guarda a chave secreta `GOOGLE_SAFE_BROWSING_API_KEY`. Edite este arquivo com a sua chave.
- `.env.example`: mostra o nome da configuração necessária, sem colocar nenhuma chave secreta.
- `.gitignore`: impede que a pasta `node_modules` e o arquivo `.env` sejam enviados ao Git.
- `package.json`: lista as dependências e o comando do projeto.
- `public/index.html`: contém a estrutura e os textos da página.
- `public/style.css`: contém todo o visual responsivo do site.
- `public/script.js`: valida o formulário, mostra o carregamento e exibe o resultado retornado pelo backend.
- `README.md`: contém estas instruções de instalação e uso.

## Resultado da verificação

- **CONFIÁVEL**: a API não encontrou ameaças conhecidas associadas à URL naquele momento.
- **ALTO RISCO**: a API encontrou uma ameaça conhecida. Quando a API informar o tipo, o site mostra Malware, Phishing / Engenharia social ou Software indesejado.
- **ATENÇÃO**: não foi possível concluir a consulta. Tente novamente depois.

## Acessibilidade

O botão **Acessibilidade**, no canto inferior direito do site, funciona em todas as páginas. Ele permite aumentar texto e controles, alterar contraste, reduzir movimento, usar modo de leitura, ajustar cores, destacar o foco e usar leitura em voz alta quando o navegador oferecer esse recurso.

As escolhas são salvas somente neste navegador. Para abrir ou fechar o painel pelo teclado, pressione `Alt + A`. Para fechar, também funciona a tecla `Esc`.

## Erros comuns

### A página não abre em `localhost:3000`

Verifique se o terminal está aberto e mostra `Compra Certa disponível em http://localhost:3000`. Se não mostrar, execute `node server.js`.

### Aparece “O serviço de segurança está temporariamente indisponível”

Confira se você trocou `sua_chave_aqui` no arquivo `.env`, se salvou o arquivo e se reiniciou o servidor. Também confirme no Google Cloud Console que a Safe Browsing API está habilitada para o projeto da chave.

### O terminal diz que `node` ou `npm` não é reconhecido

Instale ou reinstale o Node.js LTS e feche e abra o VS Code novamente.

### A chave apareceu no navegador ou no código do frontend

Ela não deve aparecer. A chave fica somente no arquivo `.env` e é usada pelo `server.js`. Nunca cole a chave em `index.html` ou `script.js`.
