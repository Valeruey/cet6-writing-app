import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

const a = await sql.query("SELECT count(*) as c FROM articles");
const e = await sql.query("SELECT count(*) as c FROM expressions");
const x = await sql.query("SELECT count(*) as c FROM exam_topics");
console.log("articles:", a[0].c, "expressions:", e[0].c, "exams:", x[0].c);
