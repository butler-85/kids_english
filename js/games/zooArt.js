/* The same local scene is used for the preview and for the paid animal actions. */
const ZooArt = (() => {
  const snakeGlide = 'M344 181C324 167 305 158 285 175C264 193 244 191 228 174C220 167 216 163 207 161';
  const animals = {
    elephant: `
      <path d="M310 124q29 13 24 36" fill="none" stroke="#657285" stroke-width="5" stroke-linecap="round"/>
      <path d="M333 155q-8 5-1 14 8-5 1-14" fill="#657285"/>
      <g class="zoo-walk-leg leg-far" style="transform-origin:199px 145px"><path d="M199 145v51" fill="none" stroke="#a7b2bf" stroke-width="23" stroke-linecap="round"/></g>
      <g class="zoo-walk-leg" style="transform-origin:289px 145px"><path d="M289 145v51" fill="none" stroke="#a7b2bf" stroke-width="23" stroke-linecap="round"/></g>
      <g class="zoo-walk-leg" style="transform-origin:216px 151px"><path d="M216 151v49" stroke="#8999af" stroke-width="25" stroke-linecap="round"/><path d="M207 200h18" stroke="#637389" stroke-width="4" stroke-linecap="round"/><path d="M206 192q5-8 11 0" fill="none" stroke="#c5cdd3" stroke-width="3"/></g>
      <g class="zoo-walk-leg leg-far" style="transform-origin:292px 152px"><path d="M292 152v48" stroke="#8999af" stroke-width="25" stroke-linecap="round"/><path d="M283 200h18" stroke="#637389" stroke-width="4" stroke-linecap="round"/><path d="M282 192q5-8 11 0" fill="none" stroke="#c5cdd3" stroke-width="3"/></g>
      <ellipse cx="254" cy="130" rx="69" ry="49" fill="#98aaba" stroke="#64798b" stroke-width="3"/>
      <path d="M226 91q48-20 75 15-43-22-75-6" fill="#bfcad2" opacity=".75"/>
      <path d="M268 165q33-3 46-23-10 29-51 34Z" fill="#74899d" opacity=".42"/>
      <ellipse cx="189" cy="124" rx="43" ry="39" fill="#a5b5c6" stroke="#64798b" stroke-width="3"/>
      <path d="M194 99q47-24 51 19-2 51-31 39-29-9-20-58Z" fill="#8e9db7" stroke="#64798b" stroke-width="3"/>
      <path d="M201 109q33-18 32 17-4 31-17 23-15-8-15-40" fill="#b4a1b7"/>
      <path d="M204 114q9-7 18-3-9 1-15 7m15 26q6-8 8-17" fill="none" stroke="#c9b7c8" stroke-width="2" stroke-linecap="round"/>
      <circle cx="169" cy="119" r="5" fill="#354551"/><circle cx="170" cy="118" r="1.6" fill="#fff"/>
      <path d="M174 137q6 3 11-1" fill="none" stroke="#657285" stroke-width="2.5" stroke-linecap="round"/>
      <ellipse class="zoo-feeding feed-elephant-mouth" cx="179" cy="137" rx="8" ry="4" fill="#536473"/>
      <g class="elephant-trunk" fill="none" stroke-linecap="round"><path d="M154 126C152 146 139 172 117 155" stroke="#65798d" stroke-width="20"/><path d="M154 126C152 146 139 172 117 155" stroke="#aab9ca" stroke-width="15"/></g>`,
    giraffe: `
      <path d="M312 142q15 19 10 30" stroke="#a87c53" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="m318 169 7 1-3 9Z" fill="#94684b"/>
      <g class="zoo-walk-leg leg-far" style="transform-origin:224px 145px"><path d="M224 145v54" stroke="#dbaf60" stroke-width="10" stroke-linecap="round"/></g>
      <g class="zoo-walk-leg" style="transform-origin:289px 147px"><path d="M289 147v52" stroke="#dbaf60" stroke-width="10" stroke-linecap="round"/></g>
      <g class="zoo-walk-leg" style="transform-origin:213px 145px"><path d="M213 145v58" stroke="#ecc274" stroke-width="12" stroke-linecap="round"/><path d="M207 202h12" stroke="#8c6a4e" stroke-width="6" stroke-linecap="round"/></g>
      <g class="zoo-walk-leg leg-far" style="transform-origin:275px 149px"><path d="M275 149v54" stroke="#ecc274" stroke-width="12" stroke-linecap="round"/><path d="M269 202h12" stroke="#8c6a4e" stroke-width="6" stroke-linecap="round"/></g>
      <ellipse cx="250" cy="141" rx="57" ry="34" fill="#efc879" stroke="#ac8253" stroke-width="3"/>
      <path d="m218 124 8-11 13 5 2 12-12 7-10-5m37 7 6-13 15-1 6 8-6 12-13 4m-37 5 8-7 11 5 1 10-9 6-12-3m55-46 7-8 12 3 4 7-7 7Z" fill="#b67a52"/>
      <path d="M238 113q30-6 48 8-23-8-47-3m-15 47q24 12 59-2-25 16-59 7" fill="#f8dda1" opacity=".85"/>
      <path d="m288 150 6-5 6 5-7 9-7-3m-32-39 10-4 6 6-8 5Z" fill="#ba8256"/>
      <g class="giraffe-neck">
        <path d="M211 137 187 72l25-10 29 66q5 18-10 24-13 5-20-15Z" fill="#efc879" stroke="#ac8253" stroke-width="3"/>
        <path d="m194 87 13-7 9 8-2 9-11 4m6 11 11-7 8 8-2 10-12 3" fill="#b67a52"/>
        <g class="giraffe-head">
          <path d="M181 56 176 38m20 15 4-17" stroke="#a87c53" stroke-width="5" stroke-linecap="round"/>
          <circle cx="176" cy="37" r="4" fill="#805e47"/><circle cx="201" cy="35" r="4" fill="#805e47"/>
          <path d="M197 56q13-17 23-8-2 14-18 17" fill="#e2ad69" stroke="#ab8255" stroke-width="2"/>
          <path d="M180 49q-14-11-18-2 1 12 15 14" fill="#e2ad69" stroke="#ab8255" stroke-width="2"/>
          <path d="M167 62q8-20 27-14 20 6 16 25-5 18-28 16-20-2-22-12-1-8 7-15Z" fill="#f1cc80" stroke="#ac8253" stroke-width="3"/>
          <ellipse cx="174" cy="76" rx="15" ry="10" fill="#f8dda2"/>
          <circle cx="185" cy="62" r="4" fill="#4c493a"/><circle cx="186" cy="61" r="1.2" fill="#fff"/>
          <path d="M166 76h1m5 4q4 3 8-1" fill="none" stroke="#8c634d" stroke-width="2" stroke-linecap="round"/>
          <path class="zoo-feeding feed-giraffe-tongue" d="M172 81q-10 6-19 4-10-3-8-11" pathLength="1" fill="none" stroke="#685473" stroke-width="5" stroke-linecap="round"/>
        </g>
      </g>`,
    seal: `
      <path d="M274 167q18-34 43-26 7 14-10 25 22-6 27 7-11 21-49 9Z" fill="#899fa7" stroke="#617d87" stroke-width="3"/>
      <path d="M278 169q-11-38-64-49-44-8-62 23-14 25 11 43 31 17 110 0 14-5 5-17Z" fill="#91a9b1" stroke="#617d87" stroke-width="3"/>
      <path d="M169 171q32 12 81 4-41 27-82 12Z" fill="#bdccd0"/>
      <path d="M173 146q19-18 42-12 16 2 28 10-52-9-70 10Z" fill="#b1c2c7" opacity=".78"/>
      <g fill="#71909a" opacity=".68"><ellipse cx="228" cy="152" rx="4" ry="2.5"/><ellipse cx="240" cy="158" rx="5" ry="2.5"/><ellipse cx="251" cy="153" rx="2.6" ry="1.8"/><ellipse cx="261" cy="164" rx="4" ry="2.5"/></g>
      <path d="M211 152q16 9 28 38-21 9-41-19" fill="#829fa8" stroke="#617d87" stroke-width="3" stroke-linejoin="round"/>
      <g class="seal-head">
        <ellipse cx="159" cy="125" rx="37" ry="31" fill="#a6b9bf" stroke="#617d87" stroke-width="3"/>
        <ellipse cx="137" cy="134" rx="21" ry="12" fill="#c6d4d5"/>
        <circle cx="151" cy="117" r="4.4" fill="#384d55"/><circle cx="152" cy="116" r="1.4" fill="#fff"/>
        <path d="M127 129q7-5 12 0l-6 5Z" fill="#4d646d"/>
        <path d="M134 136q6 7 12 0m-11-3-13-3m13 9-14 2m24-8 10-4m-8 10 10 1" fill="none" stroke="#6d858a" stroke-width="2" stroke-linecap="round"/>
        <g class="zoo-feeding feed-seal-mouth"><path d="M126 137q12 5 21 0-3 16-15 12-6-2-6-12Z" fill="#b9cdd0" stroke="#617d87" stroke-width="2"/><path d="M126 137q12 5 21 0-10 13-19 8Z" fill="#516670"/></g>
      </g>`,
    monkey: `
      <path class="monkey-tail" d="M244 150q22 34 50 19 17-11 15-32-2-14-15-14-14 1-12 13 1 6 8 7" fill="none" stroke="#775639" stroke-width="10" stroke-linecap="round"/>
      <path d="M230 148q22 8 22 40m-39-31q-24 5-11 31" fill="none" stroke="#866044" stroke-width="17" stroke-linecap="round"/>
      <ellipse cx="248" cy="188" rx="14" ry="7" fill="#ba8e61" stroke="#815e48" stroke-width="2"/>
      <ellipse cx="199" cy="189" rx="14" ry="7" fill="#c3976a" stroke="#815e48" stroke-width="2"/>
      <path d="M187 133q-1-28 22-34 24-8 39 19 12 27-5 43-16 13-35 4-24-9-21-32Z" fill="#a87950" stroke="#77573f" stroke-width="3"/>
      <ellipse cx="217" cy="141" rx="21" ry="23" transform="rotate(-18 217 141)" fill="#d4ac79"/>
      <path d="M225 120q14 1 19 13-4-15-14-19Z" fill="#e2be8a"/>
      <g class="monkey-peel-arm">
        <path d="M238 116C252 130 231 153 215 143" fill="none" stroke="#956741" stroke-width="12" stroke-linecap="round"/>
        <ellipse class="monkey-peel-hand" cx="214" cy="143" rx="8" ry="6" transform="rotate(-20 214 143)" fill="#c79a6b" stroke="#8b684a" stroke-width="2"/>
      </g>
      <g class="monkey-hold-arm">
        <path d="M203 114q-23 3-24 18-1 12-12 16" fill="none" stroke="#936544" stroke-width="13" stroke-linecap="round"/>
        <circle cx="166" cy="148" r="7.5" fill="#c99a6d" stroke="#8b684a" stroke-width="2"/>
        <g class="zoo-feeding monkey-held-banana">
          <path class="monkey-banana-tip" d="M168 147q12-1 11-12l5-1q3 17-14 19Z" fill="#f5d47b" stroke="#b58c46" stroke-width="2"/>
          <path class="monkey-banana-flesh" d="M168 148q12-3 12-13l4-1q4 13-12 18Z" fill="#fff1c4" stroke="#c6a064" stroke-width="1.5"/>
          <path class="monkey-banana-peel" d="M172 144q-8 2-9 13 5-4 9-5 5 6 9 4-2-8-9-12Z" fill="#edc566" stroke="#bc944c" stroke-width="1.6"/>
        </g>
        <path d="M162 145q3 1 4 4m4-5 1 4" fill="none" stroke="#966e51" stroke-width="1.6" stroke-linecap="round"/>
      </g>
      <g class="monkey-vine-arm">
        <path d="M237 116q19-2 12-11" fill="none" stroke="#976949" stroke-width="13" stroke-linecap="round"/>
        <circle cx="248" cy="105" r="7" fill="#c99a6d" stroke="#8b684a" stroke-width="2"/>
      </g>
      <g class="monkey-head">
        <circle cx="151" cy="90" r="16" fill="#b58961" stroke="#795840" stroke-width="3"/><circle cx="224" cy="88" r="16" fill="#b58961" stroke="#795840" stroke-width="3"/>
        <circle cx="151" cy="91" r="8" fill="#d2a181"/><circle cx="224" cy="89" r="8" fill="#d2a181"/>
        <path d="M153 91q3-29 26-35 0-7 10-9l3 8q23 1 30 25 14 35-25 46-42 6-44-35Z" fill="#ae7951" stroke="#795840" stroke-width="3"/>
        <path d="M166 95q-6-13 6-20 10-4 16 6 13-11 22 1 5 9-2 18 5 19-20 20-24 0-26-13-1-7 4-12Z" fill="#edc49a"/>
        <circle cx="176" cy="92" r="4.1" fill="#4e4338"/><circle cx="198" cy="90" r="4.1" fill="#4e4338"/><circle cx="175" cy="91" r="1.2" fill="#fff7dc"/><circle cx="197" cy="89" r="1.2" fill="#fff7dc"/>
        <path d="m182 102 7-1m-14 8q9 8 19-1" fill="none" stroke="#9a694f" stroke-width="2.1" stroke-linecap="round"/>
        <ellipse class="zoo-feeding monkey-cheek" cx="181" cy="111" rx="7" ry="3.6" fill="#865c45"/>
      </g>`,
    panda: `
      <path d="M181 135q12-24 41-23 37-1 49 32 17 45-17 56-30 12-60-1-31-14-13-64Z" fill="#303b40" stroke="#283439" stroke-width="3"/>
      <ellipse cx="224" cy="162" rx="39" ry="38" fill="#f7f6e9"/>
      <path d="M252 146q17 30-10 47-13 8-30 5 37-1 40-52Z" fill="#d9dfcf"/>
      <path d="M199 148q-8 13-5 25" fill="none" stroke="#fffdf3" stroke-width="5" stroke-linecap="round"/>
      <path d="M185 130q-20 4-18 25 1 20 17 20 14-3 12-18l4-20Z" fill="#354147" stroke="#283439" stroke-width="2.5"/>
      <path d="M175 144q-4 10-1 15" fill="none" stroke="#536067" stroke-width="3" stroke-linecap="round"/>
      <g class="panda-foot" transform="rotate(13 190 189)"><ellipse cx="190" cy="189" rx="24" ry="18" fill="#303c42" stroke="#283439" stroke-width="2.5"/><ellipse cx="187" cy="192" rx="10" ry="7" fill="#4d5b60"/><path d="m180 181 2 2m6-4 1 3m6-3v3" stroke="#7e8987" stroke-width="2" stroke-linecap="round"/></g>
      <g class="panda-foot" transform="rotate(-13 258 189)"><ellipse cx="258" cy="189" rx="24" ry="18" fill="#303c42" stroke="#283439" stroke-width="2.5"/><ellipse cx="261" cy="192" rx="10" ry="7" fill="#4d5b60"/><path d="m252 179v3m6-3 1 3m6-1-1 2" stroke="#7e8987" stroke-width="2" stroke-linecap="round"/></g>
      <g class="panda-head">
        <circle cx="182" cy="65" r="16" fill="#303b40" stroke="#283439" stroke-width="2.5"/><circle cx="254" cy="65" r="16" fill="#303b40" stroke="#283439" stroke-width="2.5"/>
        <circle cx="182" cy="65" r="8" fill="#4d5a60"/><circle cx="254" cy="65" r="8" fill="#4d5a60"/>
        <path d="M167 102q-1-40 51-42 50 1 52 41 4 30-28 39-22 7-47-2-31-9-28-36Z" fill="#fbfaf0" stroke="#46524e" stroke-width="2.8"/>
        <path d="M173 109q5 25 42 31-31-1-43-15-6-8-5-20Zm88-29q10 17 8 32-4 22-32 28 25-12 24-31 3-15 0-29Z" fill="#e0e5d8"/>
        <path d="M188 76q28-17 53-1" fill="none" stroke="#fffef8" stroke-width="5" stroke-linecap="round"/>
        <ellipse cx="194" cy="105" rx="13" ry="18" transform="rotate(28 194 105)" fill="#303c42"/>
        <ellipse cx="243" cy="105" rx="13" ry="18" transform="rotate(-28 243 105)" fill="#303c42"/>
        <ellipse cx="197" cy="103" rx="6" ry="7" fill="#fdfcf2"/><ellipse cx="240" cy="103" rx="6" ry="7" fill="#fdfcf2"/>
        <ellipse cx="198" cy="104" rx="4.1" ry="5" fill="#222f35"/><ellipse cx="239" cy="104" rx="4.1" ry="5" fill="#222f35"/>
        <circle cx="199" cy="102" r="1.7" fill="#fff"/><circle cx="240" cy="102" r="1.7" fill="#fff"/>
        <ellipse cx="218.5" cy="125" rx="19" ry="11" fill="#fffdf2"/>
        <path d="M211 119q7-5 15 0 0 6-7 7-7-1-8-7Z" fill="#344147"/>
        <path d="M215 119h6" fill="none" stroke="#738080" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M219 126v3m0 0q-4 5-9 0m9 0q4 5 9 0" fill="none" stroke="#46524e" stroke-width="1.8" stroke-linecap="round"/>
        <ellipse class="zoo-feeding feed-panda-mouth" cx="219" cy="131" rx="5.5" ry="3.5" fill="#46524e"/>
        <ellipse cx="184" cy="124" rx="6" ry="2.5" fill="#e9bda7" opacity=".55"/><ellipse cx="253" cy="124" rx="6" ry="2.5" fill="#e9bda7" opacity=".55"/>
      </g>
      <g class="panda-paw"><path d="M250 129q14 0 16 15 1 17-22 22-18 2-22-10-2-9 12-11 8-2 8-9Z" fill="#354147" stroke="#283439" stroke-width="2.5"/><path d="M255 137q5 8-1 14" fill="none" stroke="#536067" stroke-width="3" stroke-linecap="round"/><path d="m229 153 6 1m-5 4 6 1" stroke="#7e8987" stroke-width="1.6" stroke-linecap="round"/>
        <path class="zoo-feeding feed-panda-grip" d="M236 149q-13-5-14 3-1 7 12 9" fill="#425056" stroke="#283439" stroke-width="2" stroke-linecap="round"/>
      </g>`,
    penguin: `
      <ellipse cx="230" cy="196" rx="24" ry="9" fill="#e6ac64" stroke="#b98556" stroke-width="2"/>
      <ellipse cx="195" cy="196" rx="23" ry="9" fill="#e6ac64" stroke="#b98556" stroke-width="2"/>
      <path class="penguin-wing penguin-wing-far" d="M255 116q34 15 36 39-24 6-46-18Z" fill="#536e7a" stroke="#3a565f" stroke-width="3"/>
      <path d="M173 100q-4-40 28-52 31-11 51 12 20 26 20 71 8 59-47 60-56 4-62-45-1-25 10-46Z" fill="#516976" stroke="#36505f" stroke-width="3"/>
      <path d="M200 55q-19 11-17 29 15-5 24-18 14 14 41 12-12-34-48-23Z" fill="#718895" opacity=".9"/>
      <path d="M185 113q20-22 42-15 27 10 28 39 4 40-34 46-43 4-46-32-3-25 10-38Z" fill="#fbf5e8"/>
      <path class="penguin-wing" d="M179 113q-34 22-34 45 13 17 42-25Z" fill="#496371" stroke="#36505f" stroke-width="3" stroke-linejoin="round"/>
      <g class="penguin-head"><path d="M181 86q10-20 25-10 13-10 27 4 10 16-5 21-16 6-26-1-14 7-22-4-4-4 1-10Z" fill="#eee8d6"/>
        <circle cx="193" cy="87" r="4" fill="#334b50"/><circle cx="219" cy="84" r="4" fill="#334b50"/>
        <path d="m193 98 15-7 15 5-13 12Z" fill="#e5a860" stroke="#af7d48" stroke-width="2"/><path d="m194 98 24-1" stroke="#c2884c" stroke-width="1.5"/>
        <g class="zoo-feeding feed-penguin-beak"><path d="m193 98 29-2-11 18Z" fill="#e5a860" stroke="#af7d48" stroke-width="2"/><path d="m194 98 27-2-13 12Z" fill="#714f47"/><path d="m193 98 15-7 15 5Z" fill="#edb773" stroke="#af7d48" stroke-width="1.4"/></g>
        <path d="M180 101q8 8 16 8m41-14q-2 8-10 11" fill="none" stroke="#e7ba77" stroke-width="4" stroke-linecap="round"/>
      </g>`,
    parrot: `
      <g class="parrot-tail" stroke="#365e87" stroke-width="2.5" stroke-linejoin="round">
        <path d="M226 144q16 30 40 71-21-4-39-28l-16-34Z" fill="#329bc1"/>
        <path d="M218 147q10 35 29 78-23-10-38-47l-7-26Z" fill="#4278b8"/>
        <path d="M212 151q10 31 27 62" fill="none" stroke="#92d1e3" stroke-width="2"/>
      </g>
      <path d="M188 89q31-17 51 10 20 27 2 51-13 20-35 14-23-7-26-32-2-23 8-43Z" fill="#e75f4e" stroke="#a74c43" stroke-width="3"/>
      <path d="M189 112q-5 32 19 44 8 3 17-1-25-16-25-43Z" fill="#f99268"/>
      <g class="parrot-wing" stroke-width="2.4" stroke-linejoin="round">
        <path d="M221 105q27-1 31 25l15 39q-15 1-25-10-6 4-14-3-19-15-19-34Z" fill="#388bc5" stroke="#356a91"/>
        <path d="M213 113q22-11 35 6l7 21q-12 6-20-4-10 5-22-9Z" fill="#f5cd56" stroke="#ca9c43"/>
        <path d="M218 103q23-3 28 15-10 8-19 1-9 5-17 0 0-10 8-16Z" fill="#e96950" stroke="#b95742"/>
        <path d="m232 139 14 17m-3-19 14 21" fill="none" stroke="#9fd4e8" stroke-linecap="round"/>
      </g>
      <g class="parrot-head">
        <path d="M164 98q-11-13-4-29 8-18 28-17 27 0 34 24 5 17-7 30-8 10-23 7-17-2-28-15Z" fill="#ed6953" stroke="#a74c43" stroke-width="3"/>
        <path d="M171 63q16-10 30 0" fill="none" stroke="#ffac80" stroke-width="4" stroke-linecap="round"/>
        <path d="M161 82q4-13 17-13 17 0 23 15 4 13-7 20-17 9-31-5Z" fill="#fff5dc"/>
        <circle cx="178" cy="84" r="6.3" fill="#333e45"/><circle cx="180" cy="82" r="2" fill="#fff"/>
        <path d="m187 94 6 1m-8 4 5 1" fill="none" stroke="#e1a38a" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M160 94q7 5 4 12-4 6-11 3l-5-8Z" fill="#495864" stroke="#34454d" stroke-width="2"/>
        <path d="M162 82q-18-7-25 7-7 17 9 29 7-9 5-17l13-2q4-8-2-17Z" fill="#f6dba1" stroke="#655747" stroke-width="2.5"/>
        <path d="M136 98q0 12 10 20 7-9 5-17Z" fill="#3c4e5c"/>
        <path d="M142 89q6-6 13-2" fill="none" stroke="#fff3d1" stroke-width="3" stroke-linecap="round"/>
        <path class="zoo-feeding feed-parrot-beak" d="M147 106q9 1 16-5 1 12-8 14Z" fill="#495864" stroke="#34454d" stroke-width="1.8"/>
      </g>
      <g fill="none" stroke="#6b6663" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round">
        <path d="M224 158 222 172m-7 5q5-9 10-1m-3-4q7-3 10 3"/>
        <path class="parrot-free-foot" d="M204 155Q210 164 209 174M202 177Q207 169 213 175M209 174Q214 171 218 175"/>
      </g>`,
    kangaroo: `
      <g class="kangaroo-tail"><path d="M244 158q58 10 90-14 3 25-43 44-28 11-65-5Z" fill="#b08563" stroke="#90674f" stroke-width="3"/><path d="M252 169q47 5 72-12" fill="none" stroke="#cbab84" stroke-width="4" stroke-linecap="round"/></g>
      <path d="M221 165q27 10 25 31-17 7-27 1l-22-17Z" fill="#bd946d" stroke="#90674f" stroke-width="3"/>
      <ellipse cx="232" cy="138" rx="40" ry="47" fill="#c79a73" stroke="#90674f" stroke-width="3"/>
      <path d="M202 118q-12 45 20 57 25-16 17-46Z" fill="#e6c494"/>
      <path d="M214 142q9 5 20 2" fill="none" stroke="#b58d65" stroke-width="2"/>
      <path d="M223 151q25-7 35 15-6 27-40 32l-19 3q-19 2-11-9l25-8q-9-20 10-33Z" fill="#cc9f73" stroke="#946b53" stroke-width="3"/>
      <path d="M212 110q-6 17-20 23-8 3-8-4l14-15 2-13m24 15q-9 25-23 26-8 2-7-5l15-14" fill="#be906b" stroke="#946b53" stroke-width="3" stroke-linecap="round"/>
      <g class="kangaroo-head">
        <path d="M213 86q-12-15-6-40 13-6 16 34m2 6q5-29 18-31 11 12-8 38" fill="#c99b74" stroke="#946b53" stroke-width="3"/>
        <path d="M212 51q2 18 7 23m21-13q-2 10-9 18" fill="none" stroke="#e1b9a2" stroke-width="5" stroke-linecap="round"/>
        <path d="M205 76q32-11 39 14 8 23-26 25-28 5-41-13-3-8 12-13Z" fill="#cc9e76" stroke="#946b53" stroke-width="3"/>
        <path d="M182 101q11 11 32 7-7 12-25 6-11-3-7-13Z" fill="#e7c59b"/>
        <path d="M180 94q-13 7 2 13l7-11Z" fill="#6d5b4d"/><circle cx="207" cy="92" r="4.5" fill="#4d493b"/>
        <path d="M191 105q7 4 12 1" stroke="#946b53" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path class="zoo-feeding feed-kangaroo-mouth" d="M185 104q10 7 21 2-4 10-14 7-5-2-7-9Z" fill="#aa7d64" stroke="#8d674f" stroke-width="1.6"/>
      </g>`,
    dolphin: `
      <g class="dolphin-tail"><path d="M286 138q24-10 46 7 8 14-20 10 18 11 6 23-23-4-36-25Z" fill="#749bb6" stroke="#52758e" stroke-width="3"/></g>
      <path d="M236 96q9-29 33-29-7 23-13 30Z" fill="#80a6c0" stroke="#52758e" stroke-width="3"/>
      <path d="M144 119q-13-29 25-37 67-13 128 57-9 27-33 22-34-31-86-26-18-1-32-9l-19-3q-7-6 17-4Z" fill="#93b8cd" stroke="#52758e" stroke-width="3"/>
      <path d="M156 125q34-14 64-6 41 7 66 28-5 12-19 11-31-22-79-21-23 0-32-12Z" fill="#d5e6e5"/>
      <path d="M169 95q47-15 94 22-46-26-89-14" fill="#c5d9e4" opacity=".82"/>
      <path d="M227 124q3 28 30 41 8-2 2-13l-12-20Z" fill="#739bb5" stroke="#52758e" stroke-width="3"/>
      <circle cx="164" cy="114" r="4.7" fill="#3e5261"/><circle cx="165" cy="112" r="1.4" fill="#fff"/>
      <path d="M141 126q16 3 22-3" fill="none" stroke="#52758e" stroke-width="2.5" stroke-linecap="round"/>
      <g class="zoo-feeding feed-dolphin-jaw"><path d="M127 124q21 8 37-3-5 15-29 15-10-2-8-12Z" fill="#a9c9d4" stroke="#52758e" stroke-width="2"/><path d="M127 124q21 8 37-3-17 16-37 8Z" fill="#466774"/></g>
      <ellipse cx="170" cy="124" rx="6" ry="2.8" fill="#c194a1" opacity=".6"/>`,
    snake: `
      <g class="snake-glide" fill="none" stroke-linecap="round">
        <path d="${snakeGlide}" stroke="#536e58" stroke-width="24"/>
        <path d="${snakeGlide}" stroke="#94ac77" stroke-width="19"/>
        <path d="${snakeGlide}" stroke="#648671" stroke-width="7" stroke-dasharray="3 18"/>
      </g>
      <g class="snake-coils" fill="none" stroke-linecap="round">
        <path d="M335 152q-8-28-41-20-20 4-20 14" stroke="#668570" stroke-width="10"/>
        <path d="M291 136C225 129 221 158 267 161C337 166 323 198 253 198C199 198 166 196 161 177C158 164 183 154 208 160" stroke="#536e58" stroke-width="26"/>
        <path d="M291 136C225 129 221 158 267 161C337 166 323 198 253 198C199 198 166 196 161 177C158 164 183 154 208 160" stroke="#94ac77" stroke-width="21"/>
        <path d="M281 130q-40-4-40 13m46 29q28 6 15 13m-129-16q2-7 18-8" stroke="#b3c491" stroke-width="4"/>
        <path d="m262 136 8-7 9 8-7 7Zm-10 17 5-6 11 10-8 5Zm45 22 7-7 8 9-5 7Zm-29 19 8-8 11 5-6 8Zm-39 3 8-8 11 6-8 8Zm-38-9 7-5 9 8-7 5Zm-24-14 6-7 8 5-3 7Z" fill="#648671"/>
      </g>
      <g class="snake-upper">
        <g class="snake-neck" fill="none" stroke-linecap="round">
          <path d="M207 161C186 158 205 125 177 118" stroke="#536e58" stroke-width="26"/>
          <path d="M207 161C186 158 205 125 177 118" stroke="#94ac77" stroke-width="21"/>
        </g>
        <ellipse class="zoo-feeding snake-bulge" cx="170" cy="123" rx="16" ry="13" fill="#a0b681" stroke="#62836a" stroke-width="2"/>
        <g class="snake-head">
          <path class="snake-tongue" d="M133 119q-12 2-22-1m3 1-8-4m8 4-7 3" fill="none" stroke="#b97672" stroke-width="2.7" stroke-linecap="round"/>
          <path d="M133 108q12-16 36-10 21 4 26 20-4 16-22 18-25 1-40-11-7-7 0-17Z" fill="#9fb77e" stroke="#536e58" stroke-width="3"/>
          <path d="M129 119q19 8 46 5 6-1 11 0-4 10-24 10-22-1-33-11Z" fill="#e2d9a0"/>
          <path d="m158 103 10 1 7 6-9 5-11-5Z" fill="#789763"/>
          <circle cx="150" cy="111" r="5.4" fill="#e9cf87"/><circle cx="149" cy="111" r="3" fill="#4d543b"/><circle cx="148" cy="110" r="1" fill="#fff9e6"/>
          <path d="M131 118q13 7 29 6m-26-10h2" fill="none" stroke="#647954" stroke-width="2" stroke-linecap="round"/>
          <g class="zoo-feeding snake-gape">
            <path d="M130 117q17 9 34 5-4 23-23 18-11-4-11-23Z" fill="#b7ca91" stroke="#536e58" stroke-width="2"/>
            <path d="M130 118q16 10 32 5-6 16-19 13-10-2-13-18Z" fill="#66584d"/>
          </g>
        </g>
      </g>`,
    lion: `
      <g class="lion-tail">
        <path d="M296 139q48 1 38-34-1-8 5-9" fill="none" stroke="#a77b51" stroke-width="6" stroke-linecap="round"/>
        <path d="M332 103q-7-14 4-20 12 2 10 15-4 9-14 5" fill="#8f644d"/>
      </g>
      <path class="lion-foreleg-far" d="M208 151v45" stroke="#bb915f" stroke-width="15" stroke-linecap="round"/>
      <path class="lion-hindleg-far" d="M282 149v47" stroke="#bb915f" stroke-width="15" stroke-linecap="round"/>
      <path class="lion-forepaw" d="M194 150q-4 33 1 48h-17" fill="none" stroke="#d6aa72" stroke-width="18" stroke-linecap="round"/>
      <path class="lion-hindpaw" d="M280 151q9 20 2 47l-17 1" stroke="#d6aa72" stroke-width="18" stroke-linecap="round" fill="none"/>
      <ellipse cx="240" cy="138" rx="63" ry="37" fill="#dbb47b" stroke="#a77954" stroke-width="3"/>
      <path d="M214 116q33-18 63 3-34-7-65 4m19 44q31 5 59-14-11 18-50 24" fill="#efd09a" opacity=".9"/>
      <g class="lion-head">
        <path d="M137 125q-21-18-8-47 5-24 29-29 17-14 39-4 27 2 35 27 15 19 1 42-4 27-33 34-22 16-46-2Z" fill="#ab7657" stroke="#875f49" stroke-width="3"/>
        <path d="M140 112q-13-20 3-37m53-22q23 4 28 27m-55 65q16 4 33-7" fill="none" stroke="#c39065" stroke-width="5" stroke-linecap="round"/>
        <g class="lion-front-face">
          <circle cx="152" cy="76" r="12" fill="#dcb075" stroke="#9e704a" stroke-width="2"/><circle cx="206" cy="72" r="12" fill="#dcb075" stroke="#9e704a" stroke-width="2"/>
          <path d="M145 101q-3-29 30-39 31-2 43 24 13 34-22 48-22 8-45-7-11-11-6-26Z" fill="#e6ba7f" stroke="#af7d50" stroke-width="2.4"/>
          <path d="M158 112q15-12 23-2 13-10 25-1 8 15-10 20-25 8-41-4-5-6 3-13Z" fill="#f3d8a6"/>
          <circle cx="163" cy="96" r="4.2" fill="#493f35"/><circle cx="196" cy="93" r="4.2" fill="#493f35"/>
          <path d="M173 108q9-4 18-1l-9 8Z" fill="#71554c"/><path d="M181 115q-2 6-10 4m10-4q4 5 11 3" fill="none" stroke="#956d55" stroke-width="2" stroke-linecap="round"/>
        </g>
        <g class="zoo-feeding lion-hunt-face">
          <circle cx="190" cy="77" r="13" fill="#dcb075" stroke="#9e704a" stroke-width="2"/><circle cx="190" cy="77" r="6" fill="#c4936b"/>
          <path d="M149 94q7-20 27-22 28-2 38 24 9 23-10 35-21 11-45-3-21 1-30-10-6-8 5-15Z" fill="#e6ba7f" stroke="#af7d50" stroke-width="2.4"/>
          <path d="M131 108q9-9 23-8 17 8 11 23-19 7-33-4-5-4-1-11Z" fill="#f3d8a6"/>
          <path d="M151 88q8-5 15 0" fill="none" stroke="#986747" stroke-width="2.4" stroke-linecap="round"/>
          <circle cx="154" cy="94" r="4.3" fill="#493f35"/><circle cx="153" cy="93" r="1.3" fill="#fff9e8"/>
          <path d="M128 107q6-5 15-1l-7 8Z" fill="#71554c"/>
          <path d="M136 114q5 8 16 3" fill="none" stroke="#956d55" stroke-width="2" stroke-linecap="round"/>
        </g>
      </g>`,
  };

  const fish = (x, y, color) => `<g transform="translate(${x} ${y})">
    <path d="M0 0q-11-13-25 0 13 12 25 0Zm-25 0-10-8v16Z" fill="${color}" stroke="#4c8691" stroke-width="2" stroke-linejoin="round"/>
    <circle cx="-7" cy="-2" r="1.9" fill="#385964"/>
  </g>`;
  const food = {
    elephant: `<g class="zoo-feeding">
      <ellipse cx="107" cy="202" rx="28" ry="5" fill="#b89f70"/>
      <path d="m80 201 12-12 8 5 10-11 7 12 13-6 6 12q-24 8-56 0Z" fill="#dbba6b" stroke="#ad914d" stroke-width="2"/>
      <g class="feed-elephant-hay" fill="none" stroke-linecap="round">
        <path d="M108 188q1-11-6-18m6 18 5-19m-5 19 14-13m-14 13-12-8" stroke="#ac893b" stroke-width="3"/>
        <path d="m107 183-5-13m8 13 3-14m-1 15 10-9" stroke="#efd283" stroke-width="2"/>
      </g>
    </g>`,
    giraffe: `<g class="zoo-feeding">
      <path d="M85 112q28-2 54-16m-34 13-11-11m22 8 7-16" fill="none" stroke="#866b46" stroke-width="5" stroke-linecap="round"/>
      <path d="M97 101q-16 2-19-12 14-6 19 12m19 4q-13 11-22 3 7-10 22-3m2-4q-4-17 10-21 6 14-10 21" fill="#7ca66a" stroke="#5e8552" stroke-width="2"/>
      <path class="feed-giraffe-leaf" d="M135 98q0-15 14-16 7 14-14 16Z" fill="#91b26b" stroke="#5e8552" stroke-width="2"/>
    </g>`,
    seal: `<g class="zoo-feeding feed-seal-fish">${fish(81, 85, '#82b8ce')}</g>`,
    monkey: `<g class="zoo-feeding">
      <path d="M141 171q15 9 39 0l-4 8q-17 9-31 0Z" fill="#bd9b65" stroke="#91784e" stroke-width="2"/>
      <path class="monkey-served-banana" d="M145 162q23 4 26-12l6-2q3 22-24 22Z" fill="#f4ce68" stroke="#b59149" stroke-width="2" stroke-linejoin="round"/>
    </g>`,
    panda: `<g class="zoo-feeding feed-panda-bamboo">
      <path d="M218 146l41 24m-30-18 1-14m14 24 13-4" fill="none" stroke="#668d52" stroke-width="4.5" stroke-linecap="round"/>
      <path class="feed-panda-leaf-tip" d="M218 146q-17 3-19-10 15-3 19 10Z" fill="#99ad62" stroke="#598154" stroke-width="1.6"/>
      <path class="feed-panda-leaf-top" d="M221 148q2-19 14-18-1 16-14 18Z" fill="#7ea467" stroke="#598154" stroke-width="1.6"/>
      <path d="M237 157q-16 8-23-1 15-5 23 1m8 5q11-14 23-7-8 12-23 7" fill="#88aa62" stroke="#598154" stroke-width="1.6"/>
      <path d="m234 153-3 5m17 3-3 5" stroke="#a4be72" stroke-width="2.2" stroke-linecap="round"/>
    </g>`,
    penguin: `<g class="zoo-feeding feed-penguin-fish"><g transform="translate(171 125) scale(.78) translate(-171 -125)">${fish(171, 125, '#97bbc1')}</g></g>`,
    parrot: `<g class="zoo-feeding feed-parrot-nut">
      <path class="feed-parrot-shell" d="M155 162q4-10 18-7 9 7 2 15-9 7-18 0Z" fill="#bf8d55" stroke="#8d6748" stroke-width="2"/>
      <path class="feed-parrot-shell" d="M159 163q7-5 14-4" fill="none" stroke="#e3bb81" stroke-width="2.4" stroke-linecap="round"/>
      <path class="feed-parrot-kernel" d="M159 162q6-7 14-2 3 6-5 10-8 0-9-8Z" fill="#f3d9a3" stroke="#a47c50" stroke-width="1.4"/>
      <g class="feed-parrot-shell-fall" fill="#bf8d55" stroke="#8d6748" stroke-width="1.4"><path d="m155 162 5-5 2 11-6 2Z"/><path d="m170 156 6 2 1 8-6-2Z"/></g>
    </g>`,
    kangaroo: `<g class="zoo-feeding feed-kangaroo-grass">
      <path d="M148 187q6-7 1-13 8 0 10 8 5-11 11-14-1 8-4 14 6-6 15-6-4 9-22 13Z" fill="#92ac61" stroke="#678754" stroke-width="2"/>
      <path class="feed-kangaroo-blade" d="M159 185q-8-18-4-26 9 8 9 21 0-22 10-26-1 16-9 29Z" fill="#a9be69" stroke="#678754" stroke-width="1.7"/>
    </g>`,
    dolphin: `<g class="zoo-feeding">
      <g class="feed-dolphin-fish">${fish(62, 167, '#84c0b6')}</g>
      <g class="feed-dolphin-bubbles" fill="none" stroke="#f0fbef" stroke-width="2">
        <ellipse cx="119" cy="182" rx="17" ry="4"/><circle cx="99" cy="169" r="3"/><circle cx="90" cy="177" r="2"/><circle cx="135" cy="158" r="3.5"/>
      </g>
    </g>`,
    snake: `<g class="zoo-feeding">
      <path d="M84 157q12-11 24-5 14-6 28 6-16 18-48 8Z" fill="#c7aa7a" stroke="#a78a62" stroke-width="2"/>
      <path d="M91 158q15-5 32-2m-32 7q12 1 19-3m5 4 10-3" fill="none" stroke="#e1c99a" stroke-width="2" stroke-linecap="round"/>
      <path class="snake-egg" d="M101 148q0-13 9-17 9-1 11 15 1 11-9 12-11 1-11-10Z" fill="#fcf2d6" stroke="#b5a483" stroke-width="2"/>
      <path class="snake-shell" d="m102 152 6-6 4 4 4-5 5 6q-4 9-12 6Z" fill="#fbf1d3" stroke="#b5a483" stroke-width="1.7"/>
    </g>`,
  };

  const huntPrey = {
    rabbit: `
      <g class="hunt-prey hunt-rabbit" data-zoo-prey="rabbit">
        <path class="hunt-rabbit-legs" d="M198 186q-2 7-11 9m29-7q9 1 9 8h-15" fill="none" stroke="#887c74" stroke-width="5" stroke-linecap="round"/>
        <circle cx="229" cy="181" r="7" fill="#f8eee0" stroke="#a69081" stroke-width="1.8"/>
        <ellipse cx="213" cy="181" rx="17" ry="13" fill="#b4a295" stroke="#887c74" stroke-width="2"/>
        <path d="M206 185q10-7 18-1-2 11-15 8Z" fill="#ddc7b3"/>
        <g class="hunt-rabbit-ears">
          <path d="M198 172q-12-13-8-27 5-2 13 22m-1 4q-4-20 4-27 7 2 3 25" fill="#b9a69b" stroke="#887c74" stroke-width="2" stroke-linejoin="round"/>
          <path d="m193 151 6 13m8-14-1 14" fill="none" stroke="#e8bbb1" stroke-width="3" stroke-linecap="round"/>
        </g>
        <path d="M187 170q9-12 21-3 8 9 2 17-7 7-19 1-9-3-9-9Z" fill="#cebaac" stroke="#887c74" stroke-width="2"/>
        <circle cx="195" cy="173" r="3" fill="#534f45"/><circle cx="194" cy="172" r="1" fill="#fff9e9"/>
        <path d="m181 176 5-1-2 4Z" fill="#956b66"/>
      </g>`,
    chicken: `
      <g class="hunt-prey hunt-chicken" data-zoo-prey="chicken">
        <path class="hunt-chicken-foot-far" d="m218 185-1 9-5 2m5-2 4 2" fill="none" stroke="#a97948" stroke-width="2.4" stroke-linecap="round"/>
        <path class="hunt-chicken-foot" d="m208 187-2 9-7 1m7-1 3 3" fill="none" stroke="#ad7847" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M221 174q10-2 15-9 3 12-12 20" fill="#e6ab56" stroke="#b9844e" stroke-width="2"/>
        <path d="M199 178q2-15 18-13 13 2 12 14-4 15-20 11-11-3-10-12Z" fill="#f2c569" stroke="#b9844e" stroke-width="2"/>
        <path class="hunt-chicken-wing" d="M209 175q6-7 16-3-2 11-12 12-6-1-4-9Z" fill="#f9d77c" stroke="#bd9050" stroke-width="1.8"/>
        <path d="M193 159q-4-11 2-10 4 2 4 5 4-6 7-3 1 5-4 9Z" fill="#d4895f" stroke="#b7744f" stroke-width="1.5"/>
        <circle cx="198" cy="167" r="12" fill="#f7d47a" stroke="#b9844e" stroke-width="2"/>
        <path d="m187 167-9 4 11 3Z" fill="#d5914f" stroke="#ad7847" stroke-width="1.6"/>
        <circle cx="193" cy="165" r="2.7" fill="#51493d"/><circle cx="192" cy="164" r=".8" fill="#fff9e9"/>
      </g>`,
  };
  const huntForeground = `
    <g class="hunt-dust" fill="#f7e4af" stroke="#d1af77" stroke-width="1.5">
      <ellipse cx="61" cy="192" rx="20" ry="9"/><circle cx="46" cy="186" r="7"/><circle cx="78" cy="182" r="7"/>
      <path d="m35 193-8-2m63 1 10-3" stroke-linecap="round"/>
    </g>
    <path d="M34 212q2-10-5-16 10 0 15 9-1-15 6-19 7 9 5 16 8-11 16-10-3 9-12 17 10-3 17 1-14 9-42 2Z" fill="#9bae73" stroke="#81965c" stroke-width="1.8"/>
    <path d="M40 211q11-5 13-11m1 13 11-7" fill="none" stroke="#bdc78c" stroke-width="2" stroke-linecap="round"/>`;
  const props = {
    elephant: `
      <g class="zoo-performing zoo-spray">
        <path d="M121 152Q68 70 47 113" stroke="#5caec7" stroke-width="7" stroke-linecap="round" fill="none"/>
        <path d="M121 152Q68 70 47 113" stroke="#b6e4e7" stroke-width="3" stroke-linecap="round" fill="none"/>
        <path d="m43 114-5 15m2-11-11 7m18-7 4 10" stroke="#78bdcf" stroke-width="4" stroke-linecap="round"/>
      </g>`,
    giraffe: `
      <g class="zoo-performing zoo-parade">
        <path d="M90 160l10-13 12 7m236 8 10-14 11 6M96 129l-5-11m263 13 6-11" fill="none" stroke="#d28a56" stroke-width="5" stroke-linecap="round"/>
        <path d="M105 174q112 20 242-1" fill="none" stroke="#c29b62" stroke-width="3" stroke-dasharray="4 9"/>
      </g>`,
    seal: `
      <g class="zoo-performing zoo-ball">
        <circle cx="134" cy="89" r="16" fill="#f1c46e" stroke="#975b5a" stroke-width="2.5"/>
        <path d="M122 79q12 4 22 19m-17-24q15 10 21 18" fill="none" stroke="#c96d68" stroke-width="4"/>
        <path d="M130 81l5 1" stroke="#fff0b8" stroke-width="3" stroke-linecap="round"/>
      </g>`,
  };

  const ripple = (x, y, rx) => `<ellipse class="zoo-ripple" cx="${x}" cy="${y}" rx="${rx}" ry="5" fill="none" stroke="#eaf8ee" stroke-width="2.5"/>`;
  const bamboo = '<path d="m108 159 68-35m-44 23-4-13m30-1 4-15" stroke="#6e915c" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M130 136q-15-2-17-14 13-1 17 14m26-1q11-14 22-8-7 11-22 8m-18 11q-13 10-21 3 10-9 21-3" fill="#8ca76d" stroke="#597b56" stroke-width="1.5"/>';
  const ring = (x, y, w, h, color) => `<ellipse cx="${x}" cy="${y}" rx="${w}" ry="${h}" transform="rotate(12 ${x} ${y})" fill="none" stroke="${color}" stroke-width="6"/><path d="M${x-w} ${y}q2-${h/2} 6-${h/2}" fill="none" stroke="#fff4d6" stroke-width="2" stroke-linecap="round"/>`;
  const showProps = {
    monkey: {
      intro: '<path d="M136 208q-4-39 22-80l45-64-15 0-52 57q-21 35-24 84Z" fill="#b18c62" stroke="#987654" stroke-width="3"/><path d="M147 154q14-22 37-42m-63 76 12-26" fill="none" stroke="#cda774" stroke-width="3" stroke-linecap="round"/>',
      middle: '<g class="monkey-vine"><path d="M207 19q32 22 41 66" fill="none" stroke="#6c8b59" stroke-width="6" stroke-linecap="round"/><path d="M226 39q-14-2-18-14 13-1 18 14m9 14q11-14 22-10-3 12-22 10" fill="#8ba96c"/></g>',
      finale: '<path d="m132 91-12-6m5 17-13-1m133-31 10-8" fill="none" stroke="#e7ba64" stroke-width="4" stroke-linecap="round"/>',
    },
    snake: {
      intro: '<path d="M133 148q-10-5-16-22 15 5 19 18 0-22 11-27-1 18-6 28 10-13 21-15-3 15-23 20Z" fill="#8eac70" stroke="#78945f" stroke-width="2"/>',
      middle: '<path d="M78 191q46-20 86 1t82 2 110-16" fill="none" stroke="#ad966c" stroke-width="3" stroke-linecap="round" stroke-dasharray="9 12"/>',
      finale: '<path d="M116 98l-11-9m8 20-13-3m95-25 6-12" fill="none" stroke="#e6be6e" stroke-width="3.5" stroke-linecap="round"/>',
    },
    elephant: {
      intro: '<path d="M90 182q-10-16 19-17 30-3 27 13-4 13-24 17-17 1-22-13Z" fill="#92c2c2" stroke="#628e96" stroke-width="2"/>' + ripple(112,178,13),
      finale: '<path d="M33 128q30-74 89-47 25 14 38 36m-122 14q26-69 82-45 22 13 35 34m-113 15q26-62 77-43 19 11 31 29" fill="none" stroke="#db9978" stroke-width="4" opacity=".78"/><path d="M39 131q26-67 82-44 22 13 35 32" fill="none" stroke="#e7c678" stroke-width="4"/><path d="M43 137q25-63 78-43 18 10 29 27" fill="none" stroke="#8cbeb4" stroke-width="4"/>',
    },
    giraffe: { finale: '<path d="M116 139q-3-17-17-15 2 13 17 15m5-3q12-12 25-6-10 8-25 6m217 9q21-19 34-8-11 12-34 8" fill="#92ab6d" stroke="#71905e" stroke-width="2"/>' },
    panda: { intro: bamboo, middle: '<path d="M103 189q69 19 135 0t107-12" fill="none" stroke="#ddc494" stroke-width="6" stroke-linecap="round" stroke-dasharray="3 17"/>', finale: '<path d="M293 101q18-10 16-26m-7 36q15-4 24-14" fill="none" stroke="#d59b72" stroke-width="4" stroke-linecap="round"/>' },
    penguin: { middle: '<path d="M103 193q37-8 81 0m-77 11q85-16 155-3m-94-17 34-2" fill="none" stroke="#f4fcf5" stroke-width="5" stroke-linecap="round"/>', finale: '<path d="m127 148-4-13m13 5 2-14m158 18 7-12m1 19 13-5" stroke="#f2b36e" stroke-width="4" stroke-linecap="round"/>' },
    parrot: { middle: ring(111,104,17,44,'#dda467') + ring(306,102,21,50,'#a68abe'), finale: '<path d="M91 139q11-14 21-2m207-14q15 4 20 21" fill="none" stroke="#e3b065" stroke-width="5" stroke-linecap="round"/>' },
    kangaroo: { middle: '<path d="M98 200q-13-21-19-19 3 14 17 20 4-19 15-21l-8 20m96 1q-9-20-17-18 3 11 13 20 8-17 19-20-4 13-16 20m126-1q-11-21-20-15 3 11 17 16 6-20 21-19-5 11-14 19" fill="#90a96b" stroke="#71915f" stroke-width="2"/>' },
    dolphin: { intro: ripple(163,169,63), middle: ring(226,104,24,47,'#e9b56d'), finale: '<path d="M288 175q10-29 22-28m-18 29q23-8 32-1m-42 0q-8-16-20-20" fill="none" stroke="#e5f7ee" stroke-width="6" stroke-linecap="round"/>' + ripple(291,182,44) },
    lion: { middle: '<path d="M102 163q13-11 22-7m-23 18q17-3 26 0" fill="none" stroke="#ecd69e" stroke-width="4" stroke-linecap="round"/>', finale: '<path d="m115 88-12-10m26-6-6-14m91 2 9-13m16 26 17-8" stroke="#e0b063" stroke-width="4" stroke-linecap="round"/>' },
  };
  const flowingWater = '<path d="M0 158Q56 146 115 160t130-1 205-6v85H0Z" fill="#a3cfd3"/><path d="M0 183q76-18 158-5t167 5 125-11v66H0Z" fill="#88b8c9"/><path d="M0 219q89-23 168-11t140 6 142-8v32H0Z" fill="#77aabb"/><path d="M18 177h54m271-9h65m-204 35h42m-209 16h26m285 4h28m-58-31h42" stroke="#daefe8" stroke-width="3" fill="none" stroke-linecap="round"/>';
  const environments = {
    elephant: { sky: ['#b9dbd5', '#f2e6bc'], sun: [322, 43, 23, '#f7d992'] },
    giraffe: { sky: ['#c8e4ec', '#fff0c6'], sun: [83, 44, 22, '#f7d58a'] },
    monkey: { sky: ['#77a69d', '#c6d6ad'], forest: true },
    panda: { sky: ['#d7e6e2', '#eef1dc'], forest: true },
    penguin: { sky: ['#b9dbea', '#ecf7fb'], sun: [337, 43, 19, '#fff5d0'] },
    parrot: { sky: ['#a3d9cf', '#e1efd2'], forest: true },
    kangaroo: { sky: ['#eed1ae', '#fae4bf'], sun: [132, 44, 25, '#f3b96c'] },
    snake: { sky: ['#a5b9a3', '#e5dec1'], forest: true },
    lion: { sky: ['#efc38f', '#ffe2a9'], sun: [350, 53, 31, '#edaa62'] },
    seal: { sky: ['#cbdedb', '#f3efd6'] },
    dolphin: { sky: ['#cbdedb', '#f3efd6'] },
  };
  function tree(x, y, scale, color) {
    return `<g transform="translate(${x} ${y}) scale(${scale})"><path d="M0 70V11m0 37-19-23m19 16 20-17" fill="none" stroke="#9a845e" stroke-width="7" stroke-linecap="round"/><path d="M-43 21q2-27 21-25 12-22 29-1 28-9 38 20-27 17-57 8-18 8-31-2Z" fill="${color}"/><path d="M-35 14q9-15 25-12 25-8 44 9-30-11-69 3" fill="#d7dca4" opacity=".52"/></g>`;
  }
  function sprouts(xs, y, color) {
    return xs.map((x, i) => `<path d="M${x} ${y+i%3*5}q-11-9-9-17 9 1 10 13 5-9 13-8-4 8-14 12" fill="${color}"/>`).join('');
  }
  function fern(x, y, scale, color) {
    return `<g transform="translate(${x} ${y}) scale(${scale})" fill="${color}"><path d="M0 0q-35-17-36-45 24 9 36 45m0 0q-13-35 0-58 14 25 0 58m0 0q16-40 43-44Q35-14 0 0m0 0q-32 2-45-17Q-19-23 0 0m0 0q27-18 48-9Q29 7 0 0"/><path d="M0 0v-44M0 0l-27-34M0 0l33-34" fill="none" stroke="#c6d4a3" stroke-width="1.5" opacity=".55"/></g>`;
  }
  function dryGrass(xs, y, color) {
    return xs.map((x,i) => `<path d="M${x} ${y+i%3*4}l-8-18m8 18-1-25m1 25 10-19m-10 19 16-6" fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round"/>`).join('');
  }
  function habitat(type, hunting) {
    if (type === 'elephant') return `
      <path d="M0 127q55-27 104-8t97 2 111-11 138 18v110H0Z" fill="#adc4a0"/>
      ${tree(35,62,1.05,'#729b79')}${tree(410,59,1.3,'#789f7c')}
      <path d="M0 161q79-27 150 5 47 14 112-4 111-24 188 10v66H0Z" fill="#d1bf91"/>
      <path d="M0 155q67-23 113 26 32 32-10 57H0Z" fill="#84bdbd" stroke="#b5d7ca" stroke-width="5"/>
      <path d="M0 201q64-26 105 10l-5 27H0Z" fill="#69a6ad"/>
      <g class="habitat-water" fill="none" stroke="#d8efde" stroke-width="3" stroke-linecap="round"><path d="M13 178h37m-22 26h40m-64 20h29m39-38h15"/></g>
      <ellipse cx="237" cy="209" rx="93" ry="15" fill="#b59b79" opacity=".6"/>
      <path d="M344 194q-9-24 14-30 19-8 30 13 25-12 37 15l-6 15h-64Z" fill="#a8ab99"/>
      <path d="M350 183q13-13 26-3m13 6q12-6 22 5" fill="none" stroke="#d2cfb1" stroke-width="4" stroke-linecap="round"/>
      <g stroke="#698767" stroke-width="3" fill="none" stroke-linecap="round"><path d="M13 162v-35m4 36 9-27m-13 24-8-16M116 230l6-34m1 34 11-22"/><path d="M13 125v-10m13 18 3-10m93 71 2-8" stroke="#a88c56" stroke-width="5"/></g>
      ${sprouts([157,335,413,435],231,'#8da46b')}`;
    if (type === 'giraffe') return `
      <path d="M0 132q112-9 219-2t231-9v117H0Z" fill="#d9d4a0"/>
      <path d="M0 164q118-17 239-9t211-14v97H0Z" fill="#c9c58a"/>
      ${tree(53,90,.63,'#91a376')}${tree(118,112,.34,'#a2ad7a')}
      <g stroke-linecap="round"><path d="M390 197 378 96m3 27-48-35m49 23 35-32" fill="none" stroke="#9a8057" stroke-width="9"/>
      <path d="M286 82q6-22 31-21 12-25 40-17 20-23 47-4 34-5 48 31-42 16-87 13-47 11-79-2Z" fill="#7e9d68"/>
      <path d="M303 69q26-17 54-10 23-15 52-5 15-1 27 11-70-10-133 4" fill="#afc382"/>
      <path d="M343 91q8 13 3 26m16-26q7 11 2 20" fill="none" stroke="#bba26b" stroke-width="3"/></g>
      <path d="M0 205q96-23 195-9t255-9v51H0Z" fill="#e5d6a3"/>
      ${dryGrass([17,62,104,344,418,443],216,'#a1a56a')}
      <path d="M139 227h48m139-9h36m-310 12h28" stroke="#c4b47e" stroke-width="2" stroke-linecap="round"/>`;
    if (type === 'monkey') return `
      <path d="M0 53q32-40 79-15 28-39 72-12 43-18 65 18 54-32 86 5 48-45 86-20 36-17 62 14v195H0Z" fill="#7fa88d"/>
      <path d="M0 117q52-35 98-6t104 3 124-12 124 5v131H0Z" fill="#5e947b"/>
      <path d="M0 187q115-27 218 1t232-12v62H0Z" fill="#86aa83"/>
      <path d="M12 238q21-83 12-163L18-5h32l3 89q-8 81 21 154Zm386 0q20-91 9-164L402-5h30l-5 99q-5 94 23 144Z" fill="#8c795d"/>
      <path d="M34 11q12 82-3 146m387-145q-9 91 4 141" fill="none" stroke="#b39d73" stroke-width="5" stroke-linecap="round"/>
      <g class="habitat-vines" fill="none" stroke="#436f59" stroke-width="4" stroke-linecap="round"><path d="M90-10q-19 87 12 143M342-10q31 86 1 132"/></g>
      <path d="M0 0h450v31q-31 22-72-3-31 22-65-4-30 14-60-7-34 18-67-1-25 24-58 8-39 23-65 7Q24 51 0 32Z" fill="#4f8969"/>
      <path d="M3 3q55 27 100-2m224 0q54 27 120 2" fill="none" stroke="#7ca975" stroke-width="9" stroke-linecap="round"/>
      <path d="M57 205q53-11 116-10 89 0 208-28" fill="none" stroke="#927653" stroke-width="13" stroke-linecap="round"/>
      <path d="M57 201q62-10 120-9 67 3 184-24" fill="none" stroke="#ba9968" stroke-width="4" stroke-linecap="round"/>
      ${fern(28,235,.9,'#47795d')}${fern(417,235,1.1,'#447a5b')}${sprouts([90,326,363],231,'#b0c38d')}`;
    if (type === 'snake') return `
      <path d="M0 60q66-26 118-4t102 8 130-21 100 24v171H0Z" fill="#acbfa0"/>
      <path d="M21-4h15l17 138-14 37Zm363 0h20l-8 146-13 20Z" fill="#8c9678"/>
      <path d="M0 159q89-26 183-4t267-14v97H0Z" fill="#b8b68d"/>
      <path d="M328 149q3-48 35-65 32-4 47 21l40 54v52H334Z" fill="#9ba28c"/>
      <path d="m345 112 20-17 17 5m19 19 17 27" fill="none" stroke="#c1c2a8" stroke-width="4" stroke-linecap="round"/>
      <path d="M0 193q87-15 169 6t281-5v44H0Z" fill="#d4c5a0"/>
      <path d="M0 176 78 158q15 9 4 23L0 201" fill="#927958" stroke="#7b6a50" stroke-width="3"/>
      <ellipse cx="77" cy="169" rx="12" ry="14" fill="#c6a477" stroke="#7b6a50" stroke-width="3"/><ellipse cx="77" cy="169" rx="6" ry="8" fill="none" stroke="#a08058" stroke-width="2"/>
      <path d="M94 213l25-24 42-11 42 9 110-3 21 9 22 18-40 13H133Z" fill="#b8a58a" stroke="#a28b6e" stroke-width="2"/>
      <path d="M119 206q62-23 103-9 31-6 102 8l10 9-52 5H146Z" fill="#d7bd97"/>
      ${fern(15,232,.75,'#6f9066')}${fern(425,225,.9,'#7c956a')}
      <g fill="#b48e5c"><path d="m61 219 11-9 15 2-13 9Z"/><path d="m366 221 9-7 17 6-16 4Z"/></g>`;
    if (type === 'penguin') return `
      <path d="m0 135 44-59 35 30 39-62 59 85 47-39 56 42 42-59 41 40 36-60 51 72v63H0Z" fill="#a7cbdc"/>
      <path d="m84 96 34-52 34 49-28-10-13 8-12-5m272-8 23-35 26 37-24-10-11 7M24 105l20-29 19 17-18-6-9 14" fill="#f4fcfc"/>
      <path d="M0 139h450v99H0Z" fill="#5f9fbd"/>
      <g class="habitat-water" stroke="#acd8e7" stroke-width="2.5" stroke-linecap="round"><path d="M8 162h51m303-12h63m-75 41h46m-376 21h34"/></g>
      <path d="m35 145 30-8 27 8-6 9-39 1Zm309 28 37-10 43 8-10 11h-60Z" fill="#f1fbfa" stroke="#b7dce5" stroke-width="2"/>
      <path d="M76 183q13-39 55-39l56 17q68-16 185 10l58 41-39 26H99l-43-26Z" fill="#b4d9e4"/>
      <path d="M76 183q13-39 55-39l56 17q68-16 185 10l39 30q-106 20-212 7-71 13-133-8Z" fill="#f0f9f8" stroke="#d2eaf0" stroke-width="2"/>
      <path d="m100 209 16-18 24 4 18 20m143-13-15-15-19 4m-91 30 26-6 22 9" fill="none" stroke="#a7cddc" stroke-width="2.5" stroke-linecap="round"/>`;
    if (type === 'seal' || type === 'dolphin') return `
      <path d="M0 143q54-35 121-7 39-28 130-3 115-42 199 7v98H0Z" fill="#c4d9c5"/>
      ${flowingWater}${type === 'seal' ? '<path d="M95 199q-5-16 30-21l140-2q32 2 59 24l-19 13H131Z" fill="#b8a496" stroke="#918276" stroke-width="2.5"/><path d="M109 194q35-12 74-8h100l18 10q-100 14-192-2Z" fill="#d9c7ad"/><path d="m130 204 28 2m103-4 24 2" stroke="#a48d78" stroke-width="2" stroke-linecap="round"/>' : '<path d="M0 217q19 0 32-19 9-17 29 1 11 12 29 10l8 29H0Zm354 21q-6-21 17-31 29-17 79 7v24Z" fill="#aabda4"/>'}
      <path d="M50 190q11-4 26 0m277 29q13-2 22-1m-179 13h27" fill="none" stroke="#c7e5dd" stroke-width="3" stroke-linecap="round"/>`;
    if (type === 'panda') {
      const canes = [12,33,61,89,114,343,368,391,419,442].map((x,i) => `<g opacity="${i % 2 ? .8 : 1}"><path d="M${x} 214V${9+i%4*13}" stroke="${i%2?'#91af7a':'#668d6a'}" stroke-width="${i%2?6:8}"/><path d="M${x-4} 56h8m-8 43h8m-8 43h8m-8 43h8" stroke="#d1ddad" stroke-width="2"/><path d="M${x} 80q-26-4-31-22 19 1 31 22m0 35q24-24 35-17-7 18-35 17m0 43q-18-19-30-12 5 12 30 12" fill="#749e70"/></g>`).join('');
      return `<path d="M0 146q22-83 50-62 33-84 61-12 28 69 59 1 29-73 68-14 40 68 67 8 30-63 67-16 46 39 78 47v140H0Z" fill="#b4cbc0"/>
      <path d="M0 132q73-9 137 6t143-1 170 4v28H0Z" fill="#e6ede0" opacity=".75"/>
      <path d="M0 190q99-28 222-8t228-6v62H0Z" fill="#b8c9a1"/>
      ${canes}
      <path d="M2 219q47-13 92-4t58 23H0Z" fill="#a3c6bd"/><path class="habitat-water" d="M10 227h25m21-6h25m21 13h21" stroke="#e4f1df" stroke-width="2" stroke-linecap="round"/>
      <ellipse cx="227" cy="211" rx="78" ry="13" fill="#d4d9b4"/>
      <path d="M317 217q-8-17 7-25 20-4 27 10 16-5 22 17Z" fill="#a3b2a0"/><path d="M322 203q12-9 21 2" stroke="#d3d8bc" stroke-width="3" fill="none"/>
      ${sprouts([24,84,378,434],233,'#74936a')}`;
    }
    if (type === 'parrot') return `
      <path d="M0 86q44-49 83-11 38-51 78-11 51-45 96 0 55-40 93-5 57-37 100-2v181H0Z" fill="#87bba1"/>
      <path d="M0 151q57-37 108-7t123-6 117 0 102-5v105H0Z" fill="#68a78a"/>
      <path d="M17 238Q53 144 42 19m382 219Q392 141 414 4" fill="none" stroke="#9b8b62" stroke-width="16"/>
      <g fill="#458d70"><path d="M45 21Q0 4-8 61q32-27 53-40m0 0Q83-9 117 30 0-1-72-9m0 0Q97 31 103 86 0-1-58-65m0 0Q7 39 1 105q0-1 44-84M412 10Q359-6 333 37q37-15 79-27m0 0q37 1 51 57-27-28-51-57m0 0q-48 27-58 74 29-20 58-74"/></g>
      <path d="M45 21q25 12 51 53m316-64q-25 19-50 62" fill="none" stroke="#98c18a" stroke-width="2.5"/>
      <g fill="#dda45e"><circle cx="37" cy="43" r="6"/><circle cx="48" cy="47" r="6"/><circle cx="405" cy="31" r="6"/></g>
      <path d="M54 185q111 5 213-15 52-9 72-33" fill="none" stroke="#8e7959" stroke-width="12" stroke-linecap="round"/>
      <path d="M62 182q120 3 209-14 46-11 63-30" fill="none" stroke="#b79b72" stroke-width="3" stroke-linecap="round"/>
      <path d="M297 158q19-22 35-19-8 17-35 19m12-6q14-7 28-2-10 13-28 2" fill="#b2cf88"/>
      ${fern(40,258,1.35,'#397e62')}${fern(400,260,1.55,'#3f8969')}
      <g fill="#efad8b"><path d="M24 210q-14-22-5-30 11 6 15 22 3-20 15-21 3 19-25 29Z"/><path d="M408 207q-13-23-3-28 10 7 11 22 6-20 17-18 0 18-25 24Z"/></g>`;
    if (type === 'kangaroo') return `
      <path d="M0 130 36 104h61l29 21 56-7 32 17 84-10 48-30h57l47 31v112H0Z" fill="#cf9d7b"/>
      <path d="M0 171q93-25 189-10t261-13v90H0Z" fill="#d8a47e"/>
      <path d="M0 208q137-24 252-6t198-18v54H0Z" fill="#e6b68d"/>
      <g fill="none" stroke-linecap="round"><path d="M392 206q-20-69-9-157m0 62-39-46m40 28 32-45" stroke="#d5d2b4" stroke-width="13"/><path d="M392 202q-14-71-9-111m-2-39 2 16m-26 9 7 10" stroke="#9b977e" stroke-width="3"/></g>
      <g fill="#8ca88f"><ellipse cx="342" cy="53" rx="41" ry="21" transform="rotate(-15 342 53)"/><ellipse cx="395" cy="31" rx="38" ry="21"/><ellipse cx="426" cy="69" rx="38" ry="24"/><ellipse cx="365" cy="92" rx="31" ry="15"/></g>
      <g fill="#abc2a0"><path d="M330 53q20 6 27 23-20-1-27-23m52-22q20 7 26 25-21-2-26-25m31 37q19 2 28 19-19 1-28-19"/></g>
      <path d="M29 180q15-27 48-19l16 24Z" fill="#b98166"/><path d="M40 174q17-10 32-6" fill="none" stroke="#edc5a0" stroke-width="4" stroke-linecap="round"/>
      ${dryGrass([15,109,338,430],220,'#8d9b6e')}${sprouts([63,301,371],234,'#a4ae79')}
      <path d="m124 219 11 1m156 11 14-2m-248 4 10-2" stroke="#bd8a66" stroke-width="2.5" stroke-linecap="round"/>`;
    if (type === 'lion') return `
      <path d="M0 126q101-17 200-5t250-9v126H0Z" fill="#cfb575"/>
      <path d="M0 165q109-20 224-5t226-15v93H0Z" fill="#d9bd79"/>
      ${tree(51,103,.45,'#8d9362')}${tree(409,96,.62,'#93976a')}
      <path d="M352 162 367 128l26-10 22 21 35 8v56Z" fill="#b29c76"/>
      <path d="m369 140 23-10 13 17m7 17 22-7" fill="none" stroke="#ddc29a" stroke-width="4" stroke-linecap="round"/>
      <path d="M0 203q126-27 235-11t215-4v50H0Z" fill="#eed2a0"/>
      ${dryGrass([11,43,84,362,406,439],196,'#b99e57')}
      ${hunting ? '<path d="M0 207q125-23 224-9t226-4v27q-111 4-226-2T0 232Z" fill="#e5bd87"/><path d="M41 217h43m250-4h32" stroke="#cba36c" stroke-width="2" stroke-linecap="round"/>' : `
      <path d="M104 214l18-23 52-7 30 4 53-2 62 15 10 16-50 11H141Z" fill="#beaa89" stroke="#a69072" stroke-width="2"/>
      <path d="M123 202q86-18 193 5l-38 9-128-1Z" fill="#e0c49a"/><path d="m127 209 23 7m93-6 23 5m27-12 14 1" stroke="#a99979" stroke-width="2" stroke-linecap="round"/>`}
      ${dryGrass([16,77,374,435],237,'#c4a55f')}`;
    return '';
  }
  const terrainColors = {
    elephant: ['#e4d9ad', '#c1b07e', '#948563'], giraffe: ['#e2ddab', '#b4bb7e', '#87915f'],
    monkey: ['#b3c7a0', '#809d77', '#526e59'], panda: ['#d2dfb7', '#a5ba91', '#768a70'],
    penguin: ['#fbffff', '#cce8ee', '#76adc3'], parrot: ['#b0d2ac', '#73a586', '#486e59'],
    kangaroo: ['#edc69c', '#d49e78', '#a77159'], snake: ['#ded2ad', '#b9ae88', '#85836b'],
    lion: ['#f0daae', '#cfb278', '#9c835d'], seal: ['#dbe8df', '#a4c7c7', '#719da8'], dolphin: ['#dbe8df', '#a4c7c7', '#719da8'],
  };
  function depthRock(x, y, size, type) {
    return `<g transform="translate(${x} ${y}) scale(${size})"><ellipse cy="10" rx="40" ry="11" fill="#304535" opacity=".16"/>
      <path d="m-35 4 12-31 30-9 25 22 8 23-37 12Z" fill="url(#zoo-rock-${type})"/>
      <path d="m-35 4 12-31 30-9-8 27Z" fill="#ece8cc" opacity=".45"/>
      <path d="m-1-9 33-5 8 23-37 12Z" fill="#45574a" opacity=".19"/>
      <path d="m-20-22 21-7 15 13" fill="none" stroke="#f5efd4" stroke-width="2" opacity=".6" stroke-linecap="round"/></g>`;
  }
  function depthGround(type) {
    const ice = type === 'penguin';
    return `<path d="M0 168q91-30 225-14t225-8v154H0Z" fill="${ice ? '#77afc6' : terrainColors[type][2]}" opacity=".45"/>
      <ellipse cx="231" cy="273" rx="205" ry="23" fill="#263f39" opacity=".16"/>
      <path d="M23 213q96-45 205-38t197 28l5 42q-86 56-211 48T19 249Z" fill="url(#zoo-bank-${type})"/>
      <path d="M37 177q82-42 183-35t194 33l11 40q-74 53-206 47T23 221Z" fill="url(#zoo-ground-${type})" stroke="${ice ? '#e5f5f5' : terrainColors[type][1]}" stroke-width="2"/>
      <path d="M24 222q98 44 197 40t203-46" fill="none" stroke="${ice ? '#f2ffff' : terrainColors[type][0]}" stroke-width="4" opacity=".65"/>
      ${ice ? '<path d="m88 252 7 21m57-11 6 26m171-36-5 28m58-41 2 18" stroke="#bfe2ed" stroke-width="3" opacity=".7"/><path d="m61 215 31-21 25 8m202 40-24-20 18-12" fill="none" stroke="#9fc7d8" stroke-width="2"/>' : '<path d="M64 184q64-26 117-24m69 5q81 7 125 24" fill="none" stroke="#fff4d6" stroke-width="3" opacity=".3"/><path d="m59 252 16 5m44 17 19 3m189-5 20-6m-153 17 15 1" stroke="#fff0cb" stroke-width="2" opacity=".22" stroke-linecap="round"/>'}
      ${type === 'elephant' ? '<path d="M26 187q27-35 68-22 28 13 16 49-22 29-70 22Z" fill="#849c88"/><path d="M29 184q32-28 61-16 24 12 13 41-23 25-64 21Z" fill="url(#zoo-water-elephant)"/><path class="habitat-water" d="M42 193q25-9 41-4m-39 18q21 4 37-2" fill="none" stroke="#d7eeea" stroke-width="2" stroke-linecap="round"/>' : ''}
      ${['giraffe','kangaroo','lion'].includes(type) ? `<path d="M149 154q-38 31 41 49t127 46" fill="none" stroke="${type === 'kangaroo' ? '#f5d2ac' : '#f3e4bb'}" stroke-width="19" opacity=".45"/>` : ''}
      ${type === 'panda' ? '<path d="M34 219q24 4 53 27l-16 7-34-15Z" fill="#8eb8b4"/><path class="habitat-water" d="m41 230 13 5m12 8 9 5" stroke="#d8eee6" stroke-width="2"/>' : ''}`;
  }
  function depthFixtures(type) {
    if (type === 'monkey') return `<path d="M63 230q96-17 167-22t151-29" fill="none" stroke="#625d46" stroke-width="16" stroke-linecap="round"/><path d="M66 226q96-17 167-22t145-28" fill="none" stroke="#c7a977" stroke-width="5" stroke-linecap="round"/>
      <path d="M77 216 57 262m308-79 27 50" stroke="#786b4e" stroke-width="10" stroke-linecap="round"/>`;
    if (type === 'parrot') return `<path d="M67 257 83 169m0 24q85 20 163-2t125-34m-287 13 80-10m125 25 45-26" fill="none" stroke="#6b634a" stroke-width="11" stroke-linecap="round"/>
      <path d="M80 173q4 45-5 72m10-55q93 19 159-1t124-35" fill="none" stroke="#c5a775" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M338 172q20-32 39-26-8 27-39 26m6-9q31-9 42 9-26 10-42-9" fill="#78a877"/>`;
    if (type === 'lion') return `<ellipse cx="230" cy="237" rx="112" ry="15" fill="#8b784f" opacity=".2"/><path d="m117 216 34-24 125 1 46 21-9 27-111 7-84-15Z" fill="url(#zoo-rock-lion)"/><path d="m117 216 34-24 125 1 46 21-86 12Z" fill="#e0cca3"/><path d="m131 222 66 14 108-3" fill="none" stroke="#f5dfb1" stroke-width="2" opacity=".55"/>`;
    if (type === 'snake') return depthRock(363,199,1.18,type) + '<path d="M339 201q1-34 22-38 21 7 27 36Z" fill="#455b4c"/><path d="M344 201q3-26 18-28 12 7 16 26Z" fill="#2f4138"/>';
    return depthRock(373,198,type === 'elephant' ? .9 : .62,type);
  }
  function depthForeground(type) {
    if (type === 'penguin') return `<path d="m-12 268 33-38 42 13 26 40-13 17H0Zm360 32 27-38 51-17 28 17v38Z" fill="url(#zoo-rock-penguin)"/><path d="m-12 268 33-38 42 13 26 40-53-17Zm389-6 51-17 28 17-37 11Z" fill="#f1fbfc"/>`;
    const forest = ['monkey','panda','parrot','snake'].includes(type);
    return (type === 'snake' ? '<path fill-rule="evenodd" d="m322 204 14-37 35-10 30 26 9 27-44 14ZM339 201q1-34 22-38 21 7 27 36Z" fill="url(#zoo-rock-snake)"/>' : '') + depthRock(32,267,forest ? .76 : .92,type) + depthRock(427,254,.78,type) +
      (forest ? fern(13,299,1.35,'#365d49') + fern(432,294,1.2,'#416e51') : dryGrass([4,40,411,445],286,type === 'kangaroo' ? '#819273' : '#929252')) +
      (type === 'panda' ? '<path d="M43 300 28 153m27 147L48 174" stroke="#426e50" stroke-width="7"/><path d="m26 189 9-1m-6 31 9-1m-7 31 9-1m6-35 8-1m-5 31 8-1" stroke="#bdd2a2" stroke-width="2"/>' : '');
  }
  function scene(type, preyId, { unlocked = false, interactive = false, label = '' } = {}) {
    const environment = environments[type];
    const prey = type === 'lion' && huntPrey[preyId];
    const meal = food[type] || '';
    const foodBehindAnimal = type === 'dolphin' || type === 'seal';
    const layers = Object.entries(showProps[type] || {}).map(([phase, art]) => `<g class="zoo-show-layer" data-for-phase="${phase}">${art}</g>`).join('');
    const colors = terrainColors[type];
    return `<svg class="zoo-scene-art" viewBox="0 0 450 300" ${interactive ? `role="group" aria-label="${label}的生活场景"` : 'aria-hidden="true"'} focusable="false">
      <defs>
        <linearGradient id="zoo-sky-${type}" x2="0" y2="1"><stop stop-color="${environment.sky[0]}"/><stop offset="1" stop-color="${environment.sky[1]}"/></linearGradient>
        <linearGradient id="zoo-ground-${type}" x1="0" y1="0" x2=".7" y2="1"><stop stop-color="${colors[0]}"/><stop offset="1" stop-color="${colors[1]}"/></linearGradient>
        <linearGradient id="zoo-bank-${type}" x2="0" y2="1"><stop stop-color="${colors[1]}"/><stop offset="1" stop-color="${colors[2]}"/></linearGradient>
        <linearGradient id="zoo-rock-${type}" x2="1" y2="1"><stop stop-color="${type === 'penguin' ? '#d6eff3' : '#c6c1a2'}"/><stop offset="1" stop-color="${type === 'penguin' ? '#7bb2ca' : '#878c73'}"/></linearGradient>
        <linearGradient id="zoo-water-${type}" x2=".5" y2="1"><stop stop-color="#a3d2cb"/><stop offset="1" stop-color="#5896a6"/></linearGradient>
        <radialGradient id="zoo-shadow-${type}"><stop stop-color="#233e37" stop-opacity=".29"/><stop offset="1" stop-color="#233e37" stop-opacity="0"/></radialGradient>
        <linearGradient id="zoo-haze-${type}" x2="0" y2="1"><stop stop-color="${environment.sky[0]}" stop-opacity=".04"/><stop offset="1" stop-color="${environment.sky[1]}" stop-opacity=".28"/></linearGradient>
      </defs>
      <g class="zoo-layer-back" aria-hidden="true"><rect width="450" height="300" fill="url(#zoo-sky-${type})"/>
      ${environment.sun ? `<circle cx="${environment.sun[0]}" cy="${environment.sun[1]}" r="${environment.sun[2]}" fill="${environment.sun[3]}"/>` : ''}
      ${environment.forest ? '' : '<path d="M225 48q2-9 13-8 10-12 23-3 12-2 16 11ZM15 67q1-6 10-5 5-12 16-6 9-3 14 11Z" fill="#fffaf0" opacity=".7"/>'}
      <g class="zoo-habitat" data-habitat="${type}">${habitat(type, Boolean(prey))}</g>
      <rect width="450" height="238" fill="url(#zoo-haze-${type})"/></g>
      <g class="zoo-layer-ground" aria-hidden="true">${depthGround(type)}${prey ? '' : depthFixtures(type)}</g>
      <g transform="translate(0 18)"><g class="zoo-roam">
        ${['parrot','monkey'].includes(type) ? '' : `<ellipse class="zoo-contact-shadow" cx="225" cy="209" rx="${type === 'elephant' ? 87 : 67}" ry="14" fill="url(#zoo-shadow-${type})" aria-hidden="true"/>`}
        ${layers}${foodBehindAnimal ? meal : ''}${prey || ''}
        <g class="zoo-pet-trigger" ${interactive ? `role="button" tabindex="0" data-zoo-action="pet" aria-label="和${label}打招呼"` : 'aria-hidden="true"'}>
          ${interactive ? '<ellipse class="zoo-pet-target" cx="220" cy="130" rx="110" ry="103" fill="transparent"/>' : ''}
          <g class="zoo-animal-art" aria-hidden="true">${animals[type]}</g>
          <g class="zoo-touch-response" aria-hidden="true"><path d="M209 52q-12-13-21-3-7 10 21 25 28-15 21-25-9-10-21 3" fill="#eaa88a" stroke="#fff3df" stroke-width="2"/></g>
        </g>
        ${foodBehindAnimal ? '' : meal}${prey ? huntForeground : ''}${props[type] || ''}
      </g></g>
      <g class="zoo-layer-front" aria-hidden="true">${depthForeground(type)}</g>
      ${unlocked ? '' : '<g class="zoo-scene-lock" transform="translate(399 263)" aria-hidden="true"><circle r="22" fill="#fff8e8" stroke="#d8c9a5" stroke-width="2"/><path d="M-7-3v-6a7 7 0 0 1 14 0v6" fill="none" stroke="#9b8e6e" stroke-width="3"/><rect x="-11" y="-4" width="22" height="18" rx="4" fill="#c8b17b"/><path d="M0 2v5" stroke="#fff9e6" stroke-width="3" stroke-linecap="round"/></g>'}
    </svg>`;
  }
  const thumbnailBounds = {
    elephant: '100 81 244 134', giraffe: '148 25 186 185', seal: '108 90 230 106', monkey: '130 39 189 164',
    panda: '158 43 132 170', penguin: '138 42 158 172', parrot: '124 45 153 185',
    kangaroo: '169 39 171 172', dolphin: '118 58 223 127', snake: '115 88 233 128', lion: '115 36 244 176',
  };
  function thumbnail(type) {
    return `<svg class="zoo-animal-thumb" viewBox="${thumbnailBounds[type]}" aria-hidden="true" focusable="false">${animals[type]}</svg>`;
  }
  return { scene, thumbnail };
})();
