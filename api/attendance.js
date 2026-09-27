import { configured, sql, ensureSchema } from '../server/db.js';
import { authorized, deny } from '../server/auth.js';
export default async function handler(req,res){
  if(!authorized(req)) return deny(res);
  if(!configured) return res.status(503).json({error:'Database is not configured.',attendance:[]});
  try{
    await ensureSchema();
    if(req.method==='POST'){
      const employeeId=String(req.body?.employeeId||''),date=String(req.body?.date||''),status=String(req.body?.status||'');
      if(!employeeId||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!['present','absent','half_day','leave'].includes(status)) return res.status(400).json({error:'Invalid attendance data.'});
      const rows=await sql.query('insert into attendance(employee_id,attendance_date,status) values($1::uuid,$2::date,$3) on conflict(employee_id,attendance_date) do update set status=excluded.status,updated_at=now() returning id,employee_id,attendance_date::text,status',[employeeId,date,status]);
      return res.status(200).json(rows[0]);
    }
    if(req.method==='GET'){
      const employeeId=req.query?.employeeId,from=req.query?.from,to=req.query?.to;
      if(!employeeId||!from||!to) return res.status(400).json({error:'employeeId, from and to are required.'});
      const rows=await sql.query('select id,employee_id,attendance_date::text,status from attendance where employee_id=$1::uuid and attendance_date between $2::date and $3::date order by attendance_date asc',[employeeId,from,to]);
      return res.status(200).json({attendance:rows});
    }
    return res.status(405).json({error:'Method not allowed'});
  }catch(e){console.error(e);return res.status(500).json({error:'Could not read or save attendance.'})}
}