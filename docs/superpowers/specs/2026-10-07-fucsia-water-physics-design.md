# Fucsia Water Physics Animation Design

## Overview
The user requested "real fluid physics" (agua ondulando) for the Fucsia character's entrance animation and idle state. Since matrix transforms alone cannot deform the exact boundary of the character to look like a liquid droplet, we are implementing **Option B: SVG Displacement Filter**.

## Architecture
We will use a custom SVG filter applied via CSS `filter: url(#water-filter)` to the `.fuchsia-char` container.

1. **SVG Definition**:
   A hidden SVG will be injected into the `CuteCharacterFucsia` component:
   ```html
   <svg width="0" height="0" style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}>
     <filter id="water-filter" x="-20%" y="-20%" width="140%" height="140%">
       <feTurbulence id="water-turbulence" type="fractalNoise" baseFrequency="0.015" numOctaves="1" result="noise" />
       <feDisplacementMap id="water-displacement" in="SourceGraphic" in2="noise" scale="8" xChannelSelector="R" yChannelSelector="G" />
     </filter>
   </svg>
   ```

2. **CSS Application**:
   We will add a CSS class or inline style to apply the filter when enabled.

3. **GSAP Animation (The Undulation)**:
   To make the water "flow" and "breathe" continuously, we will create a dedicated infinite GSAP timeline that animates the attributes of the SVG filter directly.
   - We will animate the `scale` attribute of the `<feDisplacementMap>` to create a swelling/breathing liquid effect.
   - We will animate the `baseFrequency` attribute of the `<feTurbulence>` to make the noise pattern shift smoothly.
   
   *Implementation note: GSAP's `attr` plugin is perfect for tweening SVG attributes without triggering React state renders.*

4. **Integration with the Entrance Timeline**:
   The continuous water undulation will run independently (as a looping timeline) alongside the structural entrance animation (the pendulum swing, 180° rotation, and floor impact). During the extreme actions (like the floor impact), we can temporarily increase the `scale` of the displacement to make the splash/wobble more violent, then return it to a gentle ripple for the idle state.

## Trade-offs & Risks
- **Performance**: As warned, this forces the browser to rasterize the element and apply a per-pixel displacement algorithm on every frame. If the user's hardware drops frames, we may need to fall back to Option A.
- **Bounding Box Clipping**: SVG filters can sometimes clip if the displaced pixels exceed the element's bounding box. We have adjusted the filter bounds `x="-20%" y="-20%" width="140%" height="140%"` to prevent this.

## Next Steps
1. Add the SVG filter to `CuteCharacterFucsia.tsx`.
2. Add the GSAP `attr` plugin animations to the continuous timeline in `CuteCharacterFucsiaAnimated.tsx`.
3. Integrate the violent impact spikes into the entrance timeline.
