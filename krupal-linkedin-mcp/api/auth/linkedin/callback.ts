import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";

const supabase=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!);
function cookie(req:any,name:string){
  const raw=req.headers.cookie||"";
  const part=raw.split(";").map((x:string)=>x.trim()).find((x:string)=>x.startsWith(name+"="));
  return part ? decodeURIComponent(part.split("=")[1]) : "";
}
export default async function handler(req:any,res:any){
  try{
    const state=cookie(req,"li_oauth_state");
    if(!req.query.code || !req.query.state || req.query.state!==state) return res.status(400).send("Invalid OAuth state.");
    const base=process.env.PUBLIC_BASE_URL!.replace(/\/$/,"");
    const tokenResp=await fetch("https://www.linkedin.com/oauth/v2/accessToken",{
      method:"POST",
      headers:{"Content-Type":"application/x-www-form-urlencoded"},
      body:new URLSearchParams({
        grant_type:"authorization_code",
        code:String(req.query.code),
        redirect_uri:`${base}/api/auth/linkedin/callback`,
        client_id:process.env.LINKEDIN_CLIENT_ID!,
        client_secret:process.env.LINKEDIN_CLIENT_SECRET!
      })
    });
    const token:any=await tokenResp.json();
    if(!tokenResp.ok) return res.status(400).json(token);

    const {error}=await supabase.from("linkedin_connections").upsert({
      account_key:"krupal",
      access_token:token.access_token,
      expires_at: token.expires_in ? new Date(Date.now()+Number(token.expires_in)*1000).toISOString() : null,
      updated_at:new Date().toISOString()
    },{onConflict:"account_key"});
    if(error) throw error;

    res.send("<h2>Krupal's LinkedIn is connected.</h2><p>You can close this tab and return to Claude.</p>");
  }catch(e:any){res.status(500).send(e?.message||"OAuth error");}
}
