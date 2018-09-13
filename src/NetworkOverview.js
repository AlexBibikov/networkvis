import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';

import { TrafficMap } from 'react-network-diagrams';

//import './NetworkOverview.css';

class NetworkOverview extends Component {

    constructor() {
      super();
    }

    render() {

        const topology = {
            "name": "My traffic map",
            "description": "This is an optional description",
            "nodes": [],
            "edges": [],
            "paths": []
        }

        const nodeSizeMap = {
            hub: 5.5,
            esnet_site: 7
        };

        const edgeThinknessMap = {
            "100G": 5,
            "10G": 3,
            "1G": 1.5,
            subG: 1
        };

        const nodeShapeMap = {
            LAB: "square"
        };

        const stylesMap = {
            "hub": hubStyle,
            "esnet_site": siteStyle
        };

        const hubStyle = {
            node: {
                normal: {fill: "#CBCBCB",stroke: "#BEBEBE", cursor: "pointer"},
                selected: {fill: "#37B6D3", stroke: "rgba(55, 182, 211, 0.22)",
                           strokeWidth: 10, cursor: "pointer"},
                muted: {fill: "#CBCBCB", stroke: "#BEBEBE", opacity: 0.6,
                        cursor: "pointer"}
            },
            label: {
                normal: {fill: "#696969", stroke: "none", fontSize: 9},
                selected: {fill: "#333",stroke: "none", fontSize: 11},
                muted: {fill: "#696969", stroke: "none", fontSize: 8,
                opacity: 0.6}
            }
        };

        const pathColorMap = {
            northPath: "#ff7f0e",
            southPath: "#aec7e8",
        };

        const pathWidthMap = {
            northPath: 4,
            southPath: 2,
        };

        const edgeColorMap = [
            {color: "#990000", label: ">=50 Gbps", range: [50, 100]},
            {color: "#bd0026", label: "20 - 50", range: [20, 50]},
            {color: "#cc4c02", label: "10 - 20", range: [10, 20]},
            {color: "#016c59", label: "5 - 10", range: [5, 10]},
            {color: "#238b45", label: "2 - 5", range: [2, 5]},
            {color: "#3690c0", label: "1 - 2", range: [1, 2]},
            {color: "#74a9cf", label: "0 - 1", range: [0, 1]}
        ];

        return (
            <TrafficMap
                bounds={{x1: -5, y1: 5, x2: 240, y2: 120}}
                topology={topology}
                traffic={traffic}
                edgeColorMap={edgeColorMap}
                edgeDrawingMethod="bidirectionalArrow"
                edgeThinknessMap={edgeThinknessMap}
                edgeShapeMap={edgeShapeMap}
                nodeSizeMap={nodeSizeMap}
                nodeShapeMap={nodeShapeMap}
                stylesMap={stylesMap}
                selection={selection}
                onSelectionChange={this.handleSelectionChanged} />
        )
    }
}

NetworkOverview.propTypes = {
}

NetworkOverview.contextTypes = {
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

export default NetworkOverview;
