import { Global, Module } from "@nestjs/common";
import * as schema from "@ndjar/database";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

export const DATABASE = Symbol("DATABASE");

export type Database = ReturnType<typeof drizzle<typeof schema>>;

@Global()
@Module({
  providers: [
    {
      provide: DATABASE,
      useFactory() {
        if (process.env.NDJAR_DATABASE_MODE === "fixture") {
          return null;
        }

        const databaseUrl = process.env.DATABASE_URL;
        if (!databaseUrl) {
          throw new Error("DATABASE_URL is required");
        }

        const client = postgres(databaseUrl, { max: 10 });
        return drizzle(client, { schema });
      },
    },
  ],
  exports: [DATABASE],
})
export class DatabaseModule {}
