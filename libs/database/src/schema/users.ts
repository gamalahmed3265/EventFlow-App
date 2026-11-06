import { pgEnum, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

// Enum for User Roles

export const roleEnum = pgEnum('role', ['admin', 'user', 'ORGANIZER']);


// Users Table Schema
export const users = pgTable('users', {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    password: varchar('password', { length: 255 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    role: roleEnum('role').notNull().default('user'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});


export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;