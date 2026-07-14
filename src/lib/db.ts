import "reflect-metadata";
import { MikroORM, RequestContext } from "@mikro-orm/core";
import config from "../../mikro-orm.config";

let ormPromise: Promise<MikroORM> | null = null;

export async function getORM(): Promise<MikroORM> {
  if (!ormPromise) {
    ormPromise = MikroORM.init(config);
  }
  return ormPromise;
}

export async function withORM<T>(fn: () => Promise<T>): Promise<T> {
  const orm = await getORM();
  return RequestContext.create(orm.em, fn);
}

export async function ensureSchema(): Promise<void> {
  const orm = await getORM();
  await orm.schema.ensureDatabase();
  await orm.schema.update({ safe: true });
}
