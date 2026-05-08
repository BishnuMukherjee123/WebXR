export const SETTLING_TIME = 10000;
const MIN_DECAY_MILLISECONDS = 0.001;
export const DECAY_MILLISECONDS = 50;

/**
 * The Damper class is a generic second-order critically damped system that does
 * one linear step of the desired length of time.
 */
export class Damper {
  constructor(decayMilliseconds = DECAY_MILLISECONDS) {
    this.velocity = 0;
    this.naturalFrequency = 0;
    this.setDecayTime(decayMilliseconds);
  }

  setDecayTime(decayMilliseconds) {
    this.naturalFrequency = 1 / Math.max(MIN_DECAY_MILLISECONDS, decayMilliseconds);
  }

  update(x, xGoal, timeStepMilliseconds, xNormalization) {
    const nilSpeed = 0.0002 * this.naturalFrequency;

    if (x == null || xNormalization === 0) {
      return xGoal;
    }
    if (x === xGoal && this.velocity === 0) {
      return xGoal;
    }
    if (timeStepMilliseconds < 0) {
      return x;
    }
    
    // Exact solution to a critically damped second-order system
    const deltaX = (x - xGoal);
    const intermediateVelocity = this.velocity + this.naturalFrequency * deltaX;
    const intermediateX = deltaX + timeStepMilliseconds * intermediateVelocity;
    const decay = Math.exp(-this.naturalFrequency * timeStepMilliseconds);
    const newVelocity = (intermediateVelocity - this.naturalFrequency * intermediateX) * decay;
    const acceleration = -this.naturalFrequency * (newVelocity + intermediateVelocity * decay);
    
    if (Math.abs(newVelocity) < nilSpeed * Math.abs(xNormalization) && acceleration * deltaX >= 0) {
      this.velocity = 0;
      return xGoal;
    } else {
      this.velocity = newVelocity;
      return xGoal + intermediateX * decay;
    }
  }
}
