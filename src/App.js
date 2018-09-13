import React, { Component } from 'react';
import PropTypes from 'prop-types';

//import update from 'immutability-helper'

import Header from './Header.js';
import GeoNetwork from './GeoNetwork.js';
import Network3D from  './Network3D.js';
import Network2D from  './Network2D.js';
import GeoLocationView from './GeoLocationView.js';
import RouterDetailsView from './RouterDetailsView.js';
import config from './config';

import './App.css';

class App extends Component {

    constructor() {
        super();
        this.state = {
            viewAs: localStorage.getItem(config.storage.viewAs),
            locations: {},
            routers: [],
            links: [],
            ips: [],
            layout: [],
            network: localStorage.getItem(config.storage.networkName) || 'AS5650',
            showGeoLocationView: false,
            selectedLocation: null,
            selectedLocationRouters: [],
            showRouterView: false,
            selectedRouter: null,
            showSettings: false
        }
    }

    getChildContext() {
        return {
            network: this.state.network,
            viewAs: this.state.viewAs,

            links: this.state.links,
            locations: this.state.locations,
            routers: this.state.routers,
            ips: this.state.ips,
            layout: this.state.layout,

            onLocationSelected: this.onLocationSelected.bind(this),
            onRouterSelected: this.onRouterSelected.bind(this),
            onLinkSelected: this.onLinkSelected.bind(this),
            onProgress: this.onProgress.bind(this),
            onProgressDone: this.onProgressDone.bind(this)
        }
    }

    fetch(url) {
        return fetch(url)
            .then(response => {
                if (response.status !== 200) {
                    console.log('Status Code: ' + response.status);
                    return null;
                }

                return response.json();
            })
    }

    fetchAllData() {
        let self = this;

        let promises = [
            this.fetch(`/api/networks/${this.state.network}/locations.json`),
            this.fetch(`/api/networks/${this.state.network}/ips.json`),
            this.fetch(`/api/networks/${this.state.network}/links.json`),
            this.fetch(`/api/networks/${this.state.network}/routers.json`),
            this.fetch(`/api/networks/${this.state.network}/layout.json`),
        ]

        Promise.all(promises).then(data=>{
            self.setState({ 
                locations: data[0],
                ips: data[1],
                links: data[2],
                routers: data[3],
                layout: data[4]
            });

            self.networkView = (self.map || self.net2d || self.net3d)
            self.redraw();
        })
        .catch(function(err) {
            console.log(`Fetch Error`, err);
        });
    }

    redraw() {
        this.header.redraw();
        this.networkView.redraw();
    }

    componentDidMount() {
        window.addEventListener('resize', e => this.handleResize(e));
        this.fetchAllData()
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevState.network !== this.state.network) {
            //console.log('network changed', prevState.network, this.state.network);
            if(localStorage) localStorage.setItem(config.storage.networkName, this.state.network);
            this.fetchAllData();
        }
        if (prevState.viewAs !== this.state.viewAs) {
            //console.log('viewAs changed', prevState.viewAs, this.state.viewAs);
            if(localStorage) localStorage.setItem(config.storage.viewAs, this.state.viewAs);
            this.networkView = (this.map || this.net2d || this.net3d)
            this.redraw();
        }
    }

    handleComand(key, mi) {
        const CMD = config.commands;

        switch(+key) {
            case CMD.STABIILIZATION: this.networkView.toggleWobling(); break;
            case CMD.SAVE_NETWORK: this.networkView.savePositions(); break;
            case CMD.SET_NETWORK: this.setState({network: mi.value}); break;
            case CMD.VIEW_AS: this.setState({viewAs: mi.value}); break
            default: console.log('unknown command: ', key);
        }
    }

    showSettings() {
        this.setState({showSettings: true})
    }

    selectLocation(name) {
        this.setState({selectedLocation: name})
    }

    onLocationSelected(loc) {
        this.setState({showGeoLocationView: true, selectedLocation: loc.name, selectedLocationRouters: loc.routers || []})
    }

    onRouterSelected(router) {
        this.setState({showRouterView: true, selectedRouter: router})
    }

    onLinkSelected(link) {
        this.setState({showLinkView: true, selectedLink: link})
    }

    onProgress(x) {
        this.header.onProgress(x);
    }

    onProgressDone() {
        this.header.onProgressDone();
    }

    onCloseGeoLocationView() {
        this.setState({showGeoLocationView: false})
    }

    selectRouter(name) {
        this.setState({selectedRouter: name, showRouterView: true })
    }

    onCloseRouterView() {
        this.setState({showRouterView: false})
    }

    handleResize(e) {
        if(this.routerDetails)
            this.routerDetails.handleParentResize(e);
    }

    selectItem(name) {
        switch(+this.state.viewAs) {
            case 0: this.map && this.map.selectLocation(name); break;
            case 1: break;
            case 2: this.net2d && this.net2d.selectRouter(name); break;
            case 3: this.net3d && this.net3d.selectRouter(name); break;
            default: break;
        }
    }

    renderGeoLocationView() {
        if(!this.state.showGeoLocationView)
            return null;

        return (
            <GeoLocationView 
                network={this.state.network}
                location={{ name: this.state.selectedLocation, routers: this.state.selectedLocationRouters }}
                locations={this.state.locations}
                routers={this.state.routers}
                selectLocation={this.selectLocation.bind(this)}
                selectRouter={this.selectRouter.bind(this)}
                close={this.onCloseGeoLocationView.bind(this)} />
        )
    }

    renderRouterView() {
        if(!this.state.showRouterView)
            return null;

        return (
            <RouterDetailsView 
                ref={(x) => { this.routerDetails = x; }} 
                router={this.state.selectedRouter}
                close={this.onCloseRouterView.bind(this)} />
        )
    }

    renderHeader() {
        return (
            <Header           
                ref={(x) => { this.header = x; }} 
                handleSelectItem={ this.selectItem.bind(this) }
                handleComand={ this.handleComand.bind(this) } />
        )
    }

    renderNetworkView() {
        switch(+this.state.viewAs) {
            case 0: return (
                <GeoNetwork ref={(x) => { this.map = x; }}  location={ this.state.selectedLocation } />
            )
            case 1: return (
                <div>not implemented yet</div>
            )
            case 2: return (
                <Network2D ref={(x) => { this.net2d = x; }} />
            )
            case 3: return (
                <Network3D ref={(x) => { this.net3d = x; }} />
            )
            default: return (
                <div>
                    WTF viewAs {this.state.viewAs} ?
                </div>
            )
        }
    }

    render() {
        return (
            <div id="outer-container" className="App">
                <div id="page-wrap">
                    { this.renderHeader() }
                    { this.renderNetworkView() }
                </div>

                { this.renderGeoLocationView() }
                { this.renderRouterView() }
            </div>
        );
    }
}

App.childContextTypes = {
    network: PropTypes.string,
    viewAs: PropTypes.string,
    links: PropTypes.array,
    locations: PropTypes.object,
    routers: PropTypes.array,
    ips: PropTypes.array,
    layout: PropTypes.array,

    onLocationSelected: PropTypes.func,
    onRouterSelected: PropTypes.func,
    onLinkSelected: PropTypes.func,
    onProgress: PropTypes.func,
    onProgressDone: PropTypes.func    
}

export default App;

