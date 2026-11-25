/* Local SVG illustrations: crisp on tablets, offline, no external image requests. */
const FarmArt = (() => {
  function grazingProps(species, adult) {
    const cow = species === 'cow';
    const x = adult ? (cow ? 24 : 21) : 29;
    const grass = [-10, 0, 10].map((offset, i) => {
      const height = cow ? [11, 17, 14][i] : [6, 9, 7][i];
      return `<path class="forage-leaves" transform="translate(${x + offset} 99)" d="M0 0Q-9-${height - 3}-7-${height}q5 1 8 ${height - 2}Q3-${height} 9-${height - 2}Q8-5 3 0" fill="${i === 0 ? '#6d9857' : '#89b36b'}" stroke="#567d47" stroke-width="1.2" stroke-linejoin="round"/>`;
    }).join('');
    const waterY = cow ? 94 : 93;
    const width = cow ? 22 : 16;
    const trough = `<path d="M${x - width} ${waterY}q2 13 ${width} 13t${width}-13" fill="${cow ? '#84afb9' : '#a0b8a2'}" stroke="#5e8284" stroke-width="2"/>
      <ellipse cx="${x}" cy="${waterY}" rx="${width}" ry="6" fill="#cde6df" stroke="#6c9ea6" stroke-width="2"/>
      <ellipse cx="${x}" cy="${waterY + 1}" rx="${width - 4}" ry="3.8" fill="#9eced5"/>
      <ellipse class="livestock-ripple" cx="${x - 2}" cy="${waterY}" rx="${width - 7}" ry="2.6" fill="none" stroke="#e9faf4" stroke-width="1.5"/>`;
    return `<g display="none" class="creature-care care-food" data-prop="${cow ? 'long-grass' : 'short-grass'}">
      <ellipse cx="${x}" cy="99" rx="20" ry="5" fill="#cbd6ab"/>${grass}
    </g><g display="none" class="creature-care care-water" data-prop="${cow ? 'water-trough' : 'shallow-water'}">${trough}</g>`;
  }
  // Props share the animal's facing but not its body motion, so the mouth can reach them.
  function careProps(species, adult) {
    if (species === 'cow' || species === 'sheep') return grazingProps(species, adult);
    const bowl = (water, x = 55) => `<g class="care-bowl"><path d="M${x-23} 91q2 18 23 18q21 0 23-18" fill="${water ? '#8fc5cd' : '#d99c70'}" stroke="${water ? '#5b929f' : '#ad7956'}" stroke-width="2"/><ellipse cx="${x}" cy="91" rx="23" ry="7" fill="${water ? '#d8f3f5' : '#f7dfb5'}" stroke="${water ? '#5b929f' : '#ad7956'}" stroke-width="2"/>${water ? `<ellipse class="care-rings" cx="${x}" cy="91" rx="14" ry="3" fill="none" stroke="#71bdcf" stroke-width="2"/>` : `<g class="care-crumbs" fill="#ae794a"><circle cx="${x-11}" cy="90" r="3"/><circle cx="${x}" cy="93" r="3"/><circle cx="${x+9}" cy="88" r="3"/><circle cx="${x+15}" cy="93" r="2.5"/></g>`}</g>`;
    const drops = `<g class="care-drops" fill="#79c9df"><path d="M28 78q-7 10 0 10q7 0 0-10"/><path d="M82 81q-6 9 0 9q6 0 0-9"/></g>`;
    let food, water;
    if (species === 'chick') {
      food = `<ellipse cx="54" cy="99" rx="32" ry="8" fill="#dfc397"/><g class="care-seeds" fill="#f2bb4c" stroke="#bb8438" stroke-width="1.4"><ellipse cx="40" cy="94" rx="5" ry="3"/><ellipse cx="54" cy="99" rx="5" ry="3"/><ellipse cx="67" cy="93" rx="5" ry="3"/><ellipse cx="76" cy="101" rx="4" ry="2.5"/><ellipse cx="32" cy="102" rx="4" ry="2.5"/></g>`;
      water = bowl(true, adult ? 45 : 55) + drops;
    } else if (species === 'bee') {
      food = `<path d="M20 106V81m0 20q-18-18-17-4q6 9 17 4" fill="#86ad71" stroke="#70965c" stroke-width="3"/><g class="care-flower" fill="#efa5b8" stroke="#d67f9a" stroke-width="1.3"><ellipse cx="20" cy="73" rx="7" ry="11"/><ellipse cx="9" cy="81" rx="10" ry="7"/><ellipse cx="31" cy="81" rx="10" ry="7"/><ellipse cx="14" cy="91" rx="7" ry="10"/><ellipse cx="27" cy="91" rx="7" ry="10"/><circle cx="20" cy="82" r="7" fill="#f8d66d"/></g>`;
      water = `<path d="M3 104Q-1 75 39 79Q40 104 3 104" fill="#8cba78" stroke="#638e57" stroke-width="2"/><path d="m4 103 27-18" fill="none" stroke="#c9dda4" stroke-width="2"/><path class="care-dew" d="M21 66q-15 22 0 22q15 0 0-22" fill="#8fd8e6" stroke="#5ca8ba" stroke-width="2"/><ellipse cx="18" cy="79" rx="3" ry="5" fill="#e4fbfa"/>`;
    } else if (species === 'fish') {
      food = `<path d="M5 22q15-7 32 0m-29 3h23" fill="none" stroke="#a8dce1" stroke-width="3" stroke-linecap="round"/><g class="care-pellets" fill="#bb8150" stroke="#865936" stroke-width="1.5"><circle class="pellet-one" cx="20" cy="36" r="${adult ? 4 : 3}"/><circle class="pellet-two" cx="31" cy="26" r="3"/><circle class="pellet-three" cx="10" cy="23" r="2.5"/></g>`;
      water = `<g class="care-pour"><path d="m72 6 27 5-5 19-22-5Z" fill="#88c4d0" stroke="#5c95a6" stroke-width="2"/><path d="m74 13-12 1-7 9 15-1" fill="#88c4d0" stroke="#5c95a6" stroke-width="2"/><path d="M95 13q16-6 12 8q-2 8-13 1" fill="none" stroke="#5c95a6" stroke-width="3"/></g><g class="care-stream" fill="none" stroke="#78cadd" stroke-width="3" stroke-linecap="round"><path d="M57 26q-13 13-14 22m17-21Q49 42 49 54"/></g><g class="care-bubbles" fill="#dbf8fa" stroke="#7dbdcf" stroke-width="1.5"><circle cx="18" cy="45" r="5"/><circle cx="28" cy="31" r="3"/><circle cx="85" cy="71" r="5"/><circle cx="93" cy="52" r="3"/></g>`;
    } else {
      food = bowl(false); water = bowl(true) + drops;
    }
    return `<g display="none" class="creature-care care-food" data-prop="${species === 'bee' ? 'flower' : species === 'fish' ? 'pellets' : species === 'chick' ? 'grain' : 'food-bowl'}">${food}</g><g display="none" class="creature-care care-water" data-prop="${species === 'bee' ? 'dew-leaf' : species === 'fish' ? 'fresh-water' : 'water-bowl'}">${water}</g>`;
  }
  function livestock(type, adult, eyes) {
    if (type === 'cow') return `
      <path class="creature-tail" d="M93 46Q106 52 102 70" fill="none" stroke="#665c50" stroke-width="4" stroke-linecap="round"/>
      <path d="M102 64q-8 5-1 13 8-5 1-13" fill="#524946"/>
      <g class="creature-feet"><path d="M47 74v21m41-21v21" stroke="#cbc4ae" stroke-width="9"/><path d="M39 70v28m41-28v28" stroke="#f7efda" stroke-width="10"/><path d="M34 97h10m31 0h10" stroke="#574e47" stroke-width="5"/></g>
      ${adult ? '<path d="M49 76q14-5 24 0l-1 7q-1 7-6 5v4q-3 4-5 0v-4h-5v4q-3 4-5 0v-5q-6-4-2-11" fill="#e9a0a2" stroke="#be787d" stroke-width="1.8"/>' : ''}
      <ellipse cx="66" cy="59" rx="33" ry="${adult ? 24 : 20}" fill="#fff8e9" stroke="#887d6c" stroke-width="2"/>
      <path d="M56 38q14-6 28 2 4 8-4 14t-14-1q1-6-10-7Zm30 35q-8-8 0-15l13-1q1 10-13 16Z" fill="#645c58"/>
      <path class="livestock-neck" d="M53 44Q44 47 38 60L24 74q-4 8 14 13l22-18q13-10 7-21Z" fill="#fff6e4" stroke="#887d6c" stroke-width="1.7"/>
      <g class="creature-head">
        ${adult ? '<path d="M24 30Q15 26 19 16q4 7 10 8m11 3q7-1 10-10 4 9-2 17" fill="#e8c890" stroke="#987d57" stroke-width="1.6"/>' : ''}
        <path d="M21 33Q3 26 9 39q7 8 16 3m21-8q17-8 14 1-3 11-15 11" fill="#87716c"/>
        <ellipse cx="33" cy="45" rx="20" ry="${adult ? 21 : 23}" fill="#fff6e4" stroke="#887d6c" stroke-width="2"/>
        <path d="M18 34q9-9 15-7 7 6 4 14-3 6-17 7-5-8-2-14Z" fill="#6b625b"/>
        ${eyes(33, 43, 8)}
        <path class="cow-tongue" d="M28 61q-3 10-11 9-6-1-3-6q-1 5 5 3l5-7Z" fill="#d68983" stroke="#a66965" stroke-width="1.2"/>
        <ellipse class="livestock-jaw" cx="30" cy="61" rx="13" ry="7" fill="#dca09a" stroke="#b47a74"/>
        <ellipse cx="30" cy="57" rx="19" ry="11" fill="#ecb2aa" stroke="#ba8880" stroke-width="1.5"/>
        <path d="M22 55h1m15 0h1m-13 6q4 3 8 0" fill="none" stroke="#8a5d5b" stroke-width="2" stroke-linecap="round"/>
        <path class="grass-bite" d="M28 65Q16 70 13 68m17-3Q20 75 9 74" fill="none" stroke="#69904e" stroke-width="1.6" stroke-linecap="round"/>
      </g>`;
    return `
      <path class="creature-tail" d="M91 55q16-6 13 9-5 6-13 3" fill="#e9d6be" stroke="#947b71" stroke-width="2"/>
      <g class="creature-feet"><path d="M48 71v22m39-22v22" stroke="#a0877e" stroke-width="7"/><path d="M38 70v27m43-27v27" stroke="#bd9f91" stroke-width="9"/><path d="M34 96h8m35 0h8" stroke="#625451" stroke-width="5"/></g>
      <ellipse cx="66" cy="62" rx="31" ry="18" fill="#efdcc7" stroke="#a88d7c" stroke-width="2"/>
      <path d="M58 61q5-4 10-1m3 5q5-4 10-1" fill="none" stroke="#c5a78c" stroke-width="2" stroke-linecap="round"/>
      <g class="${adult ? 'sheep-fleece' : ''}">
        <path d="M31 63q-6-10 3-16-1-12 11-12 3-10 16-7 9-7 18 0 13-1 16 10 12 4 9 15 7 8 0 16-2 11-14 12-6 8-17 4-9 5-18-2-14 3-18-7-7-4-6-13Z" fill="#fff7df" stroke="#baa98b" stroke-width="2"/>
        <path d="M45 50q10-8 14 2 0 5-5 5m13-16q9-7 13 2 0 4-4 4m-7 14q10-6 16 1 1 5-4 6m8-17q8-5 11 2m-52 14q8-5 13 2" fill="none" stroke="#dbcba9" stroke-width="2.5" stroke-linecap="round"/>
      </g>
      <path class="livestock-neck" d="M47 48Q35 56 25 75q-6 11 8 10l18-18q9-9 5-15Z" fill="#ba9582" stroke="#886c62" stroke-width="1.7"/>
      <g class="creature-head">
        <path d="M22 39Q5 36 9 49q4 8 13 0m20-11q16-5 14 6-5 10-14 4" fill="#b08077" stroke="#88645e" stroke-width="1.5"/>
        <ellipse cx="32" cy="51" rx="16" ry="${adult ? 19 : 21}" fill="#bd9284" stroke="#886c62" stroke-width="2"/>
        <path d="M16 38q-4-7 6-10 2-6 10-4 4-4 10 1 8 0 8 7 5 4-2 9-5 2-9-3-4 8-10 2-7 5-13-2" fill="#fff5db" stroke="#bfad93" stroke-width="1.4"/>
        ${eyes(32, 49, 7)}<g class="livestock-jaw"><path d="m28 57 4 3 4-3m-4 3q-1 5-5 3m5-3q1 5 5 3" fill="none" stroke="#725552" stroke-width="1.7" stroke-linecap="round"/></g>
        <path class="grass-bite" d="M31 63q-6 4-12 3m13-3q-8 6-14 6" fill="none" stroke="#708f52" stroke-width="1.6" stroke-linecap="round"/>
      </g>`;
  }
  function livestockTools(type) {
    if (type === 'cow') return `<g class="livestock-tools milk-tools" display="none">
      <path d="M64 96q0-14 11-14t11 14" fill="none" stroke="#5d8390" stroke-width="2.4"/>
      <path d="M62 94h27l-3 15H65Z" fill="#a4ccd1" stroke="#608a95" stroke-width="1.9"/>
      <ellipse cx="75.5" cy="94" rx="13.5" ry="4.2" fill="#6f9eaa" stroke="#608a95" stroke-width="1.9"/>
      <ellipse class="milk-fill" cx="75.5" cy="94" rx="10" ry="2.7" fill="#fff9eb"/>
      <path class="milk-stream" d="M61 83q3 10 13 11" fill="none" stroke="#fffbed" stroke-width="2.3" stroke-linecap="round"/>
      <path class="milk-hand" d="M46 86q-2-5 3-7l8-1-2-3q0-3 3-2l5 6q3 4 0 7l-9 4-4-1Z" fill="#f4c9a3" stroke="#ab8064" stroke-width="1.6"/>
      </g>`;
    if (type === 'sheep') return `<g class="livestock-tools shear-tools" display="none">
      <g class="wool-tuft" fill="#fff8e3" stroke="#baa98b" stroke-width="1.5"><path d="M73 82q3-6 9-4 2-6 10-3 5 1 5 7 7 5 1 10H78q-8-2-5-10Z"/><path d="M78 87q4-4 9-2m1-4q4-2 6 2" fill="none"/></g>
      <g class="shears" stroke-linecap="round" stroke-width="2.2">
        <path class="shear-blade" d="m91 46-16-2 10 9 12-5" fill="#e1e9e7" stroke="#658185"/>
        <path d="m91 48-16 10 16-3 9-5" fill="#e1e9e7" stroke="#658185"/>
        <circle cx="99" cy="47" r="4.5" fill="none" stroke="#d29258"/><circle cx="101" cy="55" r="4.5" fill="none" stroke="#d29258"/>
      </g></g>`;
    return '';
  }
  function animal(type, adult = false, fullFleece = false) {
    adult = adult || type === 'hen';
    const species = type === 'hen' ? 'chick' : type, age = adult ? 'adult' : 'young';
    const eyes = (x=55,y=48,gap=12) => `<g class="creature-eyes" fill="#3e4037"><circle cx="${x-gap}" cy="${y}" r="${adult?2.8:3.8}"/><circle cx="${x+gap}" cy="${y}" r="${adult?2.8:3.8}"/></g>`;
    const cheeks = (x=55,y=57) => `<g fill="#eea58e" opacity="${adult?.4:.65}"><ellipse cx="${x-21}" cy="${y}" rx="6" ry="3"/><ellipse cx="${x+21}" cy="${y}" rx="6" ry="3"/></g>`;
    let drawing;
    if (species === 'chick' && !adult) drawing = `<path class="creature-feet" d="M44 88v10m22-10v10m-28 0h12m10 0h12" stroke="#ce8943" stroke-width="5" stroke-linecap="round"/>
      <ellipse cx="55" cy="69" rx="31" ry="27" fill="#f6cc62"/><path class="creature-wing" d="M29 58q-18 10 1 21" fill="#edb557"/>
      <g class="creature-head"><circle cx="55" cy="42" r="29" fill="#ffdc7b"/><path d="M49 15q0-12 9-10l-1 12" fill="#f6cc62"/>${eyes()}${cheeks()}<path d="m49 56 6 7 6-7" fill="#d99041"/></g>`;
    else if (species === 'chick') drawing = `<g class="creature-tail" fill="#bd8465"><path d="M78 68Q110 64 102 34Q82 34 78 68"/><path d="M78 68Q101 44 86 25Q71 41 78 68"/><path d="M78 68Q92 66 104 52Q95 49 78 68"/></g>
      <path class="creature-feet" d="M43 86v13m26-13v13m-33 0h14m12 0h14" stroke="#cf8b45" stroke-width="5" stroke-linecap="round"/>
      <ellipse cx="56" cy="69" rx="36" ry="25" fill="#fff5db"/><path class="creature-wing" d="M52 57q29-3 27 17q-17 16-29 2m6-8 15 3m-16 4 12 3" fill="#ead4ab" stroke="#d4bc95" stroke-width="2" stroke-linecap="round"/>
      <g class="creature-head"><path d="M26 29q-9-17 3-19q1-15 12-4q11-10 14 3q9 0 5 15" fill="#ce6b59"/><ellipse cx="41" cy="37" rx="24" ry="25" fill="#fff8e6"/>${eyes(41,37,9)}${cheeks(41,46)}<path d="M34 51q-3 16 6 16q9 0 4-16" fill="#d98370"/><path d="m33 45 8 8 9-8" fill="#d99041"/></g>`;
    else if (species === 'cat' || species === 'dog') {
      const cat=species==='cat', fur=cat?(adult?'#d99b61':'#e8b787'):(adult?'#b4865f':'#cba47e');
      const face=cat?(adult?'#e9b77e':'#f5d1a7'):(adult?'#ceaa80':'#e8c9a6');
      drawing = `<path class="creature-tail" d="${adult?(cat?'M79 79Q109 83 99 43Q95 33 90 43':'M78 75Q100 73 96 49'):(cat?'M78 83Q100 84 94 65':'M77 83Q96 80 92 66')}" fill="none" stroke="${fur}" stroke-width="${adult?10:12}" stroke-linecap="round"/>
        <ellipse cx="55" cy="${adult?70:77}" rx="${adult?27:25}" ry="${adult?28:21}" fill="${fur}"/>
        <ellipse cx="55" cy="${adult?75:80}" rx="${adult?15:17}" ry="${adult?21:13}" fill="${cat?'#f7dfba':'#f5e1c2'}"/>
        <g class="creature-feet" stroke="${face}" stroke-width="${adult?12:14}" stroke-linecap="round"><path d="M36 ${adult?77:87}v${adult?19:8}m38-${adult?19:8}v${adult?19:8}"/><path d="M47 ${adult?81:88}v${adult?17:8}m16-${adult?17:8}v${adult?17:8}"/></g>
        <g class="creature-head">${cat?`<path d="${adult?'M29 32 25 5 48 22m32 10L85 5 61 22':'M27 39 27 12 49 25m34 14V12L61 25'}" fill="${fur}"/><path d="${adult?'M32 26 30 13 42 23m35 3 3-13-12 10':'M32 30V20l10 10m36 0V20L68 30'}" fill="#e8aba0"/>`:`<g class="creature-ear" fill="${adult?'#886447':'#a88668'}"><ellipse cx="${adult?29:26}" cy="${adult?38:44}" rx="${adult?12:14}" ry="${adult?26:22}" transform="rotate(12 27 42)"/><ellipse cx="${adult?81:84}" cy="${adult?38:44}" rx="${adult?12:14}" ry="${adult?26:22}" transform="rotate(-12 83 42)"/></g>`}
        <ellipse cx="55" cy="${adult?37:46}" rx="${adult?26:32}" ry="${adult?24:28}" fill="${face}"/>
        ${cat&&adult?'<g stroke="#be814e" stroke-width="4" stroke-linecap="round"><path d="M46 16l2 7m7-9v8m9-6-2 7M31 38l7 3m34-3-7 3"/></g>':''}
        ${eyes(55,adult?36:48,adult?10:12)}${cheeks(55,adult?44:57)}
        ${!cat?`<ellipse cx="55" cy="${adult?49:59}" rx="${adult?17:12}" ry="${adult?12:8}" fill="#f4dfc2"/>`:''}
        <path d="m50 ${adult?45:58} 5 5 5-5" fill="#805e47"/><path d="M55 ${adult?50:63}q-6 7-10 0m10 0q6 7 10 0" fill="none" stroke="#956953" stroke-width="2"/>
        ${cat&&adult?'<g stroke="#9e7350" stroke-width="1.8" stroke-linecap="round"><path d="M37 48 22 45m15 9-15 3m51-9 15-3m-15 9 15 3"/></g>':''}
        ${!cat?`<path class="creature-tongue" d="M51 ${adult?56:68}v5q4 6 8 0v-5" fill="#d98e83"/>`:''}</g>`;
    } else if (species === 'bee') drawing = `<g class="creature-wings" fill="#fffdf3" stroke="#d2ddd2" stroke-width="1.5"><ellipse cx="43" cy="${adult?27:34}" rx="${adult?17:13}" ry="${adult?24:16}" transform="rotate(-30 43 29)"/><ellipse cx="70" cy="${adult?27:34}" rx="${adult?17:13}" ry="${adult?24:16}" transform="rotate(30 70 29)"/>${adult?'<path d="m40 14 8 28m28-29-12 28" fill="none"/>':''}</g>
      ${adult?'<g class="creature-antennae" fill="none" stroke="#74644b" stroke-width="3" stroke-linecap="round"><path d="M28 45 20 33m17 10 1-14"/></g><g class="creature-feet" stroke="#74644b" stroke-width="3"><path d="m48 77-8 12m26-10 3 10m10-15 6 11"/></g><g class="creature-pollen" fill="#efb549"><circle cx="41" cy="85" r="6"/><circle cx="69" cy="85" r="6"/></g>':''}
      <ellipse cx="55" cy="62" rx="${adult?39:32}" ry="${adult?24:28}" fill="${adult?'#eab849':'#f8d988'}"/>
      <g stroke="${adult?'#6c5a40':'#938364'}" stroke-width="${adult?8:7}" fill="none"><path d="${adult?'M44 40q-7 22 0 44m18-45q-5 22 0 46m17-40q-2 18 0 33':'M48 36q-7 26 0 52m20-49q-6 23 0 46'}"/></g>
      <circle class="creature-eyes" cx="${adult?28:34}" cy="57" r="${adult?3:4.5}" fill="#3e4037"/><path d="M${adult?22:28} 68q5 5 9 0" fill="none" stroke="#3e4037" stroke-width="2"/>`;
    else if (species === 'cow' || species === 'sheep') drawing = livestock(species, adult, eyes);
    else drawing = `<g class="creature-tail" fill="${adult?'#dc8f52':'#e8b48f'}"><path d="${adult?'M77 53Q96 23 105 28Q93 52 106 60Q93 70 105 94Q94 95 77 70Z':'m74 54 22-13v35L74 69Z'}"/>${adult?'<path d="m83 59 16-18m-16 22 17 17" fill="none" stroke="#f0bd78" stroke-width="3"/>':''}</g>
      <g class="creature-fins" fill="${adult?'#e5a35e':'#efd0a8'}"><path d="${adult?'M39 38Q54 7 76 37M43 80q19 25 30-2':'m43 39 13-13 8 16m-18 35 10 14 7-13'}"/></g>
      <ellipse cx="51" cy="60" rx="${adult?37:30}" ry="${adult?24:27}" fill="${adult?'#efb364':'#f7d3aa'}"/>
      ${adult?'<g fill="none" stroke="#db9c55" stroke-width="2"><path d="M53 46q8 6 0 12m12-14q8 6 0 12M53 62q8 6 0 12m12-14q8 6 0 12"/></g>':''}
      <circle class="creature-eyes" cx="32" cy="55" r="${adult?3.5:5}" fill="#3e4037"/><path d="M24 65q6 6 12 0m6-14q-10 10 0 19" fill="none" stroke="#cf9068" stroke-width="2.5"/>`;
    const mouthDetail = species === 'cat' ? `<path display="none" class="care-tongue" d="M52 ${adult ? 53 : 65}v9q3 6 6 0v-9" fill="#df8f98"/>`
      : species === 'bee' ? `<path display="none" class="care-proboscis" d="M${adult ? 24 : 30} 70q-8 6-8 14" fill="none" stroke="#8c6655" stroke-width="3" stroke-linecap="round"/>`
      : species === 'fish' ? '<ellipse display="none" class="care-fish-mouth" cx="25" cy="65" rx="4" ry="5" fill="#b77a55" stroke="#f4ca93" stroke-width="2"/>' : '';
    if (species === 'cat') drawing = drawing.replace(/<\/g>$/, mouthDetail + '</g>');
    else drawing += mouthDetail;
    const fleece = species === 'sheep' ? ` data-fleece="${adult && !fullFleece ? 'short' : 'full'}"` : '';
    return `<svg class="farm-creature creature-${species}" data-age="${age}"${fleece} viewBox="0 0 110 114" aria-hidden="true" focusable="false"><g class="creature-facing"><g class="creature-size" transform="translate(55 98) scale(${adult?1:.78}) translate(-55 -98)"><g class="creature-pose">${drawing}</g></g>${careProps(species, adult)}${adult ? livestockTools(species) : ''}</g></svg>`;
  }

  function landscape(zone) {
    const tree = (x, y, scale = 1) => `<g transform="translate(${x} ${y}) scale(${scale})"><path d="M0 0v105" stroke="#9e8661" stroke-width="15" stroke-linecap="round"/><path d="m0 50-28-26m28 40 24-31" stroke="#9e8661" stroke-width="8"/><circle cx="-28" cy="0" r="43" fill="#7da882"/><circle cx="27" cy="-10" r="47" fill="#93b58a"/><circle cx="0" cy="-40" r="43" fill="#a2c397"/></g>`;
    const fence = Array.from({ length: 14 }, (_, i) => `<path d="M${80 + i * 80} 385v60"/>`).join('');
    const flowers = Array.from({ length: 18 }, (_, i) => { const x = 30 + (i * 137) % 1150, y = 505 + (i * 47) % 180; return `<g transform="translate(${x} ${y})"><path d="M0 0v12m0-3 7-4" stroke="#779a65" stroke-width="3"/><circle r="5" fill="${i % 2 ? '#f4df9a' : '#fff8e8'}"/></g>`; }).join('');
    return `<svg class="farm-landscape" viewBox="0 0 1200 720" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs><linearGradient id="farmSky" x2="0" y2="1"><stop stop-color="#dcece4"/><stop offset="1" stop-color="#f7f4df"/></linearGradient><linearGradient id="farmGrass" x2="0" y2="1"><stop stop-color="#bfd39d"/><stop offset="1" stop-color="#dce4b6"/></linearGradient></defs>
      <path fill="url(#farmSky)" d="M0 0h1200v720H0z"/><circle cx="950" cy="112" r="48" fill="#f6df9a"/><circle cx="950" cy="112" r="67" fill="#f6df9a" opacity=".2"/>
      <g fill="#fffdf4" opacity=".8"><path d="M130 117q-20-28 11-32q9-35 39-16q29-14 37 17q35 5 13 31z"/><path d="M660 165q-20-28 11-32q9-35 39-16q29-14 37 17q35 5 13 31z"/></g>
      <path d="M0 320Q180 180 420 295T860 295T1200 260V720H0" fill="#c6d8b7"/><path d="M0 360Q270 235 510 340T1000 325T1200 325V720H0" fill="#b0c8a0"/><path d="M0 417Q300 373 600 415T1200 393V720H0" fill="url(#farmGrass)"/>
      <path d="M570 398Q475 500 620 720H860Q650 510 650 398" fill="#ece1b9"/>
      <g stroke="#f6eed7" stroke-width="11" stroke-linecap="round"><path d="M65 403H1160M65 432H1160"/>${fence}</g>
      ${tree(95, 280, 1.2)}${tree(1090, 300, 1.3)}${tree(990, 330, .65)}
      <g transform="translate(210 228)"><path d="M0 66h205v145H0" fill="#ce8c72"/><path d="m-20 73 122-91 124 91" fill="#a9705d" stroke="#f8edcf" stroke-width="9" stroke-linejoin="round"/><path d="M70 117h67v94H70" fill="#926c57"/><path d="m76 124 54 79m0-79-54 79" stroke="#ead5ad" stroke-width="5"/><rect x="83" y="39" width="40" height="38" rx="7" fill="#f5e8c4"/><path d="M103 40v36m-20-18h40" stroke="#a9705d" stroke-width="4"/><path d="M-5 211h215" stroke="#a68e60" stroke-width="9"/></g>
      ${zone === 'pond' ? '<ellipse cx="625" cy="544" rx="368" ry="138" fill="#a4bda3"/><ellipse cx="625" cy="534" rx="346" ry="122" fill="#a7d1ce"/><g stroke="#e2eece" stroke-width="4" fill="none"><path d="M425 482h75m130 106h90m-220-54h45m187-39h70"/></g><ellipse cx="835" cy="570" rx="34" ry="14" fill="#7fa987"/><path d="m828 557 8-22 14 21" fill="#edc2b3"/>' : ''}
      ${zone === 'field' ? '<path d="M310 440h590l45 216H265z" fill="#b8c78d" opacity=".65"/>' : ''}
      ${flowers}
    </svg>`;
  }
  const cropLeaves = {
    nut: '<path d="M39 41C30 43 14 35 17 24c12-1 22 7 22 17M41 34c0-10 11-18 22-17 1 11-11 18-22 17M40 28C31 25 29 14 35 8c8 2 11 13 5 20" fill="#82ad65" stroke="#557d49"/>',
    bean: '<path d="M39 42C26 44 11 31 19 26c4-3 8 0 10 3 1-6 8-7 11-2 3 5 3 11-1 15M43 34c-4-4-2-11 2-14 5-4 9 0 9 5 3-4 9-5 11-1 5 7-10 14-22 10" fill="#7fb467" stroke="#4e7c4a"/>',
    corn: '<path d="M39 52C20 48 27 35 13 31c14-2 23 8 26 21M40 45c4-15 17-20 28-18-12 2-10 17-28 18M39 36C25 30 32 19 22 14c12 0 18 9 17 22M40 28c2-11 10-16 18-15-8 7-9 15-18 15" fill="#82b861" stroke="#507e45"/>',
  };
  const ripeCrops = {
    nut: '<path d="m52 31 3-9 4 3 7-2 2 5 6 4-4 5 2 6-7 1-5 5-5-5-8 1 2-7-4-4Z" fill="#c5ad66" stroke="#826b3f"/><path d="M51 36q9-2 10 12-11 5-13-3 0-5 3-9m15-3q8 4 6 12-7 6-13 0 0-7 7-12" fill="#ae643f" stroke="#804c32"/>',
    bean: '<path d="M52 32q3-3 6 1c11 3 16 14 9 22-10-3-12-10-14-17Zm-10 7q-2-5-7-1c-4 7-8 9-17 8 4 10 19 6 24-7Z" fill="#a9c96e" stroke="#507e45"/><path d="M57 38q8 5 9 13M36 41q-5 7-13 8" fill="none" stroke="#709946"/>',
    corn: '<ellipse cx="48" cy="33" rx="9" ry="15" transform="rotate(20 48 33)" fill="#f6ce60" stroke="#b6843d"/><path d="M47 22l-6 14m11-12-6 16m-4-14 11 5m-13 1 11 5" stroke="#d4a23f"/><path d="M40 52Q30 43 37 28q3 10 8 13 7-3 14-12-1 19-19 23" fill="#8eb75e" stroke="#507e45"/>',
  };
  function crop(type, stage) {
    const seed = {
      nut: '<path d="M31 47q3-9 11-9 7 4 9 12-2 7-11 6-8 1-9-9Z" fill="#a9623d" stroke="#75492d"/><path d="M32 51q7 4 17 0" fill="none" stroke="#edb785"/>',
      bean: '<path d="M33 43q9-6 16 0 6 6-3 12-8 3-13-1-3-4 3-5 5-1 2-4Z" fill="#b8775a" stroke="#85553d"/>',
      corn: '<path d="M34 42q7-6 14-1l-2 11-5 5-7-3Z" fill="#f5c85e" stroke="#ab7933"/><path d="M38 44q4-3 7-1" fill="none" stroke="#fff1a8"/>',
    };
    const flower = {
      nut: '<path d="M59 24q8 2 5 12m2-11q8 7 3 16m-14-16q6 6 3 14" fill="none" stroke="#e6cc85" stroke-width="4" stroke-linecap="round"/>',
      bean: '<path d="M55 31q-8-3-4-8 3-4 8-1 5-3 8 1 4 5-4 8-4 6-8 0Z" fill="#ce9bce" stroke="#9a659f"/><path d="m56 28 5 0" stroke="#fff2cc" stroke-linecap="round"/>',
      corn: '<path d="M40 25V6m0 11-7-9m7 8 8-8m-8 12 10-6" fill="none" stroke="#dfb252" stroke-width="2.5" stroke-linecap="round"/>',
    };
    const sprout = '<path d="M41 54q2-10-1-21" fill="none" stroke="#56814a" stroke-width="2.5"/><path d="M40 43c-9 1-15-5-15-10 8-1 13 3 15 10m1-4c0-7 6-12 14-11-1 7-7 11-14 11" fill="#94bc69" stroke="#56814a"/>';
    const plant = '<path d="M40 53q2-19 0-40" fill="none" stroke="' + (type === 'nut' ? '#846046' : '#52814a') + '" stroke-width="3" stroke-linecap="round"/>' + cropLeaves[type];
    const artwork = [seed[type], sprout, plant, plant + flower[type], plant + ripeCrops[type]][stage - 1];
    return `<svg class="crop-art" viewBox="0 0 80 64" data-crop="${type}" data-stage="${stage}" aria-hidden="true"><ellipse cx="40" cy="54" rx="29" ry="8" fill="#ad875f"/><path d="M17 54q9-4 15-1m16 1q7-3 14 1" fill="none" stroke="#e3c199" stroke-width="2" stroke-linecap="round"/><g stroke-width="1.5" stroke-linejoin="round">${artwork}</g></svg>`;
  }
  return { animal, landscape, crop };
})();
