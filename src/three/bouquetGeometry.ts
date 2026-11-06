import * as THREE from 'three';
import {
  PETAL_PALETTES,
  RIBBON_STYLES,
  WRAP_STYLES,
} from '../data/dagupanCatalog';
import { BouquetConfig, FlowerSpeciesId } from '../types/floraview';
import {
  createPetalTexture,
  createSunflowerDiscTexture,
  createWrapFabricTexture,
} from './proceduralTextures';

export interface BouquetBuildResult {
  group: THREE.Group;
  stemGroups: THREE.Group[];
  dispose: () => void;
}

function createCurvedPetalGeometry(width: number, height: number, cupDepth: number): THREE.BufferGeometry {
  const geo = new THREE.PlaneGeometry(width, height, 8, 10);
  geo.translate(0, height * 0.5, 0);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const nx = Math.max(-1, Math.min(1, x / (width * 0.5)));
    const ny = Math.max(0, Math.min(1, y / height));
    // Taper base and round tip
    const widthEnvelope = Math.sin(Math.min(1, ny * 0.92 + 0.08) * Math.PI) * (0.45 + 0.55 * Math.sqrt(ny));
    const taperedX = x * widthEnvelope;
    // Cup curvature in Z + outward reflex at tip
    const cupZ = (1 - nx * nx) * cupDepth * Math.sin(ny * Math.PI) - Math.pow(ny, 2.4) * cupDepth * 0.65;
    pos.setXYZ(i, taperedX, Math.max(0, y), cupZ);
  }
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  return geo;
}

function createLeafGeometry(length: number, width: number): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(width * 0.65, length * 0.25, width * 0.55, length * 0.72, 0, length);
  shape.bezierCurveTo(-width * 0.55, length * 0.72, -width * 0.65, length * 0.25, 0, 0);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.012,
    bevelEnabled: true,
    bevelThickness: 0.006,
    bevelSize: 0.006,
    bevelSegments: 2,
    curveSegments: 10,
  });
  geo.rotateX(-Math.PI / 2.6);
  geo.computeVertexNormals();
  return geo;
}

function createCurvedStem(
  height: number,
  bendX: number,
  bendZ: number,
  radius: number,
  material: THREE.Material,
  leafMat: THREE.Material,
  leafGeo: THREE.BufferGeometry,
): THREE.Group {
  const stemGroup = new THREE.Group();
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(bendX * 0.35, height * 0.35, bendZ * 0.35),
    new THREE.Vector3(bendX * 0.85, height * 0.72, bendZ * 0.85),
    new THREE.Vector3(bendX, height, bendZ),
  ]);

  const tubeGeo = new THREE.TubeGeometry(curve, 14, radius, 8, false);
  const tubeMesh = new THREE.Mesh(tubeGeo, material);
  tubeMesh.castShadow = true;
  stemGroup.add(tubeMesh);

  // Two opposing botanical leaves emerging gracefully above the wrap collar
  const p1 = curve.getPoint(0.78);
  const leaf1 = new THREE.Mesh(leafGeo, leafMat);
  leaf1.position.copy(p1);
  leaf1.rotation.set(0.28, 0.5, -0.32);
  leaf1.scale.setScalar(0.68);
  leaf1.castShadow = true;
  stemGroup.add(leaf1);

  const p2 = curve.getPoint(0.89);
  const leaf2 = new THREE.Mesh(leafGeo, leafMat);
  leaf2.position.copy(p2);
  leaf2.rotation.set(-0.22, 3.6, 0.28);
  leaf2.scale.setScalar(0.58);
  leaf2.castShadow = true;
  stemGroup.add(leaf2);

  return stemGroup;
}

