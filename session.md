# OdontoCloud — Sessões

Histórico de conversas, atualizações e atividades do projeto. Sempre que retomarmos o trabalho, leia este arquivo para saber o estado atual.

---

## Estado atual (última atualização — sessão 10i)

**STATUS: SISTEMA OPERACIONAL E VALIDADO — build de produção passa.**

- FASE 1 (admin master) **concluída**
- Todos os módulos da clínica **implementados**: pacientes, anamnese, agenda, atendimentos, odontograma, **fotografias**, **radiografias**, **documentos**, IA, produção, financeiro, relatórios, busca
- **Fix fuso horário em datas "YYYY-MM-DD"** (sessão 10i): `parseLocalDate` em `src/lib/utils.ts` aplicado em production (+`[id]`), finance (+`[id]`), clinical-records e images/`[id]` — datas só-com-data agora viram meia-noite LOCAL (antes meia-noite UTC → registro caía no mês anterior). Aplicado SQL nos 6 registros antigos (+4h). **Smoke test validado**: `GET /api/app/production?month=2026-08` → 6 registros, R$ 36,00; POST com data padrão aparece em agosto na hora.
- **Menu lateral com atalhos** (sessão 10): abaixo de Dashboard → Novo Paciente, Novo atendimento, Odontograma, Nova produção, Gerar relatório, Financeiro (filtrados por módulo do plano)
- **Cadastro do paciente** (sessão 10): ações rápidas com "Adicionar radiografia" (upload direto) e "Assistente IA" (pré-seleciona o paciente em `/app/ia?patientId=`), todas as ações filtradas por módulo
- **Nova produção** (sessão 10b–10g): campo Serviço com exames selecionáveis + preço automático em real (Traçado 4,00 · Um dente 10,00 · Maxila/Mandíbula 15,00 · Maxila e Mandíbula 20,00, com vírgula/decimal); campo **Tipo** só com Fernando e Bernardo; **Categoria** = clínicas por tipo (Fernando: Ariquemes/Porto Velho/Machadinho/Cacoal · Bernardo: Rolim de Moura/Jí-Paraná/Ouro Preto), Select filtrado e desabilitado sem tipo; seed de clientes novos com as 7 clínicas
- **Fotografias** (sessão 10b): miniaturas com `object-contain` — imagem inteira no quadrado, sem cortar
- **Impersonação admin → cliente** funcionando ("Ver como cliente")
- BASE LIMPA: admin master + 1 cliente demo (`Sorriso Odontologia`, assinatura com todos os 13 módulos para demonstração) com dados de demonstração
- **Pacientes**: editar e excluir definitivo (sessão 8)
- **Logo profissional de dente** (SVG) aplicada em toda a marca (sessão 8)
- **Fix sessão não fixa** (sessão 9): cookie `Secure` derivado do protocolo real da requisição (`requestIsSecure` em `src/lib/auth.ts`). Flag "Lembrar acesso" funciona: 7 dias com checkbox, 12h sem.

---

## O que é o projeto

SaaS odontológico premium (Next.js fullstack + Prisma + PostgreSQL). Escopo: pacientes, anamnese, atendimento, odontograma, imagens, IA, produção, financeiro, PDFs, admin master multiempresa, LGPD/auditoria.

## Stack e convenções (NÃO pule na retomada)

- **Next.js 16.2.12** App Router (Turbopack). `params`/`searchParams` são **assíncronos**. **Não existe `next lint`.** TypeScript, React 19, Tailwind v4, lucide-react.
- **Prisma 7.9.1**: datasource sem `url`; **`prisma.config.ts` obrigatório**; **driver adapter obrigatório**: `new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL }))` (imports `pg`/`Pool`). Padrão usado em `src/lib/prisma.ts` (singleton via `dotenv/config`) e em scripts.
- Migrações: **`npx prisma migrate deploy`** (não-interativo). Ad hoc feita por script manual + deploy.
- **Nunca escrever código sem consultar `node_modules/next/dist/docs/`** quando houver mudança de API/convenções Next (ver AGENTS.md).

## Ambiente local (credenciais de infra)

- Banco: `postgresql://laudos_pg:laudos_pg_2026@localhost:5432/laudos`
- psql: `C:\Program Files\PostgreSQL\16\bin\psql.exe` com `PGPASSWORD=laudos_pg_2026`
- Dev server na porta 3000 em execução durante as sessões de trabalho.

## Credenciais de acesso

| Papel | Email | Senha |
|---|---|---|
| Admin master | `admin@odontocloud.com.br` | `Admin@2026` |
| Cliente demo (clin) | `contato@sorriso.com.br` | `Sorriso@2026` |
| Usuário demo (profissional) | `fabio@sorriso.com.br` | `Fabio@2026` |

