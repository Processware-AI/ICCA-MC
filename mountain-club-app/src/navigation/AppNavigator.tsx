import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/useAuthStore';
import { Colors } from '../constants/colors';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Main Screens
import HomeScreen from '../screens/main/HomeScreen';
import EventListScreen from '../screens/events/EventListScreen';
import EventDetailScreen from '../screens/events/EventDetailScreen';
import EventCreateScreen from '../screens/events/EventCreateScreen';
import NoticeListScreen from '../screens/notices/NoticeListScreen';
import NoticeDetailScreen from '../screens/notices/NoticeDetailScreen';
import NoticeCreateScreen from '../screens/notices/NoticeCreateScreen';
import GalleryScreen from '../screens/gallery/GalleryScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import PaymentScreen from '../screens/payment/PaymentScreen';
import PaymentHistoryScreen from '../screens/payment/PaymentHistoryScreen';
import MemberListScreen from '../screens/members/MemberListScreen';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Main: undefined;
  EventDetail: { eventId: string };
  EventCreate: undefined;
  NoticeDetail: { noticeId: string };
  NoticeCreate: undefined;
  Payment: { type: 'membership' | 'event'; eventId?: string; eventTitle?: string; amount?: number };
  PaymentHistory: undefined;
  MemberList: undefined;
};

export type TabParamList = {
  Home: undefined;
  Events: undefined;
  Notices: undefined;
  Gallery: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Events') iconName = focused ? 'calendar' : 'calendar-outline';
          else if (route.name === 'Notices') iconName = focused ? 'newspaper' : 'newspaper-outline';
          else if (route.name === 'Gallery') iconName = focused ? 'images' : 'images-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: { height: 60, paddingBottom: 8, paddingTop: 4 },
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: Colors.white,
        headerTitleStyle: { fontWeight: 'bold' },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: '홈', headerTitle: '이카산악회' }} />
      <Tab.Screen name="Events" component={EventListScreen} options={{ title: '등산일정', headerTitle: '등산 일정' }} />
      <Tab.Screen name="Notices" component={NoticeListScreen} options={{ title: '공지사항', headerTitle: '공지사항' }} />
      <Tab.Screen name="Gallery" component={GalleryScreen} options={{ title: '갤러리', headerTitle: '사진 갤러리' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: '내 정보', headerTitle: '내 정보' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated } = useAuthStore();

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.white,
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ title: '회원가입' }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
            <Stack.Screen name="EventDetail" component={EventDetailScreen} options={{ title: '등산 상세' }} />
            <Stack.Screen name="EventCreate" component={EventCreateScreen} options={{ title: '등산 일정 등록' }} />
            <Stack.Screen name="NoticeDetail" component={NoticeDetailScreen} options={{ title: '공지사항' }} />
            <Stack.Screen name="NoticeCreate" component={NoticeCreateScreen} options={{ title: '공지사항 작성' }} />
            <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: '결제' }} />
            <Stack.Screen name="PaymentHistory" component={PaymentHistoryScreen} options={{ title: '결제 내역' }} />
            <Stack.Screen name="MemberList" component={MemberListScreen} options={{ title: '회원 목록' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
