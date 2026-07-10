import { useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCourseList } from "../hooks/useCourseList";
import type { CourseSummary } from "../types";
import type { RootStackParamList } from "../navigation";

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList, "Courses">;
}

export default function CoursesScreen({ navigation }: Props) {
  const { courses, loading, error, reload } = useCourseList();

  const renderItem = useCallback(
    ({ item }: { item: CourseSummary }) => (
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={() => navigation.navigate("CourseDetail", { courseId: item.id, courseTitle: item.title })}
      >
        <Text style={styles.cardTitle}>{item.title}</Text>
        {!!item.description && (
          <Text style={styles.cardDesc} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        <View style={styles.tags}>
          {!!item.level && (
            <View style={styles.tag}>
              <Text style={styles.tagText}>{item.level}</Text>
            </View>
          )}
          <View style={[styles.tag, item.status === "Published" ? styles.tagGreen : styles.tagAmber]}>
            <Text style={styles.tagText}>{item.status}</Text>
          </View>
        </View>
      </Pressable>
    ),
    [navigation],
  );

  if (loading && courses.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retryBtn} onPress={reload}>
          <Text style={styles.retryText}>Erneut versuchen</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      data={courses}
      keyExtractor={(c) => c.id}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} />}
      ListEmptyComponent={
        <Text style={styles.empty}>Keine Kurse vorhanden.</Text>
      }
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.8,
    borderColor: "#6366f1",
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#4f46e5",
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 8,
  },
  tags: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  tag: {
    backgroundColor: "#f3f4f6",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tagGreen: {
    backgroundColor: "#d1fae5",
  },
  tagAmber: {
    backgroundColor: "#fef3c7",
  },
  tagText: {
    fontSize: 12,
    color: "#374151",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  errorText: {
    color: "#dc2626",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 12,
  },
  retryBtn: {
    backgroundColor: "#4f46e5",
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryText: {
    color: "#fff",
    fontWeight: "600",
  },
  empty: {
    textAlign: "center",
    color: "#9ca3af",
    marginTop: 40,
  },
});
