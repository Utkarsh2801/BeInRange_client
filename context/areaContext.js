import React, {useState} from 'react';


export const areaContext = React.createContext({})

const AreaProvider = ({ children }) => {
    const [coords, setCoords] = useState({});
    const [radius, setRadius] = useState(0);
    const [userId, setUserId] = useState("");

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
