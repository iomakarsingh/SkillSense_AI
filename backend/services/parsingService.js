/**
 * parsingService.js
 * Deterministic skill normalization, gap analysis, and weighted match scoring.
 *
 * Improvements over v1:
 *  1. AI now returns proficiency levels → no more fragile index-based classification
 *  2. Fuzzy matching (Levenshtein) catches "Node" vs "Node.js", typos, etc.
 *  3. Skill taxonomy: knowing Docker gives partial Kubernetes credit, etc.
 *  4. Weighted match score considers proficiency levels, not just presence
 */

'use strict';

/* ─────────────────────────────────────────────────────────────────
   1. CANONICAL ALIAS MAP
   Maps common variants / abbreviations to a canonical name.
───────────────────────────────────────────────────────────────── */
const ALIAS_MAP = {
  // JavaScript
  'js':               'JavaScript',
  'es6':              'JavaScript',
  'es2015':           'JavaScript',
  'ecmascript':       'JavaScript',
  'vanilla js':       'JavaScript',

  // TypeScript
  'ts':               'TypeScript',

  // React
  'react.js':         'React',
  'reactjs':          'React',
  'react js':         'React',

  // Node
  'node':             'Node.js',
  'nodejs':           'Node.js',
  'node js':          'Node.js',

  // Next.js
  'next':             'Next.js',
  'nextjs':           'Next.js',

  // Vue
  'vue.js':           'Vue',
  'vuejs':            'Vue',

  // Angular
  'angular.js':       'Angular',
  'angularjs':        'Angular',

  // Python
  'py':               'Python',

  // Database
  'postgres':         'PostgreSQL',
  'psql':             'PostgreSQL',
  'mysql':            'SQL',
  'mssql':            'SQL',
  'sqlite':           'SQL',
  'mongo':            'MongoDB',
  'mongodb':          'MongoDB',

  // Cloud
  'amazon web services': 'AWS',
  'google cloud':     'GCP',
  'google cloud platform': 'GCP',
  'microsoft azure':  'Azure',

  // CI/CD
  'cicd':             'CI/CD',
  'ci cd':            'CI/CD',
  'continuous integration': 'CI/CD',
  'github actions':   'GitHub Actions',

  // Containers
  'k8s':              'Kubernetes',
  'kube':             'Kubernetes',
  'docker container': 'Docker',

  // GraphQL
  'gql':              'GraphQL',

  // REST
  'rest':             'REST API',
  'restful':          'REST API',
  'rest api':         'REST API',

  // Others
  'ml':               'Machine Learning',
  'dl':               'Deep Learning',
  'nlp':              'Natural Language Processing',
  'tf':               'TensorFlow',
  'scss':             'CSS',
  'sass':             'CSS',
  'less':             'CSS',
  'tailwind':         'Tailwind CSS',
  'tailwindcss':      'Tailwind CSS',
  'git hub':          'Git',
  'github':           'Git',
  'gitlab':           'Git',
};

