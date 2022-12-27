import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import {
  View,
  Text,
  TouchableHighlight,
  Navigator,
  Image,
  TouchableOpacity,
  PixelRatio,
  Appearance,
  AppState
} from 'react-native';
import ImageResizeMode from 'react-native/Libraries/Image/ImageResizeMode'

var WidgetMixin = require('../mixins/WidgetMixin');
var ContainerMixin = require('../mixins/ContainerMixin');

var GiftedFormManager = require('../GiftedFormManager');
var TimerMixin = require('react-timer-mixin');

var moment = require('moment');

module.exports = createReactClass({
  mixins: [TimerMixin, WidgetMixin],

  getDefaultProps() {
    return {
      type: 'ModalWidget',
      scrollEnabled: true,
      disclosure: true,
      cancelable: false,
      displayValue: '',
      onClose: () => {},
      selectedValue:'',
      selectedValueType:'',
    };
  },

  componentWillUnmount() {
    this.appStateSubscription.remove();
  },

  propTypes: {
    type: PropTypes.string,
    scrollEnabled: PropTypes.bool,
    disclosure: PropTypes.bool,
    cancelable: PropTypes.bool,
    displayValue: PropTypes.string,
    onClose: PropTypes.func,
    selectedValue: PropTypes.string,
    selectedValueType: PropTypes.string
  },

  getInitialState() {
    return {
      // @todo
      // should be an object with all status
      // childrenAreValid: {},
      scheme: Appearance.getColorScheme()
    };
  },

  renderDisclosure() {
    if (this.props.disclosure === true) {
      return (
        <Image
          style={this.getStyle('disclosure')}
          resizeMode={ImageResizeMode.contain}
          source={require('../icons/disclosure.png')}
        />
      );
    }
    return null;
  },

  onPress() {

    // title={this.props.title} // @todo working  ?

    var _self = this;

    var GiftedFormModal = createReactClass({
      mixins: [ ContainerMixin ],
    
      getDefaultProps() {
        return {
          isModal: true,
        };
      },
    
      propTypes: {
        isModal: PropTypes.bool,
      },
    
      render() {
        return this._renderContainerView();
      },
    });


    var route = {
      onClose: _self.onClose,
      renderScene(navigator) {
        // not passing onFocus/onBlur of the current scene to the new scene
        var {onFocus, onBlur, ...others} = _self.props;

        return (
          <GiftedFormModal
            {...others}

            navigator={navigator}
            isModal={true}
            children={_self._childrenWithProps}
          />
        );
      },
      getTitle() {
        return _self.props.title || '';
      },
      configureScene() {
        var sceneConfig = Navigator.SceneConfigs.FloatFromBottom;
        // disable pop gesture
        sceneConfig.gestures = {};
        return sceneConfig;
      },
      renderLeftButton(navigator) {
        if (_self.props.cancelable === true) {
          return (
            <TouchableOpacity
              onPress={() => {
                _self.requestAnimationFrame(() => {
                  _self.onClose(null, navigator);
                });
              }}
            >
              <Image
                style={{
                  width: 21,
                  marginLeft: 10,
                  tintColor: '#097881',
                }}
                resizeMode={ImageResizeMode.contain}
                source={require('../icons/close.png')}
              />
            </TouchableOpacity>
          );
        }
        return null;
      },
      renderRightButton(navigator) {
        // @todo other solution than onBack ? maybe do something automatically when scene get focus
        // @todo move button style to themes
        return (
          <TouchableOpacity
            onPress={() => {
              _self.requestAnimationFrame(() => {
                _self.onClose(null, navigator);
              });
            }}
          >
            <Image
              style={{
                width: 21,
                marginRight: 10,
                tintColor: '#097881',
              }}
              resizeMode={ImageResizeMode.contain}
              source={require('../icons/check.png')}
            />
          </TouchableOpacity>
        );
      },
    };

    // console.log('this.props.openModal from modal widget');
    // console.log(typeof this.props.openModal);

    if (this.props.openModal === null) {
      console.warn('GiftedForm: openModal prop is missing in GiftedForm component');
    } else {
      this.props.openModal(route);
    }
  },

  componentWillMount() {
    this.appStateSubscription =  AppState.addEventListener("change",async () => {
      this.setState({scheme: Appearance.getColorScheme()});
    });
    this._childrenWithProps = React.Children.map(this.props.children, (child) => {
      return React.cloneElement(child, {
        formStyles: this.props.formStyles,
        openModal: this.props.openModal,
        formName: this.props.formName,
        navigator: this.props.navigator,
        onFocus: this.props.onFocus,
        onBlur: this.props.onBlur,
        onValidation: this.props.onValidation,
        onValueChange: this.props.onValueChange,

        onClose: this.onClose,
      });
    });
  },

  componentDidMount() {
    this.setState({
      value: this.props.selectedValue,
    });
    this._onChange(this.props.selectedValue,true,this.props.selectedValueType)
  },

  onClose(value, navigator = null) {
    if (typeof value === 'string') {
      this.setState({
        value: value,
      });
    } else if (this.props.displayValue !== '') {
      this.setState({
        value: this._getDisplayableValue(),
      });
    }

    if (navigator !== null) {
      navigator.pop();
    }

    this.props.onClose && this.props.onClose();
  },

  refreshDisplayableValue() {
    this.setState({
      value: this._getDisplayableValue(),
    });
  },

  _getDisplayableValue() {
    if (this.props.displayValue !== '') {
      if (typeof GiftedFormManager.stores[this.props.formName] !== 'undefined') {
        if (typeof GiftedFormManager.stores[this.props.formName].values !== 'undefined') {
          if (typeof GiftedFormManager.stores[this.props.formName].values[this.props.displayValue] !== 'undefined') {
            if (typeof this.props.transformValue === 'function') {
              return this.props.transformValue(GiftedFormManager.stores[this.props.formName].values[this.props.displayValue]);
            } else if (GiftedFormManager.stores[this.props.formName].values[this.props.displayValue] instanceof Date) {
              return moment(GiftedFormManager.stores[this.props.formName].values[this.props.displayValue]).calendar(null, {
                sameDay: '[Today]',
                nextDay: '[Tomorrow]',
                nextWeek: 'dddd',
                lastDay: '[Yesterday]',
                lastWeek: '[Last] dddd'
              });
            }
            if (typeof GiftedFormManager.stores[this.props.formName].values[this.props.displayValue] === 'string') {
              return GiftedFormManager.stores[this.props.formName].values[this.props.displayValue].trim();
            }
          } else {
            // @todo merge with when not select menu

            // when values[this.props.displayValue] is not found
            // probably because it's a select menu
            // options of select menus are stored using the syntax name{value}, name{value}
            var values = GiftedFormManager.getValues(this.props.formName);
            if (typeof values === 'object') {
              if (typeof values[this.props.displayValue] !== 'undefined') {
                if (typeof this.props.transformValue === 'function') {
                  return this.props.transformValue(values[this.props.displayValue]);
                } else {
                  if (Array.isArray(values[this.props.displayValue])) {
                    // @todo
                    // should return the title and not the value in case of select menu
                    return values[this.props.displayValue].join(', ');
                  } else if (values[this.props.displayValue] instanceof Date) {
                    return moment(values[this.props.displayValue]).calendar(null, {
                      sameDay: '[Today]',
                      nextDay: '[Tomorrow]',
                      nextWeek: 'dddd',
                      lastDay: '[Yesterday]',
                      lastWeek: '[Last] dddd'
                    });
                  } else {
                    return values[this.props.displayValue];
                  }
                }
              }
            }
          }
        }
      }
    }
    return '';
  },

  render() {
    return (
      <TouchableHighlight
        onPress={() => {
          this.requestAnimationFrame(() => {
            this.onPress();
          });
        }}
        underlayColor={this.getStyle('underlayColor').pop()}

        {...this.props} // mainly for underlayColor

        style={[this.getStyle('rowContainer'), {backgroundColor: this.state.scheme === 'dark' ? 'rgb(44, 43, 43)' : '#FFF'}]}
      >
        <View style={this.getStyle('row')}>
          {this._renderImage()}
          <Text numberOfLines={1} style={[this.getStyle('modalTitle'), {color: this.state.scheme === 'dark' ? '#FFF' : '#000'}]}>{this.props.title}</Text>
          <View style={this.getStyle('alignRight')}>
            <Text numberOfLines={1} style={this.getStyle('modalValue')}>{this.state.value}</Text>
          </View>
          {this.renderDisclosure()}
        </View>
      </TouchableHighlight>
    );
  },

  defaultStyles: {
    rowImage: {
      height: 20,
      width: 20,
      marginLeft: 10,
    },
    rowContainer: {
      backgroundColor: '#FFF',
      borderBottomWidth: 1 / PixelRatio.get(),
      borderColor: '#c8c7cc',
    },
    underlayColor: '#c7c7cc',
    row: {
      flexDirection: 'row',
      height: 44,
      alignItems: 'center',
    },
    disclosure: {
      // transform: [{rotate: '90deg'}],
      marginLeft: 10,
      marginRight: 10,
      width: 11,
    },
    modalTitle: {
      flex: 1,
      fontSize: 15,
      color: '#000',
      paddingLeft: 10,
    },
    alignRight: {
      alignItems: 'flex-end',
      // width: 110,
    },
    modalValue: {
      fontSize: 15,
      color: '#c7c7cc',
    },
  },
});
