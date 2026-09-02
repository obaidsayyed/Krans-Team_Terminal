import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { 
  ShieldAlert, 
  Flame, 
  HeartPulse, 
  Car, 
  Building2, 
  Sparkles, 
  Layers, 
  RotateCw, 
  Radio, 
  Activity,
  Zap,
  Navigation
} from 'lucide-react';

interface IncidentBeacon {
  id: string;
  dept: string;
  name: string;
  category: string;
  color: string;
  hex: number;
  x: number;
  z: number;
  status: string;
  units: string;
}

const BEACONS: IncidentBeacon[] = [
  { id: 'b-1', dept: 'Police', name: 'Zone-1 PCR Patrol 14', category: 'High Priority Sector', color: 'text-amber-500', hex: 0xd97706, x: -14, z: -10, status: 'Active Patrol', units: '3 PCR Vans' },
  { id: 'b-2', dept: 'Hospital', name: 'Apex Trauma Response 08', category: 'Cardiac & EMS Grid', color: 'text-emerald-400', hex: 0x10b981, x: 16, z: -14, status: 'Rapid Dispatch', units: '2 ALS Ambulances' },
  { id: 'b-3', dept: 'Fire', name: 'Rescue Command Tender 03', category: 'Hazard Mitigation', color: 'text-orange-500', hex: 0xea580c, x: 12, z: 15, status: 'Standby Ready', units: '4 Water Tenders' },
  { id: 'b-4', dept: 'RTO', name: 'Expressway Patrol Desk 07', category: 'Traffic Flow Control', color: 'text-amber-400', hex: 0xf59e0b, x: -16, z: 12, status: 'Realtime Radar', units: '6 Interceptors' },
  { id: 'b-5', dept: 'Municipal', name: 'Zonal Engineering Team', category: 'Infrastructure Sync', color: 'text-lime-400', hex: 0x84cc16, x: 0, z: 0, status: 'Telemetry Normal', units: '12 Field Units' }
];

