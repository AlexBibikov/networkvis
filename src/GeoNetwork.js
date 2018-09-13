import React, {
    Component
} from 'react';

import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';

import L from 'leaflet';
import './LArc.js'

import config from './config';

import './GeoNetwork.css';

var d3 = require("d3");

var pinIcon = L.icon({
    iconUrl: 'img/pin.png',
    iconSize: [40, 44],
    iconAnchor: [20, 44],
    popupAnchor: [-3, -76],
    shadowUrl: 'img/pin-shadow.png',
    shadowSize: [68, 90],
    shadowAnchor: [20, 88]
});

var pinIconSelected = L.icon({
    iconUrl: 'img/pinSel.png',
    iconSize: [40, 44],
    iconAnchor: [20, 44],
    popupAnchor: [-3, -76],
    shadowUrl: 'img/pin-shadow.png',
    shadowSize: [68, 90],
    shadowAnchor: [20, 88]
});

//const MIN2MS = 60*1000;             // ms in one minute
//const HOUR2MS = 60*MIN2MS;
//const DAY2MS = 24*HOUR2MS;
const POLL_INTERVAL = 10000;//5*MIN2MS;     // 5 minutes

//const POLL_POINTS_LIMIT = config.chart.limit;

const DEFAULT_ARC_STYLE = config.style.map.arc.default;
const SELECTED_ARC_STYLE = config.style.map.arc.selected;

class GeoNetwork extends Component {

    constructor() {
        super();
        this.state = {
            location: "",
            link: ["",""], // link between 2 locations
            chartURL: config.style.loading,
        }
    }

    componentDidMount() {
        //console.log("GeoNetwork.componentDidMount()");
    }

    getRouters4Loc(name) {
        if(!name)
            return [];

        let rr = this.context.routers
            .filter(r=>r.location===name)
            .map(r=>r.hostname)

        return rr;
    }

    createMarker(place) {
        let self = this;
        let marker = L.marker([place.location.lat, place.location.lng], {
          icon: pinIcon,
          title: place.name,
          name: place.name
        }).addTo(self.map);
        marker.data = {name:place.name, routers: []};
        self.markers.set(place.name, marker);

        const AC = place.address_components;

        const street_address = (AC.number || AC.formatted_street) ? `<div>${place.address_components.number}, ${place.address_components.formatted_street}</div>` : '';
        const city_state = (AC.city || AC.state) ? `<div>${place.address_components.city}, ${place.address_components.state}</div>` : '';

        marker.bindTooltip(`<div style='text-align:center'>
            <div><strong>${place.name}</strong></div>
            ${street_address}
            ${city_state}
            <div><strong><span id="${place.name}_routers">${this.getRouters4Loc(place.name).length}</span> routers</strong></div></div>`, 
        {
            direction: 'top',
            offset: [0, -44],
            opacity: 1.0
        });

        marker.on('click', function(e) {
            self.noFly = true;
            self.selectLocation(place.name);
        });
    }

    createArc(location1, location2) {
        let self = this;
        let arc = L.Polyline.Arc([location1.location.lat, location1.location.lng], [location2.location.lat, location2.location.lng], {
            color: DEFAULT_ARC_STYLE.color,
            weight: DEFAULT_ARC_STYLE.weight,
            opacity: 1.0,
            vertices: 40,
            offset: 1,
            pane: 'arcs'
        }).addTo(self.map);

        arc.data = { 
            from: {
                name: location1.name,
                formatted_address: location1.formatted_address
            }, 
            to: {
                name: location2.name,
                formatted_address: location2.formatted_address
            },
            style: DEFAULT_ARC_STYLE
        };

        var tooltip = L.tooltip({
            opacity: 1.0,
            sticky: true
        });

        arc.bindTooltip(tooltip);

        arc.bindPopup(L.popup({
            maxWidth: 800,
            autoPan: true
        }));
        
        arc.on('click', e=>{
            self.onArcClick(e, arc);
        });

        arc.on('mouseover', function(e) {
            let tooltip = e.target.getTooltip();
            let div = `<div style='text-align:center'>
                <div><strong>${this.data.from.name}</strong></div>
                <div><small>${this.data.from.formatted_address}</small></div>
                <h3>&Larr;${d3.format(",")(this.data.traffic)}&Rarr;</h3>
                <div><strong>${this.data.to.name}</strong></div>
                <div><small>${this.data.to.formatted_address}</small></div>
            </div>`;
            tooltip.setContent(div);
            tooltip.update();
            this.openTooltip();
        }).on('mouseout', function (e) {
            //this.closePopup();
        })
    }

