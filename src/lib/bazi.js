// ──────────────────────────────────────────────────────────────────────────
// 八字（四柱）排盘 · 基于 lunar-javascript
// 输入：公历年月日时分 + 性别 + 出生地经度（用于真太阳时校正）
// 输出：四柱 / 十神 / 五行能量场 / 大运 / 格局判定
// ──────────────────────────────────────────────────────────────────────────
import { Solar } from 'lunar-javascript';

// 五行属性映射
const GAN_WUXING = {
  '甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水'
};
const ZHI_WUXING = {
  '子':'水','丑':'土','寅':'木','卯':'木','辰':'土','巳':'火','午':'火','未':'土','申':'金','酉':'金','戌':'土','亥':'水'
};
// 地支藏干（本气、中气、余气）
const ZHI_CANG_GAN = {
  '子': ['癸'],
  '丑': ['己','癸','辛'],
  '寅': ['甲','丙','戊'],
  '卯': ['乙'],
  '辰': ['戊','乙','癸'],
  '巳': ['丙','戊','庚'],
  '午': ['丁','己'],
  '未': ['己','丁','乙'],
  '申': ['庚','壬','戊'],
  '酉': ['辛'],
  '戌': ['戊','辛','丁'],
  '亥': ['壬','甲'],
};
// 地支藏干权重（本气1.0 / 中气0.5 / 余气0.3）
const CANG_WEIGHT = [1.0, 0.5, 0.3];

// 真太阳时校正（北京时间→当地真太阳时）
// 中国标准时间基于东八区 120°E
export function correctTrueSolarTime(year, month, day, hour, minute, longitude) {
  // 经度差校正：每偏离 120° 1 度，时间差 4 分钟
  const lonDiffMin = (longitude - 120) * 4;
  // 均时差（equation of time）简化估算（按月份近似，分钟）
  const eqTimeApprox = {
    1:-3, 2:-13, 3:-12, 4:-4, 5:3, 6:2, 7:-5, 8:-6, 9:0, 10:11, 11:16, 12:7
  };
  const eqMin = eqTimeApprox[month] || 0;
  const totalCorrection = lonDiffMin + eqMin; // 分钟
  // 应用校正
  const totalMinutes = hour * 60 + minute + totalCorrection;
  const corrected = new Date(year, month - 1, day, 0, 0, 0);
  corrected.setMinutes(corrected.getMinutes() + totalMinutes);
  return {
    year: corrected.getFullYear(),
    month: corrected.getMonth() + 1,
    day: corrected.getDate(),
    hour: corrected.getHours(),
    minute: corrected.getMinutes(),
    correctionMinutes: Math.round(totalCorrection),
  };
}

/**
 * 计算八字
 * @param {Object} input { year, month, day, hour, minute, gender (0女/1男), longitude }
 */
