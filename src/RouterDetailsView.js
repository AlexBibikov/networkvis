import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';

import { ResizableBox } from 'react-resizable';
import { Panel, Button, Nav, NavItem, TabPane, TabContent, TabContainer } from 'react-bootstrap';

import { BootstrapTable as Table, TableHeaderColumn as TCol }  from 'react-bootstrap-table';

import './RouterDetailsView.css';

const COLUMNS = {
    'interfaces': [
        { prop: 'id', label: 'Name',  width: '50'},
        { prop: 'address', label: 'IP Address',  width: '80', func: (o) => {
            let units = Object.getOwnPropertyNames(o)
                .filter(pn=>pn.startsWith('unit'))
                .map(pn=>{ return o[pn] })
                .filter(u=>!!u["family inet"])
            if(units.length === 0)
                return '';
            if(units.length === 1)
                return units[0]["family inet"]['address'] || '';
            return `${units.length} addresses assigned`
        }},
        { prop: 'port', label: 'Port',  width: '50' },
        { prop: 'description', label: 'Description',  width: '300', func: (o) => {
            let units = Object.getOwnPropertyNames(o)
                .filter(pn=>pn.startsWith('unit'))
                .map(pn=>{ return o[pn] })
                .filter(u=>u.description)
            if(units.length === 0)
                return '';
            return units[0].description || '';
        }}
    ],
    'cards': [
        { prop: 'id', label: 'Id',  width: '100' },
        { prop: 'card-type', label: 'Type',  width: '400' }
    ],
    'ports': [
        { prop: 'id', label: 'Id',  width: '100' },
        { prop: 'description', label: 'Description',  width: '400' }
    ],
    'slots': [
        { prop: 'slot', label: 'slot',  width: '100' },
        { prop: 'type', label: 'Type',  width: '100' },
        { prop: 'serial number', label: 'Serial #',  width: '100' },
        { prop: 'assembly number', label: 'Sssembly #',  width: '100' }
    ],
    'inventory': [
        { prop: 'name', label: 'Name',  width: '100'  },
        { prop: 'version', label: 'Version',  width: '80'  },
        { prop: 'part_no', label: 'Part #',  width: '100'  },
        { prop: 'serial_no', label: 'Serial #',  width: '100'  },
        { prop: 'description', label: 'Description',  width: '300'  }
    ]
}

class RouterDetailsView extends Component {

    constructor() {
        super();
        this.state = {
            height: 60,
            router: {interfaces:[],hostname:"",vendor:"",model:""}
        }
        this.history = [];
    }

    componentDidMount(prevProps, prevState) {
        this.handleParentResize();
    }

    componentDidUpdate(prevProps, prevState) {
    }

    handleCloseButton(e) {
        this.props.close();
    }

    handleFoldButton() {
        if(this.resizableBox.state.height === 60) {
            let oldHeight = localStorage.getItem("router-view.height");
            if(!oldHeight)
                oldHeight = 600;
            else
                oldHeight = +oldHeight;

            this.resizableBox.setState({height: oldHeight});
            this.forceUpdate();
        }
        else {
            localStorage.setItem("router-view.height", `${this.resizableBox.state.height}`);
            this.resizableBox.setState({height: 60});
        }
    }

    handleParentResize(e) {
        if(!this.resizableBox)
            return;
        let dirty = false;
        let parent = ReactDOM.findDOMNode(this).parentNode;
        if(parent.clientHeight < this.resizableBox.state.height + 84) {
            this.resizableBox.setState({height: parent.clientHeight - 88});
            dirty = true;
        }
        if(parent.clientWidth < this.resizableBox.state.width + 200) {
            this.resizableBox.setState({width: parent.clientWidth - 240});
            dirty = true;
        }
        if(dirty)
            this.forceUpdate();
    }

    handleResize(e, data) {
        localStorage.setItem("router-view.size", `{"width":${data.size.width},"height":${data.size.height}}`)
        this.forceUpdate();
    }

    onRowClick(a, b, c) {
        //console.log(a, b, c);
    }

    expandComponent(row) {
        const rows = row.extra.map((n, i)=>{
            return <pre key={`extra-${i}`} className="extra-row">{n}</pre> 
        });

        return <div style={{textAlign:"left"}}>{rows}</div>
    }

    expandComponent2(row) {
        return <div style={{textAlign:"left"}}>
            <pre className="extra-row">
                {JSON.stringify(row, null, 4)}
            </pre>
        </div>
    }

    getRouterInterfaces(n) {
        if(Array.isArray(n.interfaces)) {
            return n.interfaces.map(intf=>{
                return {
                    name: intf.id,
                    description: intf.description
                }
            })
        }
        else {
            let iNames = Object.getOwnPropertyNames(n.interfaces);
            return iNames.map(iName=>{
                return {
                    name: iName,
                    description: n.interfaces[iName].description
                }
            })
        }
    }

    getRouterDetailNames(n) {
        return Object.getOwnPropertyNames(n).filter(name=>{return 'object' === typeof n[name]});
    }