- Auth: cookie `odc_session` JWT (httpOnly, 7 dias) via `jose`; `src/lib/auth.ts` (`requireSession`, `hasModule`, `hashPassword`/`verifyPassword`); `src/lib/admin.ts`/`requireAdminMaster`.
- Planos seed: Básico (`patients,anamnesis,appointments`), Profissional (+`odontogram,images,radiographs,reports,ai`), Premium (+`production,finance,documents`). Filtrados por `hasModule(ctx, ...)`.
- IA: sem chave OpenAI o endpoint retorna resposta simulada (`{ok,response,simulated:true}`) e registra `AiInteraction`.

## Tipos / UI não óbvios (pegadilha)

- `EmptyState`, `Skeleton` → `src/components/ui/feedback.tsx` (ícones: string `inbox|search|file`)
- `ConfirmDialog` → aceita `message` e `loading` (não `description`)
- `CardHeader` → aceita `title`/`subtitle`/`action` (não `icon`/`description`)
- `Card` → `CardBody`. Lucide icons removidos quando `CardHeader` não aceita (regex ` icon={<...>}`)

---

## Histórico de sessões

### Sessão 1 — Setup + FASE 1 Admin Master (completa)
- Setup do projeto, banco, Prisma 7 com adapter `pg`, schema completo, seed de planos/admin.
- `/admin` (KPIs), `/admin/clientes` (filtros, list, novo, detalhe c/ tenant+subscription), `/admin/planos`, `/admin/logs` (paginação + filtro via qs), `/admin/backup`, `/admin/down`, `/admin/configuracoes`.
- APIs admin: `/api/admin/clients`, `[id]`, `/api/admin/plans`, `[id]`, `/api/admin/settings`, `/api/admin/backup`, `/api/admin/subscriptions`.
- Bug fix: `action` em `/admin/logs` era `string | undefined` → `action ?? ""`; `tsc` limpo.
- Migração ad hoc: `20260803161000_financial_cat_unique_type` — unique `FinancialCategory(tenantId,name,type)`.

### Sessão 2 — Módulos da clínica (concluída)
- **Usuários da clínica**: `/api/app/users` (GET+POST) e `[id]` (PATCH/DELETE); página `/app/configuracoes/usuarios` (não edita/remove self).
- **Pacientes**: `/api/app/patients` (GET busca+status+paginação, POST) e `[id]` (GET/PATCH/DELETE arquivamento). Páginas: `/app/pacientes`, `/app/pacientes/novo`, `/app/pacientes/[id]` (hist clínico, atendimentos, docs, radiografias), `/app/pacientes/nobase`. Login João → páginas 200.
- **Anamnese**: `/api/app/anamnesis` (POST v++ + signedAt, GET por paciente); 3 conjuntos de questões no form.
- **Agenda**: `/api/app/appointments` (GET range/patientId, POST) + `[id]` (PATCH status, DELETE=CANCELLED); página `/app/agenda` com modal de agendamento e ações (Iniciar/Concluir/Faltou/Cancelar).
- **Atendimentos**: `/app/atendimentos` (lista ClinicalRecord), `/app/atendimentos/novo` (tabs), `/api/app/clinical-records` (POST).
- **Configurações da clínica**: índice com 6 cards; `/perfil` (troca senha via `PATCH /api/app/profile`), `/clinica` (dados/endereço via `PATCH /api/app/clinic`), `/assinatura`, `/seguranca` (sessões), `/lgpd`.
- **IA**: `/app/ia` + `POST /api/app/ai` (contexto opcional; fallback simulado).
- **Produção**: `/api/app/production` (GET mês + POST código `PR-xxxxx`) + `[id]`; categorias; página `/app/producao`.
- **Financeiro**: `/api/app/finance` (GET mês; POST expense/income) + `[id]` (PATCH status, DELETE); `/app/financeiro` (pagar despesa, excluir).
- **Relatórios**: `/app/relatorios` (6 KPIs).
- **Busca global**: `/app/busca?q=` (pacientes por nome/CPF/telefone).
- **Odontograma**: `/api/app/odontogram` (GET q/ patientId + POST condição) + `[id]` (DELETE soft com `removedAt`); página `/app/odontograma` (16+16 dentes, cliques, surface, nota). Condições: CARIE|OBTURADO|COROA|EXTRAIDO|FRATURADO|RAIZ|IMPLANTE|SAUDAVEL.

### Sessão 3 — Retoma, correções e limpeza
1. Correção de tipos após odontograma: `EmptyState` importado de `@/components/ui/feedback` em `/app/busca` e `/app/relatorios`. → `tsc` limpo.
2. Validação HTTP dos fluxos novos (200): odontograma, relatórios, busca.
3. **Limpeza**: removido o tenant de teste antigo (`Clínica Teste Souza`) → restou só o admin master.
4. **Criação de cliente demo**: `Sorriso Odontologia` (`contato@sorriso.com.br` / `Sorriso@2026`, plano Profissional).
5. **End-to-end na clínica nova**: paciente (Pedro Almeida), agendamento, evolução, anamnese, odontograma — todos ok.
6. **Autorização por plano**: produção/financeiro 403 no Profissional (esperado).
7. **Build**: `npm run build` ✓ 57 rotas.

