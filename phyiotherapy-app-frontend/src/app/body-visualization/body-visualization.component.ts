import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as THREE from 'three';
import { Subscription } from 'rxjs';
import { BluetoothService, SensorQuaternion } from '../services/bluetooth.service';

@Component({
  selector: 'app-body-visualization',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './body-visualization.component.html',
  styleUrls: ['./body-visualization.component.css']
})
export class BodyVisualizationComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('rendererCanvas', { static: true })
  private rendererCanvas!: ElementRef<HTMLCanvasElement>;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private dataSubscription!: Subscription;

  // --- NEW: Self-contained Normalization Logic ---
  private referencePose: SensorQuaternion[] | null = null;

  private bodyParts = new Map<string, THREE.Object3D>();
  private initialBoneOrientations = new Map<string, THREE.Quaternion>();

  constructor(private bluetoothService: BluetoothService) { }

  ngOnInit(): void {
    // CORRECTED: Subscribe to the raw data stream.
    this.dataSubscription = this.bluetoothService.getRawDataStream().subscribe((rawData: SensorQuaternion[]) => {
      // The component now handles its own normalization.
      this.normalizeAndAnimate(rawData);
    });
  }

  ngAfterViewInit(): void {
    this.createScene();
    this.createBody();
    this.startRenderingLoop();
  }

  // --- NEW: Function to handle normalization and update the avatar ---
  private normalizeAndAnimate(rawData: SensorQuaternion[]): void {
    // Step 1: Capture the first frame of data as the reference "zero" pose.
    if (!this.referencePose) {
      console.log("BodyVisualization reference pose captured.");
      this.referencePose = rawData;
      return; // Skip updating on the very first frame
    }

    // Step 2: Calculate the delta rotation for each sensor relative to the reference pose.
    const calibratedData: { [key: string]: THREE.Quaternion } = {};
    rawData.forEach((liveQuatData, index) => {
      if (this.referencePose && this.referencePose[index]) {
        const refQuatData = this.referencePose[index];
        const refQuat = new THREE.Quaternion(refQuatData.x, refQuatData.y, refQuatData.z, refQuatData.w);
        const liveQuat = new THREE.Quaternion(liveQuatData.x, liveQuatData.y, liveQuatData.z, liveQuatData.w);

        calibratedData[`s${index + 1}`] = refQuat.clone().invert().multiply(liveQuat);
      }
    });

    // Step 3: Apply the calculated delta rotations to the 3D model's initial pose.
    for (const sensorId in calibratedData) {
      const bonePivot = this.bodyParts.get(sensorId);
      const deltaRotation = calibratedData[sensorId];
      if (bonePivot && deltaRotation) {
        this.updateBoneRotation(bonePivot, deltaRotation);
      }
    }
  }

  private createBody(): void {
    const material = new THREE.MeshPhongMaterial({ color: 0xFAFAFA, specular: 0x111111, shininess: 30 });
    const jointRadius = 0.08;
    const bodyHeight = 1.8;

    const p_hips = new THREE.Vector3(0, bodyHeight * 0.4, 0); // s4
    const p_waist = new THREE.Vector3(0, bodyHeight * 0.55, 0); // s5
    const p_back = new THREE.Vector3(0, bodyHeight * 0.7, 0); // s6
    const p_chest = new THREE.Vector3(0, bodyHeight * 0.85, 0); // s7
    const p_neck = new THREE.Vector3(0, bodyHeight * 0.95, 0);
    const p_head = new THREE.Vector3(0, bodyHeight * 1.1, 0);

    const armLength = 0.7;
    const p_r_shoulder = new THREE.Vector3(-0.3, bodyHeight * 0.85, 0); // s3
    const p_r_elbow = new THREE.Vector3(p_r_shoulder.x - armLength / 2, bodyHeight * 0.85, 0); // s2
    const p_r_wrist = new THREE.Vector3(p_r_shoulder.x - armLength, bodyHeight * 0.85, 0); // s1

    const p_l_shoulder = new THREE.Vector3(0.3, bodyHeight * 0.85, 0); // s8
    const p_l_elbow = new THREE.Vector3(p_l_shoulder.x + armLength / 2, bodyHeight * 0.85, 0); // s9
    const p_l_wrist = new THREE.Vector3(p_l_shoulder.x + armLength, bodyHeight * 0.85, 0); // s10

    const s4_hips = new THREE.Group(); s4_hips.position.copy(p_hips); s4_hips.name = 's4';
    const s5_waist = new THREE.Group(); s5_waist.position.copy(p_waist.clone().sub(p_hips)); s5_waist.name = 's5';
    const s6_back = new THREE.Group(); s6_back.position.copy(p_back.clone().sub(p_waist)); s6_back.name = 's6';
    const s7_chest = new THREE.Group(); s7_chest.position.copy(p_chest.clone().sub(p_back)); s7_chest.name = 's7';

    const s3_r_shoulder = new THREE.Group(); s3_r_shoulder.position.copy(p_r_shoulder.clone().sub(p_chest)); s3_r_shoulder.name = 's3';
    const s2_r_elbow = new THREE.Group(); s2_r_elbow.position.copy(p_r_elbow.clone().sub(p_r_shoulder)); s2_r_elbow.name = 's2';
    const s1_r_wrist = new THREE.Group(); s1_r_wrist.position.copy(p_r_wrist.clone().sub(p_r_elbow)); s1_r_wrist.name = 's1';

    const s8_l_shoulder = new THREE.Group(); s8_l_shoulder.position.copy(p_l_shoulder.clone().sub(p_chest)); s8_l_shoulder.name = 's8';
    const s9_l_elbow = new THREE.Group(); s9_l_elbow.position.copy(p_l_elbow.clone().sub(p_l_shoulder)); s9_l_elbow.name = 's9';
    const s10_l_wrist = new THREE.Group(); s10_l_wrist.position.copy(p_l_wrist.clone().sub(p_l_elbow)); s10_l_wrist.name = 's10';

    s4_hips.add(s5_waist); s5_waist.add(s6_back); s6_back.add(s7_chest);
    s7_chest.add(s3_r_shoulder); s7_chest.add(s8_l_shoulder);
    s3_r_shoulder.add(s2_r_elbow); s2_r_elbow.add(s1_r_wrist);
    s8_l_shoulder.add(s9_l_elbow); s9_l_elbow.add(s10_l_wrist);

    const createBone = (p1: THREE.Vector3, p2: THREE.Vector3, radius: number) => {
        const direction = new THREE.Vector3().subVectors(p2, p1);
        const orientation = new THREE.Matrix4();
        orientation.lookAt(p1, p2, new THREE.Object3D().up);
        orientation.multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2));
        const geometry = new THREE.CylinderGeometry(radius, radius, direction.length(), 8);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.applyMatrix4(orientation);
        mesh.position.copy(p1).add(direction.multiplyScalar(0.5));
        return mesh;
    };

    s4_hips.add(createBone(p_hips, p_waist, 0.08));
    s5_waist.add(createBone(p_waist, p_back, 0.08));
    s6_back.add(createBone(p_back, p_chest, 0.08));
    s7_chest.add(createBone(p_chest, p_neck, 0.08));
    s7_chest.add(createBone(p_chest, p_r_shoulder, 0.07));
    s7_chest.add(createBone(p_chest, p_l_shoulder, 0.07));
    s3_r_shoulder.add(createBone(p_r_shoulder, p_r_elbow, 0.06));
    s2_r_elbow.add(createBone(p_r_elbow, p_r_wrist, 0.06));
    s8_l_shoulder.add(createBone(p_l_shoulder, p_l_elbow, 0.06));
    s9_l_elbow.add(createBone(p_l_elbow, p_l_wrist, 0.06));

    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(jointRadius * 2, 16, 8), material);
    headMesh.position.copy(p_head);
    s7_chest.add(headMesh);

    this.bodyParts.set('s1', s1_r_wrist); this.bodyParts.set('s2', s2_r_elbow); this.bodyParts.set('s3', s3_r_shoulder);
    this.bodyParts.set('s4', s4_hips); this.bodyParts.set('s5', s5_waist); this.bodyParts.set('s6', s6_back);
    this.bodyParts.set('s7', s7_chest); this.bodyParts.set('s8', s8_l_shoulder); this.bodyParts.set('s9', s9_l_elbow);
    this.bodyParts.set('s10', s10_l_wrist);

    this.bodyParts.forEach((bone, sensorId) => {
        this.initialBoneOrientations.set(sensorId, bone.quaternion.clone());
    });

    this.scene.add(s4_hips);
  }

  private updateBoneRotation(bonePivot: THREE.Object3D, deltaRotation: THREE.Quaternion): void {
    const initialOrientation = this.initialBoneOrientations.get(bonePivot.name);
    if (initialOrientation) {
      bonePivot.quaternion.copy(initialOrientation).multiply(deltaRotation);
    }
  }

  private createScene(): void {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x282c34);
    const canvas = this.rendererCanvas.nativeElement;
    const aspectRatio = canvas.clientWidth > 0 ? canvas.clientWidth / canvas.clientHeight : 1;
    this.camera = new THREE.PerspectiveCamera(50, aspectRatio, 0.1, 1000);
    this.camera.position.set(0, 1.5, 4);
    this.camera.lookAt(0, 1.2, 0);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 2);
    hemiLight.position.set(0, 20, 0);
    this.scene.add(hemiLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 3);
    dirLight.position.set(3, 10, 7);
    this.scene.add(dirLight);

    const gridHelper = new THREE.GridHelper(10, 10, 0x888888, 0x444444);
    this.scene.add(gridHelper);
  }

  private startRenderingLoop(): void {
    const canvas = this.rendererCanvas.nativeElement;
    this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    this.renderer.setPixelRatio(devicePixelRatio);
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    const render = () => {
      requestAnimationFrame(render);
      this.renderer.render(this.scene, this.camera);
    };
    render();
  }

  ngOnDestroy(): void {
    if (this.dataSubscription) this.dataSubscription.unsubscribe();
  }

  @HostListener('window:resize', ['$event'])
  onWindowResize(event: Event) {
    const canvas = this.rendererCanvas.nativeElement;
    if(this.camera && this.renderer && canvas.clientWidth > 0) {
      this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    }
   }
}
