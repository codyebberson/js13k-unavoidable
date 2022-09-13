export const FX_NO_EFFECT = 0;
export const FX_SLIDE = 1;
export const FX_VIBRATO = 2;
export const FX_DROP = 3;
export const FX_FADE_IN = 4;
export const FX_FADE_OUT = 5;
export const FX_ARP_FAST = 6;
export const FX_ARP_SLOW = 7;
export const SAMPLE_RATE = 44100;
export const BASE_SPEED = 120;

// Celeste sounds
// 4 = powerup
// 5 = player hurt
// 6 = powerup
// 7 = checkpoint

// Sounds 0-18 are from nadir
// Sound 19 is the sword swing from "World Under"
// Sound 20 is the dash sound from Celeste (#3)
// Sound 21 is a powerup sound from Celeste (#8)
// Sound 22 is a powerup sound from Celeste (#13)
export const sfx = `010500001f33524335
010700000c355073550c65300653
0d08000018333
010500000c042180321f0451f0352404524035
010900000c6452f63521623
010a00001c6221c612
01050000111111a11135111
24100000017300273004730057400274001750007600175004740067400274000730007300173005740057500575003740027300172006730037300074001750037500575003740007300272005730027300073
4b10000000434004320c4350c43500434004320c4350c43500434004320c4350c43500434004320c4350c43500434004320c4350c43500434004320c4350c43500434004320c4350c43500434004320c4350c435
2d1000000c0330000000000000000c6350000000000000000c0330000000000000000c6350000000000000000c0330000000000000000c6350000000000000000c0330000000000000000c635
4b1000000843408432144351443508434084321443514435084340843214435144350843408432144351443508434084321443514435084340843214435144350843408432144351443508434084321443514435
4b1000000a4340a43216435164350a4340a43216435164350a4340a43216435164350a4340a43216435164350a4340a43216435164350a4340a43216435164350a4340a43216435164350a4340a4321643516435
4b1000000543405432114351143505434054321143511435054340543211435114350543405432114351143505434054321143511435054340543211435114350543405432114351143505434054321143511435
111000001b1201b1201b1221b12218120181201d1201d1201f1201f1201f1201f1221f1221f1221d1201b120181201812018122181221a1201a12018120181201b1201b1201b1201b1221b1221b1221d1201f12
11100000201202012020122201221f1201f1201d1201d1201812018120181201812218122181221d1201f1202412024120241222412220120201201f1201f1201d1201d1201d1201d1221d1221d1221b1201a12
911000000c3270f32713327143270c3270f3271332614326183271b3271f32720327183271b3271f3262032624327273272b3272c32724327273272b3262c326183271b3271f32720327183271b3271f32620326
911000000c3271132713327143270c327113271332614326183271d3271f32720327183271d3271f3262032624327293272b3272c32724327293272b3262c326183271d3271f32720327183271d3271f32620326
1908000024232202321f2321b2321823214232132320f2320c2320c23100231
030c00000065300653306512465124651186501865018653
00020000116101e61023620256202b63024620226101e6100d6100c6002b60027600246001c6001860010600212001f200000001c2001620014200122000e20008200082000a100061000
010200000642008420094200b4201b640296503c6503b6503b6503965036650326502d6502865024640216401d6401a64016630116300e6300b620076200561003610106001060000600006000060000600006
00030000070700a0700e0701007016070220702f0702f0602c0602c0502f0502f0402c0402c0302f0202f0102c000000000000000000000000000000000000000000000000000000000000000000000000000000
000400000c5501c5601057023570195702c5702157037570285703b5702c5703e560315503e540315303e530315203f520315203f520315103f510315103f510315103f510315103f50000500005000050000500`;

export const music = `01 0d494344
00 0e494344
00 0d094344
00 0e094344
00 08090d44
00 0a090d44
00 0b090e44
00 0c090e44
00 08094d0f
00 0a094d0f
00 0b094e10
00 0c094e10
02 09424344
03 07424344`;

/**
 * Global audio context.
 * Using a global will create a warning in Chrome, but appears to be fine.
 * @const {!AudioContext}
 */
export const audioCtx = new AudioContext();

export const sfxData = sfx.split('\n');
export const musicData = music.split('\n');

/**
 * Previous brown noise.
 * Need to track this to trim frequency ranges.
 * See the noise oscillator.
 * @type {number}
 */
let prevNoise = 0;

/**
 * Currently playing music.
 */
let currMusic: AudioBufferSourceNode | undefined = undefined;

/**
 * Parses a hex substring into a decimal number.
 * @param {string} str
 * @param {number} start
 * @param {number} len
 * @return {number}
 * @noinline
 */
