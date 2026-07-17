/**
 * @file motionFeatures
 * Isolated in its own module so LazyMotion's async `features` loader
 * (lib/providers.tsx) code-splits domMax into a separate chunk fetched on
 * mount, instead of the synchronous `features={domMax}` form — which
 * measured byte-identical to the unshaken `motion.*` import under this app's
 * Turbopack build (see E11-T1's commit message) because it still bundles
 * domMax directly into the same chunk as everything else.
 */
import { domMax } from "motion/react";

export default domMax;
