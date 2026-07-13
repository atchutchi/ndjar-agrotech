import type { TabId } from "./tabs";

export type RouteName =
  | "root"
  | "region"
  | "crop"
  | "calendar"
  | "sample"
  | "subscription"
  | "about"
  | "contact"
  | "forum-topic";

export interface AppRoute {
  tab: TabId;
  name: RouteName;
  params?: Record<string, string>;
}

export type Navigate = (
  name: RouteName,
  params?: Record<string, string>,
  tabOverride?: TabId,
) => void;

const premiumTabs = new Set<TabId>(["map", "doctor", "forum"]);
const premiumRoutes = new Set<RouteName>(["crop", "sample", "forum-topic"]);

export function makeRoot(tab: TabId): AppRoute {
  return { name: "root", tab };
}

function shouldGateRoute(route: AppRoute, hasDemoAccess: boolean) {
  if (hasDemoAccess) {
    return false;
  }

  return (
    premiumRoutes.has(route.name) ||
    (route.name === "root" && premiumTabs.has(route.tab))
  );
}

function paywallRoute(target: AppRoute): AppRoute {
  return {
    name: "subscription",
    params: { targetName: target.name, targetTab: target.tab },
    tab: "home",
  };
}

export function openTabStack(
  stack: AppRoute[],
  tab: TabId,
  hasDemoAccess: boolean,
): AppRoute[] {
  const nextRoute = makeRoot(tab);

  if (shouldGateRoute(nextRoute, hasDemoAccess)) {
    return [...stack, paywallRoute(nextRoute)];
  }

  return [nextRoute];
}

export function pushRouteStack(
  stack: AppRoute[],
  route: AppRoute,
  hasDemoAccess: boolean,
): AppRoute[] {
  return [
    ...stack,
    shouldGateRoute(route, hasDemoAccess) ? paywallRoute(route) : route,
  ];
}

export function backStack(stack: AppRoute[]): AppRoute[] | null {
  if (stack.length > 1) {
    return stack.slice(0, -1);
  }

  if ((stack[0]?.tab ?? "home") !== "home") {
    return [makeRoot("home")];
  }

  return null;
}
