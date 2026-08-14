/**
 * Migração de dados entre bancos PostgreSQL (ex.: Netlify Database -> Neon).
 *
 * Uso:
 *   npx tsx scripts/migrate-db.ts size --src "$SRC_URL"
 *   npx tsx scripts/migrate-db.ts copy --src "$SRC_URL" --dst "$DST_URL"
 *
 * O banco de destino precisa já ter o schema criado (rode antes):
 *   npx prisma migrate deploy   (com DATABASE_URL apontando para o destino)
 *
 * Requisitos: variáveis de ambiente MIGRATE_SRC_URL / MIGRATE_DST_URL ou os
 * argumentos --src / --dst. Os dois formatos podem ser combinados.
 */
import { Client } from "pg"

type Mode = "size" | "copy"

interface Options {
  mode: Mode
  src: string
  dst?: string
}

function parseArgs(argv: string[]): Options {
  const get = (name: string) => {
    const i = argv.indexOf(name)
    return i >= 0 ? argv[i + 1] : undefined
  }
  const positional = argv.find((a) => !a.startsWith("-"))
  const mode = (get("--mode") ?? positional ?? "copy") as Mode
  if (mode !== "size" && mode !== "copy") {
    throw new Error(`Modo inválido: ${mode} (use size ou copy)`)
  }
  const src = get("--src") ?? process.env.MIGRATE_SRC_URL
  const dst = get("--dst") ?? process.env.MIGRATE_DST_URL
  if (!src) throw new Error("Informe o banco de origem com --src ou MIGRATE_SRC_URL")
  if (mode === "copy" && !dst) throw new Error("Informe o banco de destino com --dst ou MIGRATE_DST_URL")
  return { mode, src, dst }
}

async function connect(url: string, label: string) {
  const client = new Client({ connectionString: url, connectionTimeoutMillis: 20000 })
  await client.connect()
  console.log(`Conectado ao ${label}.`)
  return client
}

interface TableInfo {
  name: string
  columns: string[]
}

async function listTables(client: Client): Promise<TableInfo[]> {
  const { rows: tables } = await client.query<{ table_name: string }>(
    `SELECT table_name
       FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        AND table_name <> '_prisma_migrations'
      ORDER BY table_name`,
  )

  const infos: TableInfo[] = []
  for (const t of tables) {
    const { rows: cols } = await client.query<{ column_name: string }>(
      `SELECT column_name
         FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position`,
      [t.table_name],
    )
    infos.push({ name: t.table_name, columns: cols.map((c) => c.column_name) })
  }
  return infos
}

/** Ordena as tabelas para que os pais (referenciados) venham antes dos filhos. */
function topologicalOrder(infos: TableInfo[], client: Client): Promise<string[]> {
  return client
    .query<{ table_name: string; referenced_table: string }>(
      `SELECT tc.table_name, ccu.table_name AS referenced_table
         FROM information_schema.table_constraints tc
         JOIN information_schema.key_column_usage kcu
           ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
         JOIN information_schema.constraint_column_usage ccu
           ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'`,
    )
    .then(({ rows }) => {
      const names = new Set(infos.map((t) => t.name))
      const parents = new Map<string, Set<string>>()
      for (const t of infos) parents.set(t.name, new Set())
      for (const r of rows) {
        if (names.has(r.table_name) && names.has(r.referenced_table)) {
          parents.get(r.table_name)!.add(r.referenced_table)
        }
      }

      const order: string[] = []
      const visited = new Set<string>()
      const visiting = new Set<string>()

      const visit = (table: string) => {
        if (visited.has(table)) return
        if (visiting.has(table)) return
        visiting.add(table)
        for (const parent of parents.get(table) ?? []) visit(parent)
        visiting.delete(table)
        visited.add(table)
        order.push(table)
      }

      for (const t of infos) visit(t.name)
      return order
    })
}

function quoted(name: string) {
  return `"${name.replace(/"/g, '""')}"`
}

async function copyTable(src: Client, dst: Client, table: TableInfo) {
  const cols = table.columns
  const select = await src.query(`SELECT * FROM ${quoted(table.name)}`)
  const rows = select.rows
  if (rows.length === 0) {
    console.log(`  ${table.name}: 0 linhas (vazia)`)
    return 0
  }

  const colList = cols.map(quoted).join(", ")
  const BATCH = 100
  let inserted = 0

  await dst.query("BEGIN")
  try {
    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH)
      const params: unknown[] = []
      const groups: string[] = []
      for (const row of batch) {
        const placeholders = cols.map((_, j) => `$${params.length + j + 1}`).join(", ")
        groups.push(`(${placeholders})`)
        for (const col of cols) params.push(row[col])
      }
      await dst.query(
        `INSERT INTO ${quoted(table.name)} (${colList}) VALUES ${groups.join(", ")}`,
        params,
      )
      inserted += batch.length
    }
    await dst.query("COMMIT")
  } catch (e) {
    await dst.query("ROLLBACK")
    throw new Error(`Falha ao copiar tabela ${table.name}: ${(e as Error).message}`)
  }

  console.log(`  ${table.name}: ${inserted} linhas copiadas`)
  return inserted
}

async function reportSize(src: Client) {
  const { rows: dbSize } = await src.query<{ total: string }>(
    `SELECT pg_size_pretty(pg_database_size(current_database())) AS total`,
  )
  console.log(`\nTamanho total do banco: ${dbSize[0].total}\n`)

  const { rows } = await src.query<{ table: string; size: string }>(
    `SELECT relname AS table,
            pg_size_pretty(pg_total_relation_size(c.oid)) AS size
       FROM pg_class c
       JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind = 'r'
      ORDER BY pg_total_relation_size(c.oid) DESC`,
  )
  console.table(rows)
}

async function main() {
  const opts = parseArgs(process.argv.slice(2))
  const src = await connect(opts.src, "banco de origem")

  try {
    if (opts.mode === "size") {
      await reportSize(src)
      return
    }

    const dst = await connect(opts.dst!, "banco de destino")
    try {
      const infos = await listTables(dst)
      const order = await topologicalOrder(infos, dst)
      console.log(`Ordem de cópia (${order.length} tabelas): ${order.join(", ")}\n`)

      const byName = new Map(infos.map((t) => [t.name, t]))
      let total = 0
      for (const name of order) {
        total += await copyTable(src, dst, byName.get(name)!)
      }
      console.log(`\nMigração concluída: ${total} linhas copiadas.`)
    } finally {
      await dst.end()
    }
  } finally {
    await src.end()
  }
}

main().catch((e) => {
  console.error("\nErro:", e.message)
  process.exit(1)
})