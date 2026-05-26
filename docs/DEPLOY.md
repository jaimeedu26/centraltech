# 🚀 Guia de Deploy — CentralTech PagFácil

## Visão geral

Você vai subir 3 serviços:
1. **Supabase** — banco de dados PostgreSQL (gratuito)
2. **Render** — backend NestJS (~R$40/mês)
3. **Vercel** — frontend React (gratuito)

Tempo estimado: 1 a 2 horas

---

## PASSO 1 — Preparar o computador

Instale o que precisar:
- Node.js 20 LTS → https://nodejs.org
- Git → https://git-scm.com
- VS Code → https://code.visualstudio.com

---

## PASSO 2 — Criar repositório no GitHub

1. Acesse https://github.com e crie uma conta (se não tiver)
2. Crie um novo repositório chamado `centraltech`
3. No terminal do VS Code, dentro da pasta do projeto:

```bash
git init
git add .
git commit -m "primeiro commit"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/centraltech.git
git push -u origin main
```

---

## PASSO 3 — Banco de dados no Supabase

1. Acesse https://supabase.com e crie conta
2. Clique em **New project**
3. Escolha nome: `centraltech` | região: **South America (São Paulo)**
4. Defina uma senha forte para o banco — **anote essa senha**
5. Aguarde o projeto criar (~2 min)
6. Vá em **Settings > Database > Connection string > URI**
7. Copie a string — ela ficará assim:
   ```
   postgresql://postgres:[SUA-SENHA]@db.xxxx.supabase.co:5432/postgres
   ```
8. **Adicione `?sslmode=require` no final**

---

## PASSO 4 — Configurar e rodar o backend localmente

```bash
cd centraltech/backend

# Instalar dependências
npm install

# Criar arquivo de variáveis de ambiente
cp .env.example .env
# Abra o .env no VS Code e preencha com:
# - DATABASE_URL (string do Supabase do passo anterior)
# - JWT_SECRET (gere com: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
# - REFRESH_TOKEN_SECRET (gere outro da mesma forma)
# - FRONTEND_URL=http://localhost:5173

# Rodar migrations (cria as tabelas no banco)
npx prisma migrate dev --name init

# Criar usuário admin inicial
npm run prisma:seed

# Rodar em desenvolvimento
npm run start:dev
```

A API estará em: http://localhost:3000

---

## PASSO 5 — Configurar e rodar o frontend localmente

```bash
cd centraltech/frontend

npm install

# Criar .env
echo "VITE_API_URL=http://localhost:3000" > .env

npm run dev
```

O sistema estará em: http://localhost:5173

**Login inicial:**
- E-mail: `admin@centraltech.com`
- Senha: `admin123`

⚠️ **Troque a senha logo após o primeiro login!**

---

## PASSO 6 — Deploy do backend no Render

1. Acesse https://render.com e crie conta (pode logar com GitHub)
2. Clique em **New > Web Service**
3. Conecte seu repositório GitHub `centraltech`
4. Configure:
   - **Name:** centraltech-api
   - **Root Directory:** backend
   - **Build Command:** `npm install && npx prisma generate && npm run build`
   - **Start Command:** `npx prisma migrate deploy && node dist/main`
   - **Plan:** Starter ($7/mês) — **obrigatório**, plano grátis dorme
5. Clique em **Advanced > Add Environment Variables** e adicione:
   ```
   DATABASE_URL = [sua string do Supabase]
   JWT_SECRET = [seu secret gerado]
   REFRESH_TOKEN_SECRET = [seu outro secret]
   FRONTEND_URL = https://centraltech.vercel.app
   NODE_ENV = production
   ```
6. Clique em **Create Web Service**
7. Aguarde o deploy (~5 min)
8. Anote a URL da API: `https://centraltech-api.onrender.com`

---

## PASSO 7 — Deploy do frontend na Vercel

1. Acesse https://vercel.com e crie conta (pode logar com GitHub)
2. Clique em **Add New > Project**
3. Importe o repositório `centraltech`
4. Configure:
   - **Root Directory:** frontend
   - **Framework:** Vite
5. Em **Environment Variables** adicione:
   ```
   VITE_API_URL = https://centraltech-api.onrender.com
   ```
6. Clique em **Deploy**
7. Aguarde (~2 min)
8. Seu sistema estará em: `https://centraltech.vercel.app`

---

## PASSO 8 — Atualizar CORS no Render

Agora que você tem a URL da Vercel, volte ao Render e atualize:
```
FRONTEND_URL = https://centraltech.vercel.app
```
(Use a URL real que a Vercel gerou para você)

O Render fará redeploy automático.

---

## PASSO 9 — Domínio próprio (opcional)

Para usar `caixa.centraltech.com`:
1. Registre o domínio em https://registro.br (~R$40/ano)
2. Na Vercel: **Settings > Domains** — adicione `caixa.centraltech.com`
3. No Registro.br: configure o DNS com o CNAME que a Vercel mostrar

---

## Atualizações futuras

Sempre que quiser atualizar o sistema:

```bash
# Fazer as alterações no código
git add .
git commit -m "descrição da mudança"
git push
```

O Vercel e o Render detectam automaticamente e fazem o redeploy.

---

## Credenciais iniciais

| Campo | Valor |
|---|---|
| E-mail | admin@centraltech.com |
| Senha | **admin123** |
| Perfil | Administrador |

⚠️ Troque a senha imediatamente após o primeiro acesso!

Para criar operadores, acesse o menu **Usuários** no sistema.

---

## Problemas comuns

**"Cannot connect to database"**
→ Verifique se o DATABASE_URL tem `?sslmode=require` no final

**"CORS error" no navegador**
→ Verifique se o FRONTEND_URL no Render está correto (sem barra no final)

**API demora para responder na primeira vez do dia**
→ Normal se usar o plano gratuito do Render. Use o plano Starter para evitar.

**"Prisma client not generated"**
→ Rode `npx prisma generate` dentro da pasta backend

---

## Suporte

Qualquer dúvida durante o processo, pode perguntar no chat com o Claude!
Descreva o erro exato que apareceu e em qual passo você estava.
