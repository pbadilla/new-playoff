import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { pgTable, uuid, text, timestamp, date, uniqueIndex } from 'drizzle-orm/pg-core';

export const organizations = pgTable('organizations', {
  id: uuid('id').defaultRandom().primaryKey(), name: text('name').notNull(), createdAt: timestamp('created_at',{withTimezone:true}).defaultNow().notNull()
});
export const organizationUsers = pgTable('organization_users', {
  organizationId: uuid('organization_id').notNull().references(()=>organizations.id,{onDelete:'cascade'}),
  userId: uuid('user_id').notNull(), role: text('role').notNull().default('member')
}, t=>[uniqueIndex('organization_users_unique').on(t.organizationId,t.userId)]);
export const seasons = pgTable('seasons', { id:uuid('id').defaultRandom().primaryKey(), organizationId:uuid('organization_id').notNull().references(()=>organizations.id,{onDelete:'cascade'}), name:text('name').notNull(), startsOn:date('starts_on').notNull(), endsOn:date('ends_on').notNull() });
export const families = pgTable('families', { id:uuid('id').defaultRandom().primaryKey(), organizationId:uuid('organization_id').notNull().references(()=>organizations.id,{onDelete:'cascade'}), name:text('name').notNull() });
export const members = pgTable('members', { id:uuid('id').defaultRandom().primaryKey(), organizationId:uuid('organization_id').notNull().references(()=>organizations.id,{onDelete:'cascade'}), familyId:uuid('family_id').references(()=>families.id,{onDelete:'set null'}), firstName:text('first_name').notNull(), lastName:text('last_name').notNull(), email:text('email'), birthDate:date('birth_date'), createdAt:timestamp('created_at',{withTimezone:true}).defaultNow().notNull() });
export const teams = pgTable('teams', { id:uuid('id').defaultRandom().primaryKey(), organizationId:uuid('organization_id').notNull().references(()=>organizations.id,{onDelete:'cascade'}), seasonId:uuid('season_id').notNull().references(()=>seasons.id,{onDelete:'cascade'}), name:text('name').notNull() });
export const enrollments = pgTable('enrollments', { id:uuid('id').defaultRandom().primaryKey(), organizationId:uuid('organization_id').notNull().references(()=>organizations.id,{onDelete:'cascade'}), seasonId:uuid('season_id').notNull().references(()=>seasons.id), memberId:uuid('member_id').notNull().references(()=>members.id), teamId:uuid('team_id').references(()=>teams.id), status:text('status').notNull().default('active') });

export function createDb(url=process.env.DATABASE_URL!) { const client=postgres(url,{prepare:false}); return drizzle(client); }