export const parseHex = (str: string, start: number, len: number): number =>
  parseInt(str.substr(start, len) || '0', 16);

/**
 * Rounds a number.
 * This compresses better than Math.round.
 * Google Closure Compiler inlines the calls.
 * @param {number} x Input number.
 * @return {number} Output number.
 */
export const round = (x: number): number => (x + 0.5) | 0;

/**
 * Triangle oscillator.
 * @param {number} t
 * @return {number}
 */
export const triangleOscillator = (t: number): number => Math.abs(2 * t - 1) - 1.0;

/**
 * Tilted saw oscillator.
 * @param {number} t
 * @return {number}
 */
export const tiltedSawOscillator = (t: number): number => {
  const a = 0.9;
  const ret = t < a ? (2.0 * t) / a - 1.0 : (2.0 * (1.0 - t)) / (1.0 - a) - 1.0;
  return ret * 0.5;
};

/**
 * Saw oscillator.
 * 0->1 ramp
 * @param {number} t
 * @return {number}
 */
export const sawOscillator = (t: number): number => 0.6 * (t < 0.5 ? t : t - 1.0);

/**
 * Square oscillator.
 * 50% duty cycle square wave
 * @param {number} t
 * @return {number}
 */
export const squareOscillator = (t: number): number => (t < 0.5 ? 0.5 : -0.5);

/**
 * Pulse oscillator.
 * 20% duty cycle square wave
 * @param {number} t
 * @return {number}
 */
export const pulseOscillator = (t: number): number => (t < 0.3 ? 0.5 : -0.5);

/**
 * Organ oscillator.
 * tri-uneven: 100% tri 75% tri on loop
 * @param {number} t
 * @return {number}
 */
export const organOscillator = (t: number): number =>
  (t < 0.5 ? 3.0 - Math.abs(24.0 * t - 6.0) : 1.0 - Math.abs(16.0 * t - 12.0)) / 9.0;

/**
 * Noise oscillator.
 * @return {number}
 */
export const noiseOscillator = (): number => {
  const white = Math.random() * 2 - 1;
  const brown = (prevNoise + 0.02 * white) / 1.02;
  prevNoise = brown;
  return brown * 3; // (roughly) compensate for gain
};

/**
 * Phaser oscillator.
 * @param {number} t
 * @param {number} value
 * @return {number}
 */
export const phaserOscillator = (t: number, value: number): number => {
  // This one has a subfrequency of freq/128 that appears
  // to modulate two signals using a triangle wave
  const k = Math.abs(2.0 * ((value / 128.0) % 1.0) - 1.0);
  const u = (t + 0.5 * k) % 1.0;
  const ret = Math.abs(4.0 * u - 2.0) - Math.abs(8.0 * t - 4.0);
  return ret / 6.0;
};

/**
 * Oscillators.
 * Order and indices are important!
 * @const {!Array.<function(number=, number=): number>}
 */
export const oscillators = [
  triangleOscillator,
  tiltedSawOscillator,
  sawOscillator,
  squareOscillator,
  pulseOscillator,
  organOscillator,
  noiseOscillator,
  phaserOscillator,
];

/**
 * Returns note frequency from pitch index (0-63).
 * From C-0 to D#-5 in chromatic scale.
 * @param {number} pitch
 * @return {number}
 */
export const getFreq = (pitch: number): number => 65 * 2 ** (pitch / 12);

// /**
//  * Converts frequency to midi.
//  * @param {number} frequency The note frequency.
//  * @return {number} The midi note.
//  */
// function frequencyToMidiNoteNumber(frequency) {
//   return Math.round(69 + 12 * Math.log2(frequency / 440));
// }

/**
 * Cache of pre-built sounds.
 * Key is `${sfxIndex}-${pitchOffset}
 * Value is a AudioBuffer.
 */
export const soundCache: Record<number, AudioBuffer> = {};

// export const codyOutput = {};

/**
 * Builds the sound from scratch.
 * @param {number} sfxIndex
 * @param {number} pitchOffset
 * @return {!AudioBuffer}
 */
