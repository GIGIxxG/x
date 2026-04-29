import { VStack, Text, Widget, EnvironmentValuesReader, ScrollView, List, Section, Spacer } from 'scripting'
import { RandomQuoteWidget } from './widget'

// 预览不同尺寸的小组件
function WidgetPreview() {
  return (
    <ScrollView>
      <VStack spacing={20} padding={20}>
        <Text font="largeTitle" bold>随机名言小组件</Text>
        <Text font="body" foregroundStyle="secondary">
          这个小组件每小时会显示不同的励志名言，包含随机图标和颜色主题。
        </Text>
        
        <Section header={<Text font="headline">小组件预览</Text>}>
          {/* 小尺寸预览 */}
          <Text font="subheadline" bold>小尺寸 (2x2)</Text>
          <Widget.preview
            family="systemSmall"
            render={() => <RandomQuoteWidget />}
          />
          
          <Spacer />
          
          {/* 中尺寸预览 */}
          <Text font="subheadline" bold>中尺寸 (4x2)</Text>
          <Widget.preview
            family="systemMedium"
            render={() => <RandomQuoteWidget />}
          />
          
          <Spacer />
          
          {/* 大尺寸预览 */}
          <Text font="subheadline" bold>大尺寸 (4x4)</Text>
          <Widget.preview
            family="systemLarge"
            render={() => <RandomQuoteWidget />}
          />
        </Section>
        
        <Section header={<Text font="headline">功能特性</Text>}>
          <Text font="body">• 15 条精选励志名言</Text>
          <Text font="body">• 10 种随机图标</Text>
          <Text font="body">• 8 种配色方案（支持深色模式）</Text>
          <Text font="body">• 每小时自动更新内容</Text>
          <Text font="body">• 响应式布局，适配各种尺寸</Text>
        </Section>
      </VStack>
    </ScrollView>
  )
}

// 根据环境渲染预览界面
if (Script.env === "index") {
  WidgetPreview()
}