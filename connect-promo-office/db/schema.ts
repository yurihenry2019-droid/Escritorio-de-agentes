import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
export const officeEvents=sqliteTable('office_events',{
  id:text('id').primaryKey(),runId:text('run_id').notNull(),agent:text('agent').notNull(),code:text('code').notNull(),state:text('state').notNull(),count:integer('count').notNull(),createdAt:integer('created_at').notNull(),payloadHash:text('payload_hash').notNull(),
},table=>[index('office_events_time').on(table.createdAt),index('office_events_agent').on(table.agent,table.createdAt)]);
export const officeLeases=sqliteTable('office_leases',{
  task:text('task').primaryKey(),runId:text('run_id').notNull(),expiresAt:integer('expires_at').notNull(),
});
