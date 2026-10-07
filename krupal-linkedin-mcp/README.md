# Krupal LinkedIn MCP bridge

This is a deploy-ready starting point for a private Claude -> LinkedIn bridge.

Flow:
Claude custom connector -> /api/mcp -> this server -> LinkedIn OAuth/API

Before publishing, keep DRY_RUN=true. This first version exposes only:
- linkedin_status
- linkedin_create_post

You will need a small Supabase table to persist Krupal's OAuth token because Vercel functions are stateless.

Setup:
1. Create a Supabase project and run supabase.sql in SQL Editor.
2. Deploy this folder to Vercel.
3. Add all .env.example variables in Vercel.
4. Set PUBLIC_BASE_URL to the deployed HTTPS URL.
5. In LinkedIn Developer > Auth add:
   https://YOUR-DOMAIN/api/auth/linkedin/callback
6. Open:
   https://YOUR-DOMAIN/api/auth/linkedin/start
   while logged into Krupal's LinkedIn.
7. Approve w_member_social.
8. Confirm /api/health shows linkedinAuthorized=true.
9. Add https://YOUR-DOMAIN/api/mcp as a custom remote connector in Claude.
10. Keep DRY_RUN=true for the first MCP test. Only later change it to false.

Never share or commit LINKEDIN_CLIENT_SECRET or the Supabase service-role key.
