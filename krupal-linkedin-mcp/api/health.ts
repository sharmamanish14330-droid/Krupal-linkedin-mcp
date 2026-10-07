import { createClient } from "@supabase/supabase-js";
const supabase=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!);
export default async function handler(_req:any,res:any){
  const {data}=await supabase.from("linkedin_connections").select("account_key,expires_at").eq("account_key","krupal").maybeSingle();
  res.json({ok:true,linkedinAuthorized:Boolean(data),dryRun:(process.env.DRY_RUN||"true").toLowerCase()!=="false"});
}
