// Icon registry — maps categories to icon metadata + Vite asset URLs
// Vite resolves these ?url imports to proper asset paths at build time

import cameraDslr from '../../icons/cameras/camera-dslr.svg?url'
import cameraCinema from '../../icons/cameras/camera-cinema.svg?url'
import cameraMirrorless from '../../icons/cameras/camera-mirrorless.svg?url'
import cameraPhoto from '../../icons/cameras/camera-photo.svg?url'

import lightFresnel from '../../icons/light-sources/light-fresnel.svg?url'
import lightSoftbox from '../../icons/light-sources/light-softbox.svg?url'
import lightBeautyDish from '../../icons/light-sources/light-beauty-dish.svg?url'
import lightLedPanel from '../../icons/light-sources/light-led-panel.svg?url'
import lightPractical from '../../icons/light-sources/light-practical.svg?url'
import lightStrobe from '../../icons/light-sources/light-strobe.svg?url'

import modUmbrella from '../../icons/light-modifiers/modifier-umbrella.svg?url'
import modReflector from '../../icons/light-modifiers/modifier-reflector.svg?url'
import modFlag from '../../icons/light-modifiers/modifier-flag.svg?url'
import modScrim from '../../icons/light-modifiers/modifier-scrim.svg?url'
import modDiffusion from '../../icons/light-modifiers/modifier-diffusion.svg?url'

import standCstand from '../../icons/stands/stand-cstand.svg?url'
import standLight from '../../icons/stands/stand-light.svg?url'
import standBoom from '../../icons/stands/stand-boom.svg?url'

import subjectActor from '../../icons/subjects/subject-actor.svg?url'
import subjectPosition from '../../icons/subjects/subject-position.svg?url'

import miscArrow from '../../icons/misc/misc-arrow.svg?url'
import miscTapeMark from '../../icons/misc/misc-tape-mark.svg?url'
import miscRuler from '../../icons/misc/misc-ruler.svg?url'

export const ICON_CATEGORIES = [
  {
    id: 'cameras',
    label: 'Cameras',
    icons: [
      { id: 'camera-dslr',       label: 'DSLR',        url: cameraDslr },
      { id: 'camera-cinema',     label: 'Cinema',      url: cameraCinema },
      { id: 'camera-mirrorless', label: 'Mirrorless',  url: cameraMirrorless },
      { id: 'camera-photo',      label: 'Photo',       url: cameraPhoto },
    ],
  },
  {
    id: 'light-sources',
    label: 'Light Sources',
    icons: [
      { id: 'light-fresnel',     label: 'Fresnel',     url: lightFresnel },
      { id: 'light-softbox',     label: 'Softbox',     url: lightSoftbox },
      { id: 'light-beauty-dish', label: 'Beauty Dish', url: lightBeautyDish },
      { id: 'light-led-panel',   label: 'LED Panel',   url: lightLedPanel },
      { id: 'light-practical',   label: 'Practical',   url: lightPractical },
      { id: 'light-strobe',      label: 'Strobe',      url: lightStrobe },
    ],
  },
  {
    id: 'light-modifiers',
    label: 'Light Modifiers',
    icons: [
      { id: 'mod-umbrella',   label: 'Umbrella',   url: modUmbrella },
      { id: 'mod-reflector',  label: 'Reflector',  url: modReflector },
      { id: 'mod-flag',       label: 'Flag',        url: modFlag },
      { id: 'mod-scrim',      label: 'Scrim',       url: modScrim },
      { id: 'mod-diffusion',  label: 'Diffusion',  url: modDiffusion },
    ],
  },
  {
    id: 'stands',
    label: 'Stands',
    icons: [
      { id: 'stand-cstand', label: 'C-Stand',  url: standCstand },
      { id: 'stand-light',  label: 'Light Stand', url: standLight },
      { id: 'stand-boom',   label: 'Boom',     url: standBoom },
    ],
  },
  {
    id: 'subjects',
    label: 'Subjects',
    icons: [
      { id: 'subject-actor',    label: 'Actor',    url: subjectActor },
      { id: 'subject-position', label: 'Position', url: subjectPosition },
    ],
  },
  {
    id: 'misc',
    label: 'Misc',
    icons: [
      { id: 'misc-arrow',     label: 'Arrow',     url: miscArrow },
      { id: 'misc-tape-mark', label: 'Tape Mark', url: miscTapeMark },
      { id: 'misc-ruler',     label: 'Ruler',     url: miscRuler },
    ],
  },
]
