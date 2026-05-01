import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { calculateBazi } from './lib/bazi';
import { calculateAstrology, SIGNS, SIGN_ELEMENT } from './lib/astrology';
import { calculateNumerology } from './lib/numerology';
import { CITIES, searchCity, PROVINCES_DATA, PROVINCE_ORDER, getCitiesByProvince } from './lib/cities';

// ═══════════════════════════════════════════════════════════════════════════
// 命书 · MINGSHU · 一卷为你而写的书
// ═══════════════════════════════════════════════════════════════════════════

const STORAGE_KEY = 'mingshu-profile';

// ── Global Styles ──────────────────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body, #root { height: 100%; overflow: hidden; }
    body {
      font-family: 'Noto Serif SC', 'ZCOOL XiaoWei', serif;
      background: #0a0608; color: #e8d9b0;
    }

    /* APP SHELL — ink black with subtle gold/indigo glow */
    .ms-app {
      height: 100vh; overflow-y: auto; overflow-x: hidden;
      background:
        radial-gradient(ellipse at 20% 10%, rgba(212,168,90,0.08) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 90%, rgba(30,37,71,0.4) 0%, transparent 60%),
        radial-gradient(ellipse at center, #14101a 0%, #0a0608 80%);
      position: relative;
    }
    .ms-app::before {
      content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 1;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E");
      opacity: 0.06; mix-blend-mode: screen;
    }

    /* Star dust particles */
    .ms-star {
      position: fixed; pointer-events: none;
      width: 1.5px; height: 1.5px; border-radius: 50%; background: #d4a85a;
      box-shadow: 0 0 4px #d4a85a; z-index: 2;
      animation: ms-star-twinkle 4s ease-in-out infinite;
    }
    @keyframes ms-star-twinkle {
      0%, 100% { opacity: 0.2; transform: scale(0.8); }
      50%      { opacity: 1; transform: scale(1.3); }
    }

    /* Typography */
    .ms-eyebrow {
      font-family: 'Cinzel', serif; font-size: 0.7rem;
      letter-spacing: 0.5em; color: #d4a85a; opacity: 0.7;
      text-transform: uppercase;
    }
    .ms-title-zh {
      font-family: 'ZCOOL XiaoWei', 'Noto Serif SC', serif;
      color: #e8d9b0; font-weight: 400;
    }
    .ms-juan-num {
      font-family: 'Cormorant Garamond', 'Noto Serif SC', serif;
      color: rgba(212,168,90,0.15); font-weight: 700; line-height: 1;
      letter-spacing: -0.05em;
    }

    /* Scroll-unfurl page transition (古卷展卷) */
    .ms-page {
      animation: ms-unfurl 1.2s cubic-bezier(0.25, 0.1, 0.25, 1) both;
    }
    @keyframes ms-unfurl {
      0%   { opacity: 0; clip-path: inset(45% 0 45% 0); filter: blur(4px); }
      60%  { opacity: 1; clip-path: inset(0 0 0 0); filter: blur(0); }
      100% { opacity: 1; clip-path: inset(0 0 0 0); }
    }

    /* Buttons */
    .ms-btn {
      background: transparent; border: 1px solid #d4a85a; color: #d4a85a;
      padding: 0.9rem 2.5rem; font-family: 'Noto Serif SC', serif;
      font-size: 0.9rem; letter-spacing: 0.3em; cursor: pointer;
      transition: all 0.4s ease; position: relative; overflow: hidden;
    }
    .ms-btn::before {
      content: ''; position: absolute; inset: 0;
      background: linear-gradient(135deg, #d4a85a, #b8943e);
      transform: translateX(-100%);
      transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1); z-index: -1;
    }
    .ms-btn:hover::before { transform: translateX(0); }
    .ms-btn:hover { color: #0a0608; }
    .ms-btn:disabled { opacity: 0.35; cursor: not-allowed; }
    .ms-btn:disabled:hover { color: #d4a85a; }
    .ms-btn:disabled:hover::before { transform: translateX(-100%); }
    .ms-btn-cinnabar { border-color: #c0392b; color: #c0392b; }
    .ms-btn-cinnabar::before { background: linear-gradient(135deg, #c0392b, #8b2820); }
    .ms-btn-cinnabar:hover { color: #e8d9b0; }

    /* Inputs */
    .ms-input {
      background: rgba(232,217,176,0.04);
      border: 1px solid rgba(212,168,90,0.3);
      color: #e8d9b0; padding: 0.8rem 1.1rem;
      font-family: inherit; font-size: 1rem; width: 100%;
      outline: none; transition: all 0.3s ease;
    }
    .ms-input:focus {
      border-color: #d4a85a; background: rgba(232,217,176,0.08);
      box-shadow: 0 0 0 3px rgba(212,168,90,0.1);
    }
    .ms-input::placeholder { color: rgba(232,217,176,0.3); }
    .ms-label {
      display: block; color: #d4a85a; font-size: 0.7rem;
      letter-spacing: 0.3em; margin-bottom: 0.6rem;
      font-family: 'Cinzel', serif;
    }

    /* Jade slip (玉简) for bazi pillars */
    .ms-jade-slip {
      background: linear-gradient(180deg, #1a1320 0%, #14101a 100%);
      border: 1px solid rgba(212,168,90,0.3);
      box-shadow:
        inset 0 0 30px rgba(0,0,0,0.6),
        0 4px 24px rgba(0,0,0,0.5),
        0 0 60px rgba(212,168,90,0.05);
      position: relative;
    }
    .ms-jade-slip::before, .ms-jade-slip::after {
      content: ''; position: absolute; left: 50%; transform: translateX(-50%);
      width: 60%; height: 1px; background: rgba(212,168,90,0.25);
    }
    .ms-jade-slip::before { top: 12px; }
    .ms-jade-slip::after  { bottom: 12px; }
    .ms-jade-char {
      font-family: 'Noto Serif SC', serif; font-weight: 900;
      color: #d4a85a; text-align: center; line-height: 1;
      text-shadow:
        0 0 20px rgba(212,168,90,0.4),
        0 0 40px rgba(212,168,90,0.2),
        0 1px 2px rgba(0,0,0,0.8);
    }
    .ms-jade-meta {
      color: rgba(232,217,176,0.5); font-size: 0.7rem;
      letter-spacing: 0.2em; text-align: center;
      font-family: 'Cinzel', serif;
    }

    /* Element orbs (五行能量球) */
    .ms-orb-wrap {
      display: grid; grid-template-columns: repeat(5, 1fr); gap: 1.5rem;
      max-width: 720px; margin: 0 auto;
    }
    .ms-orb {
      display: flex; flex-direction: column; align-items: center; gap: 1rem;
      position: relative;
    }
    .ms-orb-circle {
      position: relative; display: flex; align-items: center; justify-content: center;
    }
    .ms-orb-bg {
      position: absolute; inset: 0; border-radius: 50%;
      animation: ms-orb-breathe 3.5s ease-in-out infinite;
    }
    @keyframes ms-orb-breathe {
      0%, 100% { transform: scale(0.92); opacity: 0.6; }
      50%      { transform: scale(1.08); opacity: 1; }
    }
    .ms-orb-char {
      position: relative; z-index: 1; font-family: 'ZCOOL XiaoWei', serif;
      font-size: 2rem; color: #fff; font-weight: 400;
      text-shadow: 0 2px 6px rgba(0,0,0,0.6);
    }
    .ms-orb-pct {
      font-family: 'Cinzel', serif; font-size: 0.85rem;
      letter-spacing: 0.1em; color: #d4a85a;
    }

    /* Number glyphs */
    .ms-number-glyph {
      font-family: 'Cormorant Garamond', serif; font-weight: 700;
      color: #d4a85a; line-height: 1;
      text-shadow: 0 0 30px rgba(212,168,90,0.4);
    }
    .ms-master-glow {
      animation: ms-master-pulse 4s ease-in-out infinite;
    }
    @keyframes ms-master-pulse {
      0%, 100% { text-shadow: 0 0 30px rgba(212,168,90,0.4); }
      50%      { text-shadow: 0 0 50px rgba(212,168,90,0.8), 0 0 80px rgba(192,57,43,0.3); }
    }

    /* Seal (印鉴) */
    .ms-seal {
      width: 180px; height: 180px;
      background: radial-gradient(circle, #c0392b 0%, #8b2820 100%);
      display: flex; align-items: center; justify-content: center;
      box-shadow:
        0 0 40px rgba(192,57,43,0.4),
        inset 0 0 30px rgba(0,0,0,0.3);
      transform: rotate(-8deg);
      position: relative;
    }
    .ms-seal::before {
      content: ''; position: absolute; inset: 8px;
      border: 2px solid rgba(232,217,176,0.4);
    }
    .ms-seal-text {
      color: #e8d9b0; font-family: 'ZCOOL XiaoWei', 'Noto Serif SC', serif;
      font-size: 1.6rem; line-height: 1.3; text-align: center;
      writing-mode: vertical-rl; text-orientation: upright;
      letter-spacing: 0.2em; font-weight: 700;
      position: relative; z-index: 1;
    }

    /* Top nav */
    .ms-nav {
      position: fixed; top: 1.5rem; left: 50%;
      transform: translateX(-50%);
      display: flex; gap: 0.3rem; z-index: 100;
      padding: 0.4rem 0.5rem;
      background: rgba(20, 16, 26, 0.7);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(212,168,90,0.15);
    }
    .ms-nav-item {
      padding: 0.5rem 0.9rem; cursor: pointer;
      color: rgba(232,217,176,0.4); font-size: 0.75rem;
      letter-spacing: 0.15em; transition: all 0.3s ease;
      font-family: 'Cinzel', serif;
    }
    .ms-nav-item:hover { color: #e8d9b0; }
    .ms-nav-item.active {
      color: #d4a85a; background: rgba(212,168,90,0.1);
      border-bottom: 1px solid #d4a85a;
    }

    /* Card */
    .ms-card {
      background: rgba(20, 16, 26, 0.6);
      border: 1px solid rgba(212,168,90,0.15);
      padding: 1.8rem 2rem;
      backdrop-filter: blur(8px);
    }

    /* Tag */
    .ms-tag {
      display: inline-block; padding: 0.2rem 0.7rem;
      font-size: 0.7rem; letter-spacing: 0.15em;
      border: 1px solid rgba(212,168,90,0.3);
      color: #d4a85a; margin: 0.15rem;
    }
    .ms-tag-cinnabar {
      border-color: rgba(192,57,43,0.5); color: #c0392b;
    }

    @media (max-width: 768px) {
      .ms-nav { font-size: 0.6rem; gap: 0.1rem; flex-wrap: wrap; max-width: 95vw; }
      .ms-nav-item { padding: 0.4rem 0.5rem; font-size: 0.65rem; }
      .ms-orb-wrap { grid-template-columns: repeat(5, 1fr); gap: 0.5rem; }
      .ms-orb-char { font-size: 1.4rem; }
    }
  `}</style>
);

// ═══════════════════════════════════════════════════════════════════════════
// 1. 卷首 · 题写命书封面
// ═══════════════════════════════════════════════════════════════════════════
// ── Reusable Pickers ────────────────────────────────────────────────────────
// 中文数字 (用于显示传统月份/日期)
const CN_NUM = ['','一','二','三','四','五','六','七','八','九','十','十一','十二'];
// 传统时辰
const SHICHEN = [
  { name: '子', range: '23:00 - 01:00', start: 23, hour: 0,  desc: '夜半' },
  { name: '丑', range: '01:00 - 03:00', start: 1,  hour: 2,  desc: '鸡鸣' },
  { name: '寅', range: '03:00 - 05:00', start: 3,  hour: 4,  desc: '平旦' },
  { name: '卯', range: '05:00 - 07:00', start: 5,  hour: 6,  desc: '日出' },
  { name: '辰', range: '07:00 - 09:00', start: 7,  hour: 8,  desc: '食时' },
  { name: '巳', range: '09:00 - 11:00', start: 9,  hour: 10, desc: '隅中' },
  { name: '午', range: '11:00 - 13:00', start: 11, hour: 12, desc: '日中' },
  { name: '未', range: '13:00 - 15:00', start: 13, hour: 14, desc: '日昳' },
  { name: '申', range: '15:00 - 17:00', start: 15, hour: 16, desc: '哺时' },
  { name: '酉', range: '17:00 - 19:00', start: 17, hour: 18, desc: '日入' },
  { name: '戌', range: '19:00 - 21:00', start: 19, hour: 20, desc: '黄昏' },
  { name: '亥', range: '21:00 - 23:00', start: 21, hour: 22, desc: '人定' },
];

// 滚动列（提到外面避免重新挂载导致闪烁）
const ScrollCol = ({ items, value, onPick, render, suffix }) => {
  const ref = useRef(null);
  const scrolledRef = useRef(false);
  // 只在首次有 value 时滚动到选中位置；之后用户点击切换不再强制滚回去
  useEffect(() => {
    if (!ref.current || value == null || scrolledRef.current) return;
    const idx = items.indexOf(value);
    if (idx >= 0) {
      ref.current.scrollTop = idx * 36 - 80;
      scrolledRef.current = true;
    }
  }, [value, items]);
  return (
    <div ref={ref} style={{
      flex: 1, height: 200, overflowY: 'auto',
      border: '1px solid rgba(212,168,90,0.2)',
      background: 'rgba(20,16,26,0.4)',
      scrollbarWidth: 'thin', scrollbarColor: 'rgba(212,168,90,0.3) transparent',
    }}>
      {items.map(it => (
        <div key={it}
          onClick={() => onPick(it)}
          style={{
            padding: '0.5rem 0', textAlign: 'center', cursor: 'pointer',
            color: it === value ? '#d4a85a' : 'rgba(232,217,176,0.55)',
            background: it === value ? 'rgba(212,168,90,0.08)' : 'transparent',
            fontWeight: it === value ? 600 : 400,
            fontSize: it === value ? '1.1rem' : '0.95rem',
            transition: 'all 0.15s ease',
            fontFamily: 'inherit',
            height: 36, lineHeight: '26px',
          }}
          onMouseEnter={e => { if (it !== value) e.currentTarget.style.background = 'rgba(212,168,90,0.04)'; }}
          onMouseLeave={e => { if (it !== value) e.currentTarget.style.background = 'transparent'; }}>
          {render ? render(it) : it}{suffix || ''}
        </div>
      ))}
    </div>
  );
};

// 日期选择器：年月日三栏滚动
const DatePicker = ({ year, month, day, onChange }) => {
  const thisYear = new Date().getFullYear();
  const years = useMemo(() => {
    const arr = [];
    for (let y = thisYear; y >= 1920; y--) arr.push(y);
    return arr;
  }, [thisYear]);
  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
  const daysInMonth = (y, m) => new Date(y, m, 0).getDate();
  const days = useMemo(() => year && month
    ? Array.from({ length: daysInMonth(year, month) }, (_, i) => i + 1)
    : Array.from({ length: 31 }, (_, i) => i + 1), [year, month]);

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <div style={{ flex: 1 }}>
          <div className="ms-eyebrow" style={{ fontSize: '0.6rem', textAlign: 'center', marginBottom: '0.5rem' }}>年</div>
          <ScrollCol items={years} value={year} onPick={y => onChange({ year: y, month, day })} />
        </div>
        <div style={{ flex: 1 }}>
          <div className="ms-eyebrow" style={{ fontSize: '0.6rem', textAlign: 'center', marginBottom: '0.5rem' }}>月</div>
          <ScrollCol items={months} value={month}
               onPick={m => {
                 // adjust day if needed
                 const md = year ? daysInMonth(year, m) : 31;
                 onChange({ year, month: m, day: day && day > md ? md : day });
               }}
               render={m => CN_NUM[m] + '月'} />
        </div>
        <div style={{ flex: 1 }}>
          <div className="ms-eyebrow" style={{ fontSize: '0.6rem', textAlign: 'center', marginBottom: '0.5rem' }}>日</div>
          <ScrollCol items={days} value={day} onPick={d => onChange({ year, month, day: d })} suffix="" />
        </div>
      </div>
      <p style={{
        color: 'rgba(232,217,176,0.4)', fontSize: '0.75rem',
        textAlign: 'center', marginTop: '1rem', fontStyle: 'italic',
      }}>
        {year && month && day
          ? `公历 ${year} 年 ${CN_NUM[month]}月 ${day} 日`
          : '滚动选择 · 公历日期'}
      </p>
    </div>
  );
};

// 时辰选择器：三种模式（传统时辰 / 模糊时段 / 精确时间）
const TimePicker = ({ hour, minute, onChange }) => {
  const [mode, setMode] = useState(() => {
    if (hour != null && minute > 0) return 'precise';
    return 'shichen';
  });

  return (
    <div>
      {/* Mode tabs */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem' }}>
        {[
          { v: 'shichen', l: '十二时辰' },
          { v: 'rough',   l: '大概时段' },
          { v: 'precise', l: '精确时间' },
        ].map(t => (
          <button key={t.v}
            onClick={() => setMode(t.v)}
            style={{
              flex: 1, padding: '0.5rem', fontFamily: 'inherit',
              fontSize: '0.8rem', letterSpacing: '0.15em', cursor: 'pointer',
              background: mode === t.v ? 'rgba(212,168,90,0.15)' : 'transparent',
              border: `1px solid ${mode === t.v ? '#d4a85a' : 'rgba(212,168,90,0.2)'}`,
              color: mode === t.v ? '#d4a85a' : 'rgba(232,217,176,0.5)',
              transition: 'all 0.2s ease',
            }}>{t.l}</button>
        ))}
      </div>

      {/* 十二时辰 */}
      {mode === 'shichen' && (
        <div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem',
          }}>
            {SHICHEN.map(s => (
              <button key={s.name}
                onClick={() => onChange({ hour: s.hour, minute: 0 })}
                style={{
                  padding: '0.7rem 0.4rem', fontFamily: 'inherit',
                  background: hour === s.hour ? 'rgba(212,168,90,0.15)' : 'rgba(20,16,26,0.4)',
                  border: `1px solid ${hour === s.hour ? '#d4a85a' : 'rgba(212,168,90,0.2)'}`,
                  cursor: 'pointer', transition: 'all 0.2s ease',
                  textAlign: 'center',
                }}>
                <div style={{
                  color: hour === s.hour ? '#d4a85a' : '#e8d9b0',
                  fontFamily: 'ZCOOL XiaoWei, serif', fontSize: '1.5rem',
                  marginBottom: '0.1rem',
                }}>{s.name}</div>
                <div style={{
                  color: 'rgba(232,217,176,0.45)', fontSize: '0.65rem',
                  letterSpacing: '0.05em',
                }}>{s.range}</div>
                <div style={{
                  color: hour === s.hour ? '#d4a85a' : 'rgba(232,217,176,0.35)',
                  fontSize: '0.6rem', marginTop: '0.2rem', fontStyle: 'italic',
                }}>{s.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 大概时段 */}
      {mode === 'rough' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.6rem' }}>
          {[
            { label: '凌晨', sub: '00:00 - 06:00', hour: 3 },
            { label: '上午', sub: '06:00 - 12:00', hour: 9 },
            { label: '下午', sub: '12:00 - 18:00', hour: 15 },
            { label: '夜晚', sub: '18:00 - 24:00', hour: 21 },
          ].map(r => (
            <button key={r.hour}
              onClick={() => onChange({ hour: r.hour, minute: 0 })}
              style={{
                padding: '1.5rem', fontFamily: 'inherit',
                background: hour === r.hour ? 'rgba(212,168,90,0.15)' : 'rgba(20,16,26,0.4)',
                border: `1px solid ${hour === r.hour ? '#d4a85a' : 'rgba(212,168,90,0.2)'}`,
                cursor: 'pointer', transition: 'all 0.2s ease',
              }}>
              <div style={{
                color: hour === r.hour ? '#d4a85a' : '#e8d9b0',
                fontFamily: 'ZCOOL XiaoWei, serif', fontSize: '1.4rem',
                marginBottom: '0.4rem',
              }}>{r.label}</div>
              <div style={{ color: 'rgba(232,217,176,0.5)', fontSize: '0.75rem' }}>{r.sub}</div>
            </button>
          ))}
        </div>
      )}

      {/* 精确时间 */}
      {mode === 'precise' && (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center' }}>
          <select value={hour ?? ''}
                  onChange={e => onChange({ hour: parseInt(e.target.value), minute: minute || 0 })}
                  style={{
                    padding: '0.7rem 1rem', background: '#14101a',
                    border: '1px solid rgba(212,168,90,0.3)',
                    color: '#d4a85a', fontFamily: 'inherit', fontSize: '1.2rem',
                    cursor: 'pointer',
                  }}>
            <option value="">时</option>
            {Array.from({ length: 24 }, (_, i) => i).map(h => (
              <option key={h} value={h}>{String(h).padStart(2, '0')}</option>
            ))}
          </select>
          <span style={{ color: '#d4a85a', fontSize: '1.5rem' }}>:</span>
          <select value={minute ?? ''}
                  onChange={e => onChange({ hour: hour || 0, minute: parseInt(e.target.value) })}
                  style={{
                    padding: '0.7rem 1rem', background: '#14101a',
                    border: '1px solid rgba(212,168,90,0.3)',
                    color: '#d4a85a', fontFamily: 'inherit', fontSize: '1.2rem',
                    cursor: 'pointer',
                  }}>
            <option value="">分</option>
            {Array.from({ length: 60 }, (_, i) => i).map(m => (
              <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
            ))}
          </select>
        </div>
      )}

      {hour != null && (
        <p style={{
          textAlign: 'center', color: '#d4a85a', fontSize: '0.85rem',
          marginTop: '1rem', letterSpacing: '0.1em',
        }}>
          ✓ {String(hour).padStart(2, '0')}:{String(minute || 0).padStart(2, '0')}
          {(() => {
            const sc = SHICHEN.find(s => s.hour === hour);
            return sc ? ` · ${sc.name}时（${sc.desc}）` : '';
          })()}
        </p>
      )}
    </div>
  );
};

// 省→市选择器
const CityPicker = ({ city, onChange }) => {
  const [province, setProvince] = useState(city?.province || null);
  const cities = province ? getCitiesByProvince(province) : [];

  if (!province) {
    // Show province grid
    return (
      <div>
        <p style={{
          color: 'rgba(232,217,176,0.5)', fontSize: '0.85rem',
          textAlign: 'center', marginBottom: '1rem',
        }}>第一步 · 选省份</p>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))',
          gap: '0.4rem', maxHeight: 320, overflowY: 'auto', padding: '0.4rem',
        }}>
          {PROVINCE_ORDER.map(p => (
            <button key={p}
              onClick={() => setProvince(p)}
              style={{
                padding: '0.6rem 0.4rem', fontFamily: 'inherit',
                background: 'rgba(20,16,26,0.4)',
                border: '1px solid rgba(212,168,90,0.15)',
                color: '#e8d9b0', fontSize: '0.85rem',
                cursor: 'pointer', transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#d4a85a';
                e.currentTarget.style.color = '#d4a85a';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(212,168,90,0.15)';
                e.currentTarget.style.color = '#e8d9b0';
              }}>
              {p}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Show cities of selected province
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <button onClick={() => { setProvince(null); onChange(null); }}
                style={{
                  background: 'transparent', border: 'none', color: '#d4a85a',
                  cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'inherit',
                  letterSpacing: '0.15em',
                }}>
          ← 返回选省
        </button>
        <span style={{ color: '#e8d9b0', fontSize: '1rem', letterSpacing: '0.1em' }}>
          {province}
        </span>
      </div>
      <p style={{
        color: 'rgba(232,217,176,0.5)', fontSize: '0.85rem',
        textAlign: 'center', marginBottom: '1rem',
      }}>第二步 · 选城市</p>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))',
        gap: '0.5rem', maxHeight: 320, overflowY: 'auto', padding: '0.4rem',
      }}>
        {cities.map(c => {
          const fullCity = { ...c, province };
          const isSelected = city && city.name === c.name && city.province === province;
          return (
            <button key={c.name}
              onClick={() => onChange(fullCity)}
              style={{
                padding: '0.7rem 0.4rem', fontFamily: 'inherit',
                background: isSelected ? 'rgba(212,168,90,0.15)' : 'rgba(20,16,26,0.4)',
                border: `1px solid ${isSelected ? '#d4a85a' : 'rgba(212,168,90,0.2)'}`,
                color: isSelected ? '#d4a85a' : '#e8d9b0', fontSize: '0.95rem',
                cursor: 'pointer', transition: 'all 0.2s ease',
              }}>
              {c.name}
            </button>
          );
        })}
      </div>
      {city && city.province === province && (
        <p style={{
          textAlign: 'center', color: '#d4a85a', fontSize: '0.8rem',
          marginTop: '1rem', letterSpacing: '0.1em',
        }}>
          ✓ {city.province} · {city.name} · 经度 {city.lng.toFixed(2)}°E
        </p>
      )}
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────────────
// CoverWrapper · 提到 CoverPage 外部，避免每次 React render 重新挂载触发动画闪烁
// 使用 React.memo —— 只有 step / hideBg 真变化时才重渲染
// ──────────────────────────────────────────────────────────────────────────
const COVER_BG_GLYPHS = ['命','书','你','的','一','本','人','生','道'];
const CoverWrapper = React.memo(function CoverWrapper({ step, hideBg, children }) {
  return (
    <div className="ms-page" style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '4rem 2rem', position: 'relative', zIndex: 5,
    }}>
      {!hideBg && (
        <div style={{
          position: 'absolute',
          right: step % 2 === 0 ? '-2rem' : 'auto',
          left: step % 2 === 0 ? 'auto' : '-3rem',
          top: step % 2 === 0 ? '-2rem' : 'auto',
          bottom: step % 2 === 0 ? 'auto' : '-4rem',
          fontFamily: 'ZCOOL XiaoWei, serif',
          fontSize: 'clamp(20rem, 38vw, 38rem)',
          color: 'rgba(212,168,90,0.04)',
          lineHeight: 1, pointerEvents: 'none', userSelect: 'none',
        }}>{COVER_BG_GLYPHS[step] || '命'}</div>
      )}
      {children}
    </div>
  );
});

// ──────────────────────────────────────────────────────────────────────────
// CoverPage · 多屏开场 + 引导式问答
// ──────────────────────────────────────────────────────────────────────────
const CoverPage = ({ profile, setProfile, onBegin }) => {
  // step:
  //   0 = hook (钩子句)  1 = intro (这是什么)  2 = preview (里面有什么)
  //   3-8 = 引导式问答（6 题）
  //   9 = 准备就绪
  const [step, setStep] = useState(profile ? 9 : 0);
  const [name, setName] = useState(profile?.name || '');
  const [enName, setEnName] = useState(profile?.enName || '');
  const [gender, setGender] = useState(profile?.gender ?? null);
  const [birth, setBirth] = useState({
    year: profile?.year || null,
    month: profile?.month || null,
    day: profile?.day || null,
  });
  const [time, setTime] = useState({
    hour: profile?.hour ?? null,
    minute: profile?.minute ?? null,
  });
  const [city, setCity] = useState(profile?.city || null);

  // Auto-advance hook screen after 4s
  useEffect(() => {
    if (step === 0) {
      const t = setTimeout(() => setStep(1), 4500);
      return () => clearTimeout(t);
    }
  }, [step]);

  const totalQ = 6;
  const qIndex = step >= 3 && step <= 8 ? step - 2 : 0;

  const allReady = name && gender !== null && birth.year && birth.month && birth.day
                    && time.hour != null && city;

  const handleFinish = () => {
    const profileData = {
      name, enName, gender,
      year: birth.year, month: birth.month, day: birth.day,
      hour: time.hour, minute: time.minute || 0,
      city,
      date: `${birth.year}-${String(birth.month).padStart(2,'0')}-${String(birth.day).padStart(2,'0')}`,
      time: `${String(time.hour).padStart(2,'0')}:${String(time.minute || 0).padStart(2,'0')}`,
    };
    setProfile(profileData);
    // 不写 localStorage —— 数据只在内存，关闭浏览器或刷新即清除
    onBegin();
  };

  // Per-step validity
  const stepValid = {
    3: !!name,
    4: gender !== null,
    5: !!(birth.year && birth.month && birth.day),
    6: time.hour != null,
    7: !!city,
    8: true,  // english name optional
  };

  // 注：使用外部的 CoverWrapper（React.memo 保护），不要在这里再嵌套定义

  // ═══ Step 0: Hook (钩子句, 自动 4s 后进入) ═══
  if (step === 0) {
    return (
      <CoverWrapper step={step}>
        <div style={{ textAlign: 'center', maxWidth: 720, position: 'relative', zIndex: 1 }}>
          <p className="ms-eyebrow" style={{
            marginBottom: '3rem', opacity: 0,
            animation: 'ms-fadeup 1s 0.3s forwards',
          }}>
            MINGSHU · 命 书
          </p>
          <h1 style={{
            fontFamily: 'ZCOOL XiaoWei, serif',
            fontSize: 'clamp(1.8rem, 4.5vw, 3.4rem)',
            color: '#e8d9b0', fontWeight: 400, lineHeight: 1.7,
            letterSpacing: '0.08em',
            opacity: 0,
            animation: 'ms-fadeup 1.4s 0.8s forwards',
          }}>
            你的人生 ——<br/>
            可能比<span style={{ color: '#d4a85a' }}>你以为的</span>，<br/>
            要厚得多。
          </h1>
          <p style={{
            marginTop: '4rem',
            color: 'rgba(232,217,176,0.4)', fontSize: '0.75rem',
            letterSpacing: '0.4em', opacity: 0,
            animation: 'ms-fadeup 1.5s 3s forwards',
          }}>
            ··· 即将展卷 ···
          </p>
        </div>
        <style>{`@keyframes ms-fadeup {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }`}</style>
      </CoverWrapper>
    );
  }

  // ═══ Step 1: 这是什么 ═══
  if (step === 1) {
    return (
      <CoverWrapper step={step}>
        <div style={{ textAlign: 'center', maxWidth: 640, position: 'relative', zIndex: 1 }}>
          <p className="ms-eyebrow" style={{ marginBottom: '2rem' }}>WHAT IS THIS · 这是什么</p>
          <h1 className="ms-title-zh" style={{
            fontSize: 'clamp(2.5rem, 5.5vw, 4.5rem)',
            letterSpacing: '0.4em', marginBottom: '2.5rem',
            textShadow: '0 0 40px rgba(212,168,90,0.2)',
            paddingLeft: '0.4em',
          }}>命 书</h1>
          <p style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: 'clamp(1rem, 1.4vw, 1.2rem)', fontStyle: 'italic',
            color: 'rgba(232,217,176,0.65)', letterSpacing: '0.1em',
            marginBottom: '3rem',
          }}>一卷为你而写的书</p>
          <div style={{
            color: 'rgba(232,217,176,0.7)',
            fontSize: '1rem', lineHeight: 2.4,
            marginBottom: '3.5rem',
          }}>
            这<span style={{ color: '#c0392b' }}>不是</span>测评。<br/>
            是一卷以你的<span style={{ color: '#d4a85a' }}>生辰</span>为种子，<br/>
            用<span style={{ color: '#d4a85a' }}>八字、星辰、数理</span>三种古老语言，<br/>
            写给<span style={{ color: '#d4a85a' }}>你自己</span>的书。
          </div>
          <button className="ms-btn" onClick={() => setStep(2)}>看看里面有什么 →</button>
        </div>
      </CoverWrapper>
    );
  }

  // ═══ Step 2: 里面有什么（预览） ═══
  if (step === 2) {
    const previews = [
      { num: 'I',   title: '八 字', sub: '玉简金字 · 五行能量场 · 大运十柱' },
      { num: 'II',  title: '星 图', sub: '真天体星盘 · 12 宫 · 10 行星' },
      { num: 'III', title: '数 理', sub: '生命之路 · 灵魂 · 命运' },
      { num: 'V',   title: '印 鉴', sub: '多体系交叉 · 朱砂大印' },
    ];
    return (
      <CoverWrapper step={step}>
        <div style={{ maxWidth: 800, position: 'relative', zIndex: 1, width: '100%' }}>
          <p className="ms-eyebrow" style={{ textAlign: 'center', marginBottom: '2rem' }}>
            INSIDE · 里 面 有 什 么
          </p>
          <h2 className="ms-title-zh" style={{
            fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', letterSpacing: '0.2em',
            textAlign: 'center', marginBottom: '3rem',
          }}>四卷一印 · 一本你自己</h2>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '1rem', marginBottom: '3rem',
          }}>
            {previews.map((p, i) => (
              <div key={i} className="ms-card" style={{
                textAlign: 'center', padding: '1.5rem 1rem',
                animation: `ms-fadeup 0.6s ${0.15 * i}s both`,
              }}>
                <div className="ms-juan-num" style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
                  {p.num}
                </div>
                <div style={{
                  fontFamily: 'ZCOOL XiaoWei, serif', color: '#d4a85a',
                  fontSize: '1.4rem', letterSpacing: '0.15em', marginBottom: '0.4rem',
                }}>{p.title}</div>
                <div style={{
                  color: 'rgba(232,217,176,0.5)', fontSize: '0.75rem',
                  letterSpacing: '0.05em', lineHeight: 1.6,
                }}>{p.sub}</div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center' }}>
            <button className="ms-btn" onClick={() => setStep(3)}>开始题写 →</button>
            <p style={{
              color: 'rgba(232,217,176,0.35)', fontSize: '0.7rem',
              letterSpacing: '0.2em', marginTop: '1.5rem', fontStyle: 'italic',
            }}>
              约需 6 步 · 全程不到两分钟 · 数据不会被存下来，关闭页面即消失
            </p>
          </div>
        </div>
        <style>{`@keyframes ms-fadeup {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }`}</style>
      </CoverWrapper>
    );
  }

  // ═══ Steps 3-8: Guided Q&A ═══
  const renderQ = () => {
    switch (step) {
      case 3: return {
        eyebrow: '问 一 / 第一题',
        title: '你叫什么名字？',
        sub: '这本书的封面要题上你的名字',
        body: (
          <input className="ms-input" type="text" placeholder="例：王嘉恒"
                 value={name} onChange={e => setName(e.target.value)}
                 autoFocus
                 style={{ fontSize: '1.2rem', padding: '1rem 1.2rem', textAlign: 'center' }} />
        ),
      };
      case 4: return {
        eyebrow: '问 二 / 第二题',
        title: '你是阳还是阴？',
        sub: '八字大运按性别推算',
        body: (
          <div style={{ display: 'flex', gap: '1rem' }}>
            {[
              { v: 1, l: '乾', sub: '阳 · 男' },
              { v: 0, l: '坤', sub: '阴 · 女' },
            ].map(g => (
              <button key={g.v}
                onClick={() => setGender(g.v)}
                style={{
                  flex: 1, padding: '2rem 1rem', fontFamily: 'inherit',
                  background: gender === g.v ? 'rgba(212,168,90,0.15)' : 'rgba(20,16,26,0.4)',
                  border: `1px solid ${gender === g.v ? '#d4a85a' : 'rgba(212,168,90,0.3)'}`,
                  cursor: 'pointer', transition: 'all 0.3s ease',
                }}>
                <div style={{
                  color: gender === g.v ? '#d4a85a' : '#e8d9b0',
                  fontFamily: 'ZCOOL XiaoWei, serif', fontSize: '3rem',
                  marginBottom: '0.5rem',
                }}>{g.l}</div>
                <div style={{
                  color: 'rgba(232,217,176,0.5)', fontSize: '0.85rem',
                  letterSpacing: '0.2em',
                }}>{g.sub}</div>
              </button>
            ))}
          </div>
        ),
      };
      case 5: return {
        eyebrow: '问 三 / 第三题',
        title: '你出生于哪一天？',
        sub: '公历日期 · 滚动选择',
        body: <DatePicker {...birth} onChange={setBirth} />,
      };
      case 6: return {
        eyebrow: '问 四 / 第四题',
        title: '出生在哪个时辰？',
        sub: '不知道精确时间也没关系——选大概时段或十二时辰即可',
        body: <TimePicker {...time} onChange={setTime} />,
      };
      case 7: return {
        eyebrow: '问 五 / 第五题',
        title: '在哪个城市出生？',
        sub: '用于真太阳时校正 + 占星出生地纬度',
        body: <CityPicker city={city} onChange={setCity} />,
      };
      case 8: return {
        eyebrow: '问 六 / 第六题',
        title: '英文名 / 拼音是什么？',
        sub: '可选 · 用于数字命理（命运数 / 灵魂数 / 人格数）',
        body: (
          <input className="ms-input" type="text" placeholder="例：Jaycen Wang"
                 value={enName} onChange={e => setEnName(e.target.value)}
                 autoFocus
                 style={{ fontSize: '1.2rem', padding: '1rem 1.2rem', textAlign: 'center' }} />
        ),
      };
      default: return null;
    }
  };

  if (step >= 3 && step <= 8) {
    const q = renderQ();
    return (
      <CoverWrapper step={step}>
        <div style={{
          maxWidth: 580, width: '100%', position: 'relative', zIndex: 1,
        }}>
          {/* Progress */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '2.5rem',
          }}>
            {[1,2,3,4,5,6].map(n => (
              <div key={n} style={{
                flex: 1, height: 2,
                background: n <= qIndex ? '#d4a85a' : 'rgba(212,168,90,0.15)',
                transition: 'background 0.5s ease',
              }} />
            ))}
            <span style={{
              color: '#d4a85a', fontFamily: 'Cinzel', fontSize: '0.7rem',
              letterSpacing: '0.2em', marginLeft: '0.5rem',
            }}>{qIndex} / {totalQ}</span>
          </div>

          <div className="ms-card" style={{ padding: '2.5rem', position: 'relative' }}>
            <p className="ms-eyebrow" style={{ marginBottom: '0.6rem' }}>{q.eyebrow}</p>
            <h2 className="ms-title-zh" style={{
              fontSize: 'clamp(1.6rem, 3vw, 2rem)', letterSpacing: '0.05em',
              marginBottom: '0.6rem',
            }}>{q.title}</h2>
            <p style={{
              color: 'rgba(232,217,176,0.5)', fontSize: '0.85rem',
              marginBottom: '2rem', fontStyle: 'italic',
            }}>{q.sub}</p>

            <div style={{ marginBottom: '2rem' }}>
              {q.body}
            </div>

            {/* Nav */}
            <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1rem' }}>
              <button onClick={() => setStep(step - 1)}
                      style={{
                        flex: 1, padding: '0.9rem',
                        background: 'transparent', border: '1px solid rgba(212,168,90,0.3)',
                        color: 'rgba(232,217,176,0.6)',
                        fontFamily: 'inherit', fontSize: '0.85rem',
                        letterSpacing: '0.2em', cursor: 'pointer',
                        transition: 'all 0.3s ease',
                      }}>
                ← 上一题
              </button>
              {step < 8 ? (
                <button onClick={() => setStep(step + 1)}
                        disabled={!stepValid[step]}
                        className="ms-btn"
                        style={{ flex: 2, padding: '0.9rem' }}>
                  下一题 →
                </button>
              ) : (
                <button onClick={() => setStep(9)}
                        className="ms-btn"
                        style={{ flex: 2, padding: '0.9rem' }}>
                  完 成 →
                </button>
              )}
            </div>
          </div>

          {/* Trust line */}
          <p style={{
            textAlign: 'center', marginTop: '1.5rem',
            color: 'rgba(232,217,176,0.3)', fontSize: '0.7rem',
            letterSpacing: '0.2em', fontStyle: 'italic',
          }}>
            🔒 不存留任何数据 · 关闭页面即消失 · 不上传 · 不收费 · 不注册
          </p>
        </div>
      </CoverWrapper>
    );
  }

  // ═══ Step 9: Ready · 展卷 ═══
  return (
    <CoverWrapper step={step}>
      <div style={{ textAlign: 'center', maxWidth: 580, position: 'relative', zIndex: 1 }}>
        <p className="ms-eyebrow" style={{ marginBottom: '2rem' }}>READY · 准 备 就 绪</p>
        <h2 className="ms-title-zh" style={{
          fontSize: 'clamp(2rem, 4vw, 2.8rem)', letterSpacing: '0.15em',
          marginBottom: '2rem', lineHeight: 1.5,
        }}>
          这卷书的封面，<br/>
          已经题好了<span style={{ color: '#d4a85a' }}> · {name || '——'}</span>
        </h2>

        {/* Summary card */}
        <div className="ms-card" style={{
          padding: '2rem 2.5rem', marginBottom: '2.5rem', textAlign: 'left',
        }}>
          {[
            { l: '名 字', v: name },
            { l: '阴 阳', v: gender === 1 ? '乾 · 男' : '坤 · 女' },
            { l: '生 辰', v: `${birth.year} 年 ${CN_NUM[birth.month]} 月 ${birth.day} 日 · ${String(time.hour).padStart(2,'0')}:${String(time.minute || 0).padStart(2,'0')}` },
            { l: '出生地', v: city ? `${city.province} · ${city.name}` : '' },
            ...(enName ? [{ l: '英 文', v: enName }] : []),
          ].map((row, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
              padding: '0.7rem 0', borderBottom: '1px dashed rgba(212,168,90,0.15)',
            }}>
              <span className="ms-eyebrow" style={{ fontSize: '0.65rem' }}>{row.l}</span>
              <span style={{ color: '#e8d9b0', fontSize: '0.95rem' }}>{row.v}</span>
            </div>
          ))}
        </div>

        <button className="ms-btn" onClick={handleFinish} disabled={!allReady}
                style={{ padding: '1rem 3rem', fontSize: '0.95rem' }}>
          展 卷 · UNFURL
        </button>
        <button onClick={() => setStep(3)}
                style={{
                  display: 'block', margin: '1.5rem auto 0',
                  background: 'transparent', border: 'none',
                  color: 'rgba(232,217,176,0.5)', fontSize: '0.8rem',
                  fontFamily: 'inherit', letterSpacing: '0.15em', cursor: 'pointer',
                }}>
          ← 重新题写
        </button>
      </div>
    </CoverWrapper>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// 2. 卷一 · 八字
// ═══════════════════════════════════════════════════════════════════════════
const ELEMENT_COLORS = {
  '木': { from: '#3d6b3d', to: '#5a9c5a', glow: 'rgba(90,156,90,0.4)' },
  '火': { from: '#c0392b', to: '#e74c3c', glow: 'rgba(231,76,60,0.4)' },
  '土': { from: '#8b6f23', to: '#c9a14a', glow: 'rgba(201,161,74,0.4)' },
  '金': { from: '#7a7a7a', to: '#cccccc', glow: 'rgba(204,204,204,0.4)' },
  '水': { from: '#1e3a5f', to: '#3a6cab', glow: 'rgba(58,108,171,0.4)' },
};

const BaziPage = ({ bazi }) => {
  if (!bazi) return null;
  const { pillars, dayMaster, wuxingPct, dayStrength, xiYong, geJu, daYun, timing } = bazi;

  return (
    <div className="ms-page" style={{ padding: '6rem 2rem 4rem', position: 'relative', zIndex: 5 }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem', position: 'relative' }}>
          <div className="ms-juan-num" style={{
            position: 'absolute', left: '50%', top: '-3rem', transform: 'translateX(-50%)',
            fontSize: 'clamp(8rem, 16vw, 14rem)',
          }}>I</div>
          <div className="ms-eyebrow" style={{ position: 'relative', marginBottom: '1.5rem' }}>JUAN I · 卷 一</div>
          <h2 className="ms-title-zh" style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '0.3em',
            position: 'relative', marginBottom: '1rem',
          }}>八 字</h2>
          <p style={{
            fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic',
            color: 'rgba(232,217,176,0.5)', letterSpacing: '0.1em', position: 'relative',
          }}>天干地支 · 五行能量场</p>
        </div>

        {/* 四柱 */}
        <div style={{ marginBottom: '4rem' }}>
          <p className="ms-eyebrow" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>四 柱 · FOUR PILLARS</p>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem',
            maxWidth: 720, margin: '0 auto',
          }}>
            {[
              { key: 'time',  label: '时 柱', sub: '子女宫 / 晚景' },
              { key: 'day',   label: '日 柱', sub: '自身 / 婚姻' },
              { key: 'month', label: '月 柱', sub: '父母 / 青年' },
              { key: 'year',  label: '年 柱', sub: '祖辈 / 早年' },
            ].map(({ key, label, sub }) => {
              const p = pillars[key];
              return (
                <div key={key} className="ms-jade-slip" style={{ padding: '2rem 0.5rem 1.6rem' }}>
                  <div className="ms-jade-meta" style={{ marginBottom: '1.2rem' }}>{label}</div>
                  <div className="ms-jade-char" style={{ fontSize: 'clamp(2.4rem, 5vw, 3.5rem)', marginBottom: '0.4rem' }}>{p.gan}</div>
                  <div className="ms-jade-char" style={{
                    fontSize: 'clamp(2.4rem, 5vw, 3.5rem)', marginBottom: '1.2rem',
                    color: '#b8943e',
                  }}>{p.zhi}</div>
                  <div style={{
                    color: 'rgba(232,217,176,0.4)', fontSize: '0.65rem',
                    letterSpacing: '0.15em', textAlign: 'center', lineHeight: 1.6,
                  }}>{p.ganShi}<br/>{sub}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 日主 */}
        <div className="ms-card" style={{ marginBottom: '4rem', textAlign: 'center', padding: '2.5rem' }}>
          <p className="ms-eyebrow" style={{ marginBottom: '1rem' }}>日 主 · DAY MASTER</p>
          <div style={{
            fontFamily: 'ZCOOL XiaoWei, serif', fontSize: '4rem',
            color: '#d4a85a', lineHeight: 1, marginBottom: '0.6rem',
            textShadow: '0 0 30px rgba(212,168,90,0.4)',
          }}>{dayMaster.gan}</div>
          <p style={{ color: '#d4a85a', letterSpacing: '0.3em', fontSize: '0.85rem', marginBottom: '1rem' }}>
            {dayMaster.gan}{dayMaster.wuxing} · {dayStrength}
          </p>
          <p style={{
            color: 'rgba(232,217,176,0.7)', fontSize: '1rem',
            lineHeight: 1.9, fontStyle: 'italic', maxWidth: 480, margin: '0 auto',
          }}>{dayMaster.descr}</p>
        </div>

        {/* 五行能量球 */}
        <div style={{ marginBottom: '3rem' }}>
          <p className="ms-eyebrow" style={{ textAlign: 'center', marginBottom: '2rem' }}>
            五 行 能 量 场 · FIVE ELEMENTS
          </p>
          <div className="ms-orb-wrap">
            {['木','火','土','金','水'].map(el => {
              const pct = wuxingPct[el] || 0;
              const c = ELEMENT_COLORS[el];
              const size = 60 + pct * 1.2;
              return (
                <div key={el} className="ms-orb">
                  <div className="ms-orb-circle" style={{ width: size, height: size }}>
                    <div className="ms-orb-bg" style={{
                      background: `radial-gradient(circle, ${c.to} 0%, ${c.from} 100%)`,
                      boxShadow: `0 0 ${20 + pct/2}px ${c.glow}`,
                    }} />
                    <div className="ms-orb-char">{el}</div>
                  </div>
                  <div className="ms-orb-pct">{pct.toFixed(0)}%</div>
                </div>
              );
            })}
          </div>
          <div style={{
            textAlign: 'center', marginTop: '2.5rem',
            color: 'rgba(232,217,176,0.7)', fontSize: '0.9rem', lineHeight: 1.9,
          }}>
            <div style={{ marginBottom: '0.4rem' }}>
              <span className="ms-eyebrow" style={{ marginRight: '0.8rem' }}>喜 用 神</span>
              {[...new Set(xiYong.good)].map(g => <span key={g} className="ms-tag">{g}</span>)}
            </div>
            <div>
              <span className="ms-eyebrow" style={{ marginRight: '0.8rem' }}>忌 神</span>
              {[...new Set(xiYong.bad)].map(g => <span key={g} className="ms-tag ms-tag-cinnabar">{g}</span>)}
            </div>
            <p style={{ marginTop: '1.2rem', fontStyle: 'italic', color: 'rgba(232,217,176,0.5)', fontSize: '0.85rem' }}>
              {geJu} · 月令本气 + 透干判定
            </p>
          </div>
        </div>

        {/* 大运 */}
        {daYun.length > 0 && (
          <div className="ms-card" style={{ padding: '2rem' }}>
            <p className="ms-eyebrow" style={{ marginBottom: '1.5rem' }}>大 运 · DECADAL CYCLES</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '0.6rem' }}>
              {daYun.map((d, i) => (
                <div key={i} style={{
                  border: '1px solid rgba(212,168,90,0.15)',
                  padding: '0.8rem 0.5rem', textAlign: 'center',
                  background: 'rgba(212,168,90,0.03)',
                }}>
                  <div style={{ fontFamily: 'Cinzel', color: 'rgba(232,217,176,0.4)', fontSize: '0.7rem', letterSpacing: '0.15em' }}>
                    {d.startAge}-{d.endAge}
                  </div>
                  <div style={{ color: '#d4a85a', fontSize: '1.4rem', fontFamily: 'ZCOOL XiaoWei', margin: '0.4rem 0' }}>
                    {d.ganZhi}
                  </div>
                  <div style={{ color: 'rgba(232,217,176,0.4)', fontSize: '0.65rem' }}>
                    {d.startYear}-{d.endYear}
                  </div>
                </div>
              ))}
            </div>
            <p style={{
              marginTop: '1.5rem', color: 'rgba(232,217,176,0.5)',
              fontSize: '0.8rem', lineHeight: 1.8, fontStyle: 'italic', textAlign: 'center',
            }}>一柱十年。每一柱与日主的喜忌，决定那十年的"运势天气"。</p>
          </div>
        )}

        <p style={{
          textAlign: 'center', marginTop: '3rem',
          color: 'rgba(232,217,176,0.3)', fontSize: '0.7rem',
          letterSpacing: '0.15em',
        }}>
          真太阳时校正 {timing.trueSolarTime.correctionMinutes >= 0 ? '+' : ''}{timing.trueSolarTime.correctionMinutes} 分钟 ·
          农历 {timing.lunar.year}年{timing.lunar.month}月{timing.lunar.day}
        </p>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// 3. 卷二 · 占星
// ═══════════════════════════════════════════════════════════════════════════
const StarWheel = ({ astro }) => {
  const { core, planets, houses } = astro;
  const SIZE = 480, CENTER = SIZE / 2;
  const R_OUTER = 220, R_SIGN = 200, R_HOUSE = 165, R_PLANET = 130, R_INNER = 80;
  const ascLon = core.asc.longitude;
  const toAngle = (lon) => 180 + ((lon - ascLon + 360) % 360);
  const polar = (lon, r) => {
    const a = (toAngle(lon) - 90) * Math.PI / 180;
    return { x: CENTER + r * Math.cos(a), y: CENTER + r * Math.sin(a) };
  };
  const SIGN_GLYPHS = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ width: '100%', height: 'auto' }}>
      <circle cx={CENTER} cy={CENTER} r={R_OUTER} fill="none" stroke="#d4a85a" strokeWidth="1" opacity="0.6" />
      <circle cx={CENTER} cy={CENTER} r={R_SIGN} fill="none" stroke="#d4a85a" strokeWidth="0.5" opacity="0.4" />
      <circle cx={CENTER} cy={CENTER} r={R_HOUSE} fill="none" stroke="#d4a85a" strokeWidth="0.5" opacity="0.3" />
      <circle cx={CENTER} cy={CENTER} r={R_INNER} fill="none" stroke="#d4a85a" strokeWidth="0.5" opacity="0.5" />
      {[...Array(12)].map((_, i) => {
        const lon = i * 30;
        const a = (toAngle(lon) - 90) * Math.PI / 180;
        const x1 = CENTER + R_SIGN * Math.cos(a), y1 = CENTER + R_SIGN * Math.sin(a);
        const x2 = CENTER + R_OUTER * Math.cos(a), y2 = CENTER + R_OUTER * Math.sin(a);
        const labelPos = polar(lon + 15, (R_SIGN + R_OUTER) / 2);
        return (
          <g key={i}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#d4a85a" strokeWidth="0.5" opacity="0.4" />
            <text x={labelPos.x} y={labelPos.y + 5} textAnchor="middle"
                  fill="#d4a85a" fontSize="14" opacity="0.85" fontFamily="serif">
              {SIGN_GLYPHS[i]}
            </text>
          </g>
        );
      })}
      {houses.map((h, i) => {
        const pStart = polar(h.cuspLongitude, R_INNER);
        const pEnd = polar(h.cuspLongitude, R_HOUSE);
        const labelPos = polar(h.cuspLongitude + 15, (R_INNER + R_HOUSE) / 2);
        return (
          <g key={i}>
            <line x1={pStart.x} y1={pStart.y} x2={pEnd.x} y2={pEnd.y}
                  stroke="rgba(212,168,90,0.3)" strokeWidth="0.5" />
            <text x={labelPos.x} y={labelPos.y + 4} textAnchor="middle"
                  fill="rgba(232,217,176,0.4)" fontSize="9" fontFamily="Cinzel, serif">
              {h.num}
            </text>
          </g>
        );
      })}
      <line
        x1={polar(core.asc.longitude, R_INNER).x} y1={polar(core.asc.longitude, R_INNER).y}
        x2={polar(core.asc.longitude, R_OUTER).x} y2={polar(core.asc.longitude, R_OUTER).y}
        stroke="#c0392b" strokeWidth="2" opacity="0.8" />
      <text x={polar(core.asc.longitude, R_OUTER + 18).x}
            y={polar(core.asc.longitude, R_OUTER + 18).y + 4}
            textAnchor="middle" fill="#c0392b" fontSize="10"
            fontFamily="Cinzel, serif" letterSpacing="2">ASC</text>
      <line
        x1={polar(core.mc.longitude, R_INNER).x} y1={polar(core.mc.longitude, R_INNER).y}
        x2={polar(core.mc.longitude, R_OUTER).x} y2={polar(core.mc.longitude, R_OUTER).y}
        stroke="#d4a85a" strokeWidth="1.5" opacity="0.7" strokeDasharray="3 2" />
      <text x={polar(core.mc.longitude, R_OUTER + 18).x}
            y={polar(core.mc.longitude, R_OUTER + 18).y + 4}
            textAnchor="middle" fill="#d4a85a" fontSize="10"
            fontFamily="Cinzel, serif" letterSpacing="2">MC</text>
      {planets.map((p, i) => {
        const pos = polar(p.longitude, R_PLANET);
        return (
          <g key={i}>
            <circle cx={pos.x} cy={pos.y} r="4" fill="#d4a85a" opacity="0.9" />
            <text x={pos.x} y={pos.y - 9} textAnchor="middle"
                  fill="#e8d9b0" fontSize="14" fontFamily="serif">
              {p.symbol}
            </text>
          </g>
        );
      })}
      <text x={CENTER} y={CENTER - 5} textAnchor="middle"
            fill="rgba(212,168,90,0.5)" fontSize="9" fontFamily="Cinzel">NATAL</text>
      <text x={CENTER} y={CENTER + 8} textAnchor="middle"
            fill="rgba(232,217,176,0.4)" fontSize="9" fontFamily="ZCOOL XiaoWei">本 命</text>
    </svg>
  );
};

const AstroPage = ({ astro }) => {
  if (!astro) return null;
  const { core, planets, aspects, elementCount } = astro;

  return (
    <div className="ms-page" style={{ padding: '6rem 2rem 4rem', position: 'relative', zIndex: 5 }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem', position: 'relative' }}>
          <div className="ms-juan-num" style={{
            position: 'absolute', left: '50%', top: '-3rem', transform: 'translateX(-50%)',
            fontSize: 'clamp(8rem, 16vw, 14rem)',
          }}>II</div>
          <div className="ms-eyebrow" style={{ marginBottom: '1.5rem', position: 'relative' }}>JUAN II · 卷 二</div>
          <h2 className="ms-title-zh" style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '0.3em', position: 'relative',
            marginBottom: '1rem',
          }}>星 图</h2>
          <p style={{
            fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic',
            color: 'rgba(232,217,176,0.5)', letterSpacing: '0.1em', position: 'relative',
          }}>十二宫位 · 十大行星 · 真天体位置</p>
        </div>

        <div style={{ maxWidth: 480, margin: '0 auto 3rem' }}>
          <StarWheel astro={astro} />
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.5rem', marginBottom: '3rem',
        }}>
          {[
            { label: '太 阳 · SUN',  sub: '本质自我 · 创造力',     d: core.sun },
            { label: '月 亮 · MOON', sub: '内心 · 情绪 · 安全感',  d: core.moon },
            { label: '上 升 · ASC',  sub: '外在形象 · 此生面具',   d: core.asc },
          ].map((item, i) => (
            <div key={i} className="ms-card" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
              <p className="ms-eyebrow" style={{ marginBottom: '0.5rem' }}>{item.label}</p>
              <p style={{
                color: 'rgba(232,217,176,0.4)', fontSize: '0.7rem',
                letterSpacing: '0.15em', marginBottom: '1.5rem',
              }}>{item.sub}</p>
              <div style={{
                fontFamily: 'ZCOOL XiaoWei, serif', fontSize: '2rem',
                color: '#d4a85a', marginBottom: '0.4rem',
                textShadow: '0 0 20px rgba(212,168,90,0.3)',
              }}>{item.d.sign.name}座</div>
              <div style={{ color: 'rgba(232,217,176,0.5)', fontSize: '0.75rem', letterSpacing: '0.1em' }}>
                {item.d.degree.toFixed(1)}° · {item.d.sign.element}象 · {item.d.sign.quality}
              </div>
            </div>
          ))}
        </div>

        <div className="ms-card" style={{ marginBottom: '3rem', padding: '2rem' }}>
          <p className="ms-eyebrow" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
            元 素 分 布 · ELEMENTAL BALANCE
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            {Object.entries(elementCount).map(([el, n]) => {
              const colors = { 火:'#e74c3c', 土:'#c9a14a', 风:'#9b87b0', 水:'#3a6cab' };
              return (
                <div key={el} style={{ textAlign: 'center' }}>
                  <div style={{
                    width: 50, height: 50, margin: '0 auto 0.6rem',
                    borderRadius: '50%', background: colors[el],
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontFamily: 'ZCOOL XiaoWei', fontSize: '1.5rem',
                    boxShadow: `0 0 ${10 + n*4}px ${colors[el]}66`,
                  }}>{el}</div>
                  <div style={{ color: '#d4a85a', fontSize: '0.85rem' }}>
                    {n}<span style={{ color: 'rgba(232,217,176,0.4)', fontSize: '0.7rem' }}> / 10</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="ms-card" style={{ marginBottom: '3rem', padding: '2rem' }}>
          <p className="ms-eyebrow" style={{ marginBottom: '1.5rem' }}>十 行 星 · ALL PLANETS</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.8rem' }}>
            {planets.map((p, i) => (
              <div key={i} style={{
                padding: '0.8rem', border: '1px solid rgba(212,168,90,0.15)',
                background: 'rgba(212,168,90,0.03)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '1.2rem', color: '#d4a85a', fontFamily: 'serif' }}>{p.symbol}</span>
                  <span style={{ color: 'rgba(232,217,176,0.4)', fontSize: '0.7rem', fontFamily: 'Cinzel' }}>
                    H{p.house}
                  </span>
                </div>
                <div style={{ color: '#e8d9b0', fontSize: '0.95rem', marginTop: '0.3rem' }}>{p.name}</div>
                <div style={{ color: 'rgba(232,217,176,0.55)', fontSize: '0.78rem' }}>
                  {p.sign.name} {p.degree.toFixed(1)}°
                </div>
              </div>
            ))}
          </div>
        </div>

        {aspects.filter(a => a.major).length > 0 && (
          <div className="ms-card" style={{ padding: '2rem' }}>
            <p className="ms-eyebrow" style={{ marginBottom: '1.5rem' }}>主 要 相 位 · MAJOR ASPECTS</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.5rem' }}>
              {aspects.filter(a => a.major).slice(0, 16).map((a, i) => (
                <div key={i} style={{
                  padding: '0.6rem 0.8rem', display: 'flex', alignItems: 'center',
                  gap: '0.6rem',
                  borderLeft: `2px solid ${a.type === '合相' ? '#d4a85a' : (a.type === '四分相' || a.type === '对分相') ? '#c0392b' : '#5a9c5a'}`,
                  background: 'rgba(212,168,90,0.03)',
                }}>
                  <span style={{ color: '#e8d9b0', fontSize: '0.85rem', flex: 1 }}>
                    {a.fromName} · {a.toName}
                  </span>
                  <span style={{
                    color: (a.type === '四分相' || a.type === '对分相') ? '#c0392b' : '#d4a85a',
                    fontSize: '0.75rem', letterSpacing: '0.1em',
                  }}>{a.type}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// 4. 卷三 · 数字命理
// ═══════════════════════════════════════════════════════════════════════════
const NumberPage = ({ numerology, profile }) => {
  if (!numerology) return null;
  const { lifePath, birthDay, destiny, soul, personality } = numerology;

  const renderNumber = (label, sub, data, isPrimary = false) => {
    if (!data) return null;
    return (
      <div className="ms-card" style={{
        textAlign: 'center', padding: isPrimary ? '3rem 2rem' : '2rem 1.5rem',
      }}>
        <p className="ms-eyebrow" style={{ marginBottom: '0.5rem' }}>{label}</p>
        <p style={{
          color: 'rgba(232,217,176,0.4)', fontSize: '0.7rem',
          letterSpacing: '0.15em', marginBottom: '1.5rem',
        }}>{sub}</p>
        <div className={`ms-number-glyph ${data.isMaster ? 'ms-master-glow' : ''}`} style={{
          fontSize: isPrimary ? 'clamp(6rem, 12vw, 9rem)' : 'clamp(3.5rem, 6vw, 5rem)',
          marginBottom: '1rem',
        }}>{data.value}</div>
        {data.isMaster && (
          <p style={{
            color: '#c0392b', fontSize: '0.7rem', letterSpacing: '0.3em',
            marginBottom: '1rem', fontStyle: 'italic',
          }}>MASTER NUMBER · 大 师 数</p>
        )}
        <p style={{
          fontFamily: 'ZCOOL XiaoWei, serif', color: '#d4a85a',
          fontSize: '1.1rem', letterSpacing: '0.15em', marginBottom: '0.8rem',
        }}>{data.descr?.keyword}</p>
        <p style={{
          color: 'rgba(232,217,176,0.65)', fontSize: '0.88rem',
          lineHeight: 1.8, fontStyle: 'italic',
        }}>{data.descr?.text}</p>
      </div>
    );
  };

  return (
    <div className="ms-page" style={{ padding: '6rem 2rem 4rem', position: 'relative', zIndex: 5 }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem', position: 'relative' }}>
          <div className="ms-juan-num" style={{
            position: 'absolute', left: '50%', top: '-3rem', transform: 'translateX(-50%)',
            fontSize: 'clamp(8rem, 16vw, 14rem)',
          }}>III</div>
          <div className="ms-eyebrow" style={{ marginBottom: '1.5rem', position: 'relative' }}>JUAN III · 卷 三</div>
          <h2 className="ms-title-zh" style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '0.3em', position: 'relative',
            marginBottom: '1rem',
          }}>数 之 命 理</h2>
          <p style={{
            fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic',
            color: 'rgba(232,217,176,0.5)', letterSpacing: '0.1em', position: 'relative',
          }}>毕达哥拉斯 · Numerology</p>
        </div>

        {renderNumber('生命之路 · LIFE PATH', '此生最深的灵魂主题', lifePath, true)}

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.5rem', marginTop: '2rem',
        }}>
          {renderNumber('生 日 数 · BIRTH DAY', '与生俱来的天赋', birthDay)}
          {destiny && renderNumber('命 运 数 · DESTINY', '名字背后的人生使命', destiny)}
          {soul && renderNumber('灵 魂 数 · SOUL', '内心真正渴望的东西', soul)}
          {personality && renderNumber('人 格 数 · PERSONALITY', '你给世界的第一印象', personality)}
        </div>

        {!numerology.name && (
          <div className="ms-card" style={{ marginTop: '2rem', padding: '1.5rem', textAlign: 'center' }}>
            <p style={{ color: 'rgba(232,217,176,0.5)', fontSize: '0.9rem', fontStyle: 'italic' }}>
              没有提供英文名/拼音 · 命运数 / 灵魂数 / 人格数 暂未计算
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// 5. 卷五 · 印鉴
// ═══════════════════════════════════════════════════════════════════════════
function synthesizeArchetype(dayWx, sunEl, moonEl, lifePath) {
  const wxRole = {
    '木': '生发的种子', '火': '燃烧的烛火', '土': '稳厚的大地',
    '金': '锋利的器物', '水': '流动的江海',
  };
  const sunRole = {
    '火': '内核炽热', '土': '内核厚实', '风': '内核灵动', '水': '内核深沉',
  };
  const moonRole = {
    '火': '情绪外露', '土': '情绪压抑', '风': '情绪多变', '水': '情绪深邃',
  };
  const title = `一颗${wxRole[dayWx] || '土'}，${sunRole[sunEl] || '内核厚实'}、${moonRole[moonEl] || '情绪深邃'}的灵魂。`;
  let text = '';
  if (sunEl === moonEl) {
    text = `太阳与月亮同属${sunEl}象——你内外一致，情绪和创造方向同频，代价是缺少另一极的张力。`;
  } else if ((sunEl === '火' && moonEl === '水') || (sunEl === '水' && moonEl === '火')) {
    text = `太阳与月亮在水火两极——你心里有冲突。一边是火的冲动与表达，一边是水的细腻与回避。这种张力会让你长出层次感。`;
  } else if ((sunEl === '土' && moonEl === '风') || (sunEl === '风' && moonEl === '土')) {
    text = `太阳与月亮在土风之间——你既要落地又要飞翔。这种张力既是负担也是天赋：你能把抽象想法变成具体作品。`;
  } else {
    text = `太阳${sunEl}象 + 月亮${moonEl}象——你的外在表现和内心需求并不完全一致。学会让两者对话，是你这一生的功课。`;
  }
  if (lifePath === 22 || lifePath === 11 || lifePath === 33) {
    text += ` 加上大师数 ${lifePath}——你天生背着比常人更重的"完成感的合同"。早年觉得不甘，中年开始落地，晚年方才安顿。`;
  }
  return { title, text };
}

const SealPage = ({ profile, bazi, astro, numerology }) => {
  if (!bazi || !astro) return null;
  const sunElement = astro.core.sun.sign.element;
  const moonElement = astro.core.moon.sign.element;
  const ascElement = astro.core.asc.sign.element;
  const dayWuxing = bazi.dayMaster.wuxing;
  const lifePath = numerology?.lifePath?.value;
  const archetype = synthesizeArchetype(dayWuxing, sunElement, moonElement, lifePath);

  return (
    <div className="ms-page" style={{ padding: '6rem 2rem 4rem', position: 'relative', zIndex: 5 }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem', position: 'relative' }}>
          <div className="ms-juan-num" style={{
            position: 'absolute', left: '50%', top: '-3rem', transform: 'translateX(-50%)',
            fontSize: 'clamp(8rem, 16vw, 14rem)',
          }}>V</div>
          <div className="ms-eyebrow" style={{ marginBottom: '1.5rem', position: 'relative' }}>JUAN V · 卷 五</div>
          <h2 className="ms-title-zh" style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '0.3em', position: 'relative',
            marginBottom: '1rem',
          }}>印 鉴</h2>
          <p style={{
            fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic',
            color: 'rgba(232,217,176,0.5)', letterSpacing: '0.1em', position: 'relative',
          }}>多 体 系 交 叉 印 证 · 核 心 你</p>
        </div>

        <div className="ms-card" style={{ marginBottom: '3rem', padding: '2.5rem' }}>
          <p className="ms-eyebrow" style={{ marginBottom: '2rem', textAlign: 'center' }}>
            五 个 体 系 · 同 一 个 你
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { sys: '八 字 日 主', val: `${bazi.dayMaster.gan} · ${dayWuxing} · ${bazi.dayStrength}` },
              { sys: '太 阳 星 座', val: `${astro.core.sun.sign.name}座 · ${sunElement}象` },
              { sys: '月 亮 星 座', val: `${astro.core.moon.sign.name}座 · ${moonElement}象` },
              { sys: '上 升 星 座', val: `${astro.core.asc.sign.name}座 · ${ascElement}象` },
              ...(lifePath ? [{ sys: '生 命 之 路', val: `${lifePath} · ${numerology.lifePath.descr?.keyword}` }] : []),
            ].map((row, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                padding: '0.8rem 0',
                borderBottom: '1px dashed rgba(212,168,90,0.15)',
              }}>
                <span className="ms-eyebrow" style={{ fontSize: '0.65rem' }}>{row.sys}</span>
                <span style={{ color: '#e8d9b0', fontSize: '1rem' }}>{row.val}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{
          padding: '3.5rem 2rem', textAlign: 'center', marginBottom: '4rem',
          background: 'linear-gradient(135deg, rgba(212,168,90,0.08), rgba(192,57,43,0.04))',
          border: '1px solid rgba(212,168,90,0.25)',
        }}>
          <p className="ms-eyebrow" style={{ marginBottom: '2rem' }}>核 心 原 型 · CORE ARCHETYPE</p>
          <p style={{
            fontFamily: '"Cormorant Garamond", "ZCOOL XiaoWei", serif', fontStyle: 'italic',
            fontSize: 'clamp(1.4rem, 3vw, 2.2rem)', color: '#e8d9b0',
            lineHeight: 1.8, letterSpacing: '0.05em', marginBottom: '1.5rem',
          }}>{archetype.title}</p>
          <p style={{
            color: 'rgba(232,217,176,0.7)', fontSize: '1rem', lineHeight: 2,
            maxWidth: 580, margin: '0 auto',
          }}>{archetype.text}</p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
          <div className="ms-seal">
            <div className="ms-seal-text">{profile.name}<br/>命书</div>
          </div>
        </div>
        <p style={{
          textAlign: 'center', color: 'rgba(232,217,176,0.5)',
          fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
          fontSize: '0.9rem', letterSpacing: '0.1em',
        }}>
          {profile.year}.{String(profile.month).padStart(2,'0')}.{String(profile.day).padStart(2,'0')} ·
          {' '}{profile.city.name} · 题
        </p>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// 6. 卷尾
// ═══════════════════════════════════════════════════════════════════════════
const FinalePage = ({ profile, onReset, onJump }) => {
  const today = new Date();
  const target = new Date(today.getTime() + 21 * 86400000);
  const fmt = d => `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;

  return (
    <div className="ms-page" style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '6rem 2rem 4rem',
      position: 'relative', zIndex: 5,
    }}>
      <div style={{
        position: 'absolute', right: '-4rem', bottom: '-4rem',
        fontFamily: 'ZCOOL XiaoWei, serif',
        fontSize: 'clamp(20rem, 38vw, 38rem)',
        color: 'rgba(212,168,90,0.04)',
        lineHeight: 1, pointerEvents: 'none', userSelect: 'none',
      }}>终</div>
      <div style={{ maxWidth: 640, textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div className="ms-eyebrow" style={{ marginBottom: '2rem' }}>FINIS · 卷 尾</div>
        <h2 className="ms-title-zh" style={{
          fontSize: 'clamp(2rem, 4.5vw, 3.2rem)',
          letterSpacing: '0.2em', marginBottom: '2rem', lineHeight: 1.4,
        }}>
          这是你的命书<br/>
          <span style={{ color: '#d4a85a', fontSize: '0.7em' }}>{profile.name}</span>
        </h2>
        <p style={{
          color: 'rgba(232,217,176,0.65)', fontSize: '1rem',
          lineHeight: 2.2, marginBottom: '4rem', fontStyle: 'italic',
        }}>命盘是你的乐谱。<br/>演奏的人，始终是你。</p>

        <div style={{
          padding: '2.5rem 2rem', marginBottom: '3rem',
          border: '1px solid rgba(212,168,90,0.25)',
          background: 'rgba(212,168,90,0.04)',
        }}>
          <p className="ms-eyebrow" style={{ marginBottom: '1rem' }}>21 天 后 · RETURN</p>
          <div style={{
            display: 'flex', justifyContent: 'space-around', alignItems: 'center',
            gap: '1rem', flexWrap: 'wrap',
          }}>
            <div>
              <div style={{
                color: 'rgba(232,217,176,0.4)', fontSize: '0.7rem',
                letterSpacing: '0.2em', marginBottom: '0.4rem',
              }}>题写于</div>
              <div style={{
                fontFamily: 'Cormorant Garamond, serif',
                color: '#e8d9b0', fontSize: '1.3rem',
              }}>{fmt(today)}</div>
            </div>
            <div style={{ color: '#d4a85a', fontSize: '1.5rem' }}>—</div>
            <div>
              <div style={{
                color: 'rgba(232,217,176,0.4)', fontSize: '0.7rem',
                letterSpacing: '0.2em', marginBottom: '0.4rem',
              }}>建议回访</div>
              <div style={{
                fontFamily: 'Cormorant Garamond, serif',
                color: '#d4a85a', fontSize: '1.3rem',
              }}>{fmt(target)}</div>
            </div>
          </div>
          <p style={{
            color: 'rgba(232,217,176,0.5)', fontSize: '0.8rem',
            letterSpacing: '0.1em', marginTop: '1.5rem', fontStyle: 'italic',
          }}>重读这本书，看自己是不是又往前走了一寸。</p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="ms-btn" onClick={() => onJump('cover')}>重 题 一 卷</button>
          <button className="ms-btn ms-btn-cinnabar" onClick={onReset}>清 除 这 卷</button>
        </div>

        <p style={{
          color: 'rgba(232,217,176,0.25)', fontSize: '0.7rem',
          letterSpacing: '0.3em', marginTop: '4rem',
        }}>MINGSHU · A BOOK OF YOU · 命 书</p>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════
const PAGES = [
  { id: 'cover', label: '卷 首' },
  { id: 'bazi',  label: '卷 一 · 八字' },
  { id: 'astro', label: '卷 二 · 星图' },
  { id: 'num',   label: '卷 三 · 数理' },
  { id: 'seal',  label: '卷 五 · 印鉴' },
  { id: 'final', label: '卷 尾' },
];

export default function App() {
  const [profile, setProfile] = useState(null);
  const [activePage, setActivePage] = useState('cover');
  const [coverDone, setCoverDone] = useState(false);

  // 不读 localStorage —— 每次打开都从头开始，保护隐私
  // 旧版本可能写过的数据，这里一次性清掉
  useEffect(() => {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    try { localStorage.removeItem('mingshu-profile'); } catch (e) {}
  }, []);

  const computed = useMemo(() => {
    if (!profile) return null;
    try {
      const bazi = calculateBazi({
        year: profile.year, month: profile.month, day: profile.day,
        hour: profile.hour, minute: profile.minute,
        gender: profile.gender, longitude: profile.city.lng,
      });
      const astro = calculateAstrology({
        year: profile.year, month: profile.month, day: profile.day,
        hour: profile.hour, minute: profile.minute,
        longitude: profile.city.lng, latitude: profile.city.lat,
      });
      const numerology = calculateNumerology({
        year: profile.year, month: profile.month, day: profile.day,
        name: profile.enName,
      });
      return { bazi, astro, numerology };
    } catch (e) {
      console.error('Calculation error:', e);
      return null;
    }
  }, [profile]);

  const stars = useMemo(() => Array.from({ length: 40 }, (_, i) => ({
    left: `${(i * 73) % 100}%`,
    top: `${(i * 37) % 100}%`,
    delay: `${(i * 0.3) % 4}s`,
  })), []);

  const handleReset = () => {
    if (confirm('清除你的命书？所有数据立刻消失。')) {
      setProfile(null);
      setCoverDone(false);
      setActivePage('cover');
      try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    }
  };

  const handleJump = (id) => {
    if (id === 'cover' && profile) setCoverDone(false);
    setActivePage(id);
  };

  const handleBegin = () => {
    setCoverDone(true);
    setActivePage('bazi');
  };

  useEffect(() => {
    if (!coverDone) return;
    const onKey = (e) => {
      if (['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) return;
      const idx = PAGES.findIndex(p => p.id === activePage);
      if (e.key === 'ArrowRight' && idx < PAGES.length - 1) handleJump(PAGES[idx+1].id);
      if (e.key === 'ArrowLeft' && idx > 0) handleJump(PAGES[idx-1].id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activePage, coverDone]);

  const renderPage = () => {
    if (!coverDone) return <CoverPage profile={profile} setProfile={setProfile} onBegin={handleBegin} />;
    if (!computed) {
      return (
        <div style={{
          minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
          color:'#d4a85a', fontFamily:'Cinzel', letterSpacing:'0.3em',
        }}>正在排盘…</div>
      );
    }
    switch (activePage) {
      case 'cover': return <CoverPage profile={profile} setProfile={setProfile} onBegin={handleBegin} />;
      case 'bazi':  return <BaziPage bazi={computed.bazi} />;
      case 'astro': return <AstroPage astro={computed.astro} />;
      case 'num':   return <NumberPage numerology={computed.numerology} profile={profile} />;
      case 'seal':  return <SealPage profile={profile} bazi={computed.bazi} astro={computed.astro} numerology={computed.numerology} />;
      case 'final': return <FinalePage profile={profile} onReset={handleReset} onJump={handleJump} />;
      default:      return <BaziPage bazi={computed.bazi} />;
    }
  };

  return (
    <div className="ms-app">
      <GlobalStyles />
      {stars.map((s, i) => (
        <span key={i} className="ms-star" style={{ left: s.left, top: s.top, animationDelay: s.delay }} />
      ))}
      {coverDone && (
        <nav className="ms-nav">
          {PAGES.map(p => (
            <div key={p.id}
                 className={`ms-nav-item ${activePage === p.id ? 'active' : ''}`}
                 onClick={() => handleJump(p.id)}>
              {p.label}
            </div>
          ))}
        </nav>
      )}
      <div key={activePage}>{renderPage()}</div>
    </div>
  );
}
