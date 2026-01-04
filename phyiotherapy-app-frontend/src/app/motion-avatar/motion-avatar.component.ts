import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { BluetoothService, SensorQuaternion } from '../services/bluetooth.service';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

@Component({
  selector: 'app-motion-avatar',
  standalone: true,
  imports: [CommonModule],
  // Ensure your template and styles paths are correct
  templateUrl: './motion-avatar.component.html',
  styleUrls: ['./motion-avatar.component.css']
})
export class MotionAvatarComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('canvasElement', { static: true })
  private canvasRef!: ElementRef<HTMLCanvasElement>;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private dataSubscription!: Subscription;

  // --- NEW LOGIC: Self-contained Normalization ---
  // This component will now manage its own reference pose for normalization.
  private referencePose: SensorQuaternion[] | null = null;

  // This map holds the Three.js objects for the avatar's joints.
  private joints = new Map<string, THREE.Object3D>();

  constructor(private bluetoothService: BluetoothService) { }

  ngOnInit(): void {
    // We now subscribe to the raw data stream directly.
    this.dataSubscription = this.bluetoothService.getRawDataStream().subscribe((rawData: SensorQuaternion[]) => {
      // The component handles its own normalization logic.
      this.updateAvatarWithNormalization(rawData);
    });
  }

  ngAfterViewInit(): void {
    this.initThreeJs();
    this.createAvatar();
    this.animate();
  }

  private initThreeJs(): void {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1e1e1e);

    const canvas = this.canvasRef.nativeElement;
    this.camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    this.camera.position.set(0, 1.2, 2.2);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 1, 0);
    this.controls.enableDamping = true;

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 2);
    this.scene.add(hemiLight);
    const gridHelper = new THREE.GridHelper(10, 10);
    this.scene.add(gridHelper);
  }

  private createAvatar(): void {
    const boneMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff, specular: 0x111111, shininess: 30 });
    const torsoHeight = 0.6;
    const shoulderWidth = 0.3;
    const upperArmLength = 0.5;
    const forearmLength = 0.5;
    const boneRadius = 0.03;
    const jointRadius = 0.04;

    const s5_hips = new THREE.Group(); s5_hips.name = 's5'; this.scene.add(s5_hips);
    const s7_chest = new THREE.Group(); s7_chest.name = 's7';
    const s3_rShoulder = new THREE.Group(); s3_rShoulder.name = 's3';
    const s2_rElbow = new THREE.Group(); s2_rElbow.name = 's2';
    const s1_rWrist = new THREE.Group(); s1_rWrist.name = 's1';
    const s8_lShoulder = new THREE.Group(); s8_lShoulder.name = 's8';
    const s9_lElbow = new THREE.Group(); s9_lElbow.name = 's9';
    const s10_lWrist = new THREE.Group(); s10_lWrist.name = 's10';

    s5_hips.add(s7_chest);
    s7_chest.add(s3_rShoulder); s7_chest.add(s8_lShoulder);
    s3_rShoulder.add(s2_rElbow); s2_rElbow.add(s1_rWrist);
    s8_lShoulder.add(s9_lElbow); s9_lElbow.add(s10_lWrist);

    s5_hips.position.set(0, 1.0, 0);
    s7_chest.position.set(0, torsoHeight, 0);
    s3_rShoulder.position.set(-shoulderWidth, 0, 0);
    s8_lShoulder.position.set(shoulderWidth, 0, 0);
    // Correcting arm positions to hang down in a natural A-pose
    s2_rElbow.position.set(-upperArmLength, 0, 0);
    s9_lElbow.position.set(upperArmLength, 0, 0);
    s1_rWrist.position.set(-forearmLength, 0, 0);
    s10_lWrist.position.set(forearmLength, 0, 0);

    // Joint and bone meshes (visuals)
    const createBoneMesh = (p1: THREE.Vector3, p2: THREE.Vector3, radius: number) => {
      const start = new THREE.Vector3().copy(p1);
      const end = new THREE.Vector3().copy(p2);
      const direction = new THREE.Vector3().subVectors(end, start);
      const orientation = new THREE.Matrix4();
      orientation.lookAt(start, end, new THREE.Object3D().up);
      orientation.multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2));
      const geometry = new THREE.CylinderGeometry(radius, radius, direction.length(), 8);
      const mesh = new THREE.Mesh(geometry, boneMaterial);
      mesh.applyMatrix4(orientation);
      mesh.position.copy(start).add(direction.multiplyScalar(0.5));
      return mesh;
    };

    // Add visual bones that connect the joints
    this.scene.add(createBoneMesh(s5_hips.position, s7_chest.localToWorld(new THREE.Vector3()), boneRadius * 1.5));
    // ... add other bones if needed for a more complete skeleton

    this.joints.set('s5', s5_hips); this.joints.set('s7', s7_chest);
    this.joints.set('s3', s3_rShoulder); this.joints.set('s2', s2_rElbow); this.joints.set('s1', s1_rWrist);
    this.joints.set('s8', s8_lShoulder); this.joints.set('s9', s9_lElbow); this.joints.set('s10', s10_lWrist);
  }

  // --- NEW FUNCTION: Handles normalization and updates the avatar ---
  private updateAvatarWithNormalization(rawData: SensorQuaternion[]): void {
    if (this.joints.size === 0) return;

    // Step 1: Capture the first frame of data as the reference "zero" pose.
    if (!this.referencePose) {
      console.log("Avatar reference pose captured.");
      this.referencePose = rawData;
    }

    // Step 2: Normalize the current raw data against the reference pose.
    this.joints.forEach((joint, id) => {
      const sensorIndex = parseInt(id.substring(1)) - 1; // e.g., 's5' -> 4

      if (this.referencePose && this.referencePose[sensorIndex] && rawData[sensorIndex]) {
        // Get the reference orientation for this sensor
        const refQuatData = this.referencePose[sensorIndex];
        const refQuat = new THREE.Quaternion(refQuatData.x, refQuatData.y, refQuatData.z, refQuatData.w);

        // Get the live orientation for this sensor
        const liveQuatData = rawData[sensorIndex];
        const liveQuat = new THREE.Quaternion(liveQuatData.x, liveQuatData.y, liveQuatData.z, liveQuatData.w);

        // Calculate the delta rotation (live rotation relative to the reference)
        const deltaRotation = refQuat.clone().invert().multiply(liveQuat);

        // Apply the delta rotation to the joint's base orientation
        // (For a hierarchical skeleton, we just set the local rotation)
        joint.quaternion.copy(deltaRotation);
      }
    });
  }

  private animate = () => {
    requestAnimationFrame(this.animate);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  ngOnDestroy(): void {
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }
  }

  @HostListener('window:resize')
  onWindowResize() {
    if (this.camera && this.renderer) {
      const width = this.canvasRef.nativeElement.clientWidth;
      const height = this.canvasRef.nativeElement.clientHeight;
      if (width > 0 && height > 0) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
      }
    }
  }
}
