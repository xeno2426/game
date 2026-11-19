import { Player } from '../entities/Player';
import { sound } from '../audio/SoundSynth';
import { Haptics } from '../audio/Haptics';

export interface UpgradeOption {
  id: string;
  name: string;
  icon: string;
  desc: string;
  apply: (player: Player) => void;
}

const ALL_UPGRADES: UpgradeOption[] = [
  {
    id: 'dmg',
    name: 'DAMAGE BOOST',
    icon: '⚡',
    desc: '+30% Bullet Damage',
    apply: (p) => { p.stats.bulletDamage = Math.round(p.stats.bulletDamage * 1.3); },
  },
  {
    id: 'fireRate',
    name: 'RAPID FIRE',
    icon: '🔥',
    desc: '+25% Firing Speed',
    apply: (p) => { p.stats.fireRate = Number((p.stats.fireRate * 1.25).toFixed(2)); },
  },
  {
    id: 'speed',
    name: 'HYPER ENGINE',
    icon: '🚀',
    desc: '+15% Move Speed',
    apply: (p) => { p.stats.moveSpeed = Number((p.stats.moveSpeed * 1.15).toFixed(2)); },
  },
  {
    id: 'health',
    name: 'HULL REPAIR',
    icon: '🛡️',
    desc: '+40 Max HP & Full Heal',
    apply: (p) => {
      p.stats.maxHp += 40;
      p.hp = p.stats.maxHp;
    },
  },
  {
    id: 'magnet',
    name: 'MAGNET PULSE',
    icon: '🧲',
    desc: '+50% XP Pickup Radius',
    apply: (p) => { p.stats.pickupRadius = Number((p.stats.pickupRadius * 1.5).toFixed(2)); },
  },
  {
    id: 'dash',
    name: 'TURBO DASH',
    icon: '💨',
    desc: '-25% Dash Cooldown',
    apply: (p) => { p.stats.dashCooldown = Math.max(0.4, Number((p.stats.dashCooldown * 0.75).toFixed(2))); },
  },
];

export class HUD {
  private container: HTMLElement;
  private hpBarFill: HTMLElement;
  private hpText: HTMLElement;
  private waveText: HTMLElement;
  private scoreText: HTMLElement;
  private highScoreText: HTMLElement;
  private xpBarFill: HTMLElement;

  private upgradeModal: HTMLElement;
  private gameOverModal: HTMLElement;

  public score = 0;
  public highScore = 0;
  public currentXp = 0;
  public xpToNextLevel = 5;
  public playerLevel = 1;

  public onUpgradeSelectedCallback?: () => void;
  public onRestartCallback?: () => void;

  constructor(container: HTMLElement) {
    this.container = container;

    // Load persistent high score
    const saved = localStorage.getItem('cyber_siege_high_score');
    this.highScore = saved ? parseInt(saved, 10) || 0 : 0;

    // Top XP Bar
    const xpContainer = document.createElement('div');
    xpContainer.id = 'xp-bar-container';
    xpContainer.innerHTML = `<div id="xp-bar-fill"></div>`;
    this.xpBarFill = xpContainer.querySelector('#xp-bar-fill')!;

    // Top HUD Row
    const topRow = document.createElement('div');
    topRow.id = 'hud-top';
    topRow.innerHTML = `
      <div class="hud-bar-container">
        <div id="hp-bar-fill"></div>
        <div id="hp-text">100 / 100 HP</div>
      </div>
      <div class="hud-stat-box">
        <span class="stat-label">WAVE</span>
        <span id="hud-wave">1</span>
      </div>
      <div class="hud-stat-box">
        <span class="stat-label">SCORE</span>
        <span id="hud-score">0</span>
      </div>
      <div class="hud-stat-box">
        <span class="stat-label">BEST</span>
        <span id="hud-highscore">${this.highScore}</span>
      </div>
    `;

    this.hpBarFill = topRow.querySelector('#hp-bar-fill')!;
    this.hpText = topRow.querySelector('#hp-text')!;
    this.waveText = topRow.querySelector('#hud-wave')!;
    this.scoreText = topRow.querySelector('#hud-score')!;
    this.highScoreText = topRow.querySelector('#hud-highscore')!;

    // Upgrade Choice Modal
    this.upgradeModal = document.createElement('div');
    this.upgradeModal.id = 'upgrade-modal';
    this.upgradeModal.className = 'modal-overlay';
    this.upgradeModal.innerHTML = `
      <div class="modal-card">
        <h2 class="modal-title">WAVE COMPLETE!</h2>
        <p class="modal-body">Choose a cybernetic enhancement for your ship:</p>
        <div id="upgrade-choices" class="upgrade-grid"></div>
      </div>
    `;

    // Game Over Modal
    this.gameOverModal = document.createElement('div');
    this.gameOverModal.id = 'game-over-modal';
    this.gameOverModal.className = 'modal-overlay';
    this.gameOverModal.innerHTML = `
      <div class="modal-card">
        <h2 class="modal-title" style="background: linear-gradient(90deg, #ff0055, #ffaa00); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">VESSEL DESTROYED</h2>
        <div id="new-high-score-banner" style="display: none; color: #ffea00; font-weight: 800; font-size: 15px; margin-bottom: 8px;">★ NEW HIGH SCORE! ★</div>
        <p class="modal-body" id="game-over-stats"></p>
        <button id="game-over-restart-btn" class="modal-btn">REDEPLOY VESSEL</button>
      </div>
    `;

    this.container.appendChild(xpContainer);
    this.container.appendChild(topRow);
    this.container.appendChild(this.upgradeModal);
    this.container.appendChild(this.gameOverModal);

    const restartBtn = this.gameOverModal.querySelector('#game-over-restart-btn') as HTMLElement;
    restartBtn.addEventListener('click', () => {
      this.hideGameOver();
      if (this.onRestartCallback) this.onRestartCallback();
    });
  }

