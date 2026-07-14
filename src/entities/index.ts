import { Collection } from "@mikro-orm/core";
import {
  Entity,
  Enum,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
} from "@mikro-orm/decorators/legacy";

@Entity({ tableName: "user" })
export class User {
  @PrimaryKey({ type: "uuid", defaultRaw: "gen_random_uuid()" })
  id!: string;

  @Property({ type: "string", unique: true })
  username!: string;

  @Property({ type: "string", hidden: true })
  passwordHash!: string;

  @Property({ type: "date", defaultRaw: "now()" })
  createdAt!: Date;

  @OneToMany(() => GiftList, (list) => list.owner)
  lists = new Collection<GiftList>(this);
}

export enum ListType {
  PUBLIC_WISHLIST = "public_wishlist",
  PRIVATE_IDEAS = "private_ideas",
}

@Entity({ tableName: "gift_list" })
export class GiftList {
  @PrimaryKey({ type: "uuid", defaultRaw: "gen_random_uuid()" })
  id!: string;

  @ManyToOne(() => User)
  owner!: User;

  @Enum({ items: () => ListType })
  type!: ListType;

  @Property({ type: "string" })
  title!: string;

  @Property({ type: "string", nullable: true })
  recipientName?: string;

  @ManyToOne(() => User, { nullable: true })
  recipientUser?: User;

  @Property({ type: "date", defaultRaw: "now()" })
  createdAt!: Date;

  @Property({ type: "date", defaultRaw: "now()", onUpdate: () => new Date() })
  updatedAt!: Date;

  @OneToMany(() => GiftItem, (item) => item.list)
  items = new Collection<GiftItem>(this);
}

@Entity({ tableName: "gift_item" })
export class GiftItem {
  @PrimaryKey({ type: "uuid", defaultRaw: "gen_random_uuid()" })
  id!: string;

  @ManyToOne(() => GiftList)
  list!: GiftList;

  @Property({ type: "string" })
  name!: string;

  @Property({ type: "string", nullable: true })
  url?: string;

  @Property({ type: "decimal", precision: 10, scale: 2, nullable: true })
  price?: string;

  @Property({ type: "date", defaultRaw: "now()" })
  createdAt!: Date;
}
