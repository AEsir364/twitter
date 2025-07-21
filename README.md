# 🐦 Twitter Clone (Portfólio)

Este é um projeto de clone do Twitter desenvolvido como parte do meu portfólio para demonstrar habilidades em desenvolvimento web front-end com React. Ele simula as principais funcionalidades de uma rede social, como autenticação de usuário, criação e exibição de posts, interações (curtir, retuitar, comentar), e gerenciamento de perfil.

## ✨ Funcionalidades Principais

* **Autenticação de Usuário:**
    * Cadastro de novas contas (usuário e senha).
    * Login de usuários existentes.
    * Logout.
* **Feed de Publicações:**
    * Exibição de posts em tempo real, ordenados por data.
    * Criação de novas publicações com texto e imagem (upload via Cloudinary).
    * Interações com posts:
        * Curtir (`likes`).
        * Retuitar (com ou sem comentário).
        * Comentar em posts.
    * Exclusão de posts e comentários próprios.
* **Página de Perfil:**
    * Visualização de perfil de qualquer usuário (nome, bio, foto de perfil).
    * Exibição de posts e retweets do usuário.
    * Exibição de respostas (comentários feitos pelo usuário em outros posts).
    * Funcionalidade de seguir/deixar de seguir outros usuários.
    * Exibição de contagem de seguidores e quem está seguindo (com modais para listar).
    * **Edição de Perfil (apenas para o próprio usuário):**
        * Alteração do nome de exibição.
        * Alteração da biografia.
        * Alteração da foto de perfil (upload via Cloudinary).
        * Alteração da imagem de banner (upload via Cloudinary).
* **Design Responsivo:** Interface otimizada para diferentes tamanhos de tela.

## 🚀 Tecnologias Utilizadas

