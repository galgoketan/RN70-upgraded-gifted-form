import React from 'react';
import createReactClass from 'create-react-class';
import {
  View,
  Text,
  TouchableHighlight,
  Image,
  PixelRatio,
  Appearance,
  AppState
} from 'react-native';
import ImageResizeMode from 'react-native/Libraries/Image/ImageResizeMode'

var WidgetMixin = require('../mixins/WidgetMixin.js');



module.exports = createReactClass({
  mixins: [WidgetMixin],
  
  getDefaultProps() {
    return ({
      // onChange: null,
      type: 'OptionWidget',
    });
  },

  componentWillMount() {
    this.appStateSubscription =  AppState.addEventListener("change",async () => {
      this.setState({scheme: Appearance.getColorScheme()});
    });
  },

  componentWillUnmount() {
    this.appStateSubscription.remove();
  },

  getInitialState() {
    return {
      scheme: Appearance.getColorScheme()
    }
  },
  
  _renderCheckmark() {
    if (this.state.value === true) {
      return (
        <Image
          style={this.getStyle('checkmark')}
          resizeMode={ImageResizeMode.contain}
          source={require('../icons/check.png')}
        />
      );
    }
    return null;
  },
  
  _onClose() {
    if (this.props.multiple === false) {
      this.props.unSelectAll();
      this._onChange(true);
      
      if (typeof this.props.onSelect === 'function') {
        // console.log('onSelect');
        this.props.onSelect(this.props.value);
      }
      
      if (typeof this.props.onClose === 'function') {
        this.props.onClose(this.props.title, this.props.navigator);
      }
    } else {
      this._onChange(!this.state.value)
    }
  },
  
  render() {
    return (
      <View style={[this.getStyle('rowContainer'), {backgroundColor: this.state.scheme === 'dark' ? 'rgb(44, 43, 43)' : '#FFF'}]}>
        <TouchableHighlight
          onPress={this._onClose}
          underlayColor={this.getStyle('underlayColor').pop()}
          {...this.props} // mainly for underlayColor
        >
          <View style={this.getStyle('row')}>
            {this._renderImage()}
            <Text numberOfLines={1} style={[this.getStyle('switchTitle'), {color: this.state.scheme === 'dark' ? '#FFF' : '#000'}]}>
              {this.props.title}
            </Text>
            {this._renderCheckmark()}
          </View>        
        </TouchableHighlight>
      </View>
    );
  },
  
  defaultStyles: {
    rowImage: {
      height: 20,
      width: 20,
      marginLeft: 10,
    },
    checkmark: {
      width: 23,
      marginRight: 10,
      marginLeft: 10,
    },
    rowContainer: {
      backgroundColor: '#FFF',
      borderBottomWidth: 1 / PixelRatio.get(),
      borderColor: '#c8c7cc',
    },
    row: {
      flexDirection: 'row',
      height: 44,
      alignItems: 'center',
    },
    underlayColor: '#c7c7cc',
    switchTitle: {
      fontSize: 15,
      color: '#000',
      flex: 0.7,
      paddingLeft: 10,
    },
  },
});

