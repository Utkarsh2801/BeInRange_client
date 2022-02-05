import React, {useState, useEffect} from 'react';


export const areaContext = React.createContext({})

const AreaProvider = ({ children, ...props }) => {
    const [coords, setCoords] = useState({});
    const [radius, setRadius] = useState(0);
    const [userId, setUserId] = useState("");

    useEffect(() => {
        setUserId(props.userId);
    },[props.userId])

    let value = {
        coords,
        radius,
        userId,
        setCoords,
        setRadius,
        setUserId
    }

    return (
        <areaContext.Provider value={value}>
            {children}
        </areaContext.Provider>
    );
};

export default AreaProvider;
