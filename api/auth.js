function authEnabled(){return Boolean(process.env.OWNER_PIN)}
function authorized(req){if(!authEnabled())return true;return req.cookies?.dayline_owner==='1'}
function deny(res){return res.status(401).json({error:'Unauthorized'})}
function setCookie(res,value,maxAge){const secure=process.env.NODE_ENV==='production'?'; Secure':'';res.setHeader('Set-Cookie','dayline_owner='+value+'; Path=/; Max-Age='+maxAge+'; HttpOnly; SameSite=Lax'+secure)}
export default function handler(req,res){
  if(req.method==='DELETE'){setCookie(res,'',0);return res.status(200).json({ok:true})}
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  if(!authEnabled()) return res.status(200).json({ok:true});
  if(String(req.body?.pin||'')!==String(process.env.OWNER_PIN)) return res.status(401).json({error:'That PIN is not correct.'});
  setCookie(res,'1',60*60*24*14);return res.status(200).json({ok:true});
}
export {authorized,deny};