import { ScrollView, Text, View } from "react-native";

import { Card, Chip, ListItem, ScreenHeader } from "../components/ui";
import type { PilotSnapshot } from "../storage/offlineStore";
import { commonStyles, spacing, typography } from "../theme";

export function MapScreen({ snapshot }: { snapshot: PilotSnapshot | null }) {
  return (
    <ScrollView contentContainerStyle={commonStyles.content}>
      <ScreenHeader
        title="Mapa agricola"
        subtitle="Regiao, sector e comunidades do piloto local."
      />

      <Card>
        <View style={{ gap: spacing.md }}>
          <Chip label="GPS fica para depois" tone="community" />
          <Text style={typography.body}>
            Esta versao lista regioes e comunidades. Ainda nao mostra
            coordenadas exactas nem mapa preciso.
          </Text>
        </View>
      </Card>

      {snapshot ? (
        <Card>
          <View style={{ gap: spacing.md }}>
            <Text style={typography.sectionTitle}>
              {snapshot.region.regionName}, sector {snapshot.region.sectorName}
            </Text>
            <Text style={typography.secondary}>
              Fonte: dados locais do piloto, com areas estimadas por grupo.
            </Text>
            {snapshot.communities.map((community) => (
              <ListItem
                key={community.id}
                meta={`${community.areaHectares} ha estimados, parcela ${community.parcelSizeHectares} ha`}
                right={<Chip label={community.sourceStatus} />}
                title={community.name}
              />
            ))}
          </View>
        </Card>
      ) : (
        <Text style={typography.body}>A carregar dados locais.</Text>
      )}
    </ScrollView>
  );
}
