import { configured, sql, ensureSchema } from '../server/db.js';
import { authorized, deny } from '../server/auth.js';
function todayISO(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata'}).format(new Date())}
export default async function handler(req,res){
  if(!authorized(req)) return deny(res);
  const today=todayISO();
  if(!configured) return res.status(200).json({configured:false,employees:[],attendance:[],today});
  try{
    await ensureSchema();
    const employees=await sql.query('select id,name,role,photo_data from employees where active=true order by created_at asc');
    const attendance=await sql.query('select employee_id,attendance_date::text,status from attendance where attendance_date=$1::date',[today]);
    return res.status(200).json({configured:true,employees,attendance,today});
  }catch(e){console.error(e);return res.status(500).json({error:'Database connection failed.'})}
}