# OdontoCloud

Sistema de gestão odontológica completo: pacientes, anamnese, atendimentos, odontograma, radiografias, fotografias, documentos, produção, financeiro, agenda, relatórios e IA.

Stack: Next.js 16 (App Router) + Prisma + PostgreSQL + Tailwind CSS 4.

## Desenvolvimento local

```bash
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000). As variáveis de ambiente ficam no arquivo `.env` (copie de `.env.example` se existir).

Criar o banco e popular dados iniciais:

```bash
npx prisma migrate dev
npx prisma db seed
```

Login inicial: `admin@odontoweb.com.br` / `Admin@2026` (troque a senha ao entrar).

## Publicação

O deploy é feito pelo **Render** usando o `render.yaml` (Blueprints):

1. Crie conta em [render.com](https://render.com) e conecte pelo GitHub.
2. **New + → Blueprint** → selecione o repositório `odonto-web`.
3. O blueprint cria automaticamente o web service + PostgreSQL (planos gratuitos).
4. Aguarde o build (executa migrations e seed automaticamente).

### Domínio próprio (apontando o domínio da HostGator)

1. No painel do Render, em Settings → Custom Domains, adicione `seudominio.com.br` e `www.seudominio.com.br`. Anote o IP e o nome mostrados.
2. No cPanel da HostGator → Domains → Zone Editor:
   - Registro `A` com nome `@` → o IP do Render.
   - Registro `CNAME` com nome `www` → `odonto-web.onrender.com`.
3. Após propagar, o SSL (HTTPS) é emitido automaticamente pelo Render.

### Variáveis de ambiente

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `DATABASE_URL` | Sim | Conexão PostgreSQL (criada pelo blueprint) |
| `JWT_SECRET` | Sim | Chave de assinatura dos tokens (gerada pelo blueprint) |
| `NEXT_PUBLIC_APP_NAME` | Não | Nome exibido do sistema |
| `NEXT_PUBLIC_APP_URL` | Não | URL pública (usada em e-mails de "esqueci a senha") |
| `OPENAI_API_KEY` | Não | Habilita o assistente de IA (caso contrário exibe aviso) |
| `STORAGE_DIR` | Sim | Diretório dos arquivos enviados |

> ⚠️ No plano gratuito o serviço "dorme" após ~15 min sem uso e o diretório de arquivos é temporário entre deploys. Para persistência e ausência de sleep, use o plano Starter ou um disco persistente (pago).