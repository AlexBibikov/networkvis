const MAX_LINK_TRAFFIC = 1800000;

const config = {

  MAX_LINK_TRAFFIC: MAX_LINK_TRAFFIC,

  // local storage
  storage: {
    networkName: 'network_name',
    viewAs: 'viewAs'
  },

  // API
  api: {
    locations: '/api/locations',
    topology: '/api/topology',
    shortest: '/api/shortest',
    last5min: '/api/traffic/geo'
  },
  
  // MAP tiles
  tiles: 'http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png',
  chart: {
    limit: 100000
  },

  // menu commands
  commands: {
    SHORTEST_PATH: 1,
    SHORTEST_K_PATHS: 2,

    STABIILIZATION: 30,
    SAVE_NETWORK: 31,

    SET_NETWORK: 100,
    VIEW_AS: 200,

    SHOW_SETTINGS: 999,

    FIND_ROUTER: 802
  },

  style: {
    loading: '/img/loading.gif',
    map: {
      zoom: 6,
      maxZoom: 14,
      minZoom: 1,
      arc: {
        domain: [0, MAX_LINK_TRAFFIC*0.75, MAX_LINK_TRAFFIC*0.94, MAX_LINK_TRAFFIC],
        color: ["steelblue", "forestgreen", "darkorange", "red"],
        weight: [2, 4, 8, 16],
        default: {
          weight: 2,
          color: '#999999'
        },
        selected: {
          weight: 10,
          color: '#009900'
        }
      }
    }
  },

  models: {
    "7450 ESS-7": {
        color: "0xaaddff",
        size: "40"
    },
    "7750 SR-12": {
        color: "0xaaaadd",
        size: "60"
    },
    "7950 XRS-20": {
        color: "0xaaaadd",
        size:  48
    },
    "mx960": {
        color: "0xaaaadd",
        size: "48"
    },
    "mx5-t": { size: 8},
    "mx10-t": { size:  8},
    "mx40-t": { size:  8},
    "m10i": { size:  22},
    "m40e": { size:  48},
    "m320": { 
        color: "0xaaddaa",
        size:  48
    },
    "E320": { 
        color: "0x0b76a4",
        size:  48
    },
    "ERX-1400": { 
        color: "0x5a2384",
        size:  48
    },
    "mx480": { size:  36},
    "qfx10008": { size:  48},
    "mx2010": { size:  48},
    "mx2020": { size:  48},
    "ERX-310": { size:  20},
    "ERX-700": { size:  36},
    "ERX-1440": { size:  48},
    "unknown": { size:  48}
  },

  physics: {
      default: {
          solver: 'barnesHut',
          maxVelocity: 70,
          repulsion: {
              nodeDistance: 200,
              springLength: 200,
              springConstant: 0.01
          },
          barnesHut: {
              centralGravity: 0.02,
              gravitationalConstant: -20000,
              springLength: 10,
              springConstant: 0.05
          },
          forceAtlas2Based: {
              springLength: 300,
          },
          stabilization: {
              enabled: true,
              iterations: 100,
              updateInterval: 5
          }
      },
      UVERSE: {
          solver: 'barnesHut',
          maxVelocity: 70,
          barnesHut: {
              centralGravity: 0.02,
              gravitationalConstant: -20000,
              springLength: 10,
              springConstant: 0.05
          },
          stabilization: {
              enabled: true,
              iterations: 100,
              updateInterval: 5
          }
      },
      IPAG: {
          solver: 'forceAtlas2Based',
          maxVelocity: 100,
          forceAtlas2Based: {
              gravitationalConstant: -100,
              centralGravity: 0.1,
              springConstant: 0.08,
              damping: 0.6

          },
          stabilization: {
              enabled: true,
              iterations: 100,
              updateInterval: 5
          }
      },
      AS5650: {
          solver: 'forceAtlas2Based',
          maxVelocity: 100,
          forceAtlas2Based: {
              gravitationalConstant: -200,
              centralGravity: 0.01,
              springConstant: 0.05,
              damping: 0.6
          },
          stabilization: {
              enabled: true,
              iterations: 100,
              updateInterval: 5
          }
      }
  },

  edges: {
      UVERSE: {
          width: 3,
          color: '#000000',
          highlight: '#4178b1',
          hover: '#3580bd',
          shadow: true
      },
      IPAG: {
          width: 1,
          color: '#aaaaaa',
          highlight: '#ff0000',
          hover: '#005555',
          shadow: false
      },
      AS5650: {
          width: 3,
          color: '#000000',
          highlight: '#005555',
          hover: '#005555',
          shadow: false
      },
  }

};


module.exports = config;