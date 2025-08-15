<template>
  <div class="responsive-wrapper" :class="wrapperClass">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  // 响应式断点
  breakpoint?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  // 是否在移动端隐藏
  mobileHidden?: boolean;
  // 是否在桌面端隐藏
  desktopHidden?: boolean;
  // 触摸设备优化
  touchOptimized?: boolean;
  // 响应式间距
  spacing?: boolean;
  // 响应式文本
  text?: boolean;
  // 响应式标题
  title?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  breakpoint: 'md',
  mobileHidden: false,
  desktopHidden: false,
  touchOptimized: false,
  spacing: false,
  text: false,
  title: false,
});

const wrapperClass = computed(() => ({
  [`responsive-${props.breakpoint}`]: true,
  'mobile-hidden': props.mobileHidden,
  'desktop-hidden': props.desktopHidden,
  'touch-optimized': props.touchOptimized,
  'responsive-spacing': props.spacing,
  'responsive-text': props.text,
  'responsive-title': props.title,
}));
</script>

<style scoped>
.responsive-wrapper {
  width: 100%;
}

/* 响应式断点类 */
.responsive-xs {
  max-width: 100%;
}

.responsive-sm {
  max-width: 540px;
}

.responsive-md {
  max-width: 720px;
}

.responsive-lg {
  max-width: 960px;
}

.responsive-xl {
  max-width: 1140px;
}

.responsive-xxl {
  max-width: 1320px;
}

/* 响应式容器居中 */
.responsive-wrapper:not(.responsive-xs) {
  margin: 0 auto;
}

/* 响应式间距 */
.responsive-spacing {
  padding: 16px;
  margin: 16px 0;
}

/* 响应式文本 */
.responsive-text {
  font-size: 14px;
  line-height: 1.5;
}

/* 响应式标题 */
.responsive-title {
  font-size: 20px;
  font-weight: 600;
  line-height: 1.3;
}

/* 触摸设备优化 */
.touch-optimized {
  min-height: 44px;
  min-width: 44px;
}

/* 响应式断点 */
@media (max-width: 576px) {
  .responsive-sm,
  .responsive-md,
  .responsive-lg,
  .responsive-xl,
  .responsive-xxl {
    max-width: 100%;
    margin: 0;
  }

  .responsive-spacing {
    padding: 12px;
    margin: 12px 0;
  }

  .responsive-text {
    font-size: 13px;
  }

  .responsive-title {
    font-size: 18px;
  }
}

@media (max-width: 768px) {
  .responsive-md,
  .responsive-lg,
  .responsive-xl,
  .responsive-xxl {
    max-width: 100%;
    margin: 0;
  }

  .responsive-spacing {
    padding: 14px;
    margin: 14px 0;
  }

  .responsive-text {
    font-size: 14px;
  }

  .responsive-title {
    font-size: 20px;
  }
}

@media (min-width: 769px) {
  .responsive-spacing {
    padding: 20px;
    margin: 20px 0;
  }

  .responsive-text {
    font-size: 16px;
  }

  .responsive-title {
    font-size: 24px;
  }
}

@media (min-width: 1024px) {
  .responsive-spacing {
    padding: 24px;
    margin: 24px 0;
  }

  .responsive-text {
    font-size: 17px;
  }

  .responsive-title {
    font-size: 26px;
  }
}

@media (min-width: 1200px) {
  .responsive-spacing {
    padding: 28px;
    margin: 28px 0;
  }

  .responsive-text {
    font-size: 18px;
  }

  .responsive-title {
    font-size: 28px;
  }
}
</style>
