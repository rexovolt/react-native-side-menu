# @rexovolt/react-native-side-menu

![npm badge from shields.io](https://img.shields.io/npm/v/@rexovolt/react-native-side-menu)

This package provides a customizable side menu component for React Native projects.

| iOS | Android |
| --- | --- |
| <img src="https://user-images.githubusercontent.com/6936373/71641602-eb969700-2ce1-11ea-9698-c251ccd19b65.png" width="320" />  | <img src="https://user-images.githubusercontent.com/6936373/71641601-eb969700-2ce1-11ea-82e3-c09a63145989.png" width="320" />  |


### Content
- [Installation](#installation)
- [Usage example](#usage-example)
- [Component props](#component-props)
- [Questions?](#questions)
- [Credits](#credits)

### Installation
```bash
npm install @rexovolt/react-native-side-menu --save
```

### Usage example
```tsx
import SideMenu from '@rexovolt/react-native-side-menu'
import {CatSelector}  from './YourMenuComponent'

const ContentView = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>
        kitty cat :3
      </Text>
      <Text style={styles.body}>
        meow!
      </Text>
    </View>
  );
}

const Application = () => {
  const menu = <CatSelector navigator={navigator}/>;

  return (
    <SideMenu menu={menu}>
      <ContentView/>
    </SideMenu>
  );
}
```

### Component props

| prop | default | type | description |
| ---- | ---- | ----| ---- |
| menu | inherited | React.Component | Menu component |
| isOpen |false | Boolean | Props driven control over menu open state |
| openMenuOffset | 2/3 of device screen width | Number | Content view left margin if menu is opened |
| hiddenMenuOffset | none | Number | Content view left margin if menu is hidden |
| edgeHitWidth | none | Number | Edge distance on content view to open side menu, defaults to 60 |
| toleranceX | none | Number | X axis tolerance |
| toleranceY | none | Number | Y axis tolerance |
| disableGestures | false | Bool | Disable whether the menu can be opened with gestures or not |
| onStartShould <br /> SetResponderCapture | none | Function | Function that accepts event as an argument and specify if side-menu should react on the touch or not. Check https://facebook.github.io/react-native/docs/gesture-responder-system.html for more details |
| onChange | none | Function | Callback on menu open/close. Is passed isOpen as an argument |
| onMove | none | Function | Callback on menu move. Is passed left as an argument |
| onSliding | none | Function | Callback when menu is sliding. It returns a decimal from 0 to 1 which represents the percentage of menu offset between hiddenMenuOffset and openMenuOffset.|
| menuPosition | left | String | either 'left' or 'right' |
| animationFunction | none | (Function -> Object) | Function that accept 2 arguments (prop, value) and return an object: <br /> - `prop` you should use at the place you specify parameter to animate <br /> - `value` you should use to specify the final value of prop |
| onAnimationComplete | none | (Function -> Void) | Function that accept 1 optional argument (event): <br /> - `event` you should this to capture the animation event after the animation has successfully completed |
| animationStyle | none | (Function -> Object) | Function that accept 1 argument (value) and return an object: <br /> - `value` you should use at the place you need current value of animated parameter (left offset of content view) |
| bounceBackOnOverdraw | true | boolean | when true, content view will bounce back to openMenuOffset when dragged further |
| autoClosing | true | boolean | When true, menu close automatically as soon as an event occurs |
| allowOverlayPressPropagation | false | boolean | When true, press events on the overlay can be propagated to the buttons inside your page |
| overlayColor | transparent | string | Page overlay color when sidebar open |
| overlayOpacity | 1 | Number | Page overlay opacity when sidebar open |
| animateOverlayOpacity | true | boolean | When true, the page overlay opacity is animated from 0 to overlayOpacity |

### FAQ/troubleshooting

#### ScrollView does not scroll to top on status bar press

On iPhone, the scroll-to-top gesture has no effect if there is more than one scroll view on-screen that has scrollsToTop set to true. Since it defaults to `true` in ReactNative, you have to set `scrollsToTop={false}` on your ScrollView inside `Menu` component in order to get it working as desired.

#### The swipe animation is extremely slow

Try disabling remote JS debugging (from developer menu on phone/VD)

#### My SideMenu contents are visible even when the side menu is hidden

Ensure that your main view has a background color applied:

```tsx
<SideMenu menu={menu}>
  <App style={{backgroundColor='white'}} />
</SideMenu>
```
### Questions?
Feel free to [open an issue](https://github.com/rexovolt/react-native-side-menu/issues/new).

### Credits

This repository is a fork of a fork of a fork (talk about a mouthful!). I'd like to give my thanks and credit to the authors of/contributors to the following packages:

- [@chakrahq/react-native-side-menu](https://github.com/chakrahq/react-native-side-menu), which was forked from
- [Kureev/react-native-side-menu](https://github.com/Kureev/react-native-side-menu), which was forked from
- [alessiocancian/react-native-side-menu](https://github.com/alessiocancian/react-native-side-menu)

