import React, { useContext, useEffect, useState } from 'react';
import { Alert, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';
import Roam from 'roam-reactnative';
import { StyleSheet, View, Text } from 'react-native';
import { Center, Container, Heading, Input, Button, Spinner, FormControl } from "native-base";
import Geolocation from '@react-native-community/geolocation';
import { areaContext } from '../context/areaContext';
import { showMessage, hideMessage } from "react-native-flash-message";
import RNExitApp from 'react-native-exit-app';
import { PermissionsAndroid } from 'react-native';
import ReactNativeForegroundService from "@supersami/rn-foreground-service";
import http from '../http/http';
import apis from '../http/apis';

// Run app in foreground
const startAppInForeground = () => {
    ReactNativeForegroundService.start({
        id: 144,
        title: 'Your Location Is Live',
        message: "Tap here to view details of geofence!",
    });
}

startAppInForeground();
// Ask User For Location Permissions
const askForPermission = async () => {
    const isGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
    if (!isGranted) {
        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        )
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            return true;
        } else {
            Alert.alert(
                "Location Access Denied",
                "You can not access application without location service",
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
        }
    } else {
        return true;
    }
}

const GeoFenceForm = () => {
    const { coords, setCoords, radius, setRadius, userId, setUserId, setGeofenceId, geofenceId } = useContext(areaContext);
    const [loading, setIsLoading] = useState(true);
    const [fscreen, setFscreen] = useState(false);

    useEffect(() => {
        initialSetup();
    }, [])

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
                        Roam.createUser("", async (success) => {
                            setUserId(success.userId)
                            setIsLoading(false);
                            let fcmToken = await AsyncStorage.getItem('fcmToken');

                            let res = await http.post(`${apis.BASE_SERVER_URL}${apis.CREATE_USER}`, {
                                userId: success.userId,
                                fcmToken: fcmToken
                            })

                            if (res.data.status) {
                                showMessage({
                                    message: "User Created",
                                    description: "You are registered",
                                    type: "success",
                                })
                            }

                            await AsyncStorage.setItem('userId', success.userId);
                        },
                            error => {
                                showMessage({
                                    message: "Something went wrong",
                                    description: "User could not be created",
                                    type: "danger",
                                })
                                RNExitApp.exitApp();
                            });
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
                setIsLoading(false);
                setUserId(userIda);
            }
            setFscreen(true); // Need to be true
        }
    }


    const updateGeofence = async (coords, radius) => {
        setIsLoading(true);
        try {

            let result = await http.put(`${apis.BASE_SERVER_URL}${apis.UPDATE_GEOFENCE}`, {
                coordinates: [coords.lng, coords.lat],
                geometry_radius: Number(radius),
                geometry_type: 'circle',
                user_ids: [userId],
                is_enabled: true,
                geofence_id: geofenceId
            })

            if (result.data.status) {
                showMessage({
                    message: "Success",
                    description: "Geofence updated successfully",
                    type: "success",
                })

                await AsyncStorage.setItem('coords', JSON.stringify(coords));
                await AsyncStorage.setItem('geofenceId', result.data.data.geofence_id);
                await AsyncStorage.setItem('radius', result.data.data.geometry_radius.toString());
                setCoords(coords);
                setGeofenceId(result.data.data.geofence_id);
                setRadius(result.data.data.geometry_radius);
            }

        } catch (error) {
            console.log(error)
            showMessage({
                message: "Something went wrong",
                description: "Geofence could not be updated",
                type: "danger",
            })
        } finally {
            setIsLoading(false);
        }
    }

    // Get Current Location To Start Tracking
    const getCurrentLocation = async () => {
        Geolocation.getCurrentPosition(async (info) => {
            let coords = {
                lat: info.coords.latitude,
                lng: info.coords.longitude
            }
            await updateGeofence(coords, radius);
        },
            error => console.log(error),
            { enableHighAccuracy: false, timeout: 20000, maximumAge: 10000 },
        );
    }


    let onRadiusChange = async (v) => {
        if (!v) {
            setRadius(0);
        } else {
            setRadius(v)
        }
    }


    const createInitialGeofence = async (userId) => {
        let geofenceId = await AsyncStorage.getItem('geofenceId');

        if (geofenceId) {
            setFscreen(false);
            setIsLoading(false);
            return;
        }


        Geolocation.getCurrentPosition(async (info) => {
            let coords = {
                lat: info.coords.latitude,
                lng: info.coords.longitude
            }
            
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

                await AsyncStorage.setItem("coords", JSON.stringify(coords));
                await AsyncStorage.setItem("radius", Number(500).toString());
                await AsyncStorage.setItem('geofenceId', res.data.data.geofence_id);

                setGeofenceId(res.data.data.geofence_id);
                setCoords(coords);
                setRadius(500);

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
            } finally {
                setFscreen(false);
                setIsLoading(false);
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
                            ReactNativeForegroundService.stop();

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

    let startTracking = (userId) => {
        setIsLoading(true);
        if (userId) {
            Roam.enableAccuracyEngine();
            Roam.subscribe(Roam.SubscribeListener.BOTH, userId);
            Roam.publishAndSave();
            Roam.allowMockLocation(true);
            Roam.toggleListener(true, true, (success) => {
                Roam.toggleEvents(true, true, true, true, success => {
                    createInitialGeofence(userId);
                }, error => {
                    console.log(error);
                });
                console.log(success);
            }, error => {
                console.log(error);
            })
            Roam.startTrackingDistanceInterval(1, 1000, Roam.DesiredAccuracy.HIGH);
        }
    }

    return (
        <View style={styles.view}>
            {loading ? <Spinner size="lg" /> : (
                <View style={styles.innerView}>
                    {fscreen ? (<View style={styles.fscreen}>

                        <Button size={"lg"} onPress={() => startTracking(userId)}>
                            Start App
                        </Button>
                    </View>) :

                        (<Center>
                            <Container centerContent={true}>
                                <Heading>
                                    Geofence Information
                                </Heading>
                                <View style={styles.locationForm}>
                                    <View style={styles.coordsDetails}>
                                        <View>
                                            <FormControl.Label>Latitude</FormControl.Label>
                                            <Input value={coords.lat ? coords.lat.toString() : ""} fontSize="xl" style={styles.coordsInput} placeholder="Latitude" isDisabled={true} />
                                        </View>
                                        <View>
                                            <FormControl.Label>Longitude</FormControl.Label>
                                            <Input value={coords.lng ? coords.lng.toString() : ""} style={styles.coordsInput} fontSize="xl" placeholder="Longitude" isDisabled={true} />
                                        </View>

                                        <Button size={"lg"} onPress={getCurrentLocation} style={{ marginTop: 10 }}>
                                            Update Location
                                        </Button>
                                    </View>
                                    <View style={styles.radiusDetails}>
                                        <View>
                                            <FormControl.Label>Radius (In Meters)</FormControl.Label>
                                            <Input value={radius ? radius.toString() : ""} keyboardType='numeric' style={styles.coordsInput} onChangeText={onRadiusChange} size="2xl" width={"300"} placeholder="Radius" />
                                        </View>

                                        <Button size={"lg"} onPress={getCurrentLocation} style={[styles.coordsInput]} isDisabled={!radius} onPressIn={() => updateGeofence(coords, radius)}>
                                            Update Radius
                                        </Button>
                                    </View>
                                </View>
                            </Container>
                        </Center>)}
                </View>
            )}

        </View>
    );
};

const styles = StyleSheet.create({
    view: {
        justifyContent: "center",
        flex: 1,
        backgroundColor: "#cccccc"
    },
    innerView: {
        justifyContent: "center",
        flex: 1,
        backgroundColor: "#ffffff",
        padding: 20,
    },
    locationForm: {
        marginTop: 20,
        height: "80%",
        justifyContent: "space-between"
    },
    fscreen: {
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#CAD5E2",
        flex: 1,
        borderRadius: 30
    },
    radiusDetails: {
        height: "28%",
        justifyContent: "space-between"
    },
    coordsDetails: {
        height: "40%",
        justifyContent: "space-between"
    }
});

export default GeoFenceForm;
