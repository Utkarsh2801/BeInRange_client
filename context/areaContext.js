import React, {useState, useEffect} from 'react';
import AsyncStorage from '@react-native-community/async-storage';


export const areaContext = React.createContext({})

const AreaProvider = ({ children, ...props }) => {
    const [coords, setCoords] = useState({});
    const [radius, setRadius] = useState(0);
    const [userId, setUserId] = useState("");
    const [geofenceId, setGeofenceId] = useState();

    useEffect(() => {
        setUserId(props.userId);
    },[props.userId])

    useEffect(() => {
        loadPreviousValues()
    }, [])

    const loadPreviousValues = async () => {
        let radius = await AsyncStorage.getItem("radius");
        let coords = await AsyncStorage.getItem("coords");
        let geofence = await AsyncStorage.getItem("geofenceId");
    
        if(radius) {
            setRadius(Number(radius));
        }
        if(coords) {
            setCoords(JSON.parse(coords));
        }
        if(geofence) {
            setGeofenceId(geofence);
        }
    }

    

    let value = {
        coords,
        radius,
        userId,
        geofenceId,
        setCoords,
        setRadius,
        setUserId,
        setGeofenceId
    }

    return (
        <areaContext.Provider value={value}>
            {children}
        </areaContext.Provider>
    );
};

export default AreaProvider;
