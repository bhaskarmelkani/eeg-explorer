declare module 'ahrs' {
  interface IAHRSOptions {
    /*
     * The sample interval, in Hz.
     */
    sampleInterval?: number,

    /*
     * Choose from the `Madgwick` or `Mahony` filter.
     */
    algorithm?: 'Madgwick' | 'Mahony',

    /*
     * The filter noise value, smaller values have
     * smoother estimates, but have higher latency.
     * This only works for the `Madgwick` filter.
     */
    beta?: number;

    /*
     * The filter noise values for the `Mahony` filter.
     */
    kp?: number;
    ki?: number;
  }

  interface IVector {
    angle: number;
    x: number;
    y: number;
    z: number;
  }

  interface IQuaternion {
    x: number;
    y: number;
    z: number;
    w: number;
  }

  interface IEulerAngles {
    heading: number;
    pitch: number;
    roll: number;
  }

  class AHRS {
    constructor(options?: IAHRSOptions);
    update(gyroX: number, gyroY: number, gyroZ: number, accelX: number, accelY: number, accelZ: number,
        compassX?: number, compassY?: number, compassZ?: number, deltaTimeSec?: number): void;
    getQuaternion(): IQuaternion;
    toVector(): IVector;
    getEulerAngles(): IEulerAngles;
    getEulerAnglesDegrees(): IEulerAngles;
  }

  namespace AHRS {
  }

  export = AHRS;
}
