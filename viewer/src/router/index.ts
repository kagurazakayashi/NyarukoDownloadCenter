import { createRouter, createWebHashHistory } from "vue-router";

import Home from "@/views/index";

export default createRouter({
  routes: [
    {
      path: "",
      redirect: "/welcome", //"/zh-cn/f/admin/admin/-",
    },
    {
      path: "/:loc/f/:fold",
      name: "fn",
      component: Home.Home,
    },
    {
      path: "/:loc/f/:u/:p/:fold",
      name: "f",
      component: Home.Home,
    },
    {
      path: "/goto",
      name: "goto",
      component: Home.GoTo,
    },
    {
      path: "/welcome",
      name: "w",
      component: Home.Welcome,
    },
    {
      path: "/about",
      name: "about",
      component: Home.About,
    },
    {
      path: "/404",
      name: "404",
      component: Home.Nofind,
    },
    {
      path: "/:catchAll(.*)",
      redirect: "/404",
    },
  ],
  history: createWebHashHistory(),
});
