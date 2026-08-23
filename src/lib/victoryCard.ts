/**
 * Victory Card Generator (F5) — draws a shareable 1080×1350 achievement card
 * on an offscreen canvas using the app's own palette + rank badge art, then
 * hands it to the Web Share API (WhatsApp/Telegram in two taps on mobile).
 * Graceful fallback: downloads the PNG when sharing isn't available.
 */
import { RANK_BADGE_IMAGE } from './uiAssets';

export interface VictoryCardData {
  kind: 'level' | 'rank' | 'streak';
  title: string;       // ex. "NIVEAU 12 ATTEINT"
  subtitle: string;    // ex. "Chasseur rang B"
  statLabel: string;   // ex. "Série actuelle"
  statValue: string;   // ex. "17 jours"
  rank: string;        // E..S, Pharaon — selects the badge art
}

const W = 1080;
const H = 1350;

function loadBadge(rank: string): Promise<HTMLImageElement | null> {
  const src = RANK_BADGE_IMAGE[rank as keyof typeof RANK_BADGE_IMAGE];
  if (!src) return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

async function drawCard(data: VictoryCardData): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Background: deep obsidian with a gold radial glow.
  ctx.fillStyle = '#040810';
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, 240, 60, W / 2, 240, 720);
  glow.addColorStop(0, 'rgba(212,168,30,0.22)');
  glow.addColorStop(1, 'rgba(212,168,30,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Double frame.
  ctx.strokeStyle = '#D4A81E';
  ctx.lineWidth = 6;
  roundRect(ctx, 40, 40, W - 80, H - 80, 36);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(212,168,30,0.35)';
  ctx.lineWidth = 2;
  roundRect(ctx, 58, 58, W - 116, H - 116, 28);
  ctx.stroke();

  // Rank badge art.
  const badge = await loadBadge(data.rank);
  if (badge) {
    const size = 300;
    ctx.save();
    roundRect(ctx, W / 2 - size / 2, 150, size, size, 40);
    ctx.clip();
    ctx.drawImage(badge, W / 2 - size / 2, 150, size, size);
    ctx.restore();
  }

  // Texts — Cinzel falls back to serif if not loaded in the canvas context.
  ctx.textAlign = 'center';
  ctx.fillStyle = '#F0EDE5';
  ctx.font = '700 84px Cinzel, Georgia, serif';
  ctx.fillText(data.title.toUpperCase(), W / 2, 600);

  ctx.fillStyle = '#F0C42D';
  ctx.font = '400 44px Cinzel, Georgia, serif';
  ctx.fillText(data.subtitle, W / 2, 680);

  // Stat block.
  ctx.fillStyle = 'rgba(212,168,30,0.12)';
  roundRect(ctx, 190, 790, W - 380, 220, 24);
  ctx.fill();
  ctx.strokeStyle = 'rgba(212,168,30,0.5)';
  ctx.lineWidth = 2;
  roundRect(ctx, 190, 790, W - 380, 220, 24);
  ctx.stroke();

  ctx.fillStyle = '#A8A090';
  ctx.font = '400 30px Inter, system-ui, sans-serif';
  ctx.fillText(data.statLabel.toUpperCase(), W / 2, 870);

  ctx.fillStyle = '#F0EDE5';
  ctx.font = '700 72px Inter, system-ui, sans-serif';
  ctx.fillText(data.statValue, W / 2, 955);

  // Footer branding.
  ctx.fillStyle = '#6B6558';
  ctx.font = '500 26px "JetBrains Mono", monospace';
  ctx.fillText('SYSTÈME — PHARAOH EDITION', W / 2, 1150);

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png', 0.92));
}

/**
 * Draw + share. Returns how the card was delivered (for UI feedback).
 */
export async function shareVictoryCard(data: VictoryCardData): Promise<'shared' | 'downloaded' | 'failed'> {
  try {
    const blob = await drawCard(data);
    if (!blob) return 'failed';
    const file = new File([blob], `victoire-${Date.now()}.png`, { type: 'image/png' });
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };

    if ('share' in nav && nav.canShare?.({ files: [file] })) {
      await (nav as any).share({
        files: [file],
        title: data.title,
        text: `${data.title} — ${data.subtitle}`,
      });
      return 'shared';
    }

    // Fallback: download (desktop / no Web Share).
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
    return 'downloaded';
  } catch {
    return 'failed'; // user cancelled the share sheet counts here too — fine
  }
}
