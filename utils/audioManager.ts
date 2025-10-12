
import { sounds } from '../assets';
import { Settings } from '../types';

class AudioManager {
  private music: HTMLAudioElement | null = null;
  private isInitialized = false;

  private masterVolume = 1;
  private musicVolume = 1;
  private sfxVolume = 1;

  public init(settings: Settings) {
    if (this.isInitialized) {
        this.updateVolumes(settings);
        return;
    };
    
    this.music = new Audio(sounds.music);
    this.music.loop = true;

    this.updateVolumes(settings);
    this.isInitialized = true;
  }

  public updateVolumes(settings: Settings) {
    this.masterVolume = settings.masterVolume;
    this.musicVolume = settings.musicVolume;
    this.sfxVolume = settings.sfxVolume;

    if (this.music) {
      this.music.volume = this.masterVolume * this.musicVolume;
    }
  }

  public playMusic() {
    if (this.music && this.music.paused) {
      this.music.play().catch(e => console.error("Error playing music:", e));
    }
  }

  public pauseMusic() {
    this.music?.pause();
  }

  public stopMusic() {
      if (this.music) {
        this.music.pause();
        this.music.currentTime = 0;
      }
  }

  public playSfx(name: keyof typeof sounds) {
    // Sound effects are disabled.
  }
}

// Export a single instance to be used throughout the app
export const audioManager = new AudioManager();
