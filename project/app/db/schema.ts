import { integer, pgTable, uuid, varchar, timestamp, jsonb, index } from 'drizzle-orm/pg-core';

export const lead = pgTable('lead', {
    id: uuid('id').primaryKey().defaultRandom(),
    requestId: varchar('request_id', { length: 255 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 255 }).notNull(),
    status: varchar('status', { length: 255 }).default('new').notNull(),
    agentId: uuid('agent_id').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const auditLog = pgTable('audit_log', {
    id: uuid('id').primaryKey().defaultRandom(),
    action: varchar('action', { length: 255 }).notNull(),
    details: varchar('details', { length: 255 }).notNull(),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
})


export const user = pgTable('user', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    activeLeadsCount: integer('active_leads_count').default(0).notNull(),
    region: varchar('region', { length: 255 }).notNull(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull()
},
    (table) => ({ workloadIndex: index('workload_index').on(table.activeLeadsCount), })
);