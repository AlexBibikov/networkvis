import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';

import { ResizableBox } from 'react-resizable';
import { Panel, Button } from 'react-bootstrap';
import { BootstrapTable as Table, TableHeaderColumn as TCol }  from 'react-bootstrap-table';

import './RouterView.css';

class RouterView extends Component {

    constructor() {
        super();
        this.state = {
            visible: false,
        }
        this.history = [];
    }

    componentDidMount(prevProps, prevState) {
        if (!!this.state.visible) {
            this.handleParentResize();
        }
    }

    handleNextRouterClick(e) {
        this.props.selectRouter(e.target.textContent);
    }

    handleCloseButton(e) {
        this.setState({visible: false});
    }

    handleFoldButton() {
        if(this.resizableBox.state.height === 60) {
            let oldHeight = sessionStorage.getItem("router-view.height");
            if(!oldHeight)
                oldHeight = 600;
            else
                oldHeight = +oldHeight;

            this.resizableBox.setState({height: oldHeight});
            this.forceUpdate();
        }
        else {
            sessionStorage.setItem("router-view.height", `${this.resizableBox.state.height}`);
            this.resizableBox.setState({height: 60});
        }
    }

    handleBackButton() {
        if(this.history.length > 1) {
            let n = this.history.shift();
            n = this.history.shift();
            this.props.selectRouter(n);
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
        sessionStorage.setItem("router-view.size", `{"width":${data.size.width},"height":${data.size.height}}`)
        this.forceUpdate();
    }

    linkFormatter(cell, row, enumObject, index) {
        const t = this.props.topology;
        const r = t ? t.nodes.find(n=>n.name===cell) : null;
        return (
            !!r ?
            <span
                className={r.core?"core":"edge"}
                onClick={this.props.selectRouter.bind(this, cell)}>
                {cell}
            </span> : 
            <span>
                {cell}
            </span>);
    }

    show() {
        this.setState({visible: true});
    }

    hide() {
        this.setState({visible: false});
    }

    render() {
        if(!this.state.visible)
            return <div id="empty" style={{width: this.state.width,height:this.state.height,pointerEvents:'none'}}/>

        const n = this.props.node || {};
        if(n.name) {
            if(this.history.length === 0 || this.history[0] !== n.name)
                this.history.unshift(n.name);
            if(this.history.length > 100)
                this.history.length = 100;
        }
        const listItems = n.interfaces ? n.interfaces: [];

        let boxSize = sessionStorage.getItem("router-view.size");
        if(!!boxSize)
            boxSize = JSON.parse(boxSize);
        else
            boxSize = {width:400,height:300};

        return (
            <ResizableBox
                ref={(x) => { this.resizableBox = x; }}
                className="router-view box" 
                minConstraints={[300, 300]} 
                maxConstraints={[1200, 900]}
                onResize={this.handleResize.bind(this)}
                width={boxSize.width} 
                height={boxSize.height} >
                <Panel
                    id="router-interfaces" 
                    header={
                        <span>
                            <Button 
                                id="btn-back"
                                bsClass="close" 
                                ref={(x)=>{ this.backBtn=x;}}
                                onClick={this.handleBackButton.bind(this)} >
                                <span aria-hidden="true">&#171;</span>
                            </Button>
                            <span className="my-header">{(n.name || "Select router")}</span>
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
                    }>
                    <div className="router-view-details">
                        {`Interfaces for ${n.vendor||"selected"} router (${n.ip||"no loopback"})`}
                    </div>
                    <Table 
                        ref={(x)=>{ this.table=x;}}
                        data={listItems}
                        height={boxSize.height - 130}
                        scrollTop={'Bottom'}
                        striped hover >
                            <TCol isKey dataField='name'>Interface Name</TCol>
                            <TCol dataField='ip'>IP Address</TCol>
                            <TCol dataField='next' dataFormat={this.linkFormatter.bind(this)}>Next Router</TCol>
                    </Table>
                </Panel>
            </ResizableBox>
        );
    }
}

RouterView.propTypes = {
    node: PropTypes.object,
    topology: PropTypes.object,
    selectRouter: PropTypes.func
}

export default RouterView;
