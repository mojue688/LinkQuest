function t(i,o=1280,c=720){const s=`<svg xmlns="http://www.w3.org/2000/svg" width="${o}" height="${c}" viewBox="0 0 ${o} ${c}">${i}</svg>`;return`data:image/svg+xml;utf8,${encodeURIComponent(s)}`}function a(i,o=64){return t(i,o,o)}const r={corridor:t(`
    <defs>
      <linearGradient id="cw" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#0a0d14"/><stop offset="0.5" stop-color="#121620"/><stop offset="1" stop-color="#080a10"/>
      </linearGradient>
      <linearGradient id="cf" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#1a1812"/><stop offset="1" stop-color="#0a0806"/>
      </linearGradient>
      <radialGradient id="clight" cx="0.5" cy="0" r="0.6">
        <stop offset="0" stop-color="#a0b0c8" stop-opacity="0.25"/><stop offset="0.4" stop-color="#607090" stop-opacity="0.08"/><stop offset="1" stop-color="#000" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="cfog" cx="0.5" cy="0.5" r="0.35">
        <stop offset="0" stop-color="#2a3040" stop-opacity="0.6"/><stop offset="1" stop-color="#0a0d14" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="cdoor" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#2a2418"/><stop offset="1" stop-color="#15110a"/>
      </linearGradient>
    </defs>
    <rect width="1280" height="720" fill="url(#cw)"/>
    <rect width="1280" height="720" fill="url(#clight)"/>
    <polygon points="0,0 1280,0 820,300 460,300" fill="#0d1018" opacity="0.9"/>
    <polygon points="0,720 1280,720 820,460 460,460" fill="url(#cf)"/>
    <polygon points="0,0 460,300 460,460 0,720" fill="#161a24" opacity="0.85"/>
    <polygon points="1280,0 820,300 820,460 1280,720" fill="#161a24" opacity="0.85"/>
    <g stroke="#2a3040" stroke-width="1" opacity="0.3">
      <line x1="0" y1="180" x2="460" y2="330"/><line x1="0" y1="360" x2="460" y2="380"/>
      <line x1="1280" y1="180" x2="820" y2="330"/><line x1="1280" y1="360" x2="820" y2="380"/>
    </g>
    <g stroke="#1a1610" stroke-width="1" opacity="0.4">
      <line x1="460" y1="460" x2="0" y2="540"/><line x1="460" y1="460" x2="0" y2="620"/>
      <line x1="820" y1="460" x2="1280" y2="540"/><line x1="820" y1="460" x2="1280" y2="620"/>
      <line x1="460" y1="460" x2="820" y2="460"/>
    </g>
    <rect x="140" y="200" width="130" height="260" fill="url(#cdoor)" stroke="#3a3020" stroke-width="2" rx="2"/>
    <rect x="150" y="210" width="110" height="240" fill="#1a1410" opacity="0.6"/>
    <text x="205" y="190" fill="#6a5a3a" font-size="14" text-anchor="middle" font-family="serif" opacity="0.7">411</text>
    <rect x="1010" y="200" width="130" height="260" fill="url(#cdoor)" stroke="#3a3020" stroke-width="2" rx="2"/>
    <rect x="1020" y="210" width="110" height="240" fill="#1a1410" opacity="0.6"/>
    <text x="1075" y="190" fill="#6a5a3a" font-size="14" text-anchor="middle" font-family="serif" opacity="0.7">415</text>
    <rect x="540" y="180" width="200" height="280" fill="url(#cdoor)" stroke="#4a3a2a" stroke-width="3" rx="2"/>
    <rect x="550" y="190" width="180" height="260" fill="#0d0a06" opacity="0.7"/>
    <text x="640" y="170" fill="#8a6a3a" font-size="18" text-anchor="middle" font-family="serif" opacity="0.8">413</text>
    <circle cx="710" cy="320" r="3" fill="#5a4a2a" opacity="0.6"/>
    <rect x="620" y="0" width="40" height="8" fill="#8090a8" opacity="0.15" rx="2"/>
    <rect x="620" y="0" width="40" height="6" fill="#a0b0c8" opacity="0.1" rx="2"/>
    <rect x="200" y="0" width="30" height="6" fill="#607090" opacity="0.08" rx="2"/>
    <rect x="1050" y="0" width="30" height="6" fill="#607090" opacity="0.08" rx="2"/>
    <ellipse cx="640" cy="380" rx="200" ry="80" fill="url(#cfog)"/>
    <rect x="0" y="0" width="1280" height="720" fill="url(#cw)" opacity="0.15"/>
  `),classroom:t(`
    <defs>
      <linearGradient id="klw" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#0e1014"/><stop offset="1" stop-color="#080a0e"/>
      </linearGradient>
      <linearGradient id="klf" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#1a1610"/><stop offset="1" stop-color="#0a0806"/>
      </linearGradient>
      <linearGradient id="kbb" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#1a2018"/><stop offset="1" stop-color="#0e120e"/>
      </linearGradient>
      <radialGradient id="klamp" cx="0.5" cy="0.15" r="0.5">
        <stop offset="0" stop-color="#6a8a5a" stop-opacity="0.2"/><stop offset="1" stop-color="#000" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="kfog" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#3a4048" stop-opacity="0.6"/><stop offset="1" stop-color="#1a1e24" stop-opacity="0.3"/>
      </linearGradient>
    </defs>
    <rect width="1280" height="720" fill="url(#klw)"/>
    <rect width="1280" height="720" fill="url(#klamp)"/>
    <rect x="0" y="0" width="1280" height="160" fill="#15181e" opacity="0.8"/>
    <rect x="40" y="30" width="1200" height="120" fill="url(#kbb)" stroke="#3a4a30" stroke-width="2" rx="2"/>
    <rect x="50" y="40" width="1180" height="100" fill="#0a0e0a" opacity="0.5"/>
    <g fill="#8a9a7a" opacity="0.35" font-family="serif" font-size="20">
      <text x="80" y="80">E = mc²</text>
      <text x="260" y="80">∫₀^∞ e^(-x²) dx = √π/2</text>
      <text x="560" y="80">ψ(x,t) = Ae^(i(kx-ωt))</text>
      <text x="860" y="80">∇²φ = ρ/ε₀</text>
      <text x="80" y="120" font-size="14" fill="#5a6a4a" opacity="0.6">413 → ∞  ·  lim(n→∞) f(n) = ?</text>
      <text x="500" y="125" font-size="13" fill="#4a3a2a" opacity="0.5">出口在钟声里</text>
    </g>
    <rect x="60" y="180" width="280" height="200" fill="url(#kfog)" opacity="0.7" rx="2"/>
    <rect x="60" y="180" width="280" height="200" fill="none" stroke="#2a3040" stroke-width="3" rx="2"/>
    <line x1="60" y1="280" x2="340" y2="280" stroke="#2a3040" stroke-width="2" opacity="0.5"/>
    <line x1="200" y1="180" x2="200" y2="380" stroke="#2a3040" stroke-width="2" opacity="0.5"/>
    <rect x="940" y="180" width="280" height="200" fill="url(#kfog)" opacity="0.7" rx="2"/>
    <rect x="940" y="180" width="280" height="200" fill="none" stroke="#2a3040" stroke-width="3" rx="2"/>
    <line x1="940" y1="280" x2="1220" y2="280" stroke="#2a3040" stroke-width="2" opacity="0.5"/>
    <line x1="1080" y1="180" x2="1080" y2="380" stroke="#2a3040" stroke-width="2" opacity="0.5"/>
    <g fill="#2a2418" stroke="#3a3022" stroke-width="1">
      <rect x="160" y="420" width="100" height="50" rx="3"/><rect x="180" y="460" width="8" height="50"/>
      <rect x="250" y="460" width="8" height="50"/><rect x="340" y="440" width="100" height="50" rx="3"/>
      <rect x="360" y="480" width="8" height="50"/><rect x="430" y="480" width="8" height="50"/>
      <rect x="520" y="460" width="100" height="50" rx="3"/><rect x="540" y="500" width="8" height="40"/>
      <rect x="610" y="500" width="8" height="40"/><rect x="700" y="440" width="100" height="50" rx="3"/>
      <rect x="720" y="480" width="8" height="50"/><rect x="790" y="480" width="8" height="50"/>
      <rect x="880" y="420" width="100" height="50" rx="3"/><rect x="900" y="460" width="8" height="50"/>
      <rect x="970" y="460" width="8" height="50"/><rect x="1060" y="440" width="100" height="50" rx="3"/>
      <rect x="1080" y="480" width="8" height="50"/><rect x="1150" y="480" width="8" height="50"/>
    </g>
    <rect x="0" y="560" width="1280" height="160" fill="url(#klf)"/>
    <g stroke="#1a1610" stroke-width="1" opacity="0.3">
      <line x1="0" y1="600" x2="1280" y2="600"/><line x1="0" y1="640" x2="1280" y2="640"/>
      <line x1="0" y1="680" x2="1280" y2="680"/><line x1="320" y1="560" x2="320" y2="720"/>
      <line x1="640" y1="560" x2="640" y2="720"/><line x1="960" y1="560" x2="960" y2="720"/>
    </g>
    <circle cx="1100" cy="100" r="28" fill="#1a1610" stroke="#4a3a2a" stroke-width="2"/>
    <circle cx="1100" cy="100" r="24" fill="#0e0c08"/>
    <line x1="1100" y1="100" x2="1100" y2="82" stroke="#8a7a5a" stroke-width="2"/>
    <line x1="1100" y1="100" x2="1112" y2="106" stroke="#8a7a5a" stroke-width="2"/>
    <circle cx="1100" cy="100" r="2" fill="#8a7a5a"/>
    <rect x="540" y="500" width="200" height="60" fill="#2a2418" stroke="#4a3a2a" stroke-width="2" rx="2"/>
    <rect x="550" y="510" width="180" height="40" fill="#1a1410" opacity="0.6"/>
    <rect x="630" y="0" width="20" height="6" fill="#5a7a4a" opacity="0.12" rx="2"/>
  `),corridor_door:t(`
    <defs>
      <linearGradient id="cdw" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#0c0e14"/><stop offset="1" stop-color="#080a0e"/>
      </linearGradient>
      <linearGradient id="cdd" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#1a1410"/><stop offset="0.5" stop-color="#2a2418"/><stop offset="1" stop-color="#15110a"/>
      </linearGradient>
      <radialGradient id="cdg" cx="0.3" cy="0.3" r="0.5">
        <stop offset="0" stop-color="#8a7a4a" stop-opacity="0.15"/><stop offset="1" stop-color="#000" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="1280" height="720" fill="url(#cdw)"/>
    <rect width="1280" height="720" fill="url(#cdg)"/>
    <rect x="200" y="80" width="880" height="560" fill="url(#cdd)" stroke="#4a3a2a" stroke-width="3" rx="4"/>
    <rect x="220" y="100" width="840" height="520" fill="#0d0a06" opacity="0.5"/>
    <polygon points="220,100 600,100 580,620 220,620" fill="#0a0806" opacity="0.4"/>
    <rect x="500" y="40" width="280" height="60" fill="#1a1610" stroke="#4a3a2a" stroke-width="2" rx="4"/>
    <text x="640" y="82" fill="#8a6a3a" font-size="36" text-anchor="middle" font-family="serif" opacity="0.85">413</text>
    <circle cx="990" cy="360" r="6" fill="#5a4a2a" opacity="0.7"/>
    <circle cx="990" cy="360" r="3" fill="#8a7a4a" opacity="0.5"/>
    <g stroke="#3a3022" stroke-width="1" opacity="0.2">
      <line x1="220" y1="200" x2="1060" y2="200"/><line x1="220" y1="320" x2="1060" y2="320"/>
      <line x1="220" y1="440" x2="1060" y2="440"/><line x1="220" y1="540" x2="1060" y2="540"/>
    </g>
  `),guardroom:t(`
    <defs>
      <linearGradient id="grw" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#12100c"/><stop offset="1" stop-color="#080604"/>
      </linearGradient>
      <radialGradient id="grlamp" cx="0.25" cy="0.4" r="0.4">
        <stop offset="0" stop-color="#c9a864" stop-opacity="0.25"/><stop offset="1" stop-color="#000" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="1280" height="720" fill="url(#grw)"/>
    <rect width="1280" height="720" fill="url(#grlamp)"/>
    <rect x="80" y="120" width="500" height="400" fill="#1a1610" stroke="#4a3a2a" stroke-width="2" rx="2"/>
    <rect x="100" y="140" width="460" height="360" fill="#0e0c08" opacity="0.6"/>
    <g fill="#6a5a3a" opacity="0.5" font-family="serif" font-size="16">
      <text x="120" y="180">值班表</text>
      <line x1="120" y1="190" x2="540" y2="190" stroke="#4a3a2a" stroke-width="1"/>
      <text x="120" y="220" font-size="13">22:00  张师傅  巡楼</text>
      <text x="120" y="250" font-size="13">23:00  ——    空岗</text>
      <text x="120" y="280" font-size="13">00:00  张师傅  巡楼</text>
      <text x="120" y="310" font-size="13">01:00  ——    空岗</text>
      <text x="120" y="340" font-size="13" fill="#8a6a3a">02:00  ???     413?</text>
      <text x="120" y="370" font-size="13">03:00  ——    空岗</text>
      <text x="120" y="400" font-size="13">04:00  张师傅  巡楼</text>
    </g>
    <rect x="160" y="440" width="160" height="80" fill="#2a2418" stroke="#4a3a2a" stroke-width="1" rx="2"/>
    <circle cx="240" cy="470" r="14" fill="#c9a864" opacity="0.3"/>
    <circle cx="240" cy="470" r="8" fill="#d4b878" opacity="0.4"/>
    <rect x="700" y="100" width="500" height="500" fill="#15110a" stroke="#3a2a1a" stroke-width="2" rx="2"/>
    <g fill="#1a1410" stroke="#3a2a1a" stroke-width="1">
      <rect x="720" y="120" width="460" height="90"/><rect x="720" y="220" width="460" height="90"/>
      <rect x="720" y="320" width="460" height="90"/><rect x="720" y="420" width="460" height="90"/>
      <rect x="720" y="520" width="460" height="60"/>
    </g>
    <g fill="#3a2a1a" opacity="0.4">
      <circle cx="950" cy="165" r="3"/><circle cx="950" cy="265" r="3"/>
      <circle cx="950" cy="365" r="3"/><circle cx="950" cy="465" r="3"/>
    </g>
    <rect x="0" y="580" width="1280" height="140" fill="#0a0806" opacity="0.8"/>
  `),lock_closeup:t(`
    <defs>
      <linearGradient id="lcw" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#0e0c08"/><stop offset="1" stop-color="#080604"/>
      </linearGradient>
      <linearGradient id="lcm" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#3a3a3a"/><stop offset="0.5" stop-color="#2a2a2a"/><stop offset="1" stop-color="#1a1a1a"/>
      </linearGradient>
      <radialGradient id="lcg" cx="0.5" cy="0.5" r="0.4">
        <stop offset="0" stop-color="#c9a864" stop-opacity="0.12"/><stop offset="1" stop-color="#000" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="1280" height="720" fill="url(#lcw)"/>
    <rect width="1280" height="720" fill="url(#lcg)"/>
    <rect x="200" y="100" width="880" height="520" fill="#1a1410" stroke="#3a2a1a" stroke-width="3" rx="4"/>
    <rect x="240" y="160" width="800" height="360" fill="url(#lcm)" stroke="#555" stroke-width="2" rx="8"/>
    <rect x="240" y="140" width="800" height="40" fill="none" stroke="#555" stroke-width="4" rx="40"/>
    <g>
      <rect x="320" y="200" width="120" height="280" fill="#0a0a0a" stroke="#555" stroke-width="1" rx="4"/>
      <rect x="480" y="200" width="120" height="280" fill="#0a0a0a" stroke="#555" stroke-width="1" rx="4"/>
      <rect x="640" y="200" width="120" height="280" fill="#0a0a0a" stroke="#555" stroke-width="1" rx="4"/>
      <rect x="800" y="200" width="120" height="280" fill="#0a0a0a" stroke="#555" stroke-width="1" rx="4"/>
    </g>
    <g fill="#c9a864" font-family="monospace" font-size="48" text-anchor="middle" opacity="0.3">
      <text x="380" y="350">0</text><text x="540" y="350">4</text>
      <text x="700" y="350">1</text><text x="860" y="350">3</text>
    </g>
    <g fill="#666" font-size="12" text-anchor="middle">
      <text x="380" y="195">▲</text><text x="540" y="195">▲</text>
      <text x="700" y="195">▲</text><text x="860" y="195">▲</text>
      <text x="380" y="495">▼</text><text x="540" y="495">▼</text>
      <text x="700" y="495">▼</text><text x="860" y="495">▼</text>
    </g>
    <circle cx="640" cy="560" r="20" fill="#2a2a2a" stroke="#555" stroke-width="2"/>
    <text x="640" y="568" fill="#c9a864" font-size="16" text-anchor="middle" font-family="serif" opacity="0.6">开锁</text>
  `),hall:t(`
    <defs>
      <linearGradient id="hw" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#1c1818"/><stop offset="1" stop-color="#0a0808"/>
      </linearGradient>
      <radialGradient id="hlamp" cx="0.5" cy="0.2" r="0.5">
        <stop offset="0" stop-color="#8a7a4a" stop-opacity="0.35"/><stop offset="1" stop-color="#8a7a4a" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="1280" height="720" fill="url(#hw)"/>
    <rect width="1280" height="720" fill="url(#hlamp)"/>
    <polygon points="0,0 1280,0 900,360 380,360" fill="#15110f" opacity="0.8"/>
    <polygon points="0,720 1280,720 900,420 380,420" fill="#15110f" opacity="0.6"/>
    <rect x="200" y="120" width="880" height="480" fill="#15110f" stroke="#3a2a1a" stroke-width="3"/>
    <g stroke="#4a3a2a" stroke-width="2" fill="none" opacity="0.5">
      <rect x="240" y="160" width="300" height="200"/><rect x="740" y="160" width="300" height="200"/>
    </g>
    <rect x="540" y="400" width="200" height="200" fill="#1a1410" stroke="#4a3a2a" stroke-width="2"/>
    <rect x="560" y="420" width="160" height="160" fill="#0a0808"/>
    <g fill="#3a2a1a" opacity="0.5">
      <rect x="100" y="600" width="80" height="120"/><rect x="1100" y="600" width="80" height="120"/>
    </g>
    <rect y="600" width="1280" height="120" fill="#2a2018" opacity="0.7"/>
    <line x1="640" y1="60" x2="640" y2="100" stroke="#4a3a2a" stroke-width="2"/>
    <circle cx="640" cy="110" r="18" fill="#6a5a3a" opacity="0.6"/>
    <circle cx="640" cy="110" r="14" fill="#8a7a4a" opacity="0.3"/>
  `),tomb:t(`
    <defs>
      <linearGradient id="tw" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#1a1612"/><stop offset="1" stop-color="#080604"/>
      </linearGradient>
      <radialGradient id="tg" cx="0.5" cy="0.5" r="0.4">
        <stop offset="0" stop-color="#4a3a2a" stop-opacity="0.15"/><stop offset="1" stop-color="#000" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="1280" height="720" fill="url(#tw)"/>
    <rect width="1280" height="720" fill="url(#tg)"/>
    <g fill="#2a2418" opacity="0.7">
      <rect x="0" y="0" width="200" height="720"/><rect x="1080" y="0" width="200" height="720"/>
    </g>
    <rect x="300" y="280" width="680" height="360" fill="#15110a" stroke="#4a3a2a" stroke-width="4"/>
    <g fill="#3a3022" opacity="0.5" font-family="serif" font-size="28">
      <text x="640" y="340" text-anchor="middle">⟁ ⟡ ⟐</text>
      <text x="640" y="500" text-anchor="middle">轮回之数</text>
    </g>
    <g fill="#5a4a3a" opacity="0.4">
      <circle cx="640" cy="460" r="40" stroke="#6a5a4a" stroke-width="3" fill="none"/>
      <circle cx="640" cy="460" r="20" stroke="#6a5a4a" stroke-width="2" fill="none"/>
    </g>
    <rect y="640" width="1280" height="80" fill="#1a1410" opacity="0.8"/>
  `),ending_dawn:t(`
    <defs>
      <linearGradient id="edw" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#2a2418"/><stop offset="0.4" stop-color="#4a3a2a"/><stop offset="0.7" stop-color="#8a6a4a"/><stop offset="1" stop-color="#c9a864"/>
      </linearGradient>
      <radialGradient id="edsun" cx="0.5" cy="0.7" r="0.4">
        <stop offset="0" stop-color="#f4d8a0" stop-opacity="0.4"/><stop offset="1" stop-color="#f4d8a0" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="1280" height="720" fill="url(#edw)"/>
    <rect width="1280" height="720" fill="url(#edsun)"/>
    <g fill="#1a1410" opacity="0.3">
      <rect x="100" y="200" width="80" height="400"/><rect x="1100" y="200" width="80" height="400"/>
    </g>
    <rect x="200" y="180" width="880" height="440" fill="#0a0806" opacity="0.2" stroke="#3a2a1a" stroke-width="2"/>
    <g stroke="#c9a864" stroke-width="1" fill="none" opacity="0.2">
      <line x1="200" y1="180" x2="1080" y2="180"/><line x1="200" y2="620" x2="1080" y2="620"/>
    </g>
    <circle cx="640" cy="500" r="60" fill="#f4d8a0" opacity="0.15"/>
    <circle cx="640" cy="500" r="30" fill="#f4d8a0" opacity="0.2"/>
  `),ending_dark:t(`
    <defs>
      <linearGradient id="ekw" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#0a0606"/><stop offset="1" stop-color="#000"/>
      </linearGradient>
      <radialGradient id="ekg" cx="0.5" cy="0.5" r="0.3">
        <stop offset="0" stop-color="#3a1010" stop-opacity="0.3"/><stop offset="1" stop-color="#000" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="1280" height="720" fill="url(#ekw)"/>
    <rect width="1280" height="720" fill="url(#ekg)"/>
    <g fill="#1a0808" opacity="0.4">
      <rect x="80" y="100" width="120" height="500" rx="4"/><rect x="1080" y="100" width="120" height="500" rx="4"/>
      <rect x="280" y="150" width="120" height="450" rx="4"/><rect x="880" y="150" width="120" height="450" rx="4"/>
    </g>
    <g stroke="#3a1010" stroke-width="1" fill="none" opacity="0.3">
      <circle cx="640" cy="360" r="200"/><circle cx="640" cy="360" r="280"/><circle cx="640" cy="360" r="360"/>
    </g>
    <ellipse cx="640" cy="360" rx="100" ry="200" fill="#000" opacity="0.5"/>
  `),ending_loop:t(`
    <defs>
      <linearGradient id="elw" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#1a1e24"/><stop offset="1" stop-color="#0a0c10"/>
      </linearGradient>
      <radialGradient id="elfog" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stop-color="#4a5060" stop-opacity="0.3"/><stop offset="1" stop-color="#1a1e24" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="1280" height="720" fill="url(#elw)"/>
    <rect width="1280" height="720" fill="url(#elfog)"/>
    <g stroke="#3a4050" stroke-width="1" fill="none" opacity="0.15">
      <rect x="200" y="120" width="880" height="480"/>
      <rect x="280" y="180" width="720" height="360"/>
      <rect x="360" y="240" width="560" height="240"/>
      <rect x="440" y="300" width="400" height="120"/>
    </g>
    <text x="640" y="380" fill="#3a4050" font-size="48" text-anchor="middle" font-family="serif" opacity="0.15">413</text>
    <g fill="#3a4050" opacity="0.08">
      <circle cx="300" cy="200" r="60"/><circle cx="980" cy="500" r="80"/>
      <circle cx="900" cy="180" r="40"/><circle cx="380" cy="520" r="50"/>
    </g>
  `),ending:t(`
    <defs>
      <linearGradient id="g5" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#1a1010"/><stop offset="1" stop-color="#0a0606"/>
      </linearGradient>
    </defs>
    <rect width="1280" height="720" fill="url(#g5)"/>
    <g fill="#3a2010" opacity="0.3">
      <circle cx="200" cy="200" r="120"/><circle cx="1080" cy="520" r="160"/>
    </g>
    <g stroke="#4a2a1a" stroke-width="1" fill="none" opacity="0.4">
      <circle cx="640" cy="360" r="200"/><circle cx="640" cy="360" r="280"/><circle cx="640" cy="360" r="360"/>
    </g>
  `),default:t(`
    <defs>
      <linearGradient id="gd" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#1c1a17"/><stop offset="1" stop-color="#0e0c0a"/>
      </linearGradient>
    </defs>
    <rect width="1280" height="720" fill="url(#gd)"/>
    <g stroke="#3a352b" stroke-width="1" fill="none" opacity="0.3">
      <line x1="0" y1="180" x2="1280" y2="180"/><line x1="0" y1="360" x2="1280" y2="360"/>
      <line x1="0" y1="540" x2="1280" y2="540"/><line x1="320" y1="0" x2="320" y2="720"/>
      <line x1="640" y1="0" x2="640" y2="720"/><line x1="960" y1="0" x2="960" y2="720"/>
    </g>
    <circle cx="640" cy="360" r="60" fill="none" stroke="#4a3a2a" stroke-width="2" opacity="0.4"/>
  `)},l={student:t(`
    <defs><linearGradient id="cs1" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2a3a4a"/><stop offset="1" stop-color="#1a2a3a"/>
    </linearGradient>
    <radialGradient id="csf" cx="0.5" cy="0.35" r="0.3">
      <stop offset="0" stop-color="#e4c8a0"/><stop offset="1" stop-color="#b89878"/>
    </radialGradient></defs>
    <rect width="400" height="600" fill="transparent"/>
    <ellipse cx="200" cy="560" rx="100" ry="22" fill="#0a0a0a" opacity="0.5"/>
    <path d="M120 580 Q200 540 280 580 L280 600 L120 600 Z" fill="#1a2a3a" opacity="0.6"/>
    <rect x="135" y="270" width="130" height="280" rx="24" fill="url(#cs1)"/>
    <path d="M135 290 Q200 280 265 290 L265 320 L135 320 Z" fill="#1a2a3a"/>
    <rect x="155" y="340" width="90" height="6" fill="#3a4a5a" opacity="0.4" rx="2"/>
    <circle cx="200" cy="190" r="75" fill="url(#csf)"/>
    <path d="M125 190 Q200 80 275 190 L275 220 Q260 200 200 200 Q140 200 125 220 Z" fill="#2a1a10"/>
    <path d="M125 190 Q130 170 145 165" stroke="#2a1a10" stroke-width="3" fill="none"/>
    <path d="M275 190 Q270 170 255 165" stroke="#2a1a10" stroke-width="3" fill="none"/>
    <g fill="#1a1410"><circle cx="175" cy="195" r="7"/><circle cx="225" cy="195" r="7"/></g>
    <g fill="#3a5060" opacity="0.4"><circle cx="175" cy="195" r="3"/><circle cx="225" cy="195" r="3"/></g>
    <path d="M170 185 Q175 180 180 185" stroke="#2a1a10" stroke-width="2" fill="none"/>
    <path d="M220 185 Q225 180 230 185" stroke="#2a1a10" stroke-width="2" fill="none"/>
    <path d="M180 235 Q200 248 220 235" stroke="#6a4a3a" stroke-width="3" fill="none"/>
    <path d="M190 240 L210 240" stroke="#5a3a2a" stroke-width="1" fill="none"/>
    <ellipse cx="170" cy="215" rx="12" ry="6" fill="#c98878" opacity="0.15"/>
    <ellipse cx="230" cy="215" rx="12" ry="6" fill="#c98878" opacity="0.15"/>
  `,400,600),narrator:t(`
    <defs><radialGradient id="cnf" cx="0.5" cy="0.35" r="0.3">
      <stop offset="0" stop-color="#9a8a7a"/><stop offset="1" stop-color="#6a5a4a"/>
    </radialGradient></defs>
    <rect width="400" height="600" fill="transparent"/>
    <ellipse cx="200" cy="560" rx="90" ry="20" fill="#0a0a0a" opacity="0.4"/>
    <rect x="145" y="290" width="110" height="260" rx="18" fill="#2a2020"/>
    <rect x="160" y="310" width="80" height="5" fill="#3a2a2a" opacity="0.5" rx="2"/>
    <circle cx="200" cy="210" r="65" fill="url(#cnf)"/>
    <path d="M135 210 Q200 130 265 210 L265 235 Q250 215 200 215 Q150 215 135 235 Z" fill="#1a1010"/>
    <g fill="#0a0808"><circle cx="178" cy="215" r="6"/><circle cx="222" cy="215" r="6"/></g>
    <path d="M172 205 Q178 200 184 205" stroke="#1a1010" stroke-width="2" fill="none"/>
    <path d="M216 205 Q222 200 228 205" stroke="#1a1010" stroke-width="2" fill="none"/>
    <path d="M185 245 Q200 255 215 245" stroke="#4a3a2a" stroke-width="2" fill="none"/>
    <rect x="185" y="270" width="30" height="3" fill="#3a2a2a" opacity="0.4" rx="1"/>
  `,400,600),watchman:t(`
    <defs><radialGradient id="cwf" cx="0.5" cy="0.35" r="0.3">
      <stop offset="0" stop-color="#c9a888"/><stop offset="1" stop-color="#8a6848"/>
    </radialGradient></defs>
    <rect width="400" height="600" fill="transparent"/>
    <ellipse cx="200" cy="560" rx="95" ry="20" fill="#0a0a0a" opacity="0.45"/>
    <rect x="130" y="280" width="140" height="270" rx="20" fill="#3a3020"/>
    <rect x="145" y="300" width="110" height="6" fill="#2a2010" opacity="0.5" rx="2"/>
    <rect x="170" y="340" width="60" height="40" fill="#2a2418" stroke="#5a4a3a" stroke-width="1" rx="2"/>
    <circle cx="200" cy="360" r="6" fill="#c9a864" opacity="0.6"/>
    <circle cx="200" cy="200" r="72" fill="url(#cwf)"/>
    <path d="M128 200 Q200 90 272 200 L272 230 Q256 210 200 210 Q144 210 128 230 Z" fill="#1a1410"/>
    <path d="M128 200 Q132 175 148 168" stroke="#1a1410" stroke-width="3" fill="none"/>
    <path d="M272 200 Q268 175 252 168" stroke="#1a1410" stroke-width="3" fill="none"/>
    <g fill="#1a1410"><circle cx="176" cy="205" r="7"/><circle cx="224" cy="205" r="7"/></g>
    <path d="M170 195 Q176 190 182 195" stroke="#1a1410" stroke-width="2" fill="none"/>
    <path d="M218 195 Q224 190 230 195" stroke="#1a1410" stroke-width="2" fill="none"/>
    <path d="M180 245 Q200 250 220 245" stroke="#4a3a2a" stroke-width="3" fill="none"/>
    <rect x="175" y="265" width="50" height="12" fill="#3a2a1a" opacity="0.4" rx="2"/>
    <path d="M175 270 Q200 280 225 270" stroke="#2a1a10" stroke-width="2" fill="none"/>
  `,400,600),silhouette:t(`
    <rect width="400" height="600" fill="transparent"/>
    <ellipse cx="200" cy="560" rx="70" ry="16" fill="#0a0a0a" opacity="0.5"/>
    <rect x="160" y="300" width="80" height="240" rx="12" fill="#0a0a0a"/>
    <circle cx="200" cy="230" r="50" fill="#0a0a0a"/>
  `,400,600)};function x(){return a(`<rect x="8" y="6" width="48" height="52" rx="2" fill="#3a2a1a" stroke="#5a4a3a" stroke-width="2"/>
    <rect x="14" y="12" width="36" height="40" fill="#2a1a10"/>
    <line x1="32" y1="12" x2="32" y2="52" stroke="#1a1008" stroke-width="1" opacity="0.4"/>
    <circle cx="44" cy="34" r="3" fill="#8a7a4a"/>
    <circle cx="44" cy="34" r="1.5" fill="#c9a864"/>`)}function f(){return a(`<rect x="6" y="10" width="52" height="44" rx="2" fill="#4a3a2a" stroke="#6a5a4a" stroke-width="2"/>
    <rect x="10" y="14" width="44" height="16" fill="#3a2a1a"/><rect x="10" y="34" width="44" height="16" fill="#3a2a1a"/>
    <circle cx="32" cy="22" r="2" fill="#8a7a4a"/><circle cx="32" cy="42" r="2" fill="#8a7a4a"/>`)}function n(){return a(`<rect x="4" y="8" width="56" height="44" rx="2" fill="#1a2018" stroke="#5a6a4a" stroke-width="2"/>
    <text x="20" y="28" fill="#8a9a7a" font-size="10" font-family="serif" opacity="0.7">E=mc²</text>
    <text x="16" y="42" fill="#5a6a4a" font-size="8" font-family="serif" opacity="0.5">413→∞</text>`)}function p(){return a(`<circle cx="32" cy="32" r="24" fill="#2a2418" stroke="#8a7a4a" stroke-width="2"/>
    <circle cx="32" cy="32" r="20" fill="#1a1610"/>
    <line x1="32" y1="32" x2="32" y2="14" stroke="#c9b890" stroke-width="2"/>
    <line x1="32" y1="32" x2="46" y2="36" stroke="#c9b890" stroke-width="2"/>
    <circle cx="32" cy="32" r="2" fill="#c9b890"/>
    <g fill="#8a7a5a"><circle cx="32" cy="12" r="1"/><circle cx="52" cy="32" r="1"/><circle cx="32" cy="52" r="1"/><circle cx="12" cy="32" r="1"/></g>`)}function g(){return a(`<rect x="10" y="10" width="44" height="44" rx="2" fill="#5a2a2a" stroke="#8a4a4a" stroke-width="2"/>
    <line x1="32" y1="10" x2="32" y2="54" stroke="#3a1a1a" stroke-width="2"/>
    <line x1="16" y1="22" x2="28" y2="22" stroke="#c9a890" stroke-width="1"/>
    <line x1="16" y1="30" x2="28" y2="30" stroke="#c9a890" stroke-width="1"/>
    <line x1="36" y1="22" x2="48" y2="22" stroke="#c9a890" stroke-width="1"/>
    <line x1="36" y1="30" x2="48" y2="30" stroke="#c9a890" stroke-width="1"/>`)}function w(){return a(`<rect x="12" y="24" width="40" height="32" rx="4" fill="#3a3a3a" stroke="#6a6a6a" stroke-width="2"/>
    <path d="M20 24 V16 a12 12 0 0 1 24 0 V24" fill="none" stroke="#6a6a6a" stroke-width="3"/>
    <circle cx="32" cy="38" r="4" fill="#8a7a4a"/>
    <rect x="31" y="38" width="2" height="8" fill="#8a7a4a"/>`)}function k(){return a(`<circle cx="20" cy="32" r="10" fill="none" stroke="#c9a840" stroke-width="3"/>
    <circle cx="20" cy="32" r="3" fill="#1a1410"/>
    <rect x="28" y="29" width="28" height="6" fill="#c9a840"/>
    <rect x="50" y="29" width="4" height="12" fill="#c9a840"/>
    <rect x="44" y="29" width="4" height="8" fill="#c9a840"/>`)}function m(){return a(`<rect x="12" y="8" width="40" height="48" rx="1" fill="#d4c8a0" stroke="#8a7a4a" stroke-width="1"/>
    <line x1="18" y1="18" x2="46" y2="18" stroke="#5a4a2a" stroke-width="1"/>
    <line x1="18" y1="26" x2="46" y2="26" stroke="#5a4a2a" stroke-width="1"/>
    <line x1="18" y1="34" x2="40" y2="34" stroke="#5a4a2a" stroke-width="1"/>
    <line x1="18" y1="42" x2="42" y2="42" stroke="#5a4a2a" stroke-width="1"/>`)}function u(){return a(`<rect x="8" y="8" width="48" height="48" rx="1" fill="#2a3040" stroke="#5a6a7a" stroke-width="2"/>
    <rect x="12" y="12" width="40" height="40" fill="#3a4050" opacity="0.6"/>
    <line x1="32" y1="12" x2="32" y2="52" stroke="#5a6a7a" stroke-width="1"/>
    <line x1="12" y1="32" x2="52" y2="32" stroke="#5a6a7a" stroke-width="1"/>`)}function G(){return a(`<rect x="10" y="18" width="44" height="28" rx="14" fill="#2a2418" stroke="#5a4a3a" stroke-width="2"/>
    <circle cx="22" cy="32" r="8" fill="#5a4a3a"/>
    <rect x="18" y="28" width="8" height="8" rx="4" fill="#8a7a4a"/>`)}function b(){return a(`<rect x="14" y="6" width="36" height="52" rx="1" fill="#d4c8a0" stroke="#8a7a4a" stroke-width="1"/>
    <line x1="20" y1="16" x2="44" y2="16" stroke="#5a4a2a" stroke-width="1"/>
    <line x1="20" y1="22" x2="40" y2="22" stroke="#5a4a2a" stroke-width="1"/>
    <rect x="20" y="30" width="24" height="16" fill="#5a4a2a" opacity="0.3"/>
    <line x1="20" y1="50" x2="44" y2="50" stroke="#5a4a2a" stroke-width="1"/>`)}function Q(){return a(`<rect x="20" y="8" width="24" height="16" rx="2" fill="#5a4a3a" stroke="#8a7a4a" stroke-width="1"/>
    <rect x="22" y="24" width="20" height="28" fill="#3a2a1a" stroke="#5a4a3a" stroke-width="1"/>
    <circle cx="32" cy="16" r="4" fill="#c9a864" opacity="0.6"/>`)}function M(){return a(`<ellipse cx="28" cy="38" rx="10" ry="14" fill="#5a4a3a" opacity="0.6"/>
    <circle cx="20" cy="22" r="3" fill="#5a4a3a" opacity="0.6"/>
    <circle cx="28" cy="18" r="3" fill="#5a4a3a" opacity="0.6"/>
    <circle cx="36" cy="20" r="3" fill="#5a4a3a" opacity="0.6"/>
    <circle cx="42" cy="26" r="2.5" fill="#5a4a3a" opacity="0.6"/>`)}function z(){return a(`<circle cx="32" cy="32" r="20" fill="#2a2418" stroke="#5a4a3a" stroke-width="2"/>
    <circle cx="32" cy="32" r="6" fill="#5a4a3a"/>`)}const e={door:x(),drawer:f(),board:n(),clock:p(),book:g(),lock:w(),key:k(),note:m(),window:u(),switch:G(),poster:b(),flashlight:Q(),footprint:M(),default:z()},d=[{id:"bg:corridor",category:"bg",name:"午夜走廊",src:r.corridor},{id:"bg:classroom",category:"bg",name:"413教室",src:r.classroom},{id:"bg:corridor_door",category:"bg",name:"走廊门牌",src:r.corridor_door},{id:"bg:guardroom",category:"bg",name:"值班室",src:r.guardroom},{id:"bg:lock_closeup",category:"bg",name:"密码锁特写",src:r.lock_closeup},{id:"bg:hall",category:"bg",name:"古堡大厅",src:r.hall},{id:"bg:tomb",category:"bg",name:"古墓",src:r.tomb},{id:"bg:ending_dawn",category:"bg",name:"破晓结局",src:r.ending_dawn},{id:"bg:ending_dark",category:"bg",name:"黑暗结局",src:r.ending_dark},{id:"bg:ending_loop",category:"bg",name:"循环结局",src:r.ending_loop},{id:"bg:ending",category:"bg",name:"通用结局",src:r.ending},{id:"bg:default",category:"bg",name:"默认背景",src:r.default},{id:"char:student",category:"char",name:"学生",src:l.student},{id:"char:narrator",category:"char",name:"旁白者",src:l.narrator},{id:"char:watchman",category:"char",name:"值班大爷",src:l.watchman},{id:"char:silhouette",category:"char",name:"剪影",src:l.silhouette},{id:"item:door",category:"item",name:"门",src:e.door},{id:"item:drawer",category:"item",name:"抽屉",src:e.drawer},{id:"item:board",category:"item",name:"黑板",src:e.board},{id:"item:clock",category:"item",name:"时钟",src:e.clock},{id:"item:book",category:"item",name:"书本",src:e.book},{id:"item:lock",category:"item",name:"锁",src:e.lock},{id:"item:key",category:"item",name:"钥匙",src:e.key},{id:"item:note",category:"item",name:"纸条",src:e.note},{id:"item:window",category:"item",name:"窗户",src:e.window},{id:"item:switch",category:"item",name:"开关",src:e.switch},{id:"item:poster",category:"item",name:"海报",src:e.poster},{id:"item:flashlight",category:"item",name:"手电筒",src:e.flashlight},{id:"item:footprint",category:"item",name:"脚印",src:e.footprint},{id:"item:default",category:"item",name:"默认物品",src:e.default}],h=new Map(d.map(i=>[i.id,i]));function _(i,o="bg:default"){var s,y;if(!i)return((s=h.get(o))==null?void 0:s.src)??r.default;if(/^(https?:|data:)/.test(i))return i;const c=h.get(i);return c?c.src:i.startsWith("bg:")?r.default:i.startsWith("char:")?l.silhouette:i.startsWith("item:")?e.default:((y=h.get(o))==null?void 0:y.src)??r.default}function L(i){return d.filter(o=>o.category===i)}export{L as l,_ as r};
