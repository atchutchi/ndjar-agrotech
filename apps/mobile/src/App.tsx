import { useEffect, useState } from "react";
import {
  BackHandler,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";

import { getAppInsets } from "./layout/appInsets";
import { BottomTabs, type TabId } from "./navigation/tabs";
import {
  backStack,
  makeRoot,
  openTabStack,
  pushRouteStack,
  type AppRoute,
  type Navigate,
  type RouteName,
} from "./navigation/routes";
import { DoctorScreen } from "./screens/DoctorScreen";
import { ForumScreen } from "./screens/ForumScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { MapScreen } from "./screens/MapScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { offlineStore, type PilotSnapshot } from "./storage/offlineStore";
import { colors, commonStyles } from "./theme";

export type { AppRoute, Navigate, RouteName } from "./navigation/routes";

function ActiveScreen({
  current,
  snapshot,
  navigate,
  goBack,
  canGoBack,
  openTab,
  hasDemoAccess,
  enableDemoAccess,
}: {
  current: AppRoute;
  snapshot: PilotSnapshot | null;
  navigate: Navigate;
  goBack: () => void;
  canGoBack: boolean;
  openTab: (tabId: TabId) => void;
  hasDemoAccess: boolean;
  enableDemoAccess: () => void;
}) {
  const sharedProps = {
    canGoBack,
    navigate,
    onBack: goBack,
    snapshot,
  };

  if (current.name === "calendar") {
    return <MapScreen {...sharedProps} route={current} />;
  }

  if (current.tab === "map") {
    return <MapScreen {...sharedProps} route={current} />;
  }

  if (current.tab === "doctor") {
    return <DoctorScreen {...sharedProps} />;
  }

  if (current.tab === "forum") {
    return <ForumScreen {...sharedProps} route={current} />;
  }

  if (current.tab === "profile") {
    return <ProfileScreen {...sharedProps} />;
  }

  return (
    <HomeScreen
      {...sharedProps}
      enableDemoAccess={enableDemoAccess}
      hasDemoAccess={hasDemoAccess}
      onOpenTab={openTab}
      route={current}
    />
  );
}

export default function App() {
  const [stack, setStack] = useState<AppRoute[]>([makeRoot("home")]);
  const [snapshot, setSnapshot] = useState<PilotSnapshot | null>(null);
  const [hasDemoAccess, setHasDemoAccess] = useState(false);
  const current = stack[stack.length - 1] ?? makeRoot("home");
  const insets = getAppInsets({
    platform: Platform.OS,
    statusBarHeight: StatusBar.currentHeight ?? 0,
  });

  useEffect(() => {
    let isMounted = true;

    offlineStore.loadSnapshot().then((nextSnapshot) => {
      if (isMounted) {
        setSnapshot(nextSnapshot);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        const nextStack = backStack(stack);
        if (nextStack) {
          setStack(nextStack);
          return true;
        }

        return false;
      },
    );

    return () => subscription.remove();
  }, [stack]);

  function openTab(tabId: TabId) {
    setStack((previousStack) =>
      openTabStack(previousStack, tabId, hasDemoAccess),
    );
  }

  function navigate(
    name: RouteName,
    params?: Record<string, string>,
    tabOverride?: TabId,
  ) {
    const nextRoute = {
      name,
      params,
      tab: tabOverride ?? current.tab,
    };

    setStack((previousStack) =>
      pushRouteStack(previousStack, nextRoute, hasDemoAccess),
    );
  }

  function enableDemoAccess() {
    setHasDemoAccess(true);
    setStack([makeRoot("home")]);
  }

  function goBack() {
    setStack((previousStack) => backStack(previousStack) ?? previousStack);
  }

  return (
    <SafeAreaView style={commonStyles.screen}>
      <StatusBar
        backgroundColor={colors.background}
        barStyle="dark-content"
        translucent={false}
      />
      <View
        style={[
          styles.appFrame,
          { paddingBottom: insets.bottom, paddingTop: insets.top },
        ]}
      >
        <View style={styles.screenFrame}>
          <ActiveScreen
            enableDemoAccess={enableDemoAccess}
            canGoBack={stack.length > 1 || current.tab !== "home"}
            current={current}
            goBack={goBack}
            hasDemoAccess={hasDemoAccess}
            navigate={navigate}
            openTab={openTab}
            snapshot={snapshot}
          />
        </View>
        <BottomTabs activeTab={current.tab} onChange={openTab} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  appFrame: {
    flex: 1,
  },
  screenFrame: {
    flex: 1,
    minHeight: 0,
  },
});
