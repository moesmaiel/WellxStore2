import { hashPassword, verifyPassword, generatePassword } from "../src/lib/password";

let fails = 0;
const ok = (label: string, condition: boolean) => {
  if (!condition) {
    fails++;
    console.log(`FAIL ${label}`);
  } else {
    console.log(`ok   ${label}`);
  }
};

// --- hash/verify round trip -------------------------------------------------
{
  const hash = hashPassword("correct-horse-battery-staple");
  ok("hash is salt:hash shaped", /^[0-9a-f]+:[0-9a-f]+$/.test(hash));
  ok("correct password verifies", verifyPassword("correct-horse-battery-staple", hash));
  ok("wrong password fails", !verifyPassword("wrong-password", hash));
}

// --- same password hashes differently each time (random salt) --------------
{
  const a = hashPassword("same-password");
  const b = hashPassword("same-password");
  ok("same password produces different hashes (random salt)", a !== b);
  ok("both hashes still verify against the original password", verifyPassword("same-password", a) && verifyPassword("same-password", b));
}

// --- malformed stored hash never crashes, just fails -----------------------
{
  ok("empty stored hash fails safely", !verifyPassword("anything", ""));
  ok("garbage stored hash fails safely", !verifyPassword("anything", "not-a-real-hash"));
  ok("missing hash half fails safely", !verifyPassword("anything", "onlysalt:"));
}

// --- generatePassword --------------------------------------------------------
{
  const p1 = generatePassword();
  const p2 = generatePassword();
  ok("default generated password is 16 characters", p1.length === 16);
  ok("generated passwords differ across calls", p1 !== p2);
  ok("custom length is respected", generatePassword(24).length === 24);
  ok("generated password contains no ambiguous characters (0/O/1/l/I)", !/[0O1lI]/.test(p1));
  const hash = hashPassword(p1);
  ok("a generated password hashes and verifies correctly", verifyPassword(p1, hash));
}

console.log(fails ? `\n${fails} FAILURES` : "\nall password checks passed");
process.exit(fails ? 1 : 0);
