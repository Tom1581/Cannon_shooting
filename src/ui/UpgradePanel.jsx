import { useSyncExternalStore } from 'react';
import { FIRE_POWER_MAX, FIRE_RATE_TIER_MAX, SQUAD_SIZE_TIERS } from '../game/config.js';

function useWorld(world) {
  const subscribe = (cb) => world.on('hud', cb);
  const getSnapshot = () =>
    `${world.coins}|${world.firePower}|${world.fireRateTier}|${world.sizeTier}`;
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return world;
}

export function UpgradePanel({ world }) {
  useWorld(world);
  const tracks = [
    { kind: 'power', label: 'POWER',  level: world.firePower,           max: FIRE_POWER_MAX },
    { kind: 'rate',  label: 'RATE',   level: world.fireRateTier + 1,    max: FIRE_RATE_TIER_MAX + 1 },
    { kind: 'size',  label: 'SQUAD',  level: world.sizeTier + 1,        max: SQUAD_SIZE_TIERS.length },
  ];

  return (
    <div className="upgrade-panel">
      {tracks.map(t => {
        const cost = world.upgradeCost(t.kind);
        const can = world.canUpgrade(t.kind);
        const maxed = t.kind === 'power'
          ? world.firePower >= FIRE_POWER_MAX
          : t.kind === 'rate'
            ? world.fireRateTier >= FIRE_RATE_TIER_MAX
            : world.sizeTier >= SQUAD_SIZE_TIERS.length - 1;
        return (
          <button
            key={t.kind}
            className={`upgrade-btn ${can ? 'can' : 'cant'} ${maxed ? 'maxed' : ''}`}
            onClick={() => world.upgrade(t.kind)}
            disabled={!can}
          >
            <div className="upg-label">{t.label}</div>
            <div className="upg-lvl">Lv {t.level}/{t.max}</div>
            <div className="upg-cost">{maxed ? 'MAX' : `$${cost}`}</div>
          </button>
        );
      })}
    </div>
  );
}