  public update(player: Player, wave: number) {
    // Update HP bar
    const hpPct = Math.max(0, Math.min(100, (player.hp / player.stats.maxHp) * 100));
    this.hpBarFill.style.width = `${hpPct}%`;
    this.hpText.textContent = `${Math.ceil(player.hp)} / ${player.stats.maxHp} HP`;

    // Change bar color gradient at low HP
    if (hpPct < 25) {
      this.hpBarFill.style.background = 'linear-gradient(90deg, #ff0000 0%, #ff5500 100%)';
    } else {
      this.hpBarFill.style.background = 'linear-gradient(90deg, #ff0055 0%, #00ff88 100%)';
    }

    // Update Wave & Score
    this.waveText.textContent = `${wave}`;
    this.scoreText.textContent = `${this.score}`;
    this.highScoreText.textContent = `${this.highScore}`;

    // Update XP Bar
    const xpPct = Math.min(100, (this.currentXp / this.xpToNextLevel) * 100);
    this.xpBarFill.style.width = `${xpPct}%`;
  }

  public addScore(points: number) {
    this.score += points;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('cyber_siege_high_score', this.highScore.toString());
    }
  }

  public addXp(amount: number): boolean {
    this.currentXp += amount;
    if (this.currentXp >= this.xpToNextLevel) {
      this.currentXp -= this.xpToNextLevel;
      this.playerLevel++;
      this.xpToNextLevel = Math.round(this.xpToNextLevel * 1.5 + 4);
      sound.playLevelUp();
      Haptics.levelUp();
      return true; // Leveled up!
    }
    return false;
  }

  public showUpgradeModal(player: Player, onComplete: () => void) {
    sound.playLevelUp();
    Haptics.levelUp();

    const choicesContainer = this.upgradeModal.querySelector('#upgrade-choices')!;
    choicesContainer.innerHTML = '';

    // Pick 3 random distinct upgrades
    const shuffled = [...ALL_UPGRADES].sort(() => Math.random() - 0.5).slice(0, 3);

    shuffled.forEach((upgrade) => {
      const card = document.createElement('div');
      card.className = 'upgrade-card';
      card.innerHTML = `
        <div class="upgrade-icon">${upgrade.icon}</div>
        <div class="upgrade-name">${upgrade.name}</div>
        <div class="upgrade-desc">${upgrade.desc}</div>
      `;

      card.addEventListener('click', () => {
        upgrade.apply(player);
        this.upgradeModal.classList.remove('active');
        onComplete();
      });

      choicesContainer.appendChild(card);
    });

    this.upgradeModal.classList.add('active');
  }

  public showGameOver(finalScore: number, waveReached: number) {
    const isNewHigh = finalScore >= this.highScore && finalScore > 0;
    const banner = this.gameOverModal.querySelector('#new-high-score-banner') as HTMLElement;
    banner.style.display = isNewHigh ? 'block' : 'none';

    const statsEl = this.gameOverModal.querySelector('#game-over-stats') as HTMLElement;
    statsEl.innerHTML = `
      Final Score: <strong>${finalScore}</strong><br>
      Waves Survived: <strong>${waveReached - 1}</strong><br>
      High Score: <strong>${this.highScore}</strong>
    `;

    this.gameOverModal.classList.add('active');
  }

  public hideGameOver() {
    this.gameOverModal.classList.remove('active');
  }

  public reset() {
    this.score = 0;
    this.currentXp = 0;
    this.xpToNextLevel = 5;
    this.playerLevel = 1;
    this.hideGameOver();
    this.upgradeModal.classList.remove('active');
  }
}
