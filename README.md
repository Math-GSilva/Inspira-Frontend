# 🎨 Inspira Frontend

<div align="center">

![Status do Projeto](https://img.shields.io/badge/Status-Em%20Desenvolvimento-green?style=for-the-badge)
![Angular](https://img.shields.io/badge/Angular-17-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Material Design](https://img.shields.io/badge/Material%20Design-Available-ff69b4?style=for-the-badge&logo=materialdesign&logoColor=white)
![Azure Static Web Apps](https://img.shields.io/badge/Azure%20SWA-Deployed-0078D4?style=for-the-badge&logo=azure&logoColor=white)

</div>

<p align="center">
  <b>Interface web moderna e responsiva para a rede social de artistas Inspira.</b>
</p>

---

## 📖 Sobre o Projeto

O **Inspira Frontend** é uma aplicação Single Page Application (SPA) desenvolvida em **Angular 17** que serve como a interface principal para a plataforma Inspira. O projeto foca em oferecer uma experiência de usuário fluida para o compartilhamento de arte (imagens e vídeos), utilizando **Angular Material** para componentes de UI robustos e **RxJS** para gerenciamento de estado reativo.

A aplicação consome a API REST do [Inspira Backend](https://github.com/math-gsilva/inspira-backend) e possui deploy automatizado via GitHub Actions para o **Azure Static Web Apps**.

---

## 🚀 Funcionalidades Principais

* **🔐 Autenticação e Segurança**: 
  * Login e Registro de usuários.
  * Interceptores HTTP para gestão automática de Tokens JWT.
  * *Guards* de rota para proteção de áreas restritas.
* **🖼️ Feed e Obras de Arte**:
  * Visualização de feed infinito de obras.
  * **Upload de Mídia**: Suporte para postagem de imagens e vídeos.
  * **Player de Vídeo**: Integração com `ngx-plyr` para reprodução de conteúdo.
* **❤️ Interação Social**:
  * Sistema de curtidas em tempo real.
  * Comentários em postagens.
  * Seguir/Deixar de seguir outros artistas.
* **👤 Perfil e Gestão**:
  * Página de perfil personalizável (foto, bio).
  * Edição de dados do usuário.
  * Listagem de seguidores e seguidos.
* **🔍 Descoberta**:
  * Busca de usuários.
  * Filtros de obras por categoria.

---

## 🛠️ Tecnologias Utilizadas

* **Framework**: Angular 17 (Standalone Components).
* **Linguagem**: TypeScript.
* **Estilização**: SCSS, Angular Material (Theming).
* **Componentes**: `@angular/material`, `@ng-select/ng-select`.
* **Multimídia**: `plyr`, `@atom-platform/ngx-plyr`.
* **Gerenciamento de Estado**: RxJS (Observables, Subjects).
* **Utilitários**: `jwt-decode` para manipulação de tokens.
* **CI/CD**: GitHub Actions + Azure Static Web Apps.

---

## 📂 Estrutura do Projeto

```bash
src/app/
├── core/                 # Modelos, Interceptors e Serviços globais (Singleton)
├── features/             # Módulos funcionais (Auth, Obras, Comentários, etc.)
├── pages/                # Componentes de Página (Landing Page, Home)
├── shared/               # Componentes reutilizáveis (Modais, Cards)
├── app.routes.ts         # Configuração de rotas da aplicação
└── environments/         # Variáveis de ambiente (API Url)
```

---

## ⚙️ Como Executar

### Pré-requisitos
* [Node.js](https://nodejs.org/) (Versão 20 recomendada).
* [Angular CLI](https://angular.io/cli) instalado globalmente: `npm install -g @angular/cli`.

### 💻 Rodando Localmente

1.  **Clone o repositório**
    ```bash
    git clone [https://github.com/Math-GSilva/Inspira-Frontend.git](https://github.com/Math-GSilva/Inspira-Frontend.git)
    cd Inspira-Frontend
    ```

2.  **Instale as dependências**
    ```bash
    npm install
    ```

3.  **Configure o Backend**
    Certifique-se de que o backend está rodando. Se estiver local, atualize o arquivo `src/environments/environment.ts`:
    ```typescript
    export const environment = {
      production: false,
      apiUrl: 'http://localhost:8000/api' // URL do seu backend local
    };
    ```

4.  **Inicie o servidor de desenvolvimento**
    ```bash
    ng serve
    ```

5.  **Acesse a aplicação**
    Abra o navegador em `http://localhost:4200/`.

---

## 📦 Build e Deploy

O projeto possui uma pipeline de CI/CD configurada no GitHub Actions (`.github/workflows/azure-static-web-apps...`).

Para gerar o build de produção manualmente:

```bash
ng build --configuration production
```
Os arquivos estáticos serão gerados na pasta `dist/inspira-frontend/browser`.

---

## 🤝 Contribuindo

Contribuições são bem-vindas!

1.  Faça um **Fork** do projeto.
2.  Crie uma Branch: `git checkout -b feature/MinhaFeature`.
3.  Faça o Commit: `git commit -m 'Adiciona MinhaFeature'`.
4.  Faça o Push: `git push origin feature/MinhaFeature`.
5.  Abra um **Pull Request**.

---

## 📝 Licença

Este projeto está sob a licença MIT.

---

<div align="center">
  <sub>Desenvolvido por <a href="https://github.com/math-gsilva">Math-GSilva</a>.</sub>
</div>
