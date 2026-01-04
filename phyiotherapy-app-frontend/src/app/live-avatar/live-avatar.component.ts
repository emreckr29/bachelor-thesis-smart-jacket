import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { BluetoothService, SensorQuaternion } from '../services/bluetooth.service';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

@Component({
  selector: 'app-live-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `<div #canvasContainer style="width: 100%; height: 100%;"><canvas #canvasElement></canvas></div>`,
  styles: [`
    div, canvas {
      width: 100%;
      height: 100%;
      display: block;
    }
  `]
})
export class LiveAvatarComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('canvasElement', { static: true }) private canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('canvasContainer', { static: true }) private containerRef!: ElementRef<HTMLDivElement>;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;

  private dataSubscription: Subscription | null = null;

  // --- NEW: Self-contained Normalization Logic ---
  private referencePose: SensorQuaternion[] | null = null;

  private bones: THREE.Line[] = [];
  private joints: THREE.Mesh[] = [];

  constructor(private bluetoothService: BluetoothService) { }

  ngOnInit(): void {
    // Component now subscribes directly to raw data when it is initialized.
    this.dataSubscription = this.bluetoothService.getRawDataStream().subscribe((rawData: SensorQuaternion[]) => {
      this.updateStickFigure(rawData);
    });
  }

  ngAfterViewInit(): void {
    this.initThreeJs();
    this.createStickFigure();
    this.animate();
  }

  private initThreeJs(): void {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x282c34);

    const container = this.containerRef.nativeElement;
    this.camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    this.camera.position.set(0, 1.3, 2.5);

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvasRef.nativeElement, antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 1, 0);
    this.controls.enableDamping = true;

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 2);
    this.scene.add(hemiLight);
    const gridHelper = new THREE.GridHelper(10, 10);
    this.scene.add(gridHelper);
  }

  private createStickFigure(): void {
    const jointMaterial = new THREE.MeshBasicMaterial({ color: 0x00aaff }); // Changed color for visibility
    const boneMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 3 });
    const jointGeometry = new THREE.SphereGeometry(0.04, 16, 8);

    const numJoints = 9;
    for (let i = 0; i < numJoints; i++) {
        const joint = new THREE.Mesh(jointGeometry, jointMaterial);
        this.joints.push(joint);
        this.scene.add(joint);
    }

    const numBones = 8;
    for (let i = 0; i < numBones; i++) {
        const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
        const bone = new THREE.Line(geometry, boneMaterial);
        this.bones.push(bone);
        this.scene.add(bone);
    }
  }

  private updateStickFigure(rawData: SensorQuaternion[]): void {
    if (this.bones.length === 0 || this.joints.length === 0) return;

    // Step 1: Capture the first frame of data as the reference "zero" pose.
    if (!this.referencePose) {
      console.log("LiveAvatar reference pose captured.");
      this.referencePose = rawData;
    }

    // Step 2: Calculate the calibrated quaternions for this frame.
    const calibratedData: { [key: string]: THREE.Quaternion } = {};
    rawData.forEach((liveQuatData, index) => {
      if (this.referencePose && this.referencePose[index]) {
        const refQuatData = this.referencePose[index];
        const refQuat = new THREE.Quaternion(refQuatData.x, refQuatData.y, refQuatData.z, refQuatData.w);
        const liveQuat = new THREE.Quaternion(liveQuatData.x, liveQuatData.y, liveQuatData.z, liveQuatData.w);

        calibratedData[`s${index + 1}`] = refQuat.clone().invert().multiply(liveQuat);
      }
    });

    // Step 3: Update the avatar visuals using the newly calibrated data.
    const torsoLength = 0.7, neckLength = 0.1, shoulderWidth = 0.3,
          upperArmLength = 0.6, forearmLength = 0.6;
    const vecUp = new THREE.Vector3(0, 1, 0);
    const vecRight = new THREE.Vector3(-1, 0, 0);
    const vecLeft = new THREE.Vector3(1, 0, 0);

    const rot = {
        s5: calibratedData['s5'] || new THREE.Quaternion(), s7: calibratedData['s7'] || new THREE.Quaternion(),
        s3: calibratedData['s3'] || new THREE.Quaternion(), s2: calibratedData['s2'] || new THREE.Quaternion(),
        s1: calibratedData['s1'] || new THREE.Quaternion(), s8: calibratedData['s8'] || new THREE.Quaternion(),
        s9: calibratedData['s9'] || new THREE.Quaternion(), s10: calibratedData['s10'] || new THREE.Quaternion()
    };

    const p = {
        hips: new THREE.Vector3(0, 0.8, 0), chest: new THREE.Vector3(), neck: new THREE.Vector3(),
        r_shoulder: new THREE.Vector3(), r_elbow: new THREE.Vector3(), r_wrist: new THREE.Vector3(),
        l_shoulder: new THREE.Vector3(), l_elbow: new THREE.Vector3(), l_wrist: new THREE.Vector3()
    };

    p.chest.addVectors(p.hips, vecUp.clone().applyQuaternion(rot.s5).multiplyScalar(torsoLength));
    p.neck.addVectors(p.chest, vecUp.clone().applyQuaternion(rot.s7).multiplyScalar(neckLength));
    p.r_shoulder.addVectors(p.neck, new THREE.Vector3(-shoulderWidth, 0, 0));
    p.l_shoulder.addVectors(p.neck, new THREE.Vector3(shoulderWidth, 0, 0));
    p.r_elbow.addVectors(p.r_shoulder, vecRight.clone().applyQuaternion(rot.s2).multiplyScalar(upperArmLength));
    p.r_wrist.addVectors(p.r_elbow, vecRight.clone().applyQuaternion(rot.s1).multiplyScalar(forearmLength));
    p.l_elbow.addVectors(p.l_shoulder, vecLeft.clone().applyQuaternion(rot.s9).multiplyScalar(upperArmLength));
    p.l_wrist.addVectors(p.l_elbow, vecLeft.clone().applyQuaternion(rot.s10).multiplyScalar(forearmLength));

    this.joints[0].position.copy(p.hips); this.joints[1].position.copy(p.chest); this.joints[2].position.copy(p.neck);
    this.joints[3].position.copy(p.r_shoulder); this.joints[4].position.copy(p.r_elbow); this.joints[5].position.copy(p.r_wrist);
    this.joints[6].position.copy(p.l_shoulder); this.joints[7].position.copy(p.l_elbow); this.joints[8].position.copy(p.l_wrist);

    const updateBone = (index: number, p1: THREE.Vector3, p2: THREE.Vector3) => {
        const positions = this.bones[index].geometry.attributes['position'] as THREE.BufferAttribute;
        positions.setXYZ(0, p1.x, p1.y, p1.z);
        positions.setXYZ(1, p2.x, p2.y, p2.z);
        positions.needsUpdate = true;
    };

    updateBone(0, p.hips, p.chest); updateBone(1, p.chest, p.neck);
    updateBone(2, p.neck, p.r_shoulder); updateBone(3, p.r_shoulder, p.r_elbow); updateBone(4, p.r_elbow, p.r_wrist);
    updateBone(5, p.neck, p.l_shoulder); updateBone(6, p.l_shoulder, p.l_elbow); updateBone(7, p.l_elbow, p.l_wrist);
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

  @HostListener('window:resize', ['$event'])
  onWindowResize() {
    if (this.camera && this.renderer) {
      const container = this.containerRef.nativeElement;
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (width > 0 && height > 0) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
      }
    }
  }
}
