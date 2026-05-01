// ──────────────────────────────────────────────────────────────────────────
// 西方占星本命盘 · 基于 astronomy-engine
// 输入：UTC 出生时间 + 出生地经纬度
// 输出：太阳/月亮/上升/MC + 10 颗行星黄道经度 + 12 宫位
// ──────────────────────────────────────────────────────────────────────────
import * as A from 'astronomy-engine';

// 12 星座（黄道每 30°）
export const SIGNS = ['白羊','金牛','双子','巨蟹','狮子','处女','天秤','天蝎','射手','摩羯','水瓶','双鱼'];
export const SIGNS_EN = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
export const SIGN_ELEMENT = ['火','土','风','水','火','土','风','水','火','土','风','水'];
export const SIGN_QUALITY = ['本位','固定','变动','本位','固定','变动','本位','固定','变动','本位','固定','变动'];
export const SIGN_RULER = ['火星','金星','水星','月亮','太阳','水星','金星','冥王星','木星','土星','天王星','海王星'];

// 行星
export const PLANETS = [
  { id: 'Sun',     name: '太阳', symbol: '☉' },
  { id: 'Moon',    name: '月亮', symbol: '☽' },
  { id: 'Mercury', name: '水星', symbol: '☿' },
  { id: 'Venus',   name: '金星', symbol: '♀' },
  { id: 'Mars',    name: '火星', symbol: '♂' },
  { id: 'Jupiter', name: '木星', symbol: '♃' },
  { id: 'Saturn',  name: '土星', symbol: '♄' },
  { id: 'Uranus',  name: '天王星', symbol: '♅' },
  { id: 'Neptune', name: '海王星', symbol: '♆' },
  { id: 'Pluto',   name: '冥王星', symbol: '♇' },
];

// 主要相位（容许度）
const ASPECTS = [
  { name: '合相',    angle: 0,   orb: 8, type: 'major' },
  { name: '六分相',  angle: 60,  orb: 4, type: 'minor' },
  { name: '四分相',  angle: 90,  orb: 6, type: 'major' },
  { name: '三分相',  angle: 120, orb: 6, type: 'major' },
  { name: '对分相',  angle: 180, orb: 8, type: 'major' },
];

/**
 * 计算本命星盘
 * @param {Object} input { year, month, day, hour, minute, longitude, latitude, tzOffset(小时, 默认+8) }
 */