### Sessão 4 — Correção de navegação + módulos Radiografias e Documentos + impersonação
**Problemas relatados pelo usuário:** menu Radiografias/Documentos → 404 (páginas nunca criadas); páginas do app pareciam "repetidas/sem função" (admin master navegava no app sem clínica vinculada: redirecionamentos, listas vazias).

**Implementado:**
1. **Impersonação de cliente** (ver como a clínica vê):
   - `auth.ts`: cookie `odc_impersonate` (clinicId) + campo `impersonating` em `SessionContext`; admin master resolve tenant/clínica/módulos da assinatura quando ativo.
   - API `/api/admin/impersonate` (POST entrar / DELETE sair).
   - Botão **"Ver como cliente"** em `/admin/clientes/[id]` (`src/components/admin/enter-clinic-button.tsx`).
   - Banner âmbar no AppShell com "Sair da visualização".
2. **Menu para admin master**: sem impersonação mostra só Dashboard + Perfil + Segurança + Administração; com impersonação, menu completo como a clínica. Itens novos `adminSafe`/`clinicOnly` em `NavItem` (`app-shell.tsx`).
3. **Módulo Radiografias** (novo):
   - `/api/app/radiographs` (GET · POST multipart com validação de magic-bytes + storage), `[id]` (PATCH/DELETE remove arquivo), `[id]/file` (serve autenticado).
   - Página `/app/radiografias` (grid, filtro por paciente, upload, preview, excluir).
4. **Módulo Documentos** (novo):
   - `/api/app/documents` (GET/POST) + `[id]` (PATCH/DELETE; `Prisma.JsonNull` para limpar content).
   - Página `/app/documentos` (tipos TERMO/CONSENTIMENTO/ANAMNESE/RELATORIO/ORIENTACOES/PERSONALIZADO, vínculo com paciente, assinatura).
5. **Links corrigidos**: "Nova produção" → `/app/producao`; "Adicionar radiografia" → `/app/radiografias`; atalhos ocultos para admin não-impersonado.
6. **Demo completa**: assinatura do tenant demo atualizada para **todos os 13 módulos** (userLimit 20) — para demonstração (não reflete o plano Profissional original).

**Validação:** `tsc` limpo · `npm run build` ✓ **62 rotas** · upload/serve/delete radiografia ok · CRUD documentos ok · impersonação ok · menu admin vs impersonado ok · todas páginas /app 200.

**Nota:** módulos novos redirecionam/403 quando a assinatura do tenant não os inclui (comportamento correto por plano).

### Sessão 5 — Módulo Imagens do paciente (Fotografias) + fixes
1. **Módulo Fotografias** (novo):
   - `/api/app/images` (GET c/ filtro patientId+category · POST multipart com validação de magic-bytes + storage `images/`), `[id]` (PATCH category/label/notes/takenAt · DELETE remove arquivo), `[id]/file` (serve autenticado).
   - Página `/app/fotografias` (grid, filtro por paciente, abas categoria Extrabucal/Intrabucal, upload com labels sugeridos `EXTRAORAL_LABELS`/`INTRAORAL_LABELS`, preview, editar, excluir).
   - Item "Fotografias" no menu (`module: "images"`, ícone Camera) em `app-shell.tsx`.
2. **Detalhe do paciente**: 4 cards de contagem (Atendimentos/Evoluções/Radiografias/Fotos), ação rápida `Fotografias`, seção "Fotografias clínicas" com thumbnails (`/app/pacientes/[id]/patient-detail.tsx` + `page.tsx` carrega `patientImages`).
3. **Bug fix pré-existente**: página `/app/pacientes/[id]` dava **500** — `RadiographViewer` lia `radiograph.id` no array de deps do `useEffect` (avaliado em todo render) com `radiograph=null` (pai passava `viewer!`). Corrigido renderizando o viewer apenas quando `viewer` existe em `patient-detail.tsx`.
4. **Infra**: tenant demo estava `SUSPENDED` (bloqueava login com 403) → reativado para `ACTIVE` via SQL.
5. **Validação**: `tsc` limpo · `npm run build` ✓ (novas rotas: `/api/app/images`, `[id]`, `[id]/file`, `/app/fotografias`) · CRUD fotos via HTTP ok (upload PNG 70B, serve, PATCH, DELETE).

### Sessão 6 — Menu enxugado (rebuild da navegação)
- Menu lateral (`app-shell.tsx`) reduzido a **apenas "Dashboard"** (`/app`); removidos grupos Clínica/Gestão/Inteligência/Configurações e imports não usados. Bloco "Administração" (admin master) mantido.
- Rotas/páginas continuam existindo; só a navegação lateral mudou. `tsc` limpo, build OK.
- Tenant demo estava `CANCELLED` (bloqueava login 403) → reativado para `ACTIVE` via SQL.

