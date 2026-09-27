import { configured, sql, ensureSchema } from '../server/db.js';
import { authorized, deny } from '../server/auth.js';
export default async function handler(req,res){
  if(!authorized(req)) return deny(res);
  if(!configured) return res.status(503).json({error:'Database is not configured.'});
  try{
    await ensureSchema();
    const id=req.query?.id;
    if(req.method==='POST'){
      const name=String(req.body?.name||'').trim(),role=String(req.body?.role||'Team member').trim()||'Team member',photo=typeof req.body?.photoData==='string'?req.body.photoData:null;
      if(!name) return res.status(400).json({error:'Name is required.'});
      if(photo&&photo.length>850000) return res.status(413).json({error:'Photo is too large.'});
      const rows=await sql.query('insert into employees(name,role,photo_data) values($1,$2,$3) returning id,name,role,photo_data',[name,role,photo]);
      return res.status(201).json(rows[0]);
    }
    if(req.method==='PATCH'&&id){
      const name=typeof req.body?.name==='string'?req.body.name.trim():null,role=typeof req.body?.role==='string'?req.body.role.trim():null,photo=typeof req.body?.photoData==='string'?req.body.photoData:null,removePhoto=req.body?.removePhoto===true;
      const rows=await sql.query('update employees set name=coalesce($1,name),role=coalesce($2,role),photo_data=case when $3::boolean then null when $4::text is not null then $4 else photo_data end where id=$5::uuid and active=true returning id,name,role,photo_data',[name,role,removePhoto,photo,id]);
      if(!rows[0]) return res.status(404).json({error:'Employee not found.'});
      return res.status(200).json(rows[0]);
    }
    if(req.method==='DELETE'&&id){
      const rows=await sql.query('update employees set active=false where id=$1::uuid and active=true returning id',[id]);
      if(!rows[0]) return res.status(404).json({error:'Employee not found.'});
      return res.status(200).json({ok:true});
    }
    return res.status(405).json({error:'Method not allowed'});
  }catch(e){console.error(e);return res.status(500).json({error:'Could not update team.'})}
}