import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';

import vis from 'vis';

import 'vis/dist/vis.css';
import './Network2D.css';
import config from './config';

const models = config.models;

class Network2D extends Component {

  constructor() {
      super();
      this.state = {}
  }

  createView() {
    const self = this;

    const nameText = (n) => {
        if(n.length <= 24)
            return n;
        else
            return n.slice(0, 4) + '.' + n.slice(-5);
    }

    const nodeTitle = (r) => {
        const renderInterfaces = () => {
            let ia = Array.isArray(r.interfaces) ? r.interfaces : Object.getOwnPropertyNames(r.interfaces).map(n=>r.interfaces[n]);
            ia = ia.map(ri=>{
                let d = ri.description;
                if(d && d.length > 2) {
                    d = d.slice(0, 3).toUpperCase();
                    if(["RES", "_RE", "NP ",  "NP_", "_RS", "VAC", "***"].indexOf(d) !== -1)
                        return false;
                }
                return (ri.shutdown || ri.disable !== undefined) ? false : true;
            })
            return ia ? 
                `<div>interfaces: ${ia.length} (${ia.filter(ii=>!ii).length})</div>`
                : '';
        }

        const renderSlots = () => {
            return r.slots ? 
                `<div>slots: ${r.slots.length} (${r.slots.filter(ii=>ii.shutdown).length})</div>`
                : '';
        }

        const renderPorts = () => {
            return r.ports ? 
            `<div>ports: ${r.ports.length} (${r.ports.filter(ii=>ii.shutdown).length})</div>`
            : ''
        }

        return `
        <b>${nameText(r.hostname)}</b>
        <div>vendor: ${r.vendor}</div>
        <div>model: ${r.model}</div>
        ${renderInterfaces()}
        ${renderSlots()}
        ${renderPorts()}
        `;
    }

    const edgeTitle = (s, d) => {
        return `
        <div><span>From: </span><span>${nameText(s)}</span></div>
        <div><span>To: </span><span>${nameText(d)}</span></div>
        `;
    }

    let element = ReactDOM.findDOMNode(this);

    const getSize = r => {
        if(!models[r.model]) {
            console.log(`model ${r.model} of ${r.vendor} has no config size`);
        }
        else {
            return models[r.model].size;
        }
        return 24;
    }

    let _nodes = self.context.routers.map(r=>{
        return {
          id: r.hostname,
          title: nodeTitle(r),
          label: nameText(r.hostname),
          image: `/img/models/${r.vendor}/${r.model.replace(/\W+/g, '')}.png`,
          size: getSize(r),
          group: r.location,
          mass: (r.hostname.slice(-4, -3) === 'S' ? 1: 3)
        }
    });
    self.context.layout.forEach(l=>{
        let n = _nodes.find(n=>n.id === l.id);
        if(n) {
            n.x = l.x;
            n.y = l.y;
        }
    })
    self.nodes = new vis.DataSet(_nodes);

    let links = self.context.links
    .map(l=>{
        return [l.src, l.dst]
    })
    .sort((a, b) => {
        let x = a[0].localeCompare(b[0]);
        return x === 0? a[1].localeCompare(b[1]) : x;
    })
    .filter((item, pos, arr) => {
        const eq = (a, b) => {
            return (a[0] === b[0]) && (a[1] === b[1]);
        }
        return !pos || !eq(item, arr[pos - 1]);
    })
    .map(l=>{
        return {
          from: l[0],
          to: l[1],
          title: edgeTitle(l[0], l[1])
        }
    })
    .filter((item) => {
        return item.from !== item.to;
    })

    self.edges = new vis.DataSet(links);

    let data = {
          nodes: self.nodes,
          edges: self.edges
      };
      let options = {
          layout: {
              improvedLayout: false
          },
          interaction: {
              hover: true,
              tooltipDelay: 10
          },
          nodes: {
              shape: 'image',
              brokenImage: '/img/router.jpg',
              size: 24,
              mass: 2,
              font: {
                  size: 32,
                  face: 'helvetica',
                  strokeColor: '#ffffff',
                  strokeWidth: 4
              },
              shadow: {
                  enabled: true,
                  color: 'rgba(0,0,0,0.5)',
                  size: 10,
                  x: 5,
                  y: 5
              }

          },
          edges: {
              width: (config.edges[self.context.network].width || 1),
              hoverWidth: width=>width+2,
              selectionWidth: width=>width*5,
              color: {
                  color: (config.edges[self.context.network].color || '#aaaaaa'),
                  highlight: (config.edges[self.context.network].highlight || '#5555aa'),
                  hover: (config.edges[self.context.network].hover || '#222222'),
              },
              shadow: {
                  enabled: config.edges[self.context.network] ? config.edges[self.context.network].shadow : false,
                  color: 'rgba(0,0,0,0.5)',
                  size: 10,
                  x: 5,
                  y: 5
              }
          },
          physics: (config.physics[self.context.network] || config.physics.default)
      };

      // initialize your network!
      self.network = new vis.Network(element, data, options); 

      self.network.once("stabilizationIterationsDone", () => {
          self.stable = true;
          if(self.context.onProgressDone)
              self.context.onProgressDone();
      });

      self.network.on("doubleClick", function(event) {
          if(event.nodes.length > 0 && self.context.onRouterSelected)
              self.context.onRouterSelected(event.nodes[0]);
          else if(event.edges.length > 0 && event.edges[0].edgeId && self.context.onLinkSelected)
              self.context.onLinkSelected(event.edges[0].edgeId);
      }).on("oncontext", function(event) {
          console.log('oncontext')
      }).on("startStabilizing", () => {
          self.stable = false;
      }).on("stabilizationProgress", function(params) {
          if(self.context.onProgress)
              self.context.onProgress(Math.floor(100*params.iterations/params.total));
      }).on("dragEnd", (e) => {
          if(e.event.srcEvent.altKey && e.event.srcEvent.ctrlKey) {
            //console.log('fix node position');
            let node = self.nodes.get(e.nodes[0]);
            node.fixed = true;
            self.nodes.update(node);
          }
      }).on("click", (e) => {
          let se = e.event.srcEvent;
          if(se.altKey && se.ctrlKey) {
              //console.log('release node');
              let node = self.nodes.get(e.nodes[0]);
              node.fixed = !node.fixed;
              self.nodes.update(node);
          }
          else if(se.shiftKey && se.ctrlKey) {
              let data = self.nodes.get();

              if(data.find(node=>node.hidden)) {
                  // view all
                  data.forEach(node=>{
                      delete node.hidden;
                  })

                  self.nodes.update(data);
              }
              else {
                  // hide not connected
                  let connected = self.edges.get(e.edges).reduce((a, c)=>{
                      a.add(c.from);
                      a.add(c.to);
                      return a;
                  }, new Set());

                  data = data.map(node=>{
                       node.hidden = !connected.has(node.id);
                       return node;
                  })

                  self.nodes.update(data);
              }
          }
      });
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
      //console.log("componentDidMount");
      //this.needsRedraw = true;
  }

  componentDidUpdate(prevProps, prevState) {
      //console.log("componentDidUpdate");
  }

  componentWillUnmount() {
  }

  toggleWobling() {
      let options = { physics: { enabled: !this.network.physics.physicsEnabled } }
      this.network.setOptions(options);
  }

  savePositions() {
      this.network.storePositions();
      //console.log('this.network.storePositions();')
  }

  selectRouter(name) {
    if(!name)
        return;
      
    this.network.selectNodes([name]);
    this.network.focus(name, {
      scale: 1,
      animation: {
          duration: 1000,
          easingFunction: 'easeInOutQuad'
      }
    });
    this.forceUpdate();
  }

  render() {
      return (
          <div id="network-2d" />
      )
  }
}

Network2D.propTypes = {
}

Network2D.contextTypes = {
    network: PropTypes.string,
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

export default Network2D;
