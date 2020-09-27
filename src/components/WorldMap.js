import React, { useState } from "react";
import {
    Geographies,
    Geography,
    ComposableMap,
    Graticule,
    Sphere,
} from "react-simple-maps";
import {Button, InputNumber, Progress} from "antd";
import { PoweroffOutlined } from '@ant-design/icons';

const progressStatus = {
    Idle: 'Idle',
    Tracking: 'Tracking...',
    Complete: 'Complete',
}

const geoUrl =
    "https://raw.githubusercontent.com/zcreativelabs/react-simple-maps/master/topojson-maps/world-110m.json";

const WorldMap = ({
    selectedSatellites,
    setTracking,
    onTracking,
}) => {
    const [duration, setDuration] = useState(1);
    const [progressPercentage, setProgressPercentage] = useState(0);
    const [progressText, setProgressText] = useState(progressStatus.Idle);
    const [timerId, setTimerId] = useState(null);
    // const [currMin, setCurrMin] = useState(0);

    const trackOnClick = () => {
        setTracking(true);
        setProgressText(`Tracking for ${duration} minutes`);
        setProgressPercentage(0);
        let currMin = 0;
        const tmpTimerId = setInterval(() => {
            setProgressPercentage(currMin / duration * 100);
            if (currMin === duration) {
                clearInterval(tmpTimerId);
                setProgressText(progressStatus.Complete);
                setTimerId(null);
                setTracking(false);
            }
            currMin ++;
        }, 1000);
        setTimerId(tmpTimerId);
    }

    const abortOnClick = () => {
        if (timerId) {
            clearInterval(timerId);
            setProgressPercentage(0);
            setProgressText(progressStatus.Idle);
            setTimerId(null);
            setTracking(false);
        }
    }

    return (
        <>
            <div className="track-info-panel">
                {!onTracking ?
                    <Button type="primary" onClick={trackOnClick} disabled={selectedSatellites.length === 0}>
                        Track selected satellites
                    </Button> :
                    <Button type="primary" onClick={abortOnClick} icon={<PoweroffOutlined />} danger>
                        Abort
                    </Button>
                }
                <span style={{ marginLeft: "10px", marginRight: "10px" }}>for</span>
                <InputNumber
                    min={1}
                    max={50}
                    defaultValue={1}
                    onChange={(value) => setDuration(value)}
                />
                <span style={{ marginLeft: "10px", marginRight: "30px" }}>minutes</span>
                <Progress style={{ width: "500px" }} percent={progressPercentage} format={() => progressText}/>
            </div>
            <ComposableMap projectionConfig={{ scale: 137 }} style={{ height: "800px", marginLeft: "100px" }}>
                <Graticule stroke="#DDD" strokeWidth={0.5} />
                <Sphere stroke="#DDD" strokeWidth={0.5} />
                <Geographies geography={geoUrl}>
                    {({ geographies }) =>
                        geographies.map(geo => (
                            <Geography
                                key={geo.rsmKey}
                                geography={geo}
                                fill="#DDD"
                                stroke="#FFF"
                            />
                        ))
                    }
                </Geographies>
            </ComposableMap>
        </>
    )
}

export default WorldMap;