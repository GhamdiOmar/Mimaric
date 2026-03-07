/**
 * NIST SP 800-63B Compliant Password Policy
 *
 * Rules:
 * - Minimum 15 characters (NIST best practice)
 * - Maximum 64 characters
 * - No complexity requirements (per NIST guidance)
 * - All Unicode characters allowed (including Arabic, spaces)
 * - Blocklist check against common/compromised passwords
 * - Contextual check (rejects passwords containing user's name/email)
 * - Paste always allowed (enables password managers)
 */

// Top common passwords — loaded lazily
let commonPasswordsSet: Set<string> | null = null;

function getCommonPasswords(): Set<string> {
  if (!commonPasswordsSet) {
    // Inline the most critical passwords to avoid file I/O issues
    // This covers the top most-used passwords globally
    const passwords = [
      "password", "123456", "12345678", "1234", "qwerty", "12345", "dragon",
      "pussy", "baseball", "football", "letmein", "monkey", "696969", "abc123",
      "mustang", "michael", "shadow", "master", "jennifer", "111111", "2000",
      "jordan", "superman", "harley", "1234567", "fuckme", "hunter", "fuckyou",
      "trustno1", "ranger", "buster", "thomas", "tigger", "robert", "soccer",
      "fuck", "batman", "test", "pass", "killer", "hockey", "george", "charlie",
      "andrew", "michelle", "love", "sunshine", "jessica", "asshole", "6969",
      "pepper", "daniel", "access", "123456789", "654321", "joshua", "maggie",
      "starwars", "silver", "william", "dallas", "yankees", "123123", "ashley",
      "666666", "hello", "amanda", "orange", "biteme", "freedom", "computer",
      "sexy", "thunder", "nicole", "ginger", "heather", "hammer", "summer",
      "corvette", "taylor", "fucker", "austin", "1111", "merlin", "matthew",
      "121212", "golfer", "cheese", "princess", "martin", "chelsea", "patrick",
      "richard", "diamond", "yellow", "bigdog", "secret", "asdfgh", "sparky",
      "cowboy", "camaro", "matrix", "falcon", "iloveyou", "guitar",
      "purple", "scooter", "phoenix", "aaaaaa", "tigers", "porsche", "mickey",
      "maverick", "cookie", "nascar", "peanut", "131313", "money", "hornet",
      "samantha", "panties", "steelers", "joseph", "snoopy", "boomer",
      "whatever", "iceman", "smokey", "gateway", "dakota", "cowboys", "eagles",
      "chicken", "dick", "black", "zxcvbn", "please", "andrea", "ferrari",
      "knight", "hardcore", "melissa", "compaq", "coffee", "booboo", "bitch",
      "johnny", "bulldog", "xxxxxx", "welcome", "james", "player", "ncc1701",
      "wizard", "scooby", "charles", "junior", "internet", "mike", "brandy",
      "tennis", "banana", "monster", "spider", "lakers", "miller", "rabbit",
      "enter", "mercedes", "brandon", "steven", "fender", "john", "yamaha",
      "diablo", "chris", "boston", "tiger", "marine", "chicago", "rangers",
      "gandalf", "winter", "bigtits", "barney", "edward", "raiders", "badboy",
      "pakistan", "admin", "administrator", "passw0rd", "password1",
      "password123", "changeme", "welcome1", "qwerty123", "letmein1",
      "abcdef", "abcdefg", "1q2w3e4r", "q1w2e3r4", "qazwsx",
      "zaq1zaq1", "1qaz2wsx", "qwer1234", "asdf1234", "1234qwer",
      "password12345", "correct horse battery staple",
    ];
    commonPasswordsSet = new Set(passwords.map((p) => p.toLowerCase()));
  }
  return commonPasswordsSet;
}

export type PasswordValidationResult = {
  valid: boolean;
  errors: { en: string; ar: string }[];
};

export function validatePassword(
  password: string,
  context?: { name?: string; email?: string }
): PasswordValidationResult {
  const errors: { en: string; ar: string }[] = [];

  // Length checks
  if (password.length < 15) {
    errors.push({
      en: `Password must be at least 15 characters (currently ${password.length}).`,
      ar: `كلمة المرور يجب أن تكون 15 حرفًا على الأقل (حاليًا ${password.length}).`,
    });
  }

  if (password.length > 64) {
    errors.push({
      en: "Password must be 64 characters or fewer.",
      ar: "كلمة المرور يجب أن تكون 64 حرفًا أو أقل.",
    });
  }

  // Blocklist check
  const lower = password.toLowerCase();
  const commonPasswords = getCommonPasswords();
  if (commonPasswords.has(lower)) {
    errors.push({
      en: "This password is too common and easily guessed.",
      ar: "كلمة المرور هذه شائعة جدًا ويسهل تخمينها.",
    });
  }

  // Contextual checks
  if (context?.name && context.name.length >= 3) {
    const nameLower = context.name.toLowerCase();
    if (lower.includes(nameLower)) {
      errors.push({
        en: "Password should not contain your name.",
        ar: "كلمة المرور يجب ألا تحتوي على اسمك.",
      });
    }
  }

  if (context?.email) {
    const emailLocal = context.email.split("@")[0]?.toLowerCase() ?? "";
    if (emailLocal.length >= 3 && lower.includes(emailLocal)) {
      errors.push({
        en: "Password should not contain your email address.",
        ar: "كلمة المرور يجب ألا تحتوي على بريدك الإلكتروني.",
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function getPasswordStrengthHint(password: string): { en: string; ar: string } {
  if (!password) {
    return {
      en: "Use a passphrase of 3+ random words (e.g., \"purple-mountain-sunset\")",
      ar: "استخدم عبارة من 3 كلمات عشوائية أو أكثر (مثال: \"جبل-بنفسجي-غروب\")",
    };
  }
  if (password.length < 15) {
    return {
      en: `${15 - password.length} more characters needed. Try adding random words.`,
      ar: `تحتاج ${15 - password.length} حرفًا إضافيًا. جرّب إضافة كلمات عشوائية.`,
    };
  }
  return {
    en: "Password meets requirements.",
    ar: "كلمة المرور تستوفي المتطلبات.",
  };
}
