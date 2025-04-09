import * as SliderPrimitive from '@radix-ui/react-slider';
import React from 'react';

const Slider = React.forwardRef(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={`slider-root ${className}`}
    {...props}
  >
    {props.children}
  </SliderPrimitive.Root>
));

Slider.displayName = "Slider";

const SliderTrack = React.forwardRef(({ className, ...props }, ref) => (
  <SliderPrimitive.Track
    ref={ref}
    className={`slider-track ${className}`}
    {...props}
  />
));

SliderTrack.displayName = "SliderTrack";

const SliderRange = React.forwardRef(({ className, ...props }, ref) => (
  <SliderPrimitive.Range
    ref={ref}
    className={`slider-range ${className}`}
    {...props}
  />
));

SliderRange.displayName = "SliderRange";

const SliderThumb = React.forwardRef(({ className, ...props }, ref) => (
  <SliderPrimitive.Thumb
    ref={ref}
    className={`slider-thumb ${className}`}
    {...props}
  />
));

SliderThumb.displayName = "SliderThumb";

export { Slider, SliderTrack, SliderRange, SliderThumb };