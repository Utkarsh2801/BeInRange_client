import React, { useEffect, useState } from 'react';
import GeoFenceForm from './screens/GeoFenceForm';
import { NativeBaseProvider } from "native-base";
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AreaProvider from './context/areaContext';
import FlashMessage from "react-native-flash-message";
import Roam from 'roam-reactnative';
import { AsyncStorage } from 'react-native';

const Stack = createNativeStackNavigator();

const App = () => {
  const [userId, setUserId] = useState();

  useEffect(() => {
    Roam.createUser("", async (success) => {
      Roam.enableAccuracyEngine();
      Roam.subscribe(Roam.SubscribeListener.BOTH, success.userId);
      Roam.publishAndSave();
      Roam.allowMockLocation(true);
      Roam.toggleListener(true, true, (success) => {
        Roam.toggleEvents(true, true, true, true, success => {
          Roam.startTrackingDistanceInterval(1, 1000, Roam.DesiredAccuracy.HIGH);
          setUserId(success.userId);
        }, error => {
          console.log(error);
        });
        console.log(success);
      }, error => {
        console.log(error);
      })
      await AsyncStorage.setItem('userId', success.userId);
    },
      error => {
        showMessage({
          message: "Something went wrong",
          description: "User could not be created",
          type: "error",
        })
        RNExitApp.exitApp();
      });
  }, [])

  return (
    <NativeBaseProvider>
      <AreaProvider>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen name="Start" component={GeoFenceForm} />
          </Stack.Navigator>
        </NavigationContainer>
      </AreaProvider>
      <FlashMessage position="top" />
    </NativeBaseProvider>
  );
};


export default App;