export function buildBouquet3D(
  config: BouquetConfig,
  anisotropy = 4,
): BouquetBuildResult {
  const root = new THREE.Group();
  const disposables: Array<{ dispose: () => void }> = [];
  const track = <T extends { dispose: () => void }>(item: T): T => {
    disposables.push(item);
    return item;
  };

  const palette = PETAL_PALETTES.find((p) => p.id === config.petalPalette) || PETAL_PALETTES[0];
  const wrapInfo = WRAP_STYLES.find((w) => w.id === config.wrapStyle) || WRAP_STYLES[0];
  const ribbonInfo = RIBBON_STYLES.find((r) => r.id === config.ribbonStyle) || RIBBON_STYLES[0];

  // Textures
  const mainPetalTex = track(
    createPetalTexture(palette.primaryHex, palette.secondaryHex, palette.accentHex, anisotropy),
  );
  const sunflowerPetalTex = track(
    createPetalTexture('#F2A918', '#FFD24C', '#B8640B', anisotropy),
  );
  const lilyPetalTex = track(
    createPetalTexture(palette.primaryHex, '#FFF7F9', '#9E1B42', anisotropy),
  );
  const sampaguitaTex = track(
    createPetalTexture('#F7F4EB', '#FFFFFF', '#DFD6C1', anisotropy),
  );
  const sunflowerDiscTex = track(createSunflowerDiscTexture(anisotropy));
  const wrapTextures = createWrapFabricTexture(
    wrapInfo.primaryHex,
    wrapInfo.secondaryHex,
    anisotropy,
  );
  track(wrapTextures.map);
  track(wrapTextures.bumpMap);

  // Calibrated PBR Materials (varied roughness >= 0.25 between foliage, velvet petals, linen wrap, and silk ribbon)
  const stemMat = track(
    new THREE.MeshStandardMaterial({
      color: '#34593D',
      roughness: 0.68,
      metalness: 0.02,
    }),
  );

  const leafMat = track(
    new THREE.MeshStandardMaterial({
      color: '#2B4F36',
      roughness: 0.42,
      metalness: 0.04,
      side: THREE.DoubleSide,
    }),
  );

  const eucalyptusMat = track(
    new THREE.MeshStandardMaterial({
      color: '#6E8C7A',
      roughness: 0.72,
      metalness: 0.02,
      side: THREE.DoubleSide,
    }),
  );

  const rosePetalMat = track(
    new THREE.MeshPhysicalMaterial({
      map: mainPetalTex,
      roughness: 0.54,
      metalness: 0.0,
      sheen: 0.65,
      sheenRoughness: 0.45,
      sheenColor: new THREE.Color(palette.secondaryHex),
      side: THREE.DoubleSide,
    }),
  );

  const roseHeartMat = track(
    new THREE.MeshPhysicalMaterial({
      color: palette.accentHex,
      roughness: 0.62,
      metalness: 0.0,
      sheen: 0.5,
      sheenColor: new THREE.Color(palette.primaryHex),
      side: THREE.DoubleSide,
    }),
  );

  const sunflowerPetalMat = track(
    new THREE.MeshPhysicalMaterial({
      map: sunflowerPetalTex,
      roughness: 0.52,
      metalness: 0.0,
      sheen: 0.5,
      sheenColor: new THREE.Color('#FFE07D'),
      side: THREE.DoubleSide,
    }),
  );

  const sunflowerDiscMat = track(
    new THREE.MeshStandardMaterial({
      map: sunflowerDiscTex,
      roughness: 0.88,
      metalness: 0.0,
    }),
  );

  const lilyPetalMat = track(
    new THREE.MeshPhysicalMaterial({
      map: lilyPetalTex,
      roughness: 0.36,
      metalness: 0.02,
      clearcoat: 0.25,
      clearcoatRoughness: 0.4,
      side: THREE.DoubleSide,
    }),
  );

  const orchidPetalMat = track(
    new THREE.MeshPhysicalMaterial({
      color: '#FAF7F0',
      roughness: 0.34,
      metalness: 0.02,
      sheen: 0.6,
      sheenColor: new THREE.Color('#FFFFFF'),
      side: THREE.DoubleSide,
    }),
  );

  const orchidLipMat = track(
    new THREE.MeshStandardMaterial({
      color: palette.primaryHex,
      roughness: 0.45,
      metalness: 0.05,
      side: THREE.DoubleSide,
    }),
  );

  const sampaguitaPetalMat = track(
    new THREE.MeshPhysicalMaterial({
      map: sampaguitaTex,
      roughness: 0.4,
      metalness: 0.0,
      sheen: 0.55,
      sheenColor: new THREE.Color('#FFFFFF'),
      side: THREE.DoubleSide,
    }),
  );

  const goldAntherMat = track(
    new THREE.MeshStandardMaterial({
      color: '#D98A16',
      roughness: 0.45,
      metalness: 0.15,
    }),
  );

  const wrapOuterMat = track(
    new THREE.MeshStandardMaterial({
      map: wrapTextures.map,
      bumpMap: wrapTextures.bumpMap,
      bumpScale: 0.015,
      roughness: 0.78,
      metalness: 0.02,
      side: THREE.DoubleSide,
    }),
  );

  const wrapInnerTissueMat = track(
    new THREE.MeshStandardMaterial({
      color: '#FBF9F4',
      roughness: 0.65,
      metalness: 0.0,
      side: THREE.DoubleSide,
    }),
  );

  const ribbonMat = track(
    new THREE.MeshPhysicalMaterial({
      color: ribbonInfo.hex,
      roughness: 0.24,
      metalness: ribbonInfo.id === 'gold' ? 0.65 : 0.08,
      clearcoat: 0.45,
      clearcoatRoughness: 0.25,
      sheen: 0.9,
      sheenRoughness: 0.25,
      sheenColor: new THREE.Color('#FFFFFF'),
      side: THREE.DoubleSide,
    }),
  );

  // Shared Geometries
  const stdLeafGeo = track(createLeafGeometry(0.28, 0.14));
  const roseInnerPetalGeo = track(createCurvedPetalGeometry(0.21, 0.25, 0.055));
  const roseOuterPetalGeo = track(createCurvedPetalGeometry(0.29, 0.31, 0.072));
  const sunRayGeo = track(createCurvedPetalGeometry(0.11, 0.28, 0.04));
  const lilyPetalGeo = track(createCurvedPetalGeometry(0.2, 0.44, 0.08));
  const orchidWingGeo = track(createCurvedPetalGeometry(0.22, 0.24, 0.05));
  const sampaguitaPetalGeo = track(createCurvedPetalGeometry(0.085, 0.14, 0.025));
  const calyxGeo = track(new THREE.ConeGeometry(0.09, 0.12, 8));
  calyxGeo.rotateX(Math.PI);

  // Builders per species
  function buildRoseHead(): THREE.Group {
    const head = new THREE.Group();
    const calyx = new THREE.Mesh(calyxGeo, stemMat);
    calyx.position.y = -0.02;
    head.add(calyx);

    // Center spiral bud cone with deeper botanical heart tone
    const budGeo = track(new THREE.ConeGeometry(0.068, 0.18, 12));
    budGeo.translate(0, 0.09, 0);
    const bud = new THREE.Mesh(budGeo, roseHeartMat);
    head.add(bud);

    // Inner spiral ring (4 petals)
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.35;
      const p = new THREE.Mesh(roseInnerPetalGeo, roseHeartMat);
      p.position.set(Math.cos(a) * 0.045, 0.02, Math.sin(a) * 0.045);
      p.rotation.y = -a + Math.PI / 2;
      p.rotation.x = 0.28;
      p.castShadow = true;
      head.add(p);
    }

    // Middle cupped ring (6 petals)
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.72;
      const p = new THREE.Mesh(roseInnerPetalGeo, rosePetalMat);
      p.position.set(Math.cos(a) * 0.082, 0.01, Math.sin(a) * 0.082);
      p.rotation.y = -a + Math.PI / 2;
      p.rotation.x = 0.56;
      p.scale.setScalar(1.1);
      p.castShadow = true;
      head.add(p);
    }

    // Outer open reflexed ring (7 petals)
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + 0.15;
      const p = new THREE.Mesh(roseOuterPetalGeo, rosePetalMat);
      p.position.set(Math.cos(a) * 0.115, 0.0, Math.sin(a) * 0.115);
      p.rotation.y = -a + Math.PI / 2;
      p.rotation.x = 0.86;
      p.castShadow = true;
      head.add(p);
    }

    return head;
  }

  function buildSunflowerHead(): THREE.Group {
    const head = new THREE.Group();
    head.rotation.x = 0.28;

    const discGeo = track(new THREE.CylinderGeometry(0.18, 0.14, 0.06, 24));
    const disc = new THREE.Mesh(discGeo, sunflowerDiscMat);
    disc.castShadow = true;
    head.add(disc);

    // Two staggered rings of 16 golden ray florets
    for (let ring = 0; ring < 2; ring++) {
      const count = 16;
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + ring * (Math.PI / count);
        const ray = new THREE.Mesh(sunRayGeo, sunflowerPetalMat);
        ray.position.set(
          Math.cos(a) * (0.14 + ring * 0.015),
          ring === 0 ? 0.015 : 0.005,
          Math.sin(a) * (0.14 + ring * 0.015),
        );
        ray.rotation.y = -a + Math.PI / 2;
        ray.rotation.x = ring === 0 ? 1.25 : 1.42;
        ray.castShadow = true;
        head.add(ray);
      }
    }

    return head;
  }

  function buildStargazerHead(): THREE.Group {
    const head = new THREE.Group();
    // 6 dramatic recurved star petals
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const petal = new THREE.Mesh(lilyPetalGeo, lilyPetalMat);
      petal.position.set(Math.cos(a) * 0.03, i % 2 === 0 ? 0.015 : 0, Math.sin(a) * 0.03);
      petal.rotation.y = -a + Math.PI / 2;
      petal.rotation.x = i % 2 === 0 ? 0.92 : 1.08;
      petal.castShadow = true;
      head.add(petal);
    }

    // 6 protruding stamens + golden anthers
    const filamentGeo = track(new THREE.CylinderGeometry(0.005, 0.007, 0.24, 6));
    filamentGeo.translate(0, 0.12, 0);
    const antherGeo = track(new THREE.CapsuleGeometry(0.014, 0.03, 4, 6));
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.25;
      const stamen = new THREE.Group();
      stamen.rotation.y = a;
      stamen.rotation.x = 0.26;
      const fil = new THREE.Mesh(filamentGeo, sampaguitaPetalMat);
      const ant = new THREE.Mesh(antherGeo, goldAntherMat);
      ant.position.y = 0.24;
      ant.rotation.z = Math.PI / 2;
      stamen.add(fil, ant);
      head.add(stamen);
    }

    return head;
  }

  function buildOrchidHead(): THREE.Group {
    const head = new THREE.Group();
    // 2 cascading Phalaenopsis butterfly blossoms
    const blossomOffsets = [
      { y: 0.0, z: 0.04, scale: 1.0, rotX: 0.25 },
      { y: -0.18, z: 0.12, scale: 0.88, rotX: 0.35 },
    ];

    blossomOffsets.forEach((b) => {
      const floret = new THREE.Group();
      floret.position.set(0, b.y, b.z);
      floret.scale.setScalar(b.scale);
      floret.rotation.x = b.rotX;

      // Dorsal sepal + 2 broad lateral butterfly petals + 2 lower sepals
      const angles = [0, 1.15, -1.15, 2.45, -2.45];
      angles.forEach((ang, idx) => {
        const wing = new THREE.Mesh(orchidWingGeo, orchidPetalMat);
        wing.rotation.z = ang;
        wing.rotation.x = 1.25;
        if (idx === 1 || idx === 2) {
          wing.scale.set(1.25, 1.05, 1);
        }
        wing.castShadow = true;
        floret.add(wing);
      });

      // Sculpted crimson-gold labellum lip
      const lipGeo = track(new THREE.SphereGeometry(0.055, 10, 8));
      lipGeo.scale(1.1, 0.8, 1.3);
      const lip = new THREE.Mesh(lipGeo, orchidLipMat);
      lip.position.set(0, -0.02, 0.045);
      floret.add(lip);

      head.add(floret);
    });

    return head;
  }

  function buildSampaguitaHead(): THREE.Group {
    const head = new THREE.Group();
    // Cluster of 3 fragrant 8-petal jasmine blossoms
    const clusterPositions = [
      new THREE.Vector3(0, 0.04, 0),
      new THREE.Vector3(-0.09, -0.01, 0.06),
      new THREE.Vector3(0.09, 0.0, -0.05),
    ];

    clusterPositions.forEach((pos, idx) => {
      const blossom = new THREE.Group();
      blossom.position.copy(pos);
      blossom.rotation.set(idx * 0.2, idx * 1.1, (idx - 1) * 0.25);

      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const p = new THREE.Mesh(sampaguitaPetalGeo, sampaguitaPetalMat);
        p.rotation.y = -a + Math.PI / 2;
        p.rotation.x = 1.28;
        p.castShadow = true;
        blossom.add(p);
      }

      const center = new THREE.Mesh(
        track(new THREE.SphereGeometry(0.022, 8, 8)),
        goldAntherMat,
      );
      blossom.add(center);
      head.add(blossom);
    });

    return head;
  }

  function buildEucalyptusHead(): THREE.Group {
    const head = new THREE.Group();
    const coinGeo = track(new THREE.CylinderGeometry(0.085, 0.085, 0.008, 14));
    for (let i = 0; i < 8; i++) {
      const t = i / 7;
      const pair = new THREE.Group();
      pair.position.set(Math.sin(t * 2.5) * 0.03, -0.26 + t * 0.34, 0);
      pair.rotation.y = i * 0.85;

      const left = new THREE.Mesh(coinGeo, eucalyptusMat);
      left.position.set(-0.075, 0, 0);
      left.rotation.z = 0.35;
      left.scale.setScalar(1.05 - t * 0.35);
      left.castShadow = true;

      const right = new THREE.Mesh(coinGeo, eucalyptusMat);
      right.position.set(0.075, 0.02, 0);
      right.rotation.z = -0.35;
      right.scale.setScalar(1.05 - t * 0.35);
      right.castShadow = true;

      pair.add(left, right);
      head.add(pair);
    }
    return head;
  }

  // Expand stems list and arrange via Golden-Angle Phyllotaxis Spiral
  const speciesList: FlowerSpeciesId[] = [];
  const order: FlowerSpeciesId[] = [
    'stargazer',
    'sunflower',
    'orchid',
    'rose',
    'sampaguita',
    'eucalyptus',
  ];
  order.forEach((sp) => {
    const count = Math.max(0, Math.min(12, config.stems[sp] || 0));
    for (let i = 0; i < count; i++) {
      speciesList.push(sp);
    }
  });
  if (speciesList.length === 0) {
    speciesList.push('rose', 'sampaguita', 'eucalyptus');
  }

  const stemGroups: THREE.Group[] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const total = speciesList.length;

  speciesList.forEach((sp, idx) => {
    const frac = total === 1 ? 0 : idx / (total - 1);
    const radialDist = 0.05 + Math.sqrt(frac) * 0.44;
    const angle = idx * goldenAngle;
    const targetX = Math.cos(angle) * radialDist;
    const targetZ = Math.sin(angle) * radialDist;

    // Dome height profile: taller in center, gracefully cascading toward rim
    const baseHeight = 1.48 - frac * 0.24 + (sp === 'eucalyptus' || sp === 'orchid' ? 0.12 : 0);
    const stemGroup = createCurvedStem(
      baseHeight,
      targetX,
      targetZ,
      sp === 'sunflower' || sp === 'stargazer' ? 0.022 : 0.017,
      stemMat,
      leafMat,
      stdLeafGeo,
    );

    let head: THREE.Group;
    switch (sp) {
      case 'rose':
        head = buildRoseHead();
        break;
      case 'sunflower':
        head = buildSunflowerHead();
        break;
      case 'stargazer':
        head = buildStargazerHead();
        break;
      case 'orchid':
        head = buildOrchidHead();
        break;
      case 'sampaguita':
        head = buildSampaguitaHead();
        break;
      case 'eucalyptus':
        head = buildEucalyptusHead();
        break;
    }

    head.position.set(targetX, baseHeight, targetZ);
    // Tilt bloom outward slightly along radial vector for natural dome silhouette
    head.rotation.z = -targetX * 0.55;
    head.rotation.x += targetZ * 0.55;
    stemGroup.add(head);

    // Store exploded-view vector for smooth damping in animation loop
    const basePos = new THREE.Vector3(0, 0.25, 0);
    const explodeOffset = new THREE.Vector3(targetX * 0.85, 0.28 + (1 - frac) * 0.22, targetZ * 0.85);
    stemGroup.position.copy(basePos);
    stemGroup.userData.basePos = basePos;
    stemGroup.userData.explodeOffset = explodeOffset;
    stemGroup.userData.speciesId = sp;

    root.add(stemGroup);
    stemGroups.push(stemGroup);
  });

  // Sculpted Wrapping Paper Cone & Pleated Collar (grounded at y = 0)
  const wrapperGroup = new THREE.Group();

  // Outer pleated wrap cone using LatheGeometry with flared top lip
  const wrapPoints = [
    new THREE.Vector2(0.08, 0.24),
    new THREE.Vector2(0.11, 0.42),
    new THREE.Vector2(0.14, 0.62),
    new THREE.Vector2(0.28, 0.92),
    new THREE.Vector2(0.48, 1.24),
    new THREE.Vector2(0.62, 1.44),
    new THREE.Vector2(0.66, 1.48),
  ];
  const outerWrapGeo = track(new THREE.LatheGeometry(wrapPoints, 32));
  // Add organic pleat ripples around the upper collar
  const wPos = outerWrapGeo.attributes.position;
  for (let i = 0; i < wPos.count; i++) {
    const vx = wPos.getX(i);
    const vy = wPos.getY(i);
    const vz = wPos.getZ(i);
    const r = Math.hypot(vx, vz);
    const ang = Math.atan2(vz, vx);
    const heightFactor = Math.max(0, (vy - 0.62) / 0.86);
    const pleat = Math.sin(ang * 9) * 0.035 * heightFactor;
    const scaleR = r > 0.001 ? (r + pleat) / r : 1;
    wPos.setXYZ(i, vx * scaleR, vy + Math.cos(ang * 5) * 0.03 * heightFactor, vz * scaleR);
  }
  outerWrapGeo.computeVertexNormals();
  const outerWrapMesh = new THREE.Mesh(outerWrapGeo, wrapOuterMat);
  outerWrapMesh.castShadow = true;
  outerWrapMesh.receiveShadow = true;
  wrapperGroup.add(outerWrapMesh);

  // Inner tissue paper liner slightly taller at back
  const innerPoints = [
    new THREE.Vector2(0.075, 0.28),
    new THREE.Vector2(0.13, 0.64),
    new THREE.Vector2(0.44, 1.26),
    new THREE.Vector2(0.59, 1.52),
  ];
  const innerWrapGeo = track(new THREE.LatheGeometry(innerPoints, 28));
  const innerWrapMesh = new THREE.Mesh(innerWrapGeo, wrapInnerTissueMat);
  wrapperGroup.add(innerWrapMesh);

  // Exposed bound stem ends at the base (sitting cleanly on y = 0)
  const bundleGeo = track(new THREE.CylinderGeometry(0.095, 0.115, 0.28, 16));
  bundleGeo.translate(0, 0.14, 0);
  const bundleMesh = new THREE.Mesh(bundleGeo, stemMat);
  bundleMesh.castShadow = true;
  wrapperGroup.add(bundleMesh);

  // Satin Ribbon Neck Collar + Sculpted Double-Loop Bow
  const collarGeo = track(new THREE.CylinderGeometry(0.148, 0.144, 0.09, 24, 1, true));
  collarGeo.translate(0, 0.62, 0);
  const collarMesh = new THREE.Mesh(collarGeo, ribbonMat);
  wrapperGroup.add(collarMesh);

  const bowGroup = new THREE.Group();
  bowGroup.position.set(0, 0.62, 0.155);

  const knotGeo = track(new THREE.SphereGeometry(0.038, 12, 10));
  knotGeo.scale(1.1, 0.9, 0.85);
  bowGroup.add(new THREE.Mesh(knotGeo, ribbonMat));

  const loopGeo = track(new THREE.TorusGeometry(0.085, 0.024, 10, 22));
  loopGeo.scale(1.35, 0.72, 0.55);

  const leftLoop = new THREE.Mesh(loopGeo, ribbonMat);
  leftLoop.position.set(-0.095, 0.015, 0.01);
  leftLoop.rotation.z = 0.24;
  leftLoop.rotation.y = 0.25;
  leftLoop.castShadow = true;

  const rightLoop = new THREE.Mesh(loopGeo, ribbonMat);
  rightLoop.position.set(0.095, 0.015, 0.01);
  rightLoop.rotation.z = -0.24;
  rightLoop.rotation.y = -0.25;
  rightLoop.castShadow = true;

  const tailGeo = track(new THREE.BoxGeometry(0.046, 0.28, 0.008));
  tailGeo.translate(0, -0.14, 0);

  const leftTail = new THREE.Mesh(tailGeo, ribbonMat);
  leftTail.position.set(-0.035, -0.01, 0.01);
  leftTail.rotation.z = -0.22;
  leftTail.rotation.x = 0.12;

  const rightTail = new THREE.Mesh(tailGeo, ribbonMat);
  rightTail.position.set(0.035, -0.01, 0.01);
  rightTail.rotation.z = 0.22;
  rightTail.rotation.x = 0.12;

  bowGroup.add(leftLoop, rightLoop, leftTail, rightTail);
  wrapperGroup.add(bowGroup);

  root.add(wrapperGroup);

  return {
    group: root,
    stemGroups,
    dispose: () => {
      disposables.forEach((d) => d.dispose());
    },
  };
}
