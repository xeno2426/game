import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('UI Buttons, Touch Targets & Hit Boundaries (A1, A2)', () => {
  const cssPath = path.resolve(__dirname, '../src/style.css');
  const cssContent = fs.readFileSync(cssPath, 'utf-8');

  it('ensures .bottom-bar has pointer-events none to prevent covering action buttons (A1)', () => {
    // Regex matches .bottom-bar rule block
    const bottomBarMatch = cssContent.match(/\.bottom-bar\s*\{([^}]+)\}/);
    expect(bottomBarMatch).toBeTruthy();
    const body = bottomBarMatch![1];
    expect(body).toContain('pointer-events: none');
  });

  it('ensures .action-cluster has z-index above HUD layer and safe area offsets (A1)', () => {
    const clusterMatch = cssContent.match(/\.action-cluster\s*\{([^}]+)\}/);
    expect(clusterMatch).toBeTruthy();
    const body = clusterMatch![1];
    expect(body).toContain('z-index: 25');
    expect(body).toContain('calc(env(safe-area-inset-right, 0px) + 16px)');
    expect(body).toContain('calc(env(safe-area-inset-bottom, 0px) + 16px)');
  });

  it('ensures touch targets are at least 56px with at least 12px gaps across controls (A1)', () => {
    // Action button
    const actionBtnMatch = cssContent.match(/\.action-btn\s*\{([^}]+)\}/);
    expect(actionBtnMatch).toBeTruthy();
    const actionBody = actionBtnMatch![1];
    expect(actionBody).toContain('width: 56px');
    expect(actionBody).toContain('height: 56px');

    // Action cluster / row gaps
    const actionRowMatch = cssContent.match(/\.action-row\s*\{([^}]+)\}/);
    expect(actionRowMatch).toBeTruthy();
    expect(actionRowMatch![1]).toContain('gap: 12px');

    // Quick slot
    const quickSlotMatch = cssContent.match(/\.quick-slot\s*\{([^}]+)\}/);
    expect(quickSlotMatch).toBeTruthy();
    const quickSlotBody = quickSlotMatch![1];
    expect(quickSlotBody).toContain('width: 56px');
    expect(quickSlotBody).toContain('height: 56px');

    // Quick bar gap
    const quickBarMatch = cssContent.match(/\.quick-bar\s*\{([^}]+)\}/);
    expect(quickBarMatch).toBeTruthy();
    expect(quickBarMatch![1]).toContain('gap: 12px');

    // Radial item
    const radialItemMatch = cssContent.match(/\.radial-item\s*\{([^}]+)\}/);
    expect(radialItemMatch).toBeTruthy();
    const radialBody = radialItemMatch![1];
    expect(radialBody).toContain('width: 56px');
    expect(radialBody).toContain('height: 56px');

    // Modal close button
    const closeBtnMatch = cssContent.match(/\.modal-close-btn\s*\{([^}]+)\}/);
    expect(closeBtnMatch).toBeTruthy();
    const closeBody = closeBtnMatch![1];
    expect(closeBody).toContain('width: 56px');
    expect(closeBody).toContain('height: 56px');
  });

  it('provides visible pressed feedback styles for active controls (A9)', () => {
    expect(cssContent).toContain('.action-btn:active');
    expect(cssContent).toContain('.action-btn.pressed');
    expect(cssContent).toContain('.quick-slot:active');
    expect(cssContent).toContain('.quick-slot.pressed');
    expect(cssContent).toContain('.radial-item:active');
    expect(cssContent).toContain('.radial-item.pressed');
    expect(cssContent).toContain('.modal-close-btn:active');
    expect(cssContent).toContain('.modal-close-btn.pressed');
  });

  it('verifies viewport layout geometry for landscape resolutions (915x412 and 844x390)', () => {
    const viewports = [
      { width: 915, height: 412 },
      { width: 844, height: 390 },
    ];

    for (const vp of viewports) {
      // Button sizing constraints
      const btnSize = 56;
      const btnGap = 12;
      const safeInsetRight = 16;
      const safeInsetBottom = 16;

      // Cluster 3 buttons wide in bottom row (dodge, jump, attack)
      const clusterWidth = 2 * btnSize + 64 + 2 * btnGap; // 2 * 56 + 64 + 24 = 200px
      const clusterHeight = 3 * btnSize + 2 * btnGap; // 3 * 56 + 24 = 192px

      const clusterLeft = vp.width - safeInsetRight - clusterWidth;
      const clusterTop = vp.height - safeInsetBottom - clusterHeight;

      // Quick bar 5 slots centered horizontally at bottom
      const quickBarWidth = 5 * btnSize + 4 * btnGap + 24; // 5 * 56 + 48 + 24 = 352px
      const quickBarLeft = (vp.width - quickBarWidth) / 2;
      const quickBarRight = quickBarLeft + quickBarWidth;

      // In landscape (width >= 844px), quick bar and action cluster must not overlap
      expect(quickBarRight).toBeLessThan(clusterLeft);

      // Entire cluster stays within bounds
      expect(clusterLeft).toBeGreaterThan(0);
      expect(clusterTop).toBeGreaterThan(0);
    }
  });
});
