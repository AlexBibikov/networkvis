import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';

import createGraph from 'ngraph.graph';
import renderGraph from 'ngraph.pixel';

//import { colors } from './utils.js'

import './Network3D.css';
import config from './config';

const models = config.models;

class Network3D extends Component {

  constructor() {
    super();
    this.physics = {
      // Ideal length for links (springs in physical model).
      springLength: 60,

      // Hook's law coefficient. 1 - solid spring.
      springCoeff: 0.0008,

      // Coulomb's law coefficient. It's used to repel nodes thus should be negative
      // if you make it positive nodes start attract each other :).
      gravity: -1.2,

      // Theta coefficient from Barnes Hut simulation. Ranged between (0, 1).
      // The closer it's to 1 the more nodes algorithm will have to go through.
      // Setting it to one makes Barnes Hut simulation no different from
      // brute-force forces calculation (each node is considered).
      theta: 0.8,

      // Drag force coefficient. Used to slow down system, thus should be less than 1.
      // The closer it is to 0 the less tight system will be
      dragCoeff: 0.02,

      // Default time step (dt) for forces integration
      timeStep : 20
    }
  }

  loadGraph() {
    this.graph = createGraph();

    this.graph.beginUpdate();

    this.context.links.forEach(l=>{
      var ns = this.context.routers.find(r=>r.hostname===l.src);
      var nd = this.context.routers.find(r=>r.hostname===l.dst);
      if(ns === undefined)
          console.log(`${l.src} not found`);
      else if (nd === undefined)
          console.log(`${l.dst} not found`);
      else {
          this.graph.addLink(ns.hostname, nd.hostname);
      }
    })
    
    this.context.routers.forEach(r=>{
      let node = this.graph.getNode(r.hostname);
      if(node) {
          node.data = r;
      }
    })
  
     this.graph.endUpdate();
  }

  getRouterColor(x) {
      let color = 0x00aaff;
      if(x.model && models[x.model] && models[x.model].color)
        color = models[x.model].color;
      return color;
  }

  getRouterSize(x) {
      let size = 20;
      if(x.model && models[x.model] && models[x.model].size)
        size = models[x.model].size;
      return size;
  }

  createView() {
    const self = this;

    let element = ReactDOM.findDOMNode(this);

    if(!self.graph) {
        self.loadGraph();
    }

    self.renderer = renderGraph(self.graph, {
        //interactive: true,
        is3d: self.context.is3d,
        container: element,
        clearAlpha: 0,
        node: n => {
            var x = n.data;
            return {
              color: self.getRouterColor(x),
              size: self.getRouterSize(x)
            }
        },
        physicsSettings: this.physics
    });

    self.renderer.on('nodeclick', function(node) {
      self.context.onRouterSelected(node.id);
    });

    if(localStorage && localStorage.graphXY) {
        let layout = this.renderer.layout();
        let pos = localStorage.getItem("graphXY");
        if(pos)
          pos = JSON.parse(pos);

        pos.forEach(n=>{
          if(this.renderer.getNode(n.name))
            layout.setNodePosition(n.name, n.pos.x, n.pos.y, n.pos.z);
        })
    }

    setTimeout(()=>{
      self.renderer.stable(true);
    }, 15000);
    //self.selectedNodeUI = self.renderer.getNode(topology.nodes[0].name);
  }

  toggleWobling() {
    let s = this.renderer.stable();
    this.renderer.stable(!s);
  }

  savePositions() {

  }
  
  redraw() {
    if(!this.redrawing) {
        this.redrawing = true;
        let element = ReactDOM.findDOMNode(this);
        element.innerHTML = "";
        this.createView();
        this.redrawing = false;
        this.forceUpdate();
    }
  }

  componentDidMount(prevProps, prevState) {
      //console.log("Network3D.componentDidMount");
  }

  componentDidUpdate(prevProps, prevState) {
      //console.log("componentDidUpdate", Object.keys(prevProps));
  }

  componentWillUnmount() {
    let r = this.renderer;
    if(!r)
        return;

    if(localStorage) {
      let graphXY = [];
      r.forEachNode(nUI=>{
        let pos = r.layout().getNodePosition(nUI.id);
        graphXY.push({name: nUI.id, pos: pos});
      })
      localStorage.setItem('graphXY', JSON.stringify(graphXY));
    }
  }

  selectRouter(name) {
      var rUI = this.renderer.getNode(name);
      var r = this.graph.getNode(name);

      if(!r || ! rUI) {
        console.log(`router '${name}' not found in ${(!r)?'data':'scene'}.`);
        return;
      }

      if(this.selectedNodeUI && this.selectedNode) {
         this.selectedNodeUI.color = this.getRouterColor(this.selectedNode.data);
         this.selectedNodeUI.size = this.getRouterSize(this.selectedNode.data);
      }

      rUI.color = 0xff0000;
      rUI.size = 100;

      this.renderer.showNode(name, 300);

      this.selectedNodeUI = rUI;
      this.selectedNode = r;
  }

  render() {
    return (
      <div id="network-3d" />
    )
  }
}

Network3D.propTypes = {
    network: PropTypes.string
}

Network3D.propTypes = {
}

Network3D.contextTypes = {
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

export default Network3D;
