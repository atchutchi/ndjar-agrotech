import { useEffect, useState } from "react";
import { SafeAreaView, StatusBar, View } from "react-native";

import { BottomTabs, type TabId } from "./navigation/tabs";
import { DoctorScreen } from "./screens/DoctorScreen";
import { ForumScreen } from "./screens/ForumScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { MapScreen } from "./screens/MapScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { offlineStore, type PilotSnapshot } from "./storage/offlineStore";
import { colors, commonStyles } from "./theme";

function ActiveScreen({
  activeTab,
  snapshot,
}: {
  activeTab: TabId;
  snapshot: PilotSnapshot | null;
}) {
  if (activeTab === "map") {
    return <MapScreen snapshot={snapshot} />;
  }

  if (activeTab === "doctor") {
    return <DoctorScreen snapshot={snapshot} />;
  }

  if (activeTab === "forum") {
    return <ForumScreen snapshot={snapshot} />;
  }

  if (activeTab === "profile") {
    return <ProfileScreen snapshot={snapshot} />;
  }

  return <HomeScreen snapshot={snapshot} onOpenTab={setActiveTabNoop} />;
}

function setActiveTabNoop() {
  return undefined;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [snapshot, setSnapshot] = useState<PilotSnapshot | null>(null);

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

  return (
    <SafeAreaView style={commonStyles.screen}>
      <StatusBar backgroundColor={colors.background} barStyle="dark-content" />
      <View style={{ flex: 1 }}>
        {activeTab === "home" ? (
          <HomeScreen snapshot={snapshot} onOpenTab={setActiveTab} />
        ) : (
          <ActiveScreen activeTab={activeTab} snapshot={snapshot} />
        )}
        <BottomTabs activeTab={activeTab} onChange={setActiveTab} />
      </View>
    </SafeAreaView>
  );
}
