import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { configureApi } from "./src/api";
import { isAuthenticated, loadAuth } from "./src/auth";
import LoginScreen from "./src/screens/LoginScreen";
import CoursesScreen from "./src/screens/CoursesScreen";
import CourseDetailScreen from "./src/screens/CourseDetailScreen";
import TopicScreen from "./src/screens/TopicScreen";
import type { RootStackParamList } from "./src/navigation";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    async function init() {
      await loadAuth();
      setAuthenticated(isAuthenticated());
      configureApi({ onUnauthorized: () => setAuthenticated(false) });
      setReady(true);
    }
    init();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: "#4f46e5" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "700" },
        }}
      >
        {!authenticated ? (
          <Stack.Screen
            name="Login"
            options={{ title: "DevEdu", headerShown: false }}
          >
            {() => <LoginScreen onLogin={() => setAuthenticated(true)} />}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen
              name="Courses"
              component={CoursesScreen}
              options={{ title: "Kurse" }}
            />
            <Stack.Screen
              name="CourseDetail"
              component={CourseDetailScreen}
              options={({ route }) => ({ title: route.params.courseTitle })}
            />
            <Stack.Screen
              name="Topic"
              component={TopicScreen}
              options={({ route }) => ({ title: route.params.topicTitle })}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
