// Creates the first CMS administrator (or promotes an existing account) and
// sets its password. The password is typed at a hidden prompt and sent
// straight to Supabase; it is never printed or stored.
//   node --env-file=.env.local scripts/create-admin.mjs mikegauci@gmail.com admin
import { createClient } from "@supabase/supabase-js";

const [email, username] = process.argv.slice(2);
if (!email)
  throw Error(
    "Usage: node --env-file=.env.local scripts/create-admin.mjs <email> [username]",
  );
const { NEXT_PUBLIC_SUPABASE_URL: url, SUPABASE_SECRET_KEY: key } = process.env;
if (!url || !key)
  throw Error(
    "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY must be set in .env.local.",
  );

function hidden(question) {
  return new Promise((resolve, reject) => {
    const input = process.stdin;
    if (!input.isTTY)
      return reject(Error("Run this in an interactive terminal."));
    process.stdout.write(question);
    input.setRawMode(true);
    input.resume();
    input.setEncoding("utf8");
    let value = "";
    const onData = (char) => {
      if (char === "\u0003") {
        process.stdout.write("\n");
        process.exit(130);
      }
      if (char === "\r" || char === "\n") {
        input.setRawMode(false);
        input.pause();
        input.off("data", onData);
        process.stdout.write("\n");
        resolve(value);
      } else if (char === "\u007f" || char === "\b") value = value.slice(0, -1);
      else value += char;
    };
    input.on("data", onData);
  });
}

const password = await hidden("Password: ");
if (password.length < 8) throw Error("Use at least 8 characters.");
if (password !== (await hidden("Repeat password: ")))
  throw Error("The passwords do not match.");

const db = createClient(url, key, { auth: { persistSession: false } });
const { data: existing, error } = await db
  .from("profiles")
  .select("id")
  .eq("email", email.toLowerCase())
  .maybeSingle();
if (error) throw error;

let id = existing?.id;
if (id) {
  const result = await db.auth.admin.updateUserById(id, { password });
  if (result.error) throw result.error;
} else {
  const result = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: username ? { username } : {},
  });
  if (result.error) throw result.error;
  id = result.data.user.id;
}

const promoted = await db
  .from("profiles")
  .update({ role: "admin", admin_capabilities: null })
  .eq("id", id);
if (promoted.error) throw promoted.error;
console.log(`${email} is an administrator. Sign in at /my-account/.`);
