import { useEffect, useState } from "react";
import { BackHandler, SafeAreaView, StatusBar, View } from "react-native";

import { BottomTabs, type TabId } from "./navigation/tabs";
import { DoctorScreen } from "./screens/DoctorScreen";
import { ForumScreen } from "./screens/ForumScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { MapScreen } from "./screens/MapScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { offlineStore, type PilotSnapshot } from "./storage/offlineStore";
import { colors, commonStyles } from "./theme";

export type RouteName =
  "root" | "region" | "crop" | "calendar" | "sample" | "forum-topic";

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

function makeRoot(tab: TabId): AppRoute {
  return { name: "root", tab };
}

function ActiveScreen({
  current,
  snapshot,
  navigate,
  goBack,
  canGoBack,
  openTab,
}: {
  current: AppRoute;
  snapshot: PilotSnapshot | null;
  navigate: Navigate;
  goBack: () => void;
  canGoBack: boolean;
  openTab: (tabId: TabId) => void;
}) {
  const sharedProps = {
    canGoBack,
    navigate,
    onBack: goBack,
    snapshot,
  };

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

  return <HomeScreen {...sharedProps} onOpenTab={openTab} />;
}

export default function App() {
  const [stack, setStack] = useState<AppRoute[]>([makeRoot("home")]);
  const [snapshot, setSnapshot] = useState<PilotSnapshot | null>(null);
  const current = stack[stack.length - 1] ?? makeRoot("home");

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
        if (stack.length > 1) {
          setStack((previousStack) => previousStack.slice(0, -1));
          return true;
        }

        if (current.tab !== "home") {
          setStack([makeRoot("home")]);
          return true;
        }

        return false;
      },
    );

    return () => subscription.remove();
  }, [current.tab, stack.length]);

  function openTab(tabId: TabId) {
    setStack([makeRoot(tabId)]);
  }

  function navigate(
    name: RouteName,
    params?: Record<string, string>,
    tabOverride?: TabId,
  ) {
    setStack((previousStack) => [
      ...previousStack,
      {
        name,
        params,
        tab: tabOverride ?? current.tab,
      },
    ]);
  }

  function goBack() {
    setStack((previousStack) => {
      if (previousStack.length > 1) {
        return previousStack.slice(0, -1);
      }

      if ((previousStack[0]?.tab ?? "home") !== "home") {
        return [makeRoot("home")];
      }

      return previousStack;
    });
  }

  return (
    <SafeAreaView style={commonStyles.screen}>
      <StatusBar backgroundColor={colors.background} barStyle="dark-content" />
      <View style={{ flex: 1 }}>
        <ActiveScreen
          canGoBack={stack.length > 1 || current.tab !== "home"}
          current={current}
          goBack={goBack}
          navigate={navigate}
          openTab={openTab}
          snapshot={snapshot}
        />
        <BottomTabs activeTab={current.tab} onChange={openTab} />
      </View>
    </SafeAreaView>
  );
}
