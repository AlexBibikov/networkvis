import React from 'react';
//import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';

//import events from 'dom-helpers/events'; // warning workaround

import { 
    FormGroup, 
    Modal,
    Form,
    Col,
    Button,
    ControlLabel } from 'react-bootstrap'

import Autosuggest from 'react-bootstrap-autosuggest';

export default class FindRouterDialog extends React.Component {

    constructor() {
        super();
        this.state = {
            countries: [],
            routers: [],
            loc3: '',
            rname: ''
        }
    }

    _extractCountryNames() {
        let t = this.props.topology;
        let countries = t ? t.nodes
        .map(n => n.loc3)
        .reduce((p, c) => {
            if(c && p.indexOf(c) < 0)
                p.push(c); 
            return p; }, ["*"])
        .sort() : [];

        this.setState({
            countries: countries,
            loc3: null
        });
    }

    _extractRouterNames() {
        let t = this.props.topology;
        let routerNames = t ? t.nodes
            .filter(n => {
                const z = this.state.loc3;
                return z && z !== "*" ? n.loc3 === z : !!n.loc1;
            })
            .map(n=>n.name)
            .sort() : [];

        this.setState({
            routers: routerNames,
            rname: ''
        });
    }

    componentDidMount() {
        if(this.props.topology) {
            this._extractCountryNames();
        }
    }

    componentWillUnmount() {
        //events.off(window, 'resize', this.handleWindowResize);
    }

    componentDidUpdate(prevProps, prevState) {
        if(prevProps.topology !== this.props.topology) {
            this._extractCountryNames();
        }
        if(prevState.loc3 !== this.state.loc3) {
            this._extractRouterNames();
        }

    }

    render() {
        const senf = this;
        let onSelect = (name) => { 
            this.setState({rname: name});
            if(name)
                senf.props.onSelect(name); 
        }
        let closeDialog = () => {
            senf.props.onSelect(); 
        }

        return (
            <Modal 
                show={senf.props.visible} 
                onHide={closeDialog} 
                container={senf} 
                aria-labelledby="contained-modal-title">

                <Modal.Header closeButton>
                <Modal.Title id="contained-modal-title">Select Router</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <Form id="select-router" horizontal>
                        <FormGroup controlId="router">
                            <Col componentClass={ControlLabel} sm={4}>Country</Col>
                            <Col sm={6}>
                                <Autosuggest
                                    datalist={this.state.countries}
                                    value={this.state.loc3}
                                    datalistOnly
                                    placeholder="select country" 
                                    addonBefore='&#9997;'
                                    onSelect={name=>senf.setState({loc3:name})} />
                            </Col>
                        </FormGroup>
                        <FormGroup controlId="router">
                            <Col componentClass={ControlLabel} sm={4}>Router Name</Col>
                            <Col sm={6}>
                                <Autosuggest
                                    datalist={this.state.routers}
                                    value={this.state.rname}
                                    datalistOnly
                                    placeholder="select router" 
                                    addonBefore='&#9997;'
                                    onSelect={onSelect} />
                            </Col>
                        </FormGroup>
                    </Form>
                </Modal.Body>

                <Modal.Footer>
                    <Button onClick={closeDialog}>OK</Button>
                </Modal.Footer>

            </Modal>
        );
    }
}


FindRouterDialog.propTypes = {
    topology: PropTypes.object,
    visible: PropTypes.bool,
    onSelect: PropTypes.func
}
