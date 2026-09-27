export function authorized(req){if(!process.env.OWNER_PIN)return true;return req.cookies?.dayline_owner==='1'}
export function deny(res){return res.status(401).json({error:'Unauthorized'})}