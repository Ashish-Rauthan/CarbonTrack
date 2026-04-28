// src/navigation/AppNavigator.js
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { StyleSheet, Text, View } from "react-native";

import { useAuth } from "../context/AuthContext";

import CloudScreen from "../screens/CloudScreen";
import DashboardScreen from "../screens/DashboardScreen";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import ReportsScreen from "../screens/ReportsScreen";
import TrackerScreen from "../screens/TrackerScreen";

import { LoadingOverlay } from "../components/UI";
import { Colors, Shadow } from "../utils/theme";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// ── Tab icons (emoji — no native vector dep needed for Expo Go) ───────────────
const TAB_ICONS = {
  Dashboard: { active: "🌍", inactive: "🌐" },
  Tracker: { active: "📊", inactive: "📈" },
  Cloud: { active: "☁️", inactive: "🌥️" },
  Reports: { active: "📋", inactive: "📄" },
};

function TabIcon({ name, focused }) {
  const icon = TAB_ICONS[name];
  return (
    <View style={[styles.tabIconWrap, focused && styles.tabIconWrapActive]}>
      <Text style={styles.tabEmoji}>
        {focused ? icon.active : icon.inactive}
      </Text>
    </View>
  );
}

// ── Authenticated tabs ────────────────────────────────────────────────────────
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => (
          <TabIcon name={route.name} focused={focused} />
        ),
        tabBarLabel: ({ focused }) => (
          <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
            {route.name}
          </Text>
        ),
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabItem,
        tabBarShowLabel: true,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Tracker" component={TrackerScreen} />
      <Tab.Screen name="Cloud" component={CloudScreen} />
      <Tab.Screen name="Reports" component={ReportsScreen} />
    </Tab.Navigator>
  );
}

// ── Auth stack ────────────────────────────────────────────────────────────────
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

// ── Root navigator ────────────────────────────────────────────────────────────
// NOTE: No <NavigationContainer> here — Expo Router provides it automatically.
export default function AppNavigator() {
  const { token, loading } = useAuth();

  if (loading) return <LoadingOverlay message="Starting Carbon Tracker…" />;

  return token ? <MainTabs /> : <AuthStack />;
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "#ffffff",
    borderTopWidth: 0,
    height: 80,
    paddingBottom: 12,
    paddingTop: 8,
    ...Shadow.lg,
  },
  tabItem: {
    gap: 2,
  },
  tabIconWrap: {
    width: 44,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  tabIconWrapActive: {
    backgroundColor: Colors.accentLight,
  },
  tabEmoji: {
    fontSize: 20,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "500",
    color: Colors.textMuted,
    letterSpacing: 0.3,
  },
  tabLabelActive: {
    color: Colors.primary,
    fontWeight: "700",
  },
});
