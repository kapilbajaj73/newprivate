// Audio processing utilities for voice modulation

// Global audio context and voice modulation settings
let audioContext: AudioContext | null = null;
let activeEffect: string | null = null;

// Audio processing nodes
let sourceNode: MediaStreamAudioSourceNode | null = null;
let destinationNode: MediaStreamAudioDestinationNode | null = null;
let analyserNode: AnalyserNode | null = null;
let biquadFilter: BiquadFilterNode | null = null;
let oscillatorNode: OscillatorNode | null = null;
let delayNode: DelayNode | null = null;
let gainNode: GainNode | null = null;
let waveShaperNode: WaveShaperNode | null = null;

/**
 * Initialize the audio processing context
 */
export function initAudioContext() {
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      console.log('Audio context initialized');
    } catch (error) {
      console.error('Audio context initialization failed:', error);
    }
  }
  return audioContext;
}

/**
 * Set up voice effect processor chain for a microphone stream
 * @param stream The microphone stream to process
 * @param effect The voice effect to apply
 * @returns Processed audio stream
 */
export function applyVoiceEffect(stream: MediaStream, effect: string): MediaStream {
  // Initialize audio context if needed
  const context = initAudioContext();
  if (!context) {
    console.error('No audio context available');
    return stream;
  }
  
  // If there's already processing happening, disconnect everything
  if (sourceNode) {
    cleanupAudioNodes();
  }
  
  try {
    // Create source from microphone
    sourceNode = context.createMediaStreamSource(stream);
    
    // Create destination node to get processed output stream
    destinationNode = context.createMediaStreamDestination() as MediaStreamAudioDestinationNode;
    
    // Create analyser for visualizations (optional)
    analyserNode = context.createAnalyser();
    analyserNode.fftSize = 2048;
    
    // Create gain node for volume control
    gainNode = context.createGain();
    gainNode.gain.value = 1.0; // Default gain
    
    // Setup effect chain based on requested effect
    activeEffect = effect;
    
    if (effect === 'deepVoice') {
      setupDeepVoiceEffect(context);
    } else if (effect === 'robot') {
      setupRobotEffect(context);
    } else if (effect === 'highPitch') {
      setupHighPitchEffect(context);
    } else if (effect === 'echo') {
      setupEchoEffect(context);
    } else {
      // No effect, just pass through with gain
      sourceNode.connect(gainNode);
      gainNode.connect(destinationNode);
      return destinationNode.stream;
    }
    
    // Connect to destination
    gainNode.connect(destinationNode);
    
    // Return processed stream
    return destinationNode.stream;
  } catch (error) {
    console.error('Error setting up voice effect:', error);
    return stream; // Return original stream if processing failed
  }
}

/**
 * Clean up audio processing nodes to avoid memory leaks
 */
export function cleanupAudioNodes() {
  if (sourceNode) {
    sourceNode.disconnect();
    sourceNode = null;
  }
  
  if (biquadFilter) {
    biquadFilter.disconnect();
    biquadFilter = null;
  }
  
  if (oscillatorNode) {
    oscillatorNode.stop();
    oscillatorNode.disconnect();
    oscillatorNode = null;
  }
  
  if (delayNode) {
    delayNode.disconnect();
    delayNode = null;
  }
  
  if (gainNode) {
    gainNode.disconnect();
    gainNode = null;
  }
  
  if (waveShaperNode) {
    waveShaperNode.disconnect();
    waveShaperNode = null;
  }
  
  if (analyserNode) {
    analyserNode.disconnect();
    analyserNode = null;
  }
  
  if (destinationNode) {
    destinationNode.disconnect();
    destinationNode = null;
  }
  
  activeEffect = null;
}

// Deep voice effect (pitch shift down)
function setupDeepVoiceEffect(context: AudioContext) {
  if (!sourceNode || !gainNode) return;
  
  // Create a biquad filter for deep voice
  biquadFilter = context.createBiquadFilter();
  biquadFilter.type = 'lowshelf';
  biquadFilter.frequency.value = 500;
  biquadFilter.gain.value = 10;
  
  // Connect the nodes
  sourceNode.connect(biquadFilter);
  biquadFilter.connect(gainNode);
}

// Robot voice effect using ring modulation
function setupRobotEffect(context: AudioContext) {
  if (!sourceNode || !gainNode) return;
  
  // Create a oscillator for the robot effect
  oscillatorNode = context.createOscillator();
  oscillatorNode.type = 'square';
  oscillatorNode.frequency.value = 50; // Hz
  
  // Create a wave shaper for distortion
  waveShaperNode = context.createWaveShaper();
  
  // Create distortion curve
  const curve = new Float32Array(context.sampleRate);
  const deg = Math.PI / 180;
  for (let i = 0; i < context.sampleRate; i++) {
    const x = i * 2 / context.sampleRate - 1;
    curve[i] = (3 + 20) * x * 20 * deg / (Math.PI + 20 * Math.abs(x));
  }
  waveShaperNode.curve = curve;
  
  // Connect the nodes
  sourceNode.connect(waveShaperNode);
  waveShaperNode.connect(gainNode);
  oscillatorNode.connect(gainNode);
  oscillatorNode.start();
}

// High pitch effect (pitch shift up)
function setupHighPitchEffect(context: AudioContext) {
  if (!sourceNode || !gainNode) return;
  
  // Create a biquad filter for high voice
  biquadFilter = context.createBiquadFilter();
  biquadFilter.type = 'highshelf';
  biquadFilter.frequency.value = 1000;
  biquadFilter.gain.value = 15;
  
  // Connect the nodes
  sourceNode.connect(biquadFilter);
  biquadFilter.connect(gainNode);
}

// Echo effect
function setupEchoEffect(context: AudioContext) {
  if (!sourceNode || !gainNode) return;
  
  // Create a delay node
  delayNode = context.createDelay(0.5);
  delayNode.delayTime.value = 0.2; // 200ms delay
  
  // Create a feedback gain node
  const feedbackGain = context.createGain();
  feedbackGain.gain.value = 0.4; // 40% feedback
  
  // Connect the nodes
  sourceNode.connect(gainNode);
  sourceNode.connect(delayNode);
  delayNode.connect(feedbackGain);
  feedbackGain.connect(delayNode);
  delayNode.connect(gainNode);
}

/**
 * Get the active voice effect
 */
export function getActiveEffect(): string | null {
  return activeEffect;
}

/**
 * Set gain value for voice modulation
 * @param value Gain value (0.0 to 2.0)
 */
export function setGain(value: number) {
  if (gainNode) {
    gainNode.gain.value = Math.max(0, Math.min(2, value));
  }
}