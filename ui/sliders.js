export function createSliders(container, onChange) {
  const defs = [
    { id:'radius', label:'Bilateral Radius', min:1, max:6, val:3 },
    { id:'sigmaColor', label:'Color Sigma', min:5, max:80, val:30 },
    { id:'sigmaSpace', label:'Spatial Sigma', min:1, max:10, val:4 },
    { id:'quant', label:'Palette Levels', min:0, max:32, val:0 }
  ];

  const state = {};

  defs.forEach(d => {
    const wrap = document.createElement('label');
    wrap.textContent = d.label;

    const range = document.createElement('input');
    range.type = 'range';
    Object.assign(range, d);

    const num = document.createElement('input');
    num.type = 'number';
    num.value = d.val;

    range.oninput = () => {
      num.value = range.value;
      state[d.id] = +range.value;
      onChange();
    };

    num.oninput = () => {
      range.value = num.value;
      state[d.id] = +num.value;
      onChange();
    };

    state[d.id] = d.val;
    wrap.append(range, num);
    container.appendChild(wrap);
  });

  return {
    values: () => ({ ...state })
  };
}
