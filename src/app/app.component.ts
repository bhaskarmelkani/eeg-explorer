import { Component, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { MatSnackBar } from '@angular/material';

import { MuseClient, MuseControlResponse, zipSamples, EEGSample } from 'muse-js';
import { Observable } from 'rxjs/Observable';
import { from } from 'rxjs/observable/from';
import { Subject } from 'rxjs/Subject';
import { map, mergeMap, share, tap, takeUntil } from 'rxjs/operators';

import { XYZ } from './head-view/head-view.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  connecting = false;
  connected = false;
  data: Observable<EEGSample> | null;
  batteryLevel: Observable<number> | null;
  controlResponses: Observable<MuseControlResponse>;
  acceleration: Observable<XYZ>;
  gyro: Observable<XYZ>;
  destroy = new Subject<void>();

  private muse = new MuseClient();

  constructor(private cd: ChangeDetectorRef, private snackBar: MatSnackBar) {
  }

  ngOnInit() {
    this.muse.connectionStatus.pipe(
      takeUntil(this.destroy)
    )
      .subscribe(status => {
        this.connected = status;
        this.data = null;
        this.batteryLevel = null;
      });
  }

  ngOnDestroy() {
    this.destroy.next();
  }

  async connect() {
    this.connecting = true;
    this.snackBar.dismiss();
    try {
      await this.muse.connect();
      this.controlResponses = this.muse.controlResponses;
      await this.muse.start();
      this.data = this.muse.eegReadings.pipe(
        zipSamples,
        takeUntil(this.destroy),
        tap(() => this.cd.detectChanges()),
        share()
      );
      this.batteryLevel = this.muse.telemetryData.pipe(
        takeUntil(this.destroy),
        map(t => t.batteryLevel)
      );
      this.acceleration = this.muse.accelerometerData.pipe(
        takeUntil(this.destroy),
        mergeMap(reading => from(reading.samples))
      );
      this.gyro = this.muse.gyroscopeData.pipe(
        takeUntil(this.destroy),
        mergeMap(reading => from(reading.samples))
      ),
      await this.muse.deviceInfo();
    } catch (err) {
      this.snackBar.open('Connection failed: ' + err.toString(), 'Dismiss');
    } finally {
      this.connecting = false;
    }
  }

  disconnect() {
    this.muse.disconnect();
  }

  get enableAux() {
    return this.muse.enableAux;
  }

  set enableAux(value: boolean) {
    this.muse.enableAux = value;
  }
}
