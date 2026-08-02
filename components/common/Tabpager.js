/**
 * TabPager (native)
 *
 * Wraps react-native-pager-view so the bottom-nav tabs can be swiped
 * left/right, not just tapped. `react-native-pager-view` has no web
 * implementation, so this file is only picked up on iOS/Android — see
 * TabPager.web.js for the web fallback (same props, no swipe gesture).
 *
 * - activeIndex: which page should be showing (controlled from the parent's
 *   `activeTab` state — kept in sync so tapping a bottom-nav item moves the
 *   pager too, not just swiping).
 * - onIndexChange: fired when the user swipes to a different page, so the
 *   parent can update `activeTab` to match.
 */
import { useEffect, useRef } from 'react';
import PagerView from 'react-native-pager-view';

export default function TabPager({ activeIndex, onIndexChange, style, children }) {
  const pagerRef = useRef(null);
  const didMount = useRef(false);

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    // A bottom-nav tap changed activeIndex — jump the pager to match
    // without replaying the swipe animation across every page in between.
    pagerRef.current?.setPageWithoutAnimation(activeIndex);
  }, [activeIndex]);

  return (
    <PagerView
      ref={pagerRef}
      style={style}
      initialPage={activeIndex}
      onPageSelected={(e) => onIndexChange?.(e.nativeEvent.position)}
    >
      {children}
    </PagerView>
  );
}