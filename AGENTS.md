<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## lucide-react — missing icons
The installed version of lucide-react does NOT export brand icons.
The following will cause a build error — never import them:
- `Instagram`, `Linkedin`, `Twitter`, `Youtube`, `Facebook`, `Github`

Use `Globe` as a substitute for any social platform icon.