### Sessão 7 — Layout (footer removido + margens laterais) + incidente de encoding + limpeza de dados do banco
1. **Dashboard**: bloco de atalhos em linha única (`flex overflow-x-auto`), botões "Assistente IA" alinhados à direita, **barra inferior (footer) removida** e **margens laterais ampliadas** (`max-w-[1600px]`, `px-6 py-8`, `py-12 md:py-16` nas páginas principais, ex.: `src/app/(app)/app/page.tsx`).
2. **Incidente de encoding (importante)**: mudanças de margem aplicadas via PowerShell reescreveram arquivos com encoding errado → mojibake + corrupção de caracteres especiais. Recuperação:
   - Mojibake revertido com script JS (re-decode latin1) e originais dos caracteres perdidos recuperados dos **chunks de build em `.next/server`** (pré-corrupção): em-dash `—`, `Ú` (Últimos/Última), bullet `•`.
   - **Mapa de corrupção**: `FFFD+U+001D` → `—`; `FFFD` antes de `altim` → `Ú`; `U+2B22 (⬢)` → `•` (U+2022). 19 correções em 10 arquivos (todos em `src/app/(app)/`): admin/page, admin/logs, admin/clientes, app/page, agenda, documentos, radiografias, fotografias, detalhe do paciente.
3. **Correção de dados corrompidos no PostgreSQL** (mesmo FFFD, `chr(65533)`): `User.name` `Dr. Fábio Rocha`, `Patient.city`/`Clinic.city` `São Paulo`, `ClinicalRecord.diagnoses` `Cárie` + `hda` `Início há 1 semana` + `procedures` `Restauração`, `FinancialEntry.description` `Honorários`, `ProductionRecord.serviceName` `Tomografia panorâmica`. Varredura completa por tabela (User, Patient, Clinic, Professional, Appointment, ClinicalRecord, Document, MedicalHistory, Radiograph, PatientImage, FinancialEntry, Expense, ProductionRecord, Odontogram, AiInteraction) → **tudo 0**.
4. **Validação**: `tsc` limpo · `npm run build` ✓ · smoke HTTP com sessão real (`Dr. Fábio Rocha`, cookie `odc_session`): `/app`, `/app/fotografias`, `/app/radiografias`, `/app/pacientes`, `/app/documentos`, `/app/agenda` → 200, sem `�`/`⬢` no HTML. `/admin` → 307 `/app` (role PROFESSIONAL, esperado). Margens `max-w-[1600px]`/`px-6 py-8` confirmadas nos 10 arquivos.

**Gotchas novos:**
- Nunca reescrever arquivos via PowerShell redirecionamento (`>`/`Set-Content`); o PS 5.1 grava UTF-16 e o pipeline re-codifica. Sempre usar a ferramenta de edição de texto ou script Node com `utf8` explícito.
- Texto de origem confiável p/ caracteres perdidos: **chunks `.next/server`** (build de produção pré-corrupção), não sourcemaps do dev.
- Scan de FFFD no Postgres: `col LIKE '%' || chr(65533) || '%'`; enum/jsonb exigem `::text`.

### Sessão 8 — Excluir/Editar pacientes + logo profissional (dente)
1. **Excluir e editar pacientes** (pedido: "opção para excluir e editar"):
   - **Editar**: nova página `/app/pacientes/[id]/editar` (`src/app/(app)/app/pacientes/[id]/editar/page.tsx`), reutilizando o form de cadastro em modo edição (`PatientForm` aceita prop opcional `patient`; envia PATCH e volta ao detalhe). Rota registrada no build.
   - **Excluir definitivo**: `DELETE /api/app/patients/[id]?hard=1` → `prisma.patient.delete` (cascade no DB: appointments, clinicalRecords, documents, odontograms, medicalHistories, images, radiographs etc. via `onDelete: Cascade` no schema) + remoção dos arquivos de radiografias (`originalPath`/`annotatedPath`) e fotos (`path`) via `removeFile` de `src/lib/storage.ts`. Sem `hard=1` continua o archive (soft, `active:false`) usado pelo botão "Arquivar" do detalhe. Logs: `patient_deleted`/`patient_archived`.
   - Ações por linha na listagem (`patients-page.tsx`): botão lápis (link p/ editar) e botão lixeira (ConfirmDialog com aviso de exclusão permanente). Card agora é `div` + link interno (não mais `Link` inteiro).
