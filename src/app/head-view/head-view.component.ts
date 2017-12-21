import { Subscription } from 'rxjs/Subscription';
import { Component, Input, OnInit, ElementRef, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { zip } from 'rxjs/observable/zip';
import { filter, takeUntil } from 'rxjs/operators';
import * as AHRS from 'ahrs';

export interface XYZ {
  x: number;
  y: number;
  z: number;
}

import * as THREE from 'three';
import 'imports-loader?THREE=three!three/examples/js/loaders/GLTF2Loader';

@Component({
  selector: 'app-head-view',
  templateUrl: './head-view.component.html',
  styleUrls: ['./head-view.component.css']
})
export class HeadViewComponent implements OnInit, OnChanges, OnDestroy {
  @Input() acceleration: Observable<XYZ>;
  @Input() gyro: Observable<XYZ>;

  modelLoaded = false;

  private destroy = new Subject<void>();
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private renderer: THREE.WebGLRenderer;
  private headModel: THREE.Mesh | null = null;
  private sensorSubscription: Subscription;
  private ahrs = new AHRS({ sampleInterval: 52 });

  constructor(private element: ElementRef) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 20000);
    this.camera.position.set(0, 0, 20);
    this.camera.lookAt(this.scene.position);
    this.scene.add(this.camera);

    const directional = new THREE.DirectionalLight(0xffffff, 0.6);
    directional.position.set(6, 3, 9);
    this.scene.add(directional);

    const ambient = new THREE.AmbientLight(0x4c4c4c, 1);
    this.scene.add(ambient);

    const loader = new (THREE as any).GLTF2Loader();
    loader.load('./assets/head.gltf', (collada) => {
      this.headModel = collada.scene;
      this.headModel.scale.set(10, 10, 10);
      this.scene.add(this.headModel);
      this.modelLoaded = true;
    });

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(300, 300);
  }

  ngOnInit() {
    this.element.nativeElement.appendChild(this.renderer.domElement);
    this.animate();
  }

  ngOnChanges(changes: SimpleChanges) {
    if ((changes.acceleration || changes.gyro)) {
      if (this.sensorSubscription) {
        this.sensorSubscription.unsubscribe();
      }
      if (!this.acceleration || !this.gyro) {
        return;
      }
      this.sensorSubscription = zip(this.acceleration, this.gyro).pipe(
        takeUntil(this.destroy),
        filter(() => this.modelLoaded)
      ).subscribe(([acceleration, gyro]) => {
        const [ax, ay, az] = [acceleration.x, acceleration.y, acceleration.z];
        const gc = Math.PI / 180.0;
        const [gx, gy, gz] = [gyro.x * gc, gyro.y * gc, gyro.z * gc];
        this.ahrs.update(gx, gy, gz, ax, ay, az);
        const { x, y, z, w } = this.ahrs.getQuaternion();
        this.headModel.quaternion.x = x;
        this.headModel.quaternion.y = y;
        this.headModel.quaternion.z = z;
        this.headModel.quaternion.w = w;
      });
    }
  }

  ngOnDestroy() {
    this.destroy.next();
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.renderer.render(this.scene, this.camera);
  }
}
