import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { 
  RotateCw, 
  Zap, 
  Sun, 
  Moon, 
  Compass, 
  Sparkles,
  Maximize2
} from 'lucide-react';
import { UserRole } from '../types';

export interface DepartmentHotspot {
  id: string;
  role: UserRole;
  name: string;
  code: string;
  hex: number;
  x: number;
  z: number;
  height: number;
}

export const DEPARTMENT_HOTSPOTS: DepartmentHotspot[] = [
  { id: 'spot-citizen', role: 'citizen', name: 'Citizen Civic Hub', code: 'Portal', hex: 0xf43f5e, x: -15, z: -15, height: 14 }, // Vibrant Pink
  { id: 'spot-police', role: 'police', name: 'Police Command Div', code: '100/112', hex: 0x10b981, x: -18, z: 12, height: 17 }, // Neon Green
  { id: 'spot-hospital', role: 'hospital', name: 'Trauma EMS Center', code: '102/108', hex: 0x059669, x: 18, z: -16, height: 15 }, // Emerald Green
  { id: 'spot-fire', role: 'fire', name: 'Fire & HazMat Rescue', code: '101', hex: 0xf43f5e, x: 16, z: 16, height: 16 }, // Neon Rose Pink
  { id: 'spot-rto', role: 'rto', name: 'RTO Traffic Control', code: '1073', hex: 0x34d399, x: -2, z: 22, height: 12 }, // Mint Green
  { id: 'spot-municipal', role: 'municipal', name: 'Municipal Civic Works', code: '1916', hex: 0x10b981, x: 22, z: 0, height: 14 }, // Neon Green
  { id: 'spot-admin', role: 'admin', name: 'Central Admin HQ', code: 'HQ Desk', hex: 0xec4899, x: 0, z: 0, height: 24 } // Hot Pink
];

interface Full3DCityBackgroundProps {
  activeHoverRole?: UserRole | null;
  onSelectRole?: (role: UserRole) => void;
  className?: string;
}

