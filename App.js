import React, { useEffect, useState } from 'react';
import GeoFenceForm from './screens/GeoFenceForm';
import { NativeBaseProvider } from "native-base";
import AreaProvider from './context/areaContext';
import FlashMessage from "react-native-flash-message";
import AsyncStorage from '@react-native-community/async-storage';
import messaging from "@react-native-firebase/messaging";
import PushNotification from "react-native-push-notification";
import { LogBox } from 'react-native';


LogBox.ignoreLogs(['Warning: ...']);
LogBox.ignoreAllLogs();

const App = () => {


  useEffect(() => {
    checkPermission();
    messaging().onMessage(async (remoteMessage) => {
      console.log(remoteMessage);
      PushNotification.localNotification({
        message: remoteMessage.notification.body,
        title: remoteMessage.notification.title,
        bigPictureUrl: remoteMessage.notification.android.imageUrl,
        smallIcon: remoteMessage.notification.android.imageUrl,
      });
    });
  })

  const checkPermission = async () => {
    const enabled = await messaging().hasPermission();
    if (enabled) {
        await getToken();
    } else {
        await requestPermission();
    }
  }
  
    //3
  const getToken = async () => {
    let fcmToken = await AsyncStorage.getItem('fcmToken');
    if (!fcmToken) {
        fcmToken = await messaging().getToken();
        if (fcmToken) {
            await AsyncStorage.setItem('fcmToken', fcmToken);
        }
    }
  }
  
    //2
  const requestPermission = async () => {
    try {
        await messaging().requestPermission();
        // User has authorised
        this.getToken();
    } catch (error) {
        // User has rejected permissions
        console.log('permission rejected');
    }
  }

  return (
    <NativeBaseProvider>
        <AreaProvider>
            <GeoFenceForm />
        </AreaProvider>
      <FlashMessage position="top" />
    </NativeBaseProvider>
  );
};


export default App;
