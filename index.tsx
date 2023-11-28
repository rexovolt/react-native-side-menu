import React, { ReactNode } from 'react';
import {
  PanResponder,
  View,
  Dimensions,
  Animated,
  TouchableWithoutFeedback,
  ViewStyle,
  GestureResponderEvent,
  type PanResponderInstance,
} from 'react-native';
import PropTypes from 'prop-types';
import styles from './styles';

type WindowDimensions = { width: number, height: number };

interface ReactNativeSideMenuProps {
  /**
   * Menu component
   */
  menu: ReactNode;
  /**
   * Props driven control over menu open state
   * @default false
   */
  isOpen?: boolean;
  /**
   * Content view left margin if menu is opened
   */
  openMenuOffset?: number;
  /**
   * Content view left margin if menu is hidden
   */
  hiddenMenuOffset?: number;
  /**
   * Edge distance on content view to open side menu, defaults to 60
   */
  edgeHitWidth?: number;
  /**
   * X axis tolerance
   */
  toleranceX?: number;
  /**
   * Y axis tolerance
   */
  toleranceY?: number;
  /**
   * Disable whether the menu can be opened with gestures or not
   * @default false
   */
  disableGestures?: boolean;
  /**
   * Function that accepts event as an argument and specify if side-menu should react on the touch or not.
   * Check https://facebook.github.io/react-native/docs/gesture-responder-system.html for more details
   */
  onStartShouldSetResponderCapture?: (e: GestureResponderEvent) => boolean;
  /**
   * Callback on menu open/close. Is passed isOpen as an argument
   */
  onChange?: (isOpen: boolean) => void;
  /**
   * Callback on menu move. Is passed left as an argument
   */
  onMove?: (left: number) => void;
  /**
   * Callback when menu is sliding. It returns a decimal from 0 to 1 which represents the percentage of menu offset between hiddenMenuOffset and openMenuOffset.
   */
  onSliding?: (fraction: number) => void;
  /**
   * @default left
   */
  menuPosition?: 'left' | 'right';
  animationFunction?: (prop: Animated.Value, value: number) => Animated.CompositeAnimation;
  animationStyle?: (value: number) => ViewStyle;
  /**
   * Callback when menu animation has completed.
   */
  onAnimationComplete?: (event: Animated.EndCallback) => void;
  /**
   * When true, content view will bounce back to openMenuOffset when dragged further
   * @default true
   */
  bounceBackOnOverdraw?: boolean;
  /**
   * When true, menu close automatically as soon as an event occurs
   * @default true
   */
  autoClosing?: boolean;
  /**
   * When true, press events on the overlay can be propagated to the buttons inside your page
   * @default false
   */
  allowOverlayPressPropagation?: boolean;
  /**
   * Page overlay color when sidebar open
   * @default transparent
   */
  overlayColor?: string;
  children?: ReactNode;
}

type Event = {
  nativeEvent: {
    layout: {
      width: number,
      height: number,
    },
  },
};

type State = {
  width: number,
  height: number,
  openOffsetMenuPercentage: number,
  openMenuOffset: number,
  hiddenMenuOffsetPercentage: number,
  hiddenMenuOffset: number,
  left: Animated.Value,
};

const deviceScreen: WindowDimensions = Dimensions.get('window');
const barrierForward: number = deviceScreen.width / 4;

function shouldOpenMenu(dx: number): boolean {
  return dx > barrierForward;
}

export default class SideMenu extends React.Component<ReactNativeSideMenuProps, State> {
  responder: PanResponderInstance
  onStartShouldSetResponderCapture: Function;
  onMoveShouldSetPanResponder: () => boolean;
  onPanResponderMove: () => void;
  onPanResponderRelease: () => void;
  onPanResponderTerminate: () => void;
  prevLeft: number;
  isOpen: boolean;

