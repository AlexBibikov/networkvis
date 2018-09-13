import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';

import { ResizableBox } from 'react-resizable';
import { Panel, Button } from 'react-bootstrap';
import { BootstrapTable as Table, TableHeaderColumn as TCol }  from 'react-bootstrap-table';

import './GeoLocationView.css';

class GeoLocationView extends Component {

    constructor() {
        super();
        this.state = {
            height: 60,
            routers: []
        }
        this.history = [];
    }

    updateRouters() {
        this.setState({routers: []});
        this.props.location.routers.forEach(hostname=>{
            this.setState({
                routers: this.props.routers.filter(r=>r.location === this.props.location.name).map(r => {
                    return {
                        name: r.hostname,
                        vendor: r.vendor,
                        model: r.model
                    }
                })
            })
        })
    }

    componentDidMount(prevProps, prevState) {
        this.handleParentResize();
        this.updateRouters();
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.location !== this.props.location)
            this.updateRouters();
    }


    handleNextRouterClick(e) {
        this.props.selectLocation(e.target.textContent);
    }

    handleCloseButton(e) {
        this.props.close();
    }

    handleFoldButton() {
        if(this.resizableBox.state.height === 60) {
            let oldHeight = sessionStorage.getItem("location-view.height");
            if(!oldHeight)
                oldHeight = 600;
            else
                oldHeight = +oldHeight;

            this.resizableBox.setState({height: oldHeight});
            this.forceUpdate();
        }
        else {
            sessionStorage.setItem("location-view.height", `${this.resizableBox.state.height}`);
            this.resizableBox.setState({height: 60});
        }
    }

    handleBackButton() {
        if(this.history.length > 1) {
            let n = this.history.shift();
            n = this.history.shift();
            this.props.selectLocation(n);
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
        sessionStorage.setItem("location-view.size", `{"width":${data.size.width},"height":${data.size.height}}`)
        this.forceUpdate();
    }

    onRowClick(row) {
        this.props.selectRouter(row.name);
    }

    render() {
        const n = this.props.location || {name:''};
        if(n.name) {
            if(this.history.length === 0 || this.history[0] !== n.name)
                this.history.unshift(n.name);
            if(this.history.length > 100)
                this.history.length = 100;
        }

        const fullLoc = this.props.locations[n.name];
        let loc = [
            fullLoc ? fullLoc.address_components.formatted_street : '',
            fullLoc ? fullLoc.address_components.city : '',
            fullLoc ? fullLoc.address_components.state : ''
        ];
            
        let listItems = this.state.routers;

        const detailsText = <div>
                <div>Routers in {n.name||"selected"} location ( {loc.join(', ')} )</div>
            </div>;

        let boxSize = sessionStorage.getItem("location-view.size");
        if(!!boxSize)
            boxSize = JSON.parse(boxSize);
        else
            boxSize = {width:400,height:300};

        const options = {
            onRowClick: this.onRowClick.bind(this)
        };

        return (
            <ResizableBox
                ref={(x) => { this.resizableBox = x; }}
                className="location-view box" 
                minConstraints={[300, 300]} 
                maxConstraints={[1200, 900]}
                onResize={this.handleResize.bind(this)}
                width={boxSize.width} 
                height={boxSize.height} >
                <Panel id="location-routers" >
                    <Panel.Heading>
                        <span>
                            <Button 
                                id="btn-back"
                                bsClass="close" 
                                ref={(x)=>{ this.backBtn=x;}}
                                onClick={this.handleBackButton.bind(this)} >
                                <span aria-hidden="true">&#171;</span>
                            </Button>
                            <span className="my-header">{(n.name || "Select location")}</span>
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
                    <div className="location-view-details">
                        {detailsText}
                    </div>
                    <Table 
                        ref={(x)=>{ this.table=x;}}
                        data={listItems}
                        height={boxSize.height - 130}
                        scrollTop={'Bottom'}
                        options={options}
                        striped hover >
                            <TCol isKey dataField='name'>Router Name</TCol>
                            <TCol dataField='vendor'>Vendor</TCol>
                            <TCol dataField='model'>Model</TCol>
                    </Table>
                </Panel>
            </ResizableBox>
        );
    }
}

GeoLocationView.propTypes = {
    network: PropTypes.string,
    location: PropTypes.object,
    locations: PropTypes.object,
    routers: PropTypes.array,
    selectLocation: PropTypes.func,
    selectRouter: PropTypes.func,
    close: PropTypes.func
}

export default GeoLocationView;