/* ─────────────────────────────────────────────────────────────────
   2. SKILL TAXONOMY
   If a candidate has skill A, they get partial credit toward skill B.
   Value = fraction of credit granted (0–1).
   Directional: Docker → Kubernetes means Docker experience counts
   partially toward Kubernetes requirement.
───────────────────────────────────────────────────────────────── */
const TAXONOMY = {
  // Language relationships
  'TypeScript':    [{ skill: 'JavaScript', credit: 0.7 }],
  'JavaScript':    [{ skill: 'TypeScript', credit: 0.4 }],
  'Next.js':       [{ skill: 'React',      credit: 0.9 }, { skill: 'JavaScript', credit: 0.7 }],
  'React':         [{ skill: 'JavaScript', credit: 0.6 }],
  'React Native':  [{ skill: 'React',      credit: 0.8 }, { skill: 'JavaScript', credit: 0.5 }],
  'Angular':       [{ skill: 'TypeScript', credit: 0.5 }, { skill: 'JavaScript', credit: 0.5 }],
  'Vue':           [{ skill: 'JavaScript', credit: 0.5 }],
  'Node.js':       [{ skill: 'JavaScript', credit: 0.6 }],

  // Infrastructure
  'Kubernetes':    [{ skill: 'Docker',     credit: 0.6 }],
  'Docker':        [{ skill: 'Kubernetes', credit: 0.3 }],
  'AWS':           [{ skill: 'GCP',        credit: 0.3 }, { skill: 'Azure', credit: 0.3 }],
  'GCP':           [{ skill: 'AWS',        credit: 0.3 }],
  'Azure':         [{ skill: 'AWS',        credit: 0.3 }],

  // Databases
  'PostgreSQL':    [{ skill: 'SQL',        credit: 0.9 }],
  'MySQL':         [{ skill: 'SQL',        credit: 0.9 }],
  'SQL':           [{ skill: 'PostgreSQL', credit: 0.4 }, { skill: 'MySQL', credit: 0.4 }],
  'MongoDB':       [{ skill: 'Redis',      credit: 0.2 }],

  // Web frameworks
  'Spring Boot':   [{ skill: 'Java',       credit: 0.7 }],
  'Django':        [{ skill: 'Python',     credit: 0.7 }],
  'FastAPI':       [{ skill: 'Python',     credit: 0.7 }],
  'Flask':         [{ skill: 'Python',     credit: 0.6 }],
  'Express':       [{ skill: 'Node.js',    credit: 0.8 }],

  // APIs
  'GraphQL':       [{ skill: 'REST API',   credit: 0.3 }],
  'REST API':      [{ skill: 'GraphQL',    credit: 0.2 }],

  // CI/CD
  'GitHub Actions':[{ skill: 'CI/CD',     credit: 0.8 }],
  'Jenkins':       [{ skill: 'CI/CD',     credit: 0.8 }],
  'GitLab CI':     [{ skill: 'CI/CD',     credit: 0.8 }],
};

/* ─────────────────────────────────────────────────────────────────
   3. NORMALIZATION
───────────────────────────────────────────────────────────────── */