    createNetwork() {
        let self = this;

        self.places = new Map();
        self.markers = new Map();

        if(self.map) {
            self.map.off();
            self.map.remove();
        }

        self.map = L.map('geo-network').setView([38.0, -100.0], config.style.map.zoom);

        self.map.createPane('labels');

        // This pane is above markers but below popups
        self.map.getPane('labels').style.zIndex = 520;
        self.map.getPane('labels').style.pointerEvents = 'none';

        L.tileLayer(config.tiles, {
            maxZoom: config.style.map.maxZoom,
            minZoom: config.style.map.minZoom
        }).addTo(this.map);

        let roloc = new Map();              // map router to its location
        self.context.routers.forEach(r=>{
            roloc.set(r.hostname, r.location)
        })

        let locro = new Map();              // map location to its routers
        self.context.routers.forEach(r=>{
            let a = [];
            if(!locro.has(r.location))
                locro.set(r.location, a);
            else
                a = locro.get(r.location);

            a.push(r.hostname);
        })

        //
        //  Add markers
        //
        let placeNames = Object.getOwnPropertyNames(self.context.locations);

        placeNames.forEach(name=>{
            let n = self.context.locations[name];
            if(!n) return;
            n.name = name;
            self.createMarker(n);
        });

        //
        //  Add arcs
        //

        this.map.createPane('arcs');

        // This pane is above markers but below popups
        this.map.getPane('arcs').style.zIndex = 530;

        placeNames.forEach(name=>{
            let n = self.context.locations[name];
            n.name = name;
            let connectedWith = new Set();
            let lr = locro.get(name);
            if(!lr)
                return;

            self.context.links
            .filter(l=>{
                return lr.includes(l.src) || lr.includes(l.dst)
            })
            .forEach(l=>{
                let l1 = roloc.get(l.src);
                if(!l1) return;
                let l2 = roloc.get(l.dst);
                if(!l2) return;
                if(l1 === name)
                    connectedWith.add(l2)
                if(l2 === name)
                    connectedWith.add(l1)
            })

            connectedWith.forEach(to=>{
                let current = self.context.locations[to];
                if(!current)
                    return;
                current.name = to;
                self.createArc(n, current);
            })
        });

        // Add traffic listener - every 5 min poll traffic updates...
        if(self.trafficPoller)
            clearInterval(self.trafficPoller);

        self.trafficPoller = setInterval(self.pollTraffic.bind(self), POLL_INTERVAL);
        setTimeout(self.pollTraffic.bind(self), 500);

        let group = new L.featureGroup(Array.from(self.markers.values()));
        self.map.fitBounds(group.getBounds());
    }

    redraw() {
        if(!this.redrawing) {
            this.redrawing = true;
            this.createNetwork();
            this.redrawing = false;
            this.forceUpdate();
        }
    }

    onArcClick(e, arc) {
        let self = this;
        let popup = e.target.getPopup();
        self.setState({link: [arc.data.from.name, arc.data.to.name]});
        let element = ReactDOM.findDOMNode(self.popupChartContent);
        element.style.display = 'block';
        popup.setContent(element);
        popup.update();
    }

    updateLinks(data) {
        var color = d3.scaleLinear()
            .domain(config.style.map.arc.domain)
            .range(config.style.map.arc.color);

        var width = d3.scaleLinear()
            .domain(config.style.map.arc.domain)
            .range(config.style.map.arc.weight);

        this.latest_traffic = data;

        this.map.eachLayer(l=>{
            if(l.options.pane === 'arcs') {
                if(!l.data)
                    return;

                //let src = l.data.from.name;
                //let dst = l.data.to.name;
                let payload = {
                    bytes: Math.floor(config.MAX_LINK_TRAFFIC*Math.random())
                }

                if(payload) {
                    l.data.traffic =  payload.bytes;
                    l.data.style = {
                        weight: width(Math.min(l.data.traffic, config.MAX_LINK_TRAFFIC)),
                        color: color(Math.min(l.data.traffic, config.MAX_LINK_TRAFFIC))
                    };

                    l.setStyle(l.data.style);
                }
                else {
                    l.setStyle(DEFAULT_ARC_STYLE);
                }
            }
        });
    }

    pollTraffic() {
        //console.log('poll')
        this.updateLinks(null);
    }

