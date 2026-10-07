import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getConnection() {
  const { data, error } = await supabase
    .from("linkedin_connections")
    .select("*")
    .eq("account_key", "krupal")
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function publishPost(text: string) {
  const conn = await getConnection();
  if (!conn) throw new Error("Krupal's LinkedIn is not connected. Open /api/auth/linkedin/start first.");

  // The current connection stores the member token. We use the LinkedIn
  // member endpoint to resolve the member URN before creating the post.
  const me = await fetch("https://api.linkedin.com/v2/me", {
    headers: { Authorization: `Bearer ${conn.access_token}` }
  });
  const meData:any = await me.json().catch(()=>({}));
  if (!me.ok) throw new Error(`LinkedIn /v2/me ${me.status}: ${JSON.stringify(meData)}`);

  const author = `urn:li:person:${meData.id}`;
  const payload = {
    author,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text },
        shareMediaCategory: "NONE"
      }
    },
    visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" }
  };

  if ((process.env.DRY_RUN || "true").toLowerCase() !== "false") {
    return { dryRun:true, wouldPublish:true, author, text };
  }

  const r = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method:"POST",
    headers:{
      Authorization:`Bearer ${conn.access_token}`,
      "Content-Type":"application/json",
      "X-Restli-Protocol-Version":"2.0.0"
    },
    body:JSON.stringify(payload)
  });
  const data:any = await r.json().catch(()=>({}));
  if (!r.ok) throw new Error(`LinkedIn publish ${r.status}: ${JSON.stringify(data)}`);
  return { published:true, response:data };
}

function makeServer() {
  const server = new McpServer({name:"Krupal LinkedIn", version:"1.0.0"});
  server.tool("linkedin_status","Check Krupal's LinkedIn connection and safe-mode status.",{},async()=>{
    const conn=await getConnection();
    return {content:[{type:"text",text:JSON.stringify({
      linkedinAuthorized:Boolean(conn),
      dryRun:(process.env.DRY_RUN||"true").toLowerCase()!=="false"
    })}]};
  });
  server.tool(
    "linkedin_create_post",
    "Prepare or publish a LinkedIn text post for Krupal. Publishing is blocked while DRY_RUN=true.",
    {text:z.string().min(1).max(3000)},
    async({text})=>{
      const result=await publishPost(text);
      return {content:[{type:"text",text:JSON.stringify(result)}]};
    }
  );
  return server;
}

export default async function handler(req:any,res:any){
  if(req.method!=="POST") return res.status(405).json({error:"POST only"});
  const key=process.env.MCP_API_KEY;
  if(key && req.headers["x-mcp-api-key"]!==key) return res.status(401).json({error:"Unauthorized"});
  const transport=new StreamableHTTPServerTransport({sessionIdGenerator:undefined});
  const server=makeServer();
  await server.connect(transport);
  await transport.handleRequest(req,res,req.body);
}
