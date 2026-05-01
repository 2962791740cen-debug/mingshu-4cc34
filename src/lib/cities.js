// ──────────────────────────────────────────────────────────────────────────
// 中国主要城市经纬度（用于真太阳时校正 + 占星）
// ──────────────────────────────────────────────────────────────────────────
export const CITIES = [
  // 直辖市 + 主要省会
  { name: '北京',     pinyin: 'beijing',     lng: 116.41, lat: 39.90 },
  { name: '上海',     pinyin: 'shanghai',    lng: 121.47, lat: 31.23 },
  { name: '广州',     pinyin: 'guangzhou',   lng: 113.26, lat: 23.13 },
  { name: '深圳',     pinyin: 'shenzhen',    lng: 114.06, lat: 22.55 },
  { name: '天津',     pinyin: 'tianjin',     lng: 117.20, lat: 39.13 },
  { name: '重庆',     pinyin: 'chongqing',   lng: 106.55, lat: 29.56 },
  { name: '杭州',     pinyin: 'hangzhou',    lng: 120.16, lat: 30.27 },
  { name: '南京',     pinyin: 'nanjing',     lng: 118.78, lat: 32.06 },
  { name: '苏州',     pinyin: 'suzhou',      lng: 120.62, lat: 31.32 },
  { name: '成都',     pinyin: 'chengdu',     lng: 104.07, lat: 30.67 },
  { name: '武汉',     pinyin: 'wuhan',       lng: 114.31, lat: 30.59 },
  { name: '西安',     pinyin: 'xian',        lng: 108.94, lat: 34.34 },
  { name: '郑州',     pinyin: 'zhengzhou',   lng: 113.62, lat: 34.75 },
  { name: '长沙',     pinyin: 'changsha',    lng: 112.94, lat: 28.23 },
  { name: '青岛',     pinyin: 'qingdao',     lng: 120.38, lat: 36.07 },
  { name: '济南',     pinyin: 'jinan',       lng: 117.00, lat: 36.65 },
  { name: '沈阳',     pinyin: 'shenyang',    lng: 123.43, lat: 41.81 },
  { name: '大连',     pinyin: 'dalian',      lng: 121.62, lat: 38.91 },
  { name: '哈尔滨',   pinyin: 'haerbin',     lng: 126.65, lat: 45.75 },
  { name: '长春',     pinyin: 'changchun',   lng: 125.32, lat: 43.82 },
  { name: '昆明',     pinyin: 'kunming',     lng: 102.71, lat: 25.05 },
  { name: '南宁',     pinyin: 'nanning',     lng: 108.32, lat: 22.82 },
  { name: '福州',     pinyin: 'fuzhou',      lng: 119.30, lat: 26.08 },
  { name: '厦门',     pinyin: 'xiamen',      lng: 118.09, lat: 24.48 },
  { name: '南昌',     pinyin: 'nanchang',    lng: 115.89, lat: 28.68 },
  { name: '合肥',     pinyin: 'hefei',       lng: 117.27, lat: 31.86 },
  { name: '太原',     pinyin: 'taiyuan',     lng: 112.55, lat: 37.87 },
  { name: '石家庄',   pinyin: 'shijiazhuang',lng: 114.51, lat: 38.04 },
  { name: '兰州',     pinyin: 'lanzhou',     lng: 103.83, lat: 36.06 },
  { name: '银川',     pinyin: 'yinchuan',    lng: 106.27, lat: 38.47 },
  { name: '西宁',     pinyin: 'xining',      lng: 101.78, lat: 36.62 },
  { name: '乌鲁木齐', pinyin: 'wulumuqi',    lng: 87.62,  lat: 43.83 },
  { name: '拉萨',     pinyin: 'lasa',        lng: 91.11,  lat: 29.65 },
  { name: '海口',     pinyin: 'haikou',      lng: 110.33, lat: 20.04 },
  { name: '三亚',     pinyin: 'sanya',       lng: 109.51, lat: 18.25 },
  { name: '贵阳',     pinyin: 'guiyang',     lng: 106.71, lat: 26.58 },
  { name: '呼和浩特', pinyin: 'huhehaote',   lng: 111.75, lat: 40.84 },
  { name: '香港',     pinyin: 'xianggang',   lng: 114.17, lat: 22.32 },
  { name: '澳门',     pinyin: 'aomen',       lng: 113.55, lat: 22.20 },
  { name: '台北',     pinyin: 'taibei',      lng: 121.56, lat: 25.04 },
  // 一些常见地级市
  { name: '惠州',     pinyin: 'huizhou',     lng: 114.42, lat: 23.11 },
  { name: '东莞',     pinyin: 'dongguan',    lng: 113.75, lat: 23.04 },
  { name: '佛山',     pinyin: 'foshan',      lng: 113.12, lat: 23.02 },
  { name: '珠海',     pinyin: 'zhuhai',      lng: 113.58, lat: 22.27 },
  { name: '中山',     pinyin: 'zhongshan',   lng: 113.39, lat: 22.52 },
  { name: '汕头',     pinyin: 'shantou',     lng: 116.71, lat: 23.35 },
  { name: '宁波',     pinyin: 'ningbo',      lng: 121.55, lat: 29.87 },
  { name: '温州',     pinyin: 'wenzhou',     lng: 120.65, lat: 28.00 },
  { name: '无锡',     pinyin: 'wuxi',        lng: 120.30, lat: 31.57 },
  { name: '常州',     pinyin: 'changzhou',   lng: 119.97, lat: 31.78 },
  { name: '徐州',     pinyin: 'xuzhou',      lng: 117.18, lat: 34.27 },
  { name: '烟台',     pinyin: 'yantai',      lng: 121.45, lat: 37.46 },
  { name: '潍坊',     pinyin: 'weifang',     lng: 119.16, lat: 36.71 },
  { name: '洛阳',     pinyin: 'luoyang',     lng: 112.45, lat: 34.62 },
  { name: '泉州',     pinyin: 'quanzhou',    lng: 118.59, lat: 24.91 },
];

export function searchCity(query) {
  if (!query) return [];
  const q = query.trim().toLowerCase();
  return CITIES.filter(c =>
    c.name.includes(query) || c.pinyin.includes(q)
  ).slice(0, 8);
}

export function findCity(query) {
  const results = searchCity(query);
  return results[0] || null;
}
