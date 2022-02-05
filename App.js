import React, { useEffect, useState } from 'react';
import GeoFenceForm from './screens/GeoFenceForm';
import { NativeBaseProvider } from "native-base";
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AreaProvider from './context/areaContext';
import FlashMessage from "react-native-flash-message";

const Stack = createNativeStackNavigator();

const App = () => {

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