export const buildSound = (sfxIndex: number): AudioBuffer => {
  const sfxRow = sfxData[sfxIndex];
  const speed = parseHex(sfxRow, 2, 2);
  const noteLength = speed / BASE_SPEED;
  const loopStart = parseHex(sfxRow, 4, 2);
  const loopEnd = parseHex(sfxRow, 6, 2) || 32;
  const length = loopEnd * noteLength * SAMPLE_RATE;
  const audioBuffer = audioCtx.createBuffer(1, length, SAMPLE_RATE);
  const data = audioBuffer.getChannelData(0);

  /**
   * Returns the next note index.
   * Handles loop start/end.
   * @param {number} i The current note index.
   * @return {number} The next note index.
   */
  const getNextIndex = (i: number): number => (i + 1 >= loopEnd ? loopStart : i + 1);

  /**
   * Returns a data element from the sfx row.
   * @param {number} index The note index. (0-32).
   * @param {number} offset The element offset (0-4).
   * @param {number} len The length in hex characters.
   * @return {number} The sfx value.
   */
  const getSfx = (index: number, offset: number, len: number): number => parseHex(sfxRow, 8 + index * 5 + offset, len);

  let offset = 0;
  let phi = 0;
  let i = 0;

  let prevNote = 24;
  let prevFreq = getFreq(24);
  let prevWaveform = -1;
  let prevVolume = -1;
  let prevEffect = -1;

  let currNote;
  let currFreq;
  let currWaveform;
  let currVolume;
  let currEffect;

  while (offset < length) {
    currNote = getSfx(i, 0, 2);
    currFreq = getFreq(currNote);
    currWaveform = getSfx(i, 2, 1);
    currVolume = getSfx(i, 3, 1) / 8.0;
    currEffect = getSfx(i, 4, 1);

    const next = getNextIndex(i);
    const nextNote = getSfx(next, 0, 2);
    const nextWaveform = getSfx(next, 2, 1);
    const nextVolume = getSfx(next, 3, 1);
    const nextEffect = getSfx(next, 4, 1);

    let attack = 0.02;
    if (
      currEffect === FX_FADE_IN ||
      (currWaveform === prevWaveform &&
        (currNote === prevNote || currEffect === FX_SLIDE) &&
        prevVolume > 0 &&
        prevEffect !== FX_FADE_OUT)
    ) {
      attack = 0;
    }
    let release = 0.05;
    if (
      currEffect === FX_FADE_OUT ||
      (currWaveform === nextWaveform &&
        (currNote === nextNote || nextEffect === FX_SLIDE) &&
        nextVolume > 0 &&
        nextEffect !== FX_FADE_IN)
    ) {
      release = 0;
    }

    const samples = round(noteLength * SAMPLE_RATE);
    for (let j = offset; j < offset + samples; j++) {
      // Note factor is the percentage of completion of the note
      // 0.0 is the beginning
      // 1.0 is the end
      const noteFactor = (j - offset) / samples;

      let envelope = 1.0;
      if (noteFactor < attack) {
        envelope = noteFactor / attack;
      } else if (noteFactor > 1.0 - release) {
        envelope = (1.0 - noteFactor) / release;
      }

      let freq = currFreq;
      let volume = currVolume;

      if (currEffect === FX_SLIDE) {
        freq = (1 - noteFactor) * prevFreq + noteFactor * currFreq;
        if (prevVolume > 0) {
          volume = (1 - noteFactor) * prevVolume + noteFactor * currVolume;
        }
      }
      if (currEffect === FX_VIBRATO) {
        freq *= 1.0 + 0.02 * Math.sin(7.5 * noteFactor);
      }
      if (currEffect === FX_DROP) {
        freq *= 1.0 - noteFactor;
      }
      if (currEffect === FX_FADE_IN) {
        volume *= noteFactor;
      }
      if (currEffect === FX_FADE_OUT) {
        volume *= 1.0 - noteFactor;
      }
      if (currEffect >= FX_ARP_FAST) {
        // From the documentation:
        //   6 arpeggio fast  //  Iterate over groups of 4 notes at speed of 4
        //   7 arpeggio slow  //  Iterate over groups of 4 notes at speed of 8
        //   If the SFX speed is <= 8, arpeggio speeds are halved to 2, 4
        const m = (speed <= 8 ? 32 : 16) / (currEffect === FX_ARP_FAST ? 4 : 8);
        const n = (m * noteFactor) | 0;
        const arpNote = (i & ~3) | (n & 3);
        freq = getFreq(getSfx(arpNote, 0, 2));
      }

      phi += freq / SAMPLE_RATE;
      if (currWaveform < 8) {
        data[j] += volume * envelope * oscillators[currWaveform](phi % 1, phi);
      }
    }

    offset += samples;
    prevNote = currNote;
    prevFreq = currFreq;
    prevWaveform = currWaveform;
    prevVolume = currVolume;
    prevEffect = currEffect;
    i = getNextIndex(i);
  }
  return audioBuffer;
};

/**
 * Returns a sound buffer.
 * Uses a cached buffer if available.
 * Otherwise builds the sound from scratch.
 * @param {number} sfxIndex
 * @return {!AudioBuffer}
 */
export const getSound = (sfxIndex: number): AudioBuffer => {
  const key = sfxIndex;
  let sound = soundCache[key];
  if (!sound) {
    sound = buildSound(sfxIndex);
    soundCache[key] = sound;
  }
  return sound;
};