  constructor(props: ReactNativeSideMenuProps) {
    super(props);
    
    this.prevLeft = 0;
    this.isOpen = !!props.isOpen;

    const openMenuOffset = props.openMenuOffset ?? deviceScreen.width * (2 / 3);

    const initialMenuPositionMultiplier = props.menuPosition === 'right' ? -1 : 1;
    const openOffsetMenuPercentage = openMenuOffset / deviceScreen.width;
    const hiddenMenuOffsetPercentage = props.hiddenMenuOffset / deviceScreen.width;
    const left: Animated.Value = new Animated.Value(
      props.isOpen
        ? props.openMenuOffset * initialMenuPositionMultiplier
        : props.hiddenMenuOffset,
    );

    this.onLayoutChange = this.onLayoutChange.bind(this);
    this.onStartShouldSetResponderCapture = props.onStartShouldSetResponderCapture.bind(this);
    this.onMoveShouldSetPanResponder = this.handleMoveShouldSetPanResponder.bind(this);
    this.onPanResponderMove = this.handlePanResponderMove.bind(this);
    this.onPanResponderRelease = this.handlePanResponderEnd.bind(this);
    this.onPanResponderTerminate = this.handlePanResponderEnd.bind(this);

    this.state = {
      width: deviceScreen.width,
      height: deviceScreen.height,
      openOffsetMenuPercentage,
      openMenuOffset: deviceScreen.width * openOffsetMenuPercentage,
      hiddenMenuOffsetPercentage,
      hiddenMenuOffset: deviceScreen.width * hiddenMenuOffsetPercentage,
      left,
    } as State;

    this.state.left.addListener(({ value }) => this.props.onSliding(Math.abs((value - this.state.hiddenMenuOffset) / (this.state.openMenuOffset - this.state.hiddenMenuOffset))));
  }

  UNSAFE_componentWillMount(): void {
    this.responder = PanResponder.create({
      onStartShouldSetResponderCapture: this.onStartShouldSetResponderCapture,
      onMoveShouldSetPanResponder: this.onMoveShouldSetPanResponder,
      onPanResponderMove: this.onPanResponderMove,
      onPanResponderRelease: this.onPanResponderRelease,
      onPanResponderTerminate: this.onPanResponderTerminate,
    });
  }

  UNSAFE_componentWillReceiveProps(props: ReactNativeSideMenuProps): void {
    if (typeof props.isOpen !== 'undefined' && this.isOpen !== props.isOpen && (props.autoClosing || this.isOpen === false)) {
      this.openMenu(props.isOpen);
    }
  }

  getOverlayColor() {
    if (this.props.allowOverlayPressPropagation) return this.props.overlayColor || 'transparent';
    // stopPropagation doesn't work with transparent background
    if (!this.props.overlayColor || this.props.overlayColor == 'transparent') {
      return '#00000001';
    }
    return this.props.overlayColor;
  }

  onLayoutChange(e: Event) {
    const { width, height } = e.nativeEvent.layout;
    const openMenuOffset = width * this.state.openOffsetMenuPercentage;
    const hiddenMenuOffset = width * this.state.hiddenMenuOffsetPercentage;
    this.setState({ width, height, openMenuOffset, hiddenMenuOffset });
  }

  /**
   * Get content view. This view will be rendered over menu
   * @return {React.Component}
   */
  getContentView() {
    const overlayContainer: React.Element<void, void> = (
      <TouchableWithoutFeedback
        onPress={(e) => {
          if (!this.props.allowOverlayPressPropagation) {
            e.stopPropagation();
          }
          this.openMenu(false);
        }}
      >
        <Animated.View
          pointerEvents={this.isOpen ? 'auto' : 'none'}
          style={[styles.overlay, {
            backgroundColor: this.getOverlayColor(),
            opacity: this.props.animateOverlayOpacity ? this.state.left.interpolate({
              inputRange: [
                this.state.hiddenMenuOffset,
                this.state.openMenuOffset],
              outputRange: [0, this.props.overlayOpacity],
            }) : this.props.overlayOpacity,
          }]}
        />
      </TouchableWithoutFeedback>
      );

    const { width, height } = this.state;
    const ref = sideMenu => (this.sideMenu = sideMenu);
    const style = [
      styles.frontView,
      { width, height },
      this.props.animationStyle(this.state.left),
    ];

    return (
      <Animated.View style={style} ref={ref} {...this.responder.panHandlers}>
        {this.props.children}
        {overlayContainer}
      </Animated.View>
    );
  }

  moveLeft(offset: number) {
    const newOffset = this.menuPositionMultiplier() * offset;

    this.props
      .animationFunction(this.state.left, newOffset)
      .start(this.props.onAnimationComplete);

    this.prevLeft = newOffset;
  }

  menuPositionMultiplier(): -1 | 1 {
    return this.props.menuPosition === 'right' ? -1 : 1;
  }

