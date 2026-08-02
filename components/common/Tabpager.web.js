/**
 * TabPager (web)
 *
 * react-native-pager-view doesn't support web. Swiping isn't a native
 * gesture on web anyway, so this just renders whichever page is active —
 * identical to how tab switching worked before this feature was added.
 * Metro/webpack automatically pick this file over TabPager.js when
 * bundling for web, based on the .web.js filename.
 */
import { View } from 'react-native';

export default function TabPager({ activeIndex, style, children }) {
  const pages = Array.isArray(children) ? children : [children];
  return <View style={style}>{pages[activeIndex] ?? null}</View>;
}