2. **Logo profissional de dente** (as pedido: "mais profissional no formato de um dente"):
   - Criado `src/components/ui/tooth-logo.tsx` (`ToothLogo`): quadrado gradiente sky→cyan `shadow-glow` + SVG de dente branco (path herdado do hero da landing, `viewBox 0 0 200 220`), gradiente próprio `toothLogoGrad`.
   - **Atenção**: múltiplos usos do `id="toothLogoGrad"` na MESMA página (landing tem 2 logos: nav+footer) duplicam o id no DOM — funcional, mas vale refatorar para `useId` se precisar de unique tokens.
   - Substituído o ícone `Smile` como marca em: header + footer da landing (`src/app/page.tsx`), painel de marca + versão mobile do login (`src/app/login/page.tsx`), sidebar (`src/app/components/layout/app-shell.tsx`), `esqueci-senha/page.tsx` e `resetar-senha/page.tsx`. Removidos imports não usados de `Smile` desses arquivos (landing ainda usa `Smile` no card "Odontograma Interativo" — manter).
   - Validação final: `tsc` limpo, `npm run build` OK, HTTP: landing/login/esqueci-senha 200 com `toothLogoGrad` no HTML.

### Sessão 9 — Fix: sessão não persistia em produção sobre http ("usuário some após login")
**Sintoma relatado:** login funcionava, mas a sessão "não fixava" — usuário era redirecionado e depois voltava ao login (desaparecia).

**Causa raiz (provada por teste HTTP):** em `src/lib/auth.ts`, o cookie de sessão usava `secure: process.env.NODE_ENV === "production"`. Rodando o build de produção (`npm start`) acessado via **http** (localhost prod, IP da rede `http://10.118.247.46:3001`, celular), o `Set-Cookie` saía com `Secure` e o navegador **descarta cookie Secure em conexão não-HTTPS** → o cookie nunca era armazenado → `getSessionContext` sempre null → redirect `/login`. Em dev (`next dev`) o flag era `false` e funcionava, por isso parecia intermitente.

**Implementado:**
1. `requestIsSecure(req)` em `src/lib/auth.ts`: usa `x-forwarded-proto` (proxy/edge como Vercel, nginx) ou o protocolo da URL. `secure` agora é derivado da conexão real, não de `NODE_ENV`.
2. Assinaturas: `setSessionCookie(token, { secure, maxAge? })` e `setImpersonationCookie(clinicId, { secure })`. Chamadores atualizados: `/api/auth/login`, `/api/auth/reset`, `/api/admin/impersonate`.
3. Flag "Lembrar acesso" (antes ignorado no schema) agora ativo: `remember=true` → cookie 7 dias; `false` → 12h (`Max-Age=43200`).
4. `destroySessionCookie`/`clearImpersonationCookie` inalterados (deleção não depende do atributo Secure).

**Validação:** `tsc` limpo · `npm run build` ✓ · prod em `:3001` via http: login 200, `Set-Cookie` **sem** `Secure` (antes tinha), `/api/auth/session` com usuário real, `GET /app` 200 · `remember=false` → `Max-Age=43200`. Servidores de teste parados no fim.

### Sessão 10 — Menu lateral com atalhos + ações no cadastro do paciente
**Pedido:** botões "Novo Paciente", "Novo atendimento", "Odontograma", "Nova produção", "Gerar relatório", "Financeiro" no menu lateral abaixo de "Dashboard"; "Adicionar radiografia" e "Assistente IA" dentro do cadastro do paciente.

**Implementado:**
1. **Menu lateral** (`src/components/layout/app-shell.tsx`): grupo "Principal" agora tem Dashboard + 6 atalhos (`Novo Paciente` patients/UserPlus, `Novo atendimento` appointments/CalendarPlus, `Odontograma` odontogram/Smile, `Nova produção` production/PlusCircle, `Gerar relatório` reports/BarChart3, `Financeiro` finance/Wallet). Filtro `hasMod` existente esconde itens de módulos fora do plano e do admin master não-impersonado (espelha os atalhos do dashboard `app/page.tsx:102-110`).
2. **Cadastro do paciente** (`/app/pacientes/[id]/patient-detail.tsx`): nova prop `modules: string[]` (calculada no server page com `hasModule`). Card "Ações rápidas" ganhou:
   - **Adicionar radiografia** (módulo `radiographs`): botão que dispara o `fileInputRef` já existente → upload panorâmico direto (mesma função do card Radiografias).
   - **Assistente IA** (módulo `ai`): link para `/app/ia?patientId=<id>` com pré-seleção do paciente.
   - Todas as ações (Novo atendimento, Odontograma, Radiografias, Fotografias, IA) agora filtradas por módulo do plano.
3. **IA pré-selecionada** (`/app/ia/page.tsx` + `ai-page.tsx`): `searchParams.patientId` validado contra os pacientes da clínica e passado como `defaultPatientId` → select de contexto já inicia com o paciente.

**Validação:** `tsc` limpo · `npm run build` ✓ · HTTP com sessão real (`fabio@sorriso.com.br`): menu renderiza os 6 rótulos; `/app/pacientes/<id>` 200 com "Adicionar radiografia" e "Assistente IA"; `/app/ia?patientId=<id>` 200 com `<option value="..." selected>` (preselect OK).