export function calculateBazi({ year, month, day, hour, minute = 0, gender = 1, longitude = 120 }) {
  // 真太阳时校正
  const tst = correctTrueSolarTime(year, month, day, hour, minute, longitude);

  // 用校正后的时间排盘
  const solar = Solar.fromYmdHms(tst.year, tst.month, tst.day, tst.hour, tst.minute, 0);
  const lunar = solar.getLunar();
  const bazi = lunar.getEightChar();

  const dayGan = bazi.getDayGan();
  const dayZhi = bazi.getDayZhi();
  const dayWuxing = GAN_WUXING[dayGan];

  // 四柱
  const pillars = {
    year:  { gan: bazi.getYearGan(),  zhi: bazi.getYearZhi(),
              ganShi: tryShi(bazi, 'getYearShiShenGan'),
              zhiShi: tryShi(bazi, 'getYearShiShenZhi'),
              cang: ZHI_CANG_GAN[bazi.getYearZhi()] },
    month: { gan: bazi.getMonthGan(), zhi: bazi.getMonthZhi(),
              ganShi: tryShi(bazi, 'getMonthShiShenGan'),
              zhiShi: tryShi(bazi, 'getMonthShiShenZhi'),
              cang: ZHI_CANG_GAN[bazi.getMonthZhi()] },
    day:   { gan: dayGan, zhi: dayZhi,
              ganShi: '日主',
              zhiShi: tryShi(bazi, 'getDayShiShenZhi'),
              cang: ZHI_CANG_GAN[dayZhi] },
    time:  { gan: bazi.getTimeGan(),  zhi: bazi.getTimeZhi(),
              ganShi: tryShi(bazi, 'getTimeShiShenGan'),
              zhiShi: tryShi(bazi, 'getTimeShiShenZhi'),
              cang: ZHI_CANG_GAN[bazi.getTimeZhi()] },
  };

  // 五行能量评分（透干1.0 + 地支本气1.0 + 中气0.5 + 余气0.3 + 月令×1.5）
  const wuxingScore = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  const monthZhi = bazi.getMonthZhi();
  ['year', 'month', 'day', 'time'].forEach((p) => {
    const pl = pillars[p];
    // 天干透干
    wuxingScore[GAN_WUXING[pl.gan]] += 1.0;
    // 地支本气（如果是月令权重×1.5）
    const isMonthLing = pl.zhi === monthZhi;
    pl.cang.forEach((g, i) => {
      const w = CANG_WEIGHT[i] * (isMonthLing && i === 0 ? 1.5 : 1);
      wuxingScore[GAN_WUXING[g]] += w;
    });
  });
  // 归一化（百分比）
  const totalScore = Object.values(wuxingScore).reduce((a, b) => a + b, 0);
  const wuxingPct = {};
  Object.keys(wuxingScore).forEach(k => {
    wuxingPct[k] = totalScore > 0 ? (wuxingScore[k] / totalScore) * 100 : 0;
  });

  // 日主强弱判定（粗略）：得令 + 得地 + 得势
  const sameWuxing = dayWuxing;
  const generators = generatorOf(dayWuxing); // 印
  const strongScore = wuxingScore[sameWuxing] + wuxingScore[generators];
  const weakScore = totalScore - strongScore;
  let dayStrength;
  if (strongScore > weakScore * 1.3) dayStrength = '身旺';
  else if (strongScore > weakScore * 1.0) dayStrength = '身偏旺';
  else if (strongScore < weakScore * 0.7) dayStrength = '身弱';
  else dayStrength = '身偏弱';

  // 喜用神判定（极简）
  let xiYong;
  if (dayStrength.includes('旺')) {
    // 身旺需克泄耗
    xiYong = {
      good: [restrainerOf(dayWuxing), childOf(dayWuxing), wealthOf(dayWuxing)],
      bad: [generators, sameWuxing],
    };
  } else {
    // 身弱需生扶
    xiYong = {
      good: [generators, sameWuxing],
      bad: [restrainerOf(dayWuxing), wealthOf(dayWuxing)],
    };
  }

  // 大运
  let daYun = [];
  try {
    const yun = bazi.getYun(gender);
    const startYear = yun.getStartYear(); // 起运虚岁
    const startSolar = yun.getStartSolar(); // 起运公历
    const yuns = yun.getDaYun();
    daYun = yuns.slice(0, 9).map(d => ({
      startAge: d.getStartAge(),
      endAge: d.getEndAge(),
      startYear: d.getStartYear(),
      endYear: d.getEndYear(),
      ganZhi: d.getGanZhi(),
      gan: d.getGanZhi()[0],
      zhi: d.getGanZhi()[1],
    }));
  } catch (e) {
    console.warn('大运计算异常:', e);
  }

  // 格局简判（看月令本气透干）
  const monthBenQi = ZHI_CANG_GAN[bazi.getMonthZhi()][0];
  let geJu = '';
  if ([bazi.getYearGan(), bazi.getMonthGan(), bazi.getTimeGan()].includes(monthBenQi)) {
    const shenInfo = relationOf(dayWuxing, GAN_WUXING[monthBenQi]);
    geJu = `${shenInfo}格`;
  } else {
    geJu = '杂气格';
  }

  return {
    pillars,
    dayMaster: { gan: dayGan, wuxing: dayWuxing, descr: dayMasterDescr(dayGan) },
    wuxingScore,
    wuxingPct,
    dayStrength,
    xiYong,
    geJu,
    daYun,
    timing: {
      birthInput: { year, month, day, hour, minute },
      trueSolarTime: tst,
      lunar: {
        year: lunar.getYearInChinese(),
        month: lunar.getMonthInChinese(),
        day: lunar.getDayInChinese(),
      },
    },
  };
}

// ── 辅助：五行生克关系 ──────────────────────────────────────────────────────
function generatorOf(wx) {
  const map = { 木:'水', 火:'木', 土:'火', 金:'土', 水:'金' };
  return map[wx];
}
function childOf(wx) {
  const map = { 木:'火', 火:'土', 土:'金', 金:'水', 水:'木' };
  return map[wx];
}
function restrainerOf(wx) {
  const map = { 木:'金', 火:'水', 土:'木', 金:'火', 水:'土' };
  return map[wx];
}
function wealthOf(wx) {
  // 我克者为财
  const map = { 木:'土', 火:'金', 土:'水', 金:'木', 水:'火' };
  return map[wx];
}

// 十神关系
function relationOf(dayWx, otherWx) {
  if (dayWx === otherWx) return '比劫';
  if (generatorOf(dayWx) === otherWx) return '印';
  if (childOf(dayWx) === otherWx) return '食伤';
  if (wealthOf(dayWx) === otherWx) return '财';
  if (restrainerOf(dayWx) === otherWx) return '官杀';
  return '?';
}

function tryShi(bazi, method) {
  try { return bazi[method]?.() || ''; } catch { return ''; }
}

const DAY_MASTER_DESCR = {
  '甲': '参天大树 · 顶天立地的栋梁，刚直、有领袖气',
  '乙': '花草藤萝 · 柔韧蔓延，心思细腻、善于变通',
  '丙': '太阳烈火 · 光明炽烈，热情外向、有感染力',
  '丁': '灯烛之火 · 温润内敛，温柔细腻、有分寸',
  '戊': '城墙厚土 · 厚重稳固，沉稳可靠、有担当',
  '己': '田园之土 · 温润包容，平和内敛、善于滋养',
  '庚': '顽铁刀剑 · 锋锐果断，刚毅坚定、有侠气',
  '辛': '珠玉珍金 · 温润精致，敏感秀气、有审美',
  '壬': '江河大海 · 浩瀚奔涌，聪慧善变、有格局',
  '癸': '雨露涓流 · 渗透滋养，深沉细腻、有静气',
};
function dayMasterDescr(gan) { return DAY_MASTER_DESCR[gan] || ''; }