* **Front-end:**
    * [React.js](https://react.dev/) (com Hooks)
    * [React Router DOM](https://reactrouter.com/en/main) (para roteamento)
    * CSS Modules (para estilização modular)
    * [React Icons](https://react-icons.github.io/react-icons/) (para ícones)
* **Autenticação & Banco de Dados:**
    * [Firebase Authentication](https://firebase.google.com/docs/auth) (gerenciamento de usuários)
    * [Firestore](https://firebase.google.com/docs/firestore) (banco de dados NoSQL em tempo real para posts e perfis)
* **Armazenamento de Mídias:**
    * [Cloudinary](https://cloudinary.com/) (para upload e entrega de imagens de posts e perfil)
* **Outros:**
    * `crypto-js` (para hashing de senhas no cadastro - *apenas para demonstração em portfólio, senhas não são armazenadas em texto puro*)

## 🛠️ Como Rodar o Projeto Localmente

Siga estas instruções para configurar e executar o projeto em sua máquina:

1.  **Pré-requisitos:**
    * Node.js (versão 14 ou superior)
    * npm (gerenciador de pacotes do Node.js) ou Yarn

2.  **Clone o Repositório:**
    ```bash
    git clone <URL_DO_SEU_REPOSITORIO_NO_GITHUB>
    cd <nome-da-pasta-do-seu-projeto>
    ```

3.  **Instale as Dependências:**
    ```bash
    npm install
    # ou
    yarn install
    ```

4.  **Configuração do Firebase:**
    * Crie um projeto no [Firebase Console](https://console.firebase.google.com/).
    * Habilite os seguintes serviços:
        * **Authentication:**
            * Métodos de login: **Email/Password** (para cadastro e login) e **Anonymous** (para inicialização).
        * **Firestore Database:**
            * Crie as coleções `users` e `posts`.
            * Configure as [Regras de Segurança do Firestore](#regras-de-seguranca-do-firestore) conforme detalhado abaixo.
        * **Firebase Storage:**
            * Configure as [Regras de Segurança do Firebase Storage](#regras-de-seguranca-do-firebase-storage) conforme detalhado abaixo.
    * Obtenha suas credenciais de configuração do Firebase (API Key, authDomain, projectId, etc.) em `Project settings` > `Your apps` > `Web`.
    * Crie um arquivo `src/firebase.js` e insira suas credenciais:
        ```javascript
        // src/firebase.js
        import { initializeApp } from "firebase/app";
        import { getFirestore } from "firebase/firestore";
        import { getAuth, onAuthStateChanged } from "firebase/auth";

        const firebaseConfig = {
          apiKey: "SEU_API_KEY",
          authDomain: "SEU_AUTH_DOMAIN",
          projectId: "SEU_PROJECT_ID",
          storageBucket: "SEU_STORAGE_BUCKET",
          messagingSenderId: "SEU_MESSAGING_SENDER_ID",
          appId: "SEU_APP_ID",
          measurementId: "SEU_MEASUREMENT_ID" // Opcional
        };

        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);
        const auth = getAuth(app);

        async function initializeAuthObserver() {
          return new Promise((resolve) => {
            const unsubscribe = onAuthStateChanged(auth, (user) => {
              unsubscribe();
              if (user) { console.log('Sessão de usuário detectada:', user.uid); }
              else { console.log('Nenhum usuário logado.'); }
              resolve();
            });
          });
        }
        initializeAuthObserver();
        export { db, auth };
        ```

5.  **Configuração do Cloudinary:**
    * Crie uma conta no [Cloudinary](https://cloudinary.com/).
    * No seu Dashboard, localize seu **Cloud Name**.
    * Vá em `Settings` (Configurações) > `Upload` (Upload) > `Upload presets` (Presets de upload).
    * Crie **dois** novos presets de upload:
        * **Preset para Posts:**
            * `Upload preset name`: `twitter2` (ou outro nome que preferir, mas use este no código).
            * `Signing mode`: **`Unsigned`**.
            * `Access mode` (na seção "Manage and Analyze"): **`Public`**.
            * `Generated public ID`: `Auto-generate an unguessable public ID value`.
            * `Asset folder`: `twitter_posts` (opcional, para organização).
            * Salve.
        * **Preset para Fotos de Perfil/Banner:**
            * `Upload preset name`: `twitter2 profile` (ou outro nome, **com o espaço, se usar**).
            * `Signing mode`: **`Unsigned`**.
            * `Access mode`: **`Public`**.
            * `Generated public ID`: `Auto-generate an unguessable public ID value`.
            * `Asset folder`: `twitter_profile_pics` (opcional, para organização).
            * Salve.
    * Atualize as constantes `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_UPLOAD_PRESET` e `CLOUDINARY_PROFILE_UPLOAD_PRESET` nos arquivos `src/components/PostInput/index.js` e `src/pages/ProfilePage/index.js` com seus valores reais.

6.  **Crie o Índice Composto do Firestore:**
    * Ao rodar o projeto, o console do navegador pode exibir um erro `The query requires an index...`.
    * Clique no link fornecido no erro do console. Ele o levará diretamente para a página no Firebase Console para criar o índice composto necessário para a consulta de posts do usuário. Clique em "Criar Índice" e aguarde alguns minutos para que ele seja construído.

7.  **Inicie o Servidor de Desenvolvimento:**
    ```bash
    npm start
    # ou
    yarn start
    ```
    O aplicativo será aberto em `http://localhost:3000`.

## 🔒 Regras de Segurança do Firebase

É **CRÍTICO** que você configure as regras de segurança do seu projeto Firebase para que o aplicativo possa ler e escrever dados. Vá para o seu Firebase Console e publique as seguintes regras:

### Regras de Segurança do Firestore

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Regras para a coleção 'users'
    match /users/{userId} {
      allow create: if request.auth != null; // Permite criar por usuário autenticado
      allow read: if true; // Todos podem ler perfis

      // Permite que o próprio usuário edite seu perfil (nome, bio, foto, banner)
      // OU que outro usuário atualize APENAS os campos 'followers' ou 'following'
      allow update: if request.auth != null && (
        request.auth.uid == userId || // Se for o próprio usuário, pode atualizar tudo
        (
          // Se não for o próprio usuário, verifica se a mudança é SOMENTE em 'followers' ou 'following'
          request.resource.data.diff(resource.data).affectedKeys().hasOnly(['followers']) ||
          request.resource.data.diff(resource.data).affectedKeys().hasOnly(['following'])
        )
      );
      allow delete: if false; // Não permite deletar perfil

    }

    // Regras para a coleção 'posts'
    match /posts/{postId} {
      allow read: if true; // Todos podem ler posts
      allow create: if request.auth != null; // Apenas usuários autenticados podem criar
      
      // Permite que o criador do post atualize ou delete seu próprio post
      // OU que outros usuários atualizem APENAS os campos 'likes' ou 'comments'
      allow update: if request.auth != null && (
        request.auth.uid == resource.data.senderUid || // Se for o próprio criador
        (
          // Se não for o criador, verifica se a mudança é SOMENTE em likes ou comments
          request.resource.data.diff(resource.data).affectedKeys().hasOnly(['likes']) ||
          request.resource.data.diff(resource.data).affectedKeys().hasOnly(['comments'])
        )
      );
      allow delete: if request.auth != null && request.auth.uid == resource.data.senderUid; // Apenas o criador pode deletar
    }

    // Regras para qualquer outra coleção (por padrão, nega tudo)
    match /{document=**} {
      allow read, write: if false;
    }
  }
}