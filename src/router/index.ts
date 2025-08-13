import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
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

export default router; 