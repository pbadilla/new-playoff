import Fastify from 'fastify';
import cors from '@fastify/cors';
import { createDb, members } from '@club/database';
import { createMemberSchema } from '@club/schemas';
import { eq } from 'drizzle-orm';

const app=Fastify({logger:true});
await app.register(cors,{origin:true});
app.get('/health', async()=>({ok:true,service:'api'}));
app.get('/organizations/:organizationId/members', async(req)=>{
  const {organizationId}=req.params as {organizationId:string};
  return createDb().select().from(members).where(eq(members.organizationId,organizationId));
});
app.post('/members', async(req,reply)=>{
  const parsed=createMemberSchema.safeParse(req.body);
  if(!parsed.success) return reply.code(400).send({error:parsed.error.flatten()});
  const [member]=await createDb().insert(members).values(parsed.data).returning();
  return reply.code(201).send(member);
});
await app.listen({port:Number(process.env.PORT ?? 3001),host:'0.0.0.0'});
