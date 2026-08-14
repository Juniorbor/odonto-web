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

O deploy é feito pelo **Render** (plano grátis, sem créditos) usando o `render.yaml`
(Blueprints). O banco de dados é o **Neon** (plano grátis, não expira) que já é usado
pela produção atual — **nenhuma migração de dados é necessária**.

1. Crie conta em [render.com](https://render.com) e conecte pelo GitHub.
2. **New + → Blueprint** → selecione o repositório `odonto-web`.
3. No passo de revisão, preencha `DATABASE_URL` com a connection string do Neon
   (a mesma já usada no Netlify; o blueprint gera um novo `JWT_SECRET` — os usuários
   fazem login novamente uma única vez).
4. Aguarde o build (executa migrations e seed automaticamente).

### Migração do app (Netlify → Render)

O banco permanece no Neon — só o aplicativo muda de provedor. Para extrair/backup
dos dados ou migrar para outro banco no futuro, use o script:

```bash
npx tsx scripts/migrate-db.ts size --src "$SRC_URL"   # confere o tamanho
npx tsx scripts/migrate-db.ts copy --src "$SRC_URL" --dst "$DST_URL"   # copia dados
```

### Domínio próprio (apontando o domínio da HostGator)

1. No painel do Render, em Settings → Custom Domains, adicione `seudominio.com.br` e `www.seudominio.com.br`. Anote o IP e o nome mostrados.
2. No cPanel da HostGator → Domains → Zone Editor:
   - Registro `A` com nome `@` → o IP do Render.
   - Registro `CNAME` com nome `www` → `odonto-web.onrender.com`.
3. Após propagar, o SSL (HTTPS) é emitido automaticamente pelo Render.

### Variáveis de ambiente

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `DATABASE_URL` | Sim | Connection string do Neon (configurada no Blueprint) |
| `JWT_SECRET` | Sim | Chave de assinatura dos tokens (gerada pelo blueprint) |
| `NEXT_PUBLIC_APP_NAME` | Não | Nome exibido do sistema |
| `NEXT_PUBLIC_APP_URL` | Não | URL pública (usada em e-mails de "esqueci a senha") |
| `OPENAI_API_KEY` | Não | Habilita o assistente de IA (caso contrário exibe aviso) |
| `STORAGE_DIR` | Sim | Diretório dos arquivos enviados |

> ⚠️ No plano gratuito o serviço "dorme" após ~15 min sem uso (acorda sozinho ao receber
> acesso, ~30s) e o diretório de arquivos é temporário entre deploys — os arquivos enviados
> são guardados no banco (tabela `StoredFile`), então não há perda de dados.