    componentDidUpdate(prevProps, prevState) {
        if(prevState.location !== this.state.location) {
            let marker = this.markers.get(prevState.location);
            if(marker) marker.setIcon(pinIcon);
            
            let loc = this.context.locations[this.state.location];
            if(!loc) return;

            let lat = loc.location.lat;
            let lon = loc.location.lng;
            if(this.noFly)
                delete this.noFly;
            else
                this.map.flyTo(new L.LatLng(lat, lon));

            marker = this.markers.get(this.state.location);
            if(marker) marker.setIcon(pinIconSelected);
        }
    }

    selectLocation(name) {
        this.setState({location: name});
        this.context.onLocationSelected({name: name, routers: this.getRouters4Loc(name)});
    }

    findRouter(name) {
        /*
        if(this.state.findRouterDialogVisible) {
            this.setState({findRouterDialogVisible: false});
            if(!name) return;

            let r = this.pro ps.topology.nodes.find(n=>n.name === name);
            if(!r) return;

            this.selectLocation(r.loc1);
        }
        else {
            this.setState({findRouterDialogVisible: true});
        }
        */
    }

    handlePopupBurgerMenu(a) {
        this.setState({popupChartType: +a});
    }

    highlightLink(loc1, loc2) {
        this.map.eachLayer(l=>{
            if(l.options.pane === 'arcs') {
                
                if(!l.data)
                    return;

                if(!l.data.from || !l.data.to)
                    return;

                if(l.data.from.loc1 === loc1 && l.data.to.loc1 === loc2) {
                    l.setStyle(SELECTED_ARC_STYLE);
                }
                if(l.data.from.loc1 === loc2 && l.data.to.loc1 === loc1) {
                    l.setStyle(SELECTED_ARC_STYLE);
                }
            }
        })
    }

    unhighlightLinks(x, path) {
        this.map.eachLayer(l=>{
            if(l.options.pane === 'arcs') {
                
                if(!l.data)
                    return;

                if(!l.data.from || !l.data.to)
                    return;

                if(x)
                    l.setStyle(l.data.style || DEFAULT_ARC_STYLE);
                else
                    l.setStyle(DEFAULT_ARC_STYLE);
            }
            else if(l.options.pane === 'markerPane') {
                let op1 = x || path.indexOf(l.data.name) >= 0;
                //console.log(l.data.name, path);
                l.setOpacity( op1 ? 1.0 : 0.2);
            }
        })
    }

    shortestPath(r1, r2) {
        let self = this;
        //console.log(r1, r2);
        fetch(`${config.api.shortest}?r1=${r1}&r2=${r2}`)
            .then(response => {
                if (response.status !== 200) {
                    console.log('Status Code: ' + response.status);
                    return;
                }

                response.json().then(data => {
                    //console.log('#', data);
                    if(!data) {
                        this.unhighlightLinks(1);
                    }
                    else {
                        this.unhighlightLinks(0, data);
                        var first = data.shift();
                        var r = self.places.get(first)[0];
                        var bounds = L.latLngBounds(L.latLng(r.lat, r.lon), L.latLng(r.lat, r.lon));

                        while(data.length) {
                            var second = data.shift();
                            self.highlightLink(first, second);
                            first = second;

                            r = self.places.get(second)[0];
                            bounds.extend(L.latLng(r.lat, r.lon));
                        }

                        this.map.flyToBounds(bounds);
                    }
                })
            })
            .catch(function(err) {
                console.log('Fetch Error :-S', err);
            });

    }

    kShortestPaths(r1, r2, k) {
        //console.log(r1, r2, k);
        this.shortestPath(r1, r2);
    }

    render() {
        return (
            <div id="geo-network">
                <div ref={(x) => { this.popupChartContent = x; }} id="popup-chart-content">
                    <div className="chart-labels"><span>{this.state.link[0]}</span> to <span>{this.state.link[1]}</span></div>
                    <img width="740" alt="nice chart" src={`/img/chart${1 + Math.floor(4.999 * Math.random())}.png`} />
                </div>
            </div>
        )
    }

}

GeoNetwork.propTypes = {
    location: PropTypes.string
}

GeoNetwork.contextTypes = {
    network: PropTypes.string,
    links: PropTypes.array,
    locations: PropTypes.object,
    routers: PropTypes.array,
    ips: PropTypes.array,

    onLocationSelected: PropTypes.func,
    onRouterSelected: PropTypes.func,
    onLinkSelected: PropTypes.func,
    onProgress: PropTypes.func,
    onProgressDone: PropTypes.func
}

export default GeoNetwork;