export function calculateAstrology({ year, month, day, hour, minute = 0, longitude, latitude, tzOffset = 8 }) {
  // 转 UTC
  const utcDate = new Date(Date.UTC(year, month - 1, day, hour - tzOffset, minute, 0));
  const time = A.MakeTime(utcDate);

  // 行星黄道经度
  const planets = PLANETS.map(p => {
    let eclipticLongitude;
    if (p.id === 'Sun') {
      // 太阳的"地心黄道"位置 = 太阳-地球向量在黄道坐标系
      const helVec = A.HelioVector(A.Body.Earth, time);
      // Earth 反方向 = Sun
      const sunGeo = { x: -helVec.x, y: -helVec.y, z: -helVec.z, t: time };
      const ecl = A.Ecliptic(sunGeo);
      eclipticLongitude = ecl.elon;
    } else if (p.id === 'Moon') {
      const moon = A.GeoMoon(time);
      const ecl = A.Ecliptic(moon);
      eclipticLongitude = ecl.elon;
    } else {
      const geo = A.GeoVector(A.Body[p.id], time, true);
      const ecl = A.Ecliptic(geo);
      eclipticLongitude = ecl.elon;
    }
    eclipticLongitude = ((eclipticLongitude % 360) + 360) % 360;
    return {
      ...p,
      longitude: eclipticLongitude,
      sign: signFromLongitude(eclipticLongitude),
      degree: eclipticLongitude % 30,
    };
  });

  // 上升点 (Ascendant) 和 MC 计算
  const observer = new A.Observer(latitude, longitude, 0);
  const ascMc = calculateAscMc(time, latitude, longitude);

  // 12 宫位（用等宫制：从上升点开始每 30°）
  const houses = [];
  for (let i = 0; i < 12; i++) {
    const cusp = (ascMc.ascendant + 30 * i) % 360;
    houses.push({
      num: i + 1,
      cuspLongitude: cusp,
      sign: signFromLongitude(cusp),
    });
  }

  // 行星归宫
  planets.forEach(p => {
    const house = ((Math.floor((p.longitude - ascMc.ascendant + 360) % 360 / 30)) % 12) + 1;
    p.house = house;
  });

  // 主要相位
  const aspects = [];
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const a = planets[i], b = planets[j];
      let diff = Math.abs(a.longitude - b.longitude);
      if (diff > 180) diff = 360 - diff;
      for (const asp of ASPECTS) {
        if (Math.abs(diff - asp.angle) <= asp.orb) {
          aspects.push({
            from: a.id, to: b.id,
            fromName: a.name, toName: b.name,
            type: asp.name, angle: asp.angle,
            orb: Math.abs(diff - asp.angle),
            major: asp.type === 'major',
          });
          break;
        }
      }
    }
  }

  // 元素分布统计
  const elementCount = { 火: 0, 土: 0, 风: 0, 水: 0 };
  const qualityCount = { 本位: 0, 固定: 0, 变动: 0 };
  planets.forEach(p => {
    const idx = Math.floor(p.longitude / 30);
    elementCount[SIGN_ELEMENT[idx]]++;
    qualityCount[SIGN_QUALITY[idx]]++;
  });

  // 三大核心
  const core = {
    sun:  planets.find(p => p.id === 'Sun'),
    moon: planets.find(p => p.id === 'Moon'),
    asc:  { longitude: ascMc.ascendant, sign: signFromLongitude(ascMc.ascendant), degree: ascMc.ascendant % 30 },
    mc:   { longitude: ascMc.mc, sign: signFromLongitude(ascMc.mc), degree: ascMc.mc % 30 },
  };

  return { core, planets, houses, aspects, elementCount, qualityCount };
}

// 黄道经度 → 星座 index
export function signFromLongitude(lon) {
  const idx = Math.floor((((lon % 360) + 360) % 360) / 30);
  return { index: idx, name: SIGNS[idx], en: SIGNS_EN[idx],
            element: SIGN_ELEMENT[idx], quality: SIGN_QUALITY[idx], ruler: SIGN_RULER[idx] };
}

// 计算上升点和 MC
// 用 Local Sidereal Time + 球面三角公式
function calculateAscMc(time, latitude, longitude) {
  // GMST (格林尼治平恒星时)
  const gmst = A.SiderealTime(time);
  // LST (本地恒星时, 小时)
  const lst = (gmst + longitude / 15) % 24;
  const lstDeg = lst * 15;

  // 黄赤交角
  const obliquity = 23.4393;
  const epsRad = obliquity * Math.PI / 180;
  const latRad = latitude * Math.PI / 180;
  const lstRad = lstDeg * Math.PI / 180;

  // MC：天顶子午圈与黄道的交点
  const mcRad = Math.atan2(Math.sin(lstRad), Math.cos(lstRad) * Math.cos(epsRad));
  let mc = mcRad * 180 / Math.PI;
  if (mc < 0) mc += 360;

  // ASC：东方地平线与黄道的交点
  const ascRad = Math.atan2(
    Math.cos(lstRad),
    -Math.sin(lstRad) * Math.cos(epsRad) - Math.tan(latRad) * Math.sin(epsRad)
  );
  let asc = ascRad * 180 / Math.PI;
  // ASC 应在 MC + 90° 附近
  if (asc < 0) asc += 360;
  // 确保 asc 在东半球（大致 MC + 60° ~ 120°）
  while (asc < mc) asc += 360;
  while (asc - mc > 360) asc -= 360;
  if (asc - mc < 60 || asc - mc > 300) asc = (asc + 180) % 360;
  asc = asc % 360;

  return { ascendant: asc, mc };
}