### Sessão 10b — Nova produção: campo Serviço com exames selecionáveis
**Pedido:** no modal "Nova produção", o campo "Serviço" deveria oferecer exames para seleção: "Traçado", "Um dente", "Maxila e Mandíbula", "Maxila", "Mandíbula".

**Implementado** (`src/app/(app)/app/producao/production-page.tsx`):
1. Campo **Serviço** virou `Select` com: `Traçado`, `Um dente`, `Maxila e Mandíbula`, `Maxila`, `Mandíbula` e `Outro serviço` (que revela um input de texto livre ao ser escolhido — preserva flexibilidade p/ serviços fora da lista).
2. **Tipo automático**: escolher um exame ajusta `serviceType` (`Traçado` → `TRACADO`; demais exames → `TOMO`; `Outro` → `OUTRO`) via `pickService` + mapa `SERVICE_TO_TYPE`. Mudança manual do Tipo depois prevalece (o handler só roda no change do Select).
3. Novo estado `form.serviceChoice` (seleção do exame; `serviceName` continua sendo o que vai para a API); reset pós-cadastro atualizado.
- Sem mudanças de API/schema (`serviceType` enum `TOMO|TRACADO|OUTRO` intacto em `api/app/production/route.ts`).

**Validação:** `tsc` limpo · `npm run build` ✓ · chunk do cliente servido contém "Selecione o exame", "Um dente", "Maxila", "Traçado", "Outro serviço".

### Sessão 10c — Produção: novos tipos "Fernando" e "Bernardo"**Pedido:** adicionar "Fernando" e "Bernardo" ao campo "Tipo" do modal "Nova produção".

**Implementado (end-to-end, enum de banco + API + UI):**
1. **Schema/migração**: `ProductionType` ganhou `FERNANDO` e `BERNARDO` (`prisma/schema.prisma`; migração `20260803173000_production_type_names` com `ALTER TYPE "ProductionType" ADD VALUE IF NOT EXISTS ...` → `migrate deploy` aplicada + `prisma generate`).
2. **API**: `z.enum` atualizado em `api/app/production/route.ts` e `api/app/production-categories/route.ts` (agora `TOMO|TRACADO|OUTRO|FERNANDO|BERNARDO`).
3. **UI** (`production-page.tsx`): opções "Fernando" e "Bernardo" no Select Tipo; `TYPE_LABEL` mapeia `FERNANDO→Fernando`, `BERNARDO→Bernardo` (exibição na lista e nos cards).

**Validação:** `tsc` limpo · `npm run build` ✓ · smoke no build de produção (`:3001`, servidor novo): POST produção com `serviceType=FERNANDO` → 200 (`PR-00002`) e `BERNARDO` → 200 (`PR-00003`); `/app/producao` 200; registros QA excluídos em seguida; servidor `:3001` parado.

**ATENÇÃO (gotcha):** o dev server (`next dev` na 3000) mantém o **cliente Prisma antigo em cache** — após `ALTER TYPE` + `generate` é preciso **reiniciar o dev server**, senão POST com os novos valores dá 500 (testado: TOMO 200 / FERNANDO 500 antes do restart).

### Sessão 10d — Produção: campo "Tipo" reduzido a Fernando/Bernardo
**Pedido:** retirar do campo "Tipo" as opções "Outros serviços", "Traçado" e "Tomografia".

**Implementado** (`src/app/(app)/app/producao/production-page.tsx`):
1. Select **Tipo** agora tem apenas: `Fernando` (FERNANDO) e `Bernardo` (BERNARDO), com placeholder vazio "Selecione o tipo...". `form.serviceType` default/reset agora `""`.
2. Removido o mapa `SERVICE_TO_TYPE` e o auto-tipo de `pickService` (serviço não altera mais o Tipo — não existem mais valores TOMO/TRACADO selecionáveis).
3. `submit`: `serviceType: form.serviceType || "OUTRO"` — vazio cai em `OUTRO` na API (zod/API inalterados; registros legados TOMO/TRACADO/OUTRO continuam exibindo via `TYPE_LABEL`).

**Validação:** `tsc` limpo · `npm run build` ✓ · chunk servido contém "Selecione o tipo...", Fernando, Bernardo e **não** contém `<option value="TOMO">`, `<option value="TRACADO">` nem `<option value="OUTRO">`.

### Sessão 10e — Produção: valor automático por serviço
**Pedido:** cada serviço tem valor fixo que deve preencher automaticamente o campo "VALOR": Traçado R$ 4,00 · Um dente R$ 10,00 · Maxila R$ 15,00 · Mandíbula R$ 15,00 · Maxila e Mandíbula R$ 20,00.

**Implementado** (`src/app/(app)/app/producao/production-page.tsx`):
1. Mapa `SERVICE_VALUE` (chave = exame, valor = preço como string): `Traçado→"4"`, `"Um dente"→"10"`, `Maxila→"15"`, `Mandíbula→"15"`, `"Maxila e Mandíbula"→"20"`.
2. `pickService` agora também preenche `form.value` com o preço do exame escolhido. Campo **Valor** continua editável (o usuário pode corrigir). "Outro serviço" não altera o valor (entrada manual).

