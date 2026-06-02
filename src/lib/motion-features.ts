// Loaded lazily by LazyMotion so framer-motion's animation features land in a
// separate async chunk instead of the initial JS bundle. `domAnimation` covers
// animations, variants and exit (AnimatePresence) — all this app uses. It does
// NOT include layout/drag projection, which nothing here needs (swipe uses
// @use-gesture, not framer-motion drag).
import { domAnimation } from "framer-motion";

export default domAnimation;
