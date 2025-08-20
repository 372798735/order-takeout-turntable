import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
  },
  {
    path: '/manage',
    name: 'Management',
    component: () => import('@/views/Management.vue'),
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

router.beforeEach((to) => {
  const publicPages = new Set(['/login', '/register']);
  const auth = useAuthStore();
  if (!auth.accessToken) {
    auth.loadFromStorage();
  }
  // 已登录用户不应访问登录/注册页
  if (publicPages.has(to.path)) {
    if (auth.accessToken) {
      const redirect = (to.query.redirect as string) || '/';
      return { path: redirect };
    }
    return true;
  }
  if (!auth.accessToken) {
    return { path: '/login', query: { redirect: to.fullPath } };
  }
  return true;
});

export default router; 