**Validação:** `tsc` limpo · `npm run build` ✓ · chunk servido contém o mapa completo (`"Um dente": "10"`, `Maxila: "15"`, `"Maxila e Mandíbula": "20"` etc.) e `pickService` usa `SERVICE_VALUE`.

### Sessão 10f — Produção: valor em real com vírgula e decimais
**Pedido:** campo "Valor" em formato real brasileiro, com vírgula e decimais (ex.: "4,00").

**Implementado** (`src/app/(app)/app/producao/production-page.tsx`):
1. `SERVICE_VALUE` agora usa decimais: `Traçado→"4,00"`, `"Um dente"→"10,00"`, `Maxila→"15,00"`, `Mandíbula→"15,00"`, `"Maxila e Mandíbula"→"20,00"`.
2. Input **Valor** mudou de `type="number"` (não aceita vírgula) para `type="text" inputMode="decimal"` com placeholder `0,00`.
3. Novo `parseBRL(v)`: converte "1.234,56"/"1234,56" → número (`replace(/\./g,"")` + `replace(",",".")`), usado na validação e no POST (`value` continua numérico para a API).

**Validação:** `tsc` limpo · `npm run build` ✓ · chunk contém `parseBRL`, `inputMode`, `Traçado: "4,00"`, `"Um dente": "10,00"`, `Maxila: "15,00"` · POST numérico ok (15.5 → 200). **Lembrete:** dev server na 3000 continua com cliente Prisma antigo (TOMO 200 / FERNANDO 500) — precisa reiniciar para os tipos Fernando/Bernardo.

### Sessão 10g — Produção: clínicas por tipo na "Categoria"
**Pedido:** cada "Tipo" tem clínicas que devem aparecer em "Categoria": Fernando → Ariquemes, Porto Velho, Machadinho, Cacoal · Bernardo → Rolim de Moura, Jí-Paraná, Ouro Preto.

**Implementado:**
1. **Categorias no banco**: 7 clínicas criadas como `ProductionCategory` do tenant demo (FERNANDO×4, BERNARDO×3) via SQL (`gen_random_uuid` + `ON CONFLICT (tenantId,name)`). Seed padrão de novos clientes em `api/admin/clients/route.ts` inclui as 7 clínicas (junto das 3 legadas TOMO/TRACADO/OUTRO).
2. **UI** (`production-page.tsx`): `clinicOptions = categories.filter(c => c.type === form.serviceType)`; Select **Categoria** filtrado pelo tipo, **desabilitado** com "Escolha um tipo primeiro..." quando não há tipo; `pickType` limpa `categoryId` ao trocar de tipo (evita categoria inválida).

**INCIDENTE dev server (root cause):** depois do `ALTER TYPE` + `generate`, o dev server 500 em `/app/producao` e na API com `Value 'FERNANDO' not found in enum 'ProductionType'` — o **Turbopack mantém cache persistente** (`.next/dev`, chunk `root-of-the-server`) do cliente Prisma antigo; **reiniciar o processo não basta**. Fix: parar o dev server, **apagar `.next`** e subir de novo. Após isso: `/app/producao` 200, API 200 com as 10 categorias, "Jí-Paraná" UTF-8 correto no HTML.

**Validação:** `tsc` limpo · `npm run build` ✓ · dev (cache limpo): GET 200 com 10 categorias; POST `FERNANDO` + categoria Ariquemes → 200 com `cat=Ariquemes` no registro; prod `:3001`: POST FERNANDO/BERNARDO com categoria → 200. QA limpado, temp SQL removido, `:3001` parado. **Dev server foi reiniciado pelo agente com cache limpo — log em `%TEMP%\opencode\dev3000.log`.**

### Sessão 10h — Fix: "Failed to fetch" no NotificationBell
**Sintoma:** erro runtime no navegador `Failed to fetch` em `NotificationBell.useEffect.load` (overlay do dev).

**Causa:** falha transitória de rede no `fetch("/api/notifications")` quando o dev server ficou indisponível (janela de reinício do servidor / Ctrl+C manual). O log confirmou o endpoint saudável (`GET /api/notifications 200`) e o `^C^C` no fim do `dev3000.log`.

**Implementado** (`src/components/layout/notification-bell.tsx`): `try/catch` no `load` (mantém estado atual e tenta no próximo poll de 60s) e no `markAll`. Sem mudança de API.

**Validação:** dev reiniciado (log em `%TEMP%\opencode\dev3000.log`); `/api/notifications` 200 `{"items":[],"unread":0}`; `/app` 200; `tsc` limpo.

