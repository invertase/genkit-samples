import { sql } from "./db";

export type Column = {
  name: string;
  type: string;
  nullable: boolean;
  default: string | null;
};

export type Table = {
  name: string;
  columns: Column[];
};

export type Introspect = {
  tables: Table[];
};

export async function introspect(): Promise<Introspect> {
  const tablesResult = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
  `;
  const tables = tablesResult.map(
    (row) => ({ name: row.table_name as string, columns: [] }) as Table,
  );

  for (const table of tables) {
    const columnsResult = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = ${table.name};
    `;

    table.columns.push(
      ...columnsResult.map((column) => ({
        name: column.column_name as string,
        type: column.data_type as string,
        nullable: column.is_nullable === "YES",
        default: column.column_default as string | null,
      })),
    );
  }

  return { tables };
}