export const Full3DCityBackground: React.FC<Full3DCityBackgroundProps> = ({
  activeHoverRole,
  onSelectRole,
  className = ''
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isRotating, setIsRotating] = useState(true);
  const [cameraPreset, setCameraPreset] = useState<'orbit' | 'satellite' | 'street' | 'tactical'>('orbit');

  // References to communicate with Three.js loop
  const triggerPulseRef = useRef<() => void>(() => {});
  const setCamPresetRef = useRef<(preset: 'orbit' | 'satellite' | 'street' | 'tactical') => void>(() => {});
  const highlightRoleRef = useRef<(role: UserRole | null) => void>(() => {});

  useEffect(() => {
    highlightRoleRef.current(activeHoverRole || null);
  }, [activeHoverRole]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    // Scene setup with Deep Black Background
    const scene = new THREE.Scene();
    const bgBlack = new THREE.Color(0x050608); // Pitch Black Cyber Void
    scene.background = bgBlack;
    scene.fog = new THREE.FogExp2(0x050608, 0.0095);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 1600);
    const targetCamPos = new THREE.Vector3(48, 38, 54);
    const currentLookAt = new THREE.Vector3(0, 3, 0);
    const targetLookAt = new THREE.Vector3(0, 3, 0);
    camera.position.copy(targetCamPos);
    camera.lookAt(currentLookAt);

    // WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.appendChild(renderer.domElement);

    // Dynamic High-Impact Lighting in Black, Neon Pink, and Cyber Green
    const ambientLight = new THREE.AmbientLight(0x0a0c10, 1.4);
    scene.add(ambientLight);

    // Cyber Emerald Green Directional Sun
    const greenSun = new THREE.DirectionalLight(0x10b981, 2.6);
    greenSun.position.set(60, 80, 40);
    greenSun.castShadow = true;
    greenSun.shadow.mapSize.width = 1024;
    greenSun.shadow.mapSize.height = 1024;
    scene.add(greenSun);

    // Vibrant Electric Hot Pink Rim Light
    const pinkRim = new THREE.DirectionalLight(0xf43f5e, 2.4);
    pinkRim.position.set(-60, 45, -50);
    scene.add(pinkRim);

    // Neon Green Back Fill Light
    const greenFill = new THREE.DirectionalLight(0x059669, 1.6);
    greenFill.position.set(0, 60, -60);
    scene.add(greenFill);

    // Electric Hot Pink Central Spire Point Light
    const pinkCenter = new THREE.PointLight(0xec4899, 4.2, 160);
    pinkCenter.position.set(0, 26, 0);
    scene.add(pinkCenter);

    // Cyber Ground Matrix (Dual Green & Pink Grid Lines on Pitch Black)
    const gridHelperGreen = new THREE.GridHelper(140, 70, 0x10b981, 0x052e16);
    gridHelperGreen.position.y = -0.04;
    scene.add(gridHelperGreen);

    const gridHelperPink = new THREE.GridHelper(140, 28, 0xf43f5e, 0x4c0519);
    gridHelperPink.position.y = -0.02;
    scene.add(gridHelperPink);

    // Deep Black Ground Plane
    const groundGeo = new THREE.PlaneGeometry(180, 180);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x030305,
      roughness: 0.85,
      metalness: 0.2
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    ground.receiveShadow = true;
    scene.add(ground);

    // Group for procedural 3D City Buildings
    const cityGroup = new THREE.Group();
    scene.add(cityGroup);

    // Skyscraper Materials with Black Obsidian + Neon Accent Emissives (Black, Neon Pink & Cyber Green)
    const buildingMaterials = [
      new THREE.MeshStandardMaterial({ color: 0x08090c, roughness: 0.18, metalness: 0.9, emissive: 0x064e3b, emissiveIntensity: 0.55 }), // Black/Emerald Green
      new THREE.MeshStandardMaterial({ color: 0x0a060a, roughness: 0.2, metalness: 0.92, emissive: 0x831843, emissiveIntensity: 0.6 }), // Black/Hot Pink
      new THREE.MeshStandardMaterial({ color: 0x050807, roughness: 0.22, metalness: 0.88, emissive: 0x047857, emissiveIntensity: 0.5 }), // Black/Mint Green
      new THREE.MeshStandardMaterial({ color: 0x0d060c, roughness: 0.15, metalness: 0.95, emissive: 0xbe123c, emissiveIntensity: 0.65 }) // Black/Rose Pink
    ];

    const edgeLineColors = [0x10b981, 0xf43f5e, 0x34d399, 0xec4899]; // Cyber Green, Neon Rose Pink, Mint Green, Hot Pink edges

    // Procedural 3D City Grid Generation
    const gridSize = 9;
    const spacing = 5.8;
    const buildingMeshes: THREE.Mesh[] = [];

    for (let i = -gridSize; i <= gridSize; i++) {
      for (let j = -gridSize; j <= gridSize; j++) {
        // Leave avenues/streets for traffic
        if (i % 2 === 0 || j % 2 === 0) continue;
        // Central plaza clearance for Admin HQ & Hotspots
        if (Math.abs(i) < 2 && Math.abs(j) < 2) continue;

        const dist = Math.sqrt(i * i + j * j);
        const heightCalc = Math.max(3.5, (13 - dist) * 2.5 + Math.sin(i * 2 + j * 3) * 4);
        const bHeight = THREE.MathUtils.clamp(heightCalc, 3, 28);
        const bWidth = 3.6;

        const bGeo = new THREE.BoxGeometry(bWidth, bHeight, bWidth);
        const matIndex = Math.floor(Math.random() * buildingMaterials.length);
        const mat = buildingMaterials[matIndex];
        const bMesh = new THREE.Mesh(bGeo, mat);
        bMesh.position.set(i * spacing * 0.72, bHeight / 2, j * spacing * 0.72);
        bMesh.castShadow = true;
        bMesh.receiveShadow = true;

        // Glowing Wireframe Edges in Green and Pink
        const edgeColor = edgeLineColors[(Math.abs(i + j)) % edgeLineColors.length];
        const edgeMat = new THREE.LineBasicMaterial({ 
          color: edgeColor, 
          transparent: true, 
          opacity: 0.85 
        });
        const edges = new THREE.EdgesGeometry(bGeo);
        const line = new THREE.LineSegments(edges, edgeMat);
        bMesh.add(line);

        cityGroup.add(bMesh);
        buildingMeshes.push(bMesh);
      }
    }

    // Dynamic Traffic & Emergency Vehicle Tracers (Neon Green and Hot Pink on Black roads)
    const tracerGroup = new THREE.Group();
    scene.add(tracerGroup);

    interface VehicleTracer {
      mesh: THREE.Mesh;
      axis: 'x' | 'z';
      speed: number;
      lane: number;
      limit: number;
      light?: THREE.PointLight;
    }

    const tracers: VehicleTracer[] = [];
    const tracerGeo = new THREE.BoxGeometry(0.8, 0.4, 2.1);

    const vehicleColorPalette = [
      { hex: 0x10b981, name: 'green-fleet' }, // Cyber Green
      { hex: 0xf43f5e, name: 'pink-fleet' },  // Neon Rose Pink
      { hex: 0x34d399, name: 'mint-fleet' },  // Mint Green
      { hex: 0xec4899, name: 'hotpink-fleet' } // Hot Pink
    ];

    for (let t = 0; t < 28; t++) {
      const isX = t % 2 === 0;
      const type = vehicleColorPalette[t % vehicleColorPalette.length];
      const mat = new THREE.MeshBasicMaterial({ color: type.hex });
      const vMesh = new THREE.Mesh(tracerGeo, mat);
      vMesh.position.y = 0.28;

      const lane = (Math.floor(Math.random() * 7) - 3) * 8.2;
      if (isX) {
        vMesh.position.z = lane;
        vMesh.position.x = (Math.random() - 0.5) * 88;
        vMesh.rotation.y = Math.PI / 2;
      } else {
        vMesh.position.x = lane;
        vMesh.position.z = (Math.random() - 0.5) * 88;
      }

      // Flashing top beacon
      let vLight: THREE.PointLight | undefined;
      if (t % 2 === 0) {
        vLight = new THREE.PointLight(type.hex, 2.8, 12);
        vLight.position.set(0, 0.7, 0);
        vMesh.add(vLight);
      }

      tracerGroup.add(vMesh);
      tracers.push({
        mesh: vMesh,
        axis: isX ? 'x' : 'z',
        speed: (Math.random() * 0.22 + 0.14) * (Math.random() > 0.5 ? 1 : -1),
        lane,
        limit: 48,
        light: vLight
      });
    }

    // 3D Department Hotspots & Beacon Spires
    const hotspotGroup = new THREE.Group();
    scene.add(hotspotGroup);

    const hotspotObjects: {
      hotspot: DepartmentHotspot;
      pillar: THREE.Mesh;
      ring: THREE.Mesh;
      light: THREE.PointLight;
      beam: THREE.Mesh;
      cone: THREE.Mesh;
    }[] = [];

    DEPARTMENT_HOTSPOTS.forEach((spot) => {
      // 3D Tower Base
      const towerGeo = new THREE.CylinderGeometry(1.4, 1.9, spot.height, 8);
      const towerMat = new THREE.MeshStandardMaterial({
        color: spot.hex,
        roughness: 0.15,
        metalness: 0.85,
        emissive: spot.hex,
        emissiveIntensity: 0.45
      });
      const tower = new THREE.Mesh(towerGeo, towerMat);
      tower.position.set(spot.x, spot.height / 2, spot.z);
      tower.castShadow = true;
      hotspotGroup.add(tower);

      // Top Floating Inverted Beacon Cone
      const coneGeo = new THREE.ConeGeometry(1.6, 3.4, 8);
      const coneMat = new THREE.MeshStandardMaterial({
        color: spot.hex,
        roughness: 0.1,
        metalness: 0.9,
        emissive: spot.hex,
        emissiveIntensity: 1.1
      });
      const cone = new THREE.Mesh(coneGeo, coneMat);
      cone.rotation.x = Math.PI;
      cone.position.set(spot.x, spot.height + 3.8, spot.z);
      hotspotGroup.add(cone);

      // Skyward Laser Uplink Beam
      const beamGeo = new THREE.CylinderGeometry(0.14, 0.14, 50, 8);
      const beamMat = new THREE.MeshBasicMaterial({
        color: spot.hex,
        transparent: true,
        opacity: 0.85
      });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.set(spot.x, spot.height + 25, spot.z);
      hotspotGroup.add(beam);

      // Pulsing Ground Ring
      const ringGeo = new THREE.RingGeometry(1.2, 4.2, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: spot.hex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(spot.x, 0.16, spot.z);
      hotspotGroup.add(ring);

      // Point Light
      const pLight = new THREE.PointLight(spot.hex, 3.8, 26);
      pLight.position.set(spot.x, spot.height + 4.2, spot.z);
      hotspotGroup.add(pLight);

      hotspotObjects.push({
        hotspot: spot,
        pillar: tower,
        ring,
        light: pLight,
        beam,
        cone
      });
    });

    // Central Radar Sweeper Rings (Neon Pink, Emerald Green, Mint Green)
    const radarGroup = new THREE.Group();
    scene.add(radarGroup);

    // Pink Outer Radar
    const radarGeo1 = new THREE.RingGeometry(6, 48, 64);
    const radarMat1 = new THREE.MeshBasicMaterial({
      color: 0xf43f5e,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.55,
      wireframe: true
    });
    const radar1 = new THREE.Mesh(radarGeo1, radarMat1);
    radar1.rotation.x = -Math.PI / 2;
    radar1.position.y = 0.22;
    radarGroup.add(radar1);

    // Neon Green Middle Radar
    const radarGeo2 = new THREE.RingGeometry(12, 34, 48);
    const radarMat2 = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45
    });
    const radar2 = new THREE.Mesh(radarGeo2, radarMat2);
    radar2.rotation.x = -Math.PI / 2;
    radar2.position.y = 0.24;
    radarGroup.add(radar2);

    // Hot Pink Inner Pulse Radar
    const radarGeo3 = new THREE.RingGeometry(2, 18, 36);
    const radarMat3 = new THREE.MeshBasicMaterial({
      color: 0xec4899,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6
    });
    const radar3 = new THREE.Mesh(radarGeo3, radarMat3);
    radar3.rotation.x = -Math.PI / 2;
    radar3.position.y = 0.26;
    radarGroup.add(radar3);

    // Swirling Floating Data Node Particle Starfield (Neon Pink & Cyber Green)
    const particleCount = 480;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    const colorPaletteRGB = [
      new THREE.Color(0x10b981), // Emerald Green
      new THREE.Color(0xf43f5e), // Neon Rose Pink
      new THREE.Color(0x34d399), // Mint Green
      new THREE.Color(0xec4899)  // Electric Hot Pink
    ];

    for (let p = 0; p < particleCount; p++) {
      const p3 = p * 3;
      particlePos[p3] = (Math.random() - 0.5) * 120;
      particlePos[p3 + 1] = Math.random() * 40 + 2;
      particlePos[p3 + 2] = (Math.random() - 0.5) * 120;

      const clr = colorPaletteRGB[p % colorPaletteRGB.length];
      particleColors[p3] = clr.r;
      particleColors[p3 + 1] = clr.g;
      particleColors[p3 + 2] = clr.b;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 1.25,
      vertexColors: true,
      transparent: true,
      opacity: 0.95
    });
    const particleCloud = new THREE.Points(particleGeo, particleMat);
    scene.add(particleCloud);

    // Sonar / Shockwave Pulse Mesh (Hot Pink & Neon Green Waves)
    const pulseRingGeo = new THREE.RingGeometry(0.5, 4.0, 64);
    const pulseRingMat = new THREE.MeshBasicMaterial({
      color: 0xf43f5e,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0
    });
    const pulseWave = new THREE.Mesh(pulseRingGeo, pulseRingMat);
    pulseWave.rotation.x = -Math.PI / 2;
    pulseWave.position.y = 0.32;
    scene.add(pulseWave);

    let pulseScale = 1;
    let isPulsing = false;

    triggerPulseRef.current = () => {
      pulseScale = 1;
      isPulsing = true;
      pulseRingMat.opacity = 1.0;
    };

    // Camera preset transitions
    setCamPresetRef.current = (preset) => {
      setCameraPreset(preset);
      if (preset === 'orbit') {
        targetCamPos.set(48, 38, 54);
        targetLookAt.set(0, 4, 0);
      } else if (preset === 'satellite') {
        targetCamPos.set(0, 80, 4);
        targetLookAt.set(0, 0, 0);
      } else if (preset === 'street') {
        targetCamPos.set(24, 11, 26);
        targetLookAt.set(0, 6, 0);
      } else if (preset === 'tactical') {
        targetCamPos.set(-38, 44, 40);
        targetLookAt.set(0, 8, 0);
      }
    };

    // Highlight specific role from hover
    highlightRoleRef.current = (role) => {
      hotspotObjects.forEach((item) => {
        const isMatch = role === item.hotspot.role;
        if (role) {
          (item.cone.material as THREE.MeshStandardMaterial).emissiveIntensity = isMatch ? 2.8 : 0.2;
          (item.pillar.material as THREE.MeshStandardMaterial).emissiveIntensity = isMatch ? 1.4 : 0.15;
          item.light.intensity = isMatch ? 7.0 : 1.2;
          (item.beam.material as THREE.MeshBasicMaterial).opacity = isMatch ? 1.0 : 0.25;
        } else {
          (item.cone.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.1;
          (item.pillar.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.45;
          item.light.intensity = 3.8;
          (item.beam.material as THREE.MeshBasicMaterial).opacity = 0.85;
        }
      });
    };

    // Mouse Interaction for smooth parallax
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - prevMouseX;
        const deltaY = e.clientY - prevMouseY;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;

        targetCamPos.x += deltaX * 0.25;
        targetCamPos.y = THREE.MathUtils.clamp(targetCamPos.y - deltaY * 0.2, 8, 95);
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    // Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Continuous 3D Scene Rotation
      if (isRotating && !isDragging) {
        cityGroup.rotation.y += 0.002;
        hotspotGroup.rotation.y += 0.002;
        tracerGroup.rotation.y += 0.002;
        radar1.rotation.z -= 0.009;
        radar2.rotation.z += 0.014;
        radar3.rotation.z -= 0.018;
        particleCloud.rotation.y += 0.0014;
      }

      // Moving road traffic racers
      tracers.forEach(t => {
        if (t.axis === 'x') {
          t.mesh.position.x += t.speed;
          if (Math.abs(t.mesh.position.x) > t.limit) {
            t.mesh.position.x = -Math.sign(t.speed) * t.limit;
          }
        } else {
          t.mesh.position.z += t.speed;
          if (Math.abs(t.mesh.position.z) > t.limit) {
            t.mesh.position.z = -Math.sign(t.speed) * t.limit;
          }
        }
      });

      // Pulse wave expansion in Pink/Orange
      if (isPulsing) {
        pulseScale += delta * 40;
        pulseWave.scale.set(pulseScale, pulseScale, 1);
        pulseRingMat.opacity = Math.max(0, 1.0 - pulseScale / 55);
        if (pulseScale > 55) {
          isPulsing = false;
          pulseRingMat.opacity = 0;
        }
      }

      // Hotspots bobbing and ring scaling
      hotspotObjects.forEach((item, idx) => {
        const bob = Math.sin(elapsedTime * 2.8 + idx * 1.3) * 0.7;
        item.cone.position.y = item.hotspot.height + 3.8 + bob;
        item.cone.rotation.y += 0.03;

        const ringScale = 1 + (Math.sin(elapsedTime * 3.4 + idx) + 1) * 0.38;
        item.ring.scale.set(ringScale, ringScale, 1);
        (item.ring.material as THREE.MeshBasicMaterial).opacity = 0.9 - (ringScale - 1) * 0.6;
      });

      // Camera Smooth Interpolation
      camera.position.lerp(targetCamPos, 0.04);
      currentLookAt.lerp(targetLookAt, 0.04);
      camera.lookAt(currentLookAt);

      renderer.render(scene, camera);
    };

    animate();

    // Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newWidth = entry.contentRect.width;
        const newHeight = entry.contentRect.height;
        if (newWidth > 0 && newHeight > 0) {
          camera.aspect = newWidth / newHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(newWidth, newHeight);
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      resizeObserver.disconnect();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [isRotating]);

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      
      {/* 3D WebGL Canvas Layer */}
      <div 
        ref={mountRef} 
        className="w-full h-full absolute inset-0 cursor-grab active:cursor-grabbing z-0"
      />

      {/* Floating 3D Control HUD Bar (Top Right) */}
      <div className="absolute top-4 right-4 z-20 flex items-center space-x-2 bg-black/90 backdrop-blur-2xl border border-pink-500/40 p-1.5 rounded-2xl shadow-2xl text-white shadow-pink-950/40">
        
        {/* Orbit Auto-Rotation Toggle */}
        <button
          onClick={() => setIsRotating(!isRotating)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
            isRotating ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/60 shadow-sm shadow-emerald-500/20' : 'text-zinc-400 hover:text-white'
          }`}
          title="Toggle Auto Rotation"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin text-emerald-400' : ''}`} />
          <span className="hidden sm:inline">3D Orbit</span>
        </button>

        {/* 3D Sonar Pulse Wave Trigger */}
        <button
          onClick={() => triggerPulseRef.current()}
          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-pink-600 via-rose-500 to-emerald-500 hover:from-pink-500 hover:to-emerald-400 text-white text-xs font-black transition flex items-center space-x-1.5 shadow-lg shadow-pink-600/40 cursor-pointer"
          title="Trigger Sonar Radar Pulse"
        >
          <Zap className="w-3.5 h-3.5 text-emerald-200" />
          <span className="hidden sm:inline">Pulse Wave</span>
        </button>

        {/* Camera Angles Preset Menu */}
        <div className="hidden md:flex items-center space-x-1 pl-1.5 border-l border-zinc-800">
          {(['orbit', 'satellite', 'street', 'tactical'] as const).map((cam) => (
            <button
              key={cam}
              onClick={() => setCamPresetRef.current(cam)}
              className={`px-2.5 py-1 rounded-xl text-[10px] font-mono uppercase font-black transition cursor-pointer ${
                cameraPreset === cam 
                  ? 'bg-gradient-to-r from-pink-500 to-emerald-500 text-black shadow-md font-extrabold' 
                  : 'text-zinc-400 hover:text-pink-300 hover:bg-pink-950/30'
              }`}
            >
              {cam}
            </button>
          ))}
        </div>

      </div>

      {/* Floating 3D Telemetry Indicator (Bottom Left) */}
      <div className="absolute bottom-4 left-4 z-20 hidden sm:flex items-center space-x-2.5 bg-black/90 backdrop-blur-2xl border border-emerald-500/40 px-3.5 py-1.5 rounded-xl text-emerald-300 text-xs font-mono shadow-2xl">
        <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-ping"></span>
        <span className="text-zinc-300 font-bold">3D Cyber Incident Matrix</span>
        <span className="text-zinc-700">|</span>
        <span className="text-pink-400 font-semibold">Neon Pink</span>
        <span className="text-zinc-600">•</span>
        <span className="text-emerald-400 font-semibold">Cyber Green</span>
        <span className="text-zinc-600">•</span>
        <span className="text-zinc-400 font-medium">Obsidian Black</span>
      </div>

    </div>
  );
};