### Sessão 10i — Fix: datas "YYYY-MM-DD" caindo no mês anterior (Produção do mês zerada)
**Sintoma:** registros criados via "Nova produção" não apareciam na "Produção do mês"; agosto de 2026 mostrava `value=0 count=0`.

**Causa raiz (provada):** `new Date("2026-08-01")` = **meia-noite UTC**. O servidor roda em `America/Manaus` (UTC-4, sem DST): o range do mês é montado com `new Date(year, m-1, 1)` = `2026-08-01T04:00:00Z`; o filtro Prisma pega `date >= 04:00Z`, então o registro `00:00Z` caía em julho. Smoke comprovou: `?month=2026-08` → 0; `?month=2026-07` → `value=22 count=4`.

**Implementado:**
1. `parseLocalDate(v)` em `src/lib/utils.ts`: string `^\d{4}-\d{2}-\d{2}$` → `new Date(v + "T00:00:00")` (meia-noite local); outros formatos → parse nativo; retorna `undefined` se inválido.
2. Aplicado onde havia `new Date(d.data)` em rotas de dados: `production/route.ts` e `production/[id]/route.ts`, `finance/route.ts` (`date`) e `finance/[id]/route.ts` (`paidAt`), `clinical-records/route.ts` (`occurredAt`), `images/[id]/route.ts` (`takenAt`).
3. SQL de correção retroativa dos 6 registros do tenant demo: `UPDATE "ProductionRecord" SET date = date + interval '4 hours' WHERE date = '2026-08-01 00:00:00'` → `UPDATE 6`.

**Validação:** `tsc` limpo; `npm run build` ok; smoke HTTP com sessão real: `GET /api/app/production?month=2026-08` → **6 registros, `value=36`**; POST "Maxila e Mandíbula" 20,00 com data padrão `2026-08-01` → `PR-00007` **aparece em agosto na hora** (gravado `2026-08-01T04:00:00Z`), DELETE de limpeza 200.

**Nota para o futuro:** rotas `subscriptions` e `admin/clients` ficaram de fora (deliberado); atendimentos já usavam datas com hora (parse local correto). Se o servidor mudar de fuso, reavaliar o offset dos registros antigos.

---

## Últimos testes / verificação

- Sessão 10i (fix datas, HTTP, sessão real): `GET /api/app/production?month=2026-08` → 6 registros `value=36`; POST com data padrão `2026-08-01` → gravado `04:00:00Z` e visível no mês; `tsc` limpo; `npm run build` ok.
- `npx tsc --noEmit` → sem output (limpo) — sessão 8.
- `npm run build` → ok — sessão 8 (rota `/app/pacientes/[id]/editar` presente).
- Sessão 8 (HTTP, sessão real `fabio@sorriso.com.br`): criar paciente 200 → página `/app/pacientes/[id]/editar` 200 → PATCH 200 → DELETE `?hard=1` 200 (`deleted:true`) → GET após delete 404. Archive (sem flag) 200 `archived:true` + GET ainda 200 (ativo). Busca QA → 0 restantes.
- Sessão 8 (logo): `/`, `/login`, `/esqueci-senha` 200 com `toothLogoGrad` presente no HTML.
- Sessão 7 (HTTP, sessão real): `/app`, `/app/fotografias`, `/app/radiografias`, `/app/pacientes`, `/app/documentos`, `/app/agenda` → 200, `badChars=false`; `/admin` → 307 `/app`.
- Sessão 7 (banco): varredura `chr(65533)` em 15 tabelas → 0 corrompidos.

## Próximos passos sugeridos (não executados)

- [x] Imagens do paciente implementado (sessão 5).
- [ ] **Logo**: opcional refatorar `ToothLogo` p/ `useId` no SVG (páginas com 2 logos duplicam `toothLogoGrad`), e/ou gerar versões da logo (dente + variação favicon/app).
- [ ] **Notificações e lembretes de consulta** (API `/api/notifications` existe, falta UI).
- [ ] **LGPD**: exportar/eliminar dados do paciente (hoje só consentimento).
- [ ] **Integração OpenAI real** (chave de produção; hoje mock).
- [ ] **PDFs**: geração de laudos/termos para impressão (módulo documents tem só texto).
- [ ] LGPD: exportar/eliminar dados do paciente (hoje só consentimento).
- [ ] Integração OpenAI real (chave de produção; hoje mock).
- [ ] PDFs: geração de laudos/termos para impressão (módulo documents tem só texto).

## Decisões e "gotchas" registrados

- PowerShell: variáveis em scripts One-liner com `-e` quebram por `$disconnect` etc. **preferir arquivo `.ts` temporário** + `npx tsx` e remover depois.
- `$PID` (maiúsculo) é variável reservada do PowerShell — **nunca usar `$pid`** em script que toca a API.
- Quandocriar planos de teste / quando módulo 403 esperado: conferir módulos atuais do plano no tenant antes de tratar como bug.
- Migração com nome fixo `*_financial_cat_unique_type` já aplicada — não re-aplicar.