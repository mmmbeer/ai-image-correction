// ui/controls.js
import { createSliders } from './sliders.js';

export function initControls(container, onChange) {
  const sections = [
    {
      title: 'Bilateral Smoothing',
      sliders: [
        { id:'radius', label:'Radius', min:1, max:6, step:1, val:3 },
        { id:'sigmaColor', label:'Color Sigma', min:5, max:80, step:1, val:30 },
        { id:'sigmaSpace', label:'Spatial Sigma', min:1, max:10, step:0.1, val:4 }
      ]
    },
    {
      title: 'Palette Flattening',
      sliders: [
        { id:'quant', label:'Palette Levels', min:0, max:32, step:1, val:0 }
      ]
    }
  ];

  const state = {};

  sections.forEach(section => {
    const block = document.createElement('fieldset');
    block.style.border = '1px solid #444';
    block.style.padding = '8px';

    const legend = document.createElement('legend');
    legend.textContent = section.title;
    legend.style.fontSize = '13px';
    legend.style.padding = '0 6px';

    block.appendChild(legend);

    const sliderSet = createSliders(block, section.sliders, (id, value) => {
      state[id] = value;
      onChange();
    });

    Object.assign(state, sliderSet.defaults);
    container.appendChild(block);
  });

  return {
    values: () => ({ ...state }),

    reset() {
      container.innerHTML = '';
      initControls(container, onChange);
    }
  };
}