    getRouterTabs(n) {
        let tabs = Object.getOwnPropertyNames(n).filter(name=>{return 'object' === typeof n[name]});
        tabs.push('image');
        tabs.push('raw data');
        return <Nav bsStyle="tabs">
            {tabs.map((name, ii)=>{
                return <NavItem key={ii} eventKey={'tab'+ii}>{name}</NavItem>
            })}
        </Nav>
    }

    getRouterTabPane(n, name, boxSize) {
        if(name === 'image') {
            let src = n.model ? `/img/models/${n.vendor}/${n.model.replace(/\W+/g, '')}.png` : '/img/router.jpg';
            return <div className="router-image-box" style={{height: (boxSize.height - 100) + "px"}}>
                <img className="router-image" src={src} alt={n.model} />
            </div>
        }

        if(name === 'raw data') {
            return <div className="router-all-box" style={{height: (boxSize.height - 100) + "px"}}>
                <div className="router-all-text">{JSON.stringify(n, null, 4)}</div>
            </div>
        }

        const columns = COLUMNS[name];
        const rowClassNameFormat = (row, rowIdx) => {
            let d = row.description;
            if(d && d.length > 2) {
                d = d.slice(0, 3).toUpperCase();
                if(["RES", "_RE", "NP ",  "NP_", "_RS", "VAC", "***"].indexOf(d) !== -1)
                    return 'td-row-reserved';
            }
            return (row.shutdown || row.disable !== undefined) ? 'td-row-shutdown' : 'td-row-active';
        }

        let rows = n[name];
        if(!Array.isArray(rows)) {
            let pnames = Object.getOwnPropertyNames(rows);
            let tmp = pnames.map(pn=>{
                let o = Object.assign({}, rows[pn]);
                o.id = pn;
                columns.forEach(c=>{
                    if(!o.hasOwnProperty(c.prop) && c.func)
                        o[c.prop] = c.func(o);
                })
                return o;
            })
            rows = tmp;
        }

        return <Table 
            data={rows}
            ref={(x) => { this.tabTable = x; }}
            height={boxSize.height - 100}
            scrollTop={'Top'}
            trClassName={rowClassNameFormat}
            options={{expandRowBgColor: 'rgb(220, 220, 220)'}}
            expandableRow={()=>true}
            expandComponent={this.expandComponent2.bind(this)}
            expandColumnOptions={{expandColumnVisible: true}}
            striped hover >
                {columns.map((col, ii)=>{
                    //console.log(col, ii)
                    return <TCol key={ii} width={col.width||'100'} isKey={ii===0} dataSort={true} dataField={col.prop}>{col.label}</TCol>
                })}
        </Table>

    }

    getRouterTabPanes(n, boxSize) {
        let tabs = Object.getOwnPropertyNames(n).filter(name=>{return 'object' === typeof n[name]});
        tabs.push('image');
        tabs.push('raw data');

        return (
            <TabContent>
                {tabs.map((name, ii)=>{
                    return <TabPane key={ii} eventKey={'tab'+ii} >
                        {this.getRouterTabPane(n, name, boxSize)}
                    </TabPane>
                })}
            </TabContent>
        )
    }

    render() {
        const n = this.context.routers.find(r=>r.hostname===this.props.router) || {};

        if(n.hostname) {
            if(this.history.length === 0 || this.history[0] !== n.hostname)
                this.history.unshift(n.hostname);
            if(this.history.length > 100)
                this.history.length = 100;
        }

        let boxSize = localStorage.getItem("router-view.size");
        if(!!boxSize)
            boxSize = JSON.parse(boxSize);
        else
            boxSize = {width:400,height:300};

        return (
            <ResizableBox
                ref={(x) => { this.resizableBox = x; }}
                className="location-view box" 
                minConstraints={[300, 300]} 
                maxConstraints={[1200, 900]}
                onResize={this.handleResize.bind(this)}
                width={boxSize.width} 
                height={boxSize.height} >
                <Panel id="router-interfaces" >
                    <Panel.Heading>
                        <span>
                            <span className="my-header">{(n.hostname || "Select router")}</span>
                            <Button 
                                id="btn-fold"
                                bsClass="close" 
                                ref={(x)=>{ this.foldBtn=x;}} 
                                onClick={this.handleFoldButton.bind(this)}
                                style={{transform: 'rotate(' + (this.state.height === 60 ? 270 : 90) + 'deg)'}}>
                                <span aria-hidden="true">&rsaquo;</span>
                            </Button>
                            <Button 
                                id="btn-close"
                                bsClass="close"
                                ref={(x)=>{ this.closeBtn=x;}} 
                                onClick={this.handleCloseButton.bind(this)} >
                                <span aria-hidden="true">x</span>
                            </Button>
                        </span>
                    </Panel.Heading>
                    <TabContainer id="router-details-tabs" defaultActiveKey="tab0">
                        <div>
                            {this.getRouterTabs(n)}
                            {this.getRouterTabPanes(n, boxSize)}
                        </div>
                    </TabContainer>
                </Panel>
            </ResizableBox>
        );
    }
}

RouterDetailsView.propTypes = {
    router: PropTypes.string,
    close: PropTypes.func
}

RouterDetailsView.contextTypes = {
    network: PropTypes.string,
    links: PropTypes.array,
    locations: PropTypes.object,
    routers: PropTypes.array,
    ips: PropTypes.array,
}


export default RouterDetailsView;
