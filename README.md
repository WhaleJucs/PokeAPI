# Pokédex - Desafio BSN Tecnologia

**Aplicação Live:** **[Clique aqui para testar](https://poke-api-kappa-seven.vercel.app/home)**

Este projeto é uma Pokédex moderna e responsiva desenvolvida com Ionic e Angular, demonstrando a aplicação de práticas de desenvolvimento atuais.
A aplicação consome os dados da PokeAPI e foi estruturada com componentes Standalone para uma arquitetura modular. 
A gestão de estado foi implementada de forma reativa com RxJS (`BehaviorSubject` e `async` pipe), garantindo uma interface de usuário fluida que reage dinamicamente às ações do usuário.

Foi dada atenção especial à performance, com a implementação de um sistema de cache no lado do cliente para minimizar requisições repetidas. 
A interface foi desenhada com foco na experiência do usuário, incluindo funcionalidades como busca dinâmica, sistema de favoritos, paginação e um modo escuro persistente, tudo dentro de um layout "app-like" que se adapta a dispositivos móveis e desktops.

---

### Principais Funcionalidades

-   Listagem de Pokémon com paginação e busca por nome/ID.
-   Visualização de detalhes completos (stats, habilidades, etc.) em um modal.
-   Sistema de Favoritos com filtro e persistência visual na lista.
-   Design totalmente responsivo (Mobile-First) com layout adaptativo para desktop.
-   Modo Escuro com tema customizado e persistência da preferência do usuário (`localStorage`).
-   Cache de detalhes no lado do cliente para otimização de performance e navegação instantânea.

### Tecnologias Utilizadas

-   **Ionic 7**
-   **Angular 17** (Standalone Components)
-   **TypeScript**
-   **RxJS** (Programação Reativa)
-   **SCSS**
-   **Vercel** (Deploy e Hospedagem)

### Como Executar Localmente

```bash
# 1. Clone o repositório
git clone [https://github.com/WhaleJucs/PokeAPI.git](https://github.com/WhaleJucs/PokeAPI.git)

# 2. Navegue até a pasta do projeto
# (Atenção: o projeto está em uma subpasta)
cd PokeAPI/PokeAPI

# 3. Instale as dependências
npm install

# 4. Execute a aplicação
ionic serve
```
