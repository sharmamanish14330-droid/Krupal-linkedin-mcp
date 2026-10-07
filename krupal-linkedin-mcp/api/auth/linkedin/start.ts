import crypto from 'node:crypto';
export default async function handler(_req:any,res:any){
  const base=process.env.PUBLIC_BASE_URL!.replace(/\/$/,"");
  const state=crypto.randomUUID();
  // For this first private setup, state is signed into a short-lived cookie.
  res.setHeader("Set-Cookie",`li_oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);
  const p=new URLSearchParams({
    response_type:"code",
    client_id:process.env.LINKEDIN_CLIENT_ID!,
    redirect_uri:`${base}/api/auth/linkedin/callback`,
    state,
    scope:"w_member_social"
  });
  res.redirect(`https://www.linkedin.com/oauth/v2/authorization?${p.toString()}`);
}