  handlePanResponderMove(e: Object, gestureState: Object) {
    if (this.state.left.__getValue() * this.menuPositionMultiplier() >= 0) {
      let newLeft = this.prevLeft + gestureState.dx;

      if (!this.props.bounceBackOnOverdraw && Math.abs(newLeft) > this.state.openMenuOffset) {
        newLeft = this.menuPositionMultiplier() * this.state.openMenuOffset;
      }

      this.props.onMove(newLeft);
      this.state.left.setValue(newLeft);
    }
  }

  handlePanResponderEnd(e: Object, gestureState: Object) {
    const offsetLeft = this.menuPositionMultiplier() *
      (this.state.left.__getValue() + gestureState.dx);

    this.openMenu(shouldOpenMenu(offsetLeft));
  }

  handleMoveShouldSetPanResponder(e: any, gestureState: any): boolean {
    if (this.gesturesAreEnabled()) {
      const x = Math.round(Math.abs(gestureState.dx));
      const y = Math.round(Math.abs(gestureState.dy));

      const touchMoved = x > this.props.toleranceX && y < this.props.toleranceY;

      if (this.isOpen) {
        return touchMoved;
      }

      const withinEdgeHitWidth = this.props.menuPosition === 'right' ?
        gestureState.moveX > (deviceScreen.width - this.props.edgeHitWidth) :
        gestureState.moveX < this.props.edgeHitWidth;

      const swipingToOpen = this.menuPositionMultiplier() * gestureState.dx > 0;
      return withinEdgeHitWidth && touchMoved && swipingToOpen;
    }

    return false;
  }

  openMenu(isOpen: boolean): void {
    const { hiddenMenuOffset, openMenuOffset } = this.state;
    this.moveLeft(isOpen ? openMenuOffset : hiddenMenuOffset);
    this.isOpen = isOpen;

    this.forceUpdate();
    this.props.onChange(isOpen);
  }

  gesturesAreEnabled(): boolean {
    const { disableGestures } = this.props;

    if (typeof disableGestures === 'function') {
      return !disableGestures();
    }

    return !disableGestures;
  }

  render(): React.Element<void, void> {
    const boundryStyle = this.props.menuPosition === 'right' ?
      { left: this.state.width - this.state.openMenuOffset } :
      { right: this.state.width - this.state.openMenuOffset };

    const menu = (
      <View style={[styles.menu, boundryStyle]}>
        {this.props.menu}
      </View>
    );

    return (
      <View
        style={styles.container}
        onLayout={this.onLayoutChange}
      >
        {menu}
        {this.getContentView()}
      </View>
    );
  }
}

// SideMenu.propTypes = {
//   edgeHitWidth: PropTypes.number,
//   toleranceX: PropTypes.number,
//   toleranceY: PropTypes.number,
//   menuPosition: PropTypes.oneOf(['left', 'right']),
//   onChange: PropTypes.func,
//   onMove: PropTypes.func,
//   children: PropTypes.node,
//   menu: PropTypes.node,
//   openMenuOffset: PropTypes.number,
//   hiddenMenuOffset: PropTypes.number,
//   animationStyle: PropTypes.func,
//   disableGestures: PropTypes.oneOfType([PropTypes.func, PropTypes.bool]),
//   animationFunction: PropTypes.func,
//   onAnimationComplete: PropTypes.func,
//   onStartShouldSetResponderCapture: PropTypes.func,
//   isOpen: PropTypes.bool,
//   bounceBackOnOverdraw: PropTypes.bool,
//   autoClosing: PropTypes.bool,
// };

SideMenu.defaultProps = {
  toleranceY: 10,
  toleranceX: 10,
  edgeHitWidth: 60,
  children: null,
  menu: null,
  openMenuOffset: deviceScreen.width * (2 / 3),
  disableGestures: false,
  menuPosition: 'left',
  hiddenMenuOffset: 0,
  onMove: () => {},
  onStartShouldSetResponderCapture: () => true,
  onChange: () => {},
  onSliding: () => {},
  animationStyle: value => ({
    transform: [{
      translateX: value,
    }],
  }),
  animationFunction: (prop, value) => Animated.spring(prop, {
    toValue: value,
    friction: 8,
    useNativeDriver: true,
  }),
  onAnimationComplete: () => {},
  isOpen: false,
  bounceBackOnOverdraw: true,
  autoClosing: true,
  overlayOpacity: 1,
  animateOverlayOpacity: true,
};
