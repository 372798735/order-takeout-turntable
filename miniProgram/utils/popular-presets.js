// 热门转盘预设（仅模板，收藏后写入「我的转盘」并生成新 id）
const COLORS = [
  '#EADDFF',
  '#FFD8E4',
  '#D0BCFF',
  '#BDE0FE',
  '#F9DEC9',
  '#FCE1A8',
  '#C8E6C9',
  '#FFCDD2',
];

function withColors(items) {
  return items.map((item, i) => ({
    name: item.name,
    description: item.description || '',
    color: COLORS[i % COLORS.length],
  }));
}

const POPULAR_PRESETS = [
  {
    presetKey: 'breakfast',
    name: '吃什么早餐',
    items: withColors([
      { name: '包子豆浆', description: '经典中式' },
      { name: '三明治', description: '快手西式' },
      { name: '燕麦牛奶', description: '清淡饱腹' },
      { name: '煎饼果子', description: '街边风味' },
      { name: '粥配小菜', description: '暖胃' },
      { name: '面包咖啡', description: '简约早餐' },
      { name: '米粉面条', description: '嗦一碗' },
      { name: '今天跳过', description: '不饿就不吃' },
    ]),
  },
  {
    presetKey: 'truth_dare',
    name: '真心话大冒险',
    items: withColors([
      { name: '真心话', description: '诚实回答一题' },
      { name: '大冒险', description: '完成一个小挑战' },
      { name: '真心话', description: '分享一个小秘密' },
      { name: '大冒险', description: '模仿一种动物' },
      { name: '真心话', description: '最近一次哭是因为' },
      { name: '大冒险', description: '唱一句歌词' },
      { name: '再来一轮', description: '抽签重来' },
      { name: '全员豁免', description: '本轮跳过' },
    ]),
  },
  {
    presetKey: 'travel',
    name: '去哪里旅行',
    items: withColors([
      { name: '海边度假', description: '吹海风看日落' },
      { name: '山里徒步', description: '森林氧吧' },
      { name: '古镇漫步', description: '慢节奏闲逛' },
      { name: '城市打卡', description: '博物馆美术馆' },
      { name: '自驾周边', description: '说走就走' },
      { name: '草原湖泊', description: '开阔风景' },
      { name: '邻国短途', description: '周末出境' },
      { name: '宅家休息', description: '充电也很重要' },
    ]),
  },
  {
    presetKey: 'honor_heroes',
    name: '王者玩啥英雄',
    items: withColors([
      { name: '李白', description: '刺客秀操作' },
      { name: '貂蝉', description: '法刺团战' },
      { name: '瑶', description: '跟野辅一把' },
      { name: '后羿', description: '射手站桩' },
      { name: '铠', description: '边路砍王' },
      { name: '澜', description: '打野收割' },
      { name: '孙策', description: '开团开船' },
      { name: '安琪拉', description: '草丛蹲人' },
    ]),
  },
  {
    presetKey: 'coding_lang',
    name: '今天学啥语言',
    items: withColors([
      { name: 'Python', description: '入门与脚本' },
      { name: 'JS', description: 'JavaScript 前端' },
      { name: 'TS', description: 'TypeScript 类型' },
      { name: 'Go', description: '并发与后端' },
      { name: 'Rust', description: '系统与安全' },
      { name: 'Java', description: '企业级常用' },
      { name: 'C++', description: '性能与底层' },
      { name: 'Swift', description: '苹果生态' },
    ]),
  },
  {
    presetKey: 'who_pays',
    name: '谁买单',
    items: withColors([
      { name: '头发最长', description: '比一比发量' },
      { name: '个子最高', description: '海拔担当' },
      { name: '年龄最小', description: '尊老爱幼反向' },
      { name: '生日最近', description: '快过生日那位' },
      { name: '鞋码最大', description: '脚码最大' },
      { name: '指甲最长', description: '没剪的那位' },
      { name: '眼镜最厚', description: '镜片圈数多' },
      { name: '最先到场', description: '到得最早' },
    ]),
  },
];

module.exports = {
  POPULAR_PRESETS,
};
