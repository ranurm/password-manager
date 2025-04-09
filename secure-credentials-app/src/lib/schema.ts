import { sql } from 'drizzle-orm';
import { text, integer, sqliteTable } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull(),
  email: text('email').notNull(),
  passwordHash: text('passwordHash').notNull(),
  passwordSalt: text('passwordSalt').notNull(),
  encryptionKeySalt: text('encryptionKeySalt').notNull(),
  twoFactorEnabled: integer('twoFactorEnabled', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('createdAt').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updatedAt').notNull().default(sql`CURRENT_TIMESTAMP`)
});

export const devices = sqliteTable('devices', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull().references(() => users.id),
  name: text('name').notNull(),
  publicKey: text('publicKey').notNull(),
  createdAt: text('createdAt').notNull().default(sql`CURRENT_TIMESTAMP`),
  lastUsed: text('lastUsed').notNull().default(sql`CURRENT_TIMESTAMP`)
});

export const credentials = sqliteTable('credentials', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull().references(() => users.id),
  title: text('title').notNull(),
  username: text('username').notNull(),
  encryptedPassword: text('encryptedPassword').notNull(),
  passwordIV: text('passwordIV').notNull(),
  passwordAuthTag: text('passwordAuthTag').notNull(),
  url: text('url'),
  notes: text('notes'),
  category: text('category'),
  favorite: integer('favorite', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('createdAt').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updatedAt').notNull().default(sql`CURRENT_TIMESTAMP`)
});

export const challenges = sqliteTable('challenges', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull().references(() => users.id),
  deviceName: text('deviceName').notNull(),
  code: text('code').notNull(),
  status: text('status').notNull().default('pending'),
  createdAt: text('createdAt').notNull().default(sql`CURRENT_TIMESTAMP`),
  expiresAt: text('expiresAt').notNull()
}); 