import "dotenv/config";
import { Client } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL nao configurada.");
}

function quoteIdentifier(identifier: string) {
  return `"${identifier.replaceAll('"', '""')}"`;
}

async function main() {
  const targetUrl = new URL(databaseUrl);
  const databaseName = targetUrl.pathname.replace("/", "");

  if (!databaseName) {
    throw new Error("Nome do banco nao encontrado na DATABASE_URL.");
  }

  const maintenanceUrl = new URL(databaseUrl);
  maintenanceUrl.pathname = "/postgres";
  maintenanceUrl.search = "";

  const client = new Client({
    connectionString: maintenanceUrl.toString(),
  });

  await client.connect();

  const database = await client.query(
    "select 1 from pg_database where datname = $1",
    [databaseName],
  );

  if (!database.rowCount) {
    await client.query(`create database ${quoteIdentifier(databaseName)}`);
    console.log(`Banco criado: ${databaseName}`);
  } else {
    console.log(`Banco ja existe: ${databaseName}`);
  }

  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
