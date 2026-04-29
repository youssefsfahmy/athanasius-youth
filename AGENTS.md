<!-- BEGIN:nextjs-agent-rules -->

# Project Architecture Rules

## Next.js & Framework

- This version has breaking changes — APIs, conventions, and file structure may differ from training data
- Use `"use client"` for interactive components; use `"use server"` for server actions
- Server actions must handle redirects with try/catch and emit `<LoadingOverlay>` during navigation
- Protected routes live in `src/app/(protected)/`; public routes in `src/app/`

## File Organization

- **Components** (`src/components/`): Reusable UI building blocks, always client-side
- **Pages** (`src/app/`): Route handlers and page layouts
- **Server Actions** (`src/app/*/actions.ts`): Form submission handlers, data mutations
- **Types** (`src/lib/types.ts`): Shared TypeScript types
- **Supabase** (`src/lib/supabase/`): Client, server, and proxy utilities

## Forms & Loading States

- All forms must show `<LoadingOverlay message="...">` during submission
- Use shared `LoadingOverlay` component from `src/components/loading-overlay.tsx`
- Wrap form fields in `<fieldset disabled={loading}>` to prevent interaction during submit
- Server actions that redirect must be called with try/catch; clearing loading state belongs in the catch, not after
- Forms using `useActionState` already keep loading visible during redirect — no extra handling needed

## Database & Authentication

- Use `createClient()` from `src/lib/supabase/server.ts` in server actions
- Use `createClient()` from `src/lib/supabase/client.ts` in client components
- Always check auth via `supabase.auth.getUser()` in server actions
- Redirect unauthorized users to `/login`; use `requireProfile()` for servant-only routes

## Styling

- Use Tailwind CSS; no external CSS files
- Button styles: `px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50`
- Form inputs: `w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`
- Error messages: `text-sm text-red-600 bg-red-50 p-2 rounded`

## Error Handling

- Server actions return `{ error: string }` on failure; return `void` on success with redirect
- Show errors in forms with error state, not toast notifications
- Validation errors (validation of form data) should happen in the server action, not the client
<!-- END:nextjs-agent-rules -->