/** Normalize a raw skill string to its canonical form */
function normalize(raw) {
  const lower = raw.trim().toLowerCase();
  if (ALIAS_MAP[lower]) return ALIAS_MAP[lower];
  // Title-case the original if no alias found
  return raw.trim().replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ─────────────────────────────────────────────────────────────────
   4. FUZZY MATCHING (Levenshtein)
   Catches "Node" vs "Node.js", "Javascript" vs "JavaScript", typos.
───────────────────────────────────────────────────────────────── */

/** Compute Levenshtein distance between two strings (case-insensitive) */
function levenshtein(a, b) {
  const la = a.toLowerCase(), lb = b.toLowerCase();
  if (la === lb) return 0;
  const m = la.length, n = lb.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = la[i - 1] === lb[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/**
 * Find the best matching canonical name in a target set using fuzzy matching.
 * Returns null if no match is close enough.
 */
function fuzzyFind(query, targets, threshold = 2) {
  const q = query.toLowerCase();
  let bestScore = Infinity;
  let bestMatch = null;

  for (const target of targets) {
    const t = target.toLowerCase();
    // Exact match
    if (q === t) return target;
    // Substring match (e.g. "node" in "node.js")
    if (t.includes(q) || q.includes(t)) {
      const score = Math.abs(q.length - t.length);
      if (score < bestScore) { bestScore = score; bestMatch = target; }
      continue;
    }
    // Levenshtein
    const dist = levenshtein(q, t);
    if (dist <= threshold && dist < bestScore) {
      bestScore = dist;
      bestMatch = target;
    }
  }
  return bestMatch;
}

/* ─────────────────────────────────────────────────────────────────
   5. PROFICIENCY → STRENGTH MAPPING
───────────────────────────────────────────────────────────────── */

/** Map AI-reported proficiency to internal strength label */
function proficiencyToStrength(proficiency) {
  const p = (proficiency || '').toLowerCase();
  if (['expert', 'advanced', 'strong', 'proficient'].some((k) => p.includes(k)))
    return 'Strong';
  if (['intermediate', 'moderate', 'familiar', 'good'].some((k) => p.includes(k)))
    return 'Medium';
  return 'Weak'; // beginner, basic, limited, or unknown
}

/* ─────────────────────────────────────────────────────────────────
   6. CORE GAP ANALYSIS
───────────────────────────────────────────────────────────────── */

/**
 * Build the full skill gap report from AI extraction output.
 *
 * @param {Array<{name: string, proficiency: string}>} rawResumeSkills
 * @param {string[]} rawJDSkills
 * @returns {Object} gap analysis result
 */
function analyzeGap(rawResumeSkills, rawJDSkills) {
  // --- Normalize resume skills ---
  const resumeMap = new Map(); // canonical name → {strength, proficiency}
  for (const item of rawResumeSkills) {
    const canonical = normalize(item.name || item);
    const proficiency = item.proficiency || 'intermediate';
    const strength = item.strength
      ? item.strength                          // if AI already classified
      : proficiencyToStrength(proficiency);
    resumeMap.set(canonical.toLowerCase(), { canonical, strength, proficiency });
  }

  // --- Normalize JD skills ---
  const jdSkills = rawJDSkills.map(normalize);
  const resumeNames = [...resumeMap.keys()]; // lowercase canonical names

  // --- Build skill matrix ---
  const strongSkills  = [];
  const mediumSkills  = [];
  const weakSkills    = [];
  const missingSkills = [];
  const skillMatrix   = [];

  // Weight of each proficiency level for match scoring
  const STRENGTH_WEIGHT = { Strong: 1.0, Medium: 0.65, Weak: 0.35 };

  let weightedScore = 0;
  const maxScore = jdSkills.length; // full weight if all present at Strong

  for (const jdSkill of jdSkills) {
    const jdLower = jdSkill.toLowerCase();

    // 1. Exact match
    let matched = resumeMap.get(jdLower);
    let matchType = 'exact';

    // 2. Fuzzy match if no exact
    if (!matched) {
      const fuzzy = fuzzyFind(jdSkill, [...resumeMap.values()].map((v) => v.canonical));
      if (fuzzy) {
        matched = resumeMap.get(fuzzy.toLowerCase());
        matchType = 'fuzzy';
      }
    }

    // 3. Taxonomy credit (partial match)
    let taxonomyCredit = 0;
    if (!matched) {
      // Check if any resume skill grants partial credit toward this JD skill
      for (const [rLower, rData] of resumeMap) {
        const relations = TAXONOMY[rData.canonical] || [];
        for (const rel of relations) {
          if (rel.skill.toLowerCase() === jdLower) {
            // Credit = relation credit × strength weight
            const partial = rel.credit * (STRENGTH_WEIGHT[rData.strength] || 0.5);
            if (partial > taxonomyCredit) taxonomyCredit = partial;
          }
        }
      }
    }

    if (matched) {
      const { canonical, strength } = matched;
      weightedScore += STRENGTH_WEIGHT[strength] || 0.35;

      skillMatrix.push({ skill: jdSkill, status: 'present', strength, matchType });

      if (strength === 'Strong') strongSkills.push(jdSkill);
      else if (strength === 'Medium') mediumSkills.push(jdSkill);
      else weakSkills.push(jdSkill);

    } else if (taxonomyCredit > 0) {
      // Partial credit from related skill
      weightedScore += taxonomyCredit;
      skillMatrix.push({ skill: jdSkill, status: 'partial', strength: 'Weak',
        taxCredit: Math.round(taxonomyCredit * 100), matchType: 'taxonomy' });
      weakSkills.push(jdSkill); // counts as weak, not missing

    } else {
      skillMatrix.push({ skill: jdSkill, status: 'missing', strength: 'Missing', matchType: 'none' });
      missingSkills.push(jdSkill);
    }
  }

  // --- Match percentage (weighted) ---
  const matchPercentage = maxScore > 0
    ? Math.round((weightedScore / maxScore) * 100)
    : 0;

  // --- Strong skills from resume (not necessarily in JD) ---
  const allStrongFromResume = [...resumeMap.values()]
    .filter((v) => v.strength === 'Strong')
    .map((v) => v.canonical);

  return {
    matchPercentage,
    strongSkills,
    mediumSkills,
    weakSkills,
    missingSkills,
    skillMatrix,
    resumeSkillCount: resumeMap.size,
    jdSkillCount: jdSkills.length,
    allStrongFromResume,
  };
}

module.exports = { analyzeGap, normalize, fuzzyFind };
