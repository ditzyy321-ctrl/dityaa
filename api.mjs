import {getStore} from '@netlify/blobs';
import {randomInt,randomBytes,createHash,timingSafeEqual} from 'node:crypto';
const POS=['Admin Komunikasi','Moderator Chat','Community Manager','Event Organizer','Live Moderator'];
const F=['nama','usia','wa','posisi','waktu','pk','pa','jam','q1','q2','q3','q4','q5','qx'];
const J=(o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{'content-type':'application/json','cache-control':'no-store'}});
const hash=t=>createHash('sha256').update(String(t)).digest('hex');
const str=(v,m)=>typeof v==='string'?v.trim().slice(0,m):'';
const okKey=k=>{if(!process.env.ADMIN_KEY)return false;return timingSafeEqual(Buffer.from(hash(k||'')),Buffer.from(hash(process.env.ADMIN_KEY)))};
export default async(req)=>{
  const u=new URL(req.url),p=u.pathname.replace(/^\/api/,''),st=getStore({name:'seleksi',consistency:'strong'});
  const o=req.headers.get('origin');if(req.method!=='GET'&&o&&new URL(o).host!==u.host)return J({error:'origin'},403);
  try{
    if(req.method==='POST'&&p==='/apply'){
      let b;try{b=await req.json()}catch{return J({error:'data tidak valid'},400)}
      const d={};F.forEach(k=>d[k]=str(b[k],2000));const wa=d.wa.replace(/\D/g,'');
      if(!d.nama||!d.q1||!d.q2||!d.q3||!d.q4||!d.q5||!POS.includes(d.posisi)||wa.length<9||wa.length>15)return J({error:'formulir belum lengkap atau tidak valid'},400);
      const ex=await st.get('wa/'+wa,{type:'json'});
      if(ex){const a=await st.get('app/'+ex.id,{type:'json'});if(a&&a.status==='Pending')return J({error:'nomor ini masih punya pendaftaran yang sedang ditinjau ('+ex.id+')'},409)}
      let id;for(let i=0;i<8;i++){const c='SE-'+randomInt(10000,100000);if(!(await st.get('app/'+c,{type:'json'}))){id=c;break}}
      if(!id)return J({error:'gagal membuat ID, coba lagi'},500);
      const token=randomBytes(12).toString('hex'),now=new Date().toISOString();
      await st.setJSON('app/'+id,{id,tokenHash:hash(token),data:d,status:'Pending',created_at:now,updated_at:now,decided_at:null,history:[]});
      await st.setJSON('wa/'+wa,{id});
      return J({id,token,status:'Pending'});
    }
    if(req.method==='GET'&&p==='/status'){
      const a=await st.get('app/'+str(u.searchParams.get('id'),20),{type:'json'}),t=u.searchParams.get('token')||'';
      if(!a||!timingSafeEqual(Buffer.from(hash(t)),Buffer.from(a.tokenHash)))return J({error:'tidak ditemukan'},404);
      return J({status:a.status,position:a.data.posisi,decided_at:a.decided_at});
    }
    if(p.startsWith('/admin')){
      if(!okKey(req.headers.get('x-admin-key')))return J({error:'unauthorized'},401);
      if(req.method==='GET'&&p==='/admin/list'){
        const {blobs}=await st.list({prefix:'app/'});
        const all=(await Promise.all(blobs.slice(0,300).map(b=>st.get(b.key,{type:'json'})))).filter(Boolean).map(({tokenHash,...r})=>r);
        return J(all.sort((a,b)=>b.created_at.localeCompare(a.created_at)));
      }
      if(req.method==='POST'&&p==='/admin/decide'){
        let b;try{b=await req.json()}catch{return J({error:'data tidak valid'},400)}
        if(!['Accepted','Rejected'].includes(b.decision))return J({error:'keputusan tidak valid'},400);
        const key='app/'+str(b.id,20),a=await st.get(key,{type:'json'});
        if(!a)return J({error:'ID tidak ditemukan'},404);
        if(a.status===b.decision)return J({error:'sudah berstatus '+a.status+', tidak ada perubahan'},409);
        if(a.status!=='Pending'&&b.force!==true)return J({error:'sudah diputuskan; gunakan tinjau ulang'},409);
        const now=new Date().toISOString();
        a.history.push({decision:b.decision,at:now,force:b.force===true});a.status=b.decision;a.updated_at=now;a.decided_at=now;
        await st.setJSON(key,a);return J({ok:true,status:a.status});
      }
    }
    return J({error:'not found'},404);
  }catch(e){console.error(e);return J({error:'server error'},500)}
};
export const config={path:'/api/*'};
