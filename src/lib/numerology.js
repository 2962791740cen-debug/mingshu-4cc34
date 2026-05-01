// ──────────────────────────────────────────────────────────────────────────
// 数字命理 (Numerology) · 毕达哥拉斯系统
// 输入：公历生日 + 英文/拼音姓名
// 输出：生命路径数 / 命运数 / 灵魂数 / 外在数 / 生日数
// ──────────────────────────────────────────────────────────────────────────

// 字母 → 数字（毕达哥拉斯）
const LETTER_NUM = {
  a:1, j:1, s:1,
  b:2, k:2, t:2,
  c:3, l:3, u:3,
  d:4, m:4, v:4,
  e:5, n:5, w:5,
  f:6, o:6, x:6,
  g:7, p:7, y:7,
  h:8, q:8, z:8,
  i:9, r:9,
};
const VOWELS = new Set(['a','e','i','o','u']);

// 大师数（不化简）
const MASTER = new Set([11, 22, 33]);

// 数字到 1-9 (保留大师数)
function reduceWithMaster(n) {
  while (n > 9 && !MASTER.has(n)) {
    n = String(n).split('').reduce((s, d) => s + Number(d), 0);
  }
  return n;
}

// 数字到 1-9 (强制)
function reduceFinal(n) {
  while (n > 9) {
    n = String(n).split('').reduce((s, d) => s + Number(d), 0);
  }
  return n;
}

/**
 * 完整计算
 * @param {Object} input { year, month, day, name (英文/拼音) }
 */
export function calculateNumerology({ year, month, day, name = '' }) {
  // 生命路径数：年+月+日各自化简后再加，保留大师数
  const yearReduced = reduceWithMaster(reduceFinal(year));
  const monthReduced = reduceWithMaster(reduceFinal(month));
  const dayReduced = reduceWithMaster(reduceFinal(day));
  const lifePathRaw = yearReduced + monthReduced + dayReduced;
  const lifePath = reduceWithMaster(lifePathRaw);

  // 生日数（出生日）
  const birthDay = reduceWithMaster(reduceFinal(day));

  // 姓名相关
  const cleanName = name.toLowerCase().replace(/[^a-z]/g, '');
  const letters = cleanName.split('');

  // 命运数（全名所有字母）
  const allSum = letters.reduce((s, c) => s + (LETTER_NUM[c] || 0), 0);
  const destiny = letters.length > 0 ? reduceWithMaster(allSum) : null;

  // 灵魂数（仅元音）
  const vowelSum = letters.filter(c => VOWELS.has(c)).reduce((s, c) => s + (LETTER_NUM[c] || 0), 0);
  const soul = letters.length > 0 ? reduceWithMaster(vowelSum) : null;

  // 外在数（仅辅音）
  const consonantSum = letters.filter(c => !VOWELS.has(c)).reduce((s, c) => s + (LETTER_NUM[c] || 0), 0);
  const personality = letters.length > 0 ? reduceWithMaster(consonantSum) : null;

  return {
    lifePath: { value: lifePath, isMaster: MASTER.has(lifePath), descr: NUMBER_MEANING[lifePath] },
    birthDay: { value: birthDay, isMaster: MASTER.has(birthDay), descr: NUMBER_MEANING[birthDay] },
    destiny: destiny ? { value: destiny, isMaster: MASTER.has(destiny), descr: NUMBER_MEANING[destiny] } : null,
    soul: soul ? { value: soul, isMaster: MASTER.has(soul), descr: NUMBER_MEANING[soul] } : null,
    personality: personality ? { value: personality, isMaster: MASTER.has(personality), descr: NUMBER_MEANING[personality] } : null,
    name: cleanName,
  };
}

const NUMBER_MEANING = {
  1: { keyword: '开创者',  text: '独立、领导、原创、不肯走别人走过的路' },
  2: { keyword: '协作者',  text: '敏感、合作、外交，能感知人心微妙' },
  3: { keyword: '表达者',  text: '创造、表达、艺术、需要被看见' },
  4: { keyword: '建造者',  text: '务实、秩序、勤奋、把愿景落地的耐心' },
  5: { keyword: '探索者',  text: '自由、变化、好奇、不能被框住' },
  6: { keyword: '照护者',  text: '责任、爱、家庭、疗愈他人的本能' },
  7: { keyword: '研究者',  text: '内省、神秘、智慧、看穿表象的眼' },
  8: { keyword: '权力者',  text: '雄心、商业、组织、把事做大的能力' },
  9: { keyword: '理想者',  text: '慈悲、完成、利他、看见整体的格局' },
  11:{ keyword: '灵性大师', text: '直觉、启示、灵感导体——大师数 · 比 2 高一阶的双倍敏感' },
  22:{ keyword: '建造大师', text: '把宏伟蓝图落地——大师数 · 4 的高阶版，背着比常人重的合同' },
  33:{ keyword: '大爱大师', text: '无条件之爱、教导、奉献——大师数 · 三大数中最高频' },
};

export const NUMEROLOGY_MEANINGS = NUMBER_MEANING;
