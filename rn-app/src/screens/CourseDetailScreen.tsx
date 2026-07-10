import {
  ActivityIndicator,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { useCourseDetail } from "../hooks/useCourseDetail";
import type { Topic } from "../types";
import type { RootStackParamList } from "../navigation";

type SectionData = { chapterId: string; topic: Topic };

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList, "CourseDetail">;
  route: RouteProp<RootStackParamList, "CourseDetail">;
}

export default function CourseDetailScreen({ navigation, route }: Props) {
  const { courseId } = route.params;
  const { course, loading, error, completedTopics, enroll, enrolling, enrollMessage } =
    useCourseDetail(courseId);

  if (loading) {
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
      </View>
    );
  }
  if (!course) return null;

  const sections = course.chapters
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((chapter) => ({
      title: chapter.title,
      chapterId: chapter.id,
      data: chapter.topics
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((topic): SectionData => ({ chapterId: chapter.id, topic })),
    }));

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.topic.id}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View style={styles.header}>
          {!!course.description && (
            <Text style={styles.description}>{course.description}</Text>
          )}
          <View style={styles.enrollRow}>
            <Pressable
              style={[styles.enrollBtn, enrolling && styles.btnDisabled]}
              onPress={enroll}
              disabled={enrolling}
            >
              <Text style={styles.enrollText}>
                {enrolling ? "Einschreiben…" : "Einschreiben"}
              </Text>
            </Pressable>
            {!!enrollMessage && (
              <Text style={styles.enrollMsg}>{enrollMessage}</Text>
            )}
          </View>
        </View>
      }
      renderSectionHeader={({ section }) => (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
        </View>
      )}
      renderItem={({ item }) => {
        const done = completedTopics.has(item.topic.id);
        return (
          <Pressable
            style={({ pressed }) => [styles.topicRow, pressed && styles.topicPressed]}
            onPress={() =>
              navigation.navigate("Topic", {
                courseId,
                topicId: item.topic.id,
                topicTitle: item.topic.title,
              })
            }
          >
            <View style={styles.topicLeft}>
              <Text style={styles.topicTitle}>{item.topic.title}</Text>
              <Text style={styles.topicMeta}>
                {item.topic.examples.length} Beispiel(e) · {item.topic.questions.length} Frage(n)
              </Text>
            </View>
            {done && <Text style={styles.checkmark}>✓</Text>}
          </Pressable>
        );
      }}
      stickySectionHeadersEnabled={false}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    color: "#dc2626",
    fontSize: 15,
    textAlign: "center",
  },
  header: {
    marginBottom: 16,
  },
  description: {
    fontSize: 15,
    color: "#6b7280",
    marginBottom: 12,
  },
  enrollRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  enrollBtn: {
    backgroundColor: "#4f46e5",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  enrollText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  enrollMsg: {
    fontSize: 13,
    color: "#6b7280",
  },
  sectionHeader: {
    backgroundColor: "#f9fafb",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderLeftWidth: 3,
    borderLeftColor: "#6366f1",
    marginBottom: 4,
    marginTop: 12,
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  topicRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 14,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  topicPressed: {
    opacity: 0.75,
  },
  topicLeft: {
    flex: 1,
  },
  topicTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#111827",
  },
  topicMeta: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 2,
  },
  checkmark: {
    fontSize: 18,
    color: "#10b981",
    marginLeft: 8,
  },
});
