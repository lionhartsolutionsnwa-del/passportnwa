import { promises as fs } from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), ".data");

export type SignupKind = "diner" | "restaurant";

export type Signup = {
  kind: SignupKind;
  email: string;
  restaurantName?: string;
  city?: string;
  createdAt: string;
};

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

function fileFor(kind: SignupKind) {
  return path.join(DATA_DIR, `${kind}-signups.jsonl`);
}

export async function appendSignup(signup: Signup) {
  await ensureDir();
  await fs.appendFile(fileFor(signup.kind), JSON.stringify(signup) + "\n", "utf8");
}

export async function readSignups(kind: SignupKind): Promise<Signup[]> {
  await ensureDir();
  try {
    const raw = await fs.readFile(fileFor(kind), "utf8");
    return raw
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as Signup);
  } catch {
    return [];
  }
}