/**
 * @param {!Float32Array} data
 * @param {number} offset
 * @param {number} endOffset
 * @param {number} sfxIndex
 */
export const buildMusic = (data: Float32Array, offset: number, endOffset: number, sfxIndex: number): void => {
  const sfxBuffer = getSound(sfxIndex);
  const sfxBufferData = sfxBuffer.getChannelData(0);
  let i = 0;
  while (offset < endOffset) {
    data[offset] += sfxBufferData[i];
    i = (i + 1) % sfxBufferData.length;
    offset++;
  }
};

/**
 * Plays an audio buffer.
 * Optional looping.
 * @param {!AudioBuffer} audioBuffer The audio buffer.
 * @param {boolean=} loop Optional flag to loop the audio.
 * @param {number=} loopStart Optional loop start time.
 * @return {!AudioBufferSourceNode}
 */
export const playAudioBuffer = (audioBuffer: AudioBuffer, loop = false, loopStart = 0): AudioBufferSourceNode => {
  const source = audioCtx.createBufferSource();
  source.buffer = audioBuffer;
  source.loop = loop;
  source.loopStart = loopStart;
  source.connect(audioCtx.destination);
  source.start();
  return source;
};

/**
 * Plays a sound effect.
 * @param {number} n The number of the sound effect to play (0-63).
 * @return {!AudioBufferSourceNode}
 */
export const playSfx = (n: number): AudioBufferSourceNode => playAudioBuffer(getSound(n));

export const stopMusic = (): void => {
  if (currMusic) {
    currMusic.stop();
    currMusic = undefined;
  }
};

/**
 * Builds and plays a song.
 * @param {number} startPattern
 * @return {!AudioBufferSourceNode}
 */
export const playMusic = (startPattern: number): void => {
  audioCtx.resume();
  stopMusic();

  // Preprocess loop
  // Need to do 4 things on this loop:
  // 1) Find the "time" channels
  //    Channels can run at different speeds, and therefore have different lengths
  //    The length of a pattern is defined by the first non-looping channel
  //    See: https://www.lexaloffle.com/bbs/?pid=12781
  // 2) Calculate the pattern lengths
  //    After we know the time channel, we can convert that into number of samples
  // 3) Find the loop start time (if one exists)
  //    Find the pattern with the "start loop" flag set
  //    Otherwise default to beginning of the song
  // 4) Find the end pattern and total song length
  //    Find the pattern with the "end loop" flag set
  //    Otherwise default to end of the song
  const timeChannels = [];
  const patternSamples = [];
  let loopStart = 0;
  let songLength = 0;
  let endPattern = musicData.length - 1;
  for (let pattern = startPattern; pattern <= endPattern; pattern++) {
    const musicRow = musicData[pattern];
    const flags = parseHex(musicRow, 0, 2);

    timeChannels[pattern] = 0;
    for (let channel = 0; channel < 4; channel++) {
      const sfxIndex = parseHex(musicRow, 3 + channel * 2, 2);
      if (sfxIndex < sfxData.length) {
        const sfxRow = sfxData[sfxIndex];
        const loopEnd = parseHex(sfxRow, 6, 2);
        if (loopEnd === 0) {
          timeChannels[pattern] = channel;
          break;
        }
      }
    }

    const sfxIndex = parseHex(musicRow, 3 + timeChannels[pattern] * 2, 2);
    const sfxRow = sfxData[sfxIndex];
    const noteLength = parseHex(sfxRow, 2, 2) / BASE_SPEED;
    patternSamples[pattern] = round(32 * noteLength * SAMPLE_RATE);

    if ((flags & 1) === 1) {
      loopStart = songLength;
    }

    songLength += 32 * noteLength;

    if ((flags & 2) === 2) {
      endPattern = pattern;
      break;
    }
  }

  // Now we have everything we need to build the song
  const frameCount = SAMPLE_RATE * songLength;
  const audioBuffer = audioCtx.createBuffer(1, frameCount, SAMPLE_RATE);
  const data = audioBuffer.getChannelData(0);

  // Main music generator loop
  let offset = 0;
  for (let pattern = startPattern; pattern <= endPattern; pattern++) {
    const musicRow = musicData[pattern];
    const samples = patternSamples[pattern];
    for (let channel = 0; channel < 4; channel++) {
      const sfxIndex = parseHex(musicRow, 3 + channel * 2, 2);
      if (sfxIndex < sfxData.length) {
        buildMusic(data, offset, offset + samples, sfxIndex);
      }
    }
    offset += samples;
  }
  currMusic = playAudioBuffer(audioBuffer, true, loopStart);
};
