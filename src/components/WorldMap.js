import React, { useState } from "react";
import {
    Geographies,
    Geography,
    ComposableMap,
    Graticule,
    Sphere,
    Marker,
} from "react-simple-maps";
import {Button, InputNumber, Progress} from "antd";
import { PoweroffOutlined } from '@ant-design/icons';
import { N2YO_API_KEY, N2YO_BASE_URL } from "../constants";

export const POSITION_API_BASE_URL = `${N2YO_BASE_URL}/positions`;

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
    observerInfo,
}) => {
    const [duration, setDuration] = useState(1);
    const [progressPercentage, setProgressPercentage] = useState(0);
    const [progressText, setProgressText] = useState(progressStatus.Idle);
    const [timerId, setTimerId] = useState(null);
    const [markerInfo, setMarkersInfo] = useState([]);
    const [timeStamp, setTimeStamp] = useState("");

    const updateMarker = (data, index) => {
        setMarkersInfo(data.map((sat) => ({
            lon: sat.positions[index].satlongitude,
            lat: sat.positions[index].satlatitude,
            name: sat.info.satname,
        })));
    }

    const trackOnClick = () => {
        setTracking(true);
        setProgressText(`Tracking for ${duration} minutes`);
        setProgressPercentage(0);

        Promise.all(fetchPositions()).then((data) => {
            let index = 59;
            let end = data[0].positions.length - 1;

            setProgressPercentage((index / end) * 100);
            setTimeStamp(new Date(data[0].positions[index].timestamp * 1000).toString());
            updateMarker(data, index);

            const tmpTimerId = setInterval(() => {
                index += 60;
                if (index <= end){
                    setProgressPercentage(index / end * 100);
                    setTimeStamp(new Date(data[0].positions[index].timestamp * 1000).toString());
                    updateMarker(data, index);
                }

                if (index >= end) {
                    clearInterval(tmpTimerId);
                    setProgressText(progressStatus.Complete);
                    setTimerId(null);
                    setTracking(false);
                }
            }, 1000);
            setTimerId(tmpTimerId);
        }).catch(() => {
            alert("Failed to fetch satellites positions from N2YO! Please try again.");
        });
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

    const fetchPositions = () => {
        const {longitude, latitude, altitude} = observerInfo;

        return selectedSatellites.map((sat) => {
            const id = sat.satid;
            return fetch(`${POSITION_API_BASE_URL}/${id}/${latitude}/${longitude}/${altitude}/${duration * 60}&apiKey=${N2YO_API_KEY}`)
                .then(response => response.json());
        });
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
                    max={60}
                    defaultValue={1}
                    onChange={(value) => setDuration(value)}
                />
                <span style={{ marginLeft: "10px", marginRight: "30px" }}>minutes</span>
                <Progress style={{ width: "500px" }} percent={progressPercentage} format={() => progressText}/>
            </div>
            <div className="time-stamp-container" style={{textAlign: "center"}}>
                <b>{timeStamp}</b>
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
                {
                    markerInfo.map((marker) =>
                        <Marker coordinates={[marker.lon, marker.lat]}>
                            <circle r={4} fill="#F53" />
                            <text>{marker.name}</text>
                        </Marker>
                    )
                }
            </ComposableMap>
        </>
    )
}

export default WorldMap;