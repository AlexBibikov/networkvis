import React, { Component } from 'react';
//import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { FormGroup, InputGroup, DropdownButton, MenuItem, Glyphicon } from 'react-bootstrap'

import Autosuggest from 'react-bootstrap-autosuggest';

import './Header.css';

import { MENU_ITEMS, MENU_ITEM_TYPES } from './utils.js';
//import config from './config';

class MenuItemPlus extends MenuItem {

    convert(input) {
        return input.replace(/&#(\d+);/g, function(match, p1) {
            var charcode = parseInt(p1, 10);
            return String.fromCharCode(charcode);
        });
    }

    createIcon(name) {
        if(!name)
            return (<span>&nbsp;</span>)    //  empty space
        else if(name.indexOf("glyph/") === 0)
            return  (<Glyphicon glyph="globe" />)
        else if (name.indexOf("img/") === 0)
            return (<img style={{height:'24px'}} src={name} alt="" />)
        else
            return (<span>{this.convert(name)}</span>);     // convert charcode string to character
    }

    render() {
        return (
            <MenuItem 
                eventKey={this.props.mi.eventKey} 
                active={this.props.active}
                disabled={this.props.mi.disabled === true}
                onSelect={(a, b, c)=>{
                    this.context.handleMenu(this.props.mi.eventKey, this.props.mi);
                }}>
                <span className="menu-icon">
                    {this.createIcon(this.props.mi.icon)}
                </span>
                {this.props.mi.title}
                <span className="hot-key">
                    {this.props.mi.hotKey}
                </span>
            </MenuItem>
        )
    }
}

// Property types
MenuItemPlus.propTypes = {
    mi: PropTypes.object,
    active: PropTypes.bool
}

MenuItemPlus.contextTypes = {
  handleMenu: PropTypes.func
}


class Header extends Component {

    constructor() {
        super();
        this.state = {}
    }

    redraw() {
        this.forceUpdate();
    }

    getChildContext() {
        return {
            handleMenu: this.handleMenu.bind(this)
        }
    }

    handleMenu(key, menuItem) {
        this.props.handleComand(key, menuItem);
    }

    selectItem(name) {
        //console.log(`selectItem(${name};)`)
        this.props.handleSelectItem(name);
    }

    componentDidUpdate(prevProps, prevState) {
    }

    showProgress() {
        if(!this.state.progress)
            return null;

        return <h1 className='progress-label'>{`${this.state.progress}%`}</h1>
    }

    onSelect(x) {
        this.props.handleSelectItem(x);
    }

    onProgress(x) {
        this.setState({progress: x});
    }

    onProgressDone() {
        this.setState({progress: null})
    }

    menuItems(items) {
        
        return items.map((mi, ii)=>{
            if(mi.type === MENU_ITEM_TYPES.DIVIDER)
                return <MenuItem key={ii} divider />
            else if (mi.type === MENU_ITEM_TYPES.SUBMENU) {

                return (<li key={ii} role="presentation" className="dropdown-submenu pull-left">
                    <a className="dropdown-toggle" data-toggle="dropdown">{(mi.title||"Select")}</a>
                    <ul className="dropdown-menu">
                        {this.menuItems(mi.items)}
                    </ul>
                </li>)
            }
            else if (mi.type === MENU_ITEM_TYPES.ITEM)
                return <MenuItem 
                            key={ii}
                            eventKey={mi.eventKey} 
                            active={ mi.isActive &&  ( this.context[mi.isActive] === mi.value ) }
                            disabled={ (mi.disabled === true) }
                            onSelect={this.handleMenu.bind(this, mi.eventKey, mi)}>
                            {(mi.title||"")}
                        </MenuItem>
            else if (mi.type === MENU_ITEM_TYPES.ITEM_PLUS)
                return <MenuItemPlus 
                            key={ii} 
                            mi={mi} 
                            active={ mi.isActive &&  ( this.context[mi.isActive] === mi.value ) } />
            else
                return <MenuItem 
                            key={ii}>
                            {`Unknown meny type ${mi.type} for menu ${mi.title}`}
                        </MenuItem>
        });
    }

    render() {
        let placeholder = "select";
        var items = [];
        switch(this.context.viewAs) {
            case '0':
            case '1': {
                items = Object.getOwnPropertyNames(this.context.locations).sort(); 
                placeholder = "select location";
                break;
            }
            default: {
                items = this.context.routers.map(r=>r.hostname).sort();
                placeholder = "select router";
                break;
            }
        }
                
        return(
            <div className="App-header">
                <div className="network-label">{this.context.network}</div>
                {this.showProgress()}
                <FormGroup id="search-box" controlId="routerInput">
                    <InputGroup>
                        <Autosuggest
                            datalist={items}
                            datalistOnly
                            placeholder={placeholder}
                            addonBefore='&#9997;'
                            onSelect={this.onSelect.bind(this)} />
                    </InputGroup>
                </FormGroup>
                <span id="burger">
                    <DropdownButton id="burger-menu" bsStyle="default" title="&equiv;" noCaret pullRight>
                        {this.menuItems(MENU_ITEMS)}
                    </DropdownButton>
                </span>
            </div>        
        )
    }
}

Header.propTypes = {
    handleSelectItem: PropTypes.func,
    handleComand: PropTypes.func
}

Header.contextTypes = {
    network: PropTypes.string,
    viewAs: PropTypes.string,
    links: PropTypes.array,
    locations: PropTypes.object,
    routers: PropTypes.array,
    ips: PropTypes.array,
}

Header.childContextTypes = {
    handleMenu: PropTypes.func
}

export default Header;
