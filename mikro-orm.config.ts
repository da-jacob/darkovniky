import { defineConfig } from "@mikro-orm/postgresql";
import { ReflectMetadataProvider } from "@mikro-orm/decorators/legacy";
import { GiftItem, GiftList, User } from "./src/entities";

export default defineConfig({
  entities: [User, GiftList, GiftItem],
  clientUrl: process.env.DATABASE_URL,
  metadataProvider: ReflectMetadataProvider,
  migrations: {
    path: "./src/migrations",
    glob: "!(*.d).{js,ts}",
  },
  debug: process.env.NODE_ENV === "development",
});