export const Interactive3DCityGrid: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [activeBeacon, setActiveBeacon] = useState<IncidentBeacon>(BEACONS[0]);
  const [isRotating, setIsRotating] = useState(true);
  const [pulseCount, setPulseCount] = useState(0);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 560;
    const height = container.clientHeight || 460;

    // Scene with Forest Moss & Amber Ambient Theme
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x12231b); // Deep Forest Moss
    scene.fog = new THREE.FogExp2(0x12231b, 0.012);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
    camera.position.set(38, 32, 44);
    camera.lookAt(0, 2, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Lighting (Warm Amber & Emerald)
    const ambientLight = new THREE.AmbientLight(0x2d4e3e, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xf59e0b, 1.4);
    dirLight.position.set(40, 60, 30);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const subLight = new THREE.DirectionalLight(0x10b981, 0.8);
    subLight.position.set(-30, 40, -30);
    scene.add(subLight);

    const centralGlow = new THREE.PointLight(0x3b82f6, 2, 80);
    centralGlow.position.set(0, 15, 0);
    scene.add(centralGlow);

    // Base Grid Floor in Blue/Slate
    const gridHelper = new THREE.GridHelper(70, 35, 0x3b82f6, 0xbfdbfe);
    gridHelper.position.y = -0.05;
    scene.add(gridHelper);

    // Ground Plane with subtle reflection
    const groundGeo = new THREE.PlaneGeometry(90, 90);
    const groundMat = new THREE.MeshStandardMaterial({ 
      color: 0xf8fafc, 
      roughness: 0.8, 
      metalness: 0.15 
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    ground.receiveShadow = true;
    scene.add(ground);

    // City Buildings Group
    const cityGroup = new THREE.Group();
    scene.add(cityGroup);

    const buildingMaterials = [
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, metalness: 0.2 }),
      new THREE.MeshStandardMaterial({ color: 0xdbeafe, roughness: 0.3, metalness: 0.3 }),
      new THREE.MeshStandardMaterial({ color: 0xbfdbfe, roughness: 0.25, metalness: 0.4 }),
      new THREE.MeshStandardMaterial({ color: 0x93c5fd, roughness: 0.2, metalness: 0.5 }),
      new THREE.MeshStandardMaterial({ color: 0x60a5fa, roughness: 0.2, metalness: 0.6 })
    ];

    // Procedural 3D City Layout
    const gridSize = 7;
    const spacing = 5.5;
    for (let i = -gridSize; i <= gridSize; i++) {
      for (let j = -gridSize; j <= gridSize; j++) {
        if (i % 2 === 0 || j % 2 === 0) continue;
        if (Math.abs(i) < 2 && Math.abs(j) < 2) continue;

        const distFromCenter = Math.sqrt(i * i + j * j);
        const heightFactor = Math.max(2.5, (10 - distFromCenter) * 2 + Math.sin(i * 3 + j * 2) * 3);
        const bHeight = THREE.MathUtils.clamp(heightFactor, 3, 20);

        const bGeo = new THREE.BoxGeometry(3.6, bHeight, 3.6);
        const mat = buildingMaterials[Math.floor(Math.random() * buildingMaterials.length)];
        const building = new THREE.Mesh(bGeo, mat);

        building.position.set(i * spacing * 0.7, bHeight / 2, j * spacing * 0.7);
        building.castShadow = true;
        building.receiveShadow = true;

        // Rooftop glowing blue border
        const edgeGeo = new THREE.EdgesGeometry(bGeo);
        const edgeMat = new THREE.LineBasicMaterial({ color: 0x2563eb, transparent: true, opacity: 0.45 });
        const edgeLine = new THREE.LineSegments(edgeGeo, edgeMat);
        building.add(edgeLine);

        cityGroup.add(building);
      }
    }

    // Moving Traffic / Patrol Tracers on Roads
    const tracerGroup = new THREE.Group();
    scene.add(tracerGroup);

    const tracers: { mesh: THREE.Mesh; axis: 'x' | 'z'; speed: number; lane: number; limit: number }[] = [];
    const tracerGeo = new THREE.BoxGeometry(0.8, 0.4, 1.8);
    const tracerMatBlue = new THREE.MeshBasicMaterial({ color: 0x2563eb });
    const tracerMatAmber = new THREE.MeshBasicMaterial({ color: 0x0284c7 });

    for (let t = 0; t < 12; t++) {
      const isX = t % 2 === 0;
      const mesh = new THREE.Mesh(tracerGeo, t % 3 === 0 ? tracerMatBlue : tracerMatAmber);
      mesh.position.y = 0.25;
      const lane = (Math.floor(Math.random() * 5) - 2) * 7.7;
      if (isX) {
        mesh.position.z = lane;
        mesh.position.x = (Math.random() - 0.5) * 60;
        mesh.rotation.y = Math.PI / 2;
      } else {
        mesh.position.x = lane;
        mesh.position.z = (Math.random() - 0.5) * 60;
      }
      tracerGroup.add(mesh);
      tracers.push({
        mesh,
        axis: isX ? 'x' : 'z',
        speed: (Math.random() * 0.15 + 0.1) * (Math.random() > 0.5 ? 1 : -1),
        lane,
        limit: 32
      });
    }

    // Interactive 3D Beacon Pins Group
    const beaconGroup = new THREE.Group();
    scene.add(beaconGroup);

    const beaconMeshes: { mesh: THREE.Mesh; beacon: IncidentBeacon; ring: THREE.Mesh; light: THREE.PointLight }[] = [];

    BEACONS.forEach((b) => {
      // 3D Hex Pillar Beacon
      const coneGeo = new THREE.ConeGeometry(1.2, 3.5, 6);
      const coneMat = new THREE.MeshStandardMaterial({ 
        color: b.hex, 
        roughness: 0.2, 
        metalness: 0.6,
        emissive: b.hex,
        emissiveIntensity: 0.5
      });
      const cone = new THREE.Mesh(coneGeo, coneMat);
      cone.rotation.x = Math.PI;
      cone.position.set(b.x, 8.5, b.z);
      cone.castShadow = true;

      // Pulsing Wave Ring on ground
      const ringGeo = new THREE.RingGeometry(0.8, 2.6, 32);
      const ringMat = new THREE.MeshBasicMaterial({ 
        color: b.hex, 
        side: THREE.DoubleSide, 
        transparent: true, 
        opacity: 0.8 
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(b.x, 0.12, b.z);

      // Light glow
      const bLight = new THREE.PointLight(b.hex, 2.5, 18);
      bLight.position.set(b.x, 5, b.z);

      // Laser Beam connecting down to ground
      const beamGeo = new THREE.CylinderGeometry(0.09, 0.09, 8.5, 8);
      const beamMat = new THREE.MeshBasicMaterial({ color: b.hex, transparent: true, opacity: 0.65 });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.set(b.x, 4.25, b.z);

      beaconGroup.add(cone);
      beaconGroup.add(ring);
      beaconGroup.add(bLight);
      beaconGroup.add(beam);

      beaconMeshes.push({ mesh: cone, beacon: b, ring, light: bLight });
    });

    // Central Radar Sweep Ring
    const radarGeo = new THREE.RingGeometry(2, 30, 48);
    const radarMat = new THREE.MeshBasicMaterial({
      color: 0x2563eb,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.2,
      wireframe: true
    });
    const radarRing = new THREE.Mesh(radarGeo, radarMat);
    radarRing.rotation.x = -Math.PI / 2;
    radarRing.position.y = 0.2;
    scene.add(radarRing);

    // Holographic Laser Lines linking beacons to central command
    const laserMat = new THREE.LineDashedMaterial({
      color: 0x3b82f6,
      dashSize: 1,
      gapSize: 0.5,
      transparent: true,
      opacity: 0.4
    });
    BEACONS.forEach((b) => {
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 10, 0),
        new THREE.Vector3(b.x, 8.5, b.z)
      ]);
      const line = new THREE.Line(lineGeo, laserMat);
      line.computeLineDistances();
      scene.add(line);
    });

    // Particle Cloud of Data Nodes (Gleaming Blue & White)
    const particleCount = 180;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let p = 0; p < particleCount * 3; p += 3) {
      positions[p] = (Math.random() - 0.5) * 60;
      positions[p + 1] = Math.random() * 24 + 2;
      positions[p + 2] = (Math.random() - 0.5) * 60;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x2563eb,
      size: 0.85,
      transparent: true,
      opacity: 0.75
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Mouse Interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouseX = x;
      mouseY = y;
      targetRotationY = x * 0.45;
      targetRotationX = y * 0.25;
    };

    container.addEventListener('mousemove', handleMouseMove);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Scene smooth rotation
      if (isRotating) {
        cityGroup.rotation.y += 0.003;
        beaconGroup.rotation.y += 0.003;
        tracerGroup.rotation.y += 0.003;
        radarRing.rotation.z -= 0.012;
        particles.rotation.y += 0.0015;
      }

      // Moving road traffic
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

      // Smooth mouse tilt
      camera.position.x += (Math.sin(targetRotationY) * 44 + 38 - camera.position.x) * 0.05;
      camera.position.y += (targetRotationX * 12 + 32 - camera.position.y) * 0.05;
      camera.lookAt(0, 3, 0);

      // Pulse beacon rings & bobbing
      beaconMeshes.forEach((item, index) => {
        const bob = Math.sin(elapsedTime * 2.8 + index) * 0.9;
        item.mesh.position.y = 8.5 + bob;
        item.mesh.rotation.y += 0.03;

        const scale = 1 + (Math.sin(elapsedTime * 3.5 + index) + 1) * 0.45;
        item.ring.scale.set(scale, scale, 1);
        (item.ring.material as THREE.MeshBasicMaterial).opacity = 0.85 - (scale - 1) * 0.6;
      });

      renderer.render(scene, camera);
    };

    animate();

    // Resize Observer for dynamic dimensions
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
      resizeObserver.disconnect();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [isRotating, pulseCount]);

  const handleTriggerPulse = () => {
    setPulseCount(prev => prev + 1);
  };

  return (
    <div className="relative w-full bg-white rounded-3xl border border-blue-200/90 shadow-2xl shadow-blue-500/10 overflow-hidden">
      
      {/* 3D Canvas Header Controls */}
      <div className="absolute top-0 inset-x-0 z-10 px-4 sm:px-6 py-3.5 bg-white/90 backdrop-blur-md border-b border-blue-100 flex items-center justify-between">
        
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping"></span>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-950 font-['Outfit'] flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-blue-600" />
            Live 3D Incident Grid
          </span>
          <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-mono text-[10px] font-bold border border-blue-200">
            WebGL 60 FPS • Realtime
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setIsRotating(!isRotating)}
            className={`p-1.5 rounded-xl border text-xs font-semibold transition flex items-center space-x-1 cursor-pointer ${
              isRotating ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-xs' : 'bg-white border-slate-200 text-slate-600'
            }`}
            title="Toggle Auto-Rotation"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin text-blue-600' : ''}`} />
            <span className="text-[11px] hidden md:inline">Orbit</span>
          </button>

          <button
            onClick={handleTriggerPulse}
            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold transition flex items-center space-x-1 shadow-md shadow-blue-600/20 cursor-pointer"
          >
            <Zap className="w-3 h-3 text-blue-200" />
            <span>3D Pulse</span>
          </button>
        </div>

      </div>

      {/* 3D WebGL Canvas Viewport */}
      <div 
        ref={mountRef} 
        className="w-full h-[360px] sm:h-[430px] cursor-grab active:cursor-grabbing relative"
      />

      {/* Bottom Live Department Beacons Telemetry Bar */}
      <div className="p-3.5 sm:p-4 bg-gradient-to-r from-blue-50 via-white to-blue-50/80 border-t border-blue-100 flex flex-wrap items-center justify-between gap-2.5">
        
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 block">
              {activeBeacon.dept}: {activeBeacon.name}
            </span>
            <span className="text-[10px] text-blue-700 font-semibold">
              Status: {activeBeacon.status} • {activeBeacon.units}
            </span>
          </div>
        </div>

        {/* Quick Beacon Selectors */}
        <div className="flex items-center space-x-1.5 overflow-x-auto py-0.5">
          {BEACONS.map((b) => {
            const isSelected = activeBeacon.id === b.id;
            return (
              <button
                key={b.id}
                onClick={() => setActiveBeacon(b)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-blue-50 hover:text-blue-700'
                }`}
              >
                {b.dept}
              </button>
            );
          })}
        </div>

      </div>

    </div>
  );
};
