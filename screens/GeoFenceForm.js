import React, { useContext, useEffect, useState } from 'react';
import { Alert, AsyncStorage, Dimensions } from 'react-native';
import Roam from 'roam-reactnative';
import { StyleSheet, View } from 'react-native';
import { Center, Container, Heading, Input, Button, Spinner } from "native-base";
import Geolocation from '@react-native-community/geolocation';
import { areaContext } from '../context/areaContext';
import { showMessage, hideMessage } from "react-native-flash-message";
import RNExitApp from 'react-native-exit-app';

import http from '../http/http';
import apis from '../http/apis';



const GeoFenceForm = () => {
    const { coords, setCoords, radius, setRadius, userId, setUserId } = useContext(areaContext);
 

    useEffect(() => {
        if(userId) {
            initialSetup();
        }
    }, [userId])

    const askForCurrentLocation = (i) => {
        Alert.alert(
            "Use Your Current Location",
            "Allow to use your current location to use the app",
            [
                {
                    text: "Cancel",
                    onPress: () => {
                        Alert.alert(
                            "Please allow the current location",
                            "App will not work without current location",
                            [
                                {
                                    text: "Ok",
                                    onPress: () => {
                                        if (i === 5) {
                                            RNExitApp.exitApp();
                                        }
                                        askForCurrentLocation(i + 1);
                                    },
                                },
                            ],
                        );
                    },
                },
                {
                    text: "Ok",
                    onPress: () => {
                        createInitialGeofence(userId);
                    },
                },
            ],
        );
    }

    // Intial User and Permissions setup, Load Data if already present in storage
    const initialSetup = async () => {
        const access = await askForPermission();
        if (access) {
            let userIda = await AsyncStorage.getItem('userId');
            if (!userIda) {
                askForCurrentLocation(0);
            } else {
                setUserId(userIda);
                startTracking(userIda);
            }
        }
    }

    // Get Current Location To Start Tracking
    const getCurrentLocation = async () => {
        Geolocation.getCurrentPosition(async (info) => {
            let coords = {
                lat: info.coords.latitude,
                lng: info.coords.longitude
            }
            await AsyncStorage.setItem('coords', JSON.stringify(coords));
            setCoords(coords);
        },
            error => console.log(error),
            { enableHighAccuracy: false, timeout: 20000, maximumAge: 10000 },
        );
    }


    let onRadiusChange = async (v) => {
        setRadius(v);
        await AsyncStorage.setItem('radius', radius.toString());
    }


    const createInitialGeofence = (userId) => {
        Geolocation.getCurrentPosition(async (info) => {
            let coords = {
                lat: info.coords.latitude,
                lng: info.coords.longitude
            }
            setCoords(coords);
            try {

                let res = await http.post(`${apis.BASE_SERVER_URL}${apis.CREATE_GEOFENCE}`, {
                    coordinates: [coords.lng, coords.lat],
                    geometry_radius: 500,
                    geometry_type: 'circle',
                    user_ids: [userId],
                    is_enabled: true
                })

                if (!res.status) {
                    throw Error("Something went wrong")
                }

                showMessage({
                    message: "Geofence Created",
                    description: "You'll be notified when you cross the boundary",
                    type: "success",
                })


            } catch (error) {
                console.log('Error in creating geo fence', error);
                showMessage({
                    message: "Something went wrong",
                    description: "Please create the geofence manually",
                    type: "danger",
                })
            }


        }, error => {
            Alert.alert(
                "Something Went Wrong",
                "Location Could not be fetched",
                [
                    {
                        text: "Ok",
                        onPress: () => {
                            RNExitApp.exitApp();
                        },
                        style: "cancel",
                    },
                ],
                {
                    cancelable: true,
                    onDismiss: () => {
                        RNExitApp.exitApp();
                    }
                }
            );
        },
            { enableHighAccuracy: false, timeout: 20000, maximumAge: 10000 },
        );
    }


    return (
        <View style={styles.view}>
            <Center>
                <Container centerContent={true}>
                    <Heading>
                        Select Your Location
                    </Heading>
                    <View style={styles.locationForm}>
                        <Input value={coords.lat ? coords.lat.toString() : ""} style={styles.coordsInput} size="2xl" width={"200"} placeholder="Latitude" isDisabled={true} />
                        <Input value={coords.lng ? coords.lng.toString() : ""} style={styles.coordsInput} size="2xl" width={"200"} placeholder="Longitude" isDisabled={true} />
                        <Button size={"lg"} onPress={getCurrentLocation}>
                            Get Current Location
                        </Button>
                    </View>
                </Container>
            </Center>
        </View>
    );
};


let ScreenHeight = Dimensions.get("window").height;
let ScreenWidth = Dimensions.get("window").width;

const styles = StyleSheet.create({
    view: {
        height: ScreenHeight,
        justifyContent: "center",
        flex: 1,
        backgroundColor: "#ffffff"
    },

    locationForm: {
        marginTop: 20,
        flex: 1,
        // height: 100,
        // justifyContent: "space-between"
    },

    locationButton: {
        height: 200,
        // justifyContent: "flex-end"
    }
});

export default GeoFenceForm;
