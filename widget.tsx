import { VStack, Text, Widget, HStack, Image, Spacer } from 'scripting'

// 随机名言列表
const quotes = [
  { text: "生活不是等待风暴过去，而是学会在雨中跳舞。", author: "维维安·格林" },
  { text: "成功的秘诀在于坚持自己的目标和信念。", author: "本杰明·迪斯雷利" },
  { text: "每一天都是一个新的开始，一个新的机会。", author: "佚名" },
  { text: "不要为失去的而悲伤，要为拥有的而感恩。", author: "佚名" },
  { text: "你今天的努力，是明天的收获。", author: "佚名" },
  { text: "相信自己，你比想象中更强大。", author: "佚名" },
  { text: "困难是人生最好的老师。", author: "佚名" },
  { text: "梦想不会逃跑，逃跑的是自己。", author: "佚名" },
  { text: "成功不是终点，失败也不是致命的。", author: "温斯顿·丘吉尔" },
  { text: "唯一阻碍你的，是你自己的想法。", author: "佚名" },
  { text: "每一个不曾起舞的日子，都是对生命的辜负。", author: "尼采" },
  { text: "生活就像一盒巧克力，你永远不知道下一颗是什么。", author: "阿甘正传" },
  { text: "今天的汗水，是明天的收获。", author: "佚名" },
  { text: "不忘初心，方得始终。", author: "佚名" },
  { text: "星光不问赶路人，时光不负有心人。", author: "佚名" }
]

// 随机图标列表
const icons = [
  "star.fill",
  "heart.fill",
  "sun.max.fill",
  "moon.fill",
  "cloud.fill",
  "bolt.fill",
  "flame.fill",
  "sparkles",
  "lightbulb.fill",
  "leaf.fill"
]

// 获取当前小时的随机种子
function getDailyRandomSeed(): number {
  const now = new Date()
  const hours = now.getHours()
  const minutes = now.getMinutes()
  // 每小时都显示不同的内容
  return hours + minutes
}

// 简单的随机数生成器（基于种子）
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

// 根据种子选择随机元素
function getRandomElement<T>(array: T[], seed: number): T {
  const index = Math.floor(seededRandom(seed) * array.length)
  return array[index]
}

// 随机颜色列表
const colors = [
  { light: "#FF6B6B", dark: "#FFA07A" },
  { light: "#4ECDC4", dark: "#20B2AA" },
  { light: "#45B7D1", dark: "#5F9EA0" },
  { light: "#96CEB4", dark: "#98FB98" },
  { light: "#FFEAA7", dark: "#F0E68C" },
  { light: "#DDA0DD", dark: "#DA70D6" },
  { light: "#FF69B4", dark: "#FF1493" },
  { light: "#87CEEB", dark: "#00BFFF" }
]

// 主小组件组件
function RandomQuoteWidget() {
  const seed = getDailyRandomSeed()
  const quote = getRandomElement(quotes, seed)
  const icon = getRandomElement(icons, seed + 1)
  const color = getRandomElement(colors, seed + 2)
  
  return (
    <VStack 
      spacing={8}
      padding={12}
    >
      <HStack spacing={8}>
        <Image 
          systemName={icon}
          foregroundStyle={{
            light: color.light,
            dark: color.dark
          }}
          frame={{ width: 24, height: 24 }}
        />
        <Text 
          font="headline"
          foregroundStyle={{
            light: color.light,
            dark: color.dark
          }}
        >
          每日一得
        </Text>
        <Spacer />
      </HStack>
      
      <Text 
        font="body"
        lineLimit={4}
        multilineTextAlignment="leading"
      >
        {quote.text}
      </Text>
      
      <HStack>
        <Spacer />
        <Text 
          font="caption2"
          foregroundStyle="secondary"
        >
          — {quote.author}
        </Text>
      </HStack>
    </VStack>
  )
}

// 根据环境渲染小组件
if (Script.env === "widget") {
  Widget.present(<RandomQuoteWidget />